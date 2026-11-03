import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { verifyPassword, dummyHash } from "@/db/password.mjs";

export const SESSION_COOKIE = "fx_session";
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 hari
const MAX_FAILS = 5;
const WINDOW = 1000 * 60 * 15;
const LOCK = 1000 * 60 * 15;

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export interface AdminSession {
  adminId: number;
  username: string;
  csrf: string;
}

async function clientIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "local";
}

// ---------- Pembatasan percobaan login (persisten di SQLite) ----------

function lockedFor(key: string, now: number) {
  const row = db().prepare("SELECT locked_until FROM login_attempts WHERE key=?").get(key) as { locked_until: number } | undefined;
  return row && row.locked_until > now ? row.locked_until - now : 0;
}

function registerFail(key: string, now: number) {
  const row = db().prepare("SELECT count, window_start FROM login_attempts WHERE key=?").get(key) as { count: number; window_start: number } | undefined;
  if (!row || now - row.window_start > WINDOW) {
    db().prepare("INSERT INTO login_attempts (key, count, window_start, locked_until) VALUES (?, 1, ?, 0) ON CONFLICT(key) DO UPDATE SET count=1, window_start=excluded.window_start, locked_until=0").run(key, now);
    return;
  }
  const count = row.count + 1;
  db().prepare("UPDATE login_attempts SET count=?, locked_until=? WHERE key=?").run(count, count >= MAX_FAILS ? now + LOCK : 0, key);
}

export type LoginResult = { ok: true } | { ok: false; error: string; status: number };

export async function login(usernameRaw: string, password: string): Promise<LoginResult> {
  const username = String(usernameRaw || "").trim().slice(0, 64);
  if (!username || typeof password !== "string" || !password || password.length > 200) {
    return { ok: false, error: "Isi username dan password.", status: 400 };
  }
  const now = Date.now();
  const ipKey = `ip:${await clientIp()}`;
  const userKey = `user:${username.toLowerCase()}`;
  const wait = Math.max(lockedFor(ipKey, now), lockedFor(userKey, now));
  if (wait > 0) {
    return { ok: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(wait / 60000)} menit.`, status: 429 };
  }
  const admin = db().prepare("SELECT id, username, password_hash FROM admins WHERE username = ?").get(username) as
    | { id: number; username: string; password_hash: string }
    | undefined;
  const valid = verifyPassword(password, admin?.password_hash ?? dummyHash());
  if (!admin || !valid) {
    registerFail(ipKey, now);
    registerFail(userKey, now);
    return { ok: false, error: "Username atau password salah.", status: 401 };
  }
  db().prepare("DELETE FROM login_attempts WHERE key IN (?, ?)").run(ipKey, userKey);
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);

  const token = crypto.randomBytes(32).toString("base64url");
  const csrf = crypto.randomBytes(24).toString("base64url");
  db().prepare("INSERT INTO sessions (token_hash, admin_id, csrf, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(sha256(token), admin.id, csrf, now, now + SESSION_TTL);

  const h = await headers();
  const secure = h.get("x-forwarded-proto") === "https" || (h.get("origin") ?? "").startsWith("https://");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: SESSION_TTL / 1000,
  });
  return { ok: true };
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = db()
    .prepare("SELECT s.admin_id, s.csrf, s.expires_at, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ?")
    .get(sha256(token)) as { admin_id: number; csrf: string; expires_at: number; username: string } | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  return { adminId: row.admin_id, username: row.username, csrf: row.csrf };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Untuk halaman admin (server component). */
export async function requireAdminPage(): Promise<AdminSession> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

/** Untuk route API admin: cek sesi, asal request, dan token CSRF. */
export async function requireAdminApi(req: Request): Promise<AdminSession | Response> {
  if (!sameOrigin(req)) return Response.json({ error: "Asal request tidak diizinkan." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ error: "Sesi berakhir. Silakan login lagi." }, { status: 401 });
  if (req.method !== "GET") {
    const sent = req.headers.get("x-csrf-token") ?? "";
    const a = Buffer.from(sent), b = Buffer.from(s.csrf);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return Response.json({ error: "Token keamanan tidak cocok. Muat ulang halaman." }, { status: 403 });
    }
  }
  return s;
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return req.method === "GET"; // browser modern selalu mengirim Origin untuk POST/PUT/DELETE
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
