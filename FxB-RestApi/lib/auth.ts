import "server-only";
import { cookies } from "next/headers";
import { one, run } from "./db";
import { id, randomToken, sha256 } from "./crypto";
import { Errors } from "./errors";

export const SESSION_COOKIE = "fxb_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "banned";
  created_at: number;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const now = Date.now();
  const exp = now + SESSION_DAYS * 86400_000;
  await run("INSERT INTO sessions (id_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)", [sha256(token), userId, exp, now]);
  if (Math.random() < 0.05) await run("DELETE FROM sessions WHERE expires_at < ?", [now]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(exp),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id_hash = ?", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const u = await one<User & { expires_at: number }>(
    "SELECT u.id,u.email,u.name,u.role,u.status,u.created_at,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=?",
    [sha256(token)],
  );
  if (!u || Number(u.expires_at) < Date.now() || u.status !== "active") return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, status: u.status, created_at: Number(u.created_at) };
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw Errors.unauthorized();
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "admin") throw Errors.forbidden("Khusus admin.");
  return u;
}

export { id };
