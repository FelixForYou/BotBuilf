import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { recordOfficial } from "@/lib/uat/scenarios";
import { audit } from "@/lib/audit";

const S = z.object({ code: z.string(), status: z.enum(["PASSED", "FAILED", "NOT_TESTED"]), note: z.string().trim().min(5, "Catat bukti dari Merchant Portal").max(500), evidenceUrl: z.string().trim().url().or(z.literal("")).optional().default("") });
export const POST = authed({ admin: true, schema: S }, async ({ actor, input }) => {
  const r = await recordOfficial(input.code, input.status, input.note, input.evidenceUrl, actor.id!);
  await audit(actor, "uat.official_record", { type: "test_run", id: r.id }, input);
  return { message: "Status UAT resmi dicatat (manual)" };
});
