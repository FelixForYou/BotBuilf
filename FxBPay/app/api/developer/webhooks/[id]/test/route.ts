import { and, eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";
import { deliverWebhook } from "@/lib/webhooks-out";
import { randomToken } from "@/lib/crypto";
import { notFound } from "@/lib/errors";
export const POST = authed<Record<string, never>, { id: string }>({ limit: 10 }, async ({ auth, params }) => {
  const [ep] = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.id, params.id), eq(webhookEndpoints.userId, auth.user.id)));
  if (!ep) throw notFound("Endpoint");
  const eventId = `evt_test_${randomToken(10)}`;
  const [d] = await db.insert(webhookDeliveries).values({ endpointId: ep.id, userId: auth.user.id, env: ep.env, eventId, eventType: "ping", payload: { id: eventId, type: "ping", env: ep.env, created_at: new Date().toISOString(), data: { message: "Tes webhook dari FxB Pay" } } }).returning();
  const r = await deliverWebhook(d.id, { manual: true });
  return { message: r?.ok ? `Terkirim (HTTP ${r.code})` : `Gagal: ${r?.error}` };
});
