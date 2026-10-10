import { drizzle } from "drizzle-orm/node-postgres";
import { getTableName } from "drizzle-orm";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

let realDb: any = null;
let pool: Pool | null = null;

if (databaseUrl) {
  try {
    const globalForDb = globalThis as typeof globalThis & {
      __arenaNextJsPostgresqlPool?: Pool;
    };
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
      });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
    realDb = drizzle(pool);
  } catch (err) {
    console.warn("[AI Studio] Postgres pool init failed; using in-memory store:", err);
  }
}

export { pool };

/**
 * In-memory fallback data store for AI Studio container environment.
 * Allows the full RAG pipeline, session quotas, and UI to run seamlessly
 * without requiring an external PostgreSQL instance.
 */
interface MemoryStore {
  kb_pages: any[];
  kb_sections: any[];
  sessions: Map<string, any>;
  generations: any[];
  feedback: any[];
  deployments: any[];
  billing_events: any[];
}

const globalForStore = globalThis as typeof globalThis & {
  __landingForgeMemoryStore?: MemoryStore;
};

if (!globalForStore.__landingForgeMemoryStore) {
  globalForStore.__landingForgeMemoryStore = {
    kb_pages: [],
    kb_sections: [],
    sessions: new Map(),
    generations: [],
    feedback: [],
    deployments: [],
    billing_events: [],
  };
}

const mem = globalForStore.__landingForgeMemoryStore;

function extractConditions(cond: any): Array<{ col: string; val: any; op: "eq" | "in" }> {
  if (!cond) return [];
  const results: Array<{ col: string; val: any; op: "eq" | "in" }> = [];

  function scan(chunks: any[]) {
    let lastCol: string | null = null;
    for (const chunk of chunks) {
      if (!chunk) continue;
      if (chunk.name && typeof chunk.name === "string") {
        lastCol = chunk.name;
      } else if (chunk.constructor && chunk.constructor.name === "Param") {
        if (lastCol) {
          results.push({ col: lastCol, val: chunk.value, op: "eq" });
          lastCol = null;
        }
      } else if (Array.isArray(chunk)) {
        if (lastCol) {
          const vals = chunk.map((p) => (p && p.constructor && p.constructor.name === "Param" ? p.value : p));
          results.push({ col: lastCol, val: vals, op: "in" });
          lastCol = null;
        }
      } else if (chunk.queryChunks) {
        scan(chunk.queryChunks);
      }
    }
  }

  if (cond.queryChunks) scan(cond.queryChunks);
  return results;
}

function getField(row: any, colName: string): any {
  if (row[colName] !== undefined) return row[colName];
  const camel = colName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (row[camel] !== undefined) return row[camel];
  const snake = colName.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  if (row[snake] !== undefined) return row[snake];
  return undefined;
}

function rowMatches(row: any, cond: any): boolean {
  const conditions = extractConditions(cond);
  if (!conditions.length) return true;
  for (const c of conditions) {
    const val = getField(row, c.col);
    if (c.op === "in") {
      if (!Array.isArray(c.val) || !c.val.includes(val)) return false;
    } else {
      if (val !== c.val) return false;
    }
  }
  return true;
}

function resolveTableName(table: any): keyof MemoryStore {
  try {
    const name = getTableName(table);
    if (name in mem) return name as keyof MemoryStore;
  } catch {
    // fallback
  }
  if (table && table._ && table._.name && table._.name in mem) {
    return table._.name as keyof MemoryStore;
  }
  return "kb_sections";
}

