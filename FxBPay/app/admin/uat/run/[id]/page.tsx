import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { testRuns } from "@/lib/db/schema";
import { findScenario } from "@/lib/uat/scenarios";
import { fmtDate } from "@/lib/format";
import { Badge, Card, KV, PageHeader, SectionTitle } from "@/components/ui";
import { ActionButton, CopyButton } from "@/components/client";

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [r] = await db.select().from(testRuns).where(eq(testRuns.id, id));
  if (!r) notFound();
  const s = findScenario(r.scenario);
  const dump = JSON.stringify({ scenario: r.scenario, category: r.category, status: r.status, responseCode: r.responseCode, durationMs: r.durationMs, at: r.createdAt, note: r.note, error: r.error, request: r.request, response: r.response }, null, 2);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={s?.title ?? r.scenario} back="/admin/uat" subtitle={<span className="flex items-center gap-2"><Badge tone={r.status === "PASSED" ? "mint" : r.status === "FAILED" ? "red" : "gray"}>{r.status}</Badge>{r.category === "official" && <Badge tone="amber">Dicatat manual</Badge>}</span>} />
      <Card><KV items={[["Kategori", r.category], ["Waktu eksekusi", fmtDate(r.createdAt)], ["Durasi", `${r.durationMs ?? "—"} ms`], ["Response code", r.responseCode ?? "—"], ["Hasil", r.note ?? "—"], ["Penyebab kegagalan", r.error ?? "—"]]} /></Card>
      <div className="mt-4 flex gap-2">{s?.run && <ActionButton action="/api/admin/uat/run" body={{ code: r.scenario }} icon="refresh" size="md">Ulangi</ActionButton>}<CopyButton value={dump} label="Salin detail" size="md" /></div>
      <SectionTitle>Request (disensor)</SectionTitle>
      <pre className="mono max-h-96 overflow-auto rounded-2xl bg-black/40 p-4 text-xs">{JSON.stringify(r.request, null, 2) ?? "—"}</pre>
      <SectionTitle>Response (disensor)</SectionTitle>
      <pre className="mono max-h-96 overflow-auto rounded-2xl bg-black/40 p-4 text-xs">{JSON.stringify(r.response, null, 2) ?? "—"}</pre>
    </div>
  );
}
