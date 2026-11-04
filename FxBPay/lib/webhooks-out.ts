/** Webhook keluar ke merchant: bertanda tangan HMAC-SHA256, retry dengan backoff eksponensial, riwayat pengiriman. */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, type DbOrTx } from "./db";
import { webhookDeliveries, webhookEndpoints } from "./db/schema";
import { decrypt, hmacHex, randomToken } from "./crypto";
import { enqueueJob, backoffMs } from "./jobs";
import { fetch as undiciFetch } from "undici";
import { assertPublicDestination, safeAgent, validateWebhookUrlSyntax } from "./ssrf";
import type { Env } from "./ledger";

export const WEBHOOK_EVENTS = [
  "payment.paid",
  "payment.expired",
  "payment.cancelled",
  "payment.failed",
  "refund.succeeded",
  "refund.failed",
  "withdrawal.paid",
  "withdrawal.rejected",
] as const;
export const MAX_DELIVERY_ATTEMPTS = 8;

export async function emitMerchantEvent(tx: DbOrTx, userId: string, env: Env, type: string, data: Record<string, unknown>) {
  const eps = await tx.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.userId, userId), eq(webhookEndpoints.env, env), eq(webhookEndpoints.active, true)));
  const eventId = `evt_${randomToken(12)}`;
  for (const ep of eps) {
    if (!ep.events.includes(type)) continue;
    const [d] = await tx
      .insert(webhookDeliveries)
      .values({ endpointId: ep.id, userId, env, eventId, eventType: type, payload: { id: eventId, type, env, created_at: new Date().toISOString(), data }, nextAttemptAt: new Date() })
      .returning({ id: webhookDeliveries.id });
    await enqueueJob("webhook.deliver", { deliveryId: d.id }, { tx, maxAttempts: 1 });
  }
}

export function signPayload(secret: string, body: string, ts = Math.floor(Date.now() / 1000)) {
  return { header: `t=${ts},v1=${hmacHex(secret, `${ts}.${body}`)}`, ts };
}

/** Satu kali percobaan pengiriman. Penjadwalan ulang dilakukan di sini (bukan oleh job queue). */
export async function deliverWebhook(deliveryId: string, opts: { manual?: boolean } = {}) {
  const [d] = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.id, deliveryId));
  if (!d || (d.status === "succeeded" && !opts.manual)) return;
  const [ep] = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, d.endpointId));
  if (!ep) return;
  const body = JSON.stringify(d.payload);
  const attempts = d.attempts + 1;
  let code: number | null = null;
  let error: string | null = null;
  try {
    const url = validateWebhookUrlSyntax(ep.url);
    await assertPublicDestination(url);
    const sig = signPayload(decrypt(ep.secretEnc), body);
    const res = await undiciFetch(url, {
      dispatcher: safeAgent,
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "FxBPay-Webhook/1.0", "FxB-Signature": sig.header, "FxB-Event-Id": d.eventId, "FxB-Event-Type": d.eventType },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    code = res.status;
    await res.body?.cancel().catch(() => {});
    if (res.status < 200 || res.status >= 300) error = `HTTP ${res.status}`;
  } catch (e) {
    error = (e as Error).message.slice(0, 500);
  }
  const ok = error === null;
  const final = !ok && attempts >= MAX_DELIVERY_ATTEMPTS;
  await db
    .update(webhookDeliveries)
    .set({
      attempts,
      status: ok ? "succeeded" : final ? "failed" : "pending",
      lastResponseCode: code,
      lastError: error,
      nextAttemptAt: ok || final ? null : new Date(Date.now() + backoffMs(attempts)),
      updatedAt: new Date(),
    })
    .where(eq(webhookDeliveries.id, d.id));
  if (!ok && !final) {
    await enqueueJob("webhook.deliver", { deliveryId: d.id }, { runAt: new Date(Date.now() + backoffMs(attempts)), maxAttempts: 1, dedupeKey: `wh:${d.id}:${attempts}` });
  }
  return { ok, code, error };
}

export async function resendDelivery(userId: string | null, deliveryId: string) {
  const cond = userId ? and(eq(webhookDeliveries.id, deliveryId), eq(webhookDeliveries.userId, userId)) : eq(webhookDeliveries.id, deliveryId);
  const [d] = await db.select({ id: webhookDeliveries.id }).from(webhookDeliveries).where(cond);
  if (!d) return null;
  await db.update(webhookDeliveries).set({ status: "pending", updatedAt: new Date(), attempts: sql`least(${webhookDeliveries.attempts}, ${MAX_DELIVERY_ATTEMPTS - 1})` }).where(eq(webhookDeliveries.id, d.id));
  return deliverWebhook(d.id, { manual: true });
}
