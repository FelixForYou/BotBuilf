import { NextResponse, type NextRequest } from "next/server";
import { AppError, toPublicError } from "@/lib/errors";
import { sessionFromRequest } from "@/lib/request-session";
import { applyCors, assertNotCrossSite, preflight, rateLimit } from "@/lib/security";
import { cookieOptions, sessionCookieName } from "@/lib/session";
import { syncOnce } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Panel besar butuh banyak halaman; beri waktu cukup (Vercel).
export const maxDuration = 60;

export function OPTIONS(req: Request) {
  return preflight(req);
}

export async function GET(req: NextRequest) {
  try {
    assertNotCrossSite(req);
    const { session, hadCookie } = sessionFromRequest(req);
    if (!session) {
      const res = NextResponse.json(
        { error: "Sesi berakhir atau belum terhubung. Hubungkan panel lagi.", code: "NOT_CONNECTED" },
        { status: 401 },
      );
      if (hadCookie) res.cookies.set(sessionCookieName(), "", cookieOptions(0));
      return applyCors(req, res);
    }
    // Maks. ~1 sinkronisasi per 4 detik per sesi (tombol Perbarui + polling).
    const wait = rateLimit(`sync:${session.sid}`, 3, 1 / 4);
    if (wait) throw new AppError("RATE_LIMITED", "Terlalu sering memperbarui. Tunggu sebentar.", 429, wait);

    const snapshot = await syncOnce(session.sid, {
      target: {
        origin: session.origin,
        protocol: session.protocol,
        hostname: session.hostname,
        port: session.port,
        host: session.host,
      },
      apiKey: session.key,
    });
    return applyCors(req, NextResponse.json(snapshot));
  } catch (err) {
    const { status, body } = toPublicError(err);
    const res = NextResponse.json(body, { status });
    if (body.retryAfterMs) res.headers.set("Retry-After", String(Math.ceil(body.retryAfterMs / 1000)));
    return applyCors(req, res);
  }
}
