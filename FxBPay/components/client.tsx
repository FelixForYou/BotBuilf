"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { cx } from "./ui";

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? "POST",
    headers: { "Content-Type": "application/json", "X-FxB-CSRF": "1" },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: { message?: string } })?.error?.message ?? `Gagal (${res.status})`);
  return data as T;
}

// ───── Toast ─────
type ToastT = { id: number; text: string; tone: "ok" | "err" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastT[]>([]);
  const push = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("animate-enter flex max-w-md items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-2xl", t.tone === "ok" ? "bg-mint text-ink" : "bg-danger text-white")}>
            <Icon name={t.tone === "ok" ? "checkCircle" : "alert"} size={18} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ───── Tombol ─────
export function Button({ children, variant = "primary", size = "md", icon, loading, className, ...rest }: { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; icon?: IconName; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx("btn focus-ring", `btn-${variant}`, `btn-${size}`, className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}
export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Form generik: mengirim isi form sebagai JSON ke endpoint API, menampilkan error inline,
 * lalu refresh / redirect. Checkbox → boolean, field multi-nilai → array.
 */
export function ActionForm({
  action,
  method = "POST",
  children,
  submit,
  submitIcon,
  success,
  redirectTo,
  onDone,
  className,
  confirm,
  submitVariant = "primary",
  submitSize = "lg",
  extra,
  fullWidth = true,
  resetOnSuccess,
}: {
  action: string;
  method?: string;
  children?: ReactNode;
  submit: string;
  submitIcon?: IconName;
  success?: string;
  redirectTo?: string;
  onDone?: (data: unknown) => void;
  className?: string;
  confirm?: string;
  submitVariant?: "primary" | "secondary" | "danger" | "ghost";
  submitSize?: "sm" | "md" | "lg";
  extra?: Record<string, unknown>;
  fullWidth?: boolean;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const closeSheet = useContext(SheetCloseCtx);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const form = e.currentTarget;
    const data: Record<string, unknown> = { ...extra };
    for (const el of Array.from(form.elements) as HTMLInputElement[]) {
      if (!el.name || el.disabled) continue;
      if (el.type === "checkbox" && el.dataset.multi) {
        const arr = (data[el.name] as string[] | undefined) ?? [];
        if (el.checked) arr.push(el.value);
        data[el.name] = arr;
      } else if (el.type === "checkbox") data[el.name] = el.checked;
      else if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else data[el.name] = el.value;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ redirect?: string; message?: string }>(action, { method, body: data });
      if (success || res?.message) toast(res?.message ?? success!);
      if (resetOnSuccess) form.reset();
      onDone?.(res);
      closeSheet?.();
      const to = res?.redirect ?? redirectTo;
      if (to) router.push(to);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className={cx("space-y-4", className)} noValidate>
      {children}
      {error && (
        <div role="alert" className="animate-enter flex items-start gap-2 rounded-2xl bg-danger/10 p-3.5 text-sm text-danger">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" loading={loading} variant={submitVariant} size={submitSize} icon={submitIcon} className={fullWidth ? "w-full" : ""}>
        {submit}
      </Button>
    </form>
  );
}

/** Tombol aksi tunggal (tanpa field). */
export function ActionButton({ action, body, children, variant = "secondary", size = "sm", icon, confirm, success, redirectTo, method = "POST", prompt }: { action: string; body?: Record<string, unknown>; children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; icon?: IconName; confirm?: string; success?: string; redirectTo?: string; method?: string; prompt?: { key: string; label: string; required?: boolean } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      loading={loading}
      type="button"
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        let payload = body ?? {};
        if (prompt) {
          const v = window.prompt(prompt.label);
          if (v === null) return;
          if (prompt.required && v.trim().length < 3) return toast("Isian wajib diisi", "err");
          payload = { ...payload, [prompt.key]: v };
        }
        setLoading(true);
        try {
          const res = await api<{ message?: string; redirect?: string; url?: string }>(action, { method, body: payload });
          toast(res?.message ?? success ?? "Berhasil");
          if (res?.url) window.location.href = res.url;
          else if (res?.redirect ?? redirectTo) router.push((res?.redirect ?? redirectTo)!);
          router.refresh();
        } catch (e) {
          toast((e as Error).message, "err");
        } finally {
          setLoading(false);
        }
      }}
    >
      {children}
    </Button>
  );
}

export function CopyButton({ value, label = "Salin", size = "sm", variant = "secondary", iconOnly }: { value: string; label?: string; size?: "sm" | "md" | "lg"; variant?: "primary" | "secondary" | "ghost"; iconOnly?: boolean }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      className={cx("btn focus-ring", `btn-${variant}`, iconOnly ? "h-9 w-9 !p-0" : `btn-${size}`)}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast("Disalin ke clipboard");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast("Gagal menyalin", "err");
        }
      }}
    >
      <Icon name={done ? "check" : "copy"} size={16} />
      {!iconOnly && (done ? "Tersalin" : label)}
    </button>
  );
}

