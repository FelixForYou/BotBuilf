import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, MONO} from '../lib/theme';
import {rnd} from '../lib/anim';
import {PteroLogo} from '../components/graphics';

/** Miniatur dashboard (abstrak) untuk panel-panel melayang. Selalu hidup: baris console & grafik bergerak. */
export const MiniDash: React.FC<{light?: boolean; seed?: number; big?: boolean}> = ({light = false, seed = 0, big = false}) => {
  const f = useCurrentFrame();
  const bg = light ? '#f4f1ee' : '#151a21';
  const card = light ? '#ffffff' : '#1f2630';
  const line = light ? '#e3ddd7' : '#2b3441';
  const txt = light ? '#2a2a2a' : '#c9d2de';
  const sc = big ? 1 : 0.62;
  const bars = 26;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, fontFamily: FONT}}>
      <div style={{height: 46 * sc, display: 'flex', alignItems: 'center', padding: `0 ${18 * sc}px`, borderBottom: `1px solid ${line}`, gap: 12}}>
        <PteroLogo h={20 * sc} wordColor={light ? '#0f172a' : '#e8edf3'} />
        <div style={{marginLeft: 'auto', display: 'flex', gap: 8 * sc}}>
          <div style={{width: 50 * sc, height: 18 * sc, borderRadius: 6, background: '#16a34a'}} />
          <div style={{width: 50 * sc, height: 18 * sc, borderRadius: 6, background: '#64748b'}} />
          <div style={{width: 50 * sc, height: 18 * sc, borderRadius: 6, background: '#dc2626'}} />
        </div>
      </div>
      <div style={{display: 'flex', gap: 14 * sc, padding: 16 * sc}}>
        <div style={{flex: 2, height: (big ? 230 : 120) * sc / (big ? 1 : 0.62) * (big ? 1 : 0.62), background: light ? '#1b1f24' : '#0d1014', borderRadius: 8, padding: 12 * sc, overflow: 'hidden', position: 'relative'}}>
          {Array.from({length: big ? 9 : 6}).map((_, i) => {
            const k = Math.floor(f / 14) + i + seed * 7;
            const w = 30 + rnd(k) * 60;
            const col = rnd(k * 3) > 0.85 ? '#4ade80' : rnd(k * 5) > 0.93 ? '#fbbf24' : '#6b7685';
            return <div key={i} style={{height: 7 * sc, width: `${w}%`, background: col, opacity: 0.8, borderRadius: 3, marginBottom: 9 * sc}} />;
          })}
          <div style={{position: 'absolute', left: 12 * sc, bottom: 10 * sc, fontFamily: MONO, fontSize: 13 * sc, color: C.ptero, opacity: 0.8}}>$</div>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10 * sc}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{height: 46 * sc, background: card, borderRadius: 8, border: `1px solid ${line}`, padding: 8 * sc, boxSizing: 'border-box'}}>
              <div style={{height: 6 * sc, width: '40%', background: txt, opacity: 0.35, borderRadius: 3}} />
              <div style={{height: 9 * sc, width: `${40 + 40 * (0.5 + 0.5 * Math.sin(f * 0.02 + i + seed))}%`, background: i === 0 ? C.ptero : i === 1 ? C.coral : '#94a3b8', borderRadius: 3, marginTop: 8 * sc}} />
            </div>
          ))}
        </div>
      </div>
      <div style={{display: 'flex', gap: 3 * sc, alignItems: 'flex-end', height: (big ? 110 : 60) * sc, padding: `0 ${16 * sc}px`}}>
        {Array.from({length: bars}).map((_, i) => {
          const v = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin((f * 0.05 + i * 0.5 + seed)));
          return <div key={i} style={{flex: 1, height: `${v * 100}%`, background: light ? '#e7b9a0' : '#2f4a7a', borderRadius: 2}} />;
        })}
      </div>
    </div>
  );
};

/** Label keterangan kecil di pojok, untuk menandai contoh sebagai simulasi. */
export const Caption: React.FC<{text: string; x: number; y: number; dark?: boolean; o?: number; size?: number; align?: 'left' | 'center' | 'right'}> = ({
  text, x, y, dark = true, o = 1, size = 22, align = 'left',
}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity: o, fontFamily: FONT, fontSize: size, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    transform: align === 'center' ? 'translateX(-50%)' : align === 'right' ? 'translateX(-100%)' : undefined, whiteSpace: 'nowrap'}}>
    {text}
  </div>
);
