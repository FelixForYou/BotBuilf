"use client";

import { motion } from "motion/react";
import { Check, CreditCard, KeyRound, Loader2, Plus, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyReveal } from "@/components/key-reveal";
import { useApp } from "@/components/providers";
import { Badge, Button, Card, Field, PageTransition, SectionLabel, Select, Sheet, Skeleton, cx, toast } from "@/components/ui";
import { api, fmtIDR, fmtNum } from "@/lib/client";

interface Plan { id: string; name: string; description: string; price: number; duration_days: number; daily_limit: number; rpm_limit: number; rank: number }
interface Gw { id: "midtrans" | "xendit" | "manual"; name: string; description: string }
interface PlansRes { free: { daily_limit: number; rpm: number; max_keys: number }; plans: Plan[]; gateways: Gw[] }
interface Key { id: string; name: string; prefix: string; status: string; effective_tier: string; plan_name: string | null; expires_at: number | null }

export default function PricingPage() {
  const { me, lang } = useApp();
  const router = useRouter();
  const [data, setData] = useState<PlansRes | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    api<PlansRes>("/api/plans").then(setData).catch((e) => toast(e.message, "error"));
  }, []);
  const id = lang === "id";
  const choose = (p: Plan) => {
    if (!me) return router.push(`/register?next=${encodeURIComponent("/pricing")}`);
    setPlan(p);
  };
  const best = data?.plans.reduce<Plan | null>((a, p) => (!a || p.rank === 2 ? p : a), null);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="mint"><Sparkles className="size-3.5" /> Free & Premium</Badge>
          <h1 className="mt-3 text-[32px] font-extrabold leading-tight sm:text-[40px]">{id ? "Harga sederhana, limit jelas" : "Simple pricing, clear limits"}</h1>
          <p className="mt-2 text-[16px] text-muted">{id ? "Mulai gratis. Upgrade kapan saja — key premium aktif otomatis setelah pembayaran terverifikasi." : "Start free. Upgrade anytime — premium keys activate automatically after payment is verified."}</p>
        </div>

        {!data ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[420px] rounded-[28px]" />)}</div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <PlanCard
              name="Free"
              price={id ? "Rp0" : "Free"}
              period={id ? "selamanya" : "forever"}
              desc={id ? "Untuk mencoba & proyek pribadi." : "For testing & hobby projects."}
              features={[`${fmtNum(data.free.daily_limit)} request/${id ? "hari" : "day"}`, `${data.free.rpm} request/${id ? "menit" : "minute"}`, `${data.free.max_keys} API key`, id ? "Endpoint free" : "Free endpoints", id ? "Statistik penggunaan" : "Usage statistics"]}
              cta={me ? (id ? "Kelola key" : "Manage keys") : id ? "Daftar gratis" : "Sign up free"}
              onClick={() => router.push(me ? "/dashboard/keys" : "/register")}
              secondary
            />
            {data.plans.map((p, i) => (
              <PlanCard
                key={p.id}
                delay={(i + 1) * 0.05}
                highlight={best?.id === p.id}
                name={p.name}
                price={fmtIDR(p.price)}
                period={`/${p.duration_days} ${id ? "hari" : "days"}`}
                desc={p.description}
                features={[`${fmtNum(p.daily_limit)} request/${id ? "hari" : "day"}`, `${p.rpm_limit} request/${id ? "menit" : "minute"}`, id ? "Semua endpoint premium" : "All premium endpoints", id ? "Pilih model AI" : "Choose AI model", id ? "Perpanjang & upgrade kapan saja" : "Renew & upgrade anytime"]}
                cta={id ? "Pilih paket" : "Choose plan"}
                onClick={() => choose(p)}
              />
            ))}
          </div>
        )}

        <SectionLabel>{id ? "Metode pembayaran" : "Payment methods"}</SectionLabel>
        <Card>
          {data && data.gateways.length === 0 ? (
            <p className="text-[14.5px] text-muted">{id ? "Pembayaran belum dikonfigurasi oleh admin. Pemesanan premium sementara belum bisa dilakukan." : "Payments are not configured yet. Premium orders are temporarily unavailable."}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {data?.gateways.map((g) => (
                <div key={g.id} className="rounded-[18px] bg-card-2 p-4">
                  <div className="flex items-center gap-2 font-semibold"><CreditCard className="size-4 text-mint" />{g.name}</div>
                  <p className="mt-1 text-[13px] text-muted">{g.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <SectionLabel>FAQ</SectionLabel>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [id ? "Kapan key premium aktif?" : "When does premium activate?", id ? "Otomatis begitu payment gateway mengonfirmasi pembayaran (biasanya < 1 menit). Transfer manual diaktifkan setelah diverifikasi admin." : "Automatically once the gateway confirms payment (usually < 1 minute). Manual transfers activate after admin verification."],
            [id ? "Bisa perpanjang sebelum habis?" : "Can I renew early?", id ? "Bisa. Sisa masa aktif ditambahkan, tidak hilang." : "Yes. Remaining time is carried over."],
            [id ? "Apa yang terjadi saat premium berakhir?" : "What happens when premium ends?", id ? "Key tetap jalan sebagai key free dengan limit free. Endpoint premium akan ditolak (403)." : "The key keeps working with free limits. Premium endpoints return 403."],
            [id ? "Limit reset kapan?" : "When do limits reset?", id ? "Limit harian reset setiap 00:00 WIB. Header X-RateLimit-* menunjukkan sisa kuota." : "Daily limits reset at 00:00 WIB (UTC+7). X-RateLimit-* headers show the remaining quota."],
          ].map(([q, a]) => (
            <Card key={q}>
              <div className="font-semibold">{q}</div>
              <p className="mt-1.5 text-[14px] text-muted">{a}</p>
            </Card>
          ))}
        </div>
      </div>
      {plan && data && <Checkout plan={plan} gateways={data.gateways} onClose={() => setPlan(null)} />}
    </PageTransition>
  );
}

function PlanCard(p: { name: string; price: string; period: string; desc: string; features: string[]; cta: string; onClick: () => void; highlight?: boolean; secondary?: boolean; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: p.delay ?? 0 }} className={cx("relative flex flex-col rounded-[28px] bg-card p-6", p.highlight && "ring-2 ring-mint")}>
      {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-mint px-3 py-1 text-[12px] font-bold text-mint-ink">Populer</span>}
      <div className="text-[18px] font-bold">{p.name}</div>
      <p className="mt-1 min-h-10 text-[13.5px] text-muted">{p.desc}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-[30px] font-extrabold">{p.price}</span>
        <span className="text-[14px] text-muted">{p.period}</span>
      </div>
      <ul className="mt-5 flex-1 space-y-2.5 text-[14.5px]">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-mint" strokeWidth={3} />{f}</li>
        ))}
      </ul>
      <Button size="lg" variant={p.secondary ? "secondary" : "primary"} className="mt-6 w-full" onClick={p.onClick}>{p.cta}</Button>
    </motion.div>
  );
}

