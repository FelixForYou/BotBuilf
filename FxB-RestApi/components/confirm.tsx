"use client";

import { useState } from "react";
import { Button, Sheet } from "./ui";

export function Confirm({ open, title, text, confirmLabel = "Ya, lanjutkan", danger, onConfirm, onClose }: { open: boolean; title: string; text: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="text-[15px] text-muted">{text}</div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button size="lg" variant="secondary" onClick={onClose}>Batal</Button>
        <Button
          size="lg"
          variant={danger ? "danger" : "primary"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
