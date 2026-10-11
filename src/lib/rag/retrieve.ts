import type { KbSection } from "@/lib/rag/vector-store";
import { cosine, localTextEmbedding, localVisualEmbedding, tokenize } from "@/lib/rag/embeddings";
import { getVectorStore, type SectionFilter } from "@/lib/rag/vector-store";
import type {
  RetrievalTraceEntry,
  RetrievedSection,
  SectionType,
  StructuredQuery,
} from "@/lib/types";

/**
 * ---------------------------------------------------------------------------
 * RETRIEVAL PIPELINE (§3)
 * ---------------------------------------------------------------------------
 *  1. Metadata pre-filter      (industry, section_type, tone)
 *  2. Hybrid search            BM25 (sparse) + dense cosine, RRF-weighted
 *  3. Cross-encoder rerank     feature-based reranker (Cohere Rerank v3 slot)
 *  4. Top-K per section type   (default K = 5)
 */

export const DEFAULT_K = 5;

const BM25_K1 = 1.4;
const BM25_B = 0.75;

function bm25(queryTerms: string[], doc: KbSection, avgLen: number, docFreq: Map<string, number>, N: number) {
  const tf = doc.termFrequencies ?? {};
  const len = doc.tokenCount || 1;
  let score = 0;
  for (const term of queryTerms) {
    const f = tf[term];
    if (!f) continue;
    const df = docFreq.get(term) ?? 1;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    score += idf * ((f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + BM25_B * (len / avgLen))));
  }
  return score;
}

function normalise(values: number[]): number[] {
  const max = Math.max(...values, 0.000001);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return values.map((v) => (v - min) / span);
}

/**
 * Cross-encoder rerank stage. In production this is Cohere Rerank v3 /
 * BGE-reranker-v2 over (query, section-description) pairs. Locally we use an
 * interpretable feature-based scorer with the same contract.
 */
function crossEncoderScore(query: StructuredQuery, doc: KbSection, hybrid: number): number {
  let score = hybrid * 0.55;
  const tone = query.brandConstraints.toneOverride ?? query.tone;
  if (doc.tone === tone) score += 0.18;
  if (doc.industry === query.industry) score += 0.14;
  else if (doc.industry === "generic") score += 0.05;
  if (doc.conversionPattern === query.conversionPattern) score += 0.1;
  score += (doc.qualityScore - 0.8) * 0.5;

  const kw = new Set(query.keywords.map((k) => k.toLowerCase()));
  const tagHits = (doc.tags ?? []).filter((t) => kw.has(t.toLowerCase())).length;
  score += Math.min(0.12, tagHits * 0.04);

  if (query.pageType === "waitlist" && doc.complexity === "high") score -= 0.05;
  return score;
}

export interface RetrievalOptions {
  k?: number;
  /** Relaxes tone/industry filters when the strict filter starves. */
  adaptive?: boolean;
}

