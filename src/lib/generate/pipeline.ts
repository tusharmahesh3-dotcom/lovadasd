import { getDb } from "@/db";
import { generations } from "@/db/schema";
import { generateSiteWithGemini } from "@/lib/ai/gemini";
import { composeVariant, validateHtml, VARIANT_PLANS } from "@/lib/generate/assemble";
import { parseQuery } from "@/lib/llm/parse-query";
import { ModelRouter, type ModelPreference } from "@/lib/llm/router";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";
import { DEFAULT_K, retrievePlan } from "@/lib/rag/retrieve";
import type { BrandConstraints, GenerateResponse, GeneratedVariant, QuotaState } from "@/lib/types";

/**
 * GENERATION PIPELINE
 *
 * prompt + brand -> query parsing -> Gemini Pro AI generation
 * -> section retrieval -> assembly into 3 live previewable variants
 * -> validation -> persist to Neon Postgres.
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

  // Step 1: Query understanding
  const parsedQuery = await parseQuery(opts.prompt, opts.brand, router);

  // Step 2: Call Gemini top model (gemini-3.1-pro-preview or gemini-3.8-flash)
  const targetGeminiModel =
    opts.model === "gemini-flash" ? "gemini-3.8-flash" : "gemini-3.1-pro-preview";

  const aiContent = await generateSiteWithGemini(
    opts.prompt,
    {
      primaryColor: opts.brand.primaryColor,
      accentColor: opts.brand.accentColor,
      fontDisplay: opts.brand.fontDisplay,
      logoText: opts.brand.logoText,
    },
    targetGeminiModel,
  );

  // Step 3: Layout retrieval
  const { bySection, trace } = await retrievePlan(parsedQuery, opts.k ?? DEFAULT_K);

  // Step 4: Assemble 3 high-converting variants incorporating Gemini's AI generated content
  const variants: GeneratedVariant[] = VARIANT_PLANS.map((plan) =>
    composeVariant(parsedQuery, bySection, plan, aiContent),
  );

  const validity = variants.map((v) => validateHtml(v.fullDocument));
  const allValid = validity.every((v) => v.valid);
  const modelRoute = router.summary();
  if (aiContent) {
    modelRoute.steps.push({
      task: "ai_website_generation",
      model: targetGeminiModel,
      provider: "google",
      reason: "Generated complete website copy and structure via Google Gemini",
      latencyMs: Date.now() - started,
      costMicroUsd: 12000,
    });
  }
  const latencyMs = Date.now() - started;

  // Persist generation to Neon Postgres
  const db = getDb();
  const storableQuery = { ...parsedQuery, brandConstraints: { redacted: true } };
  let rowId = crypto.randomUUID();

  try {
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
    if (row?.id) rowId = row.id;
  } catch (err) {
    console.warn("[Postgres persist note]:", (err as Error).message);
  }

  return {
    generationId: rowId,
    prompt: opts.prompt,
    parsedQuery,
    variants,
    modelRoute,
    retrievalTrace: trace,
    latencyMs,
    quota: opts.quota,
  };
}
