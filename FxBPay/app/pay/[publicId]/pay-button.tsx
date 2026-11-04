"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { api, Button, Countdown } from "@/components/client";
import { Icon } from "@/components/icons";

export function PayButton({ publicId, expiresAt, method, demo, existingQris }: { publicId: string; expiresAt: string; method: string; demo: boolean; existingQris: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (existingQris) QRCode.toDataURL(existingQris, { margin: 1, width: 280 }).then(setQr);
  }, [existingQris]);
  useEffect(() => {
    if (!qr) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [qr, router]);
  async function pay() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await api<{ url?: string; qris?: string; message?: string }>(`/api/pay/${publicId}/start`);
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      if (r.qris) setQr(await QRCode.toDataURL(r.qris, { margin: 1, width: 280 }));
      else if (r.message) setMsg(r.message);
    } catch (e) {
      setMsg((e as Error).message);
    }
    setLoading(false);
  }
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted"><Icon name="clock" size={16} /> Selesaikan dalam</span>
        <span className="font-bold text-amber"><Countdown to={expiresAt} onExpire={() => setExpired(true)} /></span>
      </div>
      {qr ? (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Kode QRIS" className="mx-auto rounded-2xl bg-white p-2" width={240} height={240} />
          <p className="mt-3 text-sm text-muted">Pindai dengan aplikasi pembayaran yang mendukung QRIS. Halaman ini diperbarui otomatis setelah pembayaran terverifikasi.</p>
        </div>
      ) : (
        <Button size="lg" className="w-full" loading={loading} disabled={expired} onClick={pay} icon={method === "qris" ? "qr" : "wallet"}>
          {expired ? "Kedaluwarsa" : demo ? "Lanjut ke checkout DEMO" : method === "qris" ? "Tampilkan QRIS" : "Bayar dengan DANA"}
        </Button>
      )}
      {msg && <p className="mt-3 rounded-2xl bg-amber/10 p-3 text-sm text-amber" role="status">{msg}</p>}
    </div>
  );
}
