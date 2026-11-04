import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { paymentEvents, refunds } from "@/lib/db/schema";
import { getOwnedPayment } from "@/lib/payments/access";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { config } from "@/lib/env";
import { Card, EnvBadge, KV, LinkButton, Notice, PageHeader, SectionTitle, Badge } from "@/components/ui";
import { ActionButton, ActionForm, CopyButton, ShareButton, SheetTrigger, AutoRefresh } from "@/components/client";
import { PaymentStatusBadge } from "@/components/status";
import { PaymentTimeline } from "@/components/payment-timeline";

export default async function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  const p = await getOwnedPayment(auth, (await params).id).catch(() => null);
  if (!p) notFound();
  const [events, rf] = await Promise.all([
    db.select().from(paymentEvents).where(eq(paymentEvents.paymentId, p.id)).orderBy(asc(paymentEvents.id)),
    db.select().from(refunds).where(eq(refunds.paymentId, p.id)).orderBy(desc(refunds.createdAt)),
  ]);
  const link = `${config.appUrl}/pay/${p.publicId}`;
  const open = p.status === "CREATED" || p.status === "PENDING";
  const refundable = ["PAID", "PARTIALLY_REFUNDED"].includes(p.status) && p.purpose === "payment";
  return (
    <div className="mx-auto max-w-3xl">
      <AutoRefresh until={!open} everyMs={6000} />
      <PageHeader title={p.description} back="/app/pembayaran" subtitle={<span className="flex flex-wrap items-center gap-2"><PaymentStatusBadge status={p.status} /><EnvBadge env={p.env} demo={p.provider === "demo"} />{p.needsReview && <Badge tone="amber">Perlu tinjauan</Badge>}</span>} />
      <Card className="text-center">
        <div className="text-sm text-muted">{p.purpose === "topup" ? "Tagihan isi saldo" : "Total ditagihkan"}</div>
        <div className="tabular mt-1 text-4xl font-extrabold tracking-tight">{formatRupiah(p.amount)}</div>
        <div className="mt-1 text-sm text-muted">Anda terima {formatRupiah(p.net)} · biaya {formatRupiah(p.fee)}</div>
        {open && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4 text-left">
              <span className="mono min-w-0 flex-1 truncate text-sm text-muted">{link}</span>
              <CopyButton value={link} label="Salin link" />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <ShareButton url={link} title={p.description} />
              <LinkButton href={`/pay/${p.publicId}`} variant="secondary" icon="external" external>Buka checkout</LinkButton>
            </div>
          </div>
        )}
      </Card>
      {p.needsReview && <div className="mt-4"><Notice tone="warn" title="Ditahan untuk tinjauan admin">{p.reviewReason}</Notice></div>}

      <SectionTitle>Status</SectionTitle>
      <Card><PaymentTimeline p={p} events={events} /></Card>

      <SectionTitle>Detail</SectionTitle>
      <Card>
        <KV items={[
          ["Referensi FxB", <span key="r" className="mono">{p.partnerReferenceNo}</span>],
          ["Referensi pesanan", p.orderRef || "—"],
          ["Referensi DANA", p.providerReferenceNo ?? "—"],
          ["Metode", p.provider === "demo" ? "DEMO (simulasi sandbox)" : p.paymentMethod === "qris" ? "QRIS via DANA" : "Checkout DANA"],
          ["Biaya ditanggung", p.feeBearer === "customer" ? "Pelanggan" : "Merchant"],
          ["Dibuat", fmtDate(p.createdAt)],
          ["Berlaku hingga", fmtDate(p.expiresAt)],
          ["Dibayar", fmtDate(p.paidAt)],
          ["Direfund", formatRupiah(p.refundedAmount)],
        ]} />
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href={`/api/payments/${p.id}/invoice`} variant="secondary" icon="download" external>Invoice PDF</LinkButton>
        {p.capturedJournalId && <LinkButton href={`/api/payments/${p.id}/invoice?kind=receipt`} variant="secondary" icon="receipt" external>Bukti bayar</LinkButton>}
        {p.provider === "dana" && <ActionButton action={`/api/payments/${p.id}/sync`} icon="refresh" size="md">Cek status ke DANA</ActionButton>}
        {open && <ActionButton action={`/api/payments/${p.id}/cancel`} icon="x" variant="danger" size="md" confirm="Batalkan pembayaran ini?">Batalkan</ActionButton>}
        {refundable && (
          <SheetTrigger title="Refund" label="Refund" icon="arrowLeft" variant="secondary">
            <>
              <ActionForm action={`/api/payments/${p.id}/refund`} submit="Ajukan refund" confirm="Saldo tersedia Anda akan dikurangi sebesar nominal refund. Lanjutkan?">
                <Notice tone="info">Refund dipotong dari saldo tersedia Anda dan dikembalikan ke pembeli melalui DANA. Biaya layanan tidak dikembalikan.</Notice>
                <div><label className="label" htmlFor="ramount">Nominal (maks {formatRupiah(p.amount - p.refundedAmount)})</label><input id="ramount" name="amount" inputMode="numeric" className="input tabular" defaultValue={(p.amount - p.refundedAmount).toString()} /></div>
                <div><label className="label" htmlFor="reason">Alasan</label><input id="reason" name="reason" className="input" placeholder="mis. Stok habis" /></div>
              </ActionForm>
            </>
          </SheetTrigger>
        )}
      </div>

      {rf.length > 0 && (
        <>
          <SectionTitle>Refund</SectionTitle>
          <Card>
            <KV items={rf.map((r) => [`${fmtDate(r.createdAt)} · ${r.reason}`, <span key={r.id}>{formatRupiah(r.amount)} · <Badge tone={r.status === "SUCCEEDED" ? "mint" : r.status === "FAILED" ? "red" : "amber"}>{{ PENDING: "Diproses", SUCCEEDED: "Berhasil", FAILED: "Gagal", UNCERTAIN: "Dikonfirmasi" }[r.status]}</Badge></span>])} />
          </Card>
        </>
      )}

      <SectionTitle>Riwayat status</SectionTitle>
      <Card>
        <ol className="row-sep text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3 py-2.5">
              <span className="w-32 shrink-0 text-muted">{fmtDate(e.createdAt)}</span>
              <span className="min-w-0"><span className="font-semibold">{e.fromStatus && e.fromStatus !== e.toStatus ? `${e.fromStatus} → ${e.toStatus}` : e.toStatus}</span> <span className="text-subtle">({e.source})</span>{e.note && <span className="block text-muted">{e.note}</span>}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
