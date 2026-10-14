import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AppError, toPublicError } from "@/lib/errors";
import { assertNotCrossSite, rateLimit } from "@/lib/security";
import { cookieOptions, openSession, SESSION_COOKIE } from "@/lib/session";
import { syncOnce } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Panel besar butuh banyak halaman; beri waktu cukup (Vercel).
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    assertNotCrossSite(req);
    const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = openSession(cookie);
    if (!session) {
      const res = NextResponse.json(
        { error: "Sesi berakhir atau belum terhubung. Hubungkan panel lagi.", code: "NOT_CONNECTED" },
        { status: 401 },
      );
      if (cookie) res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
      return res;
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
    return NextResponse.json(snapshot);
  } catch (err) {
    const { status, body } = toPublicError(err);
    const res = NextResponse.json(body, { status });
    if (body.retryAfterMs) res.headers.set("Retry-After", String(Math.ceil(body.retryAfterMs / 1000)));
    return res;
  }
}
