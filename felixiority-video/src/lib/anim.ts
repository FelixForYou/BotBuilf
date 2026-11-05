import { Easing, interpolate, useCurrentFrame } from "remotion";

// Render 60 fps; semua timing ditulis dalam "satuan 30 fps" lalu dihitung pecahan,
// jadi gerakan tetap sama tapi tiap frame lebih halus.
export const FPS = 60;
export const K = FPS / 30;
export const useT = () => useCurrentFrame() / K;

// Kurva yang sama dengan situs: --ease-out / --ease-io / expo.out / power4.inOut
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const expoInOut = Easing.bezier(0.87, 0, 0.13, 1);

/** Progres 0→1 antara frame `start` dan `start + dur`, dengan easing. */
export const prog = (frame: number, start: number, dur: number, easing = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;
