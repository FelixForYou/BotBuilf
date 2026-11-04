import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { AppError } from "./errors";

/** Fixed-window rate limit yang persisten di PostgreSQL (berlaku lintas instance). */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ count: number; remaining: number }> {
  const r = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - (${windowSec} || ' seconds')::interval THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - (${windowSec} || ' seconds')::interval THEN now() ELSE rate_limits.window_start END
    RETURNING count`);
  const count = Number(r.rows[0].count);
  if (count > limit) throw new AppError("rate_limited", "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.", 429);
  return { count, remaining: limit - count };
}
