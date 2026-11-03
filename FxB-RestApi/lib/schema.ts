import type { Client } from "@libsql/client";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  plan_id TEXT,
  daily_limit INTEGER,
  rpm_limit INTEGER,
  expires_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user_id);
CREATE TABLE IF NOT EXISTS usage_counters (
  subject TEXT NOT NULL,
  bucket TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (subject, bucket)
);
CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id TEXT,
  user_id TEXT,
  endpoint_id TEXT NOT NULL,
  status INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  ip_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_user ON request_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_time ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_key ON request_logs(key_id, created_at);
CREATE TABLE IF NOT EXISTS endpoint_overrides (
  endpoint_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  tier TEXT,
  note TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  duration_days INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL,
  rpm_limit INTEGER NOT NULL,
  rank INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  key_id TEXT,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  gateway TEXT NOT NULL,
  gateway_ref TEXT,
  payment_url TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS short_links (
  code TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  user_id TEXT,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL,
  user_id TEXT,
  created_at INTEGER NOT NULL
);
`;

/** Paket awal — hanya dibuat bila tabel plans kosong. Admin bebas mengubah/menghapus. */
const DEFAULT_PLANS = [
  { id: "starter", name: "Starter", description: "Untuk bot pribadi & proyek kecil.", price: 15000, duration_days: 30, daily_limit: 2000, rpm_limit: 40, rank: 1, sort: 1 },
  { id: "pro", name: "Pro", description: "Untuk bot grup aktif dan website.", price: 35000, duration_days: 30, daily_limit: 10000, rpm_limit: 90, rank: 2, sort: 2 },
  { id: "ultimate", name: "Ultimate", description: "Trafik tinggi, prioritas limit terbesar.", price: 75000, duration_days: 30, daily_limit: 50000, rpm_limit: 240, rank: 3, sort: 3 },
];

export async function seed(c: Client) {
  const r = await c.execute("SELECT COUNT(*) AS n FROM plans");
  if (Number(r.rows[0].n) === 0) {
    const now = Date.now();
    await c.batch(
      DEFAULT_PLANS.map((p) => ({
        sql: "INSERT INTO plans (id,name,description,price,currency,duration_days,daily_limit,rpm_limit,rank,active,sort,created_at) VALUES (?,?,?,?,'IDR',?,?,?,?,1,?,?)",
        args: [p.id, p.name, p.description, p.price, p.duration_days, p.daily_limit, p.rpm_limit, p.rank, p.sort, now],
      })),
      "write",
    );
  }
}
