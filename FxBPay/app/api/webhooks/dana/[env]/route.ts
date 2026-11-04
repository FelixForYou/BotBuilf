import type { NextRequest } from "next/server";
import { handleDanaNotify } from "@/lib/dana/notify";
import { NOTIFY_ACK_BAD_REQUEST } from "@/lib/dana/constants";

/** Notify URL DANA: /api/webhooks/dana/sandbox dan /api/webhooks/dana/production */
export async function POST(req: NextRequest, ctx: { params: Promise<{ env: string }> }) {
  const { env } = await ctx.params;
  if (env !== "sandbox" && env !== "production") return Response.json(NOTIFY_ACK_BAD_REQUEST, { status: 404 });
  const raw = await req.text();
  if (raw.length > 64_000) return Response.json(NOTIFY_ACK_BAD_REQUEST, { status: 413 });
  const r = await handleDanaNotify(env, "POST", req.nextUrl.pathname, req.headers, raw);
  return Response.json(r.body, { status: r.httpStatus });
}
