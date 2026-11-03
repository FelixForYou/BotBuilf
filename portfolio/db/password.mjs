import crypto from "node:crypto";

const N = 16384, R = 8, P = 1, KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [algo, n, r, p, saltB64, hashB64] = String(stored).split("$");
    if (algo !== "scrypt") return false;
    const expected = Buffer.from(hashB64, "base64");
    const actual = crypto.scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

let dummy = null;
// Hash tiruan agar waktu respons login sama saat username tidak ditemukan.
export function dummyHash() {
  if (!dummy) dummy = hashPassword(crypto.randomBytes(16).toString("hex"));
  return dummy;
}

export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 10) return "Password minimal 10 karakter.";
  if (password.length > 200) return "Password terlalu panjang.";
  return null;
}

export function usernameProblem(username) {
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username || "")) return "Username 3-32 karakter: huruf, angka, titik, garis bawah, atau strip.";
  return null;
}
