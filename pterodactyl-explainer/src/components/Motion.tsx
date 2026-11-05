import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { C, FONT } from "../lib/theme";
import { rand } from "../lib/anim";
import { clamp01, lerp, out, spr, SNAP } from "../lib/motion";

/* ------------------------------------------------------------ motion blur */
/**
 * Directional motion blur driven by real per-frame velocity (px/frame).
 * Below a threshold nothing is applied, so resting objects and readable
 * text stay perfectly sharp.
 */
export const MBlur: React.FC<{ dx?: number; dy?: number; k?: number; max?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  dx = 0, dy = 0, k = 0.42, max = 16, children, style }) => {
  const id = "mb" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const bx = Math.min(max, Math.abs(dx) * k);
  const by = Math.min(max, Math.abs(dy) * k);
  if (bx < 0.6 && by < 0.6) return <div style={style}>{children}</div>;
  return (
    <div style={{ ...style, filter: `url(#${id})` }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------ swap text */
const GLYPHS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPRSTUVWXYZ0123456789";
/**
 * Text that replaces itself in place like the reference ("to → up → life"):
 * outgoing letters scramble and blur while the new word resolves left to right.
 */
export const SwapText: React.FC<{ f: number; items: { at: number; text: string; color?: string }[]; size?: number; weight?: number; color?: string; spacing?: number; align?: "center" | "left"; style?: React.CSSProperties; dur?: number }> = ({
  f, items, size = 40, weight = 600, color = C.ink, spacing = -0.02, align = "center", style, dur = 14 }) => {
  let idx = -1;
  items.forEach((it, i) => { if (f >= it.at) idx = i; });
  if (idx < 0) return null;
  const it = items[idx];
  const prev = idx > 0 ? items[idx - 1].text : "";
  const t = clamp01((f - it.at) / dur);
  const n = Math.max(it.text.length, prev.length);
  const chars: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const resolveAt = (i / Math.max(1, n)) * 0.75;
    const local = clamp01((t - resolveAt) / 0.25);
    let ch = "";
    let o = 1;
    let blur = 0;
    if (local >= 1) ch = it.text[i] ?? "";
    else if (t < 0.02 && prev) ch = prev[i] ?? "";
    else {
      const target = it.text[i];
      if (target === undefined || target === " ") { ch = target ?? ""; o = 1 - local; }
      else { ch = GLYPHS[Math.floor(rand(i * 7.1 + Math.floor(f / 2) * 3.3) * GLYPHS.length)]; o = 0.35 + local * 0.65; blur = (1 - local) * 3; }
    }
    chars.push(<span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: o, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>{ch}</span>);
  }
  const intro = idx === 0 ? spr(f, it.at, SNAP) : 1;
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: weight, letterSpacing: `${spacing}em`, color: it.color ?? color, textAlign: align, whiteSpace: "nowrap",
      opacity: Math.min(1, intro * 1.3), filter: intro < 0.98 ? `blur(${(1 - intro) * 8}px)` : undefined, transform: `translateY(${(1 - intro) * size * 0.3}px)`, ...style }}>
      {chars}
    </div>
  );
};

/* ------------------------------------------------------------ lens sweep */
/**
 * A large panel passing right in front of the lens. `half` "in" ends with the
 * screen fully covered (last frame of the outgoing scene); "out" starts fully
 * covered (first frame of the incoming scene). Same color + position at the cut
 * makes the change of world invisible.
 */
