import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Decode, MaskReveal } from "../components/Fx";
import { KaliTerminal, TermLine } from "../components/KaliTerminal";
import { C, FONT, H, MONO, W } from "../theme";
import { beat, easeInOut, prog, scene, spr } from "../timing";

/* Falling columns of code fragments */
const SNIPS = ["0x7f", "SYN", "ACK", "443/tcp", "sudo", "apt", "ssh", "TLS", "22/tcp", "0xff", "grep", "eth0", "AES", "SHA256", "DNS", "ping", "chmod", "root", "nmap", "hash"];
const CodeRain: React.FC<{ f: number; op: number }> = ({ f, op }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: op }}>
    {new Array(34).fill(0).map((_, c) => {
      const x = 30 + c * 57;
      const sp = 1.2 + random(`cs${c}`) * 2.6;
      const off = random(`co${c}`) * H;
      return new Array(9).fill(0).map((__, r) => {
        const y = ((off + f * sp + r * 120) % (H + 200)) - 100;
        const s = SNIPS[Math.floor(random(`cw${c}-${r}`) * SNIPS.length)];
        return (
          <text key={`${c}-${r}`} x={x} y={y} fill={r === 8 ? C.text : C.kali} opacity={0.12 + (r / 9) * 0.35} fontFamily={MONO} fontSize={16}>
            {s}
          </text>
        );
      });
    })}
  </svg>
);

/* Network graph: nodes connect progressively, packets travel */
const NODES = new Array(16).fill(0).map((_, i) => ({ x: 1150 + random(`nx${i}`) * 640, y: 150 + random(`ny${i}`) * 560 }));
const EDGES: [number, number][] = [];
NODES.forEach((a, i) => {
  NODES.forEach((b, j) => {
    if (j > i && Math.hypot(a.x - b.x, a.y - b.y) < 230) EDGES.push([i, j]);
  });
});
const Network: React.FC<{ f: number; start: number; op: number }> = ({ f, start, op }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: op }}>
    {EDGES.map(([a, b], k) => {
      const p = prog(f, start + k * 2, 30);
      const A = NODES[a];
      const B = NODES[b];
      const t = ((f - start - k * 7) / 50) % 1;
      return (
        <g key={k}>
          <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p} stroke={C.kali} strokeOpacity={0.45} strokeWidth={1.5} />
          {p >= 1 && t > 0 ? <circle cx={A.x + (B.x - A.x) * t} cy={A.y + (B.y - A.y) * t} r={3.5} fill={C.cyan} /> : null}
        </g>
      );
    })}
    {NODES.map((n, i) => {
      const s = spr(f, start + i * 3, 12, 160);
      return (
        <g key={i} transform={`translate(${n.x} ${n.y}) scale(${Math.min(s, 1.2)})`}>
          <circle r={14} fill={C.navy} stroke={i % 5 === 0 ? C.cyan : C.kali} strokeWidth={2} />
          <circle r={4} fill={i % 5 === 0 ? C.cyan : C.kali} />
          <circle r={14 + ((f + i * 9) % 60) / 2} fill="none" stroke={C.cyan} strokeOpacity={Math.max(0, 0.5 - ((f + i * 9) % 60) / 60)} />
        </g>
      );
    })}
  </svg>
);

export const S1Opening: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scene("s1");
  const q = beat("s1", "question");
  const title = beat("s1", "title");
  const dimBg = prog(f, q - 10, 30, easeInOut);
  const toTitle = prog(f, title - 14, 26, easeInOut);
  const ts = spr(f, title, 12, 130);

  const lines: TermLine[] = [
    { at: beat("s1", "type"), kind: "cmd", text: "uname -o", typeDur: 20 },
    { at: beat("s1", "type") + 26, kind: "out", segs: [{ text: "GNU/Linux", color: C.text }] },
    { at: beat("s1", "type") + 40, kind: "cmd", text: "./mulai --topik keamanan-siber", typeDur: 30 },
  ];

  return (
    <AbsoluteFill>
      <CodeRain f={f} op={0.9 - dimBg * 0.55} />
      <Network f={f} start={beat("s1", "net")} op={1 - dimBg * 0.7} />
      <div style={{ opacity: 1 - dimBg, transform: `translateY(${-dimBg * 30}px)` }}>
        <KaliTerminal x={130} y={250} w={860} h={300} lines={lines} start={0} fontSize={28} tilt={6} title="terminal" />
      </div>

      {/* opening question */}
      <div style={{ position: "absolute", left: 160, right: 160, top: 300, opacity: 1 - toTitle, transform: `scale(${1 - 0.06 * toTitle})`, filter: `blur(${toTitle * 10}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.cyan, textAlign: "center", marginBottom: 30, opacity: prog(f, q, 20) }}>
          <Decode text="PERTANYAAN PEMBUKA" start={q} dur={26} seed="q1" />
        </div>
        <MaskReveal
          text="Pernah mendengar sistem operasi yang sering digunakan oleh para ahli keamanan siber?"
          start={q + 4}
          size={76}
          align="center"
          stagger={3}
          highlight={["ahli", "keamanan", "siber"]}
          hlColor={C.kali}
        />
      </div>

      {/* title */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: f >= title ? Math.min(1, ts) : 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: C.muted, marginBottom: 18 }}>
          <Decode text="SERI EDUKASI CYBERSECURITY" start={title + 6} dur={30} seed="t1" />
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 150,
            lineHeight: 1,
            color: C.text,
            letterSpacing: interpolate(Math.min(ts, 1), [0, 1], [50, -2]),
            transform: `scale(${interpolate(Math.min(ts, 1), [0, 1], [1.4, 1])})`,
            filter: `blur(${(1 - Math.min(ts, 1)) * 18}px)`,
          }}
        >
          Mengenal <span style={{ color: C.kali, textShadow: `0 0 50px ${C.kali}` }}>Kali Linux</span>
        </div>
        <div style={{ margin: "34px auto 0", width: 900, height: 3, background: `linear-gradient(90deg, transparent, ${C.kali}, ${C.cyan}, transparent)`, transform: `scaleX(${prog(f, title + 10, 40)})` }} />
        {/* RGB split ghost during glitch */}
        {f >= title && f < title + 14 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 48, fontFamily: FONT, fontWeight: 700, fontSize: 150, color: C.cyan, opacity: 0.4, transform: `translateX(${Math.sin(f * 7) * 18}px)`, mixBlendMode: "screen" }}>
            Mengenal Kali Linux
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 210, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.muted, opacity: prog(f, title + 30, 20) * (1 - prog(f, sc.dur - 20, 20)) }}>
        APA ITU · SEJARAH · FUNGSI · TOOLS · PENGGUNA
      </div>
    </AbsoluteFill>
  );
};
