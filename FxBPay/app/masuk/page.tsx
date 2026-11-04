import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/session";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm } from "@/components/client";

export const metadata = { title: "Masuk" };

export default async function Login() {
  const a = await getAuth();
  if (a?.session.mfaPassed) redirect("/app");
  return (
    <AuthFrame title="Masuk" subtitle="Kelola pembayaran dan saldo toko Anda." footer={<>Belum punya akun? <Link className="font-semibold text-mint" href="/daftar">Daftar</Link></>}>
      <ActionForm action="/api/auth/login" submit="Masuk" submitIcon="logout">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/lupa-password" className="mb-2 text-sm font-semibold text-mint">Lupa password?</Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
        </div>
      </ActionForm>
    </AuthFrame>
  );
}
