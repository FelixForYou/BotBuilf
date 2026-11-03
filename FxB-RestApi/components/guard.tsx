"use client";

import { BarChart3, KeyRound, LayoutDashboard, Receipt, Settings, ShieldCheck, Users, Boxes, Package, CreditCard, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./providers";
import { Skeleton, cx } from "./ui";

const USER_NAV = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/keys", label: "API Key", icon: KeyRound },
  { href: "/dashboard/usage", label: "Statistik", icon: BarChart3 },
  { href: "/dashboard/orders", label: "Order", icon: Receipt },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];
const ADMIN_NAV = [
  { href: "/admin", label: "Ringkasan", icon: ShieldCheck },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/keys", label: "API Key", icon: KeyRound },
  { href: "/admin/endpoints", label: "Endpoint", icon: Boxes },
  { href: "/admin/plans", label: "Paket", icon: Package },
  { href: "/admin/orders", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/settings", label: "Pengaturan", icon: SlidersHorizontal },
];

export function AreaLayout({ area, children }: { area: "user" | "admin"; children: React.ReactNode }) {
  const { me, meLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (meLoading) return;
    if (!me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (area === "admin" && me.role !== "admin") router.replace("/dashboard");
  }, [me, meLoading, area, router, pathname]);

  if (meLoading || !me || (area === "admin" && me.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-36 rounded-[26px]" />
        <Skeleton className="h-64 rounded-[26px]" />
      </div>
    );
  }
  const nav = area === "admin" ? ADMIN_NAV : USER_NAV;
  return (
    <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-3 px-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{area === "admin" ? "Admin" : "Dashboard"}</div>
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = n.href === pathname || (n.href !== "/dashboard" && n.href !== "/admin" && pathname.startsWith(n.href));
              return (
                <Link key={n.href} href={n.href} className={cx("flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium transition", active ? "bg-mint-soft text-mint" : "text-muted hover:bg-card hover:text-fg")}>
                  <n.icon className="size-[18px]" />
                  {n.label}
                </Link>
              );
            })}
            {area === "user" && me.role === "admin" && (
              <Link href="/admin" className="mt-3 flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium text-warn hover:bg-card">
                <ShieldCheck className="size-[18px]" /> Admin
              </Link>
            )}
            {area === "admin" && (
              <Link href="/dashboard" className="mt-3 flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium text-muted hover:bg-card">
                <LayoutDashboard className="size-[18px]" /> Dashboard user
              </Link>
            )}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">
        <nav className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {nav.map((n) => {
            const active = n.href === pathname || (n.href !== "/dashboard" && n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={cx("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition", active ? "bg-mint text-mint-ink" : "bg-card text-fg")}>
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mx-auto max-w-3xl lg:mx-0">{children}</div>
      </div>
    </div>
  );
}
