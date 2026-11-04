import { requireUser } from "@/lib/auth/session";
import { effectiveEnv, unreadCount, createContext } from "@/lib/views";
import { getSetting } from "@/lib/settings";
import { Shell } from "@/components/shell";
import { CreateButton } from "@/components/create-sheet";
import { HideProvider } from "@/components/client";
import type { NavItem } from "@/components/shell-client";
import { Notice } from "@/components/ui";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const [unread, prod, ctx, branding] = await Promise.all([unreadCount(user.id), getSetting("production"), createContext(env), getSetting("branding")]);
  const items: NavItem[] = [
    { href: "/app", label: "Beranda", icon: "home", exact: true },
    { href: "/app/pembayaran", label: "Riwayat", icon: "receipt" },
    { href: "/app/saldo", label: "Saldo", icon: "wallet" },
    { href: "/app/penarikan", label: "Tarik Saldo", icon: "arrowUpRight" },
    { href: "/app/developer", label: "Developer", icon: "code" },
    { href: "/app/notifikasi", label: "Notifikasi", icon: "bell" },
    { href: "/app/pengaturan", label: "Pengaturan", icon: "settings" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Panel Admin", icon: "shield" as const }] : []),
  ];
  const tabs: NavItem[] = [
    { href: "/app", label: "Beranda", icon: "home", exact: true },
    { href: "/app/pembayaran", label: "Riwayat", icon: "receipt" },
    { href: "/app/saldo", label: "Saldo", icon: "wallet" },
    { href: "/app/developer", label: "Developer", icon: "code" },
  ];
  const banner = (
    <div className="mx-auto max-w-6xl space-y-2 px-4 pt-4 sm:px-6 empty:hidden">
      {branding.maintenanceBanner && <Notice tone="warn">{branding.maintenanceBanner}</Notice>}
      {user.status === "frozen" && <Notice tone="danger" title="Akun dibekukan">{user.frozenReason ?? "Hubungi admin."} Transaksi baru dan penarikan tidak dapat dilakukan.</Notice>}
      {!user.emailVerifiedAt && <Notice tone="info">Email belum terverifikasi. <Link href="/app/pengaturan/profil" className="font-semibold text-mint underline">Kirim ulang verifikasi</Link></Notice>}
      {env === "sandbox" && <Notice tone="info" title={ctx.demo ? "Mode Sandbox · DEMO" : "Mode Sandbox"}>{ctx.demo ? "Integrasi DANA Sandbox belum dikonfigurasi. Transaksi memakai simulator DEMO dan tidak memengaruhi saldo nyata." : "Transaksi memakai DANA Sandbox dan terpisah penuh dari saldo Production."}</Notice>}
    </div>
  );
  return (
    <HideProvider>
      <Shell items={items} mobileTabs={tabs} center={<CreateButton {...ctx} />} title="FxB Pay" env={env} productionEnabled={prod.enabled} unread={unread} notifHref="/app/notifikasi" userLabel={user.email} banner={banner}>
        {children}
      </Shell>
    </HideProvider>
  );
}
