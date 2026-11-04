import React from "react";
import { C } from "../lib/theme";

/**
 * Custom technical illustrations. Every part is its own SVG element with
 * pathLength=1 so it can be drawn on (`d` 0..1, staggered per part) and some
 * parts stay alive with frame `f` (LEDs, fans, fill levels).
 */
type P = { d?: number; f?: number; size?: number; color?: string; accent?: string; fillA?: number };

const part = (d: number, i: number, n: number) => {
  const q = Math.max(0, Math.min(1, d * (n * 0.5 + 1) - i * 0.5));
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - q } as const;
};
const fillIn = (d: number, i: number, n: number) => Math.max(0, Math.min(1, (d * (n * 0.5 + 1) - i * 0.5 - 0.6) * 2.5));

export const ServerIllo: React.FC<P & { units?: number; load?: number }> = ({ d = 1, f = 0, size = 220, color = "#fff", accent = C.orange, units = 3, load = 0.5 }) => {
  const n = units * 3 + 1;
  const uh = 46;
  return (
    <svg width={size} height={size * ((units * (uh + 10) + 20) / 220)} viewBox={`0 0 220 ${units * (uh + 10) + 20}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      {Array.from({ length: units }).map((_, i) => {
        const y = 10 + i * (uh + 10);
        const on = Math.sin(f * 0.12 + i * 2.1) > 0.2 - load;
        return (
          <g key={i}>
            <rect x={10} y={y} width={200} height={uh} rx={10} {...part(d, i * 3, n)} fill={color} fillOpacity={0.04 * fillIn(d, i * 3, n)} />
            <path d={`M 120 ${y + uh / 2 - 8} h 70 M 120 ${y + uh / 2} h 70 M 120 ${y + uh / 2 + 8} h 70`} strokeWidth={2} strokeOpacity={0.5} {...part(d, i * 3 + 1, n)} />
            <circle cx={34} cy={y + uh / 2} r={6} stroke="none" fill={on ? accent : color} fillOpacity={fillIn(d, i * 3 + 2, n) * (on ? 1 : 0.25)} />
            <circle cx={54} cy={y + uh / 2} r={6} stroke="none" fill={C.ok} fillOpacity={fillIn(d, i * 3 + 2, n) * 0.85} />
          </g>
        );
      })}
    </svg>
  );
};

/** Container box with opening lid (`open` 0..1). */
export const ContainerIllo: React.FC<P & { open?: number }> = ({ d = 1, size = 220, color = "#fff", accent = C.orange, open = 0 }) => {
  const lid = -open * 38;
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" style={{ overflow: "visible" }}>
      {/* back edges */}
      <path d="M110 70 L190 105 L190 175 L110 210 L30 175 L30 105 Z" {...part(d, 0, 5)} fill={color} fillOpacity={0.03 * fillIn(d, 0, 5)} />
      <path d="M110 140 L110 210 M30 105 L110 140 L190 105" {...part(d, 1, 5)} />
      {/* ribs */}
      <path d="M55 127 V 187 M80 138 V 198 M140 138 V 198 M165 127 V 187" strokeOpacity={0.45} strokeWidth={2} {...part(d, 2, 5)} />
      {/* lid */}
      <g transform={`translate(0 ${lid}) rotate(${-open * 8} 30 105)`}>
        <path d="M110 70 L190 105 L110 140 L30 105 Z" stroke={accent} {...part(d, 3, 5)} fill={accent} fillOpacity={0.12 * fillIn(d, 3, 5)} />
      </g>
    </svg>
  );
};

export const ChipIllo: React.FC<P & { heat?: number }> = ({ d = 1, f = 0, size = 200, color = "#fff", accent = C.orange, heat = 0.3 }) => {
  const pins: string[] = [];
  for (let i = 0; i < 5; i++) {
    const o = 62 + i * 19;
    pins.push(`M${o} 30 V 50`, `M${o} 150 V 170`, `M30 ${o} H 50`, `M150 ${o} H 170`);
  }
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.2);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <rect x={50} y={50} width={100} height={100} rx={14} {...part(d, 0, 4)} />
      <path d={pins.join(" ")} {...part(d, 1, 4)} strokeOpacity={0.7} />
      <rect x={72} y={72} width={56} height={56} rx={8} {...part(d, 2, 4)} stroke={accent} fill={accent} fillOpacity={fillIn(d, 2, 4) * (0.15 + heat * 0.6 * pulse)} />
      <path d="M88 100 h 24 M100 88 v 24" stroke={accent} {...part(d, 3, 4)} />
    </svg>
  );
};

export const RamIllo: React.FC<P & { fill?: number }> = ({ d = 1, size = 300, color = "#fff", accent = C.orange, fill = 0.5 }) => {
  const cells = 8;
  return (
    <svg width={size} height={size * 0.42} viewBox="0 0 300 126" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <path d="M10 20 H 290 V 92 H 160 V 100 H 140 V 92 H 10 Z" {...part(d, 0, 3)} />
      <path d={Array.from({ length: 14 }).map((_, i) => `M${24 + i * 19} 100 V 114`).join(" ")} strokeOpacity={0.6} {...part(d, 1, 3)} />
      {Array.from({ length: cells }).map((_, i) => {
        const on = i / cells < fill;
        return <rect key={i} x={24 + i * 33} y={34} width={24} height={44} rx={4} stroke={on ? accent : color} strokeOpacity={on ? 1 : 0.35}
          fill={accent} fillOpacity={on ? 0.35 * fillIn(d, 2, 3) : 0} {...part(d, 2, 3)} />;
      })}
    </svg>
  );
};

export const FolderIllo: React.FC<P & { open?: number }> = ({ d = 1, size = 200, color = "#fff", accent = C.orange, open = 0 }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 200 160" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" style={{ overflow: "visible" }}>
    <path d="M20 40 Q20 28 32 28 H 78 L 92 44 H 168 Q180 44 180 56 V 132 Q180 144 168 144 H 32 Q20 144 20 132 Z" {...part(d, 0, 3)} />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={46 + i * 10} y={56 - open * (34 + i * 14)} width={96} height={70} rx={6} stroke={i === 2 ? accent : color}
        fill={i === 2 ? accent : color} fillOpacity={0.06 * fillIn(d, 1, 3)} strokeOpacity={0.7 * Math.min(1, d * 3)} {...part(d, 1, 3)} />
    ))}
    <path d={`M20 ${70 + open * 6} L 180 ${70 + open * 6} L 168 144 H 32 Z`} {...part(d, 2, 3)} fill={color} fillOpacity={0.05 * fillIn(d, 2, 3)} />
  </svg>
);

export const TerminalIllo: React.FC<P> = ({ d = 1, f = 0, size = 220, color = "#fff", accent = C.orange }) => (
  <svg width={size} height={size * 0.72} viewBox="0 0 220 158" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x={8} y={8} width={204} height={142} rx={14} {...part(d, 0, 3)} />
    <path d="M34 54 L 58 76 L 34 98" stroke={accent} {...part(d, 1, 3)} />
    <path d="M72 100 H 120" {...part(d, 2, 3)} strokeOpacity={Math.floor(f / 30) % 2 ? 1 : 0.2} />
  </svg>
);

/** Network: nodes connected; `act` lights links progressively. */
export const NetworkIllo: React.FC<P & { act?: number }> = ({ d = 1, f = 0, size = 240, color = "#fff", accent = C.orange, act = 1 }) => {
  const nodes = [[120, 40], [40, 130], [200, 130], [120, 210]];
  const links = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2]];
  return (
    <svg width={size} height={size} viewBox="0 0 240 250" fill="none" stroke={color} strokeWidth={2.5}>
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} strokeOpacity={0.55} {...part(d, i * 0.4, 4)}
          stroke={(Math.floor(f / 20) + i) % 5 === 0 && act > 0.5 ? accent : color} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={16} fill={C.black} {...part(d, 2 + i * 0.3, 4)} stroke={i === 0 ? accent : color} />
      ))}
    </svg>
  );
};

/** Egg = environment recipe. Outline draws, recipe lines inside appear. */
export const EggIllo: React.FC<P & { lines?: number }> = ({ d = 1, size = 200, color = C.ink, accent = C.orange, lines = 1 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 200 240" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
    <path d="M100 12 C 160 12 186 110 186 150 C 186 200 148 228 100 228 C 52 228 14 200 14 150 C 14 110 40 12 100 12 Z" {...part(d, 0, 2)} fill={accent} fillOpacity={0.06 * fillIn(d, 0, 2)} />
    {[0, 1, 2].map((i) => (
      <g key={i} opacity={Math.max(0, Math.min(1, lines * 3 - i))}>
        <circle cx={64} cy={112 + i * 34} r={5} fill={accent} stroke="none" />
        <path d={`M80 ${112 + i * 34} H ${150 - i * 12}`} strokeOpacity={0.6} />
      </g>
    ))}
  </svg>
);
