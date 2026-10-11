import { runGeneration } from "@/lib/generate/pipeline";
import { consumeGeneration, getOrCreateSession, resolveSessionId, toQuota } from "@/lib/session";
import type { BrandConstraints } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/generate
 * body: { prompt: string, brand?: BrandConstraints, k?: number }
 * 402  -> paywall (3rd generation onwards on the free tier)
 */
const MODELS = ["auto", "gemini-pro", "gemini-flash"] as const;

export async function POST(req: Request) {
  const sessionId = resolveSessionId(req);
  try {
    const body = (await req.json()) as {
      prompt?: string;
      brand?: BrandConstraints;
      k?: number;
      model?: (typeof MODELS)[number];
    };
    const prompt = (body.prompt ?? "").trim();
    if (prompt.length < 8) {
      return Response.json({ error: "prompt_too_short", minLength: 8 }, { status: 400 });
    }

    await getOrCreateSession(sessionId);
    const gate = await consumeGeneration(sessionId);
    if (!gate.allowed) {
      return Response.json(
        {
          error: "payment_required",
          message: "Free tier includes 2 generations. Add credits to keep generating — exports stay free.",
          quota: gate.quota,
          sessionId,
        },
        { status: 402 },
      );
    }

    const result = await runGeneration({
      sessionId,
      prompt,
      brand: body.brand ?? {},
      quota: gate.quota,
      k: body.k,
      model: (MODELS as readonly string[]).includes(body.model ?? "") ? body.model : "auto",
    });

    const res = Response.json({ ...result, sessionId });
    res.headers.append("set-cookie", `lf_sid=${sessionId}; Path=/; Max-Age=2592000; SameSite=Lax`);
    return res;
  } catch (err) {
    const row = await getOrCreateSession(sessionId).catch(() => null);
    return Response.json(
      {
        error: "generation_failed",
        detail: (err as Error).message,
        quota: row ? toQuota(row) : null,
      },
      { status: 500 },
    );
  }
}
