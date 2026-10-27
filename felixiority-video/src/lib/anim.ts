import {Easing, interpolate, spring, SpringConfig} from 'remotion';
import {FPS} from './theme';

/** Kurva easing konsisten untuk seluruh video. */
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: masuk cepat, mendarat lembut
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  snap: Easing.bezier(0.85, 0, 0.15, 1),
  linear: (t: number) => t,
};

/** Interpolasi ter-clamp dengan easing. */
export const ramp = (
  f: number,
  [a, b]: [number, number],
  [from, to]: [number, number] = [0, 1],
  easing: (t: number) => number = E.out,
) => interpolate(f, [a, b], [from, to], {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Keyframe multi-titik: [[frame, value], ...] dengan easing per segmen. */
export const kf = (f: number, keys: [number, number][], easing: (t: number) => number = E.inOut) =>
  interpolate(
    f,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

export const SPR = {
  smooth: {damping: 200, mass: 1, stiffness: 120} as Partial<SpringConfig>,
  pop: {damping: 13, mass: 0.7, stiffness: 160} as Partial<SpringConfig>,
  bouncy: {damping: 9, mass: 0.8, stiffness: 120} as Partial<SpringConfig>,
  snappy: {damping: 22, mass: 0.6, stiffness: 200} as Partial<SpringConfig>,
  gentle: {damping: 26, mass: 1, stiffness: 90} as Partial<SpringConfig>,
};

/** Spring berbasis frame (0 → 1) mulai di `delay`. */
export const spr = (f: number, delay = 0, config: Partial<SpringConfig> = SPR.smooth, durationInFrames?: number) =>
  spring({frame: f - delay, fps: FPS, config, durationInFrames});

/** Interpolasi eksponensial — kecepatan zoom terasa konstan. */
export const expLerp = (t: number, a: number, b: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Kecepatan (unit/frame) dari fungsi animasi murni — untuk motion blur. */
export const velocity = (fn: (f: number) => number, f: number) => fn(f) - fn(f - 1);

/** PRNG deterministik. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const fmt = (n: number) => Math.round(n).toLocaleString('id-ID');
