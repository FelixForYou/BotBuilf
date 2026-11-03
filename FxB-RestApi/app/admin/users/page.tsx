"use client";

import { Search, Shield, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Confirm } from "@/components/confirm";
import { useApp } from "@/components/providers";
import { Badge, Button, Input, PageTransition, Skeleton, toast } from "@/components/ui";
import { api, fmtDate } from "@/lib/client";

interface U { id: string; email: string; name: string; role: string; status: string; created_at: number; keys: number; premium: number }

export default function AdminUsers() {
  const { me } = useApp();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<U[] | null>(null);
  const [del, setDel] = useState<U | null>(null);
  const load = useCallback(() => api<U[]>(`/api/admin/users?q=${encodeURIComponent(q)}`).then(setRows).catch((e) => toast(e.message, "error")), [q]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  const patch = async (u: U, body: object) => {
    try {
      await api(`/api/admin/users/${u.id}`, { method: "PATCH", body });
      toast("Pengguna diperbarui.");
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Pengguna</h1>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Cari email atau nama" className="pl-12" />
      </div>
      <div className="mt-4 space-y-3">
        {!rows && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[22px]" />)}
        {rows?.length === 0 && <p className="py-8 text-center text-muted">Tidak ada pengguna.</p>}
        {rows?.map((u) => (
          <div key={u.id} className="rounded-[22px] bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{u.name}</span>
              {u.role === "admin" && <Badge tone="warn">admin</Badge>}
              {u.status === "banned" && <Badge tone="danger">ditangguhkan</Badge>}
              {Number(u.premium) > 0 && <Badge tone="mint">premium</Badge>}
            </div>
            <div className="truncate text-[13.5px] text-muted">{u.email} · {u.keys} key · daftar {fmtDate(u.created_at)}</div>
            {u.id !== me?.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                {u.role === "admin" ? (
                  <Button size="sm" variant="secondary" icon={ShieldOff} onClick={() => patch(u, { role: "user" })}>Jadikan user</Button>
                ) : (
                  <Button size="sm" variant="secondary" icon={Shield} onClick={() => patch(u, { role: "admin" })}>Jadikan admin</Button>
                )}
                {u.status === "active" ? (
                  <Button size="sm" variant="secondary" icon={UserX} onClick={() => patch(u, { status: "banned" })}>Tangguhkan</Button>
                ) : (
                  <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => patch(u, { status: "active" })}>Aktifkan</Button>
                )}
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDel(u)}>Hapus</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Confirm open={!!del} danger title="Hapus pengguna?" text={<>Akun <b>{del?.email}</b> dan semua API key-nya akan dihapus permanen. Riwayat order tetap disimpan.</>} confirmLabel="Hapus" onClose={() => setDel(null)} onConfirm={async () => { try { await api(`/api/admin/users/${del!.id}`, { method: "DELETE" }); toast("Pengguna dihapus.", "info"); void load(); } catch (e) { toast((e as Error).message, "error"); } }} />
    </PageTransition>
  );
}
