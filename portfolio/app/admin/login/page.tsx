import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="login">
      <div className="login__brand">
        <p className="login__mark">FELIXIORITY</p>
        <p className="login__sub">Panel pengelolaan project. Pengunjung tidak perlu login.</p>
      </div>
      <LoginForm />
    </main>
  );
}
