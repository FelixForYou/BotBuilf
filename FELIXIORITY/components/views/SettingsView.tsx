"use client";
import { useState } from "react";
import { IconAlert, IconGlobe, IconInfo, IconUnplug } from "@/components/icons";
import { apiFetch, forgetSession, hardNavigate } from "@/lib/api";
import { resetStore, useStore } from "@/lib/client-store";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { setPrefs, usePrefs, useSystemReducedMotion, type Prefs } from "@/lib/prefs";
import type { SessionInfo } from "@/types/panel";

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-bg/60 p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-md px-3 text-sm font-semibold ${
            value === o.value ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({ session }: { session: SessionInfo }) {
  const prefs = usePrefs();
  const systemReduced = useSystemReducedMotion();
  const { snapshot, lastSuccessAt } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const disconnect = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await apiFetch("/api/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error();
      forgetSession();
      resetStore();
      hardNavigate("/");
    } catch {
      setErr("Gagal memutuskan koneksi. Coba lagi.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-black">Pengaturan</h1>

      <section className="card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <IconGlobe size={18} className="text-blue-300" /> Koneksi panel
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">Domain panel</dt>
            <dd className="truncate font-semibold">{session.panelOrigin}</dd>
          </div>
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">API key</dt>
            <dd className="font-semibold">Tersimpan terenkripsi di cookie sesi (tidak ditampilkan)</dd>
          </div>
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">Terhubung sejak</dt>
            <dd className="font-semibold">
              {formatDate(new Date(session.connectedAt).toISOString())}, {formatTime(session.connectedAt)}
            </dd>
          </div>
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">Sesi berakhir</dt>
            <dd className="font-semibold">
              {formatDate(new Date(session.expiresAt).toISOString())}, {formatTime(session.expiresAt)}
            </dd>
          </div>
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">Sinkronisasi terakhir</dt>
            <dd className="font-semibold">{lastSuccessAt ? formatTime(lastSuccessAt) : "-"}</dd>
          </div>
          <div className="rounded-lg bg-bg/40 px-3 py-2">
            <dt className="text-xs text-ink-mute">Permintaan ke panel per sinkronisasi</dt>
            <dd className="font-semibold">{snapshot ? formatNumber(snapshot.requests) : "-"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="flex h-10 items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-4 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
          >
            <IconUnplug size={16} /> {busy ? "Memutuskan…" : "Putuskan Koneksi"}
          </button>
          <span className="text-xs text-ink-mute">Menghapus cookie sesi dan data di halaman ini.</span>
        </div>
        {err && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-300">
            <IconAlert size={14} /> {err}
          </p>
        )}
      </section>

      <section className="card space-y-5 p-4 sm:p-5">
        <h2 className="font-bold">Animasi & tampilan</h2>
        <div>
          <div className="mb-2 text-sm font-semibold">Gerakan karakter</div>
          <Segmented<Prefs["motion"]>
            label="Gerakan karakter"
            value={prefs.motion}
            onChange={(motion) => setPrefs({ motion })}
            options={[
              { value: "system", label: "Ikuti sistem" },
              { value: "full", label: "Animasi penuh" },
              { value: "reduce", label: "Kurangi animasi" },
            ]}
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Sistem Anda saat ini {systemReduced ? "meminta animasi dikurangi" : "tidak meminta pengurangan animasi"}.
            Mode kurangi animasi membuat semua karakter tetap duduk.
          </p>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold">Label username</div>
          <Segmented<Prefs["labels"]>
            label="Label username"
            value={prefs.labels}
            onChange={(labels) => setPrefs({ labels })}
            options={[
              { value: "auto", label: "Otomatis" },
              { value: "always", label: "Selalu" },
              { value: "selected", label: "Hanya terpilih" },
            ]}
          />
          <p className="mt-1.5 text-xs text-ink-mute">Otomatis: label disembunyikan saat zoom terlalu kecil agar tidak bertumpuk.</p>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold">Interval sinkronisasi</div>
          <Segmented<Prefs["pollSeconds"]>
            label="Interval sinkronisasi"
            value={prefs.pollSeconds}
            onChange={(pollSeconds) => setPrefs({ pollSeconds })}
            options={[
              { value: 10, label: "10 detik" },
              { value: 12, label: "12 detik" },
              { value: 15, label: "15 detik" },
            ]}
          />
          <p className="mt-1.5 flex gap-1.5 text-xs text-ink-mute">
            <IconInfo size={13} className="mt-px shrink-0" />
            Perubahan di panel terlihat pada sinkronisasi berikutnya. Panel besar otomatis memakai jeda lebih panjang, dan
            sinkronisasi berhenti saat tab tidak aktif.
          </p>
        </div>
      </section>
    </div>
  );
}
