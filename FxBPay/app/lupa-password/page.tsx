import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { ActionForm } from "@/components/client";

export const metadata = { title: "Lupa password" };
export default function Forgot() {
  return (
    <AuthFrame title="Lupa password" subtitle="Kami kirim tautan atur ulang ke email Anda." footer={<Link className="font-semibold text-mint" href="/masuk">Kembali ke Masuk</Link>}>
      <ActionForm action="/api/auth/forgot" submit="Kirim tautan" submitIcon="mail" resetOnSuccess>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" /></div>
      </ActionForm>
    </AuthFrame>
  );
}
