"use client";

import { useState } from "react";
import { ActionForm, ActionButton, CopyButton, Sheet, Button, api, useToast } from "@/components/client";
import { Notice } from "@/components/ui";
import { useRouter } from "next/navigation";

function Reveal({ secret, label }: { secret: string; label: string }) {
  return (
    <div className="space-y-3">
      <Notice tone="warn" title={`Simpan ${label} sekarang`}>Nilai ini hanya ditampilkan sekali dan disimpan di server dalam bentuk hash/terenkripsi.</Notice>
      <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4"><span className="mono min-w-0 flex-1 break-all text-sm">{secret}</span><CopyButton value={secret} iconOnly /></div>
    </div>
  );
}

export function CreateKey({ scopes, env }: { scopes: { value: string; label: string }[]; env: string }) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <>
      <Button icon="plus" onClick={() => { setSecret(null); setOpen(true); }}>API key baru</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="API key baru">
        {secret ? <Reveal secret={secret} label="API key" /> : (
          <ActionForm action="/api/developer/keys" submit={`Buat key ${env === "production" ? "Production" : "Sandbox"}`} onDone={(d) => setSecret((d as { secret: string }).secret)}>
            <div><label className="label" htmlFor="kname">Nama</label><input id="kname" name="name" className="input" placeholder="mis. Server toko" /></div>
            <fieldset><legend className="label">Scope</legend>
              <div className="grid gap-2">{scopes.map((s) => (
                <label key={s.value} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm"><input type="checkbox" name="scopes" value={s.value} data-multi defaultChecked className="h-4 w-4 accent-[#58dcc5]" /><span className="mono text-xs text-mint">{s.value}</span>{s.label}</label>
              ))}</div>
            </fieldset>
            <div><label className="label" htmlFor="exp">Kedaluwarsa</label>
              <select id="exp" name="expiresInDays" className="input" defaultValue="90"><option value="30">30 hari</option><option value="90">90 hari</option><option value="365">1 tahun</option><option value="0">Tidak kedaluwarsa</option></select>
            </div>
          </ActionForm>
        )}
      </Sheet>
    </>
  );
}

export function RotateKey({ id }: { id: string }) {
  const [secret, setSecret] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button size="sm" variant="secondary" icon="refresh" onClick={async () => {
        if (!confirm("Key lama langsung dicabut. Lanjutkan rotasi?")) return;
        try { const r = await api<{ secret: string }>(`/api/developer/keys/${id}/rotate`); setSecret(r.secret); router.refresh(); } catch (e) { toast((e as Error).message, "err"); }
      }}>Rotasi</Button>
      <Sheet open={!!secret} onClose={() => setSecret(null)} title="Key baru">{secret && <Reveal secret={secret} label="API key" />}</Sheet>
    </>
  );
}

export function CreateWebhook({ events }: { events: string[] }) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <>
      <Button icon="plus" onClick={() => { setSecret(null); setOpen(true); }}>Tambah endpoint</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Endpoint webhook">
        {secret ? <Reveal secret={secret} label="signing secret" /> : (
          <ActionForm action="/api/developer/webhooks" submit="Simpan endpoint" onDone={(d) => setSecret((d as { secret: string }).secret)}>
            <div><label className="label" htmlFor="wurl">URL (https)</label><input id="wurl" name="url" className="input" placeholder="https://tokoanda.com/webhooks/fxbpay" /></div>
            <fieldset><legend className="label">Event</legend>
              <div className="grid gap-2 sm:grid-cols-2">{events.map((e) => (
                <label key={e} className="flex items-center gap-2 rounded-2xl bg-surface p-3 text-sm"><input type="checkbox" name="events" value={e} data-multi defaultChecked className="h-4 w-4 accent-[#58dcc5]" /><span className="mono text-xs">{e}</span></label>
              ))}</div>
            </fieldset>
            <p className="text-xs text-subtle">Alamat internal/privat ditolak (proteksi SSRF). Redirect tidak diikuti.</p>
          </ActionForm>
        )}
      </Sheet>
    </>
  );
}

export { ActionButton };
