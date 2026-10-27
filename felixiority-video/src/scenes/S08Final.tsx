import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {E, expLerp, kf, lerp, ramp, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {CHAT_RECT} from './S07SemileAI';
import {MiniCube} from './S06Studio';
import {LogoRig, LOGO} from '../components/Logo';
import {RevealText} from '../components/Text';
import {TwinkleSparkle} from '../components/Sparkle';
import {MotionBlur} from '../components/MotionBlur';
import {IPlay, ISend} from '../components/Icons';

const CX = 960;
const CY = 540;
const RING = 290;
const TILE = 168;

const tilePos = (i: number) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return {x: CX + Math.cos(a) * RING, y: CY + Math.sin(a) * RING, a};
};

const LOGO_W = 500;
const LOGO_H = (LOGO.h / LOGO.w) * LOGO_W;

export const S08Final: React.FC = () => {
  const f = useCurrentFrame();

  // kamera komposisi: mundur, lalu melesat menembus pusat
  const back = kf(f, [[0, 1], [44, 1.04], [112, 0.84]], E.inOut);
  const rush = ramp(f, [112, 150], [0, 1], E.in);
  const camS = back * expLerp(rush, 1, 9);
  const camR = kf(f, [[0, 0], [112, 5]], E.inOut) + rush * 18;
  const compO = 1 - ramp(f, [130, 148]);

  // logo reveal
  const lg = spr(f, 140, SPR.bouncy);
  const lgPrev = spr(f - 1, 140, SPR.bouncy);
  const settleUp = spr(f, 238, SPR.gentle);
  const logoY0 = lerp(settleUp, 470, 360);
  const logoS = lerp(settleUp, 1, 0.78);

  // outro: semua menyusut menjadi titik terracotta
  const outro = ramp(f, [332, 362], [0, 1], E.inOut);
  const whiteBg = ramp(f, [330, 370]);
  const dotIn = spr(f, 348, SPR.pop);
  const dotEnd = ramp(f, [362, 380], [1, 0.55], E.inOut);
  const logoY = lerp(outro, logoY0, CY);

  return (
    <AbsoluteFill style={{background: whiteBg > 0 ? mix(whiteBg) : C.warm, overflow: 'hidden'}}>
      {/* ---------------- komposisi geometris dari semua proyek */}
      {compO > 0 ? (
        <AbsoluteFill style={{transform: `scale(${camS}) rotate(${camR}deg)`, transformOrigin: `${CX}px ${CY}px`, opacity: compO, filter: rush > 0.2 ? `blur(${(rush - 0.2) * 10}px)` : undefined}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <polygon
              points={[0, 1, 2, 3, 4, 5].map((i) => `${tilePos(i).x},${tilePos(i).y}`).join(' ')}
              fill="none"
              stroke={C.terra}
              strokeWidth={2}
              strokeDasharray={`${ramp(f, [34, 96], [0, 1], E.inOut) * 1800} 9999`}
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={CX} y1={CY} x2={lerp(ramp(f, [44 + i * 4, 84 + i * 4], [0, 1], E.out), CX, tilePos(i).x)} y2={lerp(ramp(f, [44 + i * 4, 84 + i * 4], [0, 1], E.out), CY, tilePos(i).y)} stroke={C.ink} strokeOpacity={0.15} strokeDasharray="3 7" />
            ))}
            <circle cx={CX} cy={CY} r={RING + 120} fill="none" stroke={C.ink} strokeOpacity={0.08} strokeDasharray="2 10" transform={`rotate(${f * 0.4} ${CX} ${CY})`} />
            <circle cx={CX} cy={CY} r={14 * spr(f, 40, SPR.pop)} fill={C.terra} />
          </svg>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Tile key={i} i={i} f={f} />
          ))}
        </AbsoluteFill>
      ) : null}

      {/* ---------------- logo */}
      {f >= 136 ? (
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: logoY,
            transform: `translate(-50%, -50%) scale(${logoS * (1 - outro * 0.96)})`,
            opacity: 1 - ramp(f, [350, 360]),
          }}
        >
          {/* disc ungu identitas */}
          <div
            style={{
              position: 'absolute',
              left: LOGO_W / 2 - 230,
              top: LOGO_H / 2 - 230,
              width: 460,
              height: 460,
              borderRadius: '50%',
              background: C.purple,
              transform: `scale(${spr(f, 134, SPR.pop)})`,
              boxShadow: 'inset 0 -30px 60px rgba(0,0,0,0.12), inset 0 20px 40px rgba(255,255,255,0.18)',
            }}
          />
          <div style={{position: 'absolute', left: LOGO_W / 2 - 220, top: LOGO_H - 6, width: 440, height: 36, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(38,37,34,0.25), transparent)', transform: `scale(${lg})`}} />
          <MotionBlur vy={(lg - lgPrev) * 400} shutter={0.4} max={16}>
            <div style={{transform: `scale(${0.3 + 0.7 * lg}, ${(0.3 + 0.7 * lg) * (1 + Math.max(-0.1, Math.min(0.1, (lg - lgPrev) * -1.5)))}) rotate(${(1 - lg) * 14}deg)`, transformOrigin: '50% 80%'}}>
              <LogoRig width={LOGO_W} />
              <Glint f={f} />
            </div>
          </MotionBlur>
          <TwinkleSparkle f={f} at={156} x={-40} y={110} size={54} seed={1} out={330} />
          <TwinkleSparkle f={f} at={164} x={LOGO_W + 30} y={60} size={40} seed={2} out={330} />
          <TwinkleSparkle f={f} at={172} x={LOGO_W + 10} y={LOGO_H - 140} size={30} seed={3} out={330} />
          <TwinkleSparkle f={f} at={300} x={LOGO_W * 0.72} y={40} size={44} seed={4} out={330} />
          <TwinkleSparkle f={f} at={306} x={LOGO_W * 0.2} y={LOGO_H - 60} size={34} seed={5} out={330} />
        </div>
      ) : null}

      {/* ---------------- teks penutup */}
      <div style={{position: 'absolute', right: 1920 - 680, top: 425, textAlign: 'right'}}>
        <RevealText text="Different *Ideas.*" f={f} start={170} out={232} size={78} align="right" />
      </div>
      <div style={{position: 'absolute', left: 1240, top: 425}}>
        <RevealText text="One *Vision.*" f={f} start={184} out={236} size={78} />
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', transform: `scale(${1 - outro * 0.9})`, opacity: 1 - ramp(f, [338, 352])}}>
        {'FELIXIORITY'.split('').map((ch, i) => {
          const s = 250 + i * 2.5;
          const p = spr(f, s, SPR.snappy);
          const track = ramp(f, [250, 320], [0.3, 0.06], E.out);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: F.sans,
                fontWeight: 700,
                fontSize: 112,
                lineHeight: 1,
                color: C.ink,
                letterSpacing: `${track}em`,
                marginRight: i === 10 ? `-${track}em` : 0,
                opacity: ramp(f, [s, s + 8]),
                transform: `translateY(${(1 - p) * 70}px) scale(${0.8 + 0.2 * p})`,
                filter: p < 0.9 ? `blur(${(1 - p) * 6}px)` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', opacity: 1 - ramp(f, [334, 348])}}>
        <RevealText text="Create Beyond *Limits.*" f={f} start={282} size={58} align="center" />
      </div>
      <div style={{position: 'absolute', left: CX - 60, top: 885, width: 120 * ramp(f, [296, 330], [0, 1], E.out), height: 2, background: C.terra, transform: `translateX(${60 - 60 * ramp(f, [296, 330], [0, 1], E.out)}px)`, opacity: 1 - ramp(f, [334, 346])}} />

      {/* ---------------- titik akhir (bookend Scene 01) */}
      {f >= 344 ? (
        <div style={{position: 'absolute', left: CX - 12, top: CY - 12, width: 24, height: 24, borderRadius: 12, background: C.terra, transform: `scale(${dotIn * dotEnd})`}} />
      ) : null}
    </AbsoluteFill>
  );
};

const mix = (t: number) => {
  const a = [250, 249, 246];
  return `rgb(${a.map((v) => Math.round(v + (255 - v) * t)).join(',')})`;
};

/** Kilau cahaya diagonal yang dimask oleh siluet logo. */
const Glint: React.FC<{f: number}> = ({f}) => {
  const t = ramp(f, [292, 330], [0, 1], E.inOut);
  if (t <= 0 || t >= 1) return null;
  const mask = `url(${staticFile('brand/felixiority-cutout.png')})`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        background: `linear-gradient(115deg, rgba(255,255,255,0) ${t * 160 - 40}%, rgba(255,255,255,0.85) ${t * 160 - 25}%, rgba(255,255,255,0) ${t * 160 - 10}%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

/* ------------------------------------------------------------------- tiles */
const Tile: React.FC<{i: number; f: number}> = ({i, f}) => {
  const p = tilePos(i);
  const isAI = i === 1;
  const t = isAI ? ramp(f, [0, 44], [0, 1], E.inOut) : ramp(f, [4 + i * 3, 50 + i * 3], [0, 1], E.out);
  const tPrev = isAI ? ramp(f - 1, [0, 44], [0, 1], E.inOut) : ramp(f - 1, [4 + i * 3, 50 + i * 3], [0, 1], E.out);
  const start = isAI
    ? {x: CHAT_RECT.x + CHAT_RECT.w / 2, y: CHAT_RECT.y + CHAT_RECT.h / 2, w: CHAT_RECT.w, h: CHAT_RECT.h}
    : {x: CX + Math.cos(p.a) * 1500, y: CY + Math.sin(p.a) * 1100, w: TILE, h: TILE};
  const x = lerp(t, start.x, p.x);
  const y = lerp(t, start.y, p.y);
  const xp = lerp(tPrev, start.x, p.x);
  const yp = lerp(tPrev, start.y, p.y);
  const w = lerp(t, start.w, TILE);
  const h = lerp(t, start.h, TILE);
  const rot = isAI ? 0 : (1 - t) * (i % 2 ? 40 : -40);
  const float = Math.sin((f + i * 20) / 30) * 4;
  return (
    <MotionBlur vx={x - xp} vy={y - yp} shutter={0.35} max={20} style={{position: 'absolute', left: 0, top: 0}}>
      <div
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h / 2 + float * t,
          width: w,
          height: h,
          borderRadius: lerp(t, isAI ? 30 : 28, 28),
          background: C.white,
          border: `1px solid ${C.line}`,
          boxShadow: shadow.float,
          transform: `rotate(${rot}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{opacity: isAI ? ramp(f, [26, 44]) : 1, transform: `scale(${isAI ? 0.8 + 0.2 * ramp(f, [26, 44]) : 1})`}}>
          <TileArt i={i} f={f} />
        </div>
        <div style={{position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontSize: 11, letterSpacing: '0.12em', color: C.ink3, opacity: isAI ? ramp(f, [30, 44]) : 1}}>
          {['TOOLS', 'SEMILE AI', 'PANEL', 'WAREHOUSE', 'TELEGRAM', 'STUDIO'][i]}
        </div>
      </div>
    </MotionBlur>
  );
};

