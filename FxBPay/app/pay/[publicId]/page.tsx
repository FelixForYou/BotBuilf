import { notFound } from "next/navigation";
import { getCheckout } from "@/lib/checkout";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/payments/status";
import { Logo, Icon } from "@/components/icons";
import { Badge, KV, LinkButton } from "@/components/ui";
import { ErrorCard } from "@/components/error-card";
import { PayButton } from "./pay-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function Checkout({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const row = await getCheckout(publicId);
  if (!row) notFound();
  const { p, store } = row;
  const payable = (p.status === "CREATED" || p.status === "PENDING") && p.expiresAt > new Date() && row.merchantStatus === "active";
  const paid = !!p.capturedJournalId;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <header className="mb-6 flex items-center gap-2.5">
        <Logo size={30} />
        <div className="flex-1 font-extrabold">FxB Pay</div>
        {p.env === "sandbox" && <Badge tone="amber">{p.provider === "demo" ? "SANDBOX · DEMO" : "SANDBOX"}</Badge>}
      </header>
      {paid ? (
        <div className="card animate-enter p-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-ink"><Icon name="check" size={32} strokeWidth={2.6} /></span>
          <h1 className="mt-5 text-2xl font-extrabold">Pembayaran lunas</h1>
          <p className="mt-1 text-muted">Terverifikasi {fmtDate(p.paidAt)}</p>
          <div className="mt-5 text-3xl font-extrabold tabular">{formatRupiah(p.amount)}</div>
          <LinkButton href={`/api/pay/${p.publicId}/receipt`} external icon="download" className="mt-6 w-full" size="lg">Unduh bukti pembayaran</LinkButton>
        </div>
      ) : !payable ? (
        <ErrorCard
          title={row.merchantStatus !== "active" ? "Merchant tidak aktif" : p.status === "EXPIRED" || p.expiresAt <= new Date() ? "Link pembayaran kedaluwarsa" : `Pembayaran ${STATUS_LABEL[p.status].toLowerCase()}`}
          message="Pembayaran ini tidak dapat diproses lagi. Hubungi penjual untuk meminta link pembayaran baru."
          summary={[["Penjual", store || "Merchant"], ["Deskripsi", p.description], ["Nominal", formatRupiah(p.amount)], ["Referensi", p.partnerReferenceNo]]}
          detail={`status=${p.status}\nreferensi=${p.partnerReferenceNo}\nberlaku_hingga=${p.expiresAt.toISOString()}`}
        />
      ) : (
        <div className="animate-enter space-y-4">
          <div className="card p-6">
            <div className="text-sm text-muted">Bayar ke</div>
            <div className="text-xl font-extrabold">{store || "Merchant"}</div>
            <div className="mt-1 text-sm text-muted">{p.description}</div>
            <div className="mt-6 text-sm text-muted">Total pembayaran</div>
            <div className="tabular text-[2.5rem] font-extrabold leading-tight tracking-tight">{formatRupiah(p.amount)}</div>
            <div className="mt-4 rounded-2xl bg-surface px-4">
              <KV items={[
                ["Nominal", formatRupiah(p.baseAmount)],
                ["Biaya layanan", p.feeBearer === "customer" ? formatRupiah(p.fee) : "Ditanggung penjual"],
                ["Total", <b key="t">{formatRupiah(p.amount)}</b>],
                ...(p.orderRef ? ([["Referensi", p.orderRef]] as [string, string][]) : []),
              ]} />
            </div>
          </div>
          <PayButton publicId={p.publicId} expiresAt={p.expiresAt.toISOString()} method={p.paymentMethod} demo={p.provider === "demo"} existingQris={p.providerPaymentCode} />
          <p className="flex items-start gap-2 px-2 text-xs text-subtle"><Icon name="shield" size={16} className="shrink-0" /> Pembayaran diproses di halaman resmi DANA. FxB Pay tidak pernah meminta PIN atau OTP DANA Anda.</p>
        </div>
      )}
      <p className="mt-auto pt-8 text-center text-xs text-subtle">FxB Pay — BY FELIXIORITY</p>
    </div>
  );
}
