import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const COLS = 12;
const ROWS = 7;
const GX = 760;
const GY = 300;
const CELL = 38;
const GAP = 8;
const cellPos = (i: number) => ({ x: GX + (i % COLS) * (CELL + GAP), y: GY + Math.floor(i / COLS) * (CELL + GAP) });

const Node: React.FC<{ x: number; y: number; icon: IconName; title: string; sub: string; p: number; accent?: string; pulse?: number }> = ({ x, y, icon, title, sub, p, accent = C.kali, pulse = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 300,
      height: 230,
      borderRadius: 22,
      background: C.panel,
      border: `2px solid ${accent}`,
      boxShadow: `0 0 ${30 + pulse * 50}px ${accent}${pulse > 0 ? "88" : "44"}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      opacity: p,
      transform: `scale(${0.85 + 0.15 * p})`,
    }}
  >
    <Icon name={icon} size={72} color={accent} draw={p} />
    <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.text }}>{title}</div>
    <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>{sub}</div>
  </div>
);

const Step: React.FC<{ n: number; label: string; active: number; x: number }> = ({ n, label, active, x }) => (
  <div style={{ position: "absolute", left: x, top: 150, display: "flex", alignItems: "center", gap: 14, opacity: 0.35 + 0.65 * active }}>
    <div style={{ width: 52, height: 52, borderRadius: 26, border: `2px solid ${active > 0.5 ? C.cyan : C.dim}`, background: active > 0.5 ? `${C.cyan}22` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 26, color: C.text }}>{n}</div>
    <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 2, color: active > 0.5 ? C.text : C.muted }}>{label}</div>
  </div>
);

export const S4How: React.FC = () => {
  const f = useCurrentFrame();
  const pin = prog(f, beat("s4", "diagram"), 30);
  const pk = beat("s4", "packets");
  const opens = [beat("s4", "open0"), beat("s4", "open1"), beat("s4", "open2")];
  const OPEN_CELLS = [17, 46, 70];
  const pipe = beat("s4", "pipe");
  const nmap = beat("s4", "nmap");
  const result = beat("s4", "result");
  const nmapP = prog(f, nmap, 30);
  const resP = spr(f, result, 14, 110);
  const camZoom = interpolate(f, [pipe - 20, pipe + 40], [1, 0.97], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });

  const src = { x: 470, y: 465 };
  const total = COLS * ROWS;

  return (
    <AbsoluteFill style={{ transform: `scale(${camZoom})` }}>
      <Step n={1} label="SCAN PARALEL" active={prog(f, pk, 20)} x={200} />
      <Step n={2} label="PIPE PORT TERBUKA" active={prog(f, pipe, 20)} x={720} />
      <Step n={3} label="ANALISIS NMAP" active={prog(f, nmap, 20)} x={1320} />

      <Node x={170} y={350} icon="laptop" title="RustScan" sub="Kali Linux" p={pin} pulse={f > pk && f < pipe ? 0.5 + 0.5 * Math.sin(f / 5) : 0} />

      {/* connection fan + packets */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {new Array(total).fill(0).map((_, i) => {
          const c = cellPos(i);
          const tx = c.x + CELL / 2;
          const ty = c.y + CELL / 2;
          const delay = pk + Math.floor(random(`d${i}`) * 110);
          const t = (f - delay) / 22;
          const lineOp = f > delay ? Math.max(0, 0.22 - (f - delay) / 200) : 0;
          return (
            <g key={i}>
              <line x1={src.x} y1={src.y} x2={tx} y2={ty} stroke={C.kali} strokeOpacity={lineOp} strokeWidth={1} />
              {t > 0 && t < 1 ? <circle cx={src.x + (tx - src.x) * t} cy={src.y + (ty - src.y) * t} r={4} fill={C.cyan} /> : null}
            </g>
          );
        })}
        {/* pipe: open ports → nmap */}
        {OPEN_CELLS.map((ci, k) => {
          const c = cellPos(ci);
          const sx = c.x + CELL;
          const sy = c.y + CELL / 2;
          const ex = 1420;
          const ey = 465;
          const pp = prog(f, pipe + k * 6, 40);
          const d = `M${sx} ${sy} C ${sx + 160} ${sy}, ${ex - 160} ${ey}, ${ex} ${ey}`;
          const dot = (f - pipe - k * 6) / 40;
          return (
            <g key={ci}>
              <path d={d} fill="none" stroke={C.cyan} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pp} opacity={0.8} />
              {dot > 0 && dot < 1 ? (() => {
                const t = dot, u = 1 - t;
                const px = u * u * u * sx + 3 * u * u * t * (sx + 160) + 3 * u * t * t * (ex - 160) + t * t * t * ex;
                const py = u * u * u * sy + 3 * u * u * t * sy + 3 * u * t * t * ey + t * t * t * ey;
                return <circle cx={px} cy={py} r={7} fill={C.text} />;
              })() : null}
            </g>
          );
        })}
      </svg>

      {/* port grid */}
      {new Array(total).fill(0).map((_, i) => {
        const c = cellPos(i);
        const delay = pk + Math.floor(random(`d${i}`) * 110) + 22;
        const hit = f >= delay;
        const k = OPEN_CELLS.indexOf(i);
        const isOpen = k >= 0 && f >= opens[k];
        const op = isOpen ? spr(f, opens[k], 10, 160) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: CELL,
              height: CELL,
              borderRadius: 7,
              border: `1.5px solid ${isOpen ? C.cyan : hit ? "#2a3a55" : "#1a2638"}`,
              background: isOpen ? C.cyan : hit ? "#111c2e" : "transparent",
              boxShadow: isOpen ? `0 0 ${24 * op}px ${C.cyan}` : undefined,
              transform: `scale(${isOpen ? 1 + 0.25 * (1 - Math.min(op, 1)) + 0.08 : 1})`,
              opacity: pin,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: GX, top: GY + ROWS * (CELL + GAP) + 10, width: COLS * (CELL + GAP), display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: C.muted, opacity: pin }}>
        <span>port 1</span>
        <span style={{ color: C.cyan }}>■ open</span>
        <span>65.535</span>
      </div>
      <div style={{ position: "absolute", left: 170, top: 610, width: 300, fontFamily: MONO, fontSize: 20, color: C.muted, textAlign: "center", opacity: prog(f, pk + 10, 20) }}>
        ribuan koneksi TCP
        <br />
        sekaligus (async · Tokio)
      </div>

      <Node x={1420} y={350} icon="target" title="Nmap" sub="nmap -sV ..." p={nmapP} accent={C.cyan} pulse={f > nmap && f < result ? 0.6 : 0} />

      {/* result card */}
      <div
        style={{
          position: "absolute",
          left: 1380,
          top: 620,
          width: 380,
          padding: "18px 24px",
          borderRadius: 16,
          background: C.panel,
          border: `1.5px solid ${C.green}88`,
          fontFamily: MONO,
          fontSize: 22,
          color: C.text,
          opacity: Math.min(resP, 1),
          transform: `translateY(${(1 - resP) * 40}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.green, marginBottom: 8 }}>
          <Icon name="check" size={26} color={C.green} /> layanan terdeteksi
        </div>
        <div style={{ color: C.muted }}>PORT · SERVICE · VERSION</div>
      </div>
    </AbsoluteFill>
  );
};
