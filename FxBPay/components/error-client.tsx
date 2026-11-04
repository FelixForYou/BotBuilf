"use client";

import { Icon } from "./icons";
import { Button, Disclosure } from "./client";

export function ErrorCardClient({ digest, reset }: { digest?: string; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md items-center px-4">
      <div className="card w-full p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger"><Icon name="xCircle" size={28} /></span>
        <h1 className="mt-5 text-2xl font-extrabold">Terjadi kesalahan</h1>
        <p className="mt-2 text-muted">Permintaan tidak dapat diselesaikan. Tidak ada perubahan saldo yang dibuat dari halaman ini.</p>
        <Button size="lg" className="mt-5 w-full" icon="refresh" onClick={reset}>Coba lagi</Button>
        {digest && <div className="mt-4"><Disclosure title="Detail teknis" text={`Kode insiden: ${digest}`} /></div>}
      </div>
    </div>
  );
}
