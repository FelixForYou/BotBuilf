import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { buildFinishNotify, sendHarnessNotify } from "@/lib/uat/harness";
import { AppError, notFound } from "@/lib/errors";
import { audit } from "@/lib/audit";

/** Simulasi callback — KHUSUS SANDBOX & ADMIN. Ditandatangani test harness lokal, diverifikasi di jalur notify sandbox. */
const S = z.object({ partnerReferenceNo: z.string().trim().min(5), status: z.enum(["00", "05"]), amountOverride: z.string().trim().regex(/^\d*$/).optional().default(""), times: z.coerce.number().int().min(1).max(5).default(1) });
export const POST = authed({ admin: true, schema: S, limit: 30 }, async ({ actor, input }) => {
  const [p] = await db.select().from(payments).where(and(eq(payments.env, "sandbox"), eq(payments.partnerReferenceNo, input.partnerReferenceNo)));
  if (!p) throw notFound("Pembayaran sandbox");
  if (p.env !== "sandbox") throw new AppError("forbidden", "Simulasi hanya untuk sandbox", 403);
  const outs: string[] = [];
  for (let i = 0; i < input.times; i++) {
    const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: input.amountOverride ? BigInt(input.amountOverride) : p.amount, status: input.status }));
    outs.push(r.response.outcome);
  }
  await audit(actor, "uat.simulate_callback", { type: "payment", id: p.id }, { ...input, outcomes: outs });
  return { message: `Hasil: ${outs.join(", ")}` };
});
