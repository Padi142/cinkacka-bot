import { tool } from "ai";
import z from "zod";
import { db } from "./db/client";
import { debtors } from "./db/schema";
import { eq } from "drizzle-orm";
import { crudPolicy } from "drizzle-orm/neon";

const getAddDebtors = tool({
    description: "Get all debtors",
    inputSchema: z.object({}),
    execute: async ({ }) => {
        console.log('Running getAddDebtors tool')
        const entries = await db.query.debtors.findMany();
        return entries;
    }
});

const addDebtor = tool({
    description: "Add a new debtor",
    inputSchema: z.object({
        debtor_name: z.string().min(1),
        amount_owed: z.number().int().min(0),
        currency: z.string().default('CZK'),
        reason: z.string().optional(),
    }),
    execute: async ({ debtor_name, amount_owed, currency, reason }) => {
        console.log('Running addDebtor tool with input:', { debtor_name, amount_owed, currency, reason });
        try {
            const newDebtor = await db.insert(debtors).values({
                debtor_name: debtor_name,
                amount_owed: amount_owed,
                currency: currency,
                reason: reason,
                payed: false,
            }).returning();
            return newDebtor;
        } catch (error) {
            console.error('Error inserting new debtor:', error);
            throw error;
        }
    }
});

const markDebtorAsPaid = tool({
    description: "Mark a debtor as paid",
    inputSchema: z.object({
        id: z.number().int().min(1),
    }),
    execute: async ({ id }) => {
        console.log('Running markDebtorAsPaid tool with input:', { id });
        const updatedDebtor = await db.update(debtors)
            .set({ payed: true })
            .where(eq(debtors.id, id))
            .returning();
        return updatedDebtor;
    }
});

const updateDebtor = tool({
    description: "Update debtor information",
    inputSchema: z.object({
        id: z.number().int().min(1),
        debtor_name: z.string().min(1).optional(),
        amount_owed: z.number().int().min(0).optional(),
        currency: z.string().optional(),
        reason: z.string().optional(),
        payed: z.boolean().optional(),
    }),
    execute: async ({ id, debtor_name, amount_owed, currency, reason, payed }) => {
        console.log('Running updateDebtor tool with input:', { id, debtor_name, amount_owed, currency, reason, payed });
        const updateData: any = {};
        if (debtor_name !== undefined) updateData.debtor_name = debtor_name;
        if (amount_owed !== undefined) updateData.amount_owed = amount_owed;
        if (currency !== undefined) updateData.currency = currency;
        if (reason !== undefined) updateData.reason = reason;
        if (payed !== undefined) updateData.payed = payed;

        const updatedDebtor = await db.update(debtors)
            .set(updateData)
            .where(eq(debtors.id, id))
            .returning();
        return updatedDebtor;
    }
});

export const debtorTools = {
    getAddDebtors,
    addDebtor,
    markDebtorAsPaid,
    updateDebtor,
};