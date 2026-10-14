"use client";
import { useSyncExternalStore } from "react";
import { assignSlots, roomCount } from "./rooms";
import { getPrefs } from "./prefs";
import type { PanelServer, PanelUser, Snapshot } from "@/types/panel";

export type SyncStatus = "idle" | "updating" | "fresh" | "error";

export interface ChangeSummary {
  added: number;
  removed: number;
  changed: number;
  at: number;
}

export interface StoreState {
  snapshot: Snapshot | null;
  status: SyncStatus;
  error: string | null;
  lastSuccessAt: number | null;
  nextSyncAt: number | null;
  lastChange: ChangeSummary | null;
  slots: Map<number, number>;
  rooms: number;
  usersById: Map<number, PanelUser>;
  serversByOwner: Map<number, PanelServer[]>;
  usernamesById: Map<number, string>;
}

const EMPTY: StoreState = {
  snapshot: null,
  status: "idle",
  error: null,
  lastSuccessAt: null,
  nextSyncAt: null,
  lastChange: null,
  slots: new Map(),
  rooms: 1,
  usersById: new Map(),
  serversByOwner: new Map(),
  usernamesById: new Map(),
};

let state: StoreState = EMPTY;
const listeners = new Set<() => void>();

function set(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getStore(): StoreState {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getStore, () => EMPTY);
}

// ---------------------------------------------------------------------------
// Penerapan snapshot
// ---------------------------------------------------------------------------
export function diffUsers(prev: Snapshot | null, next: Snapshot): Omit<ChangeSummary, "at"> {
  if (!prev) return { added: 0, removed: 0, changed: 0 };
  const before = new Map(prev.users.map((u) => [u.id, u]));
  let added = 0,
    changed = 0;
  for (const u of next.users) {
    const b = before.get(u.id);
    if (!b) added++;
    else if (b.username !== u.username || b.serverCount !== u.serverCount || b.rootAdmin !== u.rootAdmin) changed++;
    before.delete(u.id);
  }
  return { added, removed: before.size, changed };
}

export function applySnapshot(snap: Snapshot) {
  const diff = diffUsers(state.snapshot, snap);
  const slots = assignSlots(
    state.slots,
    snap.users.map((u) => u.id),
  );
  const serversByOwner = new Map<number, PanelServer[]>();
  for (const s of snap.servers) {
    const list = serversByOwner.get(s.ownerId);
    if (list) list.push(s);
    else serversByOwner.set(s.ownerId, [s]);
  }
  const hasChange = diff.added + diff.removed + diff.changed > 0;
  set({
    snapshot: snap,
    status: "fresh",
    error: null,
    lastSuccessAt: Date.now(),
    slots,
    rooms: roomCount(slots),
    usersById: new Map(snap.users.map((u) => [u.id, u])),
    usernamesById: new Map(snap.users.map((u) => [u.id, u.username])),
    serversByOwner,
    lastChange: hasChange ? { ...diff, at: Date.now() } : state.lastChange,
  });
}

// ---------------------------------------------------------------------------
// Polling: tidak bertumpuk, berhenti saat tab tersembunyi, jeda ulang saat gagal.
// ---------------------------------------------------------------------------
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;
let failures = 0;
let consumers = 0;
let controller: AbortController | null = null;

function baseInterval(): number {
  const pref = getPrefs().pollSeconds * 1000;
  return Math.max(pref, state.snapshot?.recommendedIntervalMs ?? 0);
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = null;
  if (consumers === 0 || document.visibilityState !== "visible") {
    set({ nextSyncAt: null });
    return;
  }
  set({ nextSyncAt: Date.now() + ms });
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, ms);
}

class SyncError extends Error {
  constructor(
    message: string,
    public retryAfterMs?: number,
  ) {
    super(message);
  }
}

export function syncNow(): Promise<void> {
  if (inflight) return inflight;
  if (timer) clearTimeout(timer);
  timer = null;
  set({ status: "updating" });
  controller = new AbortController();
  const ctl = controller;
  inflight = (async () => {
    try {
      const res = await fetch("/api/sync", {
        cache: "no-store",
        credentials: "same-origin",
        signal: ctl.signal,
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) {
        stopPolling(true);
        window.location.replace("/?expired=1");
        return;
      }
      if (!res.ok) {
        let msg = `Gagal memperbarui (HTTP ${res.status}).`;
        let retry: number | undefined;
        try {
          const b = (await res.json()) as { error?: string; retryAfterMs?: number };
          if (b.error) msg = b.error;
          retry = b.retryAfterMs;
        } catch {
          /* bukan JSON */
        }
        throw new SyncError(msg, retry);
      }
      const snap = (await res.json()) as Snapshot;
      applySnapshot(snap);
      failures = 0;
      schedule(baseInterval());
    } catch (e) {
      if (ctl.signal.aborted) return;
      failures++;
      const retry = e instanceof SyncError ? e.retryAfterMs : undefined;
      const backoff = Math.min(baseInterval() * 2 ** Math.min(failures, 5), 5 * 60_000);
      const jitter = Math.random() * 2000;
      // Data terakhir dipertahankan; hanya status yang berubah.
      set({
        status: "error",
        error: e instanceof SyncError ? e.message : "Koneksi ke server aplikasi gagal.",
      });
      schedule(Math.max(backoff, retry ?? 0) + jitter);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function onVisibility() {
  if (document.visibilityState !== "visible") {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ nextSyncAt: null });
    return;
  }
  if (inflight) return;
  const since = state.lastSuccessAt ? Date.now() - state.lastSuccessAt : Infinity;
  if (since >= baseInterval()) void syncNow();
  else schedule(baseInterval() - since);
}

/** Dipanggil oleh shell halaman. Mengembalikan fungsi pembersih. */
export function startPolling(): () => void {
  consumers++;
  if (consumers === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    if (!state.snapshot || !state.lastSuccessAt || Date.now() - state.lastSuccessAt > baseInterval()) {
      void syncNow();
    } else {
      schedule(baseInterval() - (Date.now() - state.lastSuccessAt));
    }
  }
  return () => {
    consumers = Math.max(0, consumers - 1);
    if (consumers === 0) stopPolling(false);
  };
}

function stopPolling(abort: boolean) {
  if (timer) clearTimeout(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisibility);
  if (abort) controller?.abort();
}

/** Hapus semua data dari memori (dipakai saat putus koneksi). */
export function resetStore() {
  consumers = 0;
  stopPolling(true);
  failures = 0;
  state = EMPTY;
  listeners.forEach((l) => l());
}
