"use client";
import { useSyncExternalStore } from "react";

// Preferensi tampilan per perangkat. Hanya hal non-sensitif yang disimpan di localStorage.
export interface Prefs {
  motion: "system" | "reduce" | "full";
  labels: "auto" | "always" | "selected";
  pollSeconds: 10 | 12 | 15;
}

const KEY = "felix:prefs:v1";
const DEFAULTS: Prefs = { motion: "system", labels: "auto", pollSeconds: 12 };

let state: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      state = {
        motion: p.motion === "reduce" || p.motion === "full" ? p.motion : "system",
        labels: p.labels === "always" || p.labels === "selected" ? p.labels : "auto",
        pollSeconds: p.pollSeconds === 10 || p.pollSeconds === 15 ? p.pollSeconds : 12,
      };
    }
  } catch {
    /* penyimpanan tidak tersedia → pakai default */
  }
}

export function getPrefs(): Prefs {
  load();
  return state;
}

export function setPrefs(patch: Partial<Prefs>) {
  load();
  state = { ...state, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULTS);
}

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** true jika animasi harus dikurangi (preferensi aplikasi atau sistem). */
export function useReducedMotion(): boolean {
  const prefs = usePrefs();
  const system = useSystemReducedMotion();
  return prefs.motion === "reduce" || (prefs.motion === "system" && system);
}
