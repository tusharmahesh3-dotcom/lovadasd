export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { generationId?: string; rating?: number; note?: string };
  if (!body.generationId || !/^[0-9a-f-]{36}$/i.test(body.generationId)) {
    return Response.json({ error: "bad_generation_id" }, { status: 400 });
  }
  const rating = Math.max(1, Math.min(5, Math.round(body.rating ?? 5)));
  return Response.json({ ok: true, rating, note: body.note ?? null });
}
