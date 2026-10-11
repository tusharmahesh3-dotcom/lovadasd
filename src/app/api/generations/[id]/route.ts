import { eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "bad_id" }, { status: 400 });
  const [row] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(row);
}
