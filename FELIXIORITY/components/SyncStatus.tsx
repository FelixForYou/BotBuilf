"use client";
import { syncNow, useStore } from "@/lib/client-store";
import { formatTime } from "@/lib/format";
import { IconRefresh } from "./icons";

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const { status, lastSuccessAt, error } = useStore();
  const updating = status === "updating";
  let dot = "bg-ink-mute";
  let label = "Menunggu data";
  if (updating) {
    dot = "bg-blue-400 animate-pulse";
    label = "Memperbarui";
  } else if (status === "fresh") {
    dot = "bg-emerald-400";
    label = "Terbaru";
  } else if (status === "error") {
    dot = "bg-amber-400";
    label = "Gagal memperbarui";
  }
  const time = lastSuccessAt ? formatTime(lastSuccessAt) : null;
  const title =
    (status === "error" && error ? `${error}\n` : "") +
    (time ? `Sinkronisasi berhasil terakhir: ${time}. ` : "") +
    "Perubahan di panel terlihat pada sinkronisasi berikutnya.";

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <div
        className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel/80 px-2.5 text-xs"
        title={title}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span className={`font-semibold ${status === "error" ? "text-amber-200" : "text-ink"}`}>{label}</span>
        {!compact && time && <span className="hidden text-ink-mute sm:inline">· {time}</span>}
      </div>
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={updating}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-2.5 text-xs font-semibold text-ink hover:border-accent/60 hover:bg-accent/10 disabled:cursor-wait disabled:opacity-60"
        aria-label="Perbarui data sekarang"
      >
        <IconRefresh size={15} className={updating ? "animate-spin" : ""} />
        <span className={compact ? "sr-only" : "hidden sm:inline"}>Perbarui</span>
      </button>
    </div>
  );
}
