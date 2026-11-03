import { AppError } from "@/lib/errors";
import { handleXendit } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Webhook invoice Xendit. Header x-callback-token wajib cocok dengan XENDIT_CALLBACK_TOKEN. */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 50_000) return Response.json({ ok: false }, { status: 413 });
    const result = await handleXendit(req.headers.get("x-callback-token"), JSON.parse(text) as Record<string, unknown>);
    return Response.json({ ok: true, result });
  } catch (e) {
    const status = e instanceof AppError ? e.status : 500;
    if (!(e instanceof AppError)) console.error("[xendit webhook]", e);
    return Response.json({ ok: false, error: e instanceof AppError ? e.code : "INTERNAL" }, { status });
  }
}
