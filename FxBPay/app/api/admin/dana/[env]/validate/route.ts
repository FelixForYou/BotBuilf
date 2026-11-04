import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { providerConfigs } from "@/lib/db/schema";
import { checkConfigRow, getConfigRow, loadDanaConfig } from "@/lib/dana/config";
import { DanaClient } from "@/lib/dana/client";
import { DANA_BASE_URL } from "@/lib/dana/constants";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";

/** Validasi konfigurasi, konektivitas, autentikasi & signature dengan Query Payment referensi acak. */
export const POST = authed<Record<string, never>, { env: string }>({ admin: true, limit: 10 }, async ({ actor, params }) => {
  const env = params.env as "sandbox" | "production";
  if (env !== "sandbox" && env !== "production") throw new AppError("not_found", "Env tidak dikenal", 404);
  const row = await getConfigRow(env);
  const checks = checkConfigRow(env, row);
  const result: { step: string; ok: boolean; detail: string }[] = checks.map((c) => ({ step: c.label, ok: c.ok, detail: c.ok ? "OK" : c.hint ?? "Belum diisi" }));
  const cfg = await loadDanaConfig(env);
  if (cfg) {
    try {
      const r = await fetch(DANA_BASE_URL[env], { method: "HEAD", signal: AbortSignal.timeout(8000) });
      result.push({ step: "Konektivitas HTTPS", ok: true, detail: `HTTP ${r.status}` });
    } catch (e) {
      result.push({ step: "Konektivitas HTTPS", ok: false, detail: (e as Error).message });
    }
    const q = await new DanaClient(cfg).queryPayment({ partnerReferenceNo: `FXBVALIDATE${Date.now()}` });
    const code = q.responseCode ?? "";
    const authOk = q.outcome === "response" && !/^401/.test(code) && (q.httpStatus ?? 500) < 500;
    result.push({ step: "Autentikasi & signature (Query Payment)", ok: authOk, detail: q.outcome !== "response" ? q.error ?? "" : `${code} ${(q.body as { responseMessage?: string } | null)?.responseMessage ?? ""}` });
  } else {
    result.push({ step: "Uji koneksi", ok: false, detail: "Integrasi belum dikonfigurasi — lengkapi field wajib" });
  }
  await db.update(providerConfigs).set({ lastValidatedAt: new Date(), lastValidation: result }).where(eq(providerConfigs.env, env));
  await audit(actor, "dana.validate", { type: "provider_config", id: env }, { ok: result.every((r) => r.ok) });
  return { message: result.every((r) => r.ok) ? "Semua pemeriksaan lulus" : "Ada pemeriksaan yang gagal — lihat detail", result };
});
