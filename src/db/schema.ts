import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  real,
  uuid,
  index,
} from "drizzle-orm/pg-core";

/**
 * ---------------------------------------------------------------------------
 * DELIVERABLE 2 — DATA SCHEMA FOR THE RAG KNOWLEDGE BASE
 * ---------------------------------------------------------------------------
 * The knowledge base is modelled as: source page -> modular sections (chunks).
 * 1 chunk == 1 modular section (hero / features / pricing / ...). Never
 * token-based chunking: that destroys layout integrity.
 *
 * Vector payloads are stored here in the canonical store (Postgres). The
 * VectorStore adapter (src/lib/rag/vector-store.ts) mirrors the exact same
 * payload shape used by Qdrant collections `sections_text` + `sections_visual`
 * so the stack can be switched with one env var.
 */

/** Licensed / opted-in source pages. No arbitrary scraping. */
export const kbPages = pgTable("kb_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull().default("licensed"), // licensed | opted_in | original
  licenseRef: text("license_ref").notNull().default("internal-original"),
  industry: text("industry").notNull(),
  tone: text("tone").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One row == one modular section == one RAG chunk. */
export const kbSections = pgTable(
  "kb_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id").references(() => kbPages.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull().unique(),

    // --- structure (transformed, never verbatim copies) ---
    html: text("html").notNull(),
    css: text("css").notNull(),
    copyText: text("copy_text").notNull(),
    screenshotUrl: text("screenshot_url"),

    // --- metadata (used for Qdrant-style pre-filtering) ---
    sectionType: text("section_type").notNull(), // hero|features|social_proof|pricing|faq|cta|footer|nav
    industry: text("industry").notNull(),
    layoutType: text("layout_type").notNull(),
    tone: text("tone").notNull(),
    colorPalette: jsonb("color_palette").$type<string[]>().notNull().default([]),
    conversionPattern: text("conversion_pattern").notNull(),
    complexity: text("complexity").notNull().default("medium"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    // --- embeddings (parallel collections) ---
    textEmbedding: jsonb("text_embedding").$type<number[]>().notNull().default([]),
    visualEmbedding: jsonb("visual_embedding").$type<number[]>().notNull().default([]),
    embeddingModelText: text("embedding_model_text").notNull().default("hashed-lexical-v1"),
    embeddingModelVisual: text("embedding_model_visual").notNull().default("siglip-proxy-v1"),

    // --- sparse / BM25 support ---
    termFrequencies: jsonb("term_frequencies").$type<Record<string, number>>().notNull().default({}),
    tokenCount: integer("token_count").notNull().default(0),

    qualityScore: real("quality_score").notNull().default(0.8),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("kb_sections_type_idx").on(t.sectionType),
    index("kb_sections_industry_idx").on(t.industry),
    index("kb_sections_tone_idx").on(t.tone),
  ],
);

/** Anonymous or authed session. Brand inputs are NEVER persisted here. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull().default("free"), // free | credits | pro
  generationsUsed: integer("generations_used").notNull().default(0),
  credits: integer("credits").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

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

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  generationId: uuid("generation_id").notNull(),
  rating: integer("rating").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  generationId: uuid("generation_id").notNull(),
  variantId: text("variant_id").notNull(),
  provider: text("provider").notNull(), // netlify | vercel
  url: text("url").notNull(),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const billingEvents = pgTable("billing_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type KbSection = typeof kbSections.$inferSelect;
export type NewKbSection = typeof kbSections.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
