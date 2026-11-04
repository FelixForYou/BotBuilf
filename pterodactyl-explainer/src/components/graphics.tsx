import React from 'react';
import {useCurrentFrame} from 'remotion';
import {siTelegram, siWhatsapp, siNodedotjs, siPython} from 'simple-icons';
import logo from '../data/pterodactyl-logo.json';
import {C, FONT, MONO} from '../lib/theme';
import {E, clamp01, ip, p, rnd} from '../lib/anim';

/* ------------------------------------------------------------------ */
/* Ikon: satu keluarga (Lucide, stroke 1.75) + animasi gambar garis     */
/* ------------------------------------------------------------------ */

type LucideIcon = React.ComponentType<any>;

/**
 * Ikon Lucide dengan animasi "draw": draw 0..1 menggambar stroke.
 * Semua ikon antarmuka memakai komponen ini agar ketebalan seragam.
 */
export const Icon: React.FC<{i: LucideIcon; size?: number; color?: string; draw?: number; style?: React.CSSProperties; sw?: number}> = ({
  i: I, size = 32, color = 'currentColor', draw = 1, style, sw = 1.75,
}) => {
  const off = 64 * (1 - clamp01(draw));
  return (
    <span style={{display: 'inline-flex', ['--off' as string]: off, ...style}} className="draw-ic">
      <I size={size} color={color} strokeWidth={sw} />
    </span>
  );
};

/** CSS global untuk animasi stroke ikon (dipasang sekali di Root). */
export const IconCss: React.FC = () => (
  <style>{`
  .draw-ic svg path, .draw-ic svg line, .draw-ic svg circle, .draw-ic svg rect, .draw-ic svg polyline, .draw-ic svg polygon, .draw-ic svg ellipse {
    stroke-dasharray: 64; stroke-dashoffset: calc(var(--off) * 1px);
  }`}</style>
);

/* ------------------------------------------------------------------ */
/* Logo resmi (bentuk & proporsi asli)                                 */
/* ------------------------------------------------------------------ */

const [vx, vy, vw, vh] = logo.viewBox.split(' ').map(Number);

/** Logo Pterodactyl resmi (dari repo pterodactyl/panel, .github/assets). */
export const PteroLogo: React.FC<{h?: number; wordColor?: string; reveal?: number; markColor?: string}> = ({
  h = 80, wordColor = C.ink, reveal = 1, markColor = '#3d7bfd',
}) => {
  const w = (h * vw) / vh;
  return (
    <svg width={w} height={h} viewBox={logo.viewBox} style={{overflow: 'visible'}}>
      <defs>
        <clipPath id={`ptero-rev-${Math.round(h)}`}>
          <rect x={vx} y={vy - 20} width={vw * clamp01(reveal) + 1} height={vh + 40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#ptero-rev-${Math.round(h)})`}>
        <path d={logo.mark} fill={markColor} />
        {logo.word.map((d, i) => (
          <path key={i} d={d} fill={wordColor} />
        ))}
      </g>
    </svg>
  );
};

/** Hanya simbol (burung) Pterodactyl. */
export const PteroMark: React.FC<{size?: number; color?: string; draw?: number}> = ({size = 120, color = '#3d7bfd', draw = 1}) => {
  // bounding box simbol di dalam viewBox logo
  const box = `${vx + 2} ${vy + 2} 126 120`;
  const d = clamp01(draw);
  return (
    <svg width={size} height={(size * 120) / 126} viewBox={box}>
      <path d={logo.mark} fill={color} fillOpacity={ip(d, [0.5, 1], [0, 1])} stroke={color} strokeWidth={1.6}
        strokeDasharray={900} strokeDashoffset={900 * (1 - ip(d, [0, 0.7], [0, 1]))} />
    </svg>
  );
};

const Brand: React.FC<{path: string; color: string; size: number; reveal?: number; mono?: string}> = ({path, color, size, reveal = 1, mono}) => {
  const r = clamp01(reveal);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{overflow: 'visible'}}>
      <g style={{transformOrigin: '12px 12px', transform: `scale(${0.6 + 0.4 * E.back(r)})`}} opacity={ip(r, [0, 0.4], [0, 1])}>
        <path d={path} fill={mono ?? color} />
      </g>
    </svg>
  );
};

