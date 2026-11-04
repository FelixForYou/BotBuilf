import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/session";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm } from "@/components/client";

export default async function TwoFactor() {
  const a = await getAuth();
  if (!a) redirect("/masuk");
  if (a.session.mfaPassed) redirect(a.user.role === "admin" ? "/admin" : "/app");
  return (
    <AuthFrame title="Verifikasi dua faktor" subtitle="Masukkan 6 digit kode dari aplikasi autentikator Anda.">
      <ActionForm action="/api/auth/2fa" submit="Verifikasi" submitIcon="shieldCheck">
        <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input tabular text-center text-2xl font-bold tracking-[0.5em]" placeholder="000000" autoFocus />
      </ActionForm>
    </AuthFrame>
  );
}
