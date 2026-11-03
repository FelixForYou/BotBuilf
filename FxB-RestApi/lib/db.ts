import "server-only";
import { createClient, type Client, type InArgs, type Row } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA, seed } from "./schema";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  if (process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL belum diatur. Database lokal (file) tidak bisa dipakai di Vercel.");
  }
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return createClient({ url: `file:${path.join(dir, "fxb.db")}` });
}

/** Klien libSQL (Turso di produksi, file SQLite saat lokal). Skema dibuat otomatis. */
export async function db(): Promise<Client> {
  if (!client) client = makeClient();
  if (!ready) {
    const c = client;
    ready = (async () => {
      await c.executeMultiple(SCHEMA);
      await seed(c);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return client;
}

export async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  const r = await (await db()).execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, args: InArgs = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args: InArgs = []) {
  return (await db()).execute({ sql, args });
}

export async function tx(stmts: { sql: string; args?: InArgs }[]) {
  return (await db()).batch(stmts.map((s) => ({ sql: s.sql, args: s.args ?? [] })), "write");
}
