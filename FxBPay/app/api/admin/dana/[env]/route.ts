import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { providerConfigs } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { loadPrivateKey, loadPublicKey } from "@/lib/dana/signature";
import { verifyPassword } from "@/lib/password";

const S = z.object({
  partnerId: z.string().trim().max(64),
  merchantId: z.string().trim().max(64),
  subMerchantId: z.string().trim().max(64).optional().default(""),
  externalStoreId: z.string().trim().max(64).optional().default(""),
  origin: z.string().trim().max(200).refine((v) => v === "" || /^https?:\/\/[^\s/]+$/.test(v), "Origin harus berupa skema+domain, mis. https://pay.domainanda.com"),
  mcc: z.string().trim().regex(/^\d{4}$|^$/, "MCC 4 digit"),
  privateKey: z.string().trim().max(10000).optional().default(""),
  danaPublicKey: z.string().trim().max(10000).optional().default(""),
  clientSecret: z.string().trim().max(500).optional().default(""),
  qrisEnabled: z.boolean().optional().default(false),
  password: z.string().min(1, "Konfirmasi password admin"),
});

/** Kredensial disimpan terenkripsi AES-256-GCM; field rahasia kosong = tidak diubah. */
export const POST = authed<z.infer<typeof S>, { env: string }>({ admin: true, schema: S, limit: 20 }, async ({ auth, actor, input, params }) => {
  const env = params.env;
  if (env !== "sandbox" && env !== "production") throw new AppError("not_found", "Env tidak dikenal", 404);
  if (!(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Password admin salah");
  if (input.privateKey) {
    try {
      loadPrivateKey(input.privateKey);
    } catch {
      throw new AppError("invalid_key", "Private key tidak valid (format PEM/PKCS#8 atau PKCS#1)");
    }
  }
  if (input.danaPublicKey) {
    try {
      loadPublicKey(input.danaPublicKey);
    } catch {
      throw new AppError("invalid_key", "Public key DANA tidak valid");
    }
  }
  const base = { partnerId: input.partnerId, merchantId: input.merchantId, subMerchantId: input.subMerchantId, externalStoreId: input.externalStoreId, origin: input.origin, mcc: input.mcc, qrisEnabled: input.qrisEnabled, updatedBy: actor.id, updatedAt: new Date() };
  const secrets: Record<string, string> = {};
  if (input.privateKey) secrets.privateKeyEnc = encrypt(input.privateKey);
  if (input.danaPublicKey) secrets.danaPublicKeyEnc = encrypt(input.danaPublicKey);
  if (input.clientSecret) secrets.clientSecretEnc = encrypt(input.clientSecret);
  await db.insert(providerConfigs).values({ env, ...base, ...secrets }).onConflictDoUpdate({ target: providerConfigs.env, set: { ...base, ...secrets } });
  await audit(actor, "dana.config_update", { type: "provider_config", id: env }, { ...base, changedSecrets: Object.keys(secrets) });
  return { message: "Konfigurasi DANA disimpan (terenkripsi)" };
});
