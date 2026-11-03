import { AppError } from "@/lib/errors";
import { handleMidtrans } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Webhook HTTP Notification Midtrans. Atur URL ini di dashboard Midtrans. */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 20_000) return Response.json({ ok: false }, { status: 413 });
    const body = JSON.parse(text) as Record<string, unknown>;
    const result = await handleMidtrans(body);
    return Response.json({ ok: true, result });
  } catch (e) {
    const status = e instanceof AppError ? e.status : 500;
    if (!(e instanceof AppError)) console.error("[midtrans webhook]", e);
    return Response.json({ ok: false, error: e instanceof AppError ? e.code : "INTERNAL" }, { status });
  }
}