export const TelegramLogo: React.FC<{size?: number; reveal?: number; mono?: string}> = ({size = 64, reveal, mono}) => (
  <Brand path={siTelegram.path} color={'#' + siTelegram.hex} size={size} reveal={reveal} mono={mono} />
);
export const WhatsAppLogo: React.FC<{size?: number; reveal?: number; mono?: string}> = ({size = 64, reveal, mono}) => (
  <Brand path={siWhatsapp.path} color={'#' + siWhatsapp.hex} size={size} reveal={reveal} mono={mono} />
);
export const NodeLogo: React.FC<{size?: number; reveal?: number; mono?: string}> = ({size = 64, reveal, mono}) => (
  <Brand path={siNodedotjs.path} color={'#' + siNodedotjs.hex} size={size} reveal={reveal} mono={mono} />
);
export const PythonLogo: React.FC<{size?: number; reveal?: number; mono?: string}> = ({size = 64, reveal, mono}) => (
  <Brand path={siPython.path} color={'#' + siPython.hex} size={size} reveal={reveal} mono={mono} />
);

/* ------------------------------------------------------------------ */
/* Ilustrasi teknis khusus (SVG, dianimasikan per bagian)               */
/* ------------------------------------------------------------------ */

const STROKE = 2.2;

/** Rak server/VPS: unit-unit, LED, ventilasi. draw=garis, active=aktivitas LED. */
export const ServerRack: React.FC<{w?: number; units?: number; draw?: number; active?: number; color?: string; fill?: string; seed?: number}> = ({
  w = 360, units = 3, draw = 1, active = 1, color = C.ink, fill = '#fff', seed = 0,
}) => {
  const f = useCurrentFrame();
  const uh = 78;
  const h = units * uh + (units - 1) * 14;
  const per = 1400;
  return (
    <svg width={w} height={h + 8} viewBox={`-4 -4 ${w + 8} ${h + 8}`} style={{overflow: 'visible'}}>
      {Array.from({length: units}).map((_, u) => {
        const y = u * (uh + 14);
        const dr = clamp01(draw * units - u * 0.6);
        return (
          <g key={u}>
            <rect x={0} y={y} width={w} height={uh} rx={14} fill={fill} fillOpacity={ip(dr, [0.6, 1], [0, 1])}
              stroke={color} strokeWidth={STROKE} strokeDasharray={per} strokeDashoffset={per * (1 - dr)} />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <line key={k} x1={w * 0.42 + k * 18} y1={y + 24} x2={w * 0.42 + k * 18} y2={y + uh - 24} stroke={color}
                strokeOpacity={0.35 * dr} strokeWidth={STROKE} strokeLinecap="round" />
            ))}
            {[0, 1, 2].map((k) => {
              const on = active > 0 && Math.sin(f * (0.09 + k * 0.05) + u * 2 + seed + k) > -0.2;
              const col = k === 0 ? C.ok : k === 1 ? C.coral : C.ptero;
              return (
                <circle key={k} cx={28 + k * 26} cy={y + uh / 2} r={6} fill={on ? col : 'transparent'}
                  stroke={col} strokeWidth={1.6} opacity={dr * (on ? 1 : 0.5) * Math.max(0.3, active)} />
              );
            })}
            <rect x={w - 86} y={y + uh / 2 - 6} width={56} height={12} rx={6} fill={color} fillOpacity={0.12 * dr} />
          </g>
        );
      })}
    </svg>
  );
};

