import "server-only";
import { after } from "next/server";
import { currentUser } from "./auth";
import { BRAND } from "./brand";
import { ipHash, isApiKeyFormat } from "./crypto";
import { run } from "./db";
import { findEndpoint, missingRequirements, overrides } from "./endpoints/registry";
import type { EndpointDef, HandlerResult, ParamDef, Tier } from "./endpoints/types";
import { AppError } from "./errors";
import { baseUrl, clientIp } from "./http";
import { bestKey, effective, findKeyBySecret } from "./keys";
import { consume, type LimitResult } from "./limits";
import { getSettings } from "./settings";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After, X-Tier",
  "Access-Control-Max-Age": "600",
};

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

interface Caller {
  subject: string;
  keyId: string | null;
  userId: string | null;
  tier: Tier;
  daily: number;
  rpm: number;
  mode: "key" | "session" | "anonymous";
}

function errorResponse(e: AppError, headers: Record<string, string> = {}): Response {
  return Response.json(
    { status: false, creator: BRAND.developer, error: { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) } },
    { status: e.status, headers: { ...CORS, ...headers } },
  );
}

function extractKey(req: Request, url: URL): string | null {
  const q = url.searchParams.get("apikey") ?? url.searchParams.get("key");
  const h = req.headers.get("x-api-key");
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  return (h ?? bearer ?? q)?.trim() || null;
}

async function resolveCaller(req: Request, url: URL): Promise<Caller> {
  const secret = extractKey(req, url);
  if (secret) {
    if (!isApiKeyFormat(secret)) throw new AppError("INVALID_API_KEY", "Format API key tidak valid.", 401);
    const k = await findKeyBySecret(secret);
    if (!k) throw new AppError("INVALID_API_KEY", "API key tidak ditemukan.", 401);
    if (k.status !== "active") throw new AppError("KEY_REVOKED", "API key ini sudah dicabut (revoked).", 401);
    if (k.user_status !== "active") throw new AppError("ACCOUNT_SUSPENDED", "Akun pemilik API key ditangguhkan.", 403);
    const e = await effective(k);
    return { subject: `key:${k.id}`, keyId: k.id, userId: k.user_id, tier: e.tier, daily: e.daily, rpm: e.rpm, mode: "key" };
  }
  // Mode API Explorer: hanya dari halaman situs ini sendiri (same-origin).
  if (req.headers.get("sec-fetch-site") === "same-origin") {
    const user = await currentUser();
    const s = await getSettings();
    if (user) {
      const k = await bestKey(user.id);
      if (k) {
        const e = await effective(k);
        return { subject: `key:${k.id}`, keyId: k.id, userId: user.id, tier: e.tier, daily: e.daily, rpm: e.rpm, mode: "session" };
      }
      return { subject: `user:${user.id}`, keyId: null, userId: user.id, tier: "free", daily: s.free_daily_limit, rpm: s.free_rpm, mode: "session" };
    }
    return { subject: `ip:${ipHash(clientIp(req))}`, keyId: null, userId: null, tier: "free", daily: s.playground_daily_ip, rpm: 6, mode: "anonymous" };
  }
  throw new AppError("API_KEY_REQUIRED", "API key wajib. Tambahkan ?apikey=KEY_ANDA atau header X-API-Key. Buat key gratis di dashboard.", 401);
}

async function readParams(req: Request, url: URL, ep: EndpointDef): Promise<{ params: Record<string, string>; files: Record<string, File> }> {
  const params: Record<string, string> = {};
  const files: Record<string, File> = {};
  for (const [k, v] of url.searchParams) if (k !== "apikey" && k !== "key") params[k] = v;
  if (req.method === "POST") {
    const ct = (req.headers.get("content-type") ?? "").toLowerCase();
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > 9 * 1024 * 1024) throw new AppError("TOO_LARGE", "Body permintaan terlalu besar.", 413);
    if (ct.includes("application/json")) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new AppError("BAD_REQUEST", "Body JSON tidak valid.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("BAD_REQUEST", "Body JSON harus object.");
      for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        params[k] = typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : JSON.stringify(v);
      }
    } else if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch {
        throw new AppError("BAD_REQUEST", "Form data tidak valid.");
      }
      for (const [k, v] of form) {
        if (typeof v === "string") params[k] = v;
        else if (ep.params.some((p) => p.name === k && p.type === "file")) files[k] = v;
      }
    }
  }
  return { params: validate(ep.params, params, files), files };
}

