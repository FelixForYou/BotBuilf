import {Easing, interpolate, spring} from 'remotion';

export const FPS = 60;

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-ish out (follow-through)
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.45, 0, 0.2, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45), // antisipasi -> percepatan
  back: Easing.bezier(0.34, 1.45, 0.64, 1), // overshoot kecil
  linear: (t: number) => t,
};

/** interpolasi terjepit dengan easing */
export const ip = (
  f: number,
  input: [number, number],
  output: [number, number],
  ease: (t: number) => number = E.inOut,
) =>
  interpolate(f, input, output, {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** multi-keyframe terjepit */
export const kf = (f: number, input: number[], output: number[], ease: (t: number) => number = E.inOut) =>
  interpolate(f, input, output, {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** progres 0..1 mulai di `start` selama `dur` */
export const p = (f: number, start: number, dur = 30, ease: (t: number) => number = E.out) =>
  ip(f, [start, start + dur], [0, 1], ease);

/** pegas yang lembut (follow-through) */
export const sp = (f: number, start: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: {damping: cfg.damping ?? 18, stiffness: cfg.stiffness ?? 120, mass: cfg.mass ?? 1},
  });

/** masuk lalu keluar: 0 -> 1 -> 0 */
export const inOut = (f: number, a: number, b: number, fadeIn = 24, fadeOut = 24) =>
  Math.min(p(f, a, fadeIn), 1 - p(f, b - fadeOut, fadeOut, E.in));

/** noise halus deterministik untuk drift/parallax */
export const drift = (f: number, seed = 0, amp = 1, speed = 1) =>
  amp *
  (Math.sin((f / 60) * 0.37 * speed + seed * 1.7) * 0.6 + Math.sin((f / 60) * 0.83 * speed + seed * 3.1) * 0.4);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** pseudo random deterministik */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
