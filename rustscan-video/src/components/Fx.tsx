import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, FONT, H, MONO, W } from "../theme";
import { ease, easeInOut, prog } from "../timing";

/* ------------------------------------------------------------------ */
/* Background: perspective grid, drifting particles, glow, vignette    */
/* ------------------------------------------------------------------ */

const PARTICLES = new Array(70).fill(0).map((_, i) => ({
  x: random(`px${i}`) * W,
  y: random(`py${i}`) * H,
  r: 1 + random(`pr${i}`) * 2.4,
  s: 0.15 + random(`ps${i}`) * 0.6,
  a: 0.2 + random(`pa${i}`) * 0.6,
  hue: random(`ph${i}`) > 0.7 ? C.green : C.cyan,
}));

export const Background: React.FC<{ glow?: string; glowX?: number; glowY?: number; intensity?: number }> = ({
  glow = C.cyan,
  glowX = 50,
  glowY = 40,
  intensity = 1,
}) => {
  const f = useCurrentFrame();
  const gridShift = (f * 0.9) % 80;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* ambient glows */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${glowX}% ${glowY}%, ${glow}22, transparent 70%), radial-gradient(700px 500px at 85% 90%, ${C.blue}18, transparent 70%)`,
          opacity: intensity,
        }}
      />
      {/* floor grid in perspective */}
      <div
        style={{
          position: "absolute",
          left: -W * 0.5,
          width: W * 2,
          top: H * 0.52,
          height: H * 1.1,
          transform: "perspective(700px) rotateX(68deg)",
          transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${C.line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.line} 1.5px, transparent 1.5px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${gridShift}px`,
          maskImage: "linear-gradient(to bottom, transparent, black 25%, black 60%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 25%, black 60%, transparent)",
          opacity: 0.55 * intensity,
        }}
      />
      {/* fine dot field */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          opacity: 0.35,
          maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 70%)",
        }}
      />
      {/* particles */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {PARTICLES.map((p, i) => {
          const y = (p.y - f * p.s * 1.4 + H * 4) % H;
          const tw = 0.5 + 0.5 * Math.sin(f / 20 + i);
          return <circle key={i} cx={p.x + Math.sin(f / 90 + i) * 14} cy={y} r={p.r} fill={p.hue} opacity={p.a * tw * intensity} />;
        })}
      </svg>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

/* Scanlines + subtle flicker, drawn on top of everything */
export const Scanlines: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 2px, transparent 4px)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 220,
          top: ((f * 6) % (H + 400)) - 300,
          background: `linear-gradient(to bottom, transparent, ${C.cyan}0c, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* HUD frame: corner brackets, header readouts, timecode               */
/* ------------------------------------------------------------------ */

const Corner: React.FC<{ x: number; y: number; rot: number; p: number }> = ({ x, y, rot, p }) => (
  <svg width={70} height={70} style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)` }}>
    <path d="M2 68 V2 H68" fill="none" stroke={C.cyan} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.8} />
  </svg>
);

export const HUD: React.FC<{ label: string; index: number; total?: number }> = ({ label, index, total = 8 }) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 40);
  const secs = (f / 60).toFixed(2).padStart(5, "0");
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: MONO, color: C.muted }}>
      <Corner x={36} y={36} rot={0} p={p} />
      <Corner x={W - 106} y={36} rot={90} p={p} />
      <Corner x={W - 106} y={H - 106} rot={180} p={p} />
      <Corner x={36} y={H - 106} rot={270} p={p} />
      <div
        style={{
          position: "absolute",
          top: 52,
          left: 120,
          fontSize: 20,
          letterSpacing: 4,
          opacity: p,
          display: "flex",
          gap: 18,
          alignItems: "center",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 5, background: C.green, boxShadow: `0 0 12px ${C.green}`, opacity: 0.5 + 0.5 * Math.sin(f / 8) }} />
        <span style={{ color: C.cyan }}>{String(index).padStart(2, "0")}</span>
        <span>/ {String(total).padStart(2, "0")}</span>
        <span style={{ color: C.text, opacity: 0.85 }}>{label}</span>
      </div>
      <div style={{ position: "absolute", top: 52, right: 120, fontSize: 20, letterSpacing: 3, opacity: p }}>
        SEC.LAB // T+{secs}
      </div>
      <div style={{ position: "absolute", bottom: 54, right: 120, fontSize: 16, letterSpacing: 3, opacity: p * 0.7 }}>
        EDU · LEGAL · LOCALHOST ONLY
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Kinetic typography                                                  */
/* ------------------------------------------------------------------ */

