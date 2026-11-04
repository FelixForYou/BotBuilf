import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT} from '../lib/theme';
import {E, clamp01, drift, ip, p} from '../lib/anim';

/* ------------------------------------------------------------------ */
/* Latar: putih bersih / hitam pekat + cahaya hangat                   */
/* ------------------------------------------------------------------ */

export const Stage: React.FC<{dark?: number; children?: React.ReactNode}> = ({dark = 0, children}) => {
  // dark: 0 = putih, 1 = hitam (bisa di-interpolasi)
  const v = Math.round(255 - dark * 250);
  return (
    <AbsoluteFill style={{background: `rgb(${v},${v},${Math.round(v - dark * 0)})`, fontFamily: FONT, overflow: 'hidden'}}>
      {children}
    </AbsoluteFill>
  );
};

/** Cahaya coral lembut di belakang objek, bergerak perlahan (gerak pendukung). */
export const WarmGlow: React.FC<{
  x?: number; y?: number; r?: number; o?: number; seed?: number; color?: string; squash?: number;
}> = ({x = 960, y = 540, r = 700, o = 1, seed = 0, color = C.coral, squash = 0.62}) => {
  const f = useCurrentFrame();
  const dx = drift(f, seed, 60, 0.6);
  const dy = drift(f, seed + 5, 30, 0.5);
  return (
    <div
      style={{
        position: 'absolute',
        left: x + dx - r,
        top: y + dy - r * squash,
        width: r * 2,
        height: r * 2 * squash,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${color}cc 0%, ${color}66 35%, ${color}22 62%, transparent 100%)`,
        opacity: o,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
};

/** Sapuan cahaya diagonal (seperti latar referensi bagian kartu melayang). */
export const LightSweep: React.FC<{o?: number; angle?: number; seed?: number; color?: string}> = ({
  o = 1,
  angle = -32,
  seed = 0,
  color = C.coral,
}) => {
  const f = useCurrentFrame();
  const shift = drift(f, seed, 120, 0.35);
  return (
    <div
      style={{
        position: 'absolute',
        left: -600 + shift,
        top: -300,
        width: 3200,
        height: 1700,
        transform: `rotate(${angle}deg)`,
        background: `linear-gradient(90deg, transparent 18%, ${color}22 34%, ${color}88 48%, ${color}aa 52%, ${color}33 64%, transparent 80%)`,
        opacity: o,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Garis cahaya bergelombang jingga (motif pembuka referensi). */
export const WaveLight: React.FC<{y?: number; o?: number; amp?: number; seed?: number; progress?: number; color?: string}> = ({
  y = 540,
  o = 1,
  amp = 40,
  seed = 0,
  progress = 1,
  color = C.coral,
}) => {
  const f = useCurrentFrame();
  const pts: string[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const x = -100 + (2120 * i) / N;
    const yy =
      y +
      Math.sin(i * 0.33 + f * 0.018 + seed) * amp +
      Math.sin(i * 0.11 - f * 0.011 + seed * 2) * amp * 0.8;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)}`);
  }
  const d = pts.join(' ');
  const dash = 2400;
  const off = dash * (1 - clamp01(progress));
  const layer = (w: number, op: number, col: string) => (
    <path d={d} fill="none" stroke={col} strokeWidth={w} strokeOpacity={op} strokeLinecap="round"
      strokeDasharray={dash} strokeDashoffset={off} pathLength={dash} />
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o}}>
      {layer(110, 0.05, color)}
      {layer(56, 0.09, color)}
      {layer(24, 0.22, color)}
      {layer(9, 0.55, C.coralSoft)}
      {layer(2.5, 0.95, '#ffd2b8')}
    </svg>
  );
};

