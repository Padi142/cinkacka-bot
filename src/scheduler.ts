import { Cron } from "croner";
import { db } from "./db/client";
import { scheduledMessages } from "./db/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendTelegramMessageToOwner } from "./main_bot";
import { sendTelegramMessageToChat } from "./guest_bot";

// In-memory map to track active scheduled jobs
const activeJobs: Map<number, Cron> = new Map();

/**
 * Schedule a message to be sent at a specific time.
 * Returns the created scheduled message record.
 */
export async function scheduleMessage(
    chatId: number,
    message: string,
    scheduledFor: Date
): Promise<{ id: number; chatId: number; message: string; scheduledFor: string }> {
    const isoTime = scheduledFor.toISOString();

    // Insert into database
    const result = await db.insert(scheduledMessages).values({
        chatId,
        message,
        scheduledFor: isoTime,
        sent: false,
    }).returning();

    const record = result[0]!;

    console.log(`Scheduled message id=${record.id} for ${isoTime}`);

    // Schedule the cron job
    scheduleJob(record.id, chatId, message, scheduledFor);

    return {
        id: record.id,
        chatId: record.chatId,
        message: record.message,
        scheduledFor: isoTime,
    };
}

/**
 * Cancel a scheduled message by id.
 */
export async function cancelScheduledMessage(id: number): Promise<boolean> {
    const job = activeJobs.get(id);
    if (job) {
        job.stop();
        activeJobs.delete(id);
    }

    const [deleted] = await db.delete(scheduledMessages)
        .where(eq(scheduledMessages.id, id))
        .returning();

    return !!deleted;
}

/**
 * Get all pending (unsent) scheduled messages.
 */
export async function getPendingScheduledMessages() {
    return db.select().from(scheduledMessages)
        .where(eq(scheduledMessages.sent, false));
}

/**
 * Create a cron job for a scheduled message.
 */
function scheduleJob(id: number, chatId: number, message: string, fireAt: Date) {
    // Don't schedule if already in the past
    if (fireAt <= new Date()) {
        console.log(`Scheduled message id=${id} is in the past, sending immediately`);
        sendScheduledMessage(id, chatId, message);
        return;
    }

    const job = new Cron(fireAt, async () => {
        await sendScheduledMessage(id, chatId, message);
    });

    activeJobs.set(id, job);
    console.log(`Created cron job for message id=${id}, fires at ${fireAt.toISOString()}`);
}

/**
 * Send a scheduled message and mark it as sent.
 */
async function sendScheduledMessage(id: number, chatId: number, message: string) {
    try {
        const ownerChatId = parseInt(Bun.env.OWNER_CHAT_ID || "0", 10);

        if (chatId === ownerChatId) {
            await sendTelegramMessageToOwner(`⏰ Reminder: ${message}`);
        } else {
            await sendTelegramMessageToChat(chatId, `⏰ Reminder: ${message}`);
        }

        // Mark as sent in database
        await db.update(scheduledMessages)
            .set({ sent: true })
            .where(eq(scheduledMessages.id, id));

        // Remove from active jobs
        activeJobs.delete(id);

        console.log(`Sent scheduled message id=${id} to chatId=${chatId}`);
    } catch (error) {
        console.error(`Error sending scheduled message id=${id}:`, error);
    }
}

/**
 * Initialize the scheduler by loading all pending messages from the database
 * and scheduling them. Call this on bot startup.
 */
export async function initializeScheduler() {
    console.log("Initializing scheduler...");

    const pendingMessages = await getPendingScheduledMessages();
    console.log(`Found ${pendingMessages.length} pending scheduled messages`);

    for (const msg of pendingMessages) {
        const fireAt = new Date(msg.scheduledFor);
        scheduleJob(msg.id, msg.chatId, msg.message, fireAt);
    }

    console.log("Scheduler initialized");
}
