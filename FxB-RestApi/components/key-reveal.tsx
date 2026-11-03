"use client";

import { ShieldAlert } from "lucide-react";
import { CopyButton } from "./ui";

/** Menampilkan secret API key sekali saja. */
export function KeyReveal({ secret }: { secret: string }) {
  return (
    <div className="corner-frame rounded-[20px] bg-mint p-4 text-mint-ink">
      <div className="text-[12px] font-bold uppercase tracking-wider opacity-70">API key kamu</div>
      <code className="mt-1 block break-all font-mono text-[15px] font-semibold">{secret}</code>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium opacity-80">
          <ShieldAlert className="size-4" /> Hanya ditampilkan sekali. Simpan sekarang.
        </span>
        <CopyButton text={secret} className="!text-mint-ink underline" />
      </div>
    </div>
  );
}
