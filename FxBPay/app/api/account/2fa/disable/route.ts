import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import { verifyTotp } from "@/lib/totp";
import { verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";

export const POST = authed({ schema: z.object({ password: z.string().min(1), code: z.string().trim().length(6) }), limit: 5 }, async ({ auth, actor, input }) => {
  if (auth.user.role === "admin") throw new AppError("forbidden", "2FA wajib untuk admin dan tidak dapat dinonaktifkan", 403);
  if (!auth.user.totpEnabled || !auth.user.totpSecretEnc) throw new AppError("not_enabled", "2FA tidak aktif");
  if (!(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Password salah");
  if (verifyTotp(decrypt(auth.user.totpSecretEnc), input.code) === null) throw new AppError("invalid_code", "Kode salah");
  await db.update(users).set({ totpEnabled: false, totpSecretEnc: null, totpLastStep: null }).where(eq(users.id, auth.user.id));
  await audit(actor, "account.2fa_disable", { type: "user", id: auth.user.id });
  return { message: "2FA dinonaktifkan" };
});
