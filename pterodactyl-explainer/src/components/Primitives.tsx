import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO, glow, softShadow } from "../lib/theme";
import { clamp, drift, easeOut, mix, p } from "../lib/anim";
import { interpolate } from "remotion";

/* ------------------------------------------------------------------ camera */
export type Cam = { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; persp?: number };

/** A 3D world whose origin is the screen centre. Camera moves the world. */
export const Stage: React.FC<{ cam?: Cam; children: React.ReactNode; style?: React.CSSProperties; blur?: [number, number] }> = ({ cam = {}, children, style, blur }) => {
  const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, persp = 1600 } = cam;
  const id = "stg" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const bx = blur ? Math.min(14, Math.abs(blur[0]) * 0.3) : 0;
  const by = blur ? Math.min(14, Math.abs(blur[1]) * 0.3) : 0;
  const on = bx > 0.6 || by > 0.6;
  return (
    <AbsoluteFill style={{ filter: on ? `url(#${id})` : undefined }}>
    {on && (
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} /></filter>
      </svg>
    )}
    <AbsoluteFill style={{ perspective: persp, perspectiveOrigin: "50% 50%", overflow: "hidden", ...style }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translateZ(${-z}px) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${-x}px, ${-y}px, 0px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Object placed in the Stage world, centred on (x,y,z). */
export const Obj: React.FC<{
  x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; w: number; h: number;
  o?: number; children?: React.ReactNode; style?: React.CSSProperties; flat?: boolean;
}> = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, w, h, o = 1, children, style, flat }) => (
  <div
    style={{
      position: "absolute",
      left: -w / 2,
      top: -h / 2,
      width: w,
      height: h,
      opacity: o,
      transformStyle: flat ? "flat" : "preserve-3d",
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ surfaces */
export const Card: React.FC<{
  w: number; h: number; tone?: "dark" | "light" | "glass" | "ink"; glowA?: number; radius?: number;
  children?: React.ReactNode; style?: React.CSSProperties; shadowA?: number;
}> = ({ w, h, tone = "dark", glowA = 0, radius = 22, children, style, shadowA = 1 }) => {
  const bg =
    tone === "dark" ? `linear-gradient(160deg, ${C.panel2}, ${C.panel})` :
    tone === "ink" ? `linear-gradient(160deg, #0d0d0f, #060607)` :
    tone === "glass" ? "linear-gradient(160deg, rgba(255,255,255,0.96), rgba(244,240,236,0.92))" :
    `linear-gradient(160deg, #ffffff, ${C.paper})`;
  const border = tone === "dark" || tone === "ink" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(10,10,12,0.06)";
  const shadow = glowA > 0 ? glow(glowA) : tone === "dark" || tone === "ink" ? `0 30px 80px rgba(0,0,0,${0.55 * shadowA})` : softShadow(shadowA);
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: bg, border, boxShadow: shadow, position: "relative", overflow: "hidden", fontFamily: FONT, ...style }}>
      {/* specular edge */}
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, background: tone === "dark" || tone === "ink" ? "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 30%)" : "linear-gradient(180deg, rgba(255,255,255,0.8), transparent 40%)", pointerEvents: "none" }} />
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ type */
/**
 * Kinetic words like the reference: each word sharpens from blur while
 * drifting up; exit blurs and lifts. `times` gives per-word local frames.
 */
