import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Decode, MaskReveal } from "../components/Fx";
import { Icon } from "../components/Icons";
import { KaliTerminal, TermLine } from "../components/KaliTerminal";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, scene, spr } from "../timing";

/** Radar sweep with port "blips". */
const Radar: React.FC<{ start: number; f: number }> = ({ start, f }) => {
  const p = prog(f, start, 40);
  const ang = (f - start) * 4;
  const blips = new Array(14).fill(0).map((_, i) => ({
    a: random(`ra${i}`) * 360,
    r: 60 + random(`rr${i}`) * 170,
  }));
  return (
    <svg width={520} height={520} viewBox="-260 -260 520 520" style={{ overflow: "visible", opacity: p }}>
      <defs>
        <radialGradient id="sweep" cx="0" cy="0" r="1">
          <stop offset="0" stopColor={C.cyan} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
        </radialGradient>
      </defs>
      {[60, 120, 180, 240].map((r) => (
        <circle key={r} r={r * p} fill="none" stroke={C.kali} strokeOpacity={0.35} strokeWidth={1.5} />
      ))}
      <line x1={-250} y1={0} x2={250} y2={0} stroke={C.kali} strokeOpacity={0.25} />
      <line x1={0} y1={-250} x2={0} y2={250} stroke={C.kali} strokeOpacity={0.25} />
      <g transform={`rotate(${ang})`}>
        <path d="M0 0 L240 0 A240 240 0 0 0 207.8 -120 Z" fill={C.cyan} opacity={0.22} />
        <line x1={0} y1={0} x2={240} y2={0} stroke={C.cyan} strokeWidth={3} />
      </g>
      {blips.map((b, i) => {
        const rel = (((ang - b.a) % 360) + 360) % 360;
        const vis = f - start > 20 ? Math.max(0, 1 - rel / 200) : 0;
        const rad = (b.a * Math.PI) / 180;
        return <circle key={i} cx={Math.cos(rad) * b.r} cy={Math.sin(rad) * b.r} r={6} fill={i % 5 === 0 ? C.text : C.cyan} opacity={vis} />;
      })}
      <circle r={6} fill={C.text} />
    </svg>
  );
};

export const S1Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scene("s1");
  const title = beat("s1", "title");
  const slow = beat("s1", "slow");

  const lines: TermLine[] = [
    { at: beat("s1", "type1"), kind: "cmd", text: "whoami", typeDur: 24 },
    { at: beat("s1", "type1") + 30, kind: "out", segs: [{ text: "kali", color: C.text }] },
    { at: beat("s1", "type2"), kind: "cmd", text: "echo \"fase 1: recon → port scanning\"", typeDur: 40 },
    { at: beat("s1", "type2") + 46, kind: "out", segs: [{ text: "fase 1: recon → port scanning", color: C.cyan }] },
  ];

  // terminal slides left & dims when the title takes over
  const shift = prog(f, title - 10, 40, easeInOut);
  const tSpring = spr(f, title, 13, 130);

  // "slow" problem: counter and progress bar crawling
  const crawl = interpolate(f, [slow, sc.dur], [0, 0.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pSlow = prog(f, slow, 24);
  const counter = Math.floor(crawl * 65535);

  return (
    <AbsoluteFill>
      <KaliTerminal
        x={interpolate(shift, [0, 1], [460, 130])}
        y={interpolate(shift, [0, 1], [300, 200])}
        w={1000}
        h={340}
        lines={lines}
        start={beat("s1", "term")}
        tilt={interpolate(shift, [0, 1], [0, 8])}
        fontSize={28}
      />

      {/* radar on the right */}
      <div style={{ position: "absolute", left: 1290, top: 160 }}>
        <Radar start={beat("s1", "radar")} f={f} />
      </div>

      {/* kinetic title */}
      <div style={{ position: "absolute", left: 130, top: 610, opacity: f >= title ? 1 : 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.cyan, marginBottom: 10 }}>
          <Decode text="KALI LINUX · RECONNAISSANCE" start={title + 4} dur={30} seed="s1k" />
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 120,
            color: C.text,
            lineHeight: 1,
            letterSpacing: interpolate(tSpring, [0, 1], [40, -2]),
            filter: `blur(${(1 - Math.min(1, tSpring)) * 14}px)`,
            transform: `translateX(${(1 - tSpring) * -60}px)`,
          }}
        >
          PORT <span style={{ color: C.kali, textShadow: `0 0 40px ${C.kali}aa` }}>SCANNING</span>
        </div>
      </div>

      {/* the problem: 65,535 ports, crawling */}
      <div style={{ position: "absolute", left: 1290, top: 700, width: 520, opacity: pSlow, transform: `translateY(${(1 - pSlow) * 30}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, letterSpacing: 3 }}>PORT DIPINDAI</div>
        <div style={{ fontFamily: MONO, fontSize: 60, color: C.text, fontWeight: 700 }}>
          {counter.toLocaleString("id-ID")}
          <span style={{ color: C.dim }}> / 65.535</span>
        </div>
        <div style={{ height: 10, background: `${C.kali}33`, borderRadius: 5, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${crawl * 100}%`, height: "100%", background: C.kali }} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.orange, marginTop: 12, display: "flex", alignItems: "center", gap: 10, opacity: Math.floor(f / 20) % 2 ? 1 : 0.55 }}>
          <Icon name="clock" size={26} color={C.orange} /> estimasi: lama...
        </div>
      </div>
      <div style={{ position: "absolute", left: 130, top: 780, width: 1000 }}>
        <MaskReveal text="Memindai 65.535 port bisa memakan waktu lama." start={slow + 8} size={44} weight={500} color={C.muted} highlight={["65.535"]} hlColor={C.text} stagger={3} />
      </div>
    </AbsoluteFill>
  );
};
