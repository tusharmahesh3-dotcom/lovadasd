import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { billingEvents, sessions } from "@/db/schema";

export const dynamic = "force-dynamic";

const CREDITS_BY_PACK: Record<string, { credits: number; plan: string }> = {
  starter: { credits: 10, plan: "credits" },
  builder: { credits: 40, plan: "credits" },
  pro: { credits: 0, plan: "pro" },
};

/**
 * POST /api/billing/webhook — Stripe event sink.
 * Handles: checkout.session.completed, customer.subscription.deleted.
 * Signature verification runs when STRIPE_WEBHOOK_SECRET is configured.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (process.env.STRIPE_WEBHOOK_SECRET && !signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const object = (event.data?.object ?? {}) as {
    client_reference_id?: string;
    metadata?: { app_session_id?: string; pack?: string };
    customer?: string;
  };
  const sessionId = object.metadata?.app_session_id ?? object.client_reference_id;
  if (!sessionId) return Response.json({ received: true, skipped: "no_session_ref" });

  await db.insert(billingEvents).values({
    sessionId,
    type: event.type ?? "unknown",
    payload: object as Record<string, unknown>,
  });

  if (event.type === "checkout.session.completed") {
    const pack = CREDITS_BY_PACK[object.metadata?.pack ?? "starter"] ?? CREDITS_BY_PACK.starter;
    await db
      .update(sessions)
      .set({
        plan: pack.plan,
        credits: pack.plan === "pro" ? 0 : sql`${sessions.credits} + ${pack.credits}`,
        stripeCustomerId: object.customer ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  }

  if (event.type === "customer.subscription.deleted") {
    await db.update(sessions).set({ plan: "free", updatedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  return Response.json({ received: true });
}
