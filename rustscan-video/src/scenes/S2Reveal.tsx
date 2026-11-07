import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Decode } from "../components/Fx";
import { GithubMark, Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, prog, spr } from "../timing";

const Card: React.FC<{ start: number; icon: IconName | "gh"; label: string; value: string; y: number }> = ({ start, icon, label, value, y }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 28);
  return (
    <div
      style={{
        position: "absolute",
        left: 1120,
        top: y,
        width: 640,
        height: 132,
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "0 30px",
        borderRadius: 18,
        background: C.panel,
        border: `1.5px solid ${C.kali}55`,
        opacity: p,
        transform: `translateX(${(1 - p) * 120}px)`,
        clipPath: `inset(0 0 0 ${(1 - p) * 100}% round 18px)`,
        boxShadow: `inset 4px 0 0 ${C.cyan}`,
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 16, background: `${C.kali}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon === "gh" ? <GithubMark size={40} color={C.text} /> : <Icon name={icon} size={42} color={C.cyan} draw={prog(f, start + 6, 30)} />}
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, letterSpacing: 3 }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 44, color: C.text, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
};

export const S2Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const logo = beat("s2", "logo");
  const name = beat("s2", "name");
  const ringP = prog(f, beat("s2", "ring"), 50);
  const ls = spr(f, logo, 11, 120);
  // scan-line mask that reveals the logo from top to bottom
  const reveal = prog(f, logo, 34);
  // whole lockup slides left when info cards arrive
  const slide = prog(f, beat("s2", "card0") - 10, 40);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: interpolate(slide, [0, 1], [960, 560]), top: 420 }}>
        {/* rings */}
        <svg width={620} height={620} viewBox="-310 -310 620 620" style={{ position: "absolute", left: -310, top: -310, overflow: "visible" }}>
          <circle r={280} fill="none" stroke={C.kali} strokeOpacity={0.3} strokeWidth={1.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ringP} />
          <g transform={`rotate(${f * 0.8})`}>
            <circle r={250} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="90 40 10 40" opacity={ringP * 0.7} />
          </g>
          <g transform={`rotate(${-f * 1.4})`}>
            <circle r={215} fill="none" stroke={C.kali} strokeWidth={2} strokeDasharray="3 12" opacity={ringP} />
          </g>
          <circle r={180} fill={`${C.kali}14`} opacity={ringP} />
        </svg>
        {/* the official RustScan shield (from the repository's pictures/rustscan.png) */}
        <div
          style={{
            position: "absolute",
            left: -140,
            top: -160,
            width: 280,
            height: 320,
            transform: `scale(${interpolate(ls, [0, 1], [0.6, 1])})`,
            clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`,
            filter: `drop-shadow(0 0 40px ${C.cyan}88)`,
            opacity: f >= logo ? 1 : 0,
          }}
        >
          <Img src={staticFile("img/rustscan_shield.png")} style={{ width: 280, height: 320 }} />
        </div>
        {/* scan line */}
        {reveal > 0 && reveal < 1 && (
          <div style={{ position: "absolute", left: -200, width: 400, top: -160 + reveal * 320, height: 3, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}` }} />
        )}
        {/* name */}
        <div style={{ position: "absolute", left: -500, width: 1000, top: 210, textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: 120, fontWeight: 700, color: C.text, letterSpacing: 6, lineHeight: 1 }}>
            <Decode text="RUSTSCAN" start={name} dur={42} seed="rs" />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 28, color: C.cyan, letterSpacing: 10, marginTop: 16, opacity: prog(f, beat("s2", "tag"), 20) }}>
            THE MODERN PORT SCANNER
          </div>
        </div>
      </div>

      <Card start={beat("s2", "card0")} icon="cpu" label="DIBANGUN DENGAN" value="Rust · Tokio async" y={220} />
      <Card start={beat("s2", "card1")} icon="gh" label="DEVELOPER" value="bee-san (Autumn)" y={380} />
      <Card start={beat("s2", "card2")} icon="users" label="KOMUNITAS" value="Open source · GPL-3.0" y={540} />
      <div style={{ position: "absolute", left: 1120, top: 700, width: 640, fontFamily: MONO, fontSize: 22, color: C.muted, opacity: prog(f, beat("s2", "card2") + 20, 20) }}>
        Sumber: README & Cargo.toml repo resmi
      </div>
    </AbsoluteFill>
  );
};