export const Sweep: React.FC<{ f: number; at: number; len?: number; half: "in" | "out"; dir?: "left" | "right" | "up" | "down"; color?: string; glowEdge?: boolean }> = ({
  f, at, len = 16, half, dir = "left", color = C.black, glowEdge = true }) => {
  const { width: VW, height: VH } = useVideoConfig();
  const t = clamp01((f - at) / len);
  if (half === "out" && (t >= 1 || f < at)) return null;
  if (half === "in" && (f < at || f >= at + len)) return null;
  // in: offscreen -> centred (accelerating); out: centred -> offscreen opposite side (decelerating)
  const e = half === "in" ? t * t : 1 - (1 - t) * (1 - t);
  const horiz = dir === "left" || dir === "right";
  const sign = dir === "left" || dir === "up" ? -1 : 1;
  const span = horiz ? VW * 1.4 + 20 : VH * 1.6;
  const pos = half === "in" ? lerp(-sign * span, 0, e) : lerp(0, sign * span, e);
  const speed = (half === "in" ? 2 * t : 2 * (1 - t)) * span / len;
  const W = horiz ? VW * 1.4 : VW * 1.25, H = horiz ? VH * 1.4 : VH * 1.6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <MBlur dx={horiz ? speed : 0} dy={horiz ? 0 : speed} k={0.22} max={40} style={{ position: "absolute", left: VW / 2 - W / 2, top: VH / 2 - H / 2, width: W, height: H,
        transform: horiz ? `translateX(${pos}px) skewX(${-sign * Math.min(8, speed * 0.05)}deg)` : `translateY(${pos}px)` }}>
        <div style={{ width: W, height: H, borderRadius: 80, background: color,
          boxShadow: glowEdge ? "0 0 120px rgba(255,106,43,0.55), 0 0 40px rgba(255,138,92,0.6)" : undefined }} />
      </MBlur>
    </AbsoluteFill>
  );
};

/** Circle reveal of a new world from a point (shape-driven transition). */
export const CircleReveal: React.FC<{ r: number; x?: number; y?: number; children: React.ReactNode; bg?: string }> = ({ r, x = 960, y = 540, children, bg }) => {
  if (r <= 0) return null;
  return <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)`, background: bg }}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------ barrel frame */
/** Bulging "screen" outline from the reference: content clipped by a curved path + dashed edge. */
export const barrelPath = (w: number, h: number, b: number, s: number) =>
  `M 0 ${b} Q ${w / 2} ${-b} ${w} ${b} Q ${w + s} ${h / 2} ${w} ${h - b} Q ${w / 2} ${h + b} 0 ${h - b} Q ${-s} ${h / 2} 0 ${b} Z`;

export const Barrel: React.FC<{ w: number; h: number; bulge?: number; f: number; children: React.ReactNode; dashO?: number; bg?: string }> = ({ w, h, bulge = 26, f, children, dashO = 0.8, bg = "#0b0b0c" }) => {
  const d = barrelPath(w, h, bulge, bulge * 0.6);
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `path("${d}")`, background: bg, overflow: "hidden" }}>{children}</div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={d} fill="none" stroke={`rgba(255,255,255,${dashO})`} strokeWidth={2.4} strokeDasharray="12 9" strokeDashoffset={-f * 0.6} />
      </svg>
    </div>
  );
};

/** Exit helper: accelerate away along z with blur, used instead of fades. */
export const exitZ = (f: number, at: number, len = 14) => {
  const q = out(f, at, len);
  return { z: -q * 1600, o: 1 - q * q, blur: q * 10 };
};

/* ------------------------------------------------------------ ambient depth */
/**
 * Soft bokeh particles in two depth layers (behind / in front) that drift slowly and
 * shift with the camera (parallax), plus a gentle vignette. Gradients only, no filters.
 */
export const Ambient: React.FC<{ f: number; camX?: number; camY?: number; color?: string; o?: number; seed?: number }> = ({ f, camX = 0, camY = 0, color = "255,138,92", o = 1, seed = 1 }) => {
  const { width: VW, height: VH } = useVideoConfig();
  const parts = Array.from({ length: 22 }).map((_, i) => {
    const r1 = rand(i * 3.1 + seed), r2 = rand(i * 7.7 + seed), r3 = rand(i * 1.9 + seed);
    const front = i % 3 === 0;
    const depth = front ? 1.6 : 0.35 + r3 * 0.4;
    const size = front ? 60 + r1 * 90 : 8 + r1 * 26;
    const x = ((r2 * VW * 1.4 - camX * depth + Math.sin(f * 0.004 + i) * 30) % (VW * 1.4) + VW * 1.4) % (VW * 1.4) - VW * 0.2;
    const y = ((r1 * VH * 1.3 - camY * depth - f * (0.15 + r3 * 0.35)) % (VH * 1.3) + VH * 1.3) % (VH * 1.3) - VH * 0.15;
    const a = (front ? 0.07 : 0.22) * (0.6 + 0.4 * Math.sin(f * 0.02 + i * 1.3));
    return { x, y, size, a };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      {parts.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.x - p.size / 2, top: p.y - p.size / 2, width: p.size, height: p.size, borderRadius: "50%",
          background: `radial-gradient(closest-side, rgba(${color},${p.a}), rgba(${color},0))` }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
