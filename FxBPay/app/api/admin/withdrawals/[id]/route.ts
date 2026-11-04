import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { reviewWithdrawal } from "@/lib/withdrawals";

const S = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("processing") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "Alasan wajib") }),
  z.object({ action: z.literal("failed"), reason: z.string().trim().min(3, "Alasan wajib") }),
  z.object({ action: z.literal("uncertain"), reason: z.string().trim().min(3, "Alasan wajib") }),
  z.object({ action: z.literal("paid"), proofReference: z.string().trim().min(4, "Nomor referensi bukti wajib"), proofNote: z.string().trim().max(300).optional() }),
]);
export const POST = authed<z.infer<typeof S>, { id: string }>({ admin: true, schema: S }, async ({ actor, input, params }) => {
  const w = await reviewWithdrawal(actor, params.id, input);
  return { message: `Status: ${w.status}` };
});
