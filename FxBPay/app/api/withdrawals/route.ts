import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { currentEnv } from "@/lib/auth/session";
import { requestWithdrawal, quoteWithdrawal } from "@/lib/withdrawals";
import { parseRupiah } from "@/lib/money";
import { verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";

const S = z.object({
  amount: z.union([z.string(), z.number()]).transform((v, ctx) => {
    try {
      return parseRupiah(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "Nominal tidak valid" });
      return z.NEVER;
    }
  }),
  destinationType: z.enum(["bank", "dana"]),
  destinationBank: z.string().trim().max(60).optional().default(""),
  destinationAccount: z.string().trim().max(30),
  destinationName: z.string().trim().max(80),
  password: z.string().optional(),
  idempotencyKey: z.string().max(80).optional(),
  quote: z.boolean().optional(),
});

export const POST = authed({ schema: S, limit: 10 }, async ({ auth, actor, input }) => {
  if (input.quote) {
    const q = await quoteWithdrawal(input.amount);
    return { fee: q.fee.toString(), net: q.net.toString() };
  }
  if (!input.password || !(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Konfirmasi password salah", 400);
  const env = await currentEnv();
  const w = await requestWithdrawal(actor, auth.user.id, env, { ...input, idempotencyKey: input.idempotencyKey || null });
  return { id: w.id, message: "Penarikan diajukan dan saldo dicadangkan", redirect: "/app/penarikan" };
});
