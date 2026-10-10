import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deployments, generations } from "@/db/schema";
import { exportAs } from "@/lib/generate/assemble";
import { getOrCreateSession, resolveSessionId, toQuota } from "@/lib/session";
import type { GeneratedVariant } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/deploy — one-click deploy (post-payment).
 * body: { generationId, variantId, provider: "netlify" | "vercel" }
 *
 * Live mode uses NETLIFY_AUTH_TOKEN / VERCEL_TOKEN. Without tokens the route
 * records a simulated deployment so the flow stays demonstrable.
 */
export async function POST(req: Request) {
  const sessionId = resolveSessionId(req);
  const body = (await req.json().catch(() => ({}))) as {
    generationId?: string;
    variantId?: string;
    provider?: "netlify" | "vercel";
  };
  const provider = body.provider === "vercel" ? "vercel" : "netlify";

  if (!body.generationId) return Response.json({ error: "missing_generation_id" }, { status: 400 });

  const row = await getOrCreateSession(sessionId);
  const quota = row ? toQuota(row) : null;
  if (!quota || (quota.plan === "free" && quota.credits === 0)) {
    return Response.json(
      { error: "payment_required", message: "One-click deploy unlocks after your first purchase." },
      { status: 402 },
    );
  }

  const [gen] = await db.select().from(generations).where(eq(generations.id, body.generationId)).limit(1);
  if (!gen) return Response.json({ error: "not_found" }, { status: 404 });

  const variants = (gen.variants ?? []) as GeneratedVariant[];
  const variant = variants.find((v) => v.id === body.variantId) ?? variants[0];
  if (!variant) return Response.json({ error: "variant_not_found" }, { status: 404 });

  const file = exportAs(variant, "html");
  const slug = `lf-${gen.id.slice(0, 8)}-${variant.id}`;
  let url = `https://${slug}.${provider === "vercel" ? "vercel.app" : "netlify.app"}`;
  let mode: "live" | "simulation" = "simulation";

  const token = provider === "netlify" ? process.env.NETLIFY_AUTH_TOKEN : process.env.VERCEL_TOKEN;
  if (token && provider === "netlify") {
    try {
      const create = await fetch("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: slug }),
      });
      if (create.ok) {
        const site = (await create.json()) as { id: string; ssl_url?: string; url?: string };
        const form = new FormData();
        form.append("index.html", new Blob([file.content], { type: "text/html" }), "index.html");
        await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        url = site.ssl_url ?? site.url ?? url;
        mode = "live";
      }
    } catch {
      mode = "simulation";
    }
  }

  const [record] = await db
    .insert(deployments)
    .values({ generationId: gen.id, variantId: variant.id, provider, url, status: mode === "live" ? "ready" : "simulated" })
    .returning();

  return Response.json({ mode, provider, url, deploymentId: record.id, bytes: file.content.length });
}
