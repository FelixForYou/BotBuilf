import "server-only";
import { eq } from "drizzle-orm";
import { db, type DbOrTx } from "../db";
import { providerConfigs } from "../db/schema";
import { decrypt } from "../crypto";
import { config } from "../env";
import type { Env } from "../ledger";

export type DanaConfig = {
  env: Env;
  partnerId: string;
  merchantId: string;
  subMerchantId: string;
  externalStoreId: string;
  origin: string;
  mcc: string;
  privateKey: string;
  danaPublicKey: string | null; // null di sandbox → pakai kunci sandbox resmi dari SDK
  clientSecret: string | null;
  qrisEnabled: boolean;
  disbursementEnabled: boolean;
  merchantApproval: string;
};

export function notifyPath(env: Env) {
  return `/api/webhooks/dana/${env}`;
}
export function notifyUrl(env: Env) {
  return `${config.appUrl}${notifyPath(env)}`;
}
export function returnUrl(publicId: string) {
  return `${config.appUrl}/pay/${publicId}/selesai`;
}

export type ConfigCheck = { field: string; label: string; ok: boolean; hint?: string };

export async function getConfigRow(env: Env, tx: DbOrTx = db) {
  const r = await tx.select().from(providerConfigs).where(eq(providerConfigs.env, env)).limit(1);
  return r[0] ?? null;
}

export function checkConfigRow(env: Env, row: Awaited<ReturnType<typeof getConfigRow>>): ConfigCheck[] {
  const has = (v?: string | null) => !!v && v.trim().length > 0;
  const checks: ConfigCheck[] = [
    { field: "partnerId", label: "Partner ID / Client ID (X-PARTNER-ID)", ok: has(row?.partnerId) },
    { field: "merchantId", label: "Merchant ID", ok: has(row?.merchantId) },
    { field: "privateKey", label: "Private key merchant (RSA)", ok: has(row?.privateKeyEnc) },
    { field: "origin", label: "Origin domain", ok: has(row?.origin), hint: "Domain website Anda, mis. https://pay.domainanda.com" },
    { field: "mcc", label: "Merchant Category Code (MCC)", ok: has(row?.mcc) },
    {
      field: "danaPublicKey",
      label: env === "production" ? "Public key DANA (wajib untuk verifikasi notifikasi)" : "Public key DANA (opsional — default kunci sandbox resmi)",
      ok: env === "sandbox" ? true : has(row?.danaPublicKeyEnc),
    },
    { field: "appUrl", label: "APP_URL HTTPS publik (untuk Notify/Redirect URL)", ok: config.appUrl.startsWith("https://") || env === "sandbox", hint: env === "sandbox" ? "Sandbox boleh memakai tunnel HTTPS (mis. ngrok) agar DANA bisa mengirim notifikasi." : undefined },
  ];
  return checks;
}

/** Mengembalikan null bila kredensial belum lengkap → UI menampilkan "Integrasi belum dikonfigurasi". */
export async function loadDanaConfig(env: Env, tx: DbOrTx = db): Promise<DanaConfig | null> {
  const row = await getConfigRow(env, tx);
  if (!row) return null;
  const required = checkConfigRow(env, row).filter((c) => c.field !== "appUrl");
  if (required.some((c) => !c.ok)) return null;
  return {
    env,
    partnerId: row.partnerId,
    merchantId: row.merchantId,
    subMerchantId: row.subMerchantId,
    externalStoreId: row.externalStoreId,
    origin: row.origin,
    mcc: row.mcc,
    privateKey: decrypt(row.privateKeyEnc!),
    danaPublicKey: row.danaPublicKeyEnc ? decrypt(row.danaPublicKeyEnc) : null,
    clientSecret: row.clientSecretEnc ? decrypt(row.clientSecretEnc) : null,
    qrisEnabled: row.qrisEnabled,
    disbursementEnabled: row.disbursementEnabled,
    merchantApproval: row.merchantApproval,
  };
}
