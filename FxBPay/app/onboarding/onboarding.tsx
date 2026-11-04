"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { api, Button } from "@/components/client";
import { cx } from "@/components/ui";

const SLIDES: { icon: IconName; title: string; body: string }[] = [
  { icon: "link", title: "Buat link pembayaran", body: "Tentukan nominal dan masa berlaku, lalu bagikan link ke pelanggan. Mereka membayar lewat alur resmi DANA." },
  { icon: "shieldCheck", title: "Saldo terverifikasi", body: "Saldo hanya bertambah setelah DANA mengonfirmasi pembayaran ke server kami — bukan dari halaman sukses." },
  { icon: "wallet", title: "Tarik kapan saja", body: "Ajukan penarikan dari saldo tersedia. Setiap mutasi tercatat di ledger dan bisa Anda telusuri." },
  { icon: "flask", title: "Mulai di Sandbox", body: "Akun baru berjalan di mode Sandbox. Production aktif setelah integrasi DANA disetujui admin." },
];

export function Onboarding({ name }: { name: string }) {
  const [i, setI] = useState(0);
  const router = useRouter();
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  const finish = async () => {
    await api("/api/account/onboarded").catch(() => {});
    router.push("/app");
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex justify-end">
        <button type="button" onClick={finish} className="text-sm font-semibold text-muted hover:text-fg">Lewati</button>
      </div>
      <div key={i} className="animate-enter my-auto flex flex-col items-center text-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-[40px] bg-card">
          <span className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-mint text-ink"><Icon name={s.icon} size={40} strokeWidth={2} /></span>
        </div>
        {i === 0 && <p className="mt-8 text-sm text-mint">Selamat datang, {name}</p>}
        <h1 className={cx("text-[2rem] font-extrabold leading-tight tracking-tight", i === 0 ? "mt-2" : "mt-8")}>{s.title}</h1>
        <p className="mt-3 max-w-xs text-muted">{s.body}</p>
      </div>
      <div className="mb-6 flex justify-center gap-2" aria-label={`Halaman ${i + 1} dari ${SLIDES.length}`}>
        {SLIDES.map((_, k) => (
          <button key={k} type="button" onClick={() => setI(k)} aria-label={`Halaman ${k + 1}`} className={cx("h-2 rounded-full transition-all duration-300", k === i ? "w-8 bg-mint" : "w-2 bg-white/20")} />
        ))}
      </div>
      <Button size="lg" className="w-full" onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Mulai" : "Lanjut"}</Button>
    </div>
  );
}
