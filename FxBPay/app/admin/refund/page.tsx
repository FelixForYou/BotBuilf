import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { payments, refunds } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, EmptyState, Notice, PageHeader, TableWrap } from "@/components/ui";
import { ActionButton } from "@/components/client";

export default async function AdminRefunds() {
  const rows = await db.select({ r: refunds, ref: payments.partnerReferenceNo, provider: payments.provider }).from(refunds).innerJoin(payments, eq(payments.id, refunds.paymentId)).orderBy(desc(refunds.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Refund" />
      <div className="mb-4"><Notice tone="info">Refund berstatus &quot;Belum pasti&quot; (timeout / diproses asinkron oleh DANA) dapat dicoba ulang dengan nomor refund yang sama — aman karena idempoten di DANA. Tandai berhasil/gagal hanya setelah mengonfirmasi ke DANA.</Notice></div>
      {rows.length === 0 ? <EmptyState icon="arrowLeft" title="Belum ada refund" /> : (
        <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Pembayaran</th><th>Env</th><th className="text-right">Nominal</th><th>Status</th><th>Info</th><th></th></tr></thead><tbody>
          {rows.map(({ r, ref, provider }) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td>
              <td><Link className="mono text-xs text-mint" href={`/admin/transaksi/${r.paymentId}`}>{ref}</Link><div className="text-xs text-muted">{r.reason}</div></td>
              <td>{r.env}{provider === "demo" && " · demo"}</td>
              <td className="tabular text-right">{formatRupiah(r.amount)}</td>
              <td><Badge tone={r.status === "SUCCEEDED" ? "mint" : r.status === "FAILED" ? "red" : "amber"}>{{ PENDING: "Diproses", SUCCEEDED: "Berhasil", FAILED: "Gagal", UNCERTAIN: "Belum pasti" }[r.status]}</Badge></td>
              <td className="text-xs text-muted">{r.partnerRefundNo}<br />{r.providerResponseCode} {r.failureReason}</td>
              <td>{(r.status === "UNCERTAIN" || r.status === "PENDING") && <div className="flex flex-col gap-1.5">
                <ActionButton action={`/api/admin/refunds/${r.id}`} body={{ action: "retry" }} icon="refresh">Coba ulang</ActionButton>
                <ActionButton action={`/api/admin/refunds/${r.id}`} body={{ action: "mark_success" }} prompt={{ key: "note", label: "Bukti konfirmasi DANA:", required: true }}>Tandai berhasil</ActionButton>
                <ActionButton action={`/api/admin/refunds/${r.id}`} body={{ action: "mark_failed" }} prompt={{ key: "note", label: "Bukti konfirmasi DANA:", required: true }} variant="danger">Tandai gagal</ActionButton>
              </div>}</td>
            </tr>
          ))}
        </tbody></table></TableWrap>
      )}
    </>
  );
}
