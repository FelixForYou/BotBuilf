import { NextResponse } from "next/server";
import { toPublicError } from "@/lib/errors";
import { applyCors, assertSameOrigin, preflight } from "@/lib/security";
import { cookieOptions, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookieName(), "", cookieOptions(0));
    return applyCors(req, res);
  } catch (err) {
    const { status, body } = toPublicError(err);
    return applyCors(req, NextResponse.json(body, { status }));
  }
}
