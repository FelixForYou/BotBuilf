"use client";

import { useMemo, useState } from "react";
import { ActionForm, Segmented } from "@/components/client";

const rp = (n: bigint | number) => "Rp" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function WithdrawForm({ available, fee, min, max, disabled }: { available: string; fee: number; min: number; max: number; disabled: boolean }) {
  const [type, setType] = useState<"bank" | "dana">("bank");
  const [amount, setAmount] = useState("");
  const idem = useMemo(() => crypto.randomUUID(), []);
  const a = BigInt(amount || "0");
  const net = a - BigInt(fee);
  return (
    <ActionForm action="/api/withdrawals" submit="Ajukan penarikan" submitIcon="arrowUpRight" extra={{ destinationType: type, idempotencyKey: idem }} confirm="Saldo akan langsung dicadangkan. Lanjutkan?">
      <Segmented options={[{ value: "bank", label: "Rekening bank" }, { value: "dana", label: "Akun DANA" }]} value={type} onChange={setType} />
      <div>
        <label className="label" htmlFor="wamount">Nominal</label>
        <input id="wamount" name="amount" inputMode="numeric" className="input tabular text-lg font-bold" value={amount ? amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="0" disabled={disabled} />
        <div className="mt-2 flex justify-between text-xs text-subtle"><span>Min {rp(min)} · Maks {rp(max)}</span><button type="button" className="font-semibold text-mint" onClick={() => setAmount(available)}>Tarik semua</button></div>
      </div>
      {type === "bank" && <div><label className="label" htmlFor="bank">Nama bank</label><input id="bank" name="destinationBank" className="input" placeholder="mis. BCA" /></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="acc">{type === "bank" ? "Nomor rekening" : "Nomor DANA"}</label><input id="acc" name="destinationAccount" inputMode="numeric" className="input tabular" /></div>
        <div><label className="label" htmlFor="nm">Nama pemilik</label><input id="nm" name="destinationName" className="input" /></div>
      </div>
      <div className="rounded-2xl bg-surface p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-muted">Nominal</span><span className="tabular">{rp(a)}</span></div>
        <div className="flex justify-between py-1"><span className="text-muted">Biaya penarikan</span><span className="tabular">−{rp(fee)}</span></div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 font-semibold"><span>Diterima</span><span className={`tabular ${net > 0n ? "text-mint" : "text-danger"}`}>{net > 0n ? rp(net) : "—"}</span></div>
      </div>
      <div><label className="label" htmlFor="wpw">Konfirmasi password</label><input id="wpw" name="password" type="password" autoComplete="current-password" className="input" /></div>
    </ActionForm>
  );
}
