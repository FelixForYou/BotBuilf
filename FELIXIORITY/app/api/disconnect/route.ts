import { NextResponse } from "next/server";
import { toPublicError } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/security";
import { cookieOptions, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
    return res;
  } catch (err) {
    const { status, body } = toPublicError(err);
    return NextResponse.json(body, { status });
  }
}
