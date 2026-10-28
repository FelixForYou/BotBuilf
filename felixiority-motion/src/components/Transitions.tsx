import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, mix, prog } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C } from "../theme";

type Easing = (t: number) => number;

/** Scene berikutnya tersingkap lewat lingkaran yang tumbuh dari satu titik. */
export const CircleReveal: React.FC<{ cx?: number; cy?: number; dur?: number; easing?: Easing; children: React.ReactNode }> = ({
  cx = 960,
  cy = 540,
  dur = OVERLAP,
  easing = E.in,
  children,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, dur, easing);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = p * 1150;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>
      {children}
      {/* tepi lingkaran: cincin tipis terracotta mengikuti mask */}
      <div
        style={{
          position: "absolute",
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          boxShadow: `inset 0 0 0 ${3 + 10 * (1 - p)}px ${C.terracotta}`,
          opacity: 1 - p,
        }}
      />
    </AbsoluteFill>
  );
};

export type RectT = { x: number; y: number; w: number; h: number; r: number };

/** Mask persegi membulat dari sebuah kartu hingga memenuhi layar (kamera "masuk" lewat kartu). */
export const RectReveal: React.FC<{ from: RectT; dur?: number; easing?: Easing; children: React.ReactNode }> = ({
  from,
  dur = OVERLAP,
  easing = E.inOut,
  children,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, dur, easing);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const top = mix(from.y, 0, p);
  const left = mix(from.x, 0, p);
  const right = mix(1920 - from.x - from.w, 0, p);
  const bottom = mix(1080 - from.y - from.h, 0, p);
  const r = mix(from.r, 0, p);
  return <AbsoluteFill style={{ clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)` }}>{children}</AbsoluteFill>;
};

/**
 * Directional wipe berbasis objek: slab besar melintas sangat dekat kamera
 * (motion-blurred), scene baru terbuka tepat di belakang tepi slab.
 */
export const SlabWipe: React.FC<{ dur?: number; children: React.ReactNode }> = ({ dur = OVERLAP + 10, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, dur, E.whip);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  // tepi belakang slab bergerak dari kanan (2300) ke kiri (-700)
  const edge = mix(2500, -900, p);
  const vel = Math.abs(prog(f, 0, dur, E.whip) - prog(f - 1, 0, dur, E.whip)) * 3400;
  const blur = Math.min(26, vel * 0.18);
  const skew = -14;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(${edge + 260}px 0, 1920px 0, 1920px 1080px, ${edge}px 1080px)` }}>{children}</AbsoluteFill>
      {/* slab utama (terracotta) + slab sekunder putih: kedalaman berbeda */}
      <div
        style={{
          position: "absolute",
          left: edge - 560,
          top: -200,
          width: 700,
          height: 1480,
          background: `linear-gradient(90deg, ${C.terracottaDeep}, ${C.terracotta})`,
          transform: `skewX(${skew}deg)`,
          filter: `blur(${blur}px)`,
          boxShadow: "-60px 0 120px rgba(38,37,34,0.25)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: edge - 240 + 220 * (1 - p),
          top: -200,
          width: 160,
          height: 1480,
          background: C.white,
          transform: `skewX(${skew}deg)`,
          filter: `blur(${blur * 1.4}px)`,
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
};
