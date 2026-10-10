import { eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { exportAs } from "@/lib/generate/assemble";
import type { GeneratedVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/generations/:id/export?variant=primary&format=html|react-tailwind|vue|css
 * Exports are NEVER paywalled — the paywall blocks generation only.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const variantId = url.searchParams.get("variant") ?? "primary";
  const format = url.searchParams.get("format") ?? "html";
  const download = url.searchParams.get("download") === "1";

  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "bad_id" }, { status: 400 });
  const [row] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });

  const variants = (row.variants ?? []) as GeneratedVariant[];
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!variant) return Response.json({ error: "variant_not_found" }, { status: 404 });

  const file = exportAs(variant, format);
  if (!download) return Response.json({ ...file, variantId: variant.id, format });

  return new Response(file.content, {
    headers: {
      "content-type": `${file.mime}; charset=utf-8`,
      "content-disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
