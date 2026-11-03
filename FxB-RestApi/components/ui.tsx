"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, ChevronRight, Copy, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type IconT = ComponentType<{ className?: string; strokeWidth?: number }>;

// ---------------------------------------------------------------------------
// Button (pill besar seperti screenshot)
// ---------------------------------------------------------------------------
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background,opacity,box-shadow] duration-200 active:scale-[0.98] disabled:cursor-not-allowed select-none";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-mint text-mint-ink hover:bg-mint-strong disabled:bg-mint-dim disabled:text-mint-ink/70 shadow-[0_8px_30px_-12px_var(--mint)]",
  secondary: "bg-card-2 text-fg hover:bg-card-3 disabled:opacity-50",
  ghost: "text-muted hover:text-fg hover:bg-card-2 disabled:opacity-50",
  danger: "bg-danger-soft text-danger hover:bg-danger/25 disabled:opacity-50",
  outline: "border border-line text-fg hover:bg-card-2 disabled:opacity-50",
};
const btnSizes = { lg: "h-14 px-7 text-[17px]", md: "h-11 px-5 text-[15px]", sm: "h-9 px-4 text-sm" };

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon: Icon,
  href,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: keyof typeof btnSizes; loading?: boolean; icon?: IconT; href?: string }) {
  const cls = cx(btnBase, btnVariants[variant], btnSizes[size], className);
  const inner = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-[18px]" strokeWidth={2.2} /> : null}
      {children}
    </>
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {inner}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconT; label: string }) {
  return (
    <button aria-label={label} title={label} className={cx("grid size-10 place-items-center rounded-full text-fg transition hover:bg-card-2 active:scale-95", className)} {...rest}>
      <Icon className="size-[22px]" strokeWidth={1.9} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card / Section / Row
// ---------------------------------------------------------------------------
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-[26px] bg-card p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-center justify-between px-1">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h3>
      {right}
    </div>
  );
}

export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("overflow-hidden rounded-[22px] bg-card divide-y divide-line", className)}>{children}</div>;
}

