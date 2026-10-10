import { sql } from "drizzle-orm";
import { db } from "@/db";
import { kbPages, kbSections } from "@/db/schema";
import { SEED_SECTIONS, type SeedSection } from "@/lib/kb/sections";
import {
  embeddingProviderInfo,
  localTextEmbedding,
  localVisualEmbedding,
  termFrequencies,
} from "@/lib/rag/embeddings";

/**
 * ---------------------------------------------------------------------------
 * DELIVERABLE 4 — INGESTION PIPELINE
 * ---------------------------------------------------------------------------
 *   source page -> section decomposition -> transform -> embed (text+visual)
 *   -> sparse term stats -> upsert into vector store
 *
 * Chunking: section-level semantic chunking. 1 chunk = 1 modular section.
 */

export interface IngestReport {
  pages: number;
  sections: number;
  skipped: number;
  textModel: string;
  visualModel: string;
  durationMs: number;
}

/** Builds the dense + sparse payload for one modular section. */
export function buildSectionPayload(section: SeedSection) {
  const info = embeddingProviderInfo();
  const textCorpus = [
    section.copyText,
    section.sectionType,
    section.industry,
    section.tone,
    section.layoutType,
    section.conversionPattern,
    section.tags.join(" "),
  ].join(" \n ");

  const { tf, tokens } = termFrequencies(textCorpus);

  return {
    externalId: section.externalId,
    html: section.html,
    css: section.css,
    copyText: section.copyText,
    screenshotUrl: `/api/kb/screenshot/${section.externalId}`,
    sectionType: section.sectionType,
    industry: section.industry,
    layoutType: section.layoutType,
    tone: section.tone,
    colorPalette: section.colorPalette,
    conversionPattern: section.conversionPattern,
    complexity: section.complexity,
    tags: section.tags,
    textEmbedding: localTextEmbedding(textCorpus),
    visualEmbedding: localVisualEmbedding(section.html, section.css, section.colorPalette),
    embeddingModelText: info.textModel,
    embeddingModelVisual: info.visualModel,
    termFrequencies: tf,
    tokenCount: tokens,
    qualityScore: section.quality,
  };
}

export async function ingestAll(force = false): Promise<IngestReport> {
  const started = Date.now();
  const info = embeddingProviderInfo();

  if (force) {
    await db.delete(kbSections);
    await db.delete(kbPages);
  }

  const pageIds = new Map<string, string>();
  const uniquePages = new Map<string, SeedSection>();
  for (const s of SEED_SECTIONS) if (!uniquePages.has(s.pageSlug)) uniquePages.set(s.pageSlug, s);

  for (const [slug, s] of uniquePages) {
    const [row] = await db
      .insert(kbPages)
      .values({
        slug,
        title: s.pageTitle,
        sourceType: "original",
        licenseRef: "internal-original-pattern",
        industry: s.industry,
        tone: s.tone,
      })
      .onConflictDoUpdate({ target: kbPages.slug, set: { title: s.pageTitle } })
      .returning({ id: kbPages.id });
    if (row) pageIds.set(slug, row.id);
  }

  let sections = 0;
  let skipped = 0;
  for (const section of SEED_SECTIONS) {
    const payload = buildSectionPayload(section);
    try {
      await db
        .insert(kbSections)
        .values({ ...payload, pageId: pageIds.get(section.pageSlug) })
        .onConflictDoUpdate({
          target: kbSections.externalId,
          set: {
            html: payload.html,
            css: payload.css,
            copyText: payload.copyText,
            textEmbedding: payload.textEmbedding,
            visualEmbedding: payload.visualEmbedding,
            termFrequencies: payload.termFrequencies,
            tokenCount: payload.tokenCount,
            tags: payload.tags,
            qualityScore: payload.qualityScore,
          },
        });
      sections++;
    } catch {
      skipped++;
    }
  }

  return {
    pages: uniquePages.size,
    sections,
    skipped,
    textModel: info.textModel,
    visualModel: info.visualModel,
    durationMs: Date.now() - started,
  };
}

let seedPromise: Promise<void> | null = null;

/** Idempotent lazy bootstrap so the KB is always warm on first request. */
export async function ensureKnowledgeBase(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(kbSections);
    if ((row?.n ?? 0) < SEED_SECTIONS.length) await ingestAll(false);
  })().catch(() => {
    seedPromise = null;
  });
  return seedPromise;
}
