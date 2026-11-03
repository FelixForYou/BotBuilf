import "server-only";
import { all, one } from "./db";
import { sha256 } from "./crypto";
import { getSettings } from "./settings";

export interface KeyRow {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  tier: "free" | "premium";
  plan_id: string | null;
  daily_limit: number | null;
  rpm_limit: number | null;
  expires_at: number | null;
  status: "active" | "revoked";
  created_at: number;
  last_used_at: number | null;
}

export interface EffectiveKey {
  keyId: string;
  userId: string;
  tier: "free" | "premium";
  premiumExpired: boolean;
  daily: number;
  rpm: number;
}

/** Hitung tier & limit efektif (premium kedaluwarsa → kembali ke free). */
export async function effective(k: KeyRow): Promise<EffectiveKey> {
  const s = await getSettings();
  const premiumActive = k.tier === "premium" && (!k.expires_at || Number(k.expires_at) > Date.now());
  const expired = k.tier === "premium" && !premiumActive;
  if (premiumActive) {
    return { keyId: k.id, userId: k.user_id, tier: "premium", premiumExpired: false, daily: Number(k.daily_limit ?? s.free_daily_limit), rpm: Number(k.rpm_limit ?? s.free_rpm) };
  }
  // Key free boleh punya limit khusus dari admin (daily_limit diisi saat tier=free).
  return {
    keyId: k.id,
    userId: k.user_id,
    tier: "free",
    premiumExpired: expired,
    daily: k.tier === "free" && k.daily_limit ? Number(k.daily_limit) : s.free_daily_limit,
    rpm: k.tier === "free" && k.rpm_limit ? Number(k.rpm_limit) : s.free_rpm,
  };
}

export async function findKeyBySecret(secret: string): Promise<(KeyRow & { user_status: string }) | null> {
  return one<KeyRow & { user_status: string }>(
    "SELECT k.*, u.status AS user_status FROM api_keys k JOIN users u ON u.id = k.user_id WHERE k.key_hash = ?",
    [sha256(secret)],
  );
}

export async function userKeys(userId: string): Promise<KeyRow[]> {
  return all<KeyRow>("SELECT id,user_id,name,prefix,tier,plan_id,daily_limit,rpm_limit,expires_at,status,created_at,last_used_at FROM api_keys WHERE user_id=? ORDER BY created_at DESC", [userId]);
}

/** Key terbaik milik user untuk API Explorer (premium aktif dulu). */
export async function bestKey(userId: string): Promise<KeyRow | null> {
  const keys = (await userKeys(userId)).filter((k) => k.status === "active");
  const now = Date.now();
  return keys.find((k) => k.tier === "premium" && (!k.expires_at || Number(k.expires_at) > now)) ?? keys[0] ?? null;
}
