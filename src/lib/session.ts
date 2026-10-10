import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import type { QuotaState } from "@/lib/types";

export const FREE_GENERATION_LIMIT = 2;

export function resolveSessionId(req: Request): string {
  const header = req.headers.get("x-session-id");
  if (header && /^[a-z0-9-]{8,64}$/i.test(header)) return header;
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/lf_sid=([a-z0-9-]{8,64})/i);
  if (match) return match[1];
  return `anon-${crypto.randomUUID()}`;
}

export async function getOrCreateSession(sessionId: string) {
  const existing = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(sessions).values({ id: sessionId }).onConflictDoNothing().returning();
  if (row) return row;
  const again = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return again[0];
}

export function toQuota(row: { plan: string; generationsUsed: number; credits: number }): QuotaState {
  const freeRemaining = Math.max(0, FREE_GENERATION_LIMIT - row.generationsUsed);
  const remaining = row.plan === "pro" ? Infinity : freeRemaining + row.credits;
  return {
    plan: row.plan,
    generationsUsed: row.generationsUsed,
    freeLimit: FREE_GENERATION_LIMIT,
    credits: row.credits,
    remaining: remaining === Infinity ? 9999 : remaining,
    paywalled: row.plan !== "pro" && freeRemaining <= 0 && row.credits <= 0,
  };
}

/** Consumes one generation: free allowance first, then credits. */
export async function consumeGeneration(sessionId: string) {
  const row = await getOrCreateSession(sessionId);
  if (!row) throw new Error("session unavailable");
  const quota = toQuota(row);
  if (quota.paywalled) return { allowed: false as const, quota };

  const useFree = row.plan === "pro" || row.generationsUsed < FREE_GENERATION_LIMIT;
  const [updated] = await db
    .update(sessions)
    .set({
      generationsUsed: sql`${sessions.generationsUsed} + 1`,
      credits: useFree ? row.credits : sql`GREATEST(${sessions.credits} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  return { allowed: true as const, quota: toQuota(updated ?? row) };
}
