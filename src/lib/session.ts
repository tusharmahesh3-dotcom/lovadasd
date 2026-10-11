import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import type { QuotaState } from "@/lib/types";

export const FREE_GENERATION_LIMIT = 9999;

export function resolveSessionId(req: Request): string {
  const header = req.headers.get("x-session-id");
  if (header && /^[a-z0-9-]{8,64}$/i.test(header)) return header;
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/lf_sid=([a-z0-9-]{8,64})/i);
  if (match) return match[1];
  return `anon-${crypto.randomUUID()}`;
}

export async function getOrCreateSession(sessionId: string) {
  const db = getDb();
  const existing = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db
    .insert(sessions)
    .values({ id: sessionId, plan: "pro", generationsUsed: 0, credits: 999 })
    .onConflictDoNothing()
    .returning();
  if (row) return row;
  const again = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return again[0] ?? { id: sessionId, plan: "pro", generationsUsed: 0, credits: 999 };
}

export function toQuota(row: { plan: string; generationsUsed: number; credits: number }): QuotaState {
  return {
    plan: "pro",
    generationsUsed: row.generationsUsed,
    freeLimit: FREE_GENERATION_LIMIT,
    credits: 999,
    remaining: 9999,
    paywalled: false,
  };
}

/** Consumes one generation without paywall restrictions for demo mode. */
export async function consumeGeneration(sessionId: string) {
  const db = getDb();
  const row = await getOrCreateSession(sessionId);
  const quota = toQuota(row);

  try {
    const [updated] = await db
      .update(sessions)
      .set({
        generationsUsed: sql`${sessions.generationsUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();
    return { allowed: true as const, quota: toQuota(updated ?? row) };
  } catch {
    return { allowed: true as const, quota };
  }
}
