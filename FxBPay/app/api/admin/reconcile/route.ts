import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { runReconciliation } from "@/lib/admin-ledger";
import { audit } from "@/lib/audit";

export const POST = authed({ admin: true, schema: z.object({ env: z.enum(["sandbox", "production"]) }), limit: 6 }, async ({ actor, input }) => {
  const r = await runReconciliation(input.env, actor.id);
  await audit(actor, "reconcile.run", { type: "reconciliation", id: r.id }, { env: input.env, status: r.status });
  return { message: r.status === "ok" ? "Rekonsiliasi cocok" : `Ditemukan ${r.summary.mismatchCount} selisih` };
});