/** Each word slides up from behind a mask, with blur and stagger. */
export const MaskReveal: React.FC<{
  text: string;
  start: number;
  size: number;
  color?: string;
  weight?: number;
  stagger?: number;
  font?: string;
  tracking?: number;
  end?: number;
  align?: "left" | "center";
  highlight?: string[];
  hlColor?: string;
}> = ({ text, start, size, color = C.text, weight = 700, stagger = 4, font = FONT, tracking = -1, end, align = "left", highlight = [], hlColor = C.cyan }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  const out = end !== undefined ? prog(f, end - 16, 16, easeInOut) : 0;
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: tracking,
        lineHeight: 1.12,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
      }}
    >
      {words.map((w, i) => {
        const p = prog(f, start + i * stagger, 28);
        const isHl = highlight.includes(w.replace(/[.,?!:]/g, ""));
        return (
          <span key={i} style={{ overflow: "hidden", display: "inline-block", paddingBottom: size * 0.08 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 110 - out * 110}%) rotate(${(1 - p) * 6}deg)`,
                filter: `blur(${(1 - p) * 8}px)`,
                color: isHl ? hlColor : undefined,
                textShadow: isHl ? `0 0 30px ${hlColor}88` : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\=+";

/** Text that "decodes" from random glyphs into the final string. */
export const Decode: React.FC<{ text: string; start: number; dur?: number; style?: React.CSSProperties; seed?: string }> = ({
  text,
  start,
  dur = 40,
  style,
  seed = "d",
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = text
    .split("")
    .map((ch, i) => {
      if (ch === " ") return " ";
      const th = i / text.length;
      if (p >= th + 0.12) return ch;
      if (p < th * 0.6) return f < start ? "" : "";
      return GLYPHS[Math.floor(random(`${seed}${i}${Math.floor(f / 2)}`) * GLYPHS.length)];
    })
    .join("");
  return <span style={{ whiteSpace: "pre", ...style }}>{shown}</span>;
};

/** Typewriter: returns substring for the current frame. */
export const useTyped = (text: string, start: number, dur: number) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [start, start + dur], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return text.slice(0, n);
};

/* ------------------------------------------------------------------ */
/* Panels & chips                                                      */
/* ------------------------------------------------------------------ */

/** Glass panel whose border traces itself in, then content unmasks. */
export const Panel: React.FC<{
  start: number;
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
  title?: string;
}> = ({ start, x, y, w, h, children, accent = C.cyan, style, title }) => {
  const f = useCurrentFrame();
  const border = prog(f, start, 30);
  const fill = prog(f, start + 8, 30);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.panel,
          borderRadius: 18,
          clipPath: `inset(0 ${(1 - fill) * 100}% 0 0 round 18px)`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), inset 0 0 60px ${accent}0d`,
          backdropFilter: "blur(6px)",
        }}
      />
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} rx={18} fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - border} />
      </svg>
      {title && (
        <div style={{ position: "absolute", top: -14, left: 28, padding: "2px 12px", background: C.bg, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: accent, opacity: border }}>
          {title}
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>{children}</div>
    </div>
  );
};

export const Chip: React.FC<{ text: string; start: number; color?: string; size?: number; icon?: React.ReactNode }> = ({ text, start, color = C.cyan, size = 30, icon }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 24);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: `${size * 0.35}px ${size * 0.7}px`,
        border: `1.5px solid ${color}88`,
        background: `${color}14`,
        borderRadius: 999,
        fontFamily: MONO,
        fontSize: size,
        color: C.text,
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 999px)`,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {text}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Captions (narration subtitles)                                       */
/* ------------------------------------------------------------------ */

export const Captions: React.FC<{ parts: { start: number; dur: number; text: string }[] }> = ({ parts }) => {
  const f = useCurrentFrame();
  const cur = parts.find((p) => f >= p.start - 4 && f < p.start + p.dur + 14);
  if (!cur) return null;
  const pin = prog(f, cur.start - 4, 12);
  const pout = prog(f, cur.start + cur.dur + 2, 12, easeInOut);
  const words = cur.text.split(" ");
  const spoken = interpolate(f, [cur.start, cur.start + cur.dur], [0, words.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 92,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: pin * (1 - pout),
        transform: `translateY(${(1 - pin) * 14}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.35,
          padding: "12px 30px",
          borderRadius: 14,
          background: "rgba(3,7,12,0.72)",
          border: `1px solid ${C.line}`,
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i < spoken ? C.text : C.dim, transition: "none" }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene transition: RGB-split slices + flash + sweep bar              */
/* ------------------------------------------------------------------ */

export const GlitchTransition: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -18 || d > 18) return null;
  const k = 1 - Math.abs(d) / 18;
  const slices = new Array(9).fill(0).map((_, i) => ({
    y: random(`gy${at}${i}${Math.floor(f / 2)}`) * H,
    h: 8 + random(`gh${at}${i}${Math.floor(f / 2)}`) * 60,
    x: (random(`gx${at}${i}${Math.floor(f / 2)}`) - 0.5) * 260 * k,
    c: i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.green : C.blue,
  }));
  const sweep = interpolate(d, [-18, 18], [-W * 0.3, W * 1.3]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {slices.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: W, height: s.h, background: s.c, opacity: 0.18 * k, mixBlendMode: "screen" }} />
      ))}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: sweep,
          width: 260,
          background: `linear-gradient(90deg, transparent, ${C.cyan}66, #ffffffaa, ${C.cyan}66, transparent)`,
          transform: "skewX(-18deg)",
          opacity: k,
          filter: "blur(6px)",
        }}
      />
      <AbsoluteFill style={{ background: "#bff6ff", opacity: Math.max(0, 1 - Math.abs(d) / 4) * 0.35 }} />
    </AbsoluteFill>
  );
};

/** Scene wrapper: zoom/blur in at start, out at end. */
export const SceneShell: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const pin = prog(f, 0, 26);
  const pout = prog(f, dur - 18, 18, easeInOut);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1.06 - 0.06 * pin + 0.05 * pout})`,
        filter: `blur(${(1 - pin) * 10 + pout * 12}px)`,
        opacity: Math.min(pin * 1.4, 1) * (1 - pout),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export { ease };
