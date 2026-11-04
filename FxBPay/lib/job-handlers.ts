import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { payments } from "./db/schema";
import { sendQueuedEmail } from "./email";
import { lockPayment, paymentPayload, releaseHeldFunds, sweepExpired, syncWithProvider, transition } from "./payments/service";
import { deliverWebhook } from "./webhooks-out";
import { runReconciliation } from "./admin-ledger";
import { loadDanaConfig } from "./dana/config";
import { DanaClient } from "./dana/client";
import { emitMerchantEvent } from "./webhooks-out";
import type { Env } from "./ledger";

type H = (payload: Record<string, unknown>) => Promise<void>;

export const handlers: Record<string, H> = {
  "email.send": async (p) => sendQueuedEmail(String(p.id)),
  "webhook.deliver": async (p) => {
    await deliverWebhook(String(p.deliveryId));
  },
  "payments.sweep": async () => {
    await sweepExpired();
  },
  "ledger.release_held": async () => {
    await releaseHeldFunds();
  },
  "reconcile.run": async (p) => {
    await runReconciliation((p.env as Env) ?? "sandbox");
  },
  /** Query Payment ke DANA. Bila order masih terbuka melewati masa berlaku, batalkan di DANA lalu tandai kedaluwarsa. */
  "payment.query": async (p) => {
    const id = String(p.paymentId);
    await syncWithProvider(id);
    if (!p.expireIfOpen) return;
    const [pay] = await db.select().from(payments).where(eq(payments.id, id));
    if (!pay || !["CREATED", "PENDING"].includes(pay.status) || pay.expiresAt.getTime() > Date.now() - 10 * 60_000) return;
    const cfg = await loadDanaConfig(pay.env);
    if (cfg) {
      const res = await new DanaClient(cfg).cancelOrder({ partnerReferenceNo: pay.partnerReferenceNo, reason: "Kedaluwarsa" });
      if (res.outcome !== "response") throw new Error("Cancel Order DANA tidak merespons; dicoba ulang");
      await syncWithProvider(id); // pastikan tidak lunas tepat sebelum dibatalkan
    }
    await db.transaction(async (tx) => {
      const locked = await lockPayment(tx, id);
      if (!["CREATED", "PENDING"].includes(locked.status)) return;
      const u = await transition(tx, locked, "EXPIRED", "job", "Masa berlaku habis (dikonfirmasi ke DANA)");
      await emitMerchantEvent(tx, u.userId, u.env, "payment.expired", paymentPayload(u));
    });
  },
  "maintenance.cleanup": async () => {
    await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
    await db.execute(sql`DELETE FROM jobs WHERE status='done' AND updated_at < now() - interval '14 days'`);
    await db.execute(sql`DELETE FROM sessions WHERE expires_at < now() - interval '30 days'`);
    await db.execute(sql`DELETE FROM idempotency_records WHERE created_at < now() - interval '30 days'`);
  },
};
