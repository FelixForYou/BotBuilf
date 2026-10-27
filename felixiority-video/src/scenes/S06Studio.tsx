import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, kf, lerp, ramp, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {Kicker} from '../components/Text';
import {Cursor} from '../components/Cursor';
import {ICheck, IFilm, ILayers, IPlay, ISpark} from '../components/Icons';

const WIN = {x: 60, y: 90, w: 1800, h: 880};
const CAN = {x: 380, y: 86, w: 960, h: 540}; // relatif window
const CAN_SCREEN = {x: WIN.x + CAN.x, y: WIN.y + CAN.y};
const TL = {x: 200, w: 1580, y: 660};
const DUR = 6; // detik komposisi di kanvas
const pxPerSec = TL.w / DUR;

/** Waktu playhead (detik) — termasuk scrubbing. */
const playT = (f: number) =>
  kf(f, [
    [0, 0],
    [200, 3.3],
    [222, 1.4],
    [246, 4.1],
    [262, 2.9],
    [330, 6],
  ], (t) => t);
const playTEased = (f: number) => {
  // scrubbing terasa manual (in-out), playback linear
  if (f > 200 && f < 262) return kf(f, [[200, 3.3], [222, 1.4], [246, 4.1], [262, 2.9]], E.inOut);
  return playT(f);
};

/* --------------------------------------------------------- komposisi kanvas */
const WORDS = [
  {t: 'Design.', at: 0.15},
  {t: 'Animate.', at: 2.0},
  {t: 'Render.', at: 4.0},
];

const cubePos = (T: number) => {
  const u = Math.min(1, Math.max(0, T / DUR));
  return {x: 110 + u * 740, y: 390 - Math.sin(u * Math.PI) * 110, r: T * 70};
};

