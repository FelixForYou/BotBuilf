import { NextResponse } from "next/server";
import { AppError, toPublicError } from "@/lib/errors";
import { verifyAccess } from "@/lib/pterodactyl";
import { applyCors, assertSameOrigin, clientIp, isAllowedCrossOrigin, preflight, rateLimit, readJsonBody } from "@/lib/security";
import {
  cookieOptions,
  getSessionSecretStatus,
  newSessionId,
  sealSession,
  sessionCookieName,
  SESSION_TTL_MS,
} from "@/lib/session";
import { normalizePanelDomain, validateApiKey } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const cfg = getSessionSecretStatus();
    if (!cfg.ok) throw new AppError("CONFIG", cfg.message, 500);
    const wait = rateLimit(`connect:${clientIp(req)}`, 8, 8 / 60);
    if (wait) {
      throw new AppError("RATE_LIMITED", "Terlalu banyak percobaan koneksi. Tunggu sebentar lalu coba lagi.", 429, wait);
    }
    const body = await readJsonBody(req);
    const target = normalizePanelDomain(body.domain);
    const key = validateApiKey(body.apiKey);

    // Uji Users dan Servers sebelum sesi dibuat.
    const counts = await verifyAccess({ target, apiKey: key });

    const now = Date.now();
    const token = sealSession({
      sid: newSessionId(),
      origin: target.origin,
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      host: target.host,
      key,
      iat: now,
      exp: now + SESSION_TTL_MS,
    });
    // Frontend lintas origin (GitHub Pages) juga menerima token terenkripsi sebagai cadangan
    // bila browser memblokir cookie lintas situs. Token disimpan di memori tab saja.
    const crossOrigin = isAllowedCrossOrigin(req.headers.get("origin"));
    const res = NextResponse.json({
      ok: true,
      panelHost: target.host,
      users: counts.users,
      servers: counts.servers,
      ...(crossOrigin ? { sessionToken: token } : {}),
    });
    res.cookies.set(sessionCookieName(), token, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
    return applyCors(req, res);
  } catch (err) {
    const { status, body } = toPublicError(err);
    return applyCors(req, NextResponse.json(body, { status }));
  }
}
