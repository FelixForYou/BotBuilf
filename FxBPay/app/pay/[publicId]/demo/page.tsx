import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/session";
import { getCheckout } from "@/lib/checkout";
import { formatRupiah } from "@/lib/money";
import { Logo } from "@/components/icons";
import { ActionButton } from "@/components/client";
import { Card, Notice, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Simulator checkout DEMO — khusus sandbox, hanya pemilik pembayaran atau admin. */
export default async function DemoCheckout({ params }: { params: Promise<{ publicId: string }> }) {
  const row = await getCheckout((await params).publicId);
  if (!row || row.p.provider !== "demo" || row.p.env !== "sandbox") notFound();
  const a = await getAuth();
  const allowed = a?.session.mfaPassed && (a.user.id === row.p.userId || a.user.role === "admin");
  if (row.p.capturedJournalId) redirect(`/pay/${row.p.publicId}/selesai`);
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-2.5"><Logo size={30} /><span className="font-extrabold">Checkout DEMO</span></header>
      <Notice tone="warn" title="Ini bukan halaman DANA">Simulator untuk Sandbox saat kredensial DANA belum dikonfigurasi. Tidak ada uang yang berpindah dan saldo Production tidak terpengaruh.</Notice>
      <Card className="mt-4 text-center">
        <div className="text-sm text-muted">{row.store}</div>
        <div className="tabular mt-1 text-3xl font-extrabold">{formatRupiah(row.p.amount)}</div>
      </Card>
      {allowed ? (
        <div className="mt-4 grid gap-3">
          <ActionButton action={`/api/pay/${row.p.publicId}/demo`} body={{ result: "success" }} variant="primary" size="lg" icon="check">Simulasikan pembayaran berhasil</ActionButton>
          <ActionButton action={`/api/pay/${row.p.publicId}/demo`} body={{ result: "fail" }} variant="danger" size="lg" icon="x">Simulasikan pembayaran ditutup</ActionButton>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Notice tone="info">Simulasi hanya dapat dijalankan oleh pemilik link (merchant) atau admin yang sudah masuk.</Notice>
          <LinkButton href="/masuk" variant="secondary" className="w-full">Masuk sebagai merchant</LinkButton>
        </div>
      )}
    </div>
  );
}
