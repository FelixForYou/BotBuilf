import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { authTokens, loginEvents, sessions, users } from "../db/schema";
import { hashPassword, passwordProblem, verifyPassword } from "../password";
import { randomToken, sha256Hex, decrypt } from "../crypto";
import { AppError } from "../errors";
import { queueEmail, notifyUser } from "../notify";
import { config } from "../env";
import { rateLimit } from "../ratelimit";
import { getSetting } from "../settings";
import { verifyTotp } from "../totp";
import { audit } from "../audit";
import type { User } from "./session";

const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function register(input: { name: string; storeName: string; email: string; phone: string; password: string }, ip: string) {
  const branding = await getSetting("branding");
  if (!branding.registrationOpen) throw new AppError("registration_closed", "Pendaftaran sedang ditutup oleh admin.", 403);
  await rateLimit(`register:${ip}`, 10, 3600);
  const pwProblem = passwordProblem(input.password);
  if (pwProblem) throw new AppError("weak_password", pwProblem);
  const email = input.email.trim().toLowerCase();
  const exists = await db.select({ id: users.id }).from(users).where(eq(sql`lower(${users.email})`, email));
  if (exists[0]) throw new AppError("email_taken", "Email sudah terdaftar. Silakan masuk atau gunakan lupa password.", 409);
  const [u] = await db.insert(users).values({ email, name: input.name.trim(), storeName: input.storeName.trim(), phone: input.phone.trim(), passwordHash: await hashPassword(input.password) }).returning();
  await sendVerificationEmail(u);
  return u;
}

export async function sendVerificationEmail(u: User) {
  const token = randomToken(32);
  await db.insert(authTokens).values({ userId: u.id, type: "verify_email", tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + 48 * 3600_000) });
  await queueEmail(u.email, "Verifikasi email FxB Pay", `Halo ${u.name},\n\nKonfirmasi email Anda dengan membuka tautan berikut (berlaku 48 jam):\n${config.appUrl}/verifikasi-email?token=${token}\n\nAbaikan email ini jika Anda tidak mendaftar.\n\nFxB Pay — BY FELIXIORITY`);
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, sha256Hex(token)), eq(authTokens.type, "verify_email"), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())));
  if (!t) return false;
  await db.transaction(async (tx) => {
    await tx.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, t.id));
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, t.userId), isNull(users.emailVerifiedAt)));
  });
  return true;
}

export async function login(emailRaw: string, password: string, meta: { ip: string; userAgent: string }): Promise<User> {
  const email = emailRaw.trim().toLowerCase();
  await rateLimit(`login:ip:${meta.ip}`, 30, 900);
  await rateLimit(`login:email:${email}`, 10, 900);
  const [u] = await db.select().from(users).where(eq(sql`lower(${users.email})`, email));
  const log = (success: boolean, reason: string, userId: string | null) => db.insert(loginEvents).values({ userId, email, success, reason, ip: meta.ip, userAgent: meta.userAgent });
  if (!u) {
    await verifyPassword(password, DUMMY_HASH).catch(() => false); // samakan waktu respons
    await log(false, "email_tidak_terdaftar", null);
    throw new AppError("invalid_credentials", "Email atau password salah", 401);
  }
  if (u.lockedUntil && u.lockedUntil > new Date()) {
    await log(false, "terkunci", u.id);
    throw new AppError("locked", "Akun dikunci sementara karena terlalu banyak percobaan. Coba lagi nanti.", 423);
  }
  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) {
    const fails = u.failedLogins + 1;
    await db.update(users).set({ failedLogins: fails, lockedUntil: fails >= 8 ? new Date(Date.now() + 15 * 60_000) : null }).where(eq(users.id, u.id));
    await log(false, "password_salah", u.id);
    if (fails >= 8) await notifyUser(u.id, "security", "Akun dikunci sementara", "Terdeteksi banyak percobaan masuk gagal. Akun dikunci 15 menit.");
    throw new AppError("invalid_credentials", "Email atau password salah", 401);
  }
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, u.id));
  await log(true, u.totpEnabled ? "password_ok_menunggu_2fa" : "berhasil", u.id);
  return u;
}

export async function completeMfa(sessionId: string, user: User, code: string, meta: { ip: string; userAgent: string }) {
  await rateLimit(`mfa:${user.id}`, 8, 900);
  if (!user.totpEnabled || !user.totpSecretEnc) throw new AppError("mfa_not_enabled", "2FA tidak aktif", 400);
  const step = verifyTotp(decrypt(user.totpSecretEnc), code.replace(/\s/g, ""));
  if (step === null || (user.totpLastStep !== null && step <= user.totpLastStep)) {
    await db.insert(loginEvents).values({ userId: user.id, email: user.email, success: false, reason: "kode_2fa_salah", ip: meta.ip, userAgent: meta.userAgent });
    throw new AppError("invalid_code", "Kode autentikator salah atau sudah dipakai", 401);
  }
  await db.update(users).set({ totpLastStep: step }).where(eq(users.id, user.id));
  await db.update(sessions).set({ mfaPassed: true }).where(eq(sessions.id, sessionId));
  await db.insert(loginEvents).values({ userId: user.id, email: user.email, success: true, reason: "2fa_berhasil", ip: meta.ip, userAgent: meta.userAgent });
}

export async function requestPasswordReset(emailRaw: string, ip: string) {
  await rateLimit(`forgot:${ip}`, 10, 3600);
  const email = emailRaw.trim().toLowerCase();
  await rateLimit(`forgot:email:${email}`, 3, 3600);
  const [u] = await db.select().from(users).where(eq(sql`lower(${users.email})`, email));
  if (!u) return; // jangan bocorkan keberadaan akun
  const token = randomToken(32);
  await db.insert(authTokens).values({ userId: u.id, type: "reset_password", tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + 3600_000) });
  await queueEmail(u.email, "Atur ulang password FxB Pay", `Halo ${u.name},\n\nAtur ulang password Anda melalui tautan berikut (berlaku 1 jam):\n${config.appUrl}/reset-password?token=${token}\n\nJika Anda tidak meminta ini, abaikan email ini.\n\nFxB Pay — BY FELIXIORITY`);
}

export async function resetPassword(token: string, password: string, ip: string) {
  await rateLimit(`reset:${ip}`, 20, 3600);
  const problem = passwordProblem(password);
  if (problem) throw new AppError("weak_password", problem);
  const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, sha256Hex(token)), eq(authTokens.type, "reset_password"), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())));
  if (!t) throw new AppError("invalid_token", "Tautan tidak valid atau sudah kedaluwarsa", 400);
  await db.transaction(async (tx) => {
    await tx.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, t.id));
    await tx.update(users).set({ passwordHash: await hashPassword(password), passwordChangedAt: new Date(), failedLogins: 0, lockedUntil: null, emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())` }).where(eq(users.id, t.userId));
    await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, t.userId), isNull(sessions.revokedAt)));
  });
  await audit({ id: t.userId, email: "self", ip }, "auth.password_reset", { type: "user", id: t.userId });
  await notifyUser(t.userId, "security", "Password diubah", "Password akun Anda baru saja diatur ulang. Semua sesi lain telah dikeluarkan.");
}
