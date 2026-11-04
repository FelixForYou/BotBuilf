import { authed } from "@/lib/api-helpers";
import { getOwnedPayment } from "@/lib/payments/access";
import { syncWithProvider } from "@/lib/payments/service";

export const POST = authed<Record<string, never>, { id: string }>({ limit: 20 }, async ({ auth, params }) => {
  const p = await getOwnedPayment(auth, params.id);
  if (p.provider !== "dana") return { message: "Pembayaran DEMO: status hanya berubah lewat simulasi sandbox" };
  const r = await syncWithProvider(p.id);
  const label: Record<string, string> = { credited: "Pembayaran terverifikasi dari DANA", duplicate: "Sudah tercatat lunas", status_updated: "Status diperbarui dari DANA", ignored_out_of_order: "Tidak ada perubahan", not_found: "Pesanan belum ada di DANA", skipped: "Integrasi belum dikonfigurasi", error: `DANA: ${"detail" in r ? r.detail : ""}` };
  return { message: label[r.outcome] ?? `Hasil: ${r.outcome}` };
});
