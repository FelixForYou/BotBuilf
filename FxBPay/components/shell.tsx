import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, Logo } from "./icons";
import { BottomNav, EnvSwitch, LogoutButton, MobileDrawer, SideNav, type NavItem } from "./shell-client";
import { cx } from "./ui";

export function Shell({
  items,
  mobileTabs,
  center,
  children,
  title,
  env,
  productionEnabled,
  unread,
  notifHref,
  userLabel,
  banner,
  admin,
}: {
  items: NavItem[];
  mobileTabs?: NavItem[];
  center?: ReactNode;
  children: ReactNode;
  title: string;
  env?: "sandbox" | "production";
  productionEnabled?: boolean;
  unread: number;
  notifHref: string;
  userLabel: string;
  banner?: ReactNode;
  admin?: boolean;
}) {
  const footer = (
    <div className="space-y-1 border-t border-line pt-3">
      <div className="px-3 pb-2 text-xs text-subtle">
        Masuk sebagai <span className="text-muted">{userLabel}</span>
      </div>
      <LogoutButton />
    </div>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line lg:flex">
        <Link href={admin ? "/admin" : "/app"} className="flex items-center gap-3 px-6 pb-4 pt-6">
          <Logo size={34} />
          <div>
            <div className="text-lg font-extrabold leading-none">FxB Pay</div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.18em] text-mint">{admin ? "ADMIN" : "BY FELIXIORITY"}</div>
          </div>
        </Link>
        <SideNav items={items} footer={footer} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
            {admin ? <MobileDrawer items={items} title={title} footer={footer} /> : null}
            <Link href={admin ? "/admin" : "/app"} className="flex items-center gap-2.5 lg:hidden">
              <Logo size={30} />
              <span className="font-extrabold">{title}</span>
            </Link>
            <div className="flex-1" />
            {env && (
              <div className="hidden sm:block">
                <EnvSwitch env={env} productionEnabled={!!productionEnabled} />
              </div>
            )}
            <Link href={notifHref} className="icon-round focus-ring relative transition hover:bg-[#313131]" aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`}>
              <Icon name="bell" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mint px-1 text-[10px] font-extrabold text-ink">{unread > 99 ? "99+" : unread}</span>}
            </Link>
            {!admin && (
              <Link href="/app/pengaturan" className="icon-round focus-ring transition hover:bg-[#313131] lg:hidden" aria-label="Pengaturan">
                <Icon name="settings" />
              </Link>
            )}
          </div>
          {env && (
            <div className="px-4 pb-3 sm:hidden">
              <EnvSwitch env={env} productionEnabled={!!productionEnabled} />
            </div>
          )}
        </header>
        {banner}
        <main className={cx("animate-enter mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:pb-16")}>{children}</main>
      </div>
      {mobileTabs && <BottomNav items={mobileTabs} center={center} />}
    </div>
  );
}
