import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { getSetting, setSetting } from "@/lib/settings";
import { productionChecklist } from "@/lib/uat/scenarios";
import { verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify";

const S = z.object({ enable: z.boolean(), confirmText: z.string().optional().default(""), password: z.string().min(1, "Password admin wajib") });
export const POST = authed({ admin: true, schema: S, limit: 5 }, async ({ auth, actor, input }) => {
  if (!(await verifyPassword(input.password, auth.user.passwordHash))) throw new AppError("invalid_password", "Password admin salah");
  if (input.enable) {
    if (input.confirmText !== "AKTIFKAN PRODUCTION") throw new AppError("confirm", "Ketik AKTIFKAN PRODUCTION untuk konfirmasi");
    const list = await productionChecklist();
    const missing = list.filter((i) => !i.ok);
    if (missing.length) throw new AppError("checklist_incomplete", `Checklist belum lengkap: ${missing.map((m) => m.label).join("; ")}`, 409);
  }
  const prev = await getSetting("production");
  await setSetting("production", { enabled: input.enable, activatedAt: input.enable ? new Date().toISOString() : prev.activatedAt, activatedBy: input.enable ? auth.user.email : prev.activatedBy }, actor.id);
  await audit(actor, input.enable ? "production.enable" : "production.disable", { type: "settings", id: "production" });
  await notifyAdmins("system", input.enable ? "Production diaktifkan" : "Production dinonaktifkan", `Oleh ${auth.user.email}`);
  return { message: input.enable ? "Mode Production aktif" : "Mode Production dinonaktifkan" };
});
