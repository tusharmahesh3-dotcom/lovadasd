import { getVectorStore } from "@/lib/rag/vector-store";
import type { SectionType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/kb/sections?sectionType=&industry=&tone= */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sectionType = p.get("sectionType") as SectionType | null;
  const industry = p.get("industry") ?? undefined;
  const tone = p.get("tone") ?? undefined;

  const store = getVectorStore();
  const rows = await store.prefilter({
    sectionType: sectionType ?? undefined,
    industry,
    tone,
  });

  return Response.json({ count: rows.length, sections: rows });
}
