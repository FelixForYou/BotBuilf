"use client";

import { AnimatePresence, motion } from "motion/react";
import { Ban, Crown, KeyRound, Pencil, Plus, RefreshCw, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Confirm } from "@/components/confirm";
import { KeyReveal } from "@/components/key-reveal";
import { useApp } from "@/components/providers";
import { Badge, Button, Card, EmptyState, Field, Input, PageTransition, ProgressBar, Segmented, Sheet, Skeleton, StatGrid, toast } from "@/components/ui";
import { api, fmtDate, fmtNum, fmtRel } from "@/lib/client";

interface Key {
  id: string; name: string; prefix: string; tier: string; status: string; effective_tier: "free" | "premium"; premium_expired: boolean;
  plan_name: string | null; expires_at: number | null; created_at: number; last_used_at: number | null; used_today: number; daily: number; rpm: number;
}

export default function KeysPage() {
  return <Suspense><Keys /></Suspense>;
}

function Keys() {
  const { refreshMe } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [createOpen, setCreateOpen] = useState(sp.get("new") === "1");
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<"free" | "premium">("free");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [rename, setRename] = useState<Key | null>(null);
  const [newName, setNewName] = useState("");
  const [confirm, setConfirm] = useState<{ type: "revoke" | "regen"; key: Key } | null>(null);
  const [regenSecret, setRegenSecret] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);

  const load = useCallback(() => api<Key[]>("/api/keys").then(setKeys).catch((e) => toast(e.message, "error")), []);
  useEffect(() => {
    void load();
  }, [load]);

  function closeCreate() {
    setCreateOpen(false);
    setTimeout(() => { setStep(1); setSecret(null); setName(""); setKind("free"); }, 300);
    if (sp.get("new")) router.replace("/dashboard/keys");
  }

  async function create() {
    if (kind === "premium") return router.push("/pricing");
    setBusy(true);
    try {
      const r = await api<{ key: string }>("/api/keys", { body: { name: name || "My key" } });
      setSecret(r.key);
      setStep(2);
      void load();
      void refreshMe();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const list = keys?.filter((k) => showRevoked || k.status === "active") ?? [];
  const revokedCount = keys?.filter((k) => k.status !== "active").length ?? 0;

  return (
    <PageTransition>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold">API Key</h1>
          <p className="text-[14.5px] text-muted">Buat, ganti, cabut, dan upgrade key.</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>Buat</Button>
      </div>

      <div className="mt-5 space-y-4">
        {!keys && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-[26px]" />)}
        {keys && list.length === 0 && <EmptyState icon={KeyRound} title="Belum ada API key aktif" text="Buat key gratis untuk mulai memanggil endpoint." action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Buat API key</Button>} />}
        <AnimatePresence>
          {list.map((k) => (
            <motion.div key={k.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
              <Card className={k.status !== "active" ? "opacity-55" : ""}>
                <div className="flex items-start gap-3">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${k.effective_tier === "premium" ? "bg-mint text-mint-ink" : "bg-mint-soft text-mint"}`}>
                    {k.effective_tier === "premium" ? <Crown className="size-6" /> : <KeyRound className="size-6" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[17px] font-semibold">{k.name}</span>
                      {k.status !== "active" ? <Badge tone="danger">revoked</Badge> : <Badge tone={k.effective_tier === "premium" ? "mint" : "neutral"}>{k.effective_tier === "premium" ? `Premium · ${k.plan_name ?? ""}` : "Free"}</Badge>}
                      {k.premium_expired && <Badge tone="warn">premium berakhir</Badge>}
                    </div>
                    <code className="mt-0.5 block font-mono text-[13px] text-muted">{k.prefix}••••••••••••••••••••••</code>
                  </div>
                </div>
                {k.status === "active" && (
                  <>
                    <div className="mt-4">
                      <ProgressBar value={(k.used_today / Math.max(1, k.daily)) * 100} />
                      <div className="mt-1.5 flex justify-between text-[12.5px] text-muted">
                        <span>{fmtNum(k.used_today)} / {fmtNum(k.daily)} hari ini</span>
                        <span>{k.rpm}/menit</span>
                      </div>
                    </div>
                    <StatGrid className="mt-4" items={[{ value: fmtDate(k.created_at), label: "Dibuat" }, { value: fmtRel(k.last_used_at), label: "Terakhir dipakai" }, { value: k.effective_tier === "premium" ? fmtDate(k.expires_at) : "—", label: "Berlaku s/d" }]} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => { setRename(k); setNewName(k.name); }}>Ganti nama</Button>
                      <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setConfirm({ type: "regen", key: k })}>Buat ulang</Button>
                      <Button size="sm" variant="primary" icon={Sparkles} href="/pricing">{k.effective_tier === "premium" ? "Perpanjang" : "Upgrade"}</Button>
                      <Button size="sm" variant="danger" icon={Ban} onClick={() => setConfirm({ type: "revoke", key: k })}>Cabut</Button>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {revokedCount > 0 && (
          <button onClick={() => setShowRevoked(!showRevoked)} className="mx-auto block text-[14px] text-muted hover:text-fg">
            {showRevoked ? "Sembunyikan" : "Tampilkan"} {revokedCount} key yang dicabut
          </button>
        )}
      </div>

      <Card className="mt-6 text-[14px] text-muted">
        <b className="text-fg">Cara pakai:</b> tambahkan <code className="text-mint">?apikey=KEY</code> pada URL, atau header <code className="text-mint">X-API-Key: KEY</code>. Key disimpan dalam bentuk hash — kami tidak bisa menampilkannya lagi. Jika hilang, gunakan <b>Buat ulang</b>.
      </Card>

      {/* Create sheet — gaya "Create · Step 1 of 2" */}
      <Sheet open={createOpen} onClose={closeCreate} title="Create" subtitle={`Step ${step} of 2 · ${step === 1 ? "Atur API key" : "Simpan key kamu"}`}>
        {step === 1 ? (
          <div className="space-y-4">
            <Segmented value={kind} onChange={setKind} options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} />
            <Input value={name} onChange={(e) => setName(e.target.value)} onClear={() => setName("")} placeholder="Nama key (mis. Bot WhatsApp)" maxLength={40} autoFocus />
            <div className="corner-frame flex items-center gap-4 rounded-[14px] bg-mint px-5 py-5 text-mint-ink">
              {kind === "free" ? <KeyRound className="size-8" /> : <Crown className="size-8" />}
              <div>
                <div className="text-[17px] font-bold">{kind === "free" ? "FREE KEY" : "PREMIUM KEY"}</div>
                <div className="text-[13.5px] opacity-80">{kind === "free" ? "Aktif langsung · limit harian free" : "Pilih paket & bayar · aktif otomatis"}</div>
              </div>
            </div>
            <p className="pt-4 text-center text-[14px] text-muted">{kind === "free" ? "Key baru langsung bisa dipakai." : "Kamu akan diarahkan ke halaman paket."}</p>
            <Button size="lg" className="w-full" loading={busy} onClick={create}>Continue</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {secret && <KeyReveal secret={secret} />}
            <Button size="lg" className="w-full" onClick={closeCreate}>Selesai</Button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!rename} onClose={() => setRename(null)} title="Ganti nama key">
        <Field label="Nama">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} autoFocus />
        </Field>
        <Button
          size="lg"
          className="mt-5 w-full"
          onClick={async () => {
            try {
              await api(`/api/keys/${rename!.id}`, { method: "PATCH", body: { name: newName } });
              toast("Nama key diperbarui.");
              setRename(null);
              void load();
            } catch (e) {
              toast((e as Error).message, "error");
            }
          }}
        >
          Simpan
        </Button>
      </Sheet>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        danger={confirm?.type === "revoke"}
        title={confirm?.type === "revoke" ? "Cabut API key?" : "Buat ulang key?"}
        text={confirm?.type === "revoke" ? <>Key <b>{confirm?.key.name}</b> akan berhenti bekerja permanen. Status premium pada key ini juga ikut berhenti.</> : <>Key lama <b>{confirm?.key.prefix}…</b> langsung tidak berlaku. Tier, paket, dan masa aktif tetap sama.</>}
        confirmLabel={confirm?.type === "revoke" ? "Cabut" : "Buat ulang"}
        onConfirm={async () => {
          if (!confirm) return;
          try {
            if (confirm.type === "revoke") {
              await api(`/api/keys/${confirm.key.id}`, { method: "DELETE" });
              toast("Key dicabut.", "info");
            } else {
              const r = await api<{ key: string }>(`/api/keys/${confirm.key.id}`, { method: "PATCH", body: { action: "regenerate" } });
              setRegenSecret(r.key);
            }
            void load();
            void refreshMe();
          } catch (e) {
            toast((e as Error).message, "error");
          }
        }}
      />
      <Sheet open={!!regenSecret} onClose={() => setRegenSecret(null)} title="Key baru">
        {regenSecret && <KeyReveal secret={regenSecret} />}
        <Button size="lg" className="mt-5 w-full" onClick={() => setRegenSecret(null)}>Sudah disimpan</Button>
      </Sheet>
    </PageTransition>
  );
}
