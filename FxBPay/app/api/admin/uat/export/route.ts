import { desc } from "drizzle-orm";
import { apiAuth } from "@/lib/auth/session";
import { route } from "@/lib/http";
import { db } from "@/lib/db";
import { testRuns } from "@/lib/db/schema";
import { SCENARIOS, productionChecklist } from "@/lib/uat/scenarios";

export const GET = route(async (req) => {
  await apiAuth({ admin: true });
  const runs = await db.select().from(testRuns).orderBy(desc(testRuns.createdAt)).limit(1000);
  const checklist = await productionChecklist();
  const title = (c: string) => SCENARIOS.find((s) => s.code === c)?.title ?? c;
  const report = {
    generatedAt: new Date().toISOString(),
    note: "Kategori 'official' dicatat MANUAL dari Merchant Portal DANA; FxB Pay tidak dapat membaca status UAT resmi secara otomatis.",
    checklist,
    runs: runs.map((r) => ({ category: r.category, scenario: r.scenario, title: title(r.scenario), status: r.status, responseCode: r.responseCode, durationMs: r.durationMs, at: r.createdAt, note: r.note, error: r.error, request: r.request, response: r.response })),
  };
  return new Response(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="fxbpay-laporan-uat-${new Date().toISOString().slice(0, 10)}.json"` } });
});
