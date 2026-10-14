"use client";
// Ruangan pixel interaktif (PixiJS) + overlay label (DOM) + kontrol kamera.
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraControls } from "./Camera";
import type { Resident } from "./Character";
import type { LabelMode, OfficeEngine } from "./OfficeEngine";
import { UserLabel } from "./UserLabel";
import { IconAlert } from "@/components/icons";

export interface OfficeProps {
  roomIndex: number;
  residents: Resident[];
  selectedId: number | null;
  matches: Set<number> | null;
  reducedMotion: boolean;
  labelMode: LabelMode;
  onSelect: (id: number | null) => void;
  /** Ubah `nonce` untuk memusatkan kamera ke karakter. */
  focusRequest: { id: number; nonce: number } | null;
}

export default function Office(props: OfficeProps) {
  const { roomIndex, residents, selectedId, matches, reducedMotion, labelMode, onSelect, focusRequest } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<OfficeEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const latest = useRef(props);
  latest.current = props;

  // Inisialisasi engine sekali.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let engine: OfficeEngine | null = null;
    (async () => {
      try {
        const { OfficeEngine } = await import("./OfficeEngine");
        engine = await OfficeEngine.create(host, { onSelect: (id) => onSelectRef.current(id) });
        if (cancelled) {
          engine.destroy();
          return;
        }
        const p = latest.current;
        engine.setReducedMotion(p.reducedMotion);
        engine.setLabelMode(p.labelMode);
        engine.setMatches(p.matches);
        engine.setSelected(p.selectedId);
        engine.setRoom(p.roomIndex, p.residents);
        engineRef.current = engine;
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      engineRef.current = null;
      engine?.destroy();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setRoom(roomIndex, residents);
  }, [ready, roomIndex, residents]);
  useEffect(() => {
    engineRef.current?.setSelected(selectedId);
  }, [ready, selectedId]);
  useEffect(() => {
    engineRef.current?.setMatches(matches);
  }, [ready, matches]);
  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [ready, reducedMotion]);
  useEffect(() => {
    engineRef.current?.setLabelMode(labelMode);
  }, [ready, labelMode]);
  useEffect(() => {
    if (focusRequest) engineRef.current?.focus(focusRequest.id);
  }, [ready, focusRequest]);

  // Label yang terpasang sebelum engine siap didaftarkan ulang setelah siap.
  const labelEls = useRef(new Map<number, HTMLDivElement | null>());
  const refCallbacks = useRef(new Map<number, (el: HTMLDivElement | null) => void>());
  const labelRef = useCallback((id: number) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (el) labelEls.current.set(id, el);
        else {
          labelEls.current.delete(id);
          refCallbacks.current.delete(id);
        }
        engineRef.current?.registerLabel(id, el);
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);
  useEffect(() => {
    if (!ready) return;
    for (const [id, el] of labelEls.current) engineRef.current?.registerLabel(id, el);
  }, [ready]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={hostRef}
        tabIndex={0}
        role="application"
        aria-label="Ruangan pixel. Seret untuk menggeser, gulir atau cubit untuk zoom, klik karakter untuk melihat detail. Tombol panah menggeser, plus dan minus untuk zoom, 0 untuk reset."
        className="absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {residents.map((r) => (
          <UserLabel key={r.id} ref={labelRef(r.id)} username={r.username} serverCount={r.serverCount} isAdmin={r.isAdmin} />
        ))}
      </div>
      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Menyiapkan ruangan…
          </div>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink-soft">
          <div className="flex max-w-xs flex-col items-center gap-2">
            <IconAlert className="text-amber-300" />
            Ruangan tidak dapat ditampilkan (WebGL tidak tersedia). Gunakan daftar user di bawah atau halaman Pengguna.
          </div>
        </div>
      )}
      <div className="absolute bottom-3 right-3">
        <CameraControls
          onZoomIn={() => engineRef.current?.camera.zoomStep(1)}
          onZoomOut={() => engineRef.current?.camera.zoomStep(-1)}
          onReset={() => engineRef.current?.camera.reset()}
        />
      </div>
    </div>
  );
}
