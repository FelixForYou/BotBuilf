/**
 * Signature SNAP B2B DANA (asimetris RSA-SHA256), direproduksi dari SDK resmi `dana-node`
 * (`DanaSignatureUtil.generateSnapB2BScenarioSignature` & `WebhookParser.verifySignature`):
 *
 *   stringToSign = HTTPMethod + ":" + RelativePath + ":" + lowercase(hex(SHA-256(minifiedBody))) + ":" + X-TIMESTAMP
 *
 * Kami tidak memakai kelas SDK langsung di runtime karena SDK mengikat kunci webhook & validasi `validUpTo`
 * ke variabel proses `DANA_ENV`, sedangkan FxB Pay menjalankan Sandbox dan Production berdampingan.
 * Kesetaraan output dengan SDK diuji di `tests/dana-signature.test.ts`.
 */
import { createHash, createPrivateKey, createPublicKey, createSign, createVerify, type KeyObject } from "node:crypto";

/** Kunci publik gateway DANA Sandbox untuk verifikasi webhook (disalin dari SDK resmi dana-node v2.2.2). */
export const DANA_SANDBOX_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnaKVGRbin4Wh4KN35OPh
ytJBjYTz7QZKSZjmHfiHxFmulfT87rta+IvGJ0rCBgg+1EtKk1hX8G5gPGJs1htJ
5jHa3/jCk9l+luzjnuT9UVlwJahvzmFw+IoDoM7hIPjsLtnIe04SgYo0tZBpEmkQ
vUGhmHPqYnUGSSMIpDLJDvbyr8gtwluja1SbRphgDCoYVXq+uUJ5HzPS049aaxTS
nfXh/qXuDoB9EzCrgppLDS2ubmk21+dr7WaO/3RFjnwx5ouv6w+iC1XOJKar3CTk
X6JV1OSST1C9sbPGzMHZ8AGB51BM0mok7davD/5irUk+f0C25OgzkwtxAt80dkDo
/QIDAQAB
-----END PUBLIC KEY-----`;

export function normalizePem(input: string, type: "PRIVATE KEY" | "PUBLIC KEY"): string {
  const k = input.trim().replace(/\\n/g, "\n");
  if (k.includes("-----BEGIN") && k.includes("-----END")) return k;
  const b64 = k.replace(/[\s\\]/g, "");
  if (!b64) throw new Error("Kunci kosong");
  return `-----BEGIN ${type}-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END ${type}-----\n`;
}

export function loadPrivateKey(pem: string): KeyObject {
  try {
    return createPrivateKey({ key: normalizePem(pem, "PRIVATE KEY"), format: "pem" });
  } catch {
    // Kunci PKCS#1 tanpa header ("RSA PRIVATE KEY")
    return createPrivateKey({ key: normalizePem(pem, "PRIVATE KEY").replace(/PRIVATE KEY/g, "RSA PRIVATE KEY"), format: "pem" });
  }
}

export function loadPublicKey(pem: string): KeyObject {
  return createPublicKey({ key: normalizePem(pem, "PUBLIC KEY"), format: "pem" });
}

/** Timestamp ISO-8601 zona Jakarta: yyyy-MM-ddTHH:mm:ss+07:00 */
export function jakartaTimestamp(d = new Date()): string {
  const j = new Date(d.getTime() + 7 * 3600_000);
  return j.toISOString().slice(0, 19) + "+07:00";
}

export function bodyHash(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

export function stringToSign(method: string, path: string, body: string, timestamp: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${method.toUpperCase()}:${p}:${bodyHash(body)}:${timestamp}`;
}

export function signB2B(method: string, path: string, body: string, timestamp: string, privateKey: string | KeyObject): string {
  const key = typeof privateKey === "string" ? loadPrivateKey(privateKey) : privateKey;
  const s = createSign("RSA-SHA256");
  s.update(stringToSign(method, path, body, timestamp), "utf8");
  return s.sign(key, "base64");
}

/** Bentuk body yang diuji saat verifikasi: raw apa adanya, lalu versi minified (sesuai perilaku SDK). */
function bodyForms(raw: string): string[] {
  const forms = [raw];
  try {
    const min = JSON.stringify(JSON.parse(raw));
    if (min !== raw) forms.push(min);
  } catch {
    /* body bukan JSON → hanya raw */
  }
  return forms;
}

export function verifyB2B(method: string, path: string, rawBody: string, timestamp: string, signature: string, publicKey: string | KeyObject): boolean {
  if (!signature || !timestamp) return false;
  const key = typeof publicKey === "string" ? loadPublicKey(publicKey) : publicKey;
  const sig = Buffer.from(signature, "base64");
  for (const b of bodyForms(rawBody)) {
    const v = createVerify("RSA-SHA256");
    v.update(stringToSign(method, path, b, timestamp), "utf8");
    if (v.verify(key, sig)) return true;
  }
  return false;
}

/** Toleransi selisih waktu X-TIMESTAMP notifikasi (anti-replay longgar; DANA bisa retry berjam-jam). */
export function timestampWithin(ts: string, maxSkewMs: number, now = Date.now()): boolean {
  const t = Date.parse(ts);
  return Number.isFinite(t) && Math.abs(now - t) <= maxSkewMs;
}
