import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { billingEvents, sessions } from "@/db/schema";
import { getOrCreateSession, resolveSessionId, toQuota } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * ---------------------------------------------------------------------------
 * DELIVERABLE 7 — BILLING FLOW (Stripe)
 * ---------------------------------------------------------------------------
 * 1. Client hits the paywall (HTTP 402 from /api/generate).
 * 2. POST /api/billing/checkout { pack } -> Stripe Checkout Session URL.
 * 3. Stripe redirects back; checkout.session.completed hits /api/billing/webhook.
 * 4. Webhook grants credits / flips plan -> generation unblocks.
 *
 * Without STRIPE_SECRET_KEY the route runs in SIMULATION mode so the entire
 * paywall -> purchase -> unblock loop is testable end to end.
 */

const PACKS = {
  starter: { name: "10 generation credits", credits: 10, amount: 1200, plan: "credits" },
  builder: { name: "40 generation credits", credits: 40, amount: 3900, plan: "credits" },
  pro: { name: "Pro — unlimited generations", credits: 0, amount: 4900, plan: "pro" },
} as const;

export type PackId = keyof typeof PACKS;

export async function GET() {
  return Response.json({
    packs: Object.entries(PACKS).map(([id, p]) => ({ id, ...p })),
    mode: process.env.STRIPE_SECRET_KEY ? "live" : "simulation",
  });
}

export async function POST(req: Request) {
  const sessionId = resolveSessionId(req);
  const body = (await req.json().catch(() => ({}))) as { pack?: PackId };
  const packId = (body.pack ?? "starter") as PackId;
  const pack = PACKS[packId];
  if (!pack) return Response.json({ error: "unknown_pack" }, { status: 400 });

  await getOrCreateSession(sessionId);
  const origin = new URL(req.url).origin;

  if (process.env.STRIPE_SECRET_KEY) {
    const params = new URLSearchParams();
    params.set("mode", pack.plan === "pro" ? "subscription" : "payment");
    params.set("success_url", `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}/?checkout=cancelled`);
    params.set("client_reference_id", sessionId);
    params.set("metadata[app_session_id]", sessionId);
    params.set("metadata[pack]", packId);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(pack.amount));
    params.set("line_items[0][price_data][product_data][name]", pack.name);
    if (pack.plan === "pro") params.set("line_items[0][price_data][recurring][interval]", "month");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (res.ok) {
      const json = (await res.json()) as { id: string; url: string };
      await db.insert(billingEvents).values({
        sessionId,
        type: "checkout.created",
        payload: { packId, stripeSessionId: json.id },
      });
      return Response.json({ mode: "live", checkoutUrl: json.url, stripeSessionId: json.id });
    }
  }

  // --- simulation: grant entitlement immediately ---------------------------
  const [updated] = await db
    .update(sessions)
    .set({
      plan: pack.plan,
      credits: pack.plan === "pro" ? 0 : sql`${sessions.credits} + ${pack.credits}`,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  await db.insert(billingEvents).values({
    sessionId,
    type: "checkout.simulated",
    payload: { packId, credits: pack.credits, plan: pack.plan },
  });

  return Response.json({
    mode: "simulation",
    message: `Simulated purchase of "${pack.name}". Set STRIPE_SECRET_KEY for live checkout.`,
    quota: updated ? toQuota(updated) : null,
  });
}