const TileArt: React.FC<{i: number; f: number}> = ({i, f}) => {
  switch (i) {
    case 0: // tools: bar chart
      return (
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: 70, marginBottom: 14}}>
          {[0.5, 0.8, 0.45, 1, 0.7].map((v, k) => (
            <div key={k} style={{width: 14, height: 70 * v * (0.85 + 0.15 * Math.sin(f / 12 + k)), borderRadius: 4, background: k === 3 ? C.terra : C.ink}} />
          ))}
        </div>
      );
    case 1: // semile glyph
      return (
        <svg width={76} height={76} viewBox="-50 -50 100 100" style={{marginBottom: 14}}>
          <circle r={44} fill={C.ink} />
          <circle r={26} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="120 44" transform={`rotate(${f * 1.5})`} />
          <circle r={8} fill={C.terra} />
        </svg>
      );
    case 2: // panel steps
      return (
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 14}}>
          {[0, 1, 2, 3].map((k) => (
            <React.Fragment key={k}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: k < 3 ? C.terra : C.ink}} />
              {k < 3 ? <div style={{width: 14, height: 2, background: C.terra}} /> : null}
            </React.Fragment>
          ))}
        </div>
      );
    case 3: // warehouse cube
      return (
        <div style={{width: 64, height: 64, perspective: 400, marginBottom: 18}}>
          <MiniCube size={64} rx={-28} ry={45 + f * 0.6} colors={['#FFFFFF', '#E4E1DB', C.terra, '#ECE9E3', '#F3F1EC', '#DCD7CF']} />
        </div>
      );
    case 4: // telegram
      return (
        <div style={{width: 70, height: 70, borderRadius: 35, background: C.terraSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14}}>
          <ISend size={34} color={C.terra} />
        </div>
      );
    default: // studio timeline
      return (
        <div style={{width: 110, marginBottom: 14}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 10}}>
            <IPlay size={26} color={C.ink} />
          </div>
          {[0.9, 0.6, 0.75].map((v, k) => (
            <div key={k} style={{height: 8, width: `${v * 100}%`, marginLeft: `${(1 - v) * 50}%`, borderRadius: 4, background: k === 1 ? C.terra : C.gray2, marginBottom: 5}} />
          ))}
          <div style={{position: 'relative', height: 0}}>
            <div style={{position: 'absolute', left: `${((f * 0.8) % 100)}%`, top: -46, width: 2, height: 40, background: C.terra}} />
          </div>
        </div>
      );
  }
};
