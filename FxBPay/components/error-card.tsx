import type { ReactNode } from "react";
import { Icon } from "./icons";
import { Disclosure } from "./client";
import { KV } from "./ui";

/** Card error: ikon merah, penjelasan singkat, ringkasan transaksi, tombol coba lagi, detail yang bisa dibuka & disalin. */
export function ErrorCard({ title, message, summary, action, detail }: { title: string; message: ReactNode; summary: [ReactNode, ReactNode][]; action?: ReactNode; detail?: string }) {
  return (
    <div className="card animate-enter p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <Icon name="xCircle" size={28} />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted">{message}</p>
      <div className="mt-5 rounded-2xl bg-surface px-4">
        <KV items={summary} />
      </div>
      {action && <div className="mt-5">{action}</div>}
      {detail && <div className="mt-4"><Disclosure title="Detail teknis" text={detail} /></div>}
    </div>
  );
}
