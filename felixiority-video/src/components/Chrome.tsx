import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {E, ramp} from '../lib/anim';
import {C, F} from '../lib/theme';
import {SCENES, TOTAL} from '../lib/timeline';

/** Tekstur kertas halus — memberi kesan editorial cetak. */
export const Grain: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.035, mixBlendMode: 'multiply'}}>
    <Img src={staticFile('brand/grain.png')} style={{width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated'}} />
  </AbsoluteFill>
);

/** Vignette hangat yang sangat lembut. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 1}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 45%, rgba(250,249,246,0) 55%, rgba(204,120,92,${0.05 * strength}) 85%, rgba(38,37,34,${0.07 * strength}) 100%)`,
    }}
  />
);

const ORDER = Object.values(SCENES);

/** Digit yang berputar (rolling) saat berganti. */
const Roll: React.FC<{values: string[]; index: number; frac: number; h: number}> = ({values, index, frac, h}) => (
  <span style={{display: 'inline-block', height: h, overflow: 'hidden', verticalAlign: 'top'}}>
    <span style={{display: 'block', transform: `translateY(${-(index + frac) * h}px)`}}>
      {values.map((v, i) => (
        <span key={i} style={{display: 'block', height: h, lineHeight: `${h}px`, whiteSpace: 'nowrap'}}>
          {v}
        </span>
      ))}
    </span>
  </span>
);

/**
 * HUD editorial yang konsisten di sepanjang video: label brand, indeks scene
 * yang bergulir, dan garis progres tipis.
 */
export const EditorialHud: React.FC = () => {
  const f = useCurrentFrame();
  const vis = Math.min(ramp(f, [170, 215]), 1 - ramp(f, [3330, 3370], [0, 1], E.in));
  if (vis <= 0) return null;
  // indeks scene: berganti pada titik tengah overlap transisi
  const marks = ORDER.map((s, i) => (i === 0 ? 0 : s.from + 20));
  let idx = 0;
  marks.forEach((m, i) => {
    if (f >= m) idx = i;
  });
  const next = marks[idx + 1];
  const frac = next !== undefined ? ramp(f, [next - 14, next], [0, 1], E.inOut) : 0;
  const h = 20;
  const y = (1 - vis) * -16;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: F.mono, fontSize: 14, letterSpacing: '0.14em', color: C.ink2, opacity: vis}}>
      <div style={{position: 'absolute', left: 64, top: 44 + y, display: 'flex', gap: 14, alignItems: 'center'}}>
        <div style={{width: 8, height: 8, borderRadius: 4, background: C.terra}} />
        <span style={{color: C.ink, fontWeight: 600}}>FELIXIORITY</span>
        <span>/ SHOWREEL 2026</span>
      </div>
      <div style={{position: 'absolute', right: 64, top: 44 + y, display: 'flex', gap: 12, alignItems: 'center', height: h}}>
        <Roll values={ORDER.map((s) => s.n)} index={idx} frac={frac} h={h} />
        <span>/ 08</span>
        <span style={{width: 26, height: 1, background: C.ink3}} />
        <span style={{width: 260, textAlign: 'left'}}>
          <Roll values={ORDER.map((s) => s.label.toUpperCase())} index={idx} frac={frac} h={h} />
        </span>
      </div>
      <div style={{position: 'absolute', left: 64, right: 64, bottom: 40 - y, height: 1, background: C.line}}>
        <div style={{width: `${(f / TOTAL) * 100}%`, height: 1, background: C.terra}} />
      </div>
    </AbsoluteFill>
  );
};
