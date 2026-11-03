import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function id(prefix = ""): string {
  return prefix + randomBytes(12).toString("base64url");
}

export function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

export function hmacHex(alg: "sha256" | "sha512", secret: string, v: string): string {
  return createHmac(alg, secret).update(v).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, s, k] = stored.split("$");
  if (alg !== "scrypt" || !s || !k) return false;
  const expected = Buffer.from(k, "base64");
  const got = await scrypt(pw, Buffer.from(s, "base64"), expected.length, SCRYPT);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** API key format: fxb_<32 karakter base62>. Disimpan sebagai sha256. */
export function newApiKey(): { key: string; prefix: string; hash: string } {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(32);
  let body = "";
  for (const b of bytes) body += alphabet[b % 62];
  const key = `fxb_${body}`;
  return { key, prefix: key.slice(0, 10), hash: sha256(key) };
}

export function isApiKeyFormat(v: string): boolean {
  return /^fxb_[A-Za-z0-9]{32}$/.test(v);
}

/** Hash IP dengan salt server agar log tidak menyimpan IP mentah. */
export function ipHash(ip: string): string {
  return sha256(`${process.env.SESSION_SECRET ?? "fxb"}:${ip}`).slice(0, 24);
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}
