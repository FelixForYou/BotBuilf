"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Field, Input, PageTransition, SectionLabel, Segmented, Skeleton, Textarea, toast } from "@/components/ui";
import { api } from "@/lib/client";

interface S { free_daily_limit: number; free_rpm: number; max_free_keys: number; max_keys_total: number; playground_daily_ip: number; registration_open: boolean; manual_payment_info: string; order_ttl_hours: number }
interface Res { settings: S; providers: { name: string; ok: boolean; detail: string }[]; endpoints: number }

const NUMS: [keyof S, string, string][] = [
  ["free_daily_limit", "Limit harian free", "request/hari per key free"],
  ["free_rpm", "Limit/menit free", "request/menit per key free"],
  ["max_free_keys", "Maks key free per user", ""],
  ["max_keys_total", "Maks key aktif per user", ""],
  ["playground_daily_ip", "Uji coba tanpa login", "request/hari per IP (Explorer)"],
  ["order_ttl_hours", "Batas waktu bayar", "jam"],
];

export default function AdminSettings() {
  const [d, setD] = useState<Res | null>(null);
  const [s, setS] = useState<S | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Res>("/api/admin/settings").then((r) => { setD(r); setS(r.settings); }).catch((e) => toast(e.message, "error"));
  }, []);
  if (!d || !s) return <Skeleton className="h-96 rounded-[26px]" />;
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Pengaturan layanan</h1>

      <SectionLabel>Status provider (dari env)</SectionLabel>
      <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
        {d.providers.map((p) => (
          <div key={p.name} className="flex items-center gap-3 px-4 py-3.5">
            {p.ok ? <CheckCircle2 className="size-5 shrink-0 text-mint" /> : <XCircle className="size-5 shrink-0 text-subtle" />}
            <div className="min-w-0">
              <div className="font-medium">{p.name}</div>
              <div className="truncate text-[12.5px] text-muted">{p.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Limit</SectionLabel>
      <Card className="grid gap-4 sm:grid-cols-2">
        {NUMS.map(([k, label, hint]) => (
          <Field key={k} label={label} hint={hint}>
            <Input inputMode="numeric" value={String(s[k])} onChange={(e) => setS({ ...s, [k]: Number(e.target.value.replace(/\D/g, "") || 0) })} />
          </Field>
        ))}
      </Card>

      <SectionLabel>Pendaftaran & pembayaran</SectionLabel>
      <Card className="space-y-4">
        <Field label="Pendaftaran user baru"><Segmented value={s.registration_open ? "1" : "0"} onChange={(v) => setS({ ...s, registration_open: v === "1" })} options={[{ value: "1", label: "Dibuka" }, { value: "0", label: "Ditutup" }]} /></Field>
        <Field label="Instruksi transfer manual" hint="Kosongkan untuk menonaktifkan metode manual. Contoh: BCA 123456 a.n. ..., QRIS, dsb.">
          <Textarea value={s.manual_payment_info} onChange={(e) => setS({ ...s, manual_payment_info: e.target.value })} maxLength={2000} />
        </Field>
      </Card>
      <Button size="lg" className="mt-6 w-full" loading={busy} onClick={async () => { setBusy(true); try { const r = await api<{ settings: S }>("/api/admin/settings", { method: "PATCH", body: s }); setS(r.settings); toast("Pengaturan disimpan."); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); } }}>Simpan pengaturan</Button>
    </PageTransition>
  );
}
