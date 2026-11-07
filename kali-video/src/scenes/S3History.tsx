import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

// Source: kali.org/docs/introduction/kali-linux-history (major releases)
const EVENTS = [
  { key: "n0", year: "2004", name: "Whoppix", base: "berbasis Knoppix", major: false },
  { key: "n1", year: "2005", name: "WHAX", base: "berbasis Slax", major: false },
  { key: "n2", year: "2006", name: "BackTrack", base: "WHAX + Auditor Security Collection", major: true },
  { key: "n3", year: "2010", name: "BackTrack 4", base: "beralih ke Ubuntu", major: false },
  { key: "n4", year: "2013", name: "Kali Linux 1.0", base: "13 Maret · Debian 7", major: true },
  { key: "n5", year: "2015", name: "Kali Linux 2.0", base: "Debian 8", major: false },
  { key: "n6", year: "2016", name: "Kali Rolling", base: "Debian Testing · terus diperbarui", major: true },
];
const SPACING = 520;
const X0 = 300;

export const S3History: React.FC = () => {
  const f = useCurrentFrame();
  const times = EVENTS.map((e) => beat("s3", e.key));
  // camera follows the most recent node
  const camX = interpolate(
    f,
    times.map((t) => t - 10),
    EVENTS.map((_, i) => Math.max(0, i * SPACING - 640)),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut },
  );
  const lineP = interpolate(f, [0, ...times], [0, ...EVENTS.map((_, i) => X0 + i * SPACING)], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const zoomOut = prog(f, times[6] + 50, 60, easeInOut);
  const camS = 1 - zoomOut * 0.52;
  const camShift = interpolate(zoomOut, [0, 1], [-camX, 139]);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 130, top: 130, display: "flex", alignItems: "center", gap: 16, opacity: prog(f, 0, 20) }}>
        <Icon name="history" size={44} color={C.kali} draw={prog(f, 0, 30)} />
        <span style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.text }}>SEJARAH SINGKAT</span>
      </div>

      <div style={{ position: "absolute", left: 0, top: 540, width: 4000, transformOrigin: "0 0", transform: `scale(${camS}) translateX(${camShift}px)` }}>
        {/* base rail */}
        <div style={{ position: "absolute", left: X0, top: 0, width: 6 * SPACING, height: 3, background: `${C.kali}33` }} />
        {/* progress rail */}
        <div style={{ position: "absolute", left: X0, top: -1, width: Math.max(0, lineP - X0), height: 5, background: `linear-gradient(90deg, ${C.kali}, ${C.cyan})`, boxShadow: `0 0 20px ${C.cyan}` }} />
        <div style={{ position: "absolute", left: lineP - 9, top: -8, width: 18, height: 18, borderRadius: 9, background: C.text, boxShadow: `0 0 20px ${C.cyan}` }} />

        {EVENTS.map((e, i) => {
          const s = spr(f, times[i], 13, 140);
          const x = X0 + i * SPACING;
          const up = i % 2 === 0;
          const isKali = i >= 4;
          const col = isKali ? C.kali : C.muted;
          const cardH = 190;
          return (
            <div key={e.key} style={{ opacity: Math.min(1, s) }}>
              <div style={{ position: "absolute", left: x - (e.major ? 22 : 15), top: -(e.major ? 22 : 15), width: e.major ? 44 : 30, height: e.major ? 44 : 30, borderRadius: 30, background: C.bg, border: `4px solid ${isKali ? C.cyan : col}`, transform: `scale(${Math.min(1.3, s)})`, boxShadow: e.major ? `0 0 30px ${isKali ? C.cyan : col}` : undefined }} />
              <div style={{ position: "absolute", left: x - 1, top: up ? -60 : 24, width: 2, height: 36, background: col, transform: `scaleY(${Math.min(1, s)})` }} />
              <div
                style={{
                  position: "absolute",
                  left: x - 210,
                  top: up ? -60 - cardH : 60,
                  width: 420,
                  height: cardH,
                  padding: "22px 26px",
                  borderRadius: 18,
                  background: C.panel,
                  border: `${e.major ? 2 : 1.5}px solid ${isKali ? C.kali : C.dim}`,
                  transform: `translateY(${(1 - Math.min(1, s)) * (up ? 40 : -40)}px)`,
                  boxShadow: e.major ? `0 0 40px ${isKali ? C.kali : C.dim}44` : undefined,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 34, color: isKali ? C.cyan : C.muted, fontWeight: 700 }}>{e.year}</div>
                <div style={{ fontFamily: FONT, fontSize: 46, color: C.text, fontWeight: 700, lineHeight: 1.1 }}>{e.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 6 }}>{e.base}</div>
              </div>
            </div>
          );
        })}
        {/* Auditor merge branch into BackTrack */}
        <svg width={600} height={300} style={{ position: "absolute", left: X0 + SPACING * 1.25, top: 0, overflow: "visible" }}>
          <path d={`M 0 220 C 200 220, ${SPACING * 0.75 - 140} 100, ${SPACING * 0.75} 0`} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="10 8" pathLength={1} strokeDashoffset={1 - prog(f, times[2] - 20, 30)} opacity={0.7} />
          <text x={-20} y={262} fill={C.muted} fontFamily={MONO} fontSize={22} opacity={prog(f, times[2] - 20, 20)}>
            Auditor Security Collection
          </text>
        </svg>
      </div>
      <div style={{ position: "absolute", right: 130, top: 140, fontFamily: MONO, fontSize: 20, color: C.dim, opacity: prog(f, 20, 20) }}>Sumber: kali.org · Kali Linux History</div>
    </AbsoluteFill>
  );
};
