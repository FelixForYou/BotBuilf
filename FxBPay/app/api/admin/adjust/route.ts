import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { adjustBalance } from "@/lib/admin-ledger";
import { parseRupiah } from "@/lib/money";
import { verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";

const S = z.object({
  userId: z.string().uuid(),
  env: z.enum(["sandbox", "production"]),
  direction: z.enum(["credit", "debit"]),
  amount: z.union([z.string(), z.number()]).transform((v) => parseRupiah(v)),
  reason: z.string().trim().min(10, "Alasan minimal 10 karakter").max(300),
  password: z.string().min(1, "Konfirmasi password admin"),
});
export const POST = authed({ admin: true, schema: S, limit: 20 }, async ({ auth, actor, input }) => {
  if (!(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Password admin salah");
  const j = await adjustBalance(actor, input);
  return { message: "Jurnal koreksi dicatat", journalId: j.journalId };
});
