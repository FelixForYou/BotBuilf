import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { listPayments, parseFilters } from "@/lib/payments/query";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, EmptyState, ListGroup, ListRow, PageHeader } from "@/components/ui";
import { PaymentFilters, Pager } from "@/components/filters";
import { PaymentStatusBadge } from "@/components/status";
import { EnvTabs, pickEnv } from "@/components/env-tabs";

const PER = 30;
export default async function AdminTx({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const env = pickEnv(sp.env);
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await listPayments({ env, ...parseFilters(sp), limit: PER, offset: (page - 1) * PER });
  const owners = items.length ? await db.select({ id: users.id, store: users.storeName, email: users.email }).from(users).where(inArray(users.id, [...new Set(items.map((p) => p.userId))])) : [];
  const name = new Map(owners.map((o) => [o.id, o.store || o.email]));
  void eq;
  return (
    <>
      <PageHeader title="Seluruh transaksi" subtitle={`${total} transaksi`} />
      <EnvTabs env={env} base="/admin/transaksi" />
      <PaymentFilters sp={sp} extra={<input type="hidden" name="env" value={env} />} />
      {items.length === 0 ? <EmptyState icon="search" title="Tidak ada transaksi" /> : (
        <ListGroup>
          {items.map((p) => (
            <ListRow key={p.id} href={`/admin/transaksi/${p.id}`} icon="receipt" title={<span className="flex flex-wrap items-center gap-2">{p.description}{p.needsReview && <Badge tone="amber">Tinjau</Badge>}{p.provider === "demo" && <Badge>DEMO</Badge>}</span>} subtitle={`${name.get(p.userId)} · ${fmtDate(p.createdAt)} · ${p.partnerReferenceNo}`} chevron={false}
              right={<div className="flex flex-col items-end gap-1"><span className="tabular text-sm font-bold">{formatRupiah(p.amount)}</span><PaymentStatusBadge status={p.status} /></div>} />
          ))}
        </ListGroup>
      )}
      <Pager page={page} total={total} perPage={PER} sp={{ ...sp, env }} base="/admin/transaksi" />
    </>
  );
}
