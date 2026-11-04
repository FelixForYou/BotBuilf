import "server-only";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { notifications } from "./db/schema";
import { getSetting } from "./settings";
import { loadDanaConfig } from "./dana/config";
import { currentEnv } from "./auth/session";
import type { Env } from "./ledger";
import { VALID_UP_TO_MAX_MS } from "./dana/constants";

export async function effectiveEnv(): Promise<Env> {
  const env = await currentEnv();
  if (env === "production" && !(await getSetting("production")).enabled) return "sandbox";
  return env;
}

export async function unreadCount(userId: string, admin = false) {
  const [r] = await db.select({ c: count() }).from(notifications).where(and(admin ? eq(notifications.audience, "admin") : eq(notifications.userId, userId), isNull(notifications.readAt)));
  return r.c;
}

/** Info yang dibutuhkan sheet "Buat": provider aktif, batas masa berlaku, ketersediaan QRIS. */
export async function createContext(env: Env) {
  const cfg = await loadDanaConfig(env).catch(() => null);
  const limits = await getSetting("limits");
  const providerMax = cfg ? VALID_UP_TO_MAX_MS[env] / 60_000 : Infinity;
  return { demo: !cfg, configured: !!cfg, qrisAvailable: !!cfg?.qrisEnabled, maxMinutes: Math.min(limits.linkMaxHours * 60, providerMax) };
}

export async function dailySeries(userId: string | null, env: Env, days: number) {
  const r = await db.execute<{ day: string; paid: string; count: string }>(sql`
    WITH d AS (SELECT generate_series((now() AT TIME ZONE 'Asia/Jakarta')::date - (${days - 1})::int, (now() AT TIME ZONE 'Asia/Jakarta')::date, interval '1 day')::date AS day)
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day, coalesce(sum(p.amount),0)::text AS paid, count(p.id)::text AS count
    FROM d LEFT JOIN payments p ON (p.paid_at AT TIME ZONE 'Asia/Jakarta')::date = d.day AND p.env = ${env} AND p.captured_journal_id IS NOT NULL
      ${userId ? sql`AND p.user_id = ${userId}` : sql``}
    GROUP BY d.day ORDER BY d.day`);
  return r.rows.map((x) => ({ day: x.day, paid: Number(x.paid), count: Number(x.count) }));
}
