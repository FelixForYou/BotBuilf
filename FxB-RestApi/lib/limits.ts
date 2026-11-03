import "server-only";
import { run } from "./db";

/** Tanggal "hari ini" dalam WIB (UTC+7) — limit harian reset 00:00 WIB. */
export function dayKey(now = Date.now()): string {
  return new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
}

export function nextResetMs(now = Date.now()): number {
  const wib = now + 7 * 3600_000;
  const startNext = Math.floor(wib / 86400_000 + 1) * 86400_000;
  return startNext - 7 * 3600_000;
}

/** Tambah counter secara atomik lalu kembalikan nilainya. */
export async function hit(subject: string, bucket: string, ttlMs: number): Promise<number> {
  const r = await run(
    "INSERT INTO usage_counters (subject,bucket,count,expires_at) VALUES (?,?,1,?) ON CONFLICT(subject,bucket) DO UPDATE SET count = count + 1 RETURNING count",
    [subject, bucket, Date.now() + ttlMs],
  );
  if (Math.random() < 0.01) await run("DELETE FROM usage_counters WHERE expires_at < ?", [Date.now()]);
  return Number(r.rows[0]?.count ?? 1);
}

export async function peek(subject: string, bucket: string): Promise<number> {
  const r = await run("SELECT count FROM usage_counters WHERE subject=? AND bucket=?", [subject, bucket]);
  return Number(r.rows[0]?.count ?? 0);
}

export interface LimitResult {
  allowed: boolean;
  reason?: "daily" | "minute";
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function consume(subject: string, daily: number, rpm: number, now = Date.now()): Promise<LimitResult> {
  const minute = Math.floor(now / 60_000);
  const m = await hit(subject, `m:${minute}`, 120_000);
  if (rpm > 0 && m > rpm) {
    const used = await peek(subject, `d:${dayKey(now)}`);
    return { allowed: false, reason: "minute", limit: daily, remaining: Math.max(0, daily - used), reset: nextResetMs(now), retryAfter: Math.ceil(((minute + 1) * 60_000 - now) / 1000) };
  }
  const d = await hit(subject, `d:${dayKey(now)}`, 2 * 86400_000);
  if (d > daily) {
    return { allowed: false, reason: "daily", limit: daily, remaining: 0, reset: nextResetMs(now), retryAfter: Math.ceil((nextResetMs(now) - now) / 1000) };
  }
  return { allowed: true, limit: daily, remaining: Math.max(0, daily - d), reset: nextResetMs(now) };
}
