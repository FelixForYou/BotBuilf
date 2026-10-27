import React from 'react';
import {C} from '../lib/theme';
import {E, ramp} from '../lib/anim';

/** Kilau 4-sudut khas logo Felixiority (emas, outline ungu tua). */
export const Sparkle: React.FC<{size: number; color?: string; outline?: boolean; style?: React.CSSProperties}> = ({size, color = C.gold, outline = true, style}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{overflow: 'visible', ...style}}>
    <path
      d="M0 -46 C4 -14 14 -4 46 0 C14 4 4 14 0 46 C-4 14 -14 4 -46 0 C-14 -4 -4 -14 0 -46 Z"
      fill={color}
      stroke={outline ? '#2A1460' : 'none'}
      strokeWidth={outline ? 6 : 0}
      strokeLinejoin="round"
    />
    <path d="M0 -30 C2 -10 8 -3 22 -2" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

/** Sparkle yang muncul dengan pop + rotasi + twinkle. */
export const TwinkleSparkle: React.FC<{f: number; at: number; x: number; y: number; size: number; seed?: number; out?: number}> = ({
  f,
  at,
  x,
  y,
  size,
  seed = 0,
  out,
}) => {
  const p = ramp(f, [at, at + 22], [0, 1], E.out);
  const pop = p < 1 ? Math.sin(p * Math.PI) * 0.35 + p : 1;
  const tw = 1 + Math.sin((f + seed * 37) / 9) * 0.12;
  const o = out !== undefined ? 1 - ramp(f, [out, out + 18], [0, 1], E.in) : 1;
  const s = pop * tw * o;
  if (s <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${s}) rotate(${(1 - p) * -90 + Math.sin((f + seed * 20) / 30) * 8}deg)`}}>
      <Sparkle size={size} />
    </div>
  );
};
