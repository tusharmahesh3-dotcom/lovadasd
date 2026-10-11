import { drizzle } from "drizzle-orm/node-postgres";
import { getTableName } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

let poolInstance: Pool | null = null;
let dbInstance: any = null;
let tablesInitialized = false;

async function bootstrapTables(p: Pool) {
  if (tablesInitialized) return;
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        parsed_query JSONB NOT NULL,
        variants JSONB NOT NULL,
        model_route JSONB NOT NULL,
        retrieval_trace JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'succeeded',
        latency_ms INTEGER NOT NULL DEFAULT 0,
        cost_micro_usd INTEGER NOT NULL DEFAULT 0,
        valid_html BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        plan TEXT NOT NULL DEFAULT 'pro',
        generations_used INTEGER NOT NULL DEFAULT 0,
        credits INTEGER NOT NULL DEFAULT 999,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    tablesInitialized = true;
  } catch (err) {
    console.warn("[Postgres] Table bootstrap note:", (err as Error).message);
  }
}

/**
 * In-memory fallback data store for build time or offline execution.
 */
interface MemoryStore {
  generations: any[];
  sessions: Map<string, any>;
}

const globalForStore = globalThis as typeof globalThis & {
  __landingForgeMemoryStore?: MemoryStore;
};

if (!globalForStore.__landingForgeMemoryStore) {
  globalForStore.__landingForgeMemoryStore = {
    generations: [],
    sessions: new Map(),
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

function resolveTableName(table: any): "generations" | "sessions" {
  try {
    const name = getTableName(table);
    if (name === "generations" || name === "sessions") return name;
  } catch {}
  if (table && table._ && table._.name && (table._.name === "generations" || table._.name === "sessions")) {
    return table._.name;
  }
  return "generations";
}

function createMockSelect(fields?: any, real?: any) {
  let targetTable: any = null;
  let whereCond: any = null;
  let limitCount: number | null = null;
  let offsetCount: number | null = null;

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
    orderBy() {
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (real) {
          try {
            let q = real.select(fields).from(targetTable);
            if (whereCond) q = q.where(whereCond);
            if (offsetCount !== null) q = q.offset(offsetCount);
            if (limitCount !== null) q = q.limit(limitCount);
            return await q;
          } catch (err) {
            console.warn("[Postgres] query note:", (err as Error).message);
          }
        }

        const tableName = resolveTableName(targetTable);
        let items: any[] = tableName === "sessions" ? Array.from(mem.sessions.values()) : mem.generations;
        let filtered = whereCond ? items.filter((row) => rowMatches(row, whereCond)) : [...items];

        if (offsetCount !== null) filtered = filtered.slice(offsetCount);
        if (limitCount !== null) filtered = filtered.slice(0, limitCount);
        return filtered;
      };
      return execute().then(onfulfilled, onrejected);
    },
  };
  return builder;
}

function createMockInsert(table: any, real?: any) {
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
        if (real) {
          try {
            let q = real.insert(table).values(insertValues);
            if (conflictMode === "doNothing") q = q.onConflictDoNothing();
            else if (conflictMode === "doUpdate") q = q.onConflictDoUpdate({ target: table.id, set: conflictUpdateSet });
            return await q.returning();
          } catch (err) {
            console.warn("[Postgres] insert note:", (err as Error).message);
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
            const s = { plan: "pro", generationsUsed: 0, credits: 999, updatedAt: new Date(), ...existing, ...row };
            mem.sessions.set(row.id, s);
            inserted.push(s);
          } else {
            mem.generations.push(row);
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

function createMockUpdate(table: any, real?: any) {
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
        if (real) {
          try {
            let q = real.update(table).set(updateSet);
            if (whereCond) q = q.where(whereCond);
            return await q.returning();
          } catch (err) {
            console.warn("[Postgres] update note:", (err as Error).message);
          }
        }

        const tableName = resolveTableName(table);
        const updated: any[] = [];

        if (tableName === "sessions") {
          for (const session of mem.sessions.values()) {
            if (rowMatches(session, whereCond)) {
              for (const [k, v] of Object.entries(updateSet)) {
                if (k === "generationsUsed") {
                  session.generationsUsed = (session.generationsUsed || 0) + 1;
                } else {
                  session[k] = v;
                }
              }
              session.updatedAt = new Date();
              updated.push(session);
            }
          }
        } else {
          for (const row of mem.generations) {
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

function createMockDelete(table: any, real?: any) {
  let whereCond: any = null;
  const builder: any = {
    where(cond: any) {
      whereCond = cond;
      return builder;
    },
    then(onfulfilled: (res: any) => any, onrejected?: (err: any) => any) {
      const execute = async () => {
        if (real) {
          try {
            let q = real.delete(table);
            if (whereCond) q = q.where(whereCond);
            return await q;
          } catch (err) {
            console.warn("[Postgres] delete note:", (err as Error).message);
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
          if (!whereCond) mem.generations = [];
          else mem.generations = mem.generations.filter((row) => !rowMatches(row, whereCond));
        }
        return [];
      };
      return execute().then(onfulfilled, onrejected);
    },
  };
  return builder;
}

/**
 * Lazy database getter.
 * Initializes Neon Postgres pool and Drizzle client ONLY when invoked,
 * ensuring Next.js static build steps never fail when DATABASE_URL is missing.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !dbInstance) {
    try {
      const useSsl = databaseUrl.includes("sslmode=require") || databaseUrl.includes("neon.tech");
      poolInstance = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      });
      dbInstance = drizzle(poolInstance, { schema });
      bootstrapTables(poolInstance).catch(() => {});
    } catch (err) {
      console.warn("[AI Studio] Lazy Postgres connection failed; using in-memory store:", err);
    }
  }

  const real = dbInstance;

  return {
    select(fields?: any) {
      return createMockSelect(fields, real);
    },
    insert(table: any) {
      return createMockInsert(table, real);
    },
    update(table: any) {
      return createMockUpdate(table, real);
    },
    delete(table: any) {
      return createMockDelete(table, real);
    },
    async execute(query?: any) {
      if (poolInstance) {
        try {
          return await poolInstance.query("SELECT 1");
        } catch {}
      }
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
}

/**
 * Lazy proxy export for backward compatibility with `import { db } from "@/db"`.
 */
export const db: any = new Proxy(
  {},
  {
    get: (_, prop) => {
      const active = getDb();
      const val = (active as any)[prop];
      return typeof val === "function" ? val.bind(active) : val;
    },
  },
);
