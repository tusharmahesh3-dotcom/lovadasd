import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { generations } from "@/db/schema";
import { exportAs } from "@/lib/generate/assemble";
import type { GeneratedVariant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/deploy — Demo deployment handler.
 * Generates preview deployment URL without requiring external Netlify or Vercel tokens.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    generationId?: string;
    variantId?: string;
    provider?: "netlify" | "vercel";
  };
  const provider = body.provider === "vercel" ? "vercel" : "netlify";

  if (!body.generationId) return Response.json({ error: "missing_generation_id" }, { status: 400 });

  const db = getDb();
  const [gen] = await db.select().from(generations).where(eq(generations.id, body.generationId)).limit(1);
  if (!gen) return Response.json({ error: "not_found" }, { status: 404 });

  const variants = (gen.variants ?? []) as GeneratedVariant[];
  const variant = variants.find((v) => v.id === body.variantId) ?? variants[0];
  if (!variant) return Response.json({ error: "variant_not_found" }, { status: 404 });

  const file = exportAs(variant, "html");
  const slug = `lf-${gen.id.slice(0, 8)}-${variant.id}`;
  const url = `https://${slug}.${provider === "vercel" ? "vercel.app" : "netlify.app"}`;

  return Response.json({
    mode: "demo",
    provider,
    url,
    deploymentId: crypto.randomUUID(),
    bytes: file.content.length,
  });
}
