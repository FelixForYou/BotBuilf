import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ledgerAccounts, ledgerEntries, ledgerJournals, paymentEvents, payments, providerNotifications, refunds, users } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { ACCOUNT_LABEL, JOURNAL_LABEL } from "@/lib/ledger-view";
import { Badge, Card, EnvBadge, KV, Notice, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { PaymentStatusBadge } from "@/components/status";
import { PaymentTimeline } from "@/components/payment-timeline";

export default async function AdminTxDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [p] = await db.select().from(payments).where(eq(payments.id, id));
  if (!p) notFound();
  const [[owner], events, notifs, rf, entries] = await Promise.all([
    db.select().from(users).where(eq(users.id, p.userId)),
    db.select().from(paymentEvents).where(eq(paymentEvents.paymentId, p.id)).orderBy(asc(paymentEvents.id)),
    db.select().from(providerNotifications).where(eq(providerNotifications.partnerReferenceNo, p.partnerReferenceNo)).orderBy(desc(providerNotifications.receivedAt)),
    db.select().from(refunds).where(eq(refunds.paymentId, p.id)),
    db.select({ j: ledgerJournals, e: ledgerEntries, kind: ledgerAccounts.kind }).from(ledgerEntries).innerJoin(ledgerJournals, eq(ledgerJournals.id, ledgerEntries.journalId)).innerJoin(ledgerAccounts, eq(ledgerAccounts.id, ledgerEntries.accountId)).where(eq(ledgerJournals.referenceId, p.id)).orderBy(asc(ledgerEntries.id)),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={p.description} back="/admin/transaksi" subtitle={<span className="flex flex-wrap items-center gap-2"><PaymentStatusBadge status={p.status} /><EnvBadge env={p.env} demo={p.provider === "demo"} /><Link href={`/admin/pengguna/${owner.id}`} className="text-mint">{owner.storeName || owner.email}</Link></span>} />
      {p.needsReview && (
        <div className="mb-4 space-y-2">
          <Notice tone="warn" title="Perlu tinjauan">{p.reviewReason}</Notice>
          <ActionButton action={`/api/admin/payments/${p.id}/review`} prompt={{ key: "note", label: "Catatan hasil tinjauan:", required: true }} icon="check" size="md">Tandai sudah ditinjau</ActionButton>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><PaymentTimeline p={p} events={events} /></Card>
        <Card><KV items={[["Nominal", formatRupiah(p.amount)], ["Biaya", formatRupiah(p.fee)], ["Bersih", formatRupiah(p.net)], ["Direfund", formatRupiah(p.refundedAmount)], ["Ref FxB", p.partnerReferenceNo], ["Ref DANA", p.providerReferenceNo ?? "—"], ["Status DANA", p.providerStatus ?? "—"], ["Dibuat via", p.createdVia], ["Kedaluwarsa", fmtDate(p.expiresAt)], ["Callback terlambat", p.lateCallback ? "Ya" : "Tidak"]]} /></Card>
      </div>
      {p.provider === "dana" && <div className="mt-4"><ActionButton action={`/api/payments/${p.id}/sync`} icon="refresh" size="md">Query status resmi ke DANA</ActionButton></div>}
      <SectionTitle>Jurnal ledger</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Jurnal</th><th>Akun</th><th className="text-right">Debit</th><th className="text-right">Kredit</th></tr></thead><tbody>
        {entries.length === 0 && <tr><td colSpan={5} className="text-muted">Belum ada entri</td></tr>}
        {entries.map(({ j, e, kind }) => <tr key={e.id}><td className="whitespace-nowrap">{fmtDate(e.createdAt)}</td><td>{JOURNAL_LABEL[j.type] ?? j.type}</td><td>{ACCOUNT_LABEL[kind]}</td><td className="tabular text-right">{e.debit ? formatRupiah(e.debit) : ""}</td><td className="tabular text-right">{e.credit ? formatRupiah(e.credit) : ""}</td></tr>)}
      </tbody></table></TableWrap>
      <SectionTitle>Notifikasi provider</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Diterima</th><th>Signature</th><th>Hasil</th><th>Detail</th></tr></thead><tbody>
        {notifs.length === 0 && <tr><td colSpan={4} className="text-muted">Belum ada</td></tr>}
        {notifs.map((n) => <tr key={n.id}><td className="whitespace-nowrap">{fmtDate(n.receivedAt)}</td><td>{n.signatureValid ? <Badge tone="mint">{n.verifiedWith === "local_harness" ? "Harness lokal" : "DANA"}</Badge> : <Badge tone="red">Tidak valid</Badge>}</td><td className="mono text-xs">{n.outcome}</td><td className="text-xs text-muted">{n.detail}</td></tr>)}
      </tbody></table></TableWrap>
      {rf.length > 0 && (<><SectionTitle>Refund</SectionTitle><Card><KV items={rf.map((r) => [`${fmtDate(r.createdAt)} · ${r.partnerRefundNo}`, `${formatRupiah(r.amount)} · ${r.status}`])} /></Card></>)}
    </div>
  );
}
