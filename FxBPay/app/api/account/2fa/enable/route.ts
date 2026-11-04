import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import { verifyTotp } from "@/lib/totp";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";

export const POST = authed({ schema: z.object({ code: z.string().trim().length(6, "Kode 6 digit") }), limit: 10 }, async ({ auth, actor, input }) => {
  if (!auth.user.totpSecretEnc) throw new AppError("no_setup", "Mulai pengaturan 2FA terlebih dahulu");
  const step = verifyTotp(decrypt(auth.user.totpSecretEnc), input.code);
  if (step === null) throw new AppError("invalid_code", "Kode salah. Pastikan jam perangkat Anda tepat.");
  await db.update(users).set({ totpEnabled: true, totpLastStep: step }).where(eq(users.id, auth.user.id));
  await db.update(sessions).set({ mfaPassed: true }).where(eq(sessions.id, auth.session.id));
  await audit(actor, "account.2fa_enable", { type: "user", id: auth.user.id });
  return { message: "Autentikasi dua faktor aktif", redirect: auth.user.role === "admin" ? "/admin" : undefined };
});
