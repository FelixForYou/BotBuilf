"use client";

import { Search, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MethodBadge, StatusDot } from "@/components/endpoint-row";
import { Badge, Button, Field, Input, PageTransition, Segmented, Sheet, Skeleton, toast } from "@/components/ui";
import type { EndpointPublic } from "@/lib/catalog-types";
import { api, fmtNum } from "@/lib/client";

type E = EndpointPublic & { default_tier: string; missing_env: string[]; requests_7d: number; errors_7d: number };

export default function AdminEndpoints() {
  const [rows, setRows] = useState<E[] | null>(null);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<E | null>(null);
  const [form, setForm] = useState({ enabled: "on", tier: "default", note: "" });
  const load = useCallback(() => api<E[]>("/api/admin/endpoints").then(setRows).catch((e) => toast(e.message, "error")), []);
  useEffect(() => {
    void load();
  }, [load]);
  const list = useMemo(() => rows?.filter((r) => !q || r.id.includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())) ?? [], [rows, q]);
  function open(e: E) {
    setEdit(e);
    setForm({ enabled: e.status === "maintenance" ? "off" : "on", tier: e.tier === e.default_tier ? "default" : e.tier, note: e.note ?? "" });
  }
  async function save() {
    try {
      await api(`/api/admin/endpoints/${encodeURIComponent(edit!.id)}`, { method: "PATCH", body: { enabled: form.enabled === "on", tier: form.tier === "default" ? null : form.tier, note: form.note } });
      toast("Endpoint diperbarui.");
      setEdit(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Endpoint</h1>
      <p className="text-[14.5px] text-muted">Aktif/nonaktifkan, ubah tier, dan beri catatan maintenance. Endpoint &quot;belum aktif&quot; butuh variabel env.</p>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Cari endpoint" className="pl-12" />
      </div>
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-[22px] bg-card">
        {!rows && <Skeleton className="m-4 h-64" />}
        {list.map((e) => (
          <button key={e.id} onClick={() => open(e)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-card-2">
            <MethodBadge m={e.method} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium">{e.name}</span>
                <Badge tone={e.tier === "premium" ? "warn" : "neutral"}>{e.tier}</Badge>
                {e.missing_env.length > 0 && <Badge>env: {e.missing_env.join(", ")}</Badge>}
              </div>
              <div className="truncate font-mono text-[12px] text-muted">{e.id} · 7h: {fmtNum(e.requests_7d)} req · {e.errors_7d} err</div>
            </div>
            <StatusDot s={e.status} />
            <Settings2 className="size-4 text-subtle" />
          </button>
        ))}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.name} subtitle={edit?.path}>
        <div className="space-y-4">
          <Field label="Status"><Segmented value={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} options={[{ value: "on", label: "Aktif" }, { value: "off", label: "Maintenance" }]} /></Field>
          <Field label="Tier" hint={`Default kode: ${edit?.default_tier}`}><Segmented value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} options={[{ value: "default", label: "Default" }, { value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} /></Field>
          <Field label="Catatan (tampil di docs & pesan error maintenance)"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} /></Field>
          <Button size="lg" className="w-full" onClick={save}>Simpan</Button>
        </div>
      </Sheet>
    </PageTransition>
  );
}