export async function retrieveForSectionType(
  query: StructuredQuery,
  sectionType: SectionType,
  options: RetrievalOptions = {},
): Promise<{ results: RetrievedSection[]; trace: RetrievalTraceEntry }> {
  const k = options.k ?? DEFAULT_K;
  const store = getVectorStore();
  const tone = query.brandConstraints.toneOverride ?? query.tone;

  // --- 1. metadata pre-filter, progressively relaxed -----------------------
  const filterLadder: SectionFilter[] = [
    { sectionType, industry: query.industry, tone },
    { sectionType, industry: query.industry },
    { sectionType, tone },
    { sectionType },
  ];

  let candidates: KbSection[] = [];
  let usedFilter: SectionFilter = { sectionType };
  for (const filter of filterLadder) {
    candidates = await store.prefilter(filter);
    usedFilter = filter;
    if (candidates.length >= Math.min(k, 3)) break;
  }
  if (!candidates.length) {
    candidates = await store.prefilter({ sectionType });
    usedFilter = { sectionType };
  }

  // --- 2. hybrid search ----------------------------------------------------
  const queryText = [
    query.valueProp,
    query.audience,
    query.pageType,
    tone,
    query.industry,
    query.conversionPattern,
    query.keywords.join(" "),
    sectionType,
  ].join(" ");
  const qTerms = tokenize(queryText);
  const denseQuery = localTextEmbedding(queryText);
  const visualQuery = localVisualEmbedding(
    `<div class="${tone} ${sectionType}"></div>`,
    `display:${query.tone === "minimal" ? "flex" : "grid"};border-radius:1rem;`,
    [query.brandConstraints.primaryColor ?? "#4f46e5"],
  );

  const N = candidates.length || 1;
  const docFreq = new Map<string, number>();
  for (const doc of candidates) {
    for (const term of new Set(Object.keys(doc.termFrequencies ?? {}))) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }
  const avgLen = candidates.reduce((a, d) => a + (d.tokenCount || 1), 0) / N;

  const sparseRaw = candidates.map((d) => bm25(qTerms, d, avgLen, docFreq, N));
  const denseRaw = candidates.map(
    (d) => cosine(denseQuery, d.textEmbedding ?? []) * 0.78 + cosine(visualQuery, d.visualEmbedding ?? []) * 0.22,
  );
  const sparse = normalise(sparseRaw);
  const dense = normalise(denseRaw);

  const scored = candidates.map((doc, i) => {
    const hybrid = dense[i] * 0.62 + sparse[i] * 0.38;
    const rerank = crossEncoderScore(query, doc, hybrid);
    return { doc, dense: dense[i], sparse: sparse[i], hybrid, rerank };
  });

  // --- 3/4. rerank + top-K with MMR-style layout diversity -----------------
  scored.sort((a, b) => b.rerank - a.rerank);
  const picked: typeof scored = [];
  const seenLayouts = new Set<string>();
  for (const cand of scored) {
    const penalty = seenLayouts.has(cand.doc.layoutType) ? 0.06 : 0;
    cand.rerank -= penalty;
    seenLayouts.add(cand.doc.layoutType);
    picked.push(cand);
    if (picked.length >= k) break;
  }
  picked.sort((a, b) => b.rerank - a.rerank);

  const results: RetrievedSection[] = picked.map((c) => ({
    id: c.doc.id,
    externalId: c.doc.externalId,
    sectionType: c.doc.sectionType as SectionType,
    layoutType: c.doc.layoutType,
    tone: c.doc.tone,
    industry: c.doc.industry,
    conversionPattern: c.doc.conversionPattern,
    complexity: c.doc.complexity,
    colorPalette: c.doc.colorPalette ?? [],
    html: c.doc.html,
    css: c.doc.css,
    copyText: c.doc.copyText,
    screenshotUrl: c.doc.screenshotUrl,
    scores: {
      dense: +c.dense.toFixed(4),
      sparse: +c.sparse.toFixed(4),
      hybrid: +c.hybrid.toFixed(4),
      rerank: +c.rerank.toFixed(4),
      final: +c.rerank.toFixed(4),
    },
  }));

  return {
    results,
    trace: {
      sectionType,
      candidates: candidates.length,
      prefilter: {
        sectionType: usedFilter.sectionType,
        industry: usedFilter.industry,
        tone: usedFilter.tone,
      },
      topK: results.map((r) => ({
        externalId: r.externalId,
        hybrid: r.scores.hybrid,
        rerank: r.scores.rerank,
        final: r.scores.final,
      })),
    },
  };
}

export async function retrievePlan(
  query: StructuredQuery,
  k = DEFAULT_K,
): Promise<{ bySection: Map<SectionType, RetrievedSection[]>; trace: RetrievalTraceEntry[] }> {
  const bySection = new Map<SectionType, RetrievedSection[]>();
  const trace: RetrievalTraceEntry[] = [];
  const batches = await Promise.all(
    query.requiredSections.map((s) => retrieveForSectionType(query, s, { k })),
  );
  query.requiredSections.forEach((sectionType, i) => {
    bySection.set(sectionType, batches[i].results);
    trace.push(batches[i].trace);
  });
  return { bySection, trace };
}
