import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "./env";

function key(): Buffer {
  const k = Buffer.from(config.encryptionKey, "base64");
  if (k.length !== 32) throw new Error("APP_ENCRYPTION_KEY harus 32 byte dalam base64 (jalankan `npm run keygen`).");
  return k;
}

/** AES-256-GCM. Format: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(blob: string): string {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || ct === undefined) throw new Error("Format data terenkripsi tidak dikenal");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}

export function sha256Hex(s: string | Buffer): string {
  return createHash("sha256").update(s).digest("hex");
}

export function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const ALPHA = "0123456789abcdefghijkmnopqrstuvwxyz";
export function shortId(len = 12): string {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[b[i] % ALPHA.length];
  return s;
}
