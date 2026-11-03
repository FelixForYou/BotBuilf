"use client";

import { ChevronRight, Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderBadge } from "@/components/order-ui";
import { Button, EmptyState, PageTransition, Skeleton, toast } from "@/components/ui";
import { api, fmtDate, fmtIDR } from "@/lib/client";

interface Order { id: string; invoice_no: string; plan_name: string; key_name: string; key_prefix: string; amount: number; status: string; gateway: string; action: string; created_at: number }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    api<Order[]>("/api/orders").then(setOrders).catch((e) => toast(e.message, "error"));
  }, []);
  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold">Riwayat order</h1>
          <p className="text-[14.5px] text-muted">Invoice dan status pembayaran premium.</p>
        </div>
        <Button href="/pricing">Beli paket</Button>
      </div>
      <div className="mt-5">
        {!orders ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[22px]" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="Belum ada order" text="Upgrade key ke premium untuk limit lebih besar dan endpoint premium." action={<Button href="/pricing">Lihat paket</Button>} />
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
            {orders.map((o) => (
              <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-4 py-4 transition hover:bg-card-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-soft text-mint"><Receipt className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.plan_name}</span>
                    <OrderBadge status={o.status} />
                  </div>
                  <div className="truncate text-[13px] text-muted">{o.invoice_no} · {fmtDate(o.created_at, true)} · {o.action === "renew" ? "Perpanjang" : "Upgrade"} {o.key_name}</div>
                </div>
                <span className="shrink-0 text-[15px] font-semibold">{fmtIDR(o.amount)}</span>
                <ChevronRight className="size-4 shrink-0 text-subtle" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
