"use client";

import { BadgeCheck, Ban } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Confirm } from "@/components/confirm";
import { OrderBadge } from "@/components/order-ui";
import { Button, PageTransition, Segmented, Skeleton, toast } from "@/components/ui";
import { api, fmtDate, fmtIDR } from "@/lib/client";

interface O { id: string; invoice_no: string; email: string; plan_name: string; key_prefix: string; amount: number; status: string; gateway: string; created_at: number; paid_at: number | null; note: string | null }

export default function Page() {
  return <Suspense><AdminOrders /></Suspense>;
}

function AdminOrders() {
  const sp = useSearchParams();
  const router = useRouter();
  const status = sp.get("status") ?? "";
  const [rows, setRows] = useState<O[] | null>(null);
  const [act, setAct] = useState<{ o: O; action: "mark_paid" | "cancel" } | null>(null);
  const load = useCallback(() => api<O[]>(`/api/admin/orders?status=${status}`).then(setRows).catch((e) => toast(e.message, "error")), [status]);
  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Pembayaran</h1>
      <p className="text-[14.5px] text-muted">Order dari Midtrans/Xendit diverifikasi otomatis lewat webhook. Transfer manual diverifikasi di sini.</p>
      <div className="mt-4"><Segmented value={status} onChange={(v) => router.replace(`/admin/orders${v ? `?status=${v}` : ""}`)} options={[{ value: "", label: "Semua" }, { value: "pending", label: "Pending" }, { value: "paid", label: "Lunas" }, { value: "expired", label: "Lainnya" }]} /></div>
      <div className="mt-4 space-y-3">
        {!rows && <Skeleton className="h-40 rounded-[22px]" />}
        {rows?.length === 0 && <p className="py-8 text-center text-muted">Tidak ada order.</p>}
        {rows?.map((o) => (
          <div key={o.id} className="rounded-[22px] bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/dashboard/orders/${o.id}`} className="font-mono text-[13.5px] font-semibold hover:text-mint">{o.invoice_no}</Link>
              <OrderBadge status={o.status} />
              <span className="ml-auto font-semibold">{fmtIDR(o.amount)}</span>
            </div>
            <div className="mt-1 text-[13.5px] text-muted">{o.email} · {o.plan_name} · {o.key_prefix}… · {o.gateway} · {fmtDate(o.created_at, true)}</div>
            {o.note && <div className="mt-1 text-[12.5px] text-subtle">{o.note}</div>}
            {(o.status === "pending" || o.status === "expired") && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" icon={BadgeCheck} onClick={() => setAct({ o, action: "mark_paid" })}>Tandai lunas</Button>
                {o.status === "pending" && <Button size="sm" variant="secondary" icon={Ban} onClick={() => setAct({ o, action: "cancel" })}>Batalkan</Button>}
              </div>
            )}
          </div>
        ))}
      </div>
      <Confirm
        open={!!act}
        onClose={() => setAct(null)}
        danger={act?.action === "cancel"}
        title={act?.action === "mark_paid" ? "Tandai lunas?" : "Batalkan order?"}
        text={act?.action === "mark_paid" ? <>Pastikan dana <b>{act && fmtIDR(act.o.amount)}</b> untuk <b>{act?.o.invoice_no}</b> sudah diterima. Key akan langsung menjadi premium.</> : "Order akan dibatalkan."}
        onConfirm={async () => {
          try {
            await api(`/api/admin/orders/${act!.o.id}`, { body: { action: act!.action } });
            toast(act!.action === "mark_paid" ? "Order lunas & premium aktif." : "Order dibatalkan.");
            void load();
          } catch (e) {
            toast((e as Error).message, "error");
          }
        }}
      />
    </PageTransition>
  );
}
