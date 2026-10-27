import React from 'react';
import {E, kf, ramp} from '../lib/anim';
import {C} from '../lib/theme';
import {MotionBlur} from './MotionBlur';

type Key = [number, number, number]; // [frame, x, y]

const pos = (f: number, keys: Key[]) => ({
  x: kf(f, keys.map((k) => [k[0], k[1]]), E.inOut),
  y: kf(f, keys.map((k) => [k[0], k[2]]), E.inOut),
});

/** Kursor dengan jalur keyframe, efek tekan, dan ripple. */
export const Cursor: React.FC<{f: number; keys: Key[]; presses?: number[]; show?: [number, number]}> = ({f, keys, presses = [], show}) => {
  const p = pos(f, keys);
  const prev = pos(f - 1, keys);
  const vis = show ? Math.min(ramp(f, [show[0], show[0] + 12]), 1 - ramp(f, [show[1] - 12, show[1]])) : 1;
  if (vis <= 0) return null;
  let press = 0;
  let ripple: {t: number} | null = null;
  presses.forEach((pf) => {
    const d = f - pf;
    if (d >= -5 && d <= 10) press = Math.max(press, d < 0 ? (d + 5) / 5 : 1 - d / 10);
    if (d >= 0 && d < 30) ripple = {t: d / 30};
  });
  const r = ripple as {t: number} | null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${p.x}px, ${p.y}px)`, opacity: vis, zIndex: 50, pointerEvents: 'none'}}>
      {r ? (
        <div
          style={{
            position: 'absolute',
            left: -40 * E.out(r.t) - 4,
            top: -40 * E.out(r.t) - 4,
            width: 80 * E.out(r.t) + 8,
            height: 80 * E.out(r.t) + 8,
            borderRadius: '50%',
            border: `2px solid ${C.terra}`,
            opacity: 1 - r.t,
          }}
        />
      ) : null}
      <MotionBlur vx={p.x - prev.x} vy={p.y - prev.y} shutter={0.35} max={12}>
        <svg width="34" height="40" viewBox="0 0 34 40" style={{transform: `scale(${1 - press * 0.16})`, transformOrigin: '4px 4px', filter: 'drop-shadow(0 4px 6px rgba(38,37,34,0.25))'}}>
          <path d="M4 3 L4 31 L11.5 24.5 L16.5 36 L21.5 33.8 L16.6 22.6 L26.5 22.2 Z" fill={C.ink} stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      </MotionBlur>
    </div>
  );
};
