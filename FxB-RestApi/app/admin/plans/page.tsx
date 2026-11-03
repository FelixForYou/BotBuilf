"use client";

import { Archive, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Confirm } from "@/components/confirm";
import { Badge, Button, Field, Input, PageTransition, Segmented, Sheet, Skeleton, Textarea, toast } from "@/components/ui";
import { api, fmtIDR, fmtNum } from "@/lib/client";

interface P { id: string; name: string; description: string; price: number; duration_days: number; daily_limit: number; rpm_limit: number; rank: number; sort: number; active: number; sold: number }
const empty = { id: "", name: "", description: "", price: "", duration_days: "30", daily_limit: "", rpm_limit: "60", rank: "1", sort: "0", active: "1" };

export default function AdminPlans() {
  const [rows, setRows] = useState<P[] | null>(null);
  const [edit, setEdit] = useState<P | "new" | null>(null);
  const [f, setF] = useState(empty);
  const [del, setDel] = useState<P | null>(null);
  const load = useCallback(() => api<P[]>("/api/admin/plans").then(setRows).catch((e) => toast(e.message, "error")), []);
  useEffect(() => {
    void load();
  }, [load]);
  function open(p: P | "new") {
    setEdit(p);
    setF(p === "new" ? empty : { id: p.id, name: p.name, description: p.description, price: String(p.price), duration_days: String(p.duration_days), daily_limit: String(p.daily_limit), rpm_limit: String(p.rpm_limit), rank: String(p.rank), sort: String(p.sort), active: String(p.active) });
  }
  async function save() {
    const body = { ...f, price: Number(f.price), duration_days: Number(f.duration_days), daily_limit: Number(f.daily_limit), rpm_limit: Number(f.rpm_limit), rank: Number(f.rank), sort: Number(f.sort), active: f.active === "1" };
    try {
      if (edit === "new") await api("/api/admin/plans", { body });
      else await api(`/api/admin/plans/${f.id}`, { method: "PATCH", body });
      toast("Paket disimpan.");
      setEdit(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "") });
  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold">Paket premium</h1>
          <p className="text-[14.5px] text-muted">Harga, masa aktif, dan limit.</p>
        </div>
        <Button icon={Plus} onClick={() => open("new")}>Paket</Button>
      </div>
      <div className="mt-5 space-y-3">
        {!rows && <Skeleton className="h-40 rounded-[22px]" />}
        {rows?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-[22px] bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.name}</span>
                <Badge tone={p.active ? "mint" : "neutral"}>{p.active ? "aktif" : "nonaktif"}</Badge>
                <span className="font-mono text-[12px] text-subtle">{p.id}</span>
              </div>
              <div className="text-[13.5px] text-muted">{fmtIDR(p.price)} · {p.duration_days} hari · {fmtNum(p.daily_limit)}/hari · {p.rpm_limit}/mnt · terjual {p.sold}</div>
            </div>
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(p)}>Edit</Button>
            <Button size="sm" variant="danger" icon={Archive} onClick={() => setDel(p)} aria-label="Hapus" />
          </div>
        ))}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Paket baru" : "Edit paket"}>
        <div className="space-y-4">
          {edit === "new" && <Field label="ID (slug)" hint="huruf kecil, angka, -"><Input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></Field>}
          <Field label="Nama"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Deskripsi"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={200} className="min-h-20" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (IDR)"><Input inputMode="numeric" value={f.price} onChange={num("price")} /></Field>
            <Field label="Masa aktif (hari)"><Input inputMode="numeric" value={f.duration_days} onChange={num("duration_days")} /></Field>
            <Field label="Limit harian"><Input inputMode="numeric" value={f.daily_limit} onChange={num("daily_limit")} /></Field>
            <Field label="Limit/menit"><Input inputMode="numeric" value={f.rpm_limit} onChange={num("rpm_limit")} /></Field>
            <Field label="Level"><Input inputMode="numeric" value={f.rank} onChange={num("rank")} /></Field>
            <Field label="Urutan"><Input inputMode="numeric" value={f.sort} onChange={num("sort")} /></Field>
          </div>
          <Segmented value={f.active} onChange={(v) => setF({ ...f, active: v })} options={[{ value: "1", label: "Aktif" }, { value: "0", label: "Nonaktif" }]} />
          <Button size="lg" className="w-full" onClick={save}>Simpan</Button>
        </div>
      </Sheet>
      <Confirm open={!!del} danger title="Hapus paket?" text="Jika paket pernah dipesan, paket akan diarsipkan (nonaktif) agar riwayat order tetap utuh." confirmLabel="Hapus" onClose={() => setDel(null)} onConfirm={async () => { try { const r = await api<{ archived?: boolean }>(`/api/admin/plans/${del!.id}`, { method: "DELETE" }); toast(r.archived ? "Paket diarsipkan." : "Paket dihapus.", "info"); void load(); } catch (e) { toast((e as Error).message, "error"); } }} />
    </PageTransition>
  );
}
