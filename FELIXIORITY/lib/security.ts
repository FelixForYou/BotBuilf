import { AppError } from "./errors";

/**
 * Origin frontend lain yang boleh memakai API ini (mis. GitHub Pages).
 * Opsional: ALLOWED_ORIGINS=https://user.github.io (pisahkan dengan koma).
 * Kosong = hanya origin aplikasi ini sendiri.
 */
export function allowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  const out = new Set<string>();
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (!v) continue;
    try {
      const u = new URL(v);
      if (u.protocol === "https:" || (process.env.NODE_ENV !== "production" && u.protocol === "http:")) out.add(u.origin);
    } catch {
      /* abaikan nilai tidak valid */
    }
  }
  return out;
}

/** true jika API dipakai oleh frontend di origin lain (mode GitHub Pages). */
export function crossOriginEnabled(): boolean {
  return allowedOrigins().size > 0;
}

export function isAllowedCrossOrigin(origin: string | null): origin is string {
  return !!origin && allowedOrigins().has(origin);
}

function isSameOrigin(req: Request, origin: string): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}

/**
 * Perlindungan CSRF untuk endpoint yang mengubah sesi:
 * header Origin harus origin aplikasi ini atau origin yang diizinkan (ALLOWED_ORIGINS).
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Browser modern selalu mengirim Origin untuk POST. Tanpa Origin → tolak.
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: header Origin tidak ada.", 403);
  }
  if (isAllowedCrossOrigin(origin)) return;
  const site = req.headers.get("sec-fetch-site");
  if ((site && site !== "same-origin" && site !== "none") || !isSameOrigin(req, origin)) {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
}

/** Untuk GET data: tolak permintaan lintas situs kecuali dari origin yang diizinkan. */
export function assertNotCrossSite(req: Request): void {
  if (isAllowedCrossOrigin(req.headers.get("origin"))) return;
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
}

/** Header CORS — hanya untuk origin di ALLOWED_ORIGINS. */
export function applyCors(req: Request, res: Response): Response {
  const origin = req.headers.get("origin");
  res.headers.append("Vary", "Origin");
  if (isAllowedCrossOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Expose-Headers", "Retry-After");
  }
  return res;
}

export function preflight(req: Request): Response {
  const res = new Response(null, { status: 204 });
  if (isAllowedCrossOrigin(req.headers.get("origin"))) {
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "600");
  }
  return applyCors(req, res);
}

export async function readJsonBody(req: Request, maxBytes = 4096): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().startsWith("application/json")) {
    throw new AppError("BAD_REQUEST", "Format permintaan tidak valid.", 415);
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new AppError("BAD_REQUEST", "Permintaan terlalu besar.", 413);
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new AppError("BAD_REQUEST", "Format permintaan tidak valid.", 400);
  }
}

// ---------------------------------------------------------------------------
// Rate limit sederhana di memori (per instance server).
// ---------------------------------------------------------------------------
interface Bucket {
  tokens: number;
  updated: number;
}
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/**
 * Token bucket. `capacity` permintaan, terisi ulang `refillPerSec`.
 * Mengembalikan 0 jika boleh, atau ms yang harus ditunggu.
 */
export function rateLimit(key: string, capacity: number, refillPerSec: number, now = Date.now()): number {
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (now - b.updated > 10 * 60_000) buckets.delete(k);
    lastSweep = now;
  }
  const b = buckets.get(key) ?? { tokens: capacity, updated: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.updated) / 1000) * refillPerSec);
  b.updated = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return 0;
  }
  buckets.set(key, b);
  return Math.ceil(((1 - b.tokens) / refillPerSec) * 1000);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