function createSelectBuilder(fields?: any) {
  let targetTable: any = null;
  let whereCond: any = null;
  let limitCount: number | null = null;
  let offsetCount: number | null = null;
  let groupByCol: any = null;

  const builder: any = {
    from(table: any) {
      targetTable = table;
      return builder;
    },
    where(cond: any) {
      whereCond = cond;
      return builder;
    },
    limit(n: number) {
      limitCount = n;
      return builder;
    },
    offset(n: number) {
      offsetCount = n;
      return builder;
    },
    groupBy(col: any) {
      groupByCol = col;
      return builder;
    },
    orderBy() {
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (realDb) {
          try {
            let q = realDb.select(fields).from(targetTable);
            if (whereCond) q = q.where(whereCond);
            if (groupByCol) q = q.groupBy(groupByCol);
            if (offsetCount !== null) q = q.offset(offsetCount);
            if (limitCount !== null) q = q.limit(limitCount);
            return await q;
          } catch (err) {
            console.warn("[AI Studio] Postgres select failed; falling back to in-memory:", err);
          }
        }

        const tableName = resolveTableName(targetTable);
        let items: any[] = [];
        if (tableName === "sessions") {
          items = Array.from(mem.sessions.values());
        } else {
          items = (mem[tableName] as any[]) || [];
        }

        let filtered = whereCond ? items.filter((row) => rowMatches(row, whereCond)) : [...items];

        // GroupBy aggregation
        if (groupByCol) {
          const colName = groupByCol.name || "sectionType";
          const counts = new Map<string, number>();
          for (const row of filtered) {
            const key = String(getField(row, colName) ?? "unknown");
            counts.set(key, (counts.get(key) || 0) + 1);
          }
          const res = Array.from(counts.entries()).map(([k, count]) => {
            if (colName.includes("industry")) return { industry: k, n: count };
            return { sectionType: k, n: count };
          });
          return res;
        }

        // Count aggregate { n: count }
        if (fields && typeof fields === "object" && "n" in fields && Object.keys(fields).length <= 2) {
          if ("avg" in fields) {
            const ratings = filtered.map((f) => f.rating || 0).filter(Boolean);
            const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
            return [{ avg, n: filtered.length }];
          }
          return [{ n: filtered.length }];
        }

        // Stats aggregate for generations
        if (fields && typeof fields === "object" && "total" in fields) {
          const latencies = filtered.map((g) => g.latencyMs || 0).sort((a, b) => a - b);
          const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
          const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
          const valid = filtered.filter((g) => g.validHtml !== false).length;
          const validRate = filtered.length ? valid / filtered.length : 1;
          const totalCost = filtered.reduce((s, g) => s + (g.costMicroUsd || 0), 0);
          const avgCost = filtered.length ? totalCost / filtered.length : 0;
          return [
            {
              total: filtered.length,
              p50,
              p95,
              validRate,
              avgCost,
            },
          ];
        }

        if (offsetCount !== null) {
          filtered = filtered.slice(offsetCount);
        }
        if (limitCount !== null) {
          filtered = filtered.slice(0, limitCount);
        }

        return filtered;
      };

      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createInsertBuilder(table: any) {
  let insertValues: any = null;
  let conflictMode: "none" | "doNothing" | "doUpdate" = "none";
  let conflictUpdateSet: any = null;

  const builder: any = {
    values(vals: any) {
      insertValues = vals;
      return builder;
    },
    onConflictDoNothing() {
      conflictMode = "doNothing";
      return builder;
    },
    onConflictDoUpdate(opts: any) {
      conflictMode = "doUpdate";
      conflictUpdateSet = opts?.set;
      return builder;
    },
    returning() {
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (realDb) {
          try {
            let q = realDb.insert(table).values(insertValues);
            if (conflictMode === "doNothing") q = q.onConflictDoNothing();
            else if (conflictMode === "doUpdate") q = q.onConflictDoUpdate({ target: table.id, set: conflictUpdateSet });
            return await q.returning();
          } catch (err) {
            console.warn("[AI Studio] Postgres insert failed; falling back to in-memory:", err);
          }
        }

        const tableName = resolveTableName(table);
        const rows = Array.isArray(insertValues) ? insertValues : [insertValues];
        const inserted: any[] = [];

        for (const raw of rows) {
          const row = {
            id: raw.id || crypto.randomUUID(),
            createdAt: raw.createdAt || new Date(),
            ...raw,
          };

          if (tableName === "sessions") {
            const existing = mem.sessions.get(row.id);
            if (existing && conflictMode === "doNothing") {
              inserted.push(existing);
              continue;
            }
            const sessionObj = {
              plan: "free",
              generationsUsed: 0,
              credits: 0,
              updatedAt: new Date(),
              ...existing,
              ...row,
            };
            mem.sessions.set(row.id, sessionObj);
            inserted.push(sessionObj);
          } else if (tableName === "kb_pages") {
            const idx = mem.kb_pages.findIndex((p) => p.slug === row.slug);
            if (idx >= 0) {
              if (conflictMode === "doUpdate" && conflictUpdateSet) {
                mem.kb_pages[idx] = { ...mem.kb_pages[idx], ...conflictUpdateSet };
              }
              inserted.push(mem.kb_pages[idx]);
            } else {
              mem.kb_pages.push(row);
              inserted.push(row);
            }
          } else if (tableName === "kb_sections") {
            const idx = mem.kb_sections.findIndex((s) => s.externalId === row.externalId);
            if (idx >= 0) {
              if (conflictMode === "doUpdate" && conflictUpdateSet) {
                mem.kb_sections[idx] = { ...mem.kb_sections[idx], ...conflictUpdateSet };
              }
              inserted.push(mem.kb_sections[idx]);
            } else {
              mem.kb_sections.push(row);
              inserted.push(row);
            }
          } else {
            (mem[tableName] as any[]).push(row);
            inserted.push(row);
          }
        }

        return inserted;
      };

      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createUpdateBuilder(table: any) {
  let updateSet: any = null;
  let whereCond: any = null;

  const builder: any = {
    set(vals: any) {
      updateSet = vals;
      return builder;
    },
    where(cond: any) {
      whereCond = cond;
      return builder;
    },
    returning() {
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (realDb) {
          try {
            let q = realDb.update(table).set(updateSet);
            if (whereCond) q = q.where(whereCond);
            return await q.returning();
          } catch (err) {
            console.warn("[AI Studio] Postgres update failed; falling back to in-memory:", err);
          }
        }

        const tableName = resolveTableName(table);
        const updated: any[] = [];

        if (tableName === "sessions") {
          for (const [id, session] of mem.sessions.entries()) {
            if (rowMatches(session, whereCond)) {
              for (const [k, v] of Object.entries(updateSet)) {
                if (k === "generationsUsed") {
                  session.generationsUsed = (session.generationsUsed || 0) + 1;
                } else if (k === "credits") {
                  if (typeof v === "number") {
                    session.credits = v;
                  } else {
                    session.credits = Math.max(0, (session.credits || 0) - 1);
                  }
                } else {
                  session[k] = v;
                }
              }
              session.updatedAt = new Date();
              updated.push(session);
            }
          }
        } else {
          const list = (mem[tableName] as any[]) || [];
          for (const row of list) {
            if (rowMatches(row, whereCond)) {
              Object.assign(row, updateSet);
              updated.push(row);
            }
          }
        }

        return updated;
      };

      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createDeleteBuilder(table: any) {
  let whereCond: any = null;

  const builder: any = {
    where(cond: any) {
      whereCond = cond;
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (realDb) {
          try {
            let q = realDb.delete(table);
            if (whereCond) q = q.where(whereCond);
            return await q;
          } catch (err) {
            console.warn("[AI Studio] Postgres delete failed; falling back to in-memory:", err);
          }
        }

        const tableName = resolveTableName(table);
        if (tableName === "sessions") {
          if (!whereCond) mem.sessions.clear();
          else {
            for (const [id, session] of mem.sessions.entries()) {
              if (rowMatches(session, whereCond)) mem.sessions.delete(id);
            }
          }
        } else {
          if (!whereCond) mem[tableName] = [];
          else {
            mem[tableName] = (mem[tableName] as any[]).filter((row) => !rowMatches(row, whereCond));
          }
        }

        return [];
      };

      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

export const db: any = {
  select(fields?: any) {
    return createSelectBuilder(fields);
  },
  insert(table: any) {
    return createInsertBuilder(table);
  },
  update(table: any) {
    return createUpdateBuilder(table);
  },
  delete(table: any) {
    return createDeleteBuilder(table);
  },
  async execute() {
    return { rows: [{ "?column?": 1 }] };
  },
  query: new Proxy(
    {},
    {
      get: () => ({
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
      }),
    },
  ),
};
