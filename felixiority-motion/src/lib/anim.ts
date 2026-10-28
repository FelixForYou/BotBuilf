import { Easing, interpolate, spring, type SpringConfig } from "remotion";

/** Kurva easing yang dipakai konsisten di seluruh video. */
export const E = {
  /** keluar cepat, mendarat sangat lembut — default untuk elemen masuk */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** untuk elemen keluar: mulai pelan, akselerasi */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** gerak kamera sinematik */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** sangat tajam di tengah — untuk whip/push transisi */
  whip: Easing.bezier(0.83, 0, 0.17, 1),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  linear: (t: number) => t,
} as const;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Interpolasi 2 titik dengan clamp & easing. */
export const tw = (
  f: number,
  from: number,
  to: number,
  a: number,
  b: number,
  easing: (t: number) => number = E.out,
) => interpolate(f, [from, to], [a, b], { ...CLAMP, easing });

/** Progress 0..1 antara dua frame. */
export const prog = (f: number, from: number, to: number, easing: (t: number) => number = E.out) =>
  tw(f, from, to, 0, 1, easing);

type Key = [frame: number, value: number, easing?: (t: number) => number];

/**
 * Keyframe multi-segmen; easing pada key ke-n berlaku untuk segmen yang
 * berakhir di key tersebut (seperti graph editor After Effects).
 */
export const keys = (f: number, ks: Key[]) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [f1, v1, e] = ks[i];
    const [f0, v0] = ks[i - 1];
    if (f <= f1) return interpolate(f, [f0, f1], [v0, v1], { ...CLAMP, easing: e ?? E.inOut });
  }
  return ks[ks.length - 1][1];
};

export const SPRING = {
  /** mendarat dengan sedikit overshoot */
  pop: { damping: 13, stiffness: 140, mass: 0.9 },
  /** halus tanpa overshoot berarti */
  smooth: { damping: 26, stiffness: 120, mass: 1 },
  /** UI ringan */
  snappy: { damping: 20, stiffness: 260, mass: 0.7 },
  /** besar & berat */
  heavy: { damping: 18, stiffness: 70, mass: 1.6 },
  bouncy: { damping: 9, stiffness: 150, mass: 0.8 },
} satisfies Record<string, Partial<SpringConfig>>;

export const sp = (
  f: number,
  delay = 0,
  config: Partial<SpringConfig> = SPRING.smooth,
  fps = 60,
  durationInFrames?: number,
) => spring({ frame: f - delay, fps, config, durationInFrames });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * "Motion blur" murah: blur sebanding kecepatan sebuah nilai animasi.
 * fn harus deterministik terhadap frame.
 */
export const speedBlur = (fn: (f: number) => number, f: number, k = 0.06, max = 14) =>
  Math.min(max, Math.abs(fn(f) - fn(f - 1)) * k);

/** PRNG deterministik (mulberry32) — pengganti Math.random(). */
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Squash & stretch sederhana dari kecepatan vertikal. */
export const squash = (vel: number, amount = 0.004) => {
  const s = clamp01(Math.abs(vel) * amount) * 0.22;
  return { sx: 1 - s * 0.6, sy: 1 + s };
};
