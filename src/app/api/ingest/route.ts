import { ingestAll } from "@/lib/rag/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/ingest?force=1 — runs the ingestion pipeline:
 * decompose -> transform -> embed (text + visual) -> sparse stats -> upsert.
 */
export async function POST(req: Request) {
  const force = new URL(req.url).searchParams.get("force") === "1";
  const token = process.env.INGEST_TOKEN;
  if (token && req.headers.get("x-ingest-token") !== token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const report = await ingestAll(force);
    return Response.json({ ok: true, report });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
