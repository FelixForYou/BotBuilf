import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { randomToken, sha256Hex } from "../crypto";
import { config } from "../env";
import { AppError } from "../errors";
import type { Env } from "../ledger";
import type { Actor } from "../audit";

export const SESSION_COOKIE = config.secureCookies ? "__Host-fxb_session" : "fxb_session";
export const ENV_COOKIE = "fxb_env";
const USER_TTL = 7 * 24 * 3600_000;
const ADMIN_TTL = 12 * 3600_000;

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Auth = { session: Session; user: User };

export async function createSession(user: User, meta: { ip: string; userAgent: string }) {
  const token = randomToken(32);
  const ttl = user.role === "admin" ? ADMIN_TTL : USER_TTL;
  await db.insert(sessions).values({
    tokenHash: sha256Hex(token),
    userId: user.id,
    mfaPassed: !user.totpEnabled,
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt: new Date(Date.now() + ttl),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: config.secureCookies, sameSite: "lax", path: "/", maxAge: Math.floor(ttl / 1000) });
}

export async function getAuth(): Promise<Auth | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256Hex(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const a = rows[0];
  if (!a) return null;
  // Sesi dibuat sebelum password diganti → tidak berlaku.
  if (a.user.passwordChangedAt && a.session.createdAt < a.user.passwordChangedAt) return null;
  if (Date.now() - a.session.lastSeenAt.getTime() > 5 * 60_000) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, a.session.id));
  }
  return a;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, sha256Hex(token)));
  jar.delete(SESSION_COOKIE);
}

/** Untuk halaman (Server Component): redirect bila belum login / perlu 2FA. */
export async function requireUser(): Promise<Auth> {
  const a = await getAuth();
  if (!a) redirect("/masuk");
  if (!a.session.mfaPassed) redirect("/masuk/2fa");
  return a;
}

export async function requireAdmin(): Promise<Auth> {
  const a = await requireUser();
  if (a.user.role !== "admin") redirect("/app");
  if (!a.user.totpEnabled) redirect("/app/pengaturan/keamanan?wajib2fa=1");
  return a;
}

/** Untuk Route Handler: melempar 401/403 JSON. */
export async function apiAuth(opts: { admin?: boolean; allowPendingMfa?: boolean } = {}): Promise<Auth> {
  const a = await getAuth();
  if (!a) throw new AppError("unauthenticated", "Silakan masuk terlebih dahulu", 401);
  if (!a.session.mfaPassed && !opts.allowPendingMfa) throw new AppError("mfa_required", "Verifikasi dua faktor diperlukan", 401);
  if (opts.admin) {
    if (a.user.role !== "admin") throw new AppError("forbidden", "Khusus admin", 403);
    if (!a.user.totpEnabled) throw new AppError("mfa_setup_required", "Admin wajib mengaktifkan autentikasi dua faktor", 403);
  }
  return a;
}

export function actorOf(a: Auth, ip = ""): Actor {
  return { id: a.user.id, email: a.user.email, ip };
}

export async function currentEnv(): Promise<Env> {
  const jar = await cookies();
  return jar.get(ENV_COOKIE)?.value === "production" ? "production" : "sandbox";
}
