"use client";

import { useState } from "react";
import { ActionForm, Button, api, CopyButton, useToast } from "@/components/client";

export function TwoFactorSetup() {
  const [setup, setSetup] = useState<{ secret: string; svg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  if (!setup)
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Gunakan aplikasi autentikator (Google Authenticator, Authy, 1Password, dll.).</p>
        <Button loading={loading} icon="shieldCheck" onClick={async () => {
          setLoading(true);
          try { setSetup(await api("/api/account/2fa/setup")); } catch (e) { toast((e as Error).message, "err"); }
          setLoading(false);
        }}>Aktifkan 2FA</Button>
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="mx-auto w-52 overflow-hidden rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: setup.svg }} />
      <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4"><span className="mono flex-1 break-all text-sm">{setup.secret}</span><CopyButton value={setup.secret} iconOnly /></div>
      <ActionForm action="/api/account/2fa/enable" submit="Verifikasi & aktifkan">
        <input name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="input tabular text-center text-xl tracking-[0.4em]" placeholder="000000" />
      </ActionForm>
    </div>
  );
}
