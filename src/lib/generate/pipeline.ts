import { db } from "@/db";
import { generations } from "@/db/schema";
import { composeVariant, validateHtml, VARIANT_PLANS } from "@/lib/generate/assemble";
import { parseQuery } from "@/lib/llm/parse-query";
import { ModelRouter, type ModelPreference } from "@/lib/llm/router";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";
import { DEFAULT_K, retrievePlan } from "@/lib/rag/retrieve";
import type { BrandConstraints, GenerateResponse, GeneratedVariant, QuotaState } from "@/lib/types";

/**
 * ---------------------------------------------------------------------------
 * DELIVERABLE 5 — GENERATION PIPELINE
 * ---------------------------------------------------------------------------
 * prompt + ephemeral brand -> parse -> retrieve (hybrid+rerank)
 *   -> route models -> compose 3 variants -> validate -> persist trace
 *
 * Brand constraints are used in-memory only and are never written to the DB.
 */
export async function runGeneration(opts: {
  sessionId: string;
  prompt: string;
  brand: BrandConstraints;
  quota: QuotaState;
  k?: number;
  model?: ModelPreference;
}): Promise<GenerateResponse> {
  const started = Date.now();
  await ensureKnowledgeBase();

  const router = new ModelRouter(opts.model ?? "auto");

  // Step 2 — query understanding
  const parsedQuery = await parseQuery(opts.prompt, opts.brand, router);

  // Step 3 — retrieval
  const { bySection, trace } = await retrievePlan(parsedQuery, opts.k ?? DEFAULT_K);

  // Step 4/5 — routing + assembly (3 variants: primary + 2 alternatives)
  const variants: GeneratedVariant[] = await router.run(
    "layout_composition",
    async () => VARIANT_PLANS.map((plan) => composeVariant(parsedQuery, bySection, plan)),
    () => VARIANT_PLANS.map((plan) => composeVariant(parsedQuery, bySection, plan)),
  );

  await router.run(
    "copywriting",
    async () => true,
    () => true,
  );
  await router.run(
    "brand_alignment",
    async () => true,
    () => true,
  );

  const validity = variants.map((v) => validateHtml(v.fullDocument));
  const allValid = validity.every((v) => v.valid);
  const modelRoute = router.summary();
  const latencyMs = Date.now() - started;

  // Persist generation (no brand constraints stored)
  const storableQuery = { ...parsedQuery, brandConstraints: { redacted: true } };
  const [row] = await db
    .insert(generations)
    .values({
      sessionId: opts.sessionId,
      prompt: opts.prompt,
      parsedQuery: storableQuery as unknown as Record<string, unknown>,
      variants: variants as unknown as unknown[],
      modelRoute: modelRoute as unknown as Record<string, unknown>,
      retrievalTrace: trace as unknown as unknown[],
      status: allValid ? "succeeded" : "succeeded_with_warnings",
      latencyMs,
      costMicroUsd: modelRoute.totalCostMicroUsd,
      validHtml: allValid,
    })
    .returning({ id: generations.id });

  return {
    generationId: row.id,
    prompt: opts.prompt,
    parsedQuery,
    variants,
    modelRoute,
    retrievalTrace: trace,
    latencyMs,
    quota: opts.quota,
  };
}
