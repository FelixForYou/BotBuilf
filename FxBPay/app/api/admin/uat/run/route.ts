import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { runCategory, runScenario } from "@/lib/uat/scenarios";
import { audit } from "@/lib/audit";

export const POST = authed({ admin: true, schema: z.object({ code: z.string().max(80).optional(), category: z.enum(["local", "sandbox"]).optional() }), limit: 30 }, async ({ actor, input }) => {
  if (input.category) {
    const r = await runCategory(input.category, actor.id);
    const passed = r.results.filter((x) => x.status === "PASSED").length;
    await audit(actor, "uat.run_category", { type: "uat", id: input.category }, { passed, total: r.results.length });
    return { message: `${passed}/${r.results.length} skenario lulus` };
  }
  const r = await runScenario(input.code ?? "", actor.id);
  return { message: r.status === "PASSED" ? "Lulus" : `Gagal: ${r.error ?? ""}`.slice(0, 200) };
});
