import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";
import { WEBHOOK_EVENTS } from "@/lib/webhooks-out";
import { fmtDate } from "@/lib/format";
import { Badge, EmptyState, ListGroup, ListRow, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton, CreateWebhook } from "../secret-forms";

export default async function Webhooks() {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const [eps, dels] = await Promise.all([
    db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.userId, user.id), eq(webhookEndpoints.env, env))).orderBy(desc(webhookEndpoints.createdAt)),
    db.select().from(webhookDeliveries).where(and(eq(webhookDeliveries.userId, user.id), eq(webhookDeliveries.env, env))).orderBy(desc(webhookDeliveries.createdAt)).limit(50),
  ]);
  return (
    <>
      <PageHeader title="Webhook" back="/app/developer" subtitle="Event dikirim dengan header FxB-Signature (HMAC-SHA256), retry otomatis dengan backoff hingga 8 kali." action={<CreateWebhook events={[...WEBHOOK_EVENTS]} />} />
      {eps.length === 0 ? <EmptyState icon="webhook" title="Belum ada endpoint" /> : (
        <ListGroup>
          {eps.map((e) => (
            <ListRow key={e.id} icon="webhook" title={<span className="flex items-center gap-2"><span className="mono truncate text-sm">{e.url}</span>{e.active ? <Badge tone="mint">Aktif</Badge> : <Badge>Nonaktif</Badge>}</span>} subtitle={e.events.join(", ")}
              right={<div className="flex flex-wrap justify-end gap-2"><ActionButton action={`/api/developer/webhooks/${e.id}/test`} icon="send">Tes</ActionButton><ActionButton action={`/api/developer/webhooks/${e.id}/toggle`}>{e.active ? "Nonaktifkan" : "Aktifkan"}</ActionButton><ActionButton action={`/api/developer/webhooks/${e.id}/delete`} variant="danger" confirm="Hapus endpoint ini?">Hapus</ActionButton></div>} />
          ))}
        </ListGroup>
      )}
      <SectionTitle>Riwayat pengiriman</SectionTitle>
      {dels.length === 0 ? <EmptyState icon="send" title="Belum ada pengiriman" /> : (
        <TableWrap>
          <table className="table">
            <thead><tr><th>Waktu</th><th>Event</th><th>Status</th><th>Percobaan</th><th>Respons</th><th></th></tr></thead>
            <tbody>
              {dels.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                  <td className="mono text-xs">{d.eventType}</td>
                  <td><Badge tone={d.status === "succeeded" ? "mint" : d.status === "failed" ? "red" : "amber"}>{{ succeeded: "Berhasil", failed: "Gagal", pending: "Menunggu retry" }[d.status]}</Badge></td>
                  <td className="tabular">{d.attempts}</td>
                  <td className="text-xs text-muted">{d.lastResponseCode ?? "—"} {d.lastError ?? ""}{d.nextAttemptAt && d.status === "pending" ? ` · berikutnya ${fmtDate(d.nextAttemptAt)}` : ""}</td>
                  <td><ActionButton action={`/api/developer/deliveries/${d.id}/resend`} icon="refresh">Kirim ulang</ActionButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
