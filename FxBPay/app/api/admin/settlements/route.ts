import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { recordSettlement } from "@/lib/admin-ledger";
import { parseRupiah } from "@/lib/money";

const S = z.object({
  env: z.enum(["sandbox", "production"]),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receivedAmount: z.union([z.string(), z.number()]).transform((v) => parseRupiah(v)),
  bankReference: z.string().trim().min(3).max(80),
  note: z.string().trim().max(300).optional(),
});
export const POST = authed({ admin: true, schema: S }, async ({ actor, input }) => {
  const s = await recordSettlement(actor, { ...input, periodStart: new Date(`${input.periodStart}T00:00:00+07:00`), periodEnd: new Date(`${input.periodEnd}T23:59:59+07:00`) });
  return { message: `Settlement dicatat (${s.paymentCount} transaksi)` };
});
