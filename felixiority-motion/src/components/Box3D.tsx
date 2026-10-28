import React from "react";
import { C } from "../theme";

/**
 * Kotak 3D berbasis CSS (preserve-3d) — deterministik, tanpa WebGL.
 * Titik origin = tengah dasar kotak; sumbu Y negatif = ke atas.
 */
export const Box3D: React.FC<{
  w: number;
  h: number;
  d: number;
  top?: string;
  front?: string;
  side?: string;
  frontContent?: React.ReactNode;
  topContent?: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
  edge?: string;
}> = ({ w, h, d, top = C.white, front = C.softGray, side = "#DCD8D0", frontContent, topContent, style, radius = 4, edge }) => {
  const face = (extra: React.CSSProperties, bg: string, content?: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        background: bg,
        backfaceVisibility: "hidden",
        borderRadius: radius,
        boxShadow: edge ? `inset 0 0 0 1px ${edge}` : undefined,
        overflow: "hidden",
        ...extra,
      }}
    >
      {content}
    </div>
  );
  return (
    <div style={{ position: "absolute", width: 0, height: 0, transformStyle: "preserve-3d", ...style }}>
      {/* depan (menghadap +Z) */}
      {face({ width: w, height: h, left: -w / 2, top: -h, transform: `translateZ(${d / 2}px)` }, front, frontContent)}
      {/* belakang */}
      {face({ width: w, height: h, left: -w / 2, top: -h, transform: `rotateY(180deg) translateZ(${d / 2}px)` }, side)}
      {/* kanan */}
      {face({ width: d, height: h, left: -d / 2, top: -h, transform: `rotateY(90deg) translateZ(${w / 2}px)` }, side)}
      {/* kiri */}
      {face({ width: d, height: h, left: -d / 2, top: -h, transform: `rotateY(-90deg) translateZ(${w / 2}px)` }, side)}
      {/* atas */}
      {face({ width: w, height: d, left: -w / 2, top: -d / 2, transform: `translateY(${-h}px) rotateX(90deg)` }, top, topContent)}
    </div>
  );
};

/** Unit server rack: badan charcoal, garis bay & LED status. */
export const ServerUnit: React.FC<{ w?: number; h?: number; d?: number; leds?: number; t?: number; style?: React.CSSProperties }> = ({
  w = 220,
  h = 300,
  d = 160,
  leds = 1,
  t = 0,
  style,
}) => (
  <Box3D
    w={w}
    h={h}
    d={d}
    top="#3A3833"
    front={C.charcoal}
    side="#1C1B19"
    radius={10}
    style={style}
    frontContent={
      <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: Math.floor((h - 30) / 42) }).map((_, i) => {
          const on = leds > i / 6;
          const blink = (Math.sin(t / 5 + i * 1.7) + 1) / 2;
          return (
            <div key={i} style={{ height: 30, borderRadius: 6, background: "#34322E", display: "flex", alignItems: "center", gap: 7, padding: "0 10px" }}>
              <span style={{ width: 7, height: 7, borderRadius: 9, background: on ? C.green : "#555", opacity: on ? 0.55 + blink * 0.45 : 1, boxShadow: on ? `0 0 8px ${C.green}` : undefined }} />
              <span style={{ width: 7, height: 7, borderRadius: 9, background: on && i % 2 ? C.terracotta : "#555" }} />
              <span style={{ flex: 1 }} />
              {[0, 1, 2, 3].map((k) => (
                <span key={k} style={{ width: 3, height: 14, background: "#4A4843", borderRadius: 2 }} />
              ))}
            </div>
          );
        })}
      </div>
    }
  />
);
