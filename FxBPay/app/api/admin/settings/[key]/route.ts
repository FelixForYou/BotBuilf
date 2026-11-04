import type { NextRequest } from "next/server";
import { authed } from "@/lib/api-helpers";
import { body } from "@/lib/http";
import { brandingSchema, feeSchema, getSetting, limitSchema, setSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

const schemas = { fees: feeSchema, limits: limitSchema, branding: brandingSchema } as const;
export const POST = authed<Record<string, never>, { key: string }>({ admin: true }, async ({ actor, req, params }) => {
  const key = params.key as keyof typeof schemas;
  if (!(key in schemas)) throw new AppError("not_found", "Pengaturan tidak dikenal", 404);
  const value = await body(req as NextRequest, schemas[key] as never);
  if (key === "limits") {
    const v = value as { paymentMin: number; paymentMax: number; withdrawalMin: number; withdrawalMax: number };
    if (v.paymentMin > v.paymentMax || v.withdrawalMin > v.withdrawalMax) throw new AppError("invalid", "Batas minimum tidak boleh melebihi maksimum");
  }
  const before = await getSetting(key);
  await setSetting(key, value as never, actor.id);
  await audit(actor, `settings.${key}`, { type: "settings", id: key }, { before, after: value });
  return { message: "Pengaturan disimpan" };
});