function Checkout({ plan, gateways, onClose }: { plan: Plan; gateways: Gw[]; onClose: () => void }) {
  const router = useRouter();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [keyId, setKeyId] = useState("");
  const [gw, setGw] = useState<Gw["id"] | "">(gateways[0]?.id ?? "");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const load = () =>
    api<Key[]>("/api/keys").then((k) => {
      const active = k.filter((x) => x.status === "active");
      setKeys(active);
      setKeyId((cur) => cur || active[0]?.id || "");
    });
  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
  }, []);

  async function newKey() {
    setBusy(true);
    try {
      const r = await api<{ id: string; key: string }>("/api/keys", { body: { name: `${plan.name} key` } });
      setSecret(r.key);
      await load();
      setKeyId(r.id);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!keyId || !gw) return;
    setBusy(true);
    try {
      const o = await api<{ id: string; payment_url: string | null }>("/api/orders", { body: { planId: plan.id, keyId, gateway: gw } });
      if (o.payment_url) window.location.href = o.payment_url;
      else router.push(`/dashboard/orders/${o.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(false);
    }
  }

  const k = keys?.find((x) => x.id === keyId);
  return (
    <Sheet open onClose={onClose} title={`Checkout ${plan.name}`} subtitle={`Step ${step} of 2 · ${step === 1 ? "Pilih API key" : "Metode pembayaran"}`}>
      {step === 1 ? (
        <div className="space-y-4">
          {!keys ? (
            <Skeleton className="h-14" />
          ) : keys.length ? (
            <Field label="API key yang di-upgrade" hint={k ? (k.effective_tier === "premium" ? `Premium aktif (${k.plan_name}) — masa aktif akan ditambahkan.` : "Key free ini akan menjadi premium.") : undefined}>
              <Select value={keyId} onChange={(e) => setKeyId(e.target.value)}>
                {keys.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.prefix}… ({x.effective_tier})</option>)}
              </Select>
            </Field>
          ) : (
            <p className="text-[14.5px] text-muted">Kamu belum punya API key aktif.</p>
          )}
          {secret && <KeyReveal secret={secret} />}
          <Button variant="secondary" className="w-full" icon={Plus} loading={busy} onClick={newKey}>Buat key baru untuk paket ini</Button>
          <Button size="lg" className="w-full" disabled={!keyId} onClick={() => setStep(2)} icon={KeyRound}>Lanjut</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {gateways.length === 0 && <p className="text-[14.5px] text-danger">Belum ada metode pembayaran yang aktif.</p>}
            {gateways.map((g) => (
              <button key={g.id} onClick={() => setGw(g.id)} className={cx("flex w-full items-center gap-3 rounded-[18px] border-2 p-4 text-left transition", gw === g.id ? "border-mint bg-mint-soft" : "border-transparent bg-card-2 hover:bg-card-3")}>
                <span className={cx("grid size-5 place-items-center rounded-full border-2", gw === g.id ? "border-mint" : "border-subtle")}>{gw === g.id && <span className="size-2.5 rounded-full bg-mint" />}</span>
                <div className="min-w-0">
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-[13px] text-muted">{g.description}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="divide-y divide-line rounded-[18px] bg-card-2 text-[14.5px]">
            <Row l="Paket" r={`${plan.name} · ${plan.duration_days} hari`} />
            <Row l="Limit" r={`${fmtNum(plan.daily_limit)}/hari · ${plan.rpm_limit}/menit`} />
            <Row l="API key" r={k ? `${k.name} (${k.prefix}…)` : "—"} />
            <Row l={<b>Total</b>} r={<b className="text-fg">{fmtIDR(plan.price)}</b>} />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Button size="lg" variant="secondary" onClick={() => setStep(1)}>Kembali</Button>
            <Button size="lg" disabled={!gw || busy} onClick={pay} icon={busy ? Loader2 : Zap}>{busy ? "Memproses…" : "Bayar sekarang"}</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Row({ l, r }: { l: React.ReactNode; r: React.ReactNode }) {
  return <div className="flex justify-between gap-3 px-4 py-3"><span className="text-muted">{l}</span><span className="truncate text-right">{r}</span></div>;
}
