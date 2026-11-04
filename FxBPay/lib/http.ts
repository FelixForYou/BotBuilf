import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError } from "./errors";
import { config } from "./env";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new NextResponse(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function errorResponse(e: unknown) {
  if (e instanceof AppError) return json({ error: { code: e.code, message: e.message, details: e.details } }, e.status);
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return json({ error: { code: "validation_error", message: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Input tidak valid", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } }, 422);
  }
  // Jangan bocorkan detail internal; log tanpa data sensitif.
  console.error("[fxb] unhandled error:", (e as Error)?.message ?? e);
  return json({ error: { code: "internal_error", message: "Terjadi kesalahan pada server" } }, 500);
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;
export function route<C>(h: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await h(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function body<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("invalid_json", "Body harus JSON valid", 400);
  }
  return schema.parse(raw);
}

/**
 * Proteksi CSRF untuk endpoint ber-cookie: cookie SameSite=Lax + wajib header kustom
 * `X-FxB-CSRF: 1` (tidak bisa dikirim lintas origin tanpa preflight CORS) + Origin harus sama.
 */
export function assertSameOrigin(req: NextRequest) {
  if (req.headers.get("x-fxb-csrf") !== "1") throw new AppError("csrf", "Permintaan ditolak (CSRF)", 403);
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const o = new URL(origin);
    const allowed = new Set([host, new URL(config.appUrl).host]);
    if (!allowed.has(o.host)) throw new AppError("csrf", "Origin tidak diizinkan", 403);
  }
}

export function clientIp(req: Request | NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf && process.env.TRUST_PROXY !== "0") return xf.split(",")[0].trim().slice(0, 64);
  return (req.headers.get("x-real-ip") ?? "").slice(0, 64);
}

export function userAgent(req: Request | NextRequest): string {
  return (req.headers.get("user-agent") ?? "").slice(0, 300);
}
