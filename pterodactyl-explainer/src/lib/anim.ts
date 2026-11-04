import { Easing, interpolate } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Smooth ease-in-out with gentle anticipation-free S curve. */
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
/** Fast start, long settle (follow-through). */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
/** Anticipation: tiny pull-back before moving. */
export const easeAnticipate = Easing.bezier(0.6, -0.28, 0.35, 1);
/** Overshoot then settle. */
export const easeBack = Easing.bezier(0.34, 1.45, 0.64, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

/** 0..1 progress between frames a and b with easing. */
export const p = (f: number, a: number, b: number, ease = easeIO) => {
  if (b <= a) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") console.warn("p(): empty range", a, b);
    return f >= a ? 1 : 0;
  }
  return interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });
};

/** Map frame through keyframes with one easing per span. */
export const kf = (f: number, frames: number[], values: number[], ease = easeIO) =>
  interpolate(f, frames, values, { ...clamp, easing: ease });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Appear progress (in) multiplied by (1 - disappear progress). */
export const life = (f: number, inA: number, inLen: number, outA: number, outLen: number, ease = easeOut) =>
  p(f, inA, inA + inLen, ease) * (1 - p(f, outA, outA + outLen, easeIO));

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth value noise for organic drift (no jitter). */
export const drift = (f: number, seed: number, speed = 0.01) => {
  const x = f * speed + seed * 10;
  return Math.sin(x) * 0.6 + Math.sin(x * 0.53 + seed) * 0.4;
};
