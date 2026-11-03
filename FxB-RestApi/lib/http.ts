import "server-only";
import { AppError } from "./errors";

export function ok(data: unknown, init: ResponseInit = {}): Response {
  return Response.json({ ok: true, data }, init);
}

export function fail(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json({ ok: false, error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
  }
  console.error("[fxb] unhandled", err);
  return Response.json({ ok: false, error: { code: "INTERNAL", message: "Terjadi kesalahan pada server." } }, { status: 500 });
}

/** Bungkus handler route internal (dashboard/admin): tangkap error → JSON. */
export function route<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try {
      return await fn(...a);
    } catch (e) {
      return fail(e);
    }
  };
}

/** CSRF: request yang mengubah data harus berasal dari origin yang sama. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new AppError("FORBIDDEN_ORIGIN", "Asal permintaan tidak sah.", 403);
  if (!origin) {
    if (site === "same-origin") return;
    throw new AppError("FORBIDDEN_ORIGIN", "Header Origin tidak ada.", 403);
  }
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  try {
    if (new URL(origin).host !== host) throw new Error();
  } catch {
    throw new AppError("FORBIDDEN_ORIGIN", "Asal permintaan tidak sah.", 403);
  }
}

export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) throw new AppError("BAD_REQUEST", "Content-Type harus application/json.", 415);
  const text = await req.text();
  if (text.length > maxBytes) throw new AppError("BAD_REQUEST", "Permintaan terlalu besar.", 413);
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new AppError("BAD_REQUEST", "JSON tidak valid.", 400);
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

export function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host.split(",")[0].trim()}`;
}

// Token bucket di memori — pengaman tambahan untuk login/register (per instance).
const buckets = new Map<string, { t: number; at: number }>();
export function memLimit(key: string, capacity: number, perSec: number): void {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (now - b.at > 600_000) buckets.delete(k);
  const b = buckets.get(key) ?? { t: capacity, at: now };
  b.t = Math.min(capacity, b.t + ((now - b.at) / 1000) * perSec);
  b.at = now;
  if (b.t < 1) {
    buckets.set(key, b);
    throw new AppError("RATE_LIMITED", "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.", 429);
  }
  b.t -= 1;
  buckets.set(key, b);
}

export function str(v: unknown, field: string, { min = 0, max = 200, required = true } = {}): string {
  if (v === undefined || v === null || v === "") {
    if (required) throw new AppError("BAD_REQUEST", `${field} wajib diisi.`);
    return "";
  }
  if (typeof v !== "string") throw new AppError("BAD_REQUEST", `${field} tidak valid.`);
  const s = v.trim();
  if (s.length < min) throw new AppError("BAD_REQUEST", `${field} minimal ${min} karakter.`);
  if (s.length > max) throw new AppError("BAD_REQUEST", `${field} maksimal ${max} karakter.`);
  return s;
}

export function int(v: unknown, field: string, min: number, max: number): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw new AppError("BAD_REQUEST", `${field} harus bilangan bulat ${min}–${max}.`);
  }
  return n;
}
