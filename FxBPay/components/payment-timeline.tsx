import type { Payment } from "@/lib/payments/service";
import type { paymentEvents } from "@/lib/db/schema";
import { fmtDate } from "@/lib/format";
import { Timeline, type Step } from "./ui";
import { STATUS_LABEL } from "@/lib/payments/status";
import { formatRupiah } from "@/lib/money";

type Ev = typeof paymentEvents.$inferSelect;

/** Dibuat → Menunggu Pembayaran → Pembayaran Terverifikasi → Saldo Dicatat (+ settlement terpisah). */
export function paymentSteps(p: Payment, events: Ev[]): { main: Step[]; settlement: Step[] } {
  const at = (s: string) => events.find((e) => e.toStatus === s && e.fromStatus !== s)?.createdAt;
  const paid = !!p.capturedJournalId;
  const terminalFail = ["EXPIRED", "FAILED", "CANCELLED"].includes(p.status) && !paid;
  const pendingAt = at("PENDING");
  const main: Step[] = [
    { title: "Dibuat", subtitle: fmtDate(p.createdAt), state: "done" },
    {
      title: "Menunggu pembayaran",
      subtitle: pendingAt ? `Checkout dibuka ${fmtDate(pendingAt)}` : terminalFail ? undefined : `Berlaku hingga ${fmtDate(p.expiresAt)}`,
      state: paid || pendingAt ? (paid ? "done" : terminalFail ? "failed" : "current") : terminalFail ? "failed" : "current",
    },
    terminalFail
      ? { title: STATUS_LABEL[p.status], subtitle: events.filter((e) => e.toStatus === p.status).at(-1)?.note ?? fmtDate(p.updatedAt), state: "failed" }
      : { title: "Pembayaran terverifikasi", subtitle: paid ? `${fmtDate(p.paidAt)} · ${p.provider === "dana" ? "dikonfirmasi DANA" : "simulasi DEMO"}${p.lateCallback ? " · callback terlambat" : ""}` : "Menunggu konfirmasi server dari DANA", state: paid ? "done" : "pending" },
    { title: "Saldo dicatat", subtitle: paid ? (p.releasedAt ? "Masuk saldo tersedia" : `Saldo tertahan hingga ${fmtDate(p.heldUntil)}`) : undefined, state: paid ? "done" : terminalFail ? "pending" : "pending" },
  ];
  if (p.refundedAmount > 0n || p.status === "REFUND_PENDING") main.push({ title: STATUS_LABEL[p.status], subtitle: `Direfund ${formatRupiah(p.refundedAmount)}`, state: p.status === "REFUND_PENDING" ? "current" : "done" });
  const settlement: Step[] = paid && p.provider === "dana" ? [{ title: p.settledAt ? "Settlement DANA diterima" : "Menunggu settlement DANA ke rekening platform", subtitle: p.settledAt ? fmtDate(p.settledAt) : "Dicatat admin saat dana masuk rekening", state: p.settledAt ? "done" : "current" }] : [];
  return { main, settlement };
}

export function PaymentTimeline({ p, events }: { p: Payment; events: Ev[] }) {
  const { main, settlement } = paymentSteps(p, events);
  return (
    <>
      <Timeline steps={main} />
      {settlement.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Settlement</div>
          <Timeline steps={settlement} />
        </div>
      )}
    </>
  );
}
