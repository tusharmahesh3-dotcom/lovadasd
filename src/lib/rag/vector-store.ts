import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { kbSections } from "@/db/schema";
import type { KbSection } from "@/db/schema";
import type { SectionType } from "@/lib/types";

/**
 * VectorStore adapter.
 *
 * Production target: Qdrant Cloud with two parallel collections
 *   - `sections_text`   (voyage-3,  cosine, 256d)
 *   - `sections_visual` (SigLIP,    cosine, 256d)
 * sharing an identical payload shape (the metadata object below), so metadata
 * pre-filtering happens inside the engine.
 *
 * Default runtime: Postgres (canonical store). Switch with VECTOR_BACKEND=qdrant.
 */

export interface SectionFilter {
  sectionType?: SectionType;
  industry?: string;
  tone?: string;
  layoutType?: string;
  conversionPattern?: string;
}

export interface VectorStore {
  readonly backend: string;
  /** Metadata pre-filter (stage 1 of the retrieval pipeline). */
  prefilter(filter: SectionFilter, limit?: number): Promise<KbSection[]>;
  countAll(): Promise<number>;
}

class PostgresVectorStore implements VectorStore {
  readonly backend = "postgres";

  async prefilter(filter: SectionFilter, limit = 200): Promise<KbSection[]> {
    const clauses = [];
    if (filter.sectionType) clauses.push(eq(kbSections.sectionType, filter.sectionType));
    if (filter.industry) clauses.push(eq(kbSections.industry, filter.industry));
    if (filter.tone) clauses.push(eq(kbSections.tone, filter.tone));
    if (filter.layoutType) clauses.push(eq(kbSections.layoutType, filter.layoutType));
    if (filter.conversionPattern) clauses.push(eq(kbSections.conversionPattern, filter.conversionPattern));

    const rows = await db
      .select()
      .from(kbSections)
      .where(clauses.length ? and(...clauses) : undefined)
      .limit(limit);
    return rows;
  }

  async countAll(): Promise<number> {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(kbSections);
    return row?.n ?? 0;
  }
}

/**
 * Qdrant adapter — enabled when VECTOR_BACKEND=qdrant and QDRANT_URL is set.
 * Hydrates structure/CSS from Postgres (Qdrant payloads stay small).
 */
class QdrantVectorStore implements VectorStore {
  readonly backend = "qdrant";
  private pg = new PostgresVectorStore();

  constructor(
    private url: string,
    private apiKey?: string,
  ) {}

  async prefilter(filter: SectionFilter, limit = 200): Promise<KbSection[]> {
    try {
      const must = Object.entries({
        section_type: filter.sectionType,
        industry: filter.industry,
        tone: filter.tone,
        layout_type: filter.layoutType,
        conversion_pattern: filter.conversionPattern,
      })
        .filter(([, v]) => Boolean(v))
        .map(([key, value]) => ({ key, match: { value } }));

      const res = await fetch(`${this.url}/collections/sections_text/points/scroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "api-key": this.apiKey } : {}),
        },
        body: JSON.stringify({ filter: { must }, limit, with_payload: true }),
      });
      if (!res.ok) throw new Error(`qdrant ${res.status}`);
      const json = (await res.json()) as {
        result: { points: { payload: { external_id: string } }[] };
      };
      const ids = json.result.points.map((p) => p.payload.external_id);
      if (!ids.length) return [];
      return db.select().from(kbSections).where(inArray(kbSections.externalId, ids));
    } catch {
      // graceful degradation keeps generation success rate high
      return this.pg.prefilter(filter, limit);
    }
  }

  countAll() {
    return this.pg.countAll();
  }
}

let store: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (store) return store;
  if (process.env.VECTOR_BACKEND === "qdrant" && process.env.QDRANT_URL) {
    store = new QdrantVectorStore(process.env.QDRANT_URL, process.env.QDRANT_API_KEY);
  } else {
    store = new PostgresVectorStore();
  }
  return store;
}
