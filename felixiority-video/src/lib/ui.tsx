import React from "react";

import { C, F } from "./theme";
import { mix, prog, useT } from "./anim";

/** Kata yang naik dari balik masker (efek .w > span di situs). */
export const RiseWords: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  serifWords?: number[];
  blueWords?: number[];
}> = ({ text, start, stagger = 2, dur = 28, style, serifWords = [], blueWords = [] }) => {
  const frame = useT();
  const words = text.split(/\s+/);
  return (
    <span style={style}>
      {words.map((w, i) => {
        const p = prog(frame, start + i * stagger, dur);
        return (
          <React.Fragment key={i}>
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${mix(p, 112, 0)}%)`,
                  ...(serifWords.includes(i) ? { fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, letterSpacing: 0 } : {}),
                  ...(blueWords.includes(i) ? { color: C.blue } : {}),
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** Muncul pelan dari bawah. */
export const FadeUp: React.FC<{ start: number; dur?: number; y?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  start,
  dur = 24,
  y = 18,
  style,
  children,
}) => {
  const frame = useT();
  const p = prog(frame, start, dur);
  return <div style={{ opacity: p, transform: `translateY(${mix(p, y, 0)}px)`, ...style }}>{children}</div>;
};

export const Label: React.FC<{ children: React.ReactNode; light?: boolean; style?: React.CSSProperties }> = ({ children, light, style }) => (
  <span
    style={{
      fontFamily: F.mono,
      fontSize: 22,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: light ? C.boneDim : C.muted,
      ...style,
    }}
  >
    {children}
  </span>
);

/** Logo: kotak 2x2 dengan satu kotak biru. */
export const Mark: React.FC<{ size?: number; color?: string; accent?: string; shift?: number }> = ({ size = 12, color = C.ink, accent = C.blue, shift = 0 }) => {
  const g = size / 3;
  return (
    <span style={{ display: "inline-grid", gridTemplateColumns: `repeat(2, ${size}px)`, gap: g }}>
      <i style={{ width: size, height: size, background: color }} />
      <i style={{ width: size, height: size, background: accent, transform: `translateY(${shift * (size + g)}px)` }} />
      <i style={{ width: size, height: size, background: color, gridColumn: 1 }} />
    </span>
  );
};

export type Status = "active" | "development" | "maintenance";
export const StatusTag: React.FC<{ s: Status; light?: boolean }> = ({ s, light }) => {
  const txt = { active: "Aktif", development: "Pengembangan", maintenance: "Maintenance" }[s];
  const fg = light ? C.bone : C.ink;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: F.mono, fontSize: 20, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: fg }}>
      <i
        style={{
          width: 12,
          height: 12,
          background: s === "active" ? C.blue : s === "maintenance" ? C.warn : "transparent",
          border: s === "development" ? `2px solid ${fg}` : "none",
          boxSizing: "border-box",
        }}
      />
      {txt}
    </span>
  );
};
