import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uuid,
  index,
} from "drizzle-orm/pg-core";

/**
 * Simplified schema for AI website generator.
 * Stores generated site records and user session usage in Neon Postgres.
 */

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    prompt: text("prompt").notNull(),
    parsedQuery: jsonb("parsed_query").$type<Record<string, unknown>>().notNull(),
    variants: jsonb("variants").$type<unknown[]>().notNull(),
    modelRoute: jsonb("model_route").$type<Record<string, unknown>>().notNull(),
    retrievalTrace: jsonb("retrieval_trace").$type<unknown[]>().notNull().default([]),
    status: text("status").notNull().default("succeeded"),
    latencyMs: integer("latency_ms").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd").notNull().default(0),
    validHtml: boolean("valid_html").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("generations_session_idx").on(t.sessionId)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull().default("pro"),
  generationsUsed: integer("generations_used").notNull().default(0),
  credits: integer("credits").notNull().default(999),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
