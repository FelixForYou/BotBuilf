import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { getOwnedPayment } from "@/lib/payments/access";
import { requestRefund } from "@/lib/refunds";
import { parseRupiah } from "@/lib/money";

const S = z.object({ amount: z.union([z.string(), z.number()]).transform((v) => parseRupiah(v)), reason: z.string().trim().min(3).max(200) });
export const POST = authed<z.infer<typeof S>, { id: string }>({ schema: S as never, limit: 10 }, async ({ auth, actor, input, params }) => {
  const p = await getOwnedPayment(auth, params.id);
  const r = await requestRefund(actor, { paymentId: p.id, ownerUserId: auth.user.role === "admin" ? null : auth.user.id, amount: input.amount, reason: input.reason });
  const msg = { SUCCEEDED: "Refund berhasil", FAILED: `Refund ditolak: ${r.failureReason ?? ""}`, PENDING: "Refund diproses", UNCERTAIN: "Refund dikirim, status masih dikonfirmasi" }[r.status];
  return { message: msg, status: r.status };
});