export const Words: React.FC<{
  f: number; text: string; at: number; times?: number[]; stagger?: number; out?: number; outLen?: number;
  size?: number; color?: string; weight?: number; accent?: number[]; accentColor?: string; spacing?: number;
  align?: "center" | "left"; style?: React.CSSProperties; dur?: number; mono?: boolean;
}> = ({ f, text, at, times, stagger = 6, out, outLen = 24, size = 34, color = C.ink, weight = 600, accent = [], accentColor = C.orange,
  spacing = -0.02, align = "center", style, dur = 15, mono }) => {
  const words = text.split(" ");
  const oq = out === undefined ? 0 : Math.min(1, Math.max(0, (f - out) / Math.min(outLen, 14)) ** 2);
  const o = 1 - oq;
  const outBlur = oq * 9;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", gap: `0 ${size * 0.28}px`,
      fontFamily: mono ? MONO : FONT, fontSize: size, fontWeight: weight, letterSpacing: `${spacing}em`, color, lineHeight: 1.15, opacity: o, filter: outBlur > 0.05 ? `blur(${outBlur}px)` : undefined, transform: `translateY(${-oq * size * 0.5}px)`, ...style }}>
      {words.map((w, i) => {
        const t0 = times?.[i] ?? at + i * stagger;
        const q = p(f, t0 - 3, t0 - 3 + dur, easeOut);
        const blur = (1 - q) * 7;
        return (
          <span key={i} style={{ display: "inline-block", opacity: q, transform: `translateY(${(1 - q) * size * 0.3}px) scale(${0.96 + 0.04 * q})`,
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined, color: accent.includes(i) ? accentColor : undefined }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Label: React.FC<{ children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties; size?: number }> = ({ children, color = C.ink, bg = "rgba(10,10,12,0.05)", style, size = 18 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: `${size * 0.35}px ${size * 0.75}px`, borderRadius: 999, background: bg, color,
    fontFamily: FONT, fontSize: size, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

/** Small, discreet "data simulasi" tag required on example data. */
export const SimTag: React.FC<{ dark?: boolean; style?: React.CSSProperties }> = ({ dark, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.42)" : "rgba(10,10,12,0.4)",
    border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : "rgba(10,10,12,0.14)"}`, borderRadius: 6, padding: "3px 8px", ...style }}>
    data simulasi
  </div>
);

/* ------------------------------------------------------------------ light */
/** Warm orange glowing wave, drawn as layered strokes (no heavy filters). */
export const GlowWave: React.FC<{ f: number; y?: number; amp?: number; o?: number; speed?: number; wl?: number; width?: number; color?: string; core?: string; reveal?: number; tilt?: number }> = ({
  f, y = 540, amp = 60, o = 1, speed = 0.02, wl = 520, width = 1, color = C.orange, core = "#ffd2b8", reveal = 1, tilt = 0 }) => {
  const pts: string[] = [];
  const W = 2200;
  for (let i = 0; i <= 80; i++) {
    const x = -140 + (W * i) / 80;
    const yy = y + Math.sin(x / wl * Math.PI * 2 + f * speed) * amp + Math.sin(x / (wl * 0.47) + f * speed * 1.7) * amp * 0.25 + (x - 960) * tilt;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`);
  }
  const d = pts.join(" ");
  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - reveal } as const;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, overflow: "visible" }}>
      <path d={d} stroke={color} strokeOpacity={0.06} strokeWidth={150 * width} fill="none" strokeLinecap="round" {...dash} />
      <path d={d} stroke={color} strokeOpacity={0.12} strokeWidth={70 * width} fill="none" strokeLinecap="round" {...dash} />
      <path d={d} stroke={color} strokeOpacity={0.3} strokeWidth={28 * width} fill="none" strokeLinecap="round" {...dash} />
      <path d={d} stroke={color} strokeOpacity={0.75} strokeWidth={10 * width} fill="none" strokeLinecap="round" {...dash} />
      <path d={d} stroke={core} strokeOpacity={0.95} strokeWidth={3 * width} fill="none" strokeLinecap="round" {...dash} />
    </svg>
  );
};

/** Slow-moving warm light behind objects. */
export const WarmLight: React.FC<{ f: number; o?: number; x?: number; y?: number; r?: number; seed?: number; color?: string }> = ({ f, o = 1, x = 960, y = 540, r = 900, seed = 1, color = "255,106,43" }) => {
  const dx = drift(f, seed, 0.006) * 120;
  const dy = drift(f, seed + 3, 0.005) * 80;
  return (
    <div style={{ position: "absolute", left: x + dx - r, top: y + dy - r * 0.62, width: r * 2, height: r * 1.24, borderRadius: "50%", opacity: o,
      background: `radial-gradient(closest-side, rgba(${color},0.55), rgba(${color},0.22) 45%, rgba(${color},0) 100%)` }} />
  );
};

