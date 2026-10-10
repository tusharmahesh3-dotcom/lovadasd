import { parseQuery } from "@/lib/llm/parse-query";
import { ModelRouter } from "@/lib/llm/router";
import type { BrandConstraints } from "@/lib/types";

export const dynamic = "force-dynamic";

/** POST /api/parse — { prompt, brand? } -> StructuredQuery (no quota cost). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string; brand?: BrandConstraints };
    const prompt = (body.prompt ?? "").trim();
    if (prompt.length < 8) {
      return Response.json({ error: "prompt_too_short", minLength: 8 }, { status: 400 });
    }
    const router = new ModelRouter();
    const parsedQuery = await parseQuery(prompt, body.brand ?? {}, router);
    return Response.json({ parsedQuery, modelRoute: router.summary() });
  } catch (err) {
    return Response.json({ error: "parse_failed", detail: (err as Error).message }, { status: 500 });
  }
}
