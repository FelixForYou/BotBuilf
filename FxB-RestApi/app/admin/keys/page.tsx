"use client";

import { Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Field, Input, PageTransition, Segmented, Select, Sheet, Skeleton, toast } from "@/components/ui";
import { api, fmtDate, fmtNum, fmtRel } from "@/lib/client";

interface K { id: string; name: string; prefix: string; tier: string; plan_id: string | null; daily_limit: number | null; rpm_limit: number | null; expires_at: number | null; status: string; created_at: number; last_used_at: number | null; email: string; used_today: number }
interface Plan { id: string; name: string }

export default function AdminKeys() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"" | "free" | "premium">("");
  const [rows, setRows] = useState<K[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [edit, setEdit] = useState<K | null>(null);
  const [form, setForm] = useState({ tier: "free", plan_id: "", daily_limit: "", rpm_limit: "", expires: "", status: "active" });
  const load = useCallback(() => api<K[]>(`/api/admin/keys?q=${encodeURIComponent(q)}&tier=${tier}`).then(setRows).catch((e) => toast(e.message, "error")), [q, tier]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    api<Plan[]>("/api/admin/plans").then(setPlans).catch(() => {});
  }, []);
  function open(k: K) {
    setEdit(k);
    setForm({
      tier: k.tier, plan_id: k.plan_id ?? "", daily_limit: k.daily_limit ? String(k.daily_limit) : "", rpm_limit: k.rpm_limit ? String(k.rpm_limit) : "",
      expires: k.expires_at ? new Date(Number(k.expires_at)).toISOString().slice(0, 10) : "", status: k.status,
    });
  }
  async function save() {
    try {
      await api(`/api/admin/keys/${edit!.id}`, {
        method: "PATCH",
        body: { tier: form.tier, plan_id: form.plan_id || null, daily_limit: form.daily_limit, rpm_limit: form.rpm_limit, expires_at: form.expires ? new Date(form.expires + "T23:59:59+07:00").getTime() : null, status: form.status },
      });
      toast("Key diperbarui.");
      setEdit(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">API Key</h1>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Email, nama key, atau prefix fxb_…" className="pl-12" />
      </div>
      <div className="mt-3"><Segmented value={tier} onChange={setTier} options={[{ value: "", label: "Semua" }, { value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} /></div>
      <div className="mt-4 space-y-3">
        {!rows && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[22px]" />)}
        {rows?.length === 0 && <p className="py-8 text-center text-muted">Tidak ada key.</p>}
        {rows?.map((k) => (
          <div key={k.id} className="flex items-center gap-3 rounded-[22px] bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{k.name}</span>
                <Badge tone={k.tier === "premium" ? "mint" : "neutral"}>{k.tier}{k.plan_id ? ` · ${k.plan_id}` : ""}</Badge>
                {k.status !== "active" && <Badge tone="danger">revoked</Badge>}
                {k.tier === "premium" && k.expires_at && Number(k.expires_at) < Date.now() && <Badge tone="warn">expired</Badge>}
              </div>
              <div className="truncate font-mono text-[12.5px] text-muted">{k.prefix}… · {k.email}</div>
              <div className="text-[12.5px] text-subtle">hari ini {fmtNum(Number(k.used_today))} · dipakai {fmtRel(k.last_used_at)} · s/d {fmtDate(k.expires_at)}</div>
            </div>
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(k)}>Atur</Button>
          </div>
        ))}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Atur API key" subtitle={edit ? `${edit.prefix}… · ${edit.email}` : ""}>
        <div className="space-y-4">
          <Segmented value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} />
          {form.tier === "premium" && (
            <>
              <Field label="Paket"><Select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}><option value="">— tanpa paket —</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
              <Field label="Berlaku sampai" hint="Kosong = tanpa batas."><Input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></Field>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Limit harian" hint="Kosong = default"><Input inputMode="numeric" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Limit/menit" hint="Kosong = default"><Input inputMode="numeric" value={form.rpm_limit} onChange={(e) => setForm({ ...form, rpm_limit: e.target.value.replace(/\D/g, "") })} /></Field>
          </div>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Aktif</option><option value="revoked">Revoked</option></Select></Field>
          <Button size="lg" className="w-full" onClick={save}>Simpan</Button>
        </div>
      </Sheet>
    </PageTransition>
  );
}
