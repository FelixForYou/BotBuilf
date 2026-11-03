import "server-only";
import { all, run } from "./db";

export interface SiteSettings {
  free_daily_limit: number;
  free_rpm: number;
  max_free_keys: number;
  max_keys_total: number;
  playground_daily_ip: number;
  registration_open: boolean;
  manual_payment_info: string;
  order_ttl_hours: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  free_daily_limit: 100,
  free_rpm: 20,
  max_free_keys: 2,
  max_keys_total: 10,
  playground_daily_ip: 15,
  registration_open: true,
  manual_payment_info: "",
  order_ttl_hours: 24,
};

let cache: { at: number; value: SiteSettings } | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < 15_000) return cache.value;
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const v: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (!(r.key in v)) continue;
    try {
      (v as unknown as Record<string, unknown>)[r.key] = JSON.parse(r.value);
    } catch {
      /* abaikan */
    }
  }
  cache = { at: Date.now(), value: v };
  return v;
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const cur = await getSettings();
  for (const [k, val] of Object.entries(patch)) {
    if (!(k in DEFAULT_SETTINGS)) continue;
    const def = (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[k];
    if (typeof val !== typeof def) continue;
    if (typeof val === "number" && (!Number.isFinite(val) || val < 0 || val > 10_000_000)) continue;
    if (typeof val === "string" && val.length > 2000) continue;
    await run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [k, JSON.stringify(val)]);
    (cur as unknown as Record<string, unknown>)[k] = val;
  }
  cache = null;
  return getSettings();
}
