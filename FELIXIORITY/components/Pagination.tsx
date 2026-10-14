"use client";
import { formatNumber } from "@/lib/format";
import { IconChevronLeft, IconChevronRight } from "./icons";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5 text-sm">
      <span className="text-ink-mute">
        {formatNumber(from)}–{formatNumber(to)} dari {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 0}
          className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink-soft hover:text-ink disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <IconChevronLeft />
        </button>
        <span className="min-w-[96px] text-center font-semibold tabular-nums">
          Hal. {page + 1} / {Math.max(1, pageCount)}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount - 1}
          className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink-soft hover:text-ink disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}
