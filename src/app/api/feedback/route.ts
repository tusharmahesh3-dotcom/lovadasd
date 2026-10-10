import { sql } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { generationId?: string; rating?: number; note?: string };
  if (!body.generationId || !/^[0-9a-f-]{36}$/i.test(body.generationId)) {
    return Response.json({ error: "bad_generation_id" }, { status: 400 });
  }
  const rating = Math.max(1, Math.min(5, Math.round(body.rating ?? 0)));
  await db.insert(feedback).values({ generationId: body.generationId, rating, note: body.note ?? null });
  const [agg] = await db
    .select({ avg: sql<number>`coalesce(avg(rating),0)::float`, n: sql<number>`count(*)::int` })
    .from(feedback);
  return Response.json({ ok: true, averageRating: +(agg?.avg ?? 0).toFixed(2), responses: agg?.n ?? 0 });
}