/** Grid garis putus-putus (bingkai komposisi seperti referensi). */
export const DashGrid: React.FC<{o?: number; cols?: number[]; rows?: number[]; color?: string; curve?: number}> = ({
  o = 1,
  cols = [430, 1490],
  rows = [300, 780],
  color = 'rgba(255,255,255,0.75)',
  curve = 0,
}) => {
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o}}>
      {cols.map((x, i) => (
        <path key={'c' + i} d={`M${x},-20 Q${x + (x < 960 ? -curve : curve)},540 ${x},1100`} stroke={color}
          strokeWidth={1.6} strokeDasharray="7 7" fill="none" />
      ))}
      {rows.map((y, i) => (
        <path key={'r' + i} d={`M-20,${y} Q960,${y + (y < 540 ? -curve : curve) * 0.6} 1940,${y}`} stroke={color}
          strokeWidth={1.6} strokeDasharray="7 7" fill="none" />
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Kamera 3D                                                           */
/* ------------------------------------------------------------------ */

export type CamState = {x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number};

/**
 * Dunia 3D: anak-anak ditempatkan dalam koordinat dunia (pusat layar = 0,0).
 * Kamera bergerak = dunia ditransformasi berlawanan.
 */
export const World: React.FC<{cam: CamState; persp?: number; children: React.ReactNode}> = ({cam, persp = 2200, children}) => {
  const {x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1} = cam;
  return (
    <AbsoluteFill style={{perspective: persp, perspectiveOrigin: '50% 50%'}}>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 540,
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `translateZ(${-z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate3d(${-x}px, ${-y}px, 0px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Objek di dunia 3D, berpusat di (x,y,z). */
export const Obj: React.FC<{
  x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number;
  w: number; h: number; o?: number; children?: React.ReactNode; style?: React.CSSProperties; flat?: boolean;
}> = ({x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, w, h, o = 1, children, style, flat}) => (
  <div
    style={{
      position: 'absolute',
      left: -w / 2,
      top: -h / 2,
      width: w,
      height: h,
      opacity: o,
      transformStyle: flat ? 'flat' : 'preserve-3d',
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Panel UI melayang: sudut membulat, bayangan, tepi bercahaya hangat. */
export const Panel: React.FC<{
  w: number; h: number; bg?: string; glow?: number; radius?: number; children?: React.ReactNode;
  border?: string; style?: React.CSSProperties; glowColor?: string; shadow?: number;
}> = ({w, h, bg = '#fff', glow = 0, radius = 22, children, border, style, glowColor = C.coral, shadow = 1}) => (
  <div
    style={{
      width: w,
      height: h,
      background: bg,
      borderRadius: radius,
      overflow: 'hidden',
      position: 'relative',
      border: border ?? '1px solid rgba(255,255,255,0.08)',
      boxShadow: [
        `0 ${30 * shadow}px ${80 * shadow}px rgba(0,0,0,${0.35 * shadow})`,
        glow > 0 ? `0 0 ${18 * glow}px ${4 * glow}px ${glowColor}cc` : '',
        glow > 0 ? `0 0 ${90 * glow}px ${26 * glow}px ${glowColor}55` : '',
      ]
        .filter(Boolean)
        .join(', '),
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Tipografi kinetik                                                    */
/* ------------------------------------------------------------------ */

export const KText: React.FC<{
  text: string;
  at: number; // frame lokal mulai
  out?: number; // frame lokal mulai keluar
  size?: number;
  color?: string;
  weight?: number;
  stagger?: number;
  x?: number;
  y?: number;
  align?: 'left' | 'center' | 'right';
  accent?: {word: string; color: string}[];
  tracking?: number;
  maxWidth?: number;
  lineHeight?: number;
  rise?: number;
  blur?: number;
}> = ({
  text, at, out, size = 64, color = C.ink, weight = 600, stagger = 5, x = 960, y = 540, align = 'center', accent = [],
  tracking = -0.02, maxWidth = 1500, lineHeight = 1.12, rise = 34, blur = 12,
}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0%';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, -50%)`,
        width: 'max-content',
        maxWidth,
        textAlign: align,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        lineHeight,
        color,
        whiteSpace: 'normal',
      }}
    >
      {words.map((w, i) => {
        const t0 = at + i * stagger;
        const a = p(f, t0, 26, E.out);
        const ex = out !== undefined ? p(f, out + i * Math.max(1, stagger / 2), 20, E.in) : 0;
        const acc = accent.find((q) => w.toLowerCase().replace(/[.,?!:]/g, '') === q.word.toLowerCase());
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: i < words.length - 1 ? '0.26em' : 0,
              opacity: a * (1 - ex),
              transform: `translateY(${(1 - a) * rise - ex * rise * 0.6}px)`,
              filter: blur > 0 ? `blur(${(1 - a) * blur + ex * blur}px)` : undefined,
              color: acc ? acc.color : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Label kecil "simulasi" yang halus. */
export const SimTag: React.FC<{dark?: boolean; text?: string; style?: React.CSSProperties}> = ({dark = true, text = 'data simulasi', style}) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: FONT,
      fontSize: 15,
      fontWeight: 500,
      letterSpacing: '0.04em',
      color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'}`,
      borderRadius: 999,
      padding: '4px 12px',
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {text}
  </div>
);

/** Chip/pil teks kecil. */
export const Chip: React.FC<{text: string; icon?: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties}> = ({
  text, icon, bg = 'rgba(255,255,255,0.08)', color = '#fff', size = 22, style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.45,
      padding: `${size * 0.42}px ${size * 0.8}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {icon}
    {text}
  </div>
);

/** Transisi tirai radial (putih <-> hitam) dari satu titik. */
export const IrisWipe: React.FC<{progress: number; x?: number; y?: number; color: string}> = ({progress, x = 960, y = 540, color}) => {
  if (progress <= 0) return null;
  const r = ip(progress, [0, 1], [0, 2300], E.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: color,
      }}
    />
  );
};

/**
 * Distorsi perspektif melengkung (cekung) seperti referensi: konten dirender
 * pada N potongan vertikal yang disusun di permukaan silinder.
 * span = sudut total (radian). 0 = datar.
 */
export const Curved: React.FC<{w: number; h: number; span: number; strips?: number; children: React.ReactNode; persp?: number}> = ({
  w, h, span, strips = 16, children, persp = 1800,
}) => {
  const flat = Math.abs(span) < 0.02;
  if (flat) {
    return <div style={{width: w, height: h, position: 'relative'}}>{children}</div>;
  }
  const R = w / span;
  const sw = w / strips;
  return (
    <div style={{width: w, height: h, position: 'relative', perspective: persp, transformStyle: 'preserve-3d'}}>
      {Array.from({length: strips}).map((_, i) => {
        const xc = (i + 0.5) * sw - w / 2;
        const th = xc / R;
        return (
          <div key={i} style={{position: 'absolute', left: w / 2 - sw / 2, top: 0, width: sw + 0.8, height: h, overflow: 'hidden',
            transform: `translateZ(${R}px) rotateY(${-th}rad) translateZ(${-R}px)`, backfaceVisibility: 'hidden'}}>
            <div style={{position: 'absolute', left: -(i * sw), top: 0, width: w, height: h}}>{children}</div>
          </div>
        );
      })}
    </div>
  );
};
