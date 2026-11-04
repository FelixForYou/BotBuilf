import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { db } from "@/lib/db";
import { withdrawals } from "@/lib/db/schema";
import { getUserBalances } from "@/lib/ledger";
import { getSetting } from "@/lib/settings";
import { WITHDRAWAL_LABEL } from "@/lib/withdrawals";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, Card, EmptyState, ListGroup, ListRow, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { WithdrawForm } from "./withdraw-form";

export const metadata = { title: "Tarik saldo" };

export default async function Withdraw() {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const [b, list, fees, limits] = await Promise.all([
    getUserBalances(db, user.id, env),
    db.select().from(withdrawals).where(and(eq(withdrawals.userId, user.id), eq(withdrawals.env, env))).orderBy(desc(withdrawals.createdAt)).limit(50),
    getSetting("fees"),
    getSetting("limits"),
  ]);
  const tone = (s: string) => (s === "PAID" ? "mint" : s === "REJECTED" || s === "FAILED" ? "red" : s === "UNCERTAIN" ? "amber" : "blue");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tarik saldo" subtitle={`Saldo tersedia ${formatRupiah(b.available)}`} />
      <Card>
        <WithdrawForm available={b.available.toString()} fee={fees.withdrawalFlat} min={limits.withdrawalMin} max={limits.withdrawalMax} disabled={user.status !== "active"} />
      </Card>
      <div className="mt-4">
        <Notice tone="info" title="Pencairan manual">Penarikan ditinjau admin lalu ditransfer manual dengan bukti transfer tercatat. Pencairan otomatis baru aktif bila produk Disbursement DANA tersedia dan disetujui untuk akun merchant platform.</Notice>
      </div>
      <SectionTitle>Riwayat penarikan</SectionTitle>
      {list.length === 0 ? <EmptyState icon="arrowUpRight" title="Belum ada penarikan" /> : (
        <ListGroup>
          {list.map((w) => (
            <ListRow key={w.id} icon="bank" title={`${w.destinationBank} · ${w.destinationAccount}`} subtitle={`${fmtDate(w.createdAt)} · a.n. ${w.destinationName}${w.rejectReason ? ` · ${w.rejectReason}` : ""}${w.proofReference ? ` · Bukti ${w.proofReference}` : ""}`} chevron={false}
              right={<div className="flex flex-col items-end gap-1"><span className="tabular text-sm font-bold">{formatRupiah(w.amount)}</span><Badge tone={tone(w.status)}>{WITHDRAWAL_LABEL[w.status]}</Badge></div>} />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
