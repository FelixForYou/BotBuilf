import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, withdrawals, type WithdrawalStatus } from "@/lib/db/schema";
import { WITHDRAWAL_LABEL } from "@/lib/withdrawals";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { ActionButton, ActionForm, SheetTrigger } from "@/components/client";
import { EnvTabs, pickEnv } from "@/components/env-tabs";

const OPEN: WithdrawalStatus[] = ["PENDING_REVIEW", "APPROVED", "PROCESSING", "UNCERTAIN"];
export default async function AdminWithdrawals({ searchParams }: { searchParams: Promise<{ env?: string; all?: string }> }) {
  const sp = await searchParams;
  const env = pickEnv(sp.env);
  const list = await db.select({ w: withdrawals, store: users.storeName, email: users.email }).from(withdrawals).innerJoin(users, eq(users.id, withdrawals.userId))
    .where(sp.all ? eq(withdrawals.env, env) : inArray(withdrawals.status, OPEN)).orderBy(desc(withdrawals.createdAt)).limit(100);
  const rows = list.filter((r) => r.w.env === env);
  return (
    <>
      <PageHeader title="Penarikan" subtitle={sp.all ? "Semua penarikan" : "Menunggu tindakan"} action={<a className="btn btn-secondary btn-sm" href={`/admin/penarikan?env=${env}${sp.all ? "" : "&all=1"}`}>{sp.all ? "Hanya yang terbuka" : "Tampilkan semua"}</a>} />
      <EnvTabs env={env} base="/admin/penarikan" extra={sp.all ? "&all=1" : ""} />
      <div className="mb-4"><Notice tone="info">Pencairan dilakukan manual: transfer dari rekening platform, lalu catat nomor referensi bukti transfer. Status &quot;Perlu rekonsiliasi&quot; wajib dikonfirmasi ke bank sebelum ditandai gagal atau dicoba ulang.</Notice></div>
      {rows.length === 0 ? <EmptyState icon="arrowUpRight" title="Tidak ada penarikan" /> : (
        <div className="space-y-3">
          {rows.map(({ w, store, email }) => (
            <Card key={w.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold">{store || email}<Badge tone={w.status === "PAID" ? "mint" : w.status === "UNCERTAIN" ? "amber" : w.status === "REJECTED" || w.status === "FAILED" ? "red" : "blue"}>{WITHDRAWAL_LABEL[w.status]}</Badge></div>
                  <div className="mt-1 text-sm text-muted">{w.destinationBank} · <span className="mono">{w.destinationAccount}</span> · a.n. {w.destinationName}</div>
                  <div className="text-xs text-subtle">{fmtDate(w.createdAt)}{w.proofReference && ` · bukti ${w.proofReference}`}{w.rejectReason && ` · ${w.rejectReason}`}</div>
                </div>
                <div className="text-right"><div className="tabular text-xl font-extrabold">{formatRupiah(w.net)}</div><div className="text-xs text-muted">dari {formatRupiah(w.amount)} · biaya {formatRupiah(w.fee)}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {w.status === "PENDING_REVIEW" && <ActionButton action={`/api/admin/withdrawals/${w.id}`} body={{ action: "approve" }} variant="primary" icon="check">Setujui</ActionButton>}
                {["APPROVED", "PROCESSING", "UNCERTAIN"].includes(w.status) && (
                  <SheetTrigger title="Tandai dicairkan" label="Tandai dicairkan" icon="check" size="sm">
                    <>
                      <ActionForm action={`/api/admin/withdrawals/${w.id}`} extra={{ action: "paid" }} submit="Simpan bukti pencairan">
                        <Notice tone="info">Transfer {formatRupiah(w.net)} ke {w.destinationBank} {w.destinationAccount} a.n. {w.destinationName}.</Notice>
                        <div><label className="label" htmlFor={`pr${w.id}`}>Nomor referensi transfer</label><input id={`pr${w.id}`} name="proofReference" className="input" /></div>
                        <div><label className="label" htmlFor={`pn${w.id}`}>Catatan</label><input id={`pn${w.id}`} name="proofNote" className="input" placeholder="opsional" /></div>
                      </ActionForm>
                    </>
                  </SheetTrigger>
                )}
                {w.status === "APPROVED" && <ActionButton action={`/api/admin/withdrawals/${w.id}`} body={{ action: "processing" }} icon="clock">Sedang diproses</ActionButton>}
                {["APPROVED", "PROCESSING"].includes(w.status) && <ActionButton action={`/api/admin/withdrawals/${w.id}`} body={{ action: "uncertain" }} prompt={{ key: "reason", label: "Mengapa status tidak pasti?", required: true }} icon="alert">Tidak pasti</ActionButton>}
                {["PENDING_REVIEW", "APPROVED"].includes(w.status) && <ActionButton action={`/api/admin/withdrawals/${w.id}`} body={{ action: "reject" }} prompt={{ key: "reason", label: "Alasan penolakan (dikirim ke pengguna):", required: true }} variant="danger" icon="x">Tolak</ActionButton>}
                {["APPROVED", "PROCESSING", "UNCERTAIN"].includes(w.status) && <ActionButton action={`/api/admin/withdrawals/${w.id}`} body={{ action: "failed" }} prompt={{ key: "reason", label: "Hasil konfirmasi bank (mis. 'dikonfirmasi tidak terkirim'):", required: true }} variant="danger">Gagal final</ActionButton>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
