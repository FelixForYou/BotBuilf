import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx("card", pad && "p-5 sm:p-6", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: ReactNode; back?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {back && (
        <Link href={back} className="icon-round focus-ring shrink-0 transition hover:bg-[#313131]" aria-label="Kembali">
          <Icon name="chevronLeft" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between px-1 first:mt-0">
      <h2 className="text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}

type Tone = "mint" | "amber" | "red" | "gray" | "blue";
const TONE: Record<Tone, string> = {
  mint: "bg-mint/15 text-mint",
  amber: "bg-amber/15 text-amber",
  red: "bg-danger/15 text-danger",
  gray: "bg-white/8 text-muted",
  blue: "bg-sky/15 text-sky",
};
export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONE[tone], className)}>{children}</span>;
}

export function EnvBadge({ env, demo }: { env: string; demo?: boolean }) {
  if (demo) return <Badge tone="amber">DEMO</Badge>;
  return env === "production" ? <Badge tone="mint">PRODUCTION</Badge> : <Badge tone="blue">SANDBOX</Badge>;
}

/** Kelompok baris pengaturan: ikon kiri, nilai + chevron kanan, separator tipis. */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card row-sep overflow-hidden", className)}>{children}</div>;
}

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  href,
  chevron = !!href,
  danger,
  right,
}: {
  icon?: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  href?: string;
  chevron?: boolean;
  danger?: boolean;
  right?: ReactNode;
}) {
  const inner = (
    <div className="flex min-h-[4.25rem] items-center gap-3.5 px-4 py-3 sm:px-5">
      {icon && (
        <span className={cx("icon-box", danger && "text-danger")}>
          <Icon name={icon} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className={cx("truncate font-semibold", danger && "text-danger")}>{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-sm text-muted">{subtitle}</div>}
      </div>
      {value !== undefined && <div className="max-w-[45%] truncate text-right text-sm text-muted">{value}</div>}
      {right}
      {chevron && <Icon name="chevronRight" size={18} className="shrink-0 text-subtle" />}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:bg-white/[0.03] focus-ring">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Stat({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: IconName; tone?: "mint" | "amber" | "red" }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon && <Icon name={icon} size={16} />}
        {label}
      </div>
      <div className={cx("tabular mt-2 text-2xl font-extrabold tracking-tight", tone === "mint" && "text-mint", tone === "amber" && "text-amber", tone === "red" && "text-danger")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </div>
  );
}

export type Step = { title: string; subtitle?: ReactNode; state: "done" | "current" | "pending" | "failed" };

/** Timeline vertikal ala "Build steps". */
export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && <span className={cx("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 rounded", s.state === "done" ? "bg-mint/60" : "bg-line")} />}
          <span
            className={cx(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              s.state === "done" && "bg-mint text-ink",
              s.state === "current" && "bg-mint/15 text-mint ring-2 ring-mint/50",
              s.state === "pending" && "bg-surface text-subtle",
              s.state === "failed" && "bg-danger/15 text-danger",
            )}
          >
            {s.state === "done" ? <Icon name="check" size={16} strokeWidth={2.6} /> : s.state === "failed" ? <Icon name="x" size={16} strokeWidth={2.4} /> : s.state === "current" ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-mint" /> : <span className="h-2 w-2 rounded-full bg-subtle" />}
          </span>
          <div className="min-w-0 pt-1">
            <div className={cx("font-semibold", s.state === "pending" && "text-muted")}>{s.title}</div>
            {s.subtitle && <div className="mt-0.5 text-sm text-muted">{s.subtitle}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ icon = "receipt", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="icon-round mb-4 h-14 w-14 text-muted">
        <Icon name={icon} size={26} />
      </span>
      <div className="text-lg font-bold">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "danger" | "ok"; title?: string; children: ReactNode }) {
  const map = { info: ["info", "text-sky", "bg-sky/10"], warn: ["alert", "text-amber", "bg-amber/10"], danger: ["xCircle", "text-danger", "bg-danger/10"], ok: ["checkCircle", "text-mint", "bg-mint/10"] } as const;
  const [icon, color, bg] = map[tone];
  return (
    <div className={cx("flex gap-3 rounded-2xl p-4 text-sm", bg)}>
      <Icon name={icon} className={cx("mt-0.5 shrink-0", color)} />
      <div className="min-w-0">
        {title && <div className={cx("mb-0.5 font-semibold", color)}>{title}</div>}
        <div className="text-fg/85">{children}</div>
      </div>
    </div>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="row-sep">
      {items.map(([k, v], i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LinkButton({ href, children, variant = "primary", size = "md", icon, className, external }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; icon?: IconName; className?: string; external?: boolean }) {
  const cls = cx("btn focus-ring", `btn-${variant}`, `btn-${size}`, className);
  if (external)
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {icon && <Icon name={icon} size={18} />}
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="card overflow-x-auto">{children}</div>;
}
