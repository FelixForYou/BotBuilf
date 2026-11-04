import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { reverseJournal } from "@/lib/admin-ledger";
import { verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";

export const POST = authed({ admin: true, schema: z.object({ journalId: z.string().uuid(), reason: z.string().trim().min(10).max(300), password: z.string().min(1) }), limit: 10 }, async ({ auth, actor, input }) => {
  if (!(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Password admin salah");
  await reverseJournal(actor, input.journalId, input.reason);
  return { message: "Jurnal reversal dicatat" };
});
