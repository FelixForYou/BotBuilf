"use client";

import { CheckCircle2, ExternalLink, Lightbulb, Power, Printer, Receipt } from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";
import { OrderBadge } from "@/components/order-ui";
import { useApp } from "@/components/providers";
import { Button, Card, CopyButton, InfoTable, PageTransition, ProgressBar, SectionLabel, Skeleton, StatGrid, Steps, toast, type StepState } from "@/components/ui";
import { api, fmtDate, fmtIDR, fmtNum } from "@/lib/client";

interface Order {
  id: string; invoice_no: string; plan_name: string; duration_days: number; daily_limit: number; rpm_limit: number; key_name: string; key_prefix: string; key_expires: number | null;
  amount: number; status: string; gateway: string; action: string; payment_url: string | null; created_at: number; paid_at: number | null; expires_at: number; note: string | null; manual_payment_info: string | null;
}

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { refreshMe } = useApp();
  const [o, setO] = useState<Order | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => api<Order>(`/api/orders/${id}`).then(setO).catch((e) => setErr(e.message)), [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (o?.status !== "pending") return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [o?.status, load]);
  useEffect(() => {
    if (o?.status === "paid") void refreshMe();
  }, [o?.status, refreshMe]);

  if (err) return <Card className="text-danger">{err}</Card>;
  if (!o) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const st: StepState[] =
    o.status === "paid" ? ["done", "done", "done", "done"] : o.status === "pending" ? ["done", "active", "todo", "todo"] : ["done", "error", "todo", "todo"];
  const progress = o.status === "paid" ? 100 : o.status === "pending" ? 45 : 100;
  const left = o.expires_at - Date.now();

  return (
    <PageTransition>
      <div className="flex items-center gap-4">
        <span className="grid size-[64px] shrink-0 place-items-center rounded-[20px] bg-mint-soft text-mint"><Receipt className="size-8" /></span>
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-bold">{o.plan_name}</h1>
          <div className="text-[15px] font-medium text-mint">FxB RestApi</div>
          <OrderBadge status={o.status} />
        </div>
      </div>

      {(o.status === "failed" || o.status === "expired" || o.status === "cancelled") && (
        <Card className="mt-6 text-center">
          <div className="mx-auto grid size-[72px] place-items-center rounded-full bg-danger-soft"><Power className="size-8 text-danger" /></div>
          <h2 className="mt-4 text-[22px] font-bold">{o.status === "expired" ? "Waktu pembayaran habis" : o.status === "cancelled" ? "Order dibatalkan" : "Pembayaran gagal"}</h2>
          <p className="mt-1.5 text-[15px] text-muted">Tidak ada dana yang ditagihkan untuk order ini. Key kamu tidak berubah.</p>
          <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-card-2 px-4 py-3.5 text-left text-[14.5px]"><Lightbulb className="size-5 shrink-0 text-mint" />Buat order baru dari halaman paket.</div>
          <Button size="lg" className="mt-5 w-full" href="/pricing">Coba lagi</Button>
        </Card>
      )}

      {o.status === "paid" && (
        <Card className="mt-6 text-center">
          <CheckCircle2 className="mx-auto size-14 text-mint" />
          <h2 className="mt-3 text-[22px] font-bold">Premium aktif</h2>
          <p className="mt-1 text-[15px] text-muted">Key <b className="text-fg">{o.key_name}</b> sekarang premium hingga {fmtDate(o.key_expires)}.</p>
          <Button size="lg" className="mt-5 w-full" href="/dashboard/keys">Lihat API key</Button>
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between text-[14.5px] text-muted">
          <span>{o.status === "pending" ? "Menunggu pembayaran" : o.status === "paid" ? "Selesai" : "Berhenti"}</span>
          <span>Step {o.status === "paid" ? 4 : 2} of 4</span>
        </div>
        <ProgressBar className="mt-3" value={progress} />
        <StatGrid className="mt-5 !bg-transparent" items={[{ value: fmtIDR(o.amount), label: "Total" }, { value: `${o.duration_days} hari`, label: "Masa aktif" }, { value: o.gateway, label: "Metode" }]} />
        <h3 className="mb-4 mt-6 text-[19px] font-semibold">Langkah order</h3>
        <Steps
          steps={[
            { label: "Order dibuat", time: fmtDate(o.created_at, true), state: st[0] },
            { label: "Pembayaran", sub: o.status === "pending" ? (left > 0 ? `Batas ${fmtDate(o.expires_at, true)}` : "Kedaluwarsa") : undefined, state: st[1], time: o.paid_at ? fmtDate(o.paid_at, true) : undefined },
            { label: "Verifikasi", sub: o.status === "pending" ? (o.gateway === "manual" ? "Dicek admin" : "Otomatis via webhook") : undefined, state: st[2] },
            { label: "Premium aktif", state: st[3] },
          ]}
        />
      </Card>

      {o.status === "pending" && (
        <div className="mt-5 space-y-3">
          {o.payment_url ? (
            <Button size="lg" className="w-full" icon={ExternalLink} onClick={() => (window.location.href = o.payment_url!)}>Bayar sekarang</Button>
          ) : (
            <Card>
              <h3 className="font-semibold">Instruksi pembayaran manual</h3>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-[14.5px] text-muted">{o.manual_payment_info || "Hubungi admin untuk instruksi pembayaran."}</pre>
              <div className="mt-3 flex items-center justify-between rounded-[16px] bg-card-2 px-4 py-3 text-[14px]">
                <span>Sertakan kode: <b className="font-mono">{o.invoice_no}</b></span>
                <CopyButton text={o.invoice_no} small />
              </div>
            </Card>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              try {
                await api(`/api/orders/${o.id}`, { body: { action: "cancel" } });
                toast("Order dibatalkan.", "info");
                void load();
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            Batalkan order
          </Button>
        </div>
      )}

      <SectionLabel right={<button onClick={() => window.print()} className="flex items-center gap-1 text-[14px] text-mint"><Printer className="size-4" />Cetak</button>}>Invoice</SectionLabel>
      <InfoTable
        rows={[
          { label: "No. invoice", value: <span className="font-mono">{o.invoice_no}</span> },
          { label: "Paket", value: `${o.plan_name} (${o.duration_days} hari)` },
          { label: "Limit", value: `${fmtNum(o.daily_limit)}/hari · ${o.rpm_limit}/menit` },
          { label: "API key", value: `${o.key_name} · ${o.key_prefix}…` },
          { label: "Jenis", value: o.action === "renew" ? "Perpanjangan" : "Upgrade" },
          { label: "Dibuat", value: fmtDate(o.created_at, true) },
          { label: "Dibayar", value: fmtDate(o.paid_at, true) },
          { label: "Total", value: <b className="text-fg">{fmtIDR(o.amount)}</b> },
        ]}
      />
      {o.note && <p className="mt-3 text-[13px] text-muted">Catatan: {o.note}</p>}
    </PageTransition>
  );
}
