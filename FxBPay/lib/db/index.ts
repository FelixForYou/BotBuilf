import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type DbOrTx = DB | Tx;

const g = globalThis as unknown as { __fxbPool?: Pool; __fxbDb?: DB };

function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur. Lihat .env.example.");
  return url;
}

export function getPool(): Pool {
  if (!g.__fxbPool) {
    g.__fxbPool = new Pool({
      connectionString: connectionString(),
      max: Number(process.env.DB_POOL_MAX ?? 10),
      ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== "1" } : undefined,
    });
  }
  return g.__fxbPool;
}

export function getDb(): DB {
  if (!g.__fxbDb) g.__fxbDb = drizzle(getPool(), { schema });
  return g.__fxbDb;
}

export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export { schema };