/** Container isometrik dengan tutup yang bisa membuka. */
export const ContainerBox: React.FC<{size?: number; draw?: number; open?: number; color?: string; fill?: string; glow?: string; label?: string}> = ({
  size = 300, draw = 1, open = 0, color = C.ink, fill = 'rgba(255,255,255,0.0)', glow, label,
}) => {
  const s = size;
  const cx = s / 2;
  const top = s * 0.28;
  const hw = s * 0.42;
  const hh = s * 0.21;
  const depth = s * 0.42;
  const per = 3000;
  const d = clamp01(draw);
  const lid = clamp01(open);
  const P = (pts: [number, number][]) => pts.map((q) => q.join(',')).join(' ');
  const A: [number, number] = [cx, top - hh];
  const B: [number, number] = [cx + hw, top];
  const Cc: [number, number] = [cx, top + hh];
  const D: [number, number] = [cx - hw, top];
  const down = (q: [number, number]): [number, number] => [q[0], q[1] + depth];
  return (
    <svg width={s} height={s * 1.05} viewBox={`0 0 ${s} ${s * 1.05}`} style={{overflow: 'visible'}}>
      {glow && <ellipse cx={cx} cy={top + depth * 0.6} rx={hw * 1.1} ry={depth * 0.7} fill={glow} opacity={0.18 * d} />}
      <polygon points={P([D, Cc, down(Cc), down(D)])} fill={fill} stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
        strokeDasharray={per} strokeDashoffset={per * (1 - d)} />
      <polygon points={P([Cc, B, down(B), down(Cc)])} fill={fill} stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
        strokeDasharray={per} strokeDashoffset={per * (1 - d)} />
      {/* rusuk vertikal ala kontainer */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <g key={i} opacity={ip(d, [0.5, 1], [0, 0.5])}>
          <line x1={D[0] + (Cc[0] - D[0]) * t} y1={D[1] + (Cc[1] - D[1]) * t + 12} x2={D[0] + (Cc[0] - D[0]) * t}
            y2={D[1] + (Cc[1] - D[1]) * t + depth - 12} stroke={color} strokeWidth={1.4} />
          <line x1={Cc[0] + (B[0] - Cc[0]) * t} y1={Cc[1] + (B[1] - Cc[1]) * t + 12} x2={Cc[0] + (B[0] - Cc[0]) * t}
            y2={Cc[1] + (B[1] - Cc[1]) * t + depth - 12} stroke={color} strokeWidth={1.4} />
        </g>
      ))}
      {/* tutup: berputar ke belakang saat open */}
      <g style={{transformOrigin: `${cx}px ${top - hh}px`, transform: `translateY(${-lid * s * 0.22}px) rotateX(${lid * 0}deg)`}} opacity={1 - lid * 0.75}>
        <polygon points={P([A, B, Cc, D])} fill={fill} stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
          strokeDasharray={per} strokeDashoffset={per * (1 - d)} />
      </g>
      {lid > 0 && (
        <polygon points={P([A, B, Cc, D])} fill="none" stroke={color} strokeOpacity={0.35 * lid} strokeWidth={1.4} strokeDasharray="6 6" />
      )}
      {label && (
        <text x={cx} y={top + depth + hh + 44} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={s * 0.075}
          fill={color} opacity={ip(d, [0.7, 1], [0, 1])}>
          {label}
        </text>
      )}
    </svg>
  );
};

