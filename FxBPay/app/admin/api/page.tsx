import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, users, webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";
import { fmtDate, relTime } from "@/lib/format";
import { Badge, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton } from "@/components/client";

export default async function AdminApi() {
  const [keys, eps, dels] = await Promise.all([
    db.select({ k: apiKeys, email: users.email }).from(apiKeys).innerJoin(users, eq(users.id, apiKeys.userId)).orderBy(desc(apiKeys.createdAt)).limit(100),
    db.select({ e: webhookEndpoints, email: users.email }).from(webhookEndpoints).innerJoin(users, eq(users.id, webhookEndpoints.userId)).limit(100),
    db.select().from(webhookDeliveries).orderBy(desc(webhookDeliveries.createdAt)).limit(50),
  ]);
  return (
    <>
      <PageHeader title="API key & webhook" subtitle="Ringkasan seluruh merchant. Secret tidak pernah ditampilkan." />
      <SectionTitle>API key</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Merchant</th><th>Nama</th><th>Prefix</th><th>Env</th><th>Scope</th><th>Status</th><th>Terakhir dipakai</th></tr></thead><tbody>
        {keys.map(({ k, email }) => <tr key={k.id}><td>{email}</td><td>{k.name}</td><td className="mono text-xs">{k.prefix}…</td><td>{k.env}</td><td className="text-xs">{k.scopes.join(", ")}</td><td>{k.revokedAt ? <Badge tone="red">Dicabut</Badge> : k.expiresAt && k.expiresAt < new Date() ? <Badge tone="amber">Kedaluwarsa</Badge> : <Badge tone="mint">Aktif</Badge>}</td><td>{k.lastUsedAt ? relTime(k.lastUsedAt) : "—"}</td></tr>)}
      </tbody></table></TableWrap>
      <SectionTitle>Endpoint webhook</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Merchant</th><th>URL</th><th>Env</th><th>Status</th></tr></thead><tbody>
        {eps.map(({ e, email }) => <tr key={e.id}><td>{email}</td><td className="mono text-xs">{e.url}</td><td>{e.env}</td><td>{e.active ? <Badge tone="mint">Aktif</Badge> : <Badge>Nonaktif</Badge>}</td></tr>)}
      </tbody></table></TableWrap>
      <SectionTitle>Pengiriman terbaru</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Event</th><th>Status</th><th>Percobaan</th><th>Respons</th><th></th></tr></thead><tbody>
        {dels.map((d) => <tr key={d.id}><td className="whitespace-nowrap">{fmtDate(d.createdAt)}</td><td className="mono text-xs">{d.eventType}</td><td><Badge tone={d.status === "succeeded" ? "mint" : d.status === "failed" ? "red" : "amber"}>{d.status}</Badge></td><td>{d.attempts}</td><td className="text-xs text-muted">{d.lastResponseCode ?? ""} {d.lastError ?? ""}</td><td><ActionButton action={`/api/developer/deliveries/${d.id}/resend`} icon="refresh">Kirim ulang</ActionButton></td></tr>)}
      </tbody></table></TableWrap>
    </>
  );
}
