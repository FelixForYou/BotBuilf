"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, Logo, type IconName } from "./icons";
import { api, Segmented, useToast } from "./client";
import { cx } from "./ui";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean; group?: string };

function active(path: string, item: NavItem) {
  return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
}

export function SideNav({ items, footer }: { items: NavItem[]; footer?: ReactNode }) {
  const path = usePathname();
  let lastGroup: string | undefined;
  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 pb-4">
      {items.map((it) => {
        const header = it.group && it.group !== lastGroup ? it.group : null;
        lastGroup = it.group;
        return (
          <div key={it.href}>
            {header && <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-subtle">{header}</div>}
            <Link href={it.href} className={cx("focus-ring flex h-11 items-center gap-3 rounded-2xl px-3 text-[0.95rem] font-semibold transition-colors duration-200", active(path, it) ? "bg-mint/12 text-mint" : "text-muted hover:bg-surface hover:text-fg")}>
              <Icon name={it.icon} size={20} />
              {it.label}
            </Link>
          </div>
        );
      })}
      <div className="mt-auto pt-4">{footer}</div>
    </nav>
  );
}

export function MobileDrawer({ items, title, footer }: { items: NavItem[]; title: string; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="icon-round focus-ring lg:hidden" aria-label="Buka menu">
        <Icon name="menu" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="animate-fade absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="animate-drawer absolute inset-y-0 left-0 flex w-[84%] max-w-[320px] flex-col bg-card pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="mb-2 flex items-center justify-between px-5 py-2">
              <div className="flex items-center gap-2.5 font-extrabold">
                <Logo size={28} /> {title}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="icon-round h-9 w-9" aria-label="Tutup menu">
                <Icon name="x" size={18} />
              </button>
            </div>
            <SideNav items={items} footer={footer} />
          </aside>
        </div>
      )}
    </>
  );
}

export function BottomNav({ items, center }: { items: NavItem[]; center?: ReactNode }) {
  const path = usePathname();
  const half = Math.ceil(items.length / 2);
  const render = (it: NavItem) => (
    <Link key={it.href} href={it.href} className={cx("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors", active(path, it) ? "text-mint" : "text-subtle")}>
      <Icon name={it.icon} size={22} />
      {it.label}
    </Link>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center px-2">
        {items.slice(0, half).map(render)}
        {center && <div className="flex flex-1 justify-center">{center}</div>}
        {items.slice(half).map(render)}
      </div>
    </nav>
  );
}

export function EnvSwitch({ env, productionEnabled }: { env: "sandbox" | "production"; productionEnabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(env);
  return (
    <div className="w-[13.5rem]">
      <Segmented
        options={[
          { value: "sandbox", label: "Sandbox" },
          { value: "production", label: "Production" },
        ]}
        value={value}
        onChange={async (v) => {
          if (v === "production" && !productionEnabled) return toast("Production belum diaktifkan admin", "err");
          setValue(v);
          try {
            await api("/api/account/env", { body: { env: v } });
            router.refresh();
          } catch (e) {
            setValue(env);
            toast((e as Error).message, "err");
          }
        }}
      />
    </div>
  );
}

export function LogoutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await api("/api/auth/logout").catch(() => {});
        router.push("/masuk");
        router.refresh();
      }}
      className={cx("focus-ring flex h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-muted transition-colors hover:bg-surface hover:text-danger", compact && "w-auto")}
    >
      <Icon name="logout" size={20} />
      Keluar
    </button>
  );
}