export function ListRow({
  icon: Icon,
  label,
  sub,
  value,
  href,
  onClick,
  danger,
  chevron = true,
  right,
}: {
  icon?: IconT;
  label: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  chevron?: boolean;
  right?: ReactNode;
}) {
  const content = (
    <>
      {Icon && (
        <span className={cx("grid size-9 shrink-0 place-items-center rounded-full", danger ? "bg-danger-soft text-danger" : "bg-mint-soft text-mint")}>
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-[15.5px] font-medium", danger ? "text-danger" : "text-fg")}>{label}</span>
        {sub && <span className="mt-0.5 block truncate text-[13px] text-muted">{sub}</span>}
      </span>
      {value && <span className="shrink-0 text-[14px] text-muted">{value}</span>}
      {right}
      {chevron && (href || onClick) && <ChevronRight className="size-[18px] shrink-0 text-subtle" />}
    </>
  );
  const cls = "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-card-2 active:bg-card-3";
  if (href) return <Link href={href} className={cls}>{content}</Link>;
  if (onClick) return <button onClick={onClick} className={cls}>{content}</button>;
  return <div className={cx(cls, "hover:bg-transparent active:bg-transparent")}>{content}</div>;
}

export function StatGrid({ items, className }: { items: { value: ReactNode; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx("grid divide-x divide-line rounded-[20px] bg-card-2", className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((it, i) => (
        <div key={i} className="min-w-0 px-2 py-3.5 text-center">
          <div className="truncate text-[17px] font-semibold text-fg">{it.value}</div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoTable({ rows }: { rows: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-[20px] bg-card">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5 text-[14.5px]">
          <span className="shrink-0 text-fg">{r.label}</span>
          <span className="min-w-0 truncate text-right text-muted">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------
export function Field({ label, hint, error, children }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block px-1 text-[13.5px] font-medium text-muted">{label}</span>}
      {children}
      {error ? <span className="mt-1.5 block px-1 text-[13px] text-danger">{error}</span> : hint ? <span className="mt-1.5 block px-1 text-[12.5px] text-subtle">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-[18px] border border-transparent bg-card-2 px-4 text-[16px] text-fg placeholder:text-subtle outline-none transition focus:border-mint/60 focus:bg-card-3";

export function Input({ className, onClear, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }) {
  return (
    <div className="relative">
      <input className={cx(inputCls, "h-14", onClear && "pr-12", className)} {...rest} />
      {onClear && rest.value ? (
        <button type="button" aria-label="Hapus" onClick={onClear} className="absolute right-3.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-subtle/60 text-bg">
          <X className="size-3.5" strokeWidth={3} />
        </button>
      ) : null}
    </div>
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, "min-h-28 py-3.5 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, warn, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { warn?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cx(inputCls, "h-14 appearance-none pr-11 font-medium", warn ? "border-2 border-warn" : "", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-fg" />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="relative grid rounded-[20px] bg-card-2/70 p-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cx("relative z-10 h-12 rounded-[15px] text-[15.5px] font-semibold transition-colors", active ? "text-mint" : "text-fg")}>
            {active && <motion.span layoutId={`seg-${options.map((x) => x.value).join("")}`} className="absolute inset-0 -z-10 rounded-[15px] bg-card-3" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "mint" | "danger" | "warn"; children: ReactNode; className?: string }) {
  const tones = { neutral: "bg-card-2 text-muted", mint: "bg-mint-soft text-mint", danger: "bg-danger-soft text-danger", warn: "bg-warn-soft text-warn" };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", tones[tone], className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-2xl", className)} />;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-card-3", className)}>
      <motion.div className="h-full rounded-full bg-mint" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
    </div>
  );
}

/** Bar tersegmen seperti "BUILDS TODAY" di drawer. */
export function SegmentBar({ used, limit, segments = 5 }: { used: number; limit: number; segments?: number }) {
  const ratio = limit ? used / limit : 0;
  return (
    <div className="flex gap-1.5 rounded-full bg-card p-2.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className={cx("h-2 flex-1 rounded-full transition-colors", ratio > i / segments ? "bg-mint" : "bg-card-3")} />
      ))}
    </div>
  );
}

export type StepState = "done" | "active" | "error" | "todo";

export function Steps({ steps }: { steps: { label: ReactNode; sub?: ReactNode; time?: ReactNode; state: StepState }[] }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span className={cx("absolute left-[17px] top-10 h-[calc(100%-36px)] w-[2px]", s.state === "done" ? "border-l-2 border-dashed border-mint" : "bg-card-3")} />
          )}
          <span
            className={cx(
              "relative grid size-9 shrink-0 place-items-center rounded-full",
              s.state === "done" && "bg-mint text-mint-ink",
              s.state === "error" && "bg-danger text-white",
              s.state === "active" && "bg-mint-soft",
              s.state === "todo" && "bg-card-3",
            )}
          >
            {s.state === "done" && <Check className="size-[18px]" strokeWidth={2.6} />}
            {s.state === "error" && <X className="size-[18px]" strokeWidth={2.6} />}
            {s.state === "active" && (
              <span className="spin-dot absolute inset-0">
                <span className="absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full bg-mint" />
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1.5">
            <div className="min-w-0">
              <div className={cx("text-[17px] font-medium", s.state === "todo" ? "text-muted" : "text-fg")}>{s.label}</div>
              {s.sub && <div className="mt-0.5 text-[13.5px] text-muted">{s.sub}</div>}
            </div>
            {s.time && <div className="shrink-0 font-mono text-[14px] text-muted">{s.time}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: IconT; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[26px] border-2 border-dashed border-line px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-mint-soft text-mint">
        <Icon className="size-6" />
      </span>
      <div className="mt-4 text-[17px] font-semibold">{title}</div>
      {text && <p className="mt-1.5 max-w-sm text-[14px] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label = "Salin", className, small }: { text: string; label?: string; className?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } else toast("Gagal menyalin.", "error");
      }}
      className={cx("inline-flex items-center gap-1.5 font-medium text-mint transition hover:opacity-80", small ? "text-[13px]" : "text-[15px]", className)}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? "Tersalin" : label}
    </button>
  );
}

export function CodeBlock({ code, lang, className, maxH = "max-h-[420px]" }: { code: string; lang?: string; className?: string; maxH?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-[20px] border border-line bg-[#0a0a0b]", className)}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500">{lang ?? "code"}</span>
        <CopyButton text={code} small />
      </div>
      <pre className={cx("code-block overflow-auto whitespace-pre p-4 text-zinc-200", maxH)}>{code}</pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sheet / Modal (bottom sheet di HP, dialog di layar besar)
// ---------------------------------------------------------------------------
export function Sheet({ open, onClose, title, subtitle, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cx("relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] bg-card px-5 pb-8 pt-6 shadow-[var(--shadow)] sm:rounded-[30px]", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {(title || subtitle) && (
              <div className="mb-5 flex items-start gap-4">
                <button onClick={onClose} aria-label="Tutup" className="mt-1 grid size-8 place-items-center rounded-full text-fg hover:bg-card-2">
                  <X className="size-6" strokeWidth={2} />
                </button>
                <div className="min-w-0">
                  {title && <h2 className="text-[26px] font-bold leading-tight">{title}</h2>}
                  {subtitle && <p className="mt-1 text-[14.5px] text-muted">{subtitle}</p>}
                </div>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Toast (gaya banner "Flutter builds have known bugs")
// ---------------------------------------------------------------------------
type ToastItem = { id: number; text: string; sub?: string; kind: "success" | "error" | "warn" | "info" };
let listeners: ((t: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];
let seq = 0;
export function toast(text: string, kind: ToastItem["kind"] = "success", sub?: string) {
  const item = { id: ++seq, text, sub, kind };
  toasts = [...toasts.slice(-2), item];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id);
    listeners.forEach((l) => l(toasts));
  }, 3800);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);
  const tone = { success: "bg-mint text-mint-ink", error: "bg-danger text-white", warn: "bg-warn text-black", info: "bg-card-3 text-fg" };
  const sym = { success: "✓", error: "!", warn: "!", info: "i" };
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3.5 rounded-[26px] border border-line bg-card/95 px-4 py-3.5 shadow-[var(--shadow)] backdrop-blur"
          >
            <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-black", tone[t.kind])}>{sym[t.kind]}</span>
            <div className="min-w-0">
              <div className="text-[15.5px] font-medium text-fg">{t.text}</div>
              {t.sub && <div className="text-[13.5px] text-muted">{t.sub}</div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
