import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { generateTotpSecret, otpauthUrl } from "@/lib/totp";
import { AppError } from "@/lib/errors";

export const POST = authed({ limit: 10 }, async ({ auth }) => {
  if (auth.user.totpEnabled) throw new AppError("already_enabled", "2FA sudah aktif");
  const secret = generateTotpSecret();
  await db.update(users).set({ totpSecretEnc: encrypt(secret) }).where(eq(users.id, auth.user.id));
  const url = otpauthUrl(secret, auth.user.email);
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#101010", light: "#ffffff" } });
  return { secret, otpauth: url, svg };
});
