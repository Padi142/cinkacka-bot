import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const debtors = sqliteTable("debtors", {
    id: int().primaryKey({ autoIncrement: true }),
    debtor_name: text().notNull(),
    amount_owed: int().notNull(),
    payed: int({ mode: 'boolean' }).notNull().default(false),
    currency: text().notNull().default('CZK'),
    reason: text().default(''),
    date: text().default(sql`(CURRENT_DATE)`),
});
