"use client";

import { motion } from "motion/react";

/** Grafik batang sederhana (sukses = mint, error = merah) tanpa library tambahan. */
export function BarSeries({ data }: { data: { date: string; success: number; error: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.success + d.error));
  const showEvery = data.length > 14 ? Math.ceil(data.length / 8) : 1;
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {data.map((d, i) => {
          const total = d.success + d.error;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.success} sukses, ${d.error} error`}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${(total / max) * 100}%` }} transition={{ delay: i * 0.015, type: "spring", stiffness: 140, damping: 20 }} className="flex min-h-[3px] flex-col overflow-hidden rounded-t-[6px] bg-card-3">
                <div className="bg-danger" style={{ height: total ? `${(d.error / total) * 100}%` : 0 }} />
                <div className="flex-1 bg-mint" style={{ opacity: total ? 1 : 0 }} />
              </motion.div>
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-card-3 px-2 py-0.5 text-[11px] group-hover:block">{total}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10.5px] text-subtle">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 truncate text-center">{i % showEvery === 0 ? d.date.slice(5) : ""}</span>
        ))}
      </div>
    </div>
  );
}