export function ShareButton({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      size="md"
      icon="send"
      type="button"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {
            /* dibatalkan */
          }
        } else {
          await navigator.clipboard.writeText(url);
          toast("Link disalin — tempel untuk membagikan");
        }
      }}
    >
      Bagikan
    </Button>
  );
}

// ───── Segmented control ─────
export function Segmented<T extends string>({ options, value, onChange, name }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; name?: string }) {
  return (
    <div role="tablist" className="relative grid rounded-full bg-surface p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      <span className="absolute inset-y-1 rounded-full bg-mint transition-transform duration-250 ease-out" style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${options.findIndex((o) => o.value === value) * 100}%)`, left: "0.25rem" }} />
      {options.map((o) => (
        <button key={o.value} role="tab" type="button" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={cx("relative z-10 h-10 rounded-full text-sm font-bold transition-colors duration-200", value === o.value ? "text-ink" : "text-muted hover:text-fg")}>
          {o.label}
        </button>
      ))}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

/** Segmented sebagai navigasi URL (?tab=). */
export function SegmentedLinks({ options, value, param = "tab" }: { options: { value: string; label: string }[]; value: string; param?: string }) {
  const router = useRouter();
  return (
    <Segmented
      options={options}
      value={value}
      onChange={(v) => {
        const u = new URL(window.location.href);
        u.searchParams.set(param, v);
        router.push(u.pathname + u.search);
      }}
    />
  );
}

// ───── Bottom sheet (mobile) / dialog (desktop) ─────
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="animate-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 outline-none sm:max-w-lg sm:rounded-[32px] sm:pb-6">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[1.65rem] font-extrabold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="icon-round focus-ring transition hover:bg-[#313131]" aria-label="Tutup">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const SheetCloseCtx = createContext<(() => void) | null>(null);

/** Tombol + bottom sheet. Form (ActionForm) di dalamnya menutup sheet otomatis setelah sukses. */
export function SheetTrigger({ title, label, icon, variant = "primary", size = "md", children, className }: { title: string; label: ReactNode; icon?: IconName; variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button type="button" variant={variant} size={size} icon={icon} onClick={() => setOpen(true)} className={className}>
        {label}
      </Button>
      <Sheet open={open} onClose={close} title={title}>
        <SheetCloseCtx.Provider value={close}>{children}</SheetCloseCtx.Provider>
      </Sheet>
    </>
  );
}

// ───── Nominal yang bisa disembunyikan ─────
const HideCtx = createContext<{ hidden: boolean; toggle: () => void }>({ hidden: false, toggle: () => {} });
export function HideProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem("fxb_hide") === "1");
    } catch {
      /* abaikan */
    }
  }, []);
  const toggle = () =>
    setHidden((h) => {
      try {
        localStorage.setItem("fxb_hide", h ? "0" : "1");
      } catch {
        /* abaikan */
      }
      return !h;
    });
  return <HideCtx.Provider value={{ hidden, toggle }}>{children}</HideCtx.Provider>;
}
export function Hideable({ children }: { children: ReactNode }) {
  const { hidden } = useContext(HideCtx);
  return <span className="tabular">{hidden ? "Rp••••••" : children}</span>;
}
export function HideToggle() {
  const { hidden, toggle } = useContext(HideCtx);
  return (
    <button type="button" onClick={toggle} className="icon-round focus-ring h-9 w-9 bg-white/10 transition hover:bg-white/15" aria-label={hidden ? "Tampilkan nominal" : "Sembunyikan nominal"}>
      <Icon name={hidden ? "eyeOff" : "eye"} size={18} />
    </button>
  );
}

// ───── Countdown ─────
export function Countdown({ to, onExpire }: { to: string; onExpire?: () => void }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, new Date(to).getTime() - now);
  useEffect(() => {
    if (left === 0) onExpire?.();
  }, [left, onExpire]);
  if (left === null) return <span className="tabular">--:--</span>;
  const h = Math.floor(left / 3600_000), m = Math.floor((left % 3600_000) / 60_000), s = Math.floor((left % 60_000) / 1000);
  return <span className="tabular">{h > 0 ? `${h}:` : ""}{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>;
}

/** Polling status dengan router.refresh (untuk halaman menunggu pembayaran). */
export function AutoRefresh({ everyMs = 4000, until }: { everyMs?: number; until?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (until) return;
    const t = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, until]);
  return null;
}

/** Detail yang bisa dibuka & disalin (untuk card error). */
export function Disclosure({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-surface">
      <button type="button" onClick={() => setOpen(!open)} className="focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold" aria-expanded={open}>
        {title}
        <Icon name="chevronDown" size={18} className={cx("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="animate-enter px-4 pb-4">
          <pre className="mono max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/40 p-3 text-xs text-muted">{text}</pre>
          <div className="mt-3">
            <CopyButton value={text} label="Salin detail" />
          </div>
        </div>
      )}
    </div>
  );
}
