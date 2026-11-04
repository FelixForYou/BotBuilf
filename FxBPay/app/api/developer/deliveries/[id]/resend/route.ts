import { authed } from "@/lib/api-helpers";
import { resendDelivery } from "@/lib/webhooks-out";
import { notFound } from "@/lib/errors";
export const POST = authed<Record<string, never>, { id: string }>({ limit: 20 }, async ({ auth, params }) => {
  const r = await resendDelivery(auth.user.role === "admin" ? null : auth.user.id, params.id);
  if (!r && r !== undefined) throw notFound("Pengiriman");
  return { message: r?.ok ? `Terkirim ulang (HTTP ${r.code})` : `Gagal: ${r?.error ?? "tidak diketahui"}` };
});
