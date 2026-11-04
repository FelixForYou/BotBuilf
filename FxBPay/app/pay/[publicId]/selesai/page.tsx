import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getCheckout } from "@/lib/checkout";
import { db } from "@/lib/db";
import { paymentEvents } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/money";
import { Logo } from "@/components/icons";
import { AutoRefresh } from "@/components/client";
import { Card, LinkButton, Notice } from "@/components/ui";
import { PaymentTimeline } from "@/components/payment-timeline";
import { ErrorCard } from "@/components/error-card";
import { STATUS_LABEL } from "@/lib/payments/status";

export const dynamic = "force-dynamic";

/**
 * Halaman kembali dari DANA. Status SELALU dibaca dari database (hasil notifikasi terverifikasi / query resmi).
 * Kedatangan di halaman ini BUKAN bukti pembayaran.
 */
export default async function Finish({ params }: { params: Promise<{ publicId: string }> }) {
  const row = await getCheckout((await params).publicId);
  if (!row) notFound();
  const { p } = row;
  const events = await db.select().from(paymentEvents).where(eq(paymentEvents.paymentId, p.id)).orderBy(asc(paymentEvents.id));
  const paid = !!p.capturedJournalId;
  const failed = !paid && ["EXPIRED", "FAILED", "CANCELLED"].includes(p.status);
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <AutoRefresh until={paid || failed} everyMs={3000} />
      <header className="mb-6 flex items-center gap-2.5"><Logo size={30} /><span className="font-extrabold">FxB Pay</span></header>
      {failed ? (
        <ErrorCard
          title="Pembayaran tidak berhasil"
          message={`Status: ${STATUS_LABEL[p.status]}. Tidak ada dana yang dicatat untuk transaksi ini.`}
          summary={[["Penjual", row.store || "Merchant"], ["Nominal", formatRupiah(p.amount)], ["Referensi", p.partnerReferenceNo]]}
          action={<LinkButton href={`/pay/${p.publicId}`} size="lg" className="w-full" icon="refresh">Coba lagi</LinkButton>}
          detail={events.map((e) => `${e.createdAt.toISOString()} ${e.fromStatus ?? "-"} → ${e.toStatus} (${e.source}) ${e.note}`).join("\n")}
        />
      ) : (
        <div className="space-y-4">
          <Card className="text-center">
            <div className="text-sm text-muted">{row.store}</div>
            <div className="tabular mt-1 text-3xl font-extrabold">{formatRupiah(p.amount)}</div>
            <div className="mt-1 text-sm text-muted">{p.description}</div>
          </Card>
          {!paid && <Notice tone="info" title="Menunggu konfirmasi DANA">Kami sedang menunggu konfirmasi resmi dari DANA. Halaman ini diperbarui otomatis — jangan bayar dua kali.</Notice>}
          <Card><PaymentTimeline p={p} events={events} /></Card>
          {paid && <LinkButton href={`/api/pay/${p.publicId}/receipt`} external icon="download" size="lg" className="w-full">Unduh bukti pembayaran</LinkButton>}
        </div>
      )}
    </div>
  );
}
