"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: number; kind: "ok" | "err"; text: string };
type ConfirmOpts = { title: string; body?: string; confirm?: string; danger?: boolean };

interface Kit {
  csrf: string;
  toast: (kind: Toast["kind"], text: string) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  api: <T = unknown>(url: string, init?: { method?: string; json?: unknown; body?: BodyInit }) => Promise<T>;
}

const Ctx = createContext<Kit | null>(null);
export const useAdmin = () => {
  const k = useContext(Ctx);
  if (!k) throw new Error("AdminKit belum dipasang");
  return k;
};

export function AdminKit({ csrf, children }: { csrf: string; children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const seq = useRef(0);

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 7000 : 4000);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);

  useEffect(() => {
    if (dialog) dlg.current?.showModal();
    else dlg.current?.close();
  }, [dialog]);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  const api = useCallback(
    async <T,>(url: string, init: { method?: string; json?: unknown; body?: BodyInit } = {}) => {
      const headers: Record<string, string> = { "x-csrf-token": csrf };
      let body = init.body;
      if (init.json !== undefined) {
        headers["content-type"] = "application/json";
        body = JSON.stringify(init.json);
      }
      let res: Response;
      try {
        res = await fetch(url, { method: init.method ?? "GET", headers, body, credentials: "same-origin" });
      } catch {
        throw new Error("Tidak bisa terhubung ke server.");
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/admin/login";
      }
      if (!res.ok) throw new Error((data as { error?: string }).error || `Gagal (${res.status}).`);
      return data as T;
    },
    [csrf]
  );

  return (
    <Ctx.Provider value={{ csrf, toast, confirm, api }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <b>{t.kind === "ok" ? "Berhasil" : "Gagal"}</b>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <dialog ref={dlg} className="dlg" onCancel={(e) => { e.preventDefault(); close(false); }}>
        {dialog && (
          <form method="dialog" onSubmit={(e) => { e.preventDefault(); close(true); }}>
            <h2>{dialog.title}</h2>
            {dialog.body && <p>{dialog.body}</p>}
            <div className="dlg__actions">
              <button type="button" className="abtn" onClick={() => close(false)} autoFocus>Batal</button>
              <button type="submit" className={`abtn ${dialog.danger ? "abtn--danger" : "abtn--primary"}`}>{dialog.confirm ?? "Lanjutkan"}</button>
            </div>
          </form>
        )}
      </dialog>
    </Ctx.Provider>
  );
}
