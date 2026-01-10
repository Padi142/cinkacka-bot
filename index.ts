import { mistral } from "@ai-sdk/mistral";
import { generateText, stepCountIs } from "ai";
import { Bot } from "gramio";

const systemPrompt = `You are a personal assistant called Michal. You are a rat`;

async function generateResponse(message: string): Promise<String> {
    const result = await generateText({
        model: mistral("mistral-large-latest"),
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
        // tools: calendarTools,
        stopWhen: stepCountIs(10),
    });

    return result.text;
}

const bot = new Bot(Bun.env.BOT_TOKEN!)
    .command("start", async (context) => {


        context.send("Hello!")
    }).on("message", async (context) => {
        console.log("Received message:", context.text);
        const userMessage = context.text || "";
        await context.sendChatAction("typing");
        const botResponse = await generateResponse(userMessage);
        context.send(botResponse);
    })
    .onStart(({ info }) => console.log(`✨ Bot ${info.username} was started!`));

bot.start();
