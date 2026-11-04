/**
 * Antrean background job persisten di PostgreSQL (tabel `jobs`).
 * Diklaim dengan `FOR UPDATE SKIP LOCKED` sehingga aman dijalankan beberapa worker sekaligus.
 * Dijalankan oleh `npm run worker` (proses terpisah) atau endpoint `/api/cron` (untuk serverless).
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db, type DbOrTx } from "./db";
import { jobs } from "./db/schema";

export async function enqueueJob(
  type: string,
  payload: Record<string, unknown> = {},
  opts: { runAt?: Date; dedupeKey?: string; maxAttempts?: number; tx?: DbOrTx } = {},
) {
  await (opts.tx ?? db)
    .insert(jobs)
    .values({ type, payload, runAt: opts.runAt ?? new Date(), dedupeKey: opts.dedupeKey, maxAttempts: opts.maxAttempts ?? 8 })
    .onConflictDoNothing();
}

export function backoffMs(attempt: number): number {
  // 30 dtk, 1 mnt, 2 mnt, 4 mnt ... maks 6 jam
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), 6 * 3600_000);
}

type Claimed = { id: string; type: string; payload: Record<string, unknown>; attempts: number; max_attempts: number };

export async function runDueJobs(limit = 20): Promise<{ ran: number; failed: number }> {
  const { handlers } = await import("./job-handlers");
  // Pulihkan job yang macet (worker mati saat memproses).
  await db.execute(sql`UPDATE jobs SET status='queued', locked_at=NULL WHERE status='running' AND locked_at < now() - interval '10 minutes'`);
  const claimed = await db.execute<Claimed>(sql`
    UPDATE jobs SET status='running', locked_at=now(), attempts=attempts+1, updated_at=now()
    WHERE id IN (SELECT id FROM jobs WHERE status='queued' AND run_at <= now() ORDER BY run_at LIMIT ${limit} FOR UPDATE SKIP LOCKED)
    RETURNING id, type, payload, attempts, max_attempts`);
  let failed = 0;
  for (const job of claimed.rows) {
    try {
      const h = handlers[job.type];
      if (!h) throw new Error(`Handler job tidak dikenal: ${job.type}`);
      await h(job.payload);
      await db.execute(sql`UPDATE jobs SET status='done', locked_at=NULL, last_error=NULL, updated_at=now() WHERE id=${job.id}`);
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      const final = job.attempts >= job.max_attempts;
      await db.execute(sql`UPDATE jobs SET status=${final ? "failed" : "queued"}, locked_at=NULL, last_error=${msg.slice(0, 2000)},
        run_at=now() + (${backoffMs(job.attempts)} || ' milliseconds')::interval, updated_at=now() WHERE id=${job.id}`);
    }
  }
  return { ran: claimed.rows.length, failed };
}

/** Jadwalkan job periodik (idempoten berkat dedupe key per slot waktu). */
export async function scheduleRecurring() {
  const now = Date.now();
  const slot = (ms: number) => Math.floor(now / ms);
  await enqueueJob("payments.sweep", {}, { dedupeKey: `sweep:${slot(60_000)}`, maxAttempts: 1 });
  await enqueueJob("ledger.release_held", {}, { dedupeKey: `release:${slot(5 * 60_000)}`, maxAttempts: 2 });
  await enqueueJob("reconcile.run", { env: "production" }, { dedupeKey: `recon:production:${slot(6 * 3600_000)}`, maxAttempts: 2 });
  await enqueueJob("reconcile.run", { env: "sandbox" }, { dedupeKey: `recon:sandbox:${slot(6 * 3600_000)}`, maxAttempts: 2 });
  await enqueueJob("maintenance.cleanup", {}, { dedupeKey: `cleanup:${slot(24 * 3600_000)}`, maxAttempts: 1 });
}
