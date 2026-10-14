import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { AppError } from "./errors";
import { IS_PRODUCTION } from "./validation";

export const SESSION_COOKIE = IS_PRODUCTION ? "__Host-felix_session" : "felix_session";
/** Masa berlaku sesi: 12 jam. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const VERSION = "v1";
const AAD = Buffer.from("felixiority-session-v1");

export interface SessionPayload {
  /** ID sesi acak — dipakai sebagai kunci rate limit / dedupe di memori server. */
  sid: string;
  origin: string;
  protocol: "https:" | "http:";
  hostname: string;
  port: number;
  host: string;
  /** Application API key. Hanya ada di dalam cookie terenkripsi; tidak pernah dikirim ke frontend. */
  key: string;
  iat: number;
  exp: number;
}

let cachedKey: { secret: string; key: Buffer } | null = null;

export class ConfigError extends AppError {
  constructor(message: string) {
    super("CONFIG", message, 500);
  }
}

export function getSessionSecretStatus(): { ok: true } | { ok: false; message: string } {
  const s = process.env.SESSION_SECRET;
  if (!s || !s.trim()) {
    return { ok: false, message: "SESSION_SECRET belum disetel. Buat dengan: openssl rand -hex 32" };
  }
  if (s.trim().length < 32) {
    return { ok: false, message: "SESSION_SECRET terlalu pendek. Gunakan hasil: openssl rand -hex 32 (64 karakter)." };
  }
  return { ok: true };
}

function getKey(): Buffer {
  const status = getSessionSecretStatus();
  if (!status.ok) throw new ConfigError(status.message);
  const secret = process.env.SESSION_SECRET!.trim();
  if (cachedKey?.secret === secret) return cachedKey.key;
  const key = Buffer.from(hkdfSync("sha256", secret, "felixiority", "session-encryption-v1", 32));
  cachedKey = { secret, key };
  return key;
}

/** AES-256-GCM: terenkripsi + terautentikasi. Cookie yang diubah akan ditolak. */
export function sealSession(payload: SessionPayload): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), ct.toString("base64url"), tag.toString("base64url")].join(".");
}

export function openSession(token: string | undefined | null, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  const key = getKey();
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const ct = Buffer.from(parts[2], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    const p = JSON.parse(pt) as SessionPayload;
    if (typeof p.exp !== "number" || p.exp <= now) return null;
    if (typeof p.key !== "string" || typeof p.origin !== "string" || typeof p.sid !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

export function newSessionId(): string {
  return randomBytes(18).toString("base64url");
}

export function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: maxAgeSec,
  };
}
