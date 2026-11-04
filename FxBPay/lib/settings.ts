import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, type DbOrTx } from "./db";
import { settings } from "./db/schema";

export const feeSchema = z.object({
  paymentFlat: z.coerce.number().int().min(0).max(1_000_000),
  paymentBps: z.coerce.number().int().min(0).max(2000), // 100 bps = 1%
  paymentMin: z.coerce.number().int().min(0).max(1_000_000),
  withdrawalFlat: z.coerce.number().int().min(0).max(1_000_000),
  defaultFeeBearer: z.enum(["merchant", "customer"]),
  holdHours: z.coerce.number().int().min(0).max(24 * 30),
});
export const limitSchema = z.object({
  paymentMin: z.coerce.number().int().min(1),
  paymentMax: z.coerce.number().int().min(1).max(1_000_000_000),
  withdrawalMin: z.coerce.number().int().min(1),
  withdrawalMax: z.coerce.number().int().min(1).max(1_000_000_000),
  withdrawalDailyMax: z.coerce.number().int().min(1).max(10_000_000_000),
  linkMaxHours: z.coerce.number().int().min(1).max(24 * 7),
});
export const brandingSchema = z.object({
  siteName: z.string().min(1).max(60),
  tagline: z.string().max(120),
  supportEmail: z.string().email().or(z.literal("")),
  supportPhone: z.string().max(30),
  footerNote: z.string().max(240),
  registrationOpen: z.boolean(),
  maintenanceBanner: z.string().max(240),
});
export const productionSchema = z.object({
  enabled: z.boolean(),
  activatedAt: z.string().nullable(),
  activatedBy: z.string().nullable(),
});

export type FeeSettings = z.infer<typeof feeSchema>;
export type LimitSettings = z.infer<typeof limitSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type ProductionSettings = z.infer<typeof productionSchema>;

const DEFAULTS = {
  fees: { paymentFlat: 0, paymentBps: 70, paymentMin: 500, withdrawalFlat: 2500, defaultFeeBearer: "merchant", holdHours: 24 } as FeeSettings,
  limits: { paymentMin: 1000, paymentMax: 20_000_000, withdrawalMin: 10_000, withdrawalMax: 50_000_000, withdrawalDailyMax: 100_000_000, linkMaxHours: 72 } as LimitSettings,
  branding: {
    siteName: "FxB Pay",
    tagline: "Payment gateway BY FELIXIORITY",
    supportEmail: "",
    supportPhone: "",
    footerNote: "FxB Pay — BY FELIXIORITY",
    registrationOpen: true,
    maintenanceBanner: "",
  } as BrandingSettings,
  production: { enabled: false, activatedAt: null, activatedBy: null } as ProductionSettings,
  harness: { privateKeyEnc: null as string | null, publicKey: null as string | null },
};
export type SettingKey = keyof typeof DEFAULTS;
type SettingValue<K extends SettingKey> = (typeof DEFAULTS)[K];

export async function getSetting<K extends SettingKey>(key: K, tx: DbOrTx = db): Promise<SettingValue<K>> {
  const row = await tx.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return { ...DEFAULTS[key], ...((row[0]?.value as object) ?? {}) } as SettingValue<K>;
}

export async function setSetting<K extends SettingKey>(key: K, value: SettingValue<K>, by: string | null, tx: DbOrTx = db) {
  await tx
    .insert(settings)
    .values({ key, value, updatedBy: by })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: by, updatedAt: new Date() } });
}
