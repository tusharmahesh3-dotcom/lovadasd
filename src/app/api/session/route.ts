import { getOrCreateSession, resolveSessionId, toQuota } from "@/lib/session";
import { ensureKnowledgeBase } from "@/lib/rag/ingest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sessionId = resolveSessionId(req);
  const [row] = await Promise.all([getOrCreateSession(sessionId), ensureKnowledgeBase()]);
  if (!row) return Response.json({ error: "session_unavailable" }, { status: 500 });
  const res = Response.json({ sessionId, quota: toQuota(row) });
  res.headers.append("set-cookie", `lf_sid=${sessionId}; Path=/; Max-Age=2592000; SameSite=Lax`);
  return res;
}