/** Chip CPU dengan jalur yang menyala bergiliran. */
export const CpuChip: React.FC<{size?: number; draw?: number; load?: number; color?: string; accent?: string}> = ({
  size = 260, draw = 1, load = 0.5, color = C.ink, accent = C.coral,
}) => {
  const f = useCurrentFrame();
  const s = size;
  const d = clamp01(draw);
  const pins = 6;
  const inner = s * 0.5;
  const o = (s - inner) / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {Array.from({length: pins}).map((_, i) => {
        const t = o + (inner * (i + 0.5)) / pins;
        const lit = (Math.sin(f * 0.12 * (0.5 + load) + i * 1.3) + 1) / 2 > 1 - load;
        const col = lit ? accent : color;
        const pd = ip(d, [0.3 + i * 0.05, 0.8 + i * 0.03], [0, 1]);
        const L = o * 0.8;
        return (
          <g key={i} stroke={col} strokeWidth={STROKE} strokeLinecap="round" opacity={lit ? 1 : 0.55}>
            <line x1={t} y1={o} x2={t} y2={o - L * pd} />
            <line x1={t} y1={s - o} x2={t} y2={s - o + L * pd} />
            <line x1={o} y1={t} x2={o - L * pd} y2={t} />
            <line x1={s - o} y1={t} x2={s - o + L * pd} y2={t} />
          </g>
        );
      })}
      <rect x={o} y={o} width={inner} height={inner} rx={18} fill="#fff" fillOpacity={0} stroke={color} strokeWidth={STROKE * 1.2}
        strokeDasharray={1200} strokeDashoffset={1200 * (1 - ip(d, [0, 0.5], [0, 1]))} />
      <rect x={o + inner * 0.22} y={o + inner * 0.22} width={inner * 0.56} height={inner * 0.56} rx={10} fill={accent}
        fillOpacity={ip(d, [0.5, 1], [0, 0.18 + 0.25 * load * (0.6 + 0.4 * Math.sin(f * 0.15))])} stroke={accent}
        strokeWidth={1.6} strokeOpacity={ip(d, [0.5, 1], [0, 1])} />
      <text x={s / 2} y={s / 2 + 9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={s * 0.08} fill={color}
        opacity={ip(d, [0.6, 1], [0, 1])}>
        CPU
      </text>
    </svg>
  );
};

