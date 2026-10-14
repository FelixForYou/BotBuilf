"use client";
import { formatNumber } from "@/lib/format";
import type { SnapshotTotals } from "@/types/panel";
import { IconServer, IconShield, IconUsers } from "./icons";

export function Stats({ totals }: { totals: SnapshotTotals }) {
  const cards = [
    {
      label: "Total User",
      short: "User",
      value: totals.users,
      sub: `termasuk ${formatNumber(totals.admins)} admin`,
      icon: IconUsers,
      tone: "from-blue-500/25 to-blue-500/5 text-blue-300 ring-blue-400/30",
    },
    {
      label: "Total Server",
      short: "Server",
      value: totals.servers,
      sub: `${formatNumber(totals.usersWithoutServer)} user tanpa server`,
      icon: IconServer,
      tone: "from-violet-500/25 to-violet-500/5 text-violet-300 ring-violet-400/30",
    },
    {
      label: "Admin",
      short: "Admin",
      value: totals.admins,
      sub: "berdasarkan root_admin",
      icon: IconShield,
      tone: "from-indigo-400/25 to-indigo-400/5 text-indigo-200 ring-indigo-300/30",
    },
  ];
  return (
    <section aria-label="Ringkasan panel" className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map(({ label, short, value, sub, icon: Icon, tone }) => (
        <div key={label} className="card flex items-center gap-3 p-3 sm:p-4">
          <div
            className={`hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-b ring-1 sm:grid ${tone}`}
          >
            <Icon size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:text-xs">
              <Icon size={13} className="sm:hidden" />
              <span className="truncate sm:hidden">{short}</span>
              <span className="hidden truncate sm:inline">{label}</span>
            </div>
            <div className="text-2xl font-black tabular-nums leading-tight sm:text-3xl">{formatNumber(value)}</div>
            <div className="hidden truncate text-xs text-ink-mute sm:block">{sub}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
