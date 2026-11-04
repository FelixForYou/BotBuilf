import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { providerConfigs } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

/** Pencatatan MANUAL status persetujuan merchant dari DANA (tidak menggantikan persetujuan DANA). */
export const POST = authed<{ status: "not_started" | "uat_in_progress" | "approved" | "rejected"; note: string }, { env: string }>(
  { admin: true, schema: z.object({ status: z.enum(["not_started", "uat_in_progress", "approved", "rejected"]), note: z.string().trim().min(5, "Catat sumber/bukti (mis. email DANA tanggal ...)").max(500) }) },
  async ({ actor, input, params }) => {
    if (params.env !== "production" && params.env !== "sandbox") throw new AppError("not_found", "Env tidak dikenal", 404);
    const env = params.env;
    await db.insert(providerConfigs).values({ env, merchantApproval: input.status, merchantApprovalNote: input.note }).onConflictDoUpdate({ target: providerConfigs.env, set: { merchantApproval: input.status, merchantApprovalNote: input.note, updatedAt: new Date() } });
    await audit(actor, "dana.merchant_approval_record", { type: "provider_config", id: env }, input);
    return { message: "Status persetujuan dicatat (manual)" };
  },
);
