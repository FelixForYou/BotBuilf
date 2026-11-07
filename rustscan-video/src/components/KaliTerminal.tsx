import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, MONO } from "../theme";
import { prog } from "../timing";

export type Seg = { text: string; color?: string; bold?: boolean; bg?: string };
export type TermLine =
  | { at: number; kind: "cmd"; text: string; typeDur: number; cwd?: string; hl?: { from: number; to: number; color: string; at: number }[] }
  | { at: number; kind: "out"; segs: Seg[] };

/**
 * A Kali-Linux-inspired terminal: two-line zsh prompt
 * ┌──(kali㉿kali)-[~]
 * └─$ command
 * Commands type out; output lines appear at their frame. Content scrolls so the
 * newest lines stay visible.
 */
export const KaliTerminal: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  lines: TermLine[];
  start: number;
  fontSize?: number;
  title?: string;
  tilt?: number;
}> = ({ x, y, w, h, lines, start, fontSize = 26, title = "kali@kali: ~", tilt = 0 }) => {
  const f = useCurrentFrame();
  const pin = prog(f, start, 30);
  const lh = fontSize * 1.45;

  // Build visible rows (a command occupies 2 rows).
  const rows: React.ReactNode[] = [];
  let lastCmdTyping = false;
  lines.forEach((ln, i) => {
    if (f < ln.at) return;
    if (ln.kind === "cmd") {
      const n = Math.floor(interpolate(f, [ln.at, ln.at + ln.typeDur], [0, ln.text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
      const typing = n < ln.text.length;
      lastCmdTyping = typing;
      rows.push(
        <div key={`p${i}`} style={{ height: lh, whiteSpace: "pre" }}>
          <span style={{ color: C.cyan }}>┌──(</span>
          <span style={{ color: C.kali, fontWeight: 700 }}>kali㉿kali</span>
          <span style={{ color: C.cyan }}>)-[</span>
          <span style={{ color: C.text, fontWeight: 700 }}>{ln.cwd ?? "~"}</span>
          <span style={{ color: C.cyan }}>]</span>
        </div>,
      );
      // command text with optional token highlights
      const chars = ln.text.slice(0, n);
      const segs: React.ReactNode[] = [];
      let k = 0;
      const hls = (ln.hl ?? []).filter((h) => f >= h.at).sort((a, b) => a.from - b.from);
      hls.forEach((h, j) => {
        if (h.from > k) segs.push(<span key={`t${j}a`}>{chars.slice(k, h.from)}</span>);
        const ph = prog(f, h.at, 14);
        segs.push(
          <span
            key={`t${j}b`}
            style={{
              color: C.bg,
              background: h.color,
              borderRadius: 6,
              boxShadow: `0 0 ${24 * ph}px ${h.color}`,
              padding: "0 2px",
              opacity: 0.4 + 0.6 * ph,
            }}
          >
            {chars.slice(h.from, h.to)}
          </span>,
        );
        k = h.to;
      });
      segs.push(<span key="rest">{chars.slice(k)}</span>);
      rows.push(
        <div key={`c${i}`} style={{ height: lh, whiteSpace: "pre" }}>
          <span style={{ color: C.cyan }}>└─</span>
          <span style={{ color: C.kali, fontWeight: 700 }}>$ </span>
          <span style={{ color: C.text }}>{segs}</span>
          {typing || i === lines.length - 1 || (lines[i + 1] && f < lines[i + 1].at) ? (
            <span style={{ display: "inline-block", width: fontSize * 0.6, height: fontSize * 1.05, background: C.text, verticalAlign: "middle", marginLeft: 2, opacity: typing ? 1 : Math.floor(f / 18) % 2 }} />
          ) : null}
        </div>,
      );
    } else {
      const p = prog(f, ln.at, 8);
      rows.push(
        <div key={`o${i}`} style={{ height: lh, whiteSpace: "pre", opacity: p, transform: `translateX(${(1 - p) * -12}px)` }}>
          {ln.segs.map((s, j) => (
            <span key={j} style={{ color: s.color ?? C.muted, fontWeight: s.bold ? 700 : 400, background: s.bg }}>
              {s.text}
            </span>
          ))}
        </div>
      );
    }
  });
  void lastCmdTyping;

  const bodyH = h - 64;
  const maxRows = Math.floor((bodyH - 30) / lh);
  const overflow = Math.max(0, rows.length - maxRows);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: pin,
        transform: `perspective(1800px) rotateY(${tilt}deg) translateY(${(1 - pin) * 40}px) scale(${0.96 + 0.04 * pin})`,
        filter: `blur(${(1 - pin) * 8}px)`,
        borderRadius: 16,
        background: "rgba(6, 11, 24, 0.94)",
        border: `1.5px solid ${C.kali}66`,
        boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 80px ${C.kali}22`,
        overflow: "hidden",
        fontFamily: MONO,
      }}
    >
      {/* title bar */}
      <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", background: "rgba(20, 34, 64, 0.9)", borderBottom: `1px solid ${C.kali}44`, gap: 10 }}>
        {[C.dim, C.dim, C.dim].map((c, i) => (
          <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.8 }} />
        ))}
        <span style={{ flex: 1, textAlign: "center", color: C.muted, fontSize: 20, marginRight: 60 }}>{title}</span>
      </div>
      <div style={{ position: "absolute", top: 64, left: 28, right: 28, bottom: 0, fontSize, lineHeight: `${lh}px`, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${-overflow * lh}px)` }}>{rows}</div>
      </div>
      {/* subtle inner glow line */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(180deg, ${C.kali}10, transparent 30%)` }} />
    </div>
  );
};
