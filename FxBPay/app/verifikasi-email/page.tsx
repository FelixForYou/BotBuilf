import { verifyEmailToken } from "@/lib/auth/service";
import { AuthFrame } from "@/components/auth-frame";
import { LinkButton, Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmailToken(token) : false;
  return (
    <AuthFrame title={ok ? "Email terverifikasi" : "Verifikasi gagal"}>
      {ok ? <Notice tone="ok">Terima kasih! Email Anda sudah terverifikasi.</Notice> : <Notice tone="danger">Tautan tidak valid, sudah dipakai, atau kedaluwarsa. Kirim ulang dari halaman Profil.</Notice>}
      <LinkButton href="/app" className="mt-4 w-full" size="lg">Ke dashboard</LinkButton>
    </AuthFrame>
  );
}
