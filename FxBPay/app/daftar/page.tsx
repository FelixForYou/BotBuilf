import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm } from "@/components/client";
import { Notice } from "@/components/ui";

export const metadata = { title: "Daftar" };
export const dynamic = "force-dynamic";

export default async function Register() {
  const b = await getSetting("branding");
  return (
    <AuthFrame title="Buat akun" subtitle="Mulai di mode Sandbox. Production diaktifkan setelah integrasi DANA disetujui." footer={<>Sudah punya akun? <Link className="font-semibold text-mint" href="/masuk">Masuk</Link></>}>
      {!b.registrationOpen ? (
        <Notice tone="warn" title="Pendaftaran ditutup">Pendaftaran akun baru sedang ditutup oleh admin.</Notice>
      ) : (
        <ActionForm action="/api/auth/register" submit="Daftar">
          <div><label className="label" htmlFor="name">Nama lengkap</label><input id="name" name="name" autoComplete="name" className="input" /></div>
          <div><label className="label" htmlFor="storeName">Nama toko</label><input id="storeName" name="storeName" className="input" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="phone">Nomor telepon</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" placeholder="08xxxxxxxxxx" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" className="input" /><p className="mt-1.5 text-xs text-subtle">Minimal 10 karakter, kombinasi huruf dan angka.</p></div>
        </ActionForm>
      )}
    </AuthFrame>
  );
}
