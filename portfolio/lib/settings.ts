import "server-only";
import { z } from "zod";
import { db } from "./db";
import { DEFAULT_SETTINGS } from "@/db/seed.mjs";
import type { Settings } from "./types";

const text = (max: number) => z.string().trim().max(max);
const optionalUrl = text(300).refine((v) => {
  if (!v) return true;
  try { const u = new URL(v); return ["http:", "https:", "mailto:"].includes(u.protocol); } catch { return false; }
}, "URL tidak valid (pakai http://, https://, atau mailto:).");

export const settingsSchema = z.object({
  hero: z.object({ eyebrow: text(80), headline: text(180).min(4), sub: text(400) }),
  about: z.object({
    title: text(140),
    paragraphs: z.array(text(1200)).max(6),
    focus: z.array(text(60).min(1)).max(8),
  }),
  services: z.array(z.object({ title: text(60).min(1), body: text(400) })).max(8),
  contact: z.object({
    title: text(200),
    note: text(400),
    email: z.union([z.literal(""), z.email("Email tidak valid.").max(120)]),
    telegram: text(64).regex(/^@?[A-Za-z0-9_]{0,32}$/, "Username Telegram hanya huruf, angka, dan garis bawah."),
    whatsapp: text(20).regex(/^\+?[0-9 ]{0,18}$/, "Nomor WhatsApp hanya angka, contoh +62812xxxx."),
    location: text(80),
  }),
  socials: z.array(z.object({ label: text(30).min(1), url: optionalUrl.refine((v) => v.length > 0, "URL wajib diisi.") })).max(10),
  seo: z.object({ title: text(90).min(2), description: text(300) }),
  motion: z.enum(["full", "light", "minimal"]),
});

export function getSettings(): Settings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Record<string, unknown> = structuredClone(DEFAULT_SETTINGS);
  for (const r of rows) {
    try {
      const v = JSON.parse(r.value);
      const def = (DEFAULT_SETTINGS as Record<string, unknown>)[r.key];
      out[r.key] = def && typeof def === "object" && !Array.isArray(def) ? { ...def, ...v } : v;
    } catch { /* abaikan nilai rusak, pakai default */ }
  }
  return out as unknown as Settings;
}

export function saveSettings(input: unknown): Settings {
  const parsed = settingsSchema.parse(input);
  const st = db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  db().exec("BEGIN");
  try {
    for (const [k, v] of Object.entries(parsed)) st.run(k, JSON.stringify(v));
    db().exec("COMMIT");
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
  return getSettings();
}
