"use client";

import { useEffect, useState } from "react";
import { ActionForm, api, Sheet, Segmented, Button } from "./client";
import { Icon, type IconName } from "./icons";
import { cx } from "./ui";

const rupiah = (v: string | number) => "Rp" + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function AmountField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label" htmlFor="amount">Nominal</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted">Rp</span>
        <input id="amount" name="amount" inputMode="numeric" autoComplete="off" className="input tabular pl-12 text-lg font-bold" placeholder="0" value={value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {[25000, 50000, 100000, 250000].map((n) => (
          <button key={n} type="button" onClick={() => onChange(String(n))} className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-fg">
            {rupiah(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Quote({ amount, bearer }: { amount: string; bearer: "merchant" | "customer" }) {
  const [q, setQ] = useState<{ fee: string; amount: string; net: string } | null>(null);
  useEffect(() => {
    if (!amount || Number(amount) < 1) return setQ(null);
    const t = setTimeout(() => {
      api<{ fee: string; amount: string; net: string }>("/api/payments", { body: { amount, description: "kalkulasi", expiresInMinutes: 30, feeBearer: bearer, quote: true } })
        .then(setQ)
        .catch(() => setQ(null));
    }, 300);
    return () => clearTimeout(t);
  }, [amount, bearer]);
  if (!q) return null;
  return (
    <div className="animate-enter rounded-2xl bg-surface p-4 text-sm">
      <div className="flex justify-between py-1"><span className="text-muted">Dibayar pelanggan</span><span className="tabular font-semibold">{rupiah(q.amount)}</span></div>
      <div className="flex justify-between py-1"><span className="text-muted">Biaya layanan</span><span className="tabular">−{rupiah(q.fee)}</span></div>
      <div className="mt-1 flex justify-between border-t border-line pt-2"><span className="font-semibold">Anda terima</span><span className="tabular font-bold text-mint">{rupiah(q.net)}</span></div>
    </div>
  );
}

export function CreateForm({ initialTab = "payment", maxMinutes, qrisAvailable, demo, onDone }: { initialTab?: "payment" | "topup"; maxMinutes: number; qrisAvailable: boolean; demo: boolean; onDone?: () => void }) {
  const [tab, setTab] = useState<"payment" | "topup">(initialTab);
  const [amount, setAmount] = useState("");
  const [bearer, setBearer] = useState<"merchant" | "customer">("merchant");
  const opts = [15, 30, 60, 180, 720, 1440, 4320].filter((m) => m <= maxMinutes);
  return (
    <div className="space-y-5">
      <Segmented options={[{ value: "payment", label: "Link Pembayaran" }, { value: "topup", label: "Isi Saldo" }]} value={tab} onChange={(v) => setTab(v)} />
      {demo && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber/10 p-3 text-xs text-amber">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          Mode DEMO: integrasi DANA Sandbox belum dikonfigurasi. Pembayaran hanya bisa disimulasikan dan tidak memengaruhi saldo nyata.
        </div>
      )}
      <ActionForm key={tab} action="/api/payments" submit={tab === "topup" ? "Buat Tagihan Isi Saldo" : "Buat Link Pembayaran"} submitIcon={tab === "topup" ? "wallet" : "link"} extra={{ purpose: tab }} onDone={onDone}>
        <AmountField value={amount} onChange={setAmount} />
        <div>
          <label className="label" htmlFor="description">{tab === "topup" ? "Catatan" : "Deskripsi"}</label>
          <input id="description" name="description" className="input" maxLength={140} defaultValue={tab === "topup" ? "Isi saldo FxB Pay" : ""} placeholder="mis. Kaos FELIXIORITY ukuran L" />
        </div>
        {tab === "payment" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="orderRef">Referensi pesanan</label>
              <input id="orderRef" name="orderRef" className="input" maxLength={64} placeholder="INV-0001 (opsional)" />
            </div>
            <div>
              <label className="label" htmlFor="customerEmail">Email pelanggan</label>
              <input id="customerEmail" name="customerEmail" type="email" className="input" placeholder="opsional" />
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="expiresInMinutes">Masa berlaku</label>
            <select id="expiresInMinutes" name="expiresInMinutes" className="input" defaultValue={String(Math.min(30, maxMinutes))}>
              {opts.map((m) => (
                <option key={m} value={m}>{m < 60 ? `${m} menit` : m < 1440 ? `${m / 60} jam` : `${m / 1440} hari`}</option>
              ))}
            </select>
          </div>
          {tab === "payment" ? (
            <div>
              <label className="label" htmlFor="feeBearer">Biaya ditanggung</label>
              <select id="feeBearer" name="feeBearer" className="input" value={bearer} onChange={(e) => setBearer(e.target.value as "merchant" | "customer")}>
                <option value="merchant">Merchant (saya)</option>
                <option value="customer">Pelanggan</option>
              </select>
            </div>
          ) : null}
        </div>
        {tab === "payment" && (
          <fieldset>
            <legend className="label">Metode</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-surface p-3 text-sm font-semibold has-[:checked]:ring-2 has-[:checked]:ring-mint">
                <input type="radio" name="method" value="redirect" defaultChecked className="accent-[#58dcc5]" /> Checkout DANA
              </label>
              <label className={cx("flex items-center gap-2 rounded-2xl bg-surface p-3 text-sm font-semibold has-[:checked]:ring-2 has-[:checked]:ring-mint", qrisAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50")} title={qrisAvailable ? "" : "QRIS belum diaktifkan pada akun merchant DANA"}>
                <input type="radio" name="method" value="qris" disabled={!qrisAvailable} className="accent-[#58dcc5]" /> QRIS
              </label>
            </div>
            {!qrisAvailable && <p className="mt-2 text-xs text-subtle">QRIS hanya tampil bila akses QRIS aktif di akun merchant DANA.</p>}
          </fieldset>
        )}
        <Quote amount={amount} bearer={tab === "topup" ? "merchant" : bearer} />
      </ActionForm>
    </div>
  );
}

export function CreateButton({ variant = "fab", label, icon = "plus", initialTab, ...p }: { variant?: "fab" | "action" | "button"; label?: string; icon?: IconName; initialTab?: "payment" | "topup"; maxMinutes: number; qrisAvailable: boolean; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger =
    variant === "fab" ? (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary -mt-5 h-14 w-14 !p-0 shadow-[0_8px_24px_rgba(88,220,197,.35)]" aria-label="Buat pembayaran">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </button>
    ) : variant === "action" ? (
      <button type="button" onClick={() => setOpen(true)} className="group flex flex-col items-center gap-2 text-xs font-semibold text-fg/90">
        <span className="icon-round h-14 w-14 bg-white/10 transition group-hover:bg-white/15 group-active:scale-95"><Icon name={icon} size={22} /></span>
        {label}
      </button>
    ) : (
      <Button type="button" onClick={() => setOpen(true)} icon={icon} size="md">{label}</Button>
    );
  return (
    <>
      {trigger}
      <Sheet open={open} onClose={() => setOpen(false)} title="Buat">
        <CreateForm initialTab={initialTab} {...p} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