/** Modul RAM: sel-sel memori terisi sesuai `fill`. */
export const RamStick: React.FC<{w?: number; draw?: number; fill?: number; color?: string; accent?: string}> = ({
  w = 520, draw = 1, fill = 0.4, color = C.ink, accent = C.coral,
}) => {
  const f = useCurrentFrame();
  const h = w * 0.3;
  const d = clamp01(draw);
  const cells = 8;
  const cw = (w - 80) / cells;
  return (
    <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`}>
      <path d={`M10,10 H${w - 10} V${h} H${w / 2 + 14} v-14 h-28 v14 H10 Z`} fill="none" stroke={color} strokeWidth={STROKE}
        strokeLinejoin="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - ip(d, [0, 0.5], [0, 1]))} />
      {Array.from({length: cells}).map((_, i) => {
        const filled = i < Math.round(fill * cells + Math.sin(f * 0.05) * 0.4);
        return (
          <rect key={i} x={40 + i * cw + 4} y={34} width={cw - 8} height={h * 0.5} rx={6}
            fill={filled ? accent : 'none'} fillOpacity={filled ? 0.75 : 0} stroke={color} strokeWidth={1.6}
            opacity={ip(d, [0.4 + i * 0.05, 0.6 + i * 0.05], [0, 1])} />
        );
      })}
      {Array.from({length: 22}).map((_, i) => (
        <line key={i} x1={24 + i * ((w - 48) / 21)} y1={h + 4} x2={24 + i * ((w - 48) / 21)} y2={h + 22} stroke={color}
          strokeWidth={2.4} strokeLinecap="round" opacity={ip(d, [0.7, 1], [0, 0.6])} />
      ))}
    </svg>
  );
};

/** Penyimpanan: tumpukan piringan. */
export const StorageStack: React.FC<{w?: number; draw?: number; used?: number; color?: string; accent?: string}> = ({
  w = 300, draw = 1, used = 0.4, color = C.ink, accent = C.coral,
}) => {
  const d = clamp01(draw);
  const rx = w / 2 - 10;
  const ry = w * 0.12;
  const layers = 3;
  const lh = w * 0.22;
  return (
    <svg width={w} height={lh * layers + ry * 2 + 20} viewBox={`0 0 ${w} ${lh * layers + ry * 2 + 20}`}>
      {Array.from({length: layers}).map((_, k) => {
        const i = layers - 1 - k;
        const y = ry + 10 + i * lh;
        const dd = ip(d, [i * 0.2, i * 0.2 + 0.5], [0, 1]);
        const fullness = clamp01(used * layers - (layers - 1 - i));
        return (
          <g key={i} opacity={dd} transform={`translate(0 ${(1 - dd) * -30})`}>
            <path d={`M10,${y} v${lh - 8} a${rx},${ry} 0 0 0 ${rx * 2},0 v${-(lh - 8)}`} fill="#fff" fillOpacity={0}
              stroke={color} strokeWidth={STROKE} />
            <path d={`M10,${y + lh - 8} a${rx},${ry} 0 0 0 ${rx * 2},0`} fill="none" stroke={accent} strokeWidth={6}
              strokeOpacity={0.85} strokeDasharray={`${Math.PI * rx * fullness} 4000`} />
            <ellipse cx={w / 2} cy={y} rx={rx} ry={ry} fill="#fff" stroke={color} strokeWidth={STROKE} />
            <circle cx={w - 50} cy={y + lh * 0.55} r={5} fill={fullness > 0 ? accent : color} opacity={0.8} />
          </g>
        );
      })}
    </svg>
  );
};

/** Folder yang bisa membuka. */
export const FolderGlyph: React.FC<{size?: number; open?: number; color?: string; fill?: string}> = ({size = 120, open = 0, color = C.ink, fill = '#f3c76b'}) => {
  const o = clamp01(open);
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <path d="M6 16 a8 8 0 0 1 8-8 h28 l10 10 h54 a8 8 0 0 1 8 8 v56 a8 8 0 0 1-8 8 H14 a8 8 0 0 1-8-8 Z" fill={fill} stroke={color} strokeWidth={2} />
      <rect x={18} y={22 - o * 10} width={80} height={40} rx={4} fill="#fff" stroke={color} strokeWidth={1.4} opacity={o} />
      <path d={`M6 ${38 + o * 8} h108 v44 a8 8 0 0 1-8 8 H14 a8 8 0 0 1-8-8 Z`} fill={fill} stroke={color} strokeWidth={2}
        style={{filter: 'brightness(1.06)'}} />
    </svg>
  );
};

/** Jaringan: simpul-simpul tersambung dengan paket berjalan. */
export const NetworkMesh: React.FC<{w?: number; h?: number; draw?: number; color?: string; accent?: string; seed?: number}> = ({
  w = 420, h = 260, draw = 1, color = C.ink, accent = C.coral, seed = 3,
}) => {
  const f = useCurrentFrame();
  const nodes = Array.from({length: 7}).map((_, i) => [30 + rnd(i + seed) * (w - 60), 30 + rnd(i * 3 + seed) * (h - 60)] as [number, number]);
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 3], [1, 5], [2, 6]];
  const d = clamp01(draw);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {edges.map(([a, b], i) => {
        const [x1, y1] = nodes[a];
        const [x2, y2] = nodes[b];
        const ed = ip(d, [i * 0.06, i * 0.06 + 0.4], [0, 1]);
        const t = ((f * 0.012 + i * 0.37) % 1 + 1) % 1;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * ed} y2={y1 + (y2 - y1) * ed} stroke={color} strokeOpacity={0.4} strokeWidth={1.6} />
            {ed >= 1 && <circle cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={4} fill={accent} />}
          </g>
        );
      })}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9 * ip(d, [i * 0.08, i * 0.08 + 0.3], [0, 1], E.back)} fill="#fff" stroke={color} strokeWidth={2} />
      ))}
    </svg>
  );
};

/** Garis aliran beranimasi (paket bergerak sepanjang path). */
export const FlowPath: React.FC<{
  d: string; len?: number; draw?: number; color?: string; width?: number; dashed?: boolean; speed?: number; o?: number;
}> = ({d, len = 1200, draw = 1, color = C.coral, width = 3, dashed = false, speed = 1, o = 1}) => {
  const f = useCurrentFrame();
  const dr = clamp01(draw);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o}}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
        strokeDasharray={dashed ? `10 12` : `${len} ${len}`} strokeDashoffset={dashed ? -f * 0.8 * speed : len * (1 - dr)}
        opacity={dashed ? dr : 1} />
    </svg>
  );
};

/** Titik yang bergerak di sepanjang path (memakai CSS offset-path; deterministik per frame). */
export const PathDot: React.FC<{d: string; t: number; size?: number; color?: string; children?: React.ReactNode; rotate?: boolean}> = ({
  d, t, size = 14, color = C.coral, children, rotate = false,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      offsetPath: `path('${d}')`,
      offsetDistance: `${clamp01(t) * 100}%`,
      offsetRotate: rotate ? 'auto' : '0deg',
      width: children ? undefined : size,
      height: children ? undefined : size,
      borderRadius: '50%',
      background: children ? undefined : color,
      boxShadow: children ? undefined : `0 0 ${size}px ${color}`,
    }}
  >
    {children}
  </div>
);

/** Gelembung titik-titik "mengetik". */
export const TypingDots: React.FC<{color?: string; size?: number}> = ({color = '#9aa3ad', size = 10}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', gap: size * 0.6}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: size, height: size, borderRadius: '50%', background: color,
          transform: `translateY(${Math.sin(f * 0.2 - i * 0.9) * size * 0.35}px)`, opacity: 0.5 + 0.5 * Math.sin(f * 0.2 - i * 0.9)}} />
      ))}
    </div>
  );
};

/** Pengukur (gauge) tanpa angka — jarum bergerak sesuai `v`. */
export const Gauge: React.FC<{size?: number; v?: number; draw?: number; color?: string; accent?: string}> = ({size = 300, v = 0.5, draw = 1, color = C.ink, accent = C.coral}) => {
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.55;
  const a0 = Math.PI * 0.85;
  const a1 = Math.PI * 2.15;
  const arc = (from: number, to: number) => {
    const x1 = cx + r * Math.cos(from);
    const y1 = cy + r * Math.sin(from);
    const x2 = cx + r * Math.cos(to);
    const y2 = cy + r * Math.sin(to);
    return `M${x1},${y1} A${r},${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x2},${y2}`;
  };
  const d = clamp01(draw);
  const ang = a0 + (a1 - a0) * clamp01(v);
  return (
    <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.8}`}>
      <path d={arc(a0, a0 + (a1 - a0) * d)} stroke={color} strokeOpacity={0.2} strokeWidth={size * 0.05} fill="none" strokeLinecap="round" />
      <path d={arc(a0, a0 + (ang - a0) * d + 0.001)} stroke={accent} strokeWidth={size * 0.05} fill="none" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r * 0.8 * Math.cos(a0 + (ang - a0) * d)} y2={cy + r * 0.8 * Math.sin(a0 + (ang - a0) * d)}
        stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={10} fill={color} />
    </svg>
  );
};

/** Kartu "resep" egg: baris konfigurasi yang muncul bertahap. */
export const RecipeLines: React.FC<{lines: [string, string][]; reveal: number; color?: string; keyColor?: string; size?: number}> = ({
  lines, reveal, color = C.ink, keyColor = C.coral, size = 26,
}) => (
  <div style={{fontFamily: MONO, fontSize: size, lineHeight: 1.7, color}}>
    {lines.map(([k, v], i) => {
      const a = clamp01(reveal * lines.length - i);
      return (
        <div key={i} style={{opacity: a, transform: `translateX(${(1 - a) * 24}px)`, whiteSpace: 'nowrap'}}>
          <span style={{color: keyColor}}>{k}</span>
          <span style={{opacity: 0.45}}>: </span>
          <span>{v}</span>
        </div>
      );
    })}
  </div>
);

export const progressOf = p;