export function validate(defs: ParamDef[], raw: Record<string, string>, files: Record<string, File> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  const errors: { param: string; message: string }[] = [];
  for (const d of defs) {
    if (d.type === "file") {
      if (d.required && !files[d.name]) errors.push({ param: d.name, message: "File wajib diunggah (multipart/form-data)." });
      continue;
    }
    let v = raw[d.name]?.trim?.() ?? "";
    if (!v) {
      if (d.required) errors.push({ param: d.name, message: "Wajib diisi." });
      continue;
    }
    if (v.length > (d.max ?? 2000)) {
      errors.push({ param: d.name, message: `Maksimal ${d.max ?? 2000} karakter.` });
      continue;
    }
    if (d.type === "enum" && d.options && !d.options.includes(v)) {
      const ci = d.options.find((o) => o.toLowerCase() === v.toLowerCase());
      if (!ci) {
        errors.push({ param: d.name, message: `Harus salah satu dari: ${d.options.join(", ")}.` });
        continue;
      }
      v = ci;
    }
    if (d.type === "number" && !Number.isFinite(Number(v))) {
      errors.push({ param: d.name, message: "Harus berupa angka." });
      continue;
    }
    if (d.type === "boolean") {
      const b = v.toLowerCase();
      if (!["true", "false", "1", "0", "yes", "no"].includes(b)) {
        errors.push({ param: d.name, message: "Harus true atau false." });
        continue;
      }
      v = ["true", "1", "yes"].includes(b) ? "true" : "false";
    }
    out[d.name] = v;
  }
  if (errors.length) throw new AppError("INVALID_PARAMS", `Parameter tidak valid: ${errors.map((e) => e.param).join(", ")}.`, 400, errors);
  return out;
}

function limitHeaders(l: LimitResult | null, tier: Tier): Record<string, string> {
  if (!l) return { "X-Tier": tier };
  const h: Record<string, string> = {
    "X-Tier": tier,
    "X-RateLimit-Limit": String(l.limit),
    "X-RateLimit-Remaining": String(l.remaining),
    "X-RateLimit-Reset": String(Math.floor(l.reset / 1000)),
  };
  if (l.retryAfter) h["Retry-After"] = String(l.retryAfter);
  return h;
}

export async function handleGateway(req: Request, segments: string[]): Promise<Response> {
  const started = Date.now();
  const url = new URL(req.url);
  const id = segments.join("/");
  let caller: Caller | null = null;
  let lim: LimitResult | null = null;
  let status = 500;
  const ep = findEndpoint(id);
  try {
    if (!ep) throw new AppError("ENDPOINT_NOT_FOUND", `Endpoint /api/v1/${id} tidak ada. Lihat dokumentasi di /docs.`, 404);
    if (req.method !== ep.method && !(ep.method === "GET" && req.method === "POST")) {
      throw new AppError("METHOD_NOT_ALLOWED", `Gunakan method ${ep.method}.`, 405);
    }
    const ov = (await overrides()).get(ep.id);
    if (ov && !ov.enabled) throw new AppError("MAINTENANCE", ov.note || "Endpoint sedang dalam perbaikan.", 503);
    const tier: Tier = (ov?.tier as Tier) || ep.tier;

    caller = await resolveCaller(req, url);
    if (tier === "premium" && caller.tier !== "premium") {
      throw new AppError("PREMIUM_REQUIRED", "Endpoint ini khusus API key premium. Upgrade di halaman Pricing.", 403);
    }
    const missing = missingRequirements(ep);
    if (missing.length) throw new AppError("PROVIDER_UNAVAILABLE", "Layanan ini belum dikonfigurasi oleh admin dan sementara tidak tersedia.", 503);

    const { params, files } = await readParams(req, url, ep);
    lim = await consume(caller.subject, caller.daily, caller.rpm);
    if (!lim.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        lim.reason === "minute"
          ? `Terlalu cepat: maksimal ${caller.rpm} request/menit. Coba lagi dalam ${lim.retryAfter} detik.`
          : `Limit harian (${caller.daily} request) tercapai. Reset pukul 00:00 WIB atau upgrade ke premium.`,
        429,
      );
    }

    const result: HandlerResult = await ep.handler({ params, files, req, base: baseUrl(req), tier: caller.tier, userId: caller.userId });
    status = 200;
    const headers = { ...CORS, ...limitHeaders(lim, caller.tier) };
    if (result.kind === "binary") {
      return new Response(result.body as BodyInit, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": result.contentType,
          "Content-Length": String(result.body.byteLength),
          "Content-Disposition": `inline; filename="${result.filename ?? ep.id.replace(/\//g, "-")}"`,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        },
      });
    }
    return Response.json({ status: true, creator: BRAND.developer, endpoint: ep.id, result: result.data }, { headers });
  } catch (e) {
    const err = e instanceof AppError ? e : new AppError("INTERNAL", "Terjadi kesalahan internal.", 500);
    if (!(e instanceof AppError)) console.error("[fxb gateway]", id, e);
    status = err.status;
    return errorResponse(err, limitHeaders(lim, caller?.tier ?? "free"));
  } finally {
    if (ep && caller) {
      const c = caller;
      const latency = Date.now() - started;
      const ip = ipHash(clientIp(req));
      after(async () => {
        try {
          await run("INSERT INTO request_logs (key_id,user_id,endpoint_id,status,latency_ms,ip_hash,created_at) VALUES (?,?,?,?,?,?,?)", [c.keyId, c.userId, ep.id, status, latency, ip, Date.now()]);
          if (c.keyId) await run("UPDATE api_keys SET last_used_at=? WHERE id=? AND (last_used_at IS NULL OR last_used_at < ?)", [Date.now(), c.keyId, Date.now() - 60_000]);
          if (Math.random() < 0.002) {
            const days = Number(process.env.LOG_RETENTION_DAYS || 90);
            await run("DELETE FROM request_logs WHERE created_at < ?", [Date.now() - days * 86400_000]);
          }
        } catch (err) {
          console.error("[fxb log]", err);
        }
      });
    }
  }
}
