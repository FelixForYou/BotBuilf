import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/db/open.mjs";

const g = globalThis as unknown as { __fxDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__fxDb) g.__fxDb = openDatabase() as DatabaseSync;
  return g.__fxDb;
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
}
