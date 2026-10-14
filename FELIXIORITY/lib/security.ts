import { AppError } from "./errors";

/**
 * Perlindungan CSRF untuk endpoint yang mengubah sesi:
 * header Origin (atau Sec-Fetch-Site) harus sama dengan host aplikasi.
 */
export function assertSameOrigin(req: Request): void {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin) {
    // Browser modern selalu mengirim Origin untuk POST. Tanpa Origin → tolak.
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: header Origin tidak ada.", 403);
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
  if (!host || originHost !== host.split(",")[0].trim()) {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
}

/** Untuk GET data: tolak permintaan lintas situs (mis. dari tag <script>/<img> situs lain). */
export function assertNotCrossSite(req: Request): void {
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak: asal permintaan tidak sah.", 403);
  }
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
