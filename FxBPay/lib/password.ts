import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 32768, r = 8, p = 1, LEN = 64;

/** scrypt (memory-hard, bawaan Node). Format: scrypt$N$r$p$salt$hash */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const h = await scrypt(pw.normalize("NFKC"), salt, LEN, { N, r, p, maxmem: 128 * N * r * 2 });
  return ["scrypt", N, r, p, salt.toString("base64"), h.toString("base64")].join("$");
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, n, rr, pp, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const got = await scrypt(pw.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, {
    N: Number(n), r: Number(rr), p: Number(pp), maxmem: 128 * Number(n) * Number(rr) * 2,
  });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password minimal 10 karakter";
  if (pw.length > 200) return "Password terlalu panjang";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Password harus memuat huruf dan angka";
  return null;
}