/** Diagonal light streak like the reference background. */
export const LightStreak: React.FC<{ f: number; o?: number; angle?: number; color?: string; seed?: number }> = ({ f, o = 1, angle = -28, color = "255,106,43", seed = 2 }) => {
  const shift = drift(f, seed, 0.004) * 160;
  return (
    <div style={{ position: "absolute", left: -600 + shift, top: -400, width: 3120, height: 1880, opacity: o, transform: `rotate(${angle}deg)`,
      background: `linear-gradient(90deg, rgba(${color},0) 30%, rgba(${color},0.32) 47%, rgba(${color},0.5) 50%, rgba(${color},0.32) 53%, rgba(${color},0) 70%)` }} />
  );
};

/* ------------------------------------------------------------------ dashed guides */
/**
 * Dashed guide lines like the reference. `bend` > 0 curves them (barrel warp);
 * `march` animates the dash offset so they never sit still.
 */
export const DashedGrid: React.FC<{ f: number; xs?: number[]; ys?: number[]; bend?: number; o?: number; color?: string; reveal?: number; march?: number }> = ({
  f, xs = [], ys = [], bend = 0, o = 1, color = "rgba(255,255,255,0.75)", reveal = 1, march = 0.4 }) => {
  const cx = 960, cy = 540;
  const hLine = (y: number) => {
    const k = ((y - cy) / cy) * bend;
    return `M -40 ${y + k * 120} Q ${cx} ${y - k * 120} 1960 ${y + k * 120}`;
  };
  const vLine = (x: number) => {
    const k = ((x - cx) / cx) * bend;
    return `M ${x + k * 70} -40 Q ${x - k * 70} ${cy} ${x + k * 70} 1120`;
  };
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
      {ys.map((y, i) => (
        <path key={"h" + i} d={hLine(y)} stroke={color} strokeWidth={2} fill="none" strokeDasharray="10 9" strokeDashoffset={-f * march}
          style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }} />
      ))}
      {xs.map((x, i) => (
        <path key={"v" + i} d={vLine(x)} stroke={color} strokeWidth={2} fill="none" strokeDasharray="10 9" strokeDashoffset={f * march}
          style={{ clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }} />
      ))}
    </svg>
  );
};

/** Animated dashed connector between two points with travelling pulses. */
export const Flow: React.FC<{
  f: number; d: string; color?: string; reveal?: number; pulses?: number; pulseSpeed?: number; width?: number; dashed?: boolean; o?: number; pulseColor?: string; glowOn?: boolean;
}> = ({ f, d, color = C.orange, reveal = 1, pulses = 0, pulseSpeed = 0.006, width = 3, dashed = true, o = 1, pulseColor, glowOn = true }) => {
  const id = "fl" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: -960, top: -540, overflow: "visible", opacity: o }}>
      <g transform="translate(960 540)">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
          <path d={d} stroke="#fff" strokeWidth={width * 8} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reveal} />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        {glowOn && <path d={d} stroke={color} strokeOpacity={0.18} strokeWidth={width * 5} fill="none" strokeLinecap="round" />}
        <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={dashed ? `${width * 3} ${width * 3}` : undefined} strokeDashoffset={-f * 0.8} />
      </g>
      {Array.from({ length: pulses }).map((_, i) => {
        const t = (f * pulseSpeed + i / pulses) % 1;
        if (t > reveal) return null;
        return (
          <path key={i} d={d} stroke={pulseColor ?? color} strokeWidth={width * 2.4} fill="none" strokeLinecap="round" pathLength={1}
            strokeDasharray={`0.035 1`} strokeDashoffset={-t} />
        );
      })}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ misc */
export const Dot: React.FC<{ color: string; size?: number; pulse?: number }> = ({ color, size = 10, pulse = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 ${6 + pulse * 10}px ${color}` }} />
);

export const fadeBetween = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
export { mix };

/** Censored placeholder for secrets (drawn bars, never real data). */
export const Redacted: React.FC<{ n?: number; color?: string; h?: number }> = ({ n = 8, color = "rgba(255,255,255,0.35)", h = 12 }) => (
  <span style={{ display: "inline-flex", gap: 3, verticalAlign: "middle", margin: "0 6px" }}>
    {Array.from({ length: n }).map((_, i) => <span key={i} style={{ width: h * 0.8, height: h, borderRadius: 3, background: color, display: "inline-block" }} />)}
  </span>
);
