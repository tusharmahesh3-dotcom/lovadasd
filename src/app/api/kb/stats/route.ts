import { sql } from "drizzle-orm";
import { db } from "@/db";
import { feedback, generations, kbPages, kbSections } from "@/db/schema";
import { embeddingProviderInfo } from "@/lib/rag/embeddings";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";
import { getVectorStore } from "@/lib/rag/vector-store";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureKnowledgeBase();
  const [pages] = await db.select({ n: sql<number>`count(*)::int` }).from(kbPages);
  const [sections] = await db.select({ n: sql<number>`count(*)::int` }).from(kbSections);
  const byType = await db
    .select({ sectionType: kbSections.sectionType, n: sql<number>`count(*)::int` })
    .from(kbSections)
    .groupBy(kbSections.sectionType);
  const byIndustry = await db
    .select({ industry: kbSections.industry, n: sql<number>`count(*)::int` })
    .from(kbSections)
    .groupBy(kbSections.industry);
  const [gen] = await db
    .select({
      total: sql<number>`count(*)::int`,
      p50: sql<number>`coalesce(percentile_cont(0.5) within group (order by latency_ms),0)::int`,
      p95: sql<number>`coalesce(percentile_cont(0.95) within group (order by latency_ms),0)::int`,
      validRate: sql<number>`coalesce(avg(case when valid_html then 1.0 else 0.0 end),1)::float`,
      avgCost: sql<number>`coalesce(avg(cost_micro_usd),0)::float`,
    })
    .from(generations);
  const [fb] = await db
    .select({ avg: sql<number>`coalesce(avg(rating),0)::float`, n: sql<number>`count(*)::int` })
    .from(feedback);

  return Response.json({
    knowledgeBase: {
      pages: pages?.n ?? 0,
      sections: sections?.n ?? 0,
      bySectionType: byType,
      byIndustry,
      chunkingStrategy: "section-level semantic chunking (1 chunk = 1 modular section)",
    },
    vectorStore: { backend: getVectorStore().backend, ...embeddingProviderInfo() },
    metrics: {
      generations: gen?.total ?? 0,
      timeToFirstPreviewP50Ms: gen?.p50 ?? 0,
      timeToFirstPreviewP95Ms: gen?.p95 ?? 0,
      validHtmlRate: +(gen?.validRate ?? 1).toFixed(4),
      avgCostUsd: +(((gen?.avgCost ?? 0) / 1_000_000) as number).toFixed(4),
      avgUserRating: +(fb?.avg ?? 0).toFixed(2),
      ratings: fb?.n ?? 0,
    },
  });
}
