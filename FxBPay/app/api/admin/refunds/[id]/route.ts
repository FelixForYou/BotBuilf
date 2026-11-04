import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { executeRefund, finalizeRefund } from "@/lib/refunds";

const S = z.discriminatedUnion("action", [
  z.object({ action: z.literal("retry") }),
  z.object({ action: z.literal("mark_success"), note: z.string().trim().min(5, "Catat bukti konfirmasi dari DANA") }),
  z.object({ action: z.literal("mark_failed"), note: z.string().trim().min(5, "Catat bukti konfirmasi dari DANA") }),
]);
export const POST = authed<z.infer<typeof S>, { id: string }>({ admin: true, schema: S }, async ({ actor, input, params }) => {
  if (input.action === "retry") {
    const r = await executeRefund(params.id); // partnerRefundNo sama → aman (idempoten di DANA)
    return { message: `Status refund: ${r.status}` };
  }
  const r = await finalizeRefund(params.id, input.action === "mark_success" ? "success" : "failed", { note: input.note, actor });
  return { message: `Status refund: ${r.status}` };
});
