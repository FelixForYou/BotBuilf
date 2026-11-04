import Link from "next/link";
import { cx } from "./ui";

/** Pemilih env untuk halaman admin (?env=). */
export function EnvTabs({ env, base, extra = "" }: { env: string; base: string; extra?: string }) {
  return (
    <div className="mb-5 inline-flex rounded-full bg-surface p-1 text-sm font-bold">
      {(["production", "sandbox"] as const).map((e) => (
        <Link key={e} href={`${base}?env=${e}${extra}`} className={cx("rounded-full px-4 py-2 transition-colors", env === e ? "bg-mint text-ink" : "text-muted hover:text-fg")}>
          {e === "production" ? "Production" : "Sandbox"}
        </Link>
      ))}
    </div>
  );
}
export const pickEnv = (v?: string) => (v === "sandbox" ? "sandbox" : "production") as "sandbox" | "production";