export const CanvasComp: React.FC<{T: number}> = ({T}) => {
  const cp = cubePos(T);
  // susun kata dalam satu baris, bergeser saat kata baru datang
  const vis = WORDS.map((w) => ramp(T, [w.at, w.at + 0.55], [0, 1], E.out));
  return (
    <div style={{position: 'absolute', inset: 0, background: C.white, overflow: 'hidden'}}>
      {/* grid tipis */}
      <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(38,37,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(38,37,34,0.04) 1px, transparent 1px)`, backgroundSize: '48px 48px'}} />
      {/* jalur gerak */}
      <svg width={960} height={540} style={{position: 'absolute', inset: 0}}>
        <path d={Array.from({length: 41}, (_, i) => {
          const p = cubePos((i / 40) * DUR);
          return `${i ? 'L' : 'M'}${p.x + 40} ${p.y + 40}`;
        }).join(' ')} fill="none" stroke={C.terra} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="4 8" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', gap: 22, fontFamily: F.serif, fontSize: 104, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1}}>
        {WORDS.map((w, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              maxWidth: `${vis[i] * 420}px`,
              padding: '0 0 16px',
              whiteSpace: 'nowrap',
              fontStyle: i === 1 ? 'italic' : undefined,
              color: i === 1 ? C.terra : C.ink,
            }}
          >
            <span style={{display: 'inline-block', transform: `translateY(${(1 - vis[i]) * 100}%)`}}>{w.t}</span>
          </span>
        ))}
      </div>
      {/* kubus 3D */}
      <div style={{position: 'absolute', left: cp.x, top: cp.y, width: 80, height: 80, perspective: 600}}>
        <MiniCube size={80} rx={-22} ry={cp.r} />
      </div>
      {/* bola terracotta */}
      <div style={{position: 'absolute', left: 820 - T * 90, top: 410 + Math.sin(T * 2) * 18, width: 46, height: 46, borderRadius: 23, background: C.terra}} />
      <div style={{position: 'absolute', left: 40, bottom: 28, fontFamily: F.mono, fontSize: 14, color: C.ink3, letterSpacing: '0.1em'}}>FELIXIORITY · {T.toFixed(2).replace('.', ',')}s</div>
    </div>
  );
};

export const MiniCube: React.FC<{size: number; rx: number; ry: number; colors?: string[]}> = ({size, rx, ry, colors = [C.terra, '#B9694F', '#E09A80', C.ink, '#D88B71', '#C47258']}) => {
  const h = size / 2;
  const faces = [
    `translateZ(${h}px)`,
    `rotateY(90deg) translateZ(${h}px)`,
    `rotateX(90deg) translateZ(${h}px)`,
    `rotateY(180deg) translateZ(${h}px)`,
    `rotateY(-90deg) translateZ(${h}px)`,
    `rotateX(-90deg) translateZ(${h}px)`,
  ];
  return (
    <div style={{position: 'relative', width: size, height: size, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg)`}}>
      {faces.map((t, i) => (
        <div key={i} style={{position: 'absolute', inset: 0, background: colors[i], borderRadius: size * 0.12, transform: t, border: '1px solid rgba(255,255,255,0.25)'}} />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------- scene */
export const S06Studio: React.FC = () => {
  const f = useCurrentFrame();
  const T = playTEased(f);

  // kamera: kanvas penuh layar → tarik mundur → ikuti kubus → kembali
  const pull = ramp(f, [4, 70], [0, 1], E.inOut);
  const kStart = 1920 / CAN.w;
  const cp = cubePos(T);
  const follow = Math.min(ramp(f, [96, 140], [0, 1], E.inOut), 1 - ramp(f, [186, 226], [0, 1], E.inOut));
  const endPush = ramp(f, [430, 520], [0, 1], E.inOut);
  const kFollow = 1 + follow * 0.32 + endPush * 0.05;
  const k = lerp(pull, kStart, kFollow);
  // titik fokus (koordinat layar dalam layout studio)
  const canCenter = {x: CAN_SCREEN.x + CAN.w / 2, y: CAN_SCREEN.y + CAN.h / 2};
  const cubeScreen = {x: CAN_SCREEN.x + cp.x + 40, y: CAN_SCREEN.y + cp.y + 40};
  const focusRest = {x: 960, y: 540};
  const fx = lerp(pull, canCenter.x, lerp(follow, focusRest.x, cubeScreen.x * 0.6 + canCenter.x * 0.4));
  const fy = lerp(pull, canCenter.y, lerp(follow, focusRest.y, cubeScreen.y * 0.6 + canCenter.y * 0.4));
  const cam = `translate(${960 - fx}px, ${540 - fy}px) scale(${k})`;
  const uiIn = ramp(f, [20, 70]);

  return (
    <AbsoluteFill style={{background: C.warm, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: cam, transformOrigin: `${fx}px ${fy}px`}}>
        <div
          style={{
            position: 'absolute',
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: 22,
            background: '#F5F3EF',
            border: `1px solid ${C.line}`,
            boxShadow: shadow.float,
            overflow: 'hidden',
            fontFamily: F.sans,
            color: C.ink,
          }}
        >
          <div style={{opacity: uiIn}}>
            <Toolbar f={f} />
            <LeftPanel f={f} />
            <RightPanel f={f} T={T} />
            <Timeline f={f} T={T} />
          </div>
          {/* kanvas preview */}
          <div style={{position: 'absolute', left: CAN.x, top: CAN.y, width: CAN.w, height: CAN.h, borderRadius: 6 * uiIn, overflow: 'hidden', boxShadow: uiIn > 0 ? `0 0 0 1px rgba(38,37,34,${0.08 * uiIn}), ${shadow.card}` : undefined}}>
            <CanvasComp T={T} />
            {/* putih dari toast Scene 05 memudar */}
            <div style={{position: 'absolute', inset: 0, background: C.white, opacity: 1 - ramp(f, [0, 18], [0, 1], E.soft)}} />
            {/* seleksi objek */}
            <div style={{position: 'absolute', left: cp.x - 8, top: cp.y - 8, width: 96, height: 96, border: `1.5px solid ${C.terra}`, borderRadius: 4, opacity: uiIn * (f < 330 ? 1 : 0)}}>
              {[
                [-4, -4],
                [88, -4],
                [-4, 88],
                [88, 88],
              ].map(([x, y], i) => (
                <div key={i} style={{position: 'absolute', left: x - 1, top: y - 1, width: 8, height: 8, background: '#fff', border: `1.5px solid ${C.terra}`}} />
              ))}
            </div>
          </div>
          <RenderPanel f={f} />
        </div>
        {/* label scene */}
        <div style={{position: 'absolute', left: WIN.x + 24, top: WIN.y + WIN.h + 16, opacity: ramp(f, [70, 100])}}>
          <Kicker f={f} start={70} n="06" label="REMOTION STUDIO · DESIGN. ANIMATE. RENDER." />
        </div>
        <Cursor
          f={f}
          show={[290, 360]}
          presses={[330]}
          keys={[
            [290, 1300, 700],
            [324, WIN.x + WIN.w - 90, WIN.y + 30],
            [360, WIN.x + WIN.w - 70, WIN.y + 120],
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ panels */
const Toolbar: React.FC<{f: number}> = ({f}) => {
  const press = f >= 325 && f <= 338 ? 1 - Math.abs(f - 330) / 8 : 0;
  const rendering = f > 330;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, borderBottom: `1px solid ${C.line}`, background: C.white, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14}}>
      {[C.terra, C.gray2, C.gray2].map((c, i) => (
        <span key={i} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
      ))}
      <span style={{marginLeft: 14, fontFamily: F.mono, fontSize: 14, color: C.ink2}}>src/FelixiorityShowreel.tsx</span>
      <div style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, background: C.gray, padding: 4, borderRadius: 10}}>
        {['Komposisi', 'Props', 'Render'].map((t, i) => (
          <span key={i} style={{padding: '6px 14px', borderRadius: 7, fontSize: 13.5, fontWeight: 550, background: i === (rendering ? 2 : 0) ? C.white : 'transparent', boxShadow: i === (rendering ? 2 : 0) ? shadow.soft : undefined}}>
            {t}
          </span>
        ))}
      </div>
      <div style={{marginLeft: 'auto', fontFamily: F.mono, fontSize: 13, color: C.ink3}}>1920×1080 · 60 FPS</div>
      <div style={{height: 36, padding: '0 18px', borderRadius: 10, background: C.terra, color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, transform: `scale(${1 - press * 0.07})`}}>
        <IFilm size={16} color="#fff" /> Render
      </div>
    </div>
  );
};

const LeftPanel: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', left: 0, top: 56, width: 300, height: 570, borderRight: `1px solid ${C.line}`, padding: 20, boxSizing: 'border-box'}}>
    <div style={{fontFamily: F.mono, fontSize: 12, letterSpacing: '0.12em', color: C.ink3}}>KOMPOSISI</div>
    {['FelixiorityShowreel', 'BrandAwakening', 'ToolsDashboard', 'FelixPanel', 'UserWarehouse', 'SemileAI'].map((n, i) => (
      <div key={i} style={{marginTop: i ? 4 : 12, padding: '9px 10px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: i === 0 ? 600 : 450, background: i === 0 ? C.white : 'transparent', boxShadow: i === 0 ? shadow.soft : undefined, color: i === 0 ? C.ink : C.ink2, opacity: ramp(f, [30 + i * 4, 50 + i * 4])}}>
        <ILayers size={16} color={i === 0 ? C.terra : C.ink3} /> {n}
      </div>
    ))}
    <div style={{marginTop: 26, fontFamily: F.mono, fontSize: 12, letterSpacing: '0.12em', color: C.ink3}}>ASET</div>
    {['felixiority-cutout.png', 'Geist.woff2', 'sfx/whoosh-soft.wav'].map((n, i) => (
      <div key={i} style={{marginTop: 10, fontFamily: F.mono, fontSize: 13, color: C.ink2, display: 'flex', alignItems: 'center', gap: 8}}>
        <span style={{width: 6, height: 6, borderRadius: 3, background: C.gray2}} /> {n}
      </div>
    ))}
  </div>
);

const RightPanel: React.FC<{f: number; T: number}> = ({f, T}) => {
  const cp = cubePos(T);
  const u = T % 1;
  // kurva easing expo-out
  const curve = (x: number) => 1 - Math.pow(1 - x, 3.2);
  const GW = 300;
  const GH = 170;
  const handleWobble = Math.sin(f / 24) * 10;
  return (
    <div style={{position: 'absolute', right: 0, top: 56, width: 420, height: 570, borderLeft: `1px solid ${C.line}`, padding: 22, boxSizing: 'border-box'}}>
      <div style={{fontFamily: F.mono, fontSize: 12, letterSpacing: '0.12em', color: C.ink3}}>PROPERTI · KUBUS</div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12}}>
        {[
          ['X', cp.x.toFixed(0)],
          ['Y', cp.y.toFixed(0)],
          ['Rotasi', `${(cp.r % 360).toFixed(0)}°`],
          ['Skala', '1,00'],
        ].map(([l, v], i) => (
          <div key={i} style={{background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 14}}>
            <span style={{color: C.ink3}}>{l}</span>
            <span style={{fontFamily: F.mono, fontVariantNumeric: 'tabular-nums'}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop: 24, fontFamily: F.mono, fontSize: 12, letterSpacing: '0.12em', color: C.ink3, display: 'flex', justifyContent: 'space-between'}}>
        <span>KURVA GERAK</span>
        <span style={{color: C.terra}}>spring · damping 14</span>
      </div>
      <div style={{marginTop: 12, background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18}}>
        <svg width={GW + 20} height={GH + 20} style={{overflow: 'visible'}}>
          {[0.25, 0.5, 0.75].map((g) => (
            <React.Fragment key={g}>
              <line x1={GW * g} x2={GW * g} y1={0} y2={GH} stroke={C.ink} strokeOpacity={0.06} />
              <line y1={GH * g} y2={GH * g} x1={0} x2={GW} stroke={C.ink} strokeOpacity={0.06} />
            </React.Fragment>
          ))}
          <path d={Array.from({length: 61}, (_, i) => `${i ? 'L' : 'M'}${(i / 60) * GW} ${GH - curve(i / 60) * GH}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={2.4} strokeDasharray={`${ramp(f, [40, 100]) * 600} 999`} />
          <line x1={0} y1={GH} x2={GW * 0.18} y2={GH * 0.12 + handleWobble} stroke={C.terra} strokeWidth={1.5} />
          <line x1={GW} y1={0} x2={GW * 0.6} y2={0} stroke={C.terra} strokeWidth={1.5} />
          <circle cx={GW * 0.18} cy={GH * 0.12 + handleWobble} r={6} fill="#fff" stroke={C.terra} strokeWidth={2} />
          <circle cx={GW * 0.6} cy={0} r={6} fill="#fff" stroke={C.terra} strokeWidth={2} />
          <circle cx={u * GW} cy={GH - curve(u) * GH} r={7} fill={C.terra} />
          <line x1={u * GW} x2={u * GW} y1={0} y2={GH} stroke={C.terra} strokeOpacity={0.3} strokeDasharray="3 4" />
        </svg>
      </div>
      <div style={{marginTop: 16, display: 'flex', gap: 8}}>
        {['interpolate()', 'spring()', 'Easing.bezier'].map((t, i) => (
          <span key={i} style={{fontFamily: F.mono, fontSize: 12, padding: '6px 10px', borderRadius: 8, background: i === 1 ? C.terraSoft : C.gray, color: i === 1 ? C.terraDeep : C.ink2}}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

const TRACKS = [
  {label: 'Teks · Design.', from: 0.15, to: 6, color: C.ink, keys: [0.15, 0.7]},
  {label: 'Teks · Animate.', from: 2.0, to: 6, color: C.terra, keys: [2.0, 2.55]},
  {label: 'Teks · Render.', from: 4.0, to: 6, color: C.ink, keys: [4.0, 4.55]},
  {label: 'Kubus 3D', from: 0, to: 6, color: '#D9A441', keys: [0, 1.5, 3, 4.5, 6]},
  {label: 'SFX', from: 0, to: 6, color: C.gray2, keys: []},
];

const Timeline: React.FC<{f: number; T: number}> = ({f, T}) => {
  const ph = TL.x + T * pxPerSec;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 626, bottom: 0, borderTop: `1px solid ${C.line}`, background: C.white}}>
      {/* transport */}
      <div style={{position: 'absolute', left: 20, top: 10, display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 28, height: 28, borderRadius: 8, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <IPlay size={14} color="#fff" />
        </div>
        <span style={{fontFamily: F.mono, fontSize: 14, fontVariantNumeric: 'tabular-nums'}}>
          00:0{Math.floor(T)}:{String(Math.floor((T % 1) * 60)).padStart(2, '0')}
        </span>
        <span style={{fontFamily: F.mono, fontSize: 12, color: f > 200 && f < 262 ? C.terra : C.ink3, letterSpacing: '0.1em'}}>{f > 200 && f < 262 ? 'SCRUBBING' : 'PLAY'}</span>
      </div>
      {/* ruler */}
      <div style={{position: 'absolute', left: TL.x, top: 14, width: TL.w, height: 20}}>
        {Array.from({length: DUR * 4 + 1}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: (i / 4) * pxPerSec, top: i % 4 ? 10 : 2, width: 1, height: i % 4 ? 8 : 16, background: C.ink3}}>
            {i % 4 === 0 ? <span style={{position: 'absolute', left: 6, top: -2, fontFamily: F.mono, fontSize: 11, color: C.ink3}}>{i / 4}s</span> : null}
          </div>
        ))}
      </div>
      {/* tracks */}
      {TRACKS.map((tr, i) => {
        const y = 48 + i * 42;
        const p = spr(f, 40 + i * 6, SPR.gentle);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: 20, top: y + 8, fontSize: 13, color: C.ink2, width: 170, whiteSpace: 'nowrap'}}>{tr.label}</div>
            <div
              style={{
                position: 'absolute',
                left: TL.x + tr.from * pxPerSec,
                top: y,
                width: (tr.to - tr.from) * pxPerSec * p,
                height: 32,
                borderRadius: 8,
                background: tr.color === C.gray2 ? C.gray : `${tr.color}1F`,
                border: `1px solid ${tr.color === C.gray2 ? C.gray2 : tr.color}55`,
                overflow: 'hidden',
              }}
            >
              {tr.label === 'SFX' ? (
                <svg width={TL.w} height={32}>
                  {Array.from({length: 160}, (_, k) => {
                    const a = Math.abs(Math.sin(k * 0.7) * Math.sin(k * 0.13)) * 12 + 1;
                    return <rect key={k} x={k * 10 + 2} y={16 - a} width={4} height={a * 2} rx={2} fill={C.ink3} />;
                  })}
                </svg>
              ) : null}
            </div>
            {tr.keys.map((kt, j) => {
              const hit = Math.max(0, 1 - Math.abs(T - kt) * 4);
              return (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: TL.x + kt * pxPerSec - 7,
                    top: y + 9,
                    width: 14,
                    height: 14,
                    background: hit > 0.2 ? C.terra : '#fff',
                    border: `1.5px solid ${C.terra}`,
                    transform: `rotate(45deg) scale(${p * (1 + hit * 0.4)})`,
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}
      {/* playhead */}
      <div style={{position: 'absolute', left: ph, top: 8, bottom: 8, width: 2, background: C.terra}}>
        <div style={{position: 'absolute', left: -7, top: 0, width: 16, height: 16, borderRadius: 4, background: C.terra}} />
      </div>
    </div>
  );
};

const RenderPanel: React.FC<{f: number}> = ({f}) => {
  const p = spr(f, 336, SPR.gentle);
  if (f < 334) return null;
  const prog = ramp(f, [346, 436], [0, 1], E.inOut);
  const done = f > 438;
  const frame = Math.round(prog * 3600);
  const strip = (f - 340) * 3.2;
  return (
    <div
      style={{
        position: 'absolute',
        left: CAN.x - 20,
        top: 560 + (1 - p) * 420,
        width: CAN.w + 40,
        height: 330,
        borderRadius: 20,
        background: C.white,
        border: `1px solid ${C.line}`,
        boxShadow: shadow.float,
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 34, height: 34, borderRadius: 10, background: done ? C.green : C.terraSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {done ? <ICheck size={18} color="#fff" stroke={2.8} /> : <ISpark size={18} color={C.terra} />}
        </div>
        <div style={{fontSize: 18, fontWeight: 650}}>{done ? 'Render selesai' : 'Merender felixiority-showreel.mp4'}</div>
        <div style={{marginLeft: 'auto', fontFamily: F.mono, fontSize: 14, color: C.ink2, fontVariantNumeric: 'tabular-nums'}}>
          Frame {String(frame).padStart(4, '0')} / 3600
        </div>
      </div>
      {/* film strip: frame-frame yang dimanipulasi */}
      <div style={{position: 'relative', height: 130, marginTop: 20, overflow: 'hidden', borderRadius: 10}}>
        {Array.from({length: 9}, (_, i) => {
          const x = i * 180 - (strip % 180);
          const idx = i + Math.floor(strip / 180);
          const T = (idx * 0.7) % DUR;
          const rendered = x < (CAN.w - 8) * prog + 40;
          return (
            <div key={i} style={{position: 'absolute', left: x, top: 8, width: 168, height: 94.5, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.line}`, filter: rendered ? undefined : 'grayscale(1)', opacity: rendered ? 1 : 0.45}}>
              <div style={{width: 960, height: 540, transform: 'scale(0.175)', transformOrigin: '0 0', position: 'relative'}}>
                <CanvasComp T={T + 0.6} />
              </div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, fontFamily: F.mono, fontSize: 12, color: C.ink3, display: 'flex', justifyContent: 'space-between'}}>
          <span>H.264 · CRF 16 · yuv420p</span>
          <span>{done ? '1920×1080 · 60 FPS · 60,0 dtk' : `${Math.round(prog * 100)}%`}</span>
        </div>
      </div>
      <div style={{marginTop: 14, height: 10, borderRadius: 5, background: C.gray, overflow: 'hidden'}}>
        <div style={{width: `${prog * 100}%`, height: 10, borderRadius: 5, background: done ? C.green : C.terra}} />
      </div>
    </div>
  );
};
