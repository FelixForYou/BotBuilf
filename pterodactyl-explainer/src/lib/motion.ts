import { spring, SpringConfig } from "remotion";

/**
 * Motion vocabulary for the revision. Every move is a spring with a character
 * chosen for the object (snappy UI chips, heavy panels, whip camera...), so
 * objects accelerate hard, overshoot a little and settle quickly instead of
 * gliding on identical ease curves.
 */
const FPS = 60;
export type Feel = Partial<SpringConfig>;

export const SNAP: Feel = { stiffness: 300, damping: 24, mass: 0.8 }; // chips, icons, words (~14f, tiny overshoot)
export const PANEL: Feel = { stiffness: 170, damping: 19, mass: 1.1 }; // heavy cards (~26f, light overshoot)
export const GLIDE: Feel = { stiffness: 110, damping: 21, mass: 1 }; // camera dollies, no overshoot (~34f)
export const WHIP: Feel = { stiffness: 380, damping: 36, mass: 0.9 }; // fast camera pans (~16f, crisp stop)
export const DRIFT: Feel = { stiffness: 40, damping: 16, mass: 1.4 }; // slow readable settle (~60f)
export const POP: Feel = { stiffness: 420, damping: 20, mass: 0.7 }; // small elements popping in (~12f, visible overshoot)

/** 0 → 1 (may overshoot) starting at frame `at`. */
export const spr = (f: number, at: number, feel: Feel = PANEL) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { overshootClamping: false, ...feel } as SpringConfig });

/** Accelerating exit 0 → 1 over `len` frames (cubic ease-in). */
export const out = (f: number, at: number, len = 12) => {
  if (f <= at) return 0;
  if (f >= at + len) return 1;
  const t = (f - at) / len;
  return t * t * t;
};

/** Enter with spring, leave with acceleration. */
export const inOut = (f: number, inAt: number, outAt: number, feel: Feel = PANEL, outLen = 12) =>
  spr(f, inAt, feel) * (1 - out(f, outAt, outLen));

export type V6 = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
export const V0: V6 = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
export type Key = { at: number; to: Partial<V6>; feel?: Feel };

/**
 * Camera / object rig: each key starts a spring from the previous target to the
 * new one at `at`. Springs overlap, so a new move can begin before the old one
 * has fully settled (no dead stops between shots).
 */
export const rig = (f: number, start: Partial<V6>, keys: Key[]): V6 => {
  const cur: V6 = { ...V0, ...start };
  const prevTarget: V6 = { ...cur };
  for (const k of keys) {
    const q = spr(f, k.at, k.feel ?? GLIDE);
    (Object.keys(k.to) as (keyof V6)[]).forEach((axis) => {
      const delta = (k.to[axis] as number) - prevTarget[axis];
      cur[axis] += delta * q;
      prevTarget[axis] = k.to[axis] as number;
    });
  }
  return cur;
};

/** Value and per-frame velocity of a frame-driven function (for motion blur, light, SFX). */
export const vel = <T extends Record<string, number>>(fn: (f: number) => T, f: number) => {
  const a = fn(f);
  const b = fn(f - 1);
  const d = {} as T;
  for (const k of Object.keys(a)) (d as Record<string, number>)[k] = a[k] - b[k];
  return { v: a, d };
};

/** Quadratic bezier point: curved paths instead of straight slides. */
export const arc = (t: number, a: [number, number, number], c: [number, number, number], b: [number, number, number]) => {
  const u = 1 - t;
  return [0, 1, 2].map((i) => u * u * a[i] + 2 * u * t * c[i] + t * t * b[i]) as [number, number, number];
};

/** Frames until a spring of this feel visually lands (for SFX impact timing). */
export const landing = (feel: Feel) => (feel === SNAP ? 10 : feel === POP ? 8 : feel === WHIP ? 12 : feel === PANEL ? 16 : feel === GLIDE ? 24 : 30);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Continuous, gentle orbit layered on a camera so a "held" shot never freezes. */
export const breathe = (c: V6, f: number, amp0 = 1, seed = 0): V6 => {
  const amp = amp0 * Math.min(1, Math.max(0, f) / 45); // ramps in so the first frame matches the previous scene's last
  return {
  ...c,
  x: c.x + Math.sin(f * 0.011 + seed) * 22 * amp,
  y: c.y + Math.sin(f * 0.0085 + seed * 2) * 10 * amp,
  ry: c.ry + Math.sin(f * 0.0095 + seed * 3) * 1.6 * amp,
  rx: c.rx + Math.sin(f * 0.007 + seed) * 0.8 * amp,
  };
};
