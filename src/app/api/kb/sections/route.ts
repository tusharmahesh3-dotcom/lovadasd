import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { kbSections } from "@/db/schema";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";

export const dynamic = "force-dynamic";

/** GET /api/kb/sections?sectionType=&industry=&tone= */
export async function GET(req: Request) {
  await ensureKnowledgeBase();
  const p = new URL(req.url).searchParams;
  const clauses = [];
  const sectionType = p.get("sectionType");
  const industry = p.get("industry");
  const tone = p.get("tone");
  if (sectionType) clauses.push(eq(kbSections.sectionType, sectionType));
  if (industry) clauses.push(eq(kbSections.industry, industry));
  if (tone) clauses.push(eq(kbSections.tone, tone));

  const rows = await db
    .select({
      externalId: kbSections.externalId,
      sectionType: kbSections.sectionType,
      industry: kbSections.industry,
      layoutType: kbSections.layoutType,
      tone: kbSections.tone,
      conversionPattern: kbSections.conversionPattern,
      complexity: kbSections.complexity,
      colorPalette: kbSections.colorPalette,
      tags: kbSections.tags,
      copyText: kbSections.copyText,
      qualityScore: kbSections.qualityScore,
      tokenCount: kbSections.tokenCount,
      embeddingModelText: kbSections.embeddingModelText,
      embeddingDims: sql<number>`jsonb_array_length(${kbSections.textEmbedding})`,
    })
    .from(kbSections)
    .where(clauses.length ? and(...clauses) : undefined)
    .limit(200);

  return Response.json({ count: rows.length, sections: rows });
}
