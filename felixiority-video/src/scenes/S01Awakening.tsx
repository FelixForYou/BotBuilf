import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, expLerp, kf, ramp, spr, SPR} from '../lib/anim';
import {C, F} from '../lib/theme';
import {LogoRig} from '../components/Logo';
import {Kicker, RevealText} from '../components/Text';
import {MotionBlur} from '../components/MotionBlur';
import {TwinkleSparkle} from '../components/Sparkle';

const CX = 960;
const CY = 540;
const RING = 300;

/** Posisi titik terracotta penutup kata FELIXIORITY dalam koordinat stage (diukur dari layout). */
const DOT_STAGE = {x: 1656, y: 480};
const CAM_END = 1.035;
const toScreen = (x: number, y: number, cam: number) => ({x: CX + (x - CX) * cam, y: CY + (y - CY) * cam});
/** Posisi layar titik saat kamera mulai menembus (dipakai Scene 02 untuk match cut). */
export const S1_DOT = {...toScreen(DOT_STAGE.x, DOT_STAGE.y, CAM_END), r: 13};

const camIntroAt = (f: number) =>
  kf(f, [
    [0, 0.86],
    [170, 1.0],
    [350, CAM_END],
  ], E.soft);

const TITLE = 'FELIXIORITY';

// kurva-kurva yang tumbuh dari titik pusat
const CURVES = Array.from({length: 6}, (_, i) => {
  const a = ((i * 60 + 15) * Math.PI) / 180;
  const b = a + (48 * Math.PI) / 180;
  const ex = CX + Math.cos(b) * RING;
  const ey = CY + Math.sin(b) * RING;
  const c1x = CX + Math.cos(a) * 150;
  const c1y = CY + Math.sin(a) * 150;
  const c2x = ex + Math.cos(b - Math.PI / 2) * 120;
  const c2y = ey + Math.sin(b - Math.PI / 2) * 120;
  return {d: `M ${CX} ${CY} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`, len: 470, ex, ey, terra: i % 2 === 0};
});

/** Logo group: tengah → kiri (camera pan) */
const logoX = (f: number) => CX + (520 - CX) * spr(f, 178, SPR.gentle);
const logoScale = (f: number) => 1 - 0.14 * spr(f, 178, SPR.gentle);

export const S01Awakening: React.FC = () => {
  const f = useCurrentFrame();

  // --- kamera global: push-in lembut, lalu dorong menembus titik di akhir
  const camIntro = camIntroAt(f);
  const push = ramp(f, [352, 412], [0, 1], E.in);
  const pushScale = expLerp(push, 1, 7);
  const camRot = kf(f, [
    [0, -3],
    [160, 0],
  ], E.out);
  const stageBlur = push * 6;

  // --- titik awal
  const dotIn = 0.35 + 0.65 * spr(f, 0, SPR.pop);
  const dotPulse = 1 + Math.sin(f / 5) * 0.06 * (1 - ramp(f, [20, 60]));
  const dotHide = ramp(f, [98, 112], [0, 1], E.in);

  // --- garis & ring
  const ringDraw = ramp(f, [26, 104], [0, 1], E.inOut);
  const ringOut = ramp(f, [178, 230], [0, 1], E.inOut);
  const cross = ramp(f, [8, 70], [0, 1], E.out);

  // --- disc ungu & logo
  const disc = spr(f, 96, SPR.pop);
  const ch = spr(f, 106, SPR.bouncy);
  const chV = spr(f, 106, SPR.bouncy) - spr(f - 1, 106, SPR.bouncy);
  const squash = Math.max(-0.12, Math.min(0.12, chV * 1.6));
  const wm = spr(f, 122, SPR.pop);
  const wmY = (1 - wm) * 240;
  const wmYv = (1 - spr(f - 1, 122, SPR.pop)) * 240;
  const assembled = ramp(f, [168, 176], [0, 1], E.linear);

  const lx = logoX(f);
  const ls = logoScale(f);
  const lxv = lx - logoX(f - 1);

  // --- push-in: kamera menuju titik terracotta
  const originX = S1_DOT.x;
  const originY = S1_DOT.y;

  // lingkaran penutup (titik membesar menutupi frame)
  const coverR = push > 0 ? expLerp(ramp(f, [372, 410], [0, 1], E.in), S1_DOT.r * pushScale, 2300) : 0;

  return (
    <AbsoluteFill style={{background: C.warm, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `scale(${pushScale})`,
          transformOrigin: `${originX}px ${originY}px`,
          filter: stageBlur > 0.3 ? `blur(${stageBlur}px)` : undefined,
        }}
      >
        <AbsoluteFill style={{transform: `scale(${camIntro}) rotate(${camRot}deg)`, transformOrigin: `${CX}px ${CY}px`}}>
          {/* Crosshair editorial */}
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <g opacity={1 - ringOut}>
              <line x1={CX - 960 * cross} x2={CX + 960 * cross} y1={CY} y2={CY} stroke={C.ink} strokeOpacity={0.08} />
              <line y1={CY - 600 * cross} y2={CY + 600 * cross} x1={CX} x2={CX} stroke={C.ink} strokeOpacity={0.08} />
              {/* ring utama */}
              <g transform={`rotate(${-90 + f * 0.25} ${CX} ${CY})`}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={RING * (1 + ringOut * 0.5)}
                  fill="none"
                  stroke={C.terra}
                  strokeWidth={2}
                  strokeDasharray={`${2 * Math.PI * RING * ringDraw} 99999`}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={(RING - 60) * (1 + ringOut * 0.6)}
                  fill="none"
                  stroke={C.ink}
                  strokeOpacity={0.25}
                  strokeWidth={1}
                  strokeDasharray="2 10"
                  opacity={ramp(f, [50, 90])}
                />
              </g>
              {/* penanda kardinal */}
              {[0, 1, 2, 3].map((i) => {
                const a = (i * Math.PI) / 2 + Math.PI / 4;
                const p = spr(f, 70 + i * 6, SPR.pop);
                const r = RING * (1 + ringOut * 0.5);
                return (
                  <rect
                    key={i}
                    x={-6}
                    y={-6}
                    width={12}
                    height={12}
                    fill={i % 2 ? C.ink : C.terra}
                    transform={`translate(${CX + Math.cos(a) * r} ${CY + Math.sin(a) * r}) rotate(${45 + f * 0.8}) scale(${p})`}
                  />
                );
              })}
              {/* kurva yang mengalir dari pusat ke ring */}
              {CURVES.map((c, i) => {
                const s = 18 + i * 7;
                const head = ramp(f, [s, s + 56], [0, 1], E.inOut);
                const tail = ramp(f, [s + 34, s + 96], [0, 1], E.inOut);
                const seg = Math.max(0.0001, (head - tail) * c.len);
                return (
                  <path
                    key={i}
                    d={c.d}
                    fill="none"
                    stroke={c.terra ? C.terra : C.ink}
                    strokeOpacity={c.terra ? 1 : 0.7}
                    strokeWidth={c.terra ? 2.4 : 1.4}
                    strokeLinecap="round"
                    strokeDasharray={`${seg} 9999`}
                    strokeDashoffset={-tail * c.len}
                  />
                );
              })}
              {/* bead kecil yang mendarat di ring */}
              {CURVES.map((c, i) => {
                const s = 18 + i * 7 + 56;
                const p = spr(f, s, SPR.pop);
                return <circle key={i} cx={c.ex} cy={c.ey} r={4 * p * (1 - ringOut)} fill={c.terra ? C.terra : C.ink} />;
              })}
            </g>
          </svg>

          {/* Titik awal */}
          <div
            style={{
              position: 'absolute',
              left: CX - 10,
              top: CY - 10,
              width: 20,
              height: 20,
              borderRadius: 10,
              background: C.terra,
              transform: `scale(${dotIn * dotPulse * (1 - dotHide)})`,
            }}
          />

          {/* Logo group */}
          <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${lx}px, ${CY}px) scale(${ls})`}}>
            {/* disc ungu identitas */}
            <div
              style={{
                position: 'absolute',
                left: -250,
                top: -250,
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: C.purple,
                transform: `scale(${disc * (1 - ringOut * 0.08)})`,
                boxShadow: 'inset 0 -30px 60px rgba(0,0,0,0.12), inset 0 20px 40px rgba(255,255,255,0.18)',
              }}
            />
            {/* bayangan kontak */}
            <div
              style={{
                position: 'absolute',
                left: -230,
                top: 268,
                width: 460,
                height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(38,37,34,0.28), rgba(38,37,34,0))',
                transform: `scale(${0.4 + ch * 0.6}, ${0.5 + ch * 0.5})`,
                opacity: ch,
              }}
            />
            <MotionBlur vx={lxv} vy={chV * 300} shutter={0.4} max={14} style={{position: 'absolute', left: -280, top: -282}}>
              <LogoRig
                width={560}
                assembled={assembled}
                character={{
                  y: (1 - ch) * 160,
                  s: 0.25 + 0.75 * ch,
                  sx: 1 + squash * 0.8,
                  sy: 1 - squash,
                  r: (1 - ch) * -12,
                  o: ramp(f, [104, 112]),
                }}
                wordmark={{y: wmY, s: 0.6 + 0.4 * wm, o: ramp(f, [122, 132]), blur: Math.min(10, Math.abs(wmY - wmYv) * 0.35)}}
              />
            </MotionBlur>
            {/* kilau tambahan */}
            <TwinkleSparkle f={f} at={150} x={-300} y={-150} size={46} seed={1} />
            <TwinkleSparkle f={f} at={158} x={310} y={-220} size={34} seed={2} />
            <TwinkleSparkle f={f} at={166} x={285} y={140} size={26} seed={3} />
          </div>

          {/* Kolom kanan: kinetic typography */}
          <div style={{position: 'absolute', left: 870, top: 330}}>
            <Kicker f={f} start={196} n="01" label="PERKENALAN BRAND" />
            <div style={{marginTop: 34, display: 'flex', alignItems: 'baseline'}}>
              {TITLE.split('').map((ch2, i) => {
                const s = 206 + i * 3;
                const p = spr(f, s, SPR.snappy);
                const pPrev = spr(f - 1, s, SPR.snappy);
                const track = ramp(f, [206, 290], [0.22, -0.035], E.out);
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      fontFamily: F.sans,
                      fontWeight: 700,
                      fontSize: 132,
                      lineHeight: 1,
                      color: C.ink,
                      letterSpacing: `${track}em`,
                      transform: `translateY(${(1 - p) * -90}px) rotateX(${(1 - p) * 80}deg)`,
                      opacity: ramp(f, [s, s + 10]),
                      filter: Math.abs(p - pPrev) > 0.01 ? `blur(${Math.min(8, Math.abs(p - pPrev) * 60)}px)` : undefined,
                    }}
                  >
                    {ch2}
                  </span>
                );
              })}
            </div>
            <div style={{marginTop: 30}}>
              <RevealText text="Built with *imagination.*" f={f} start={262} size={60} />
              <div style={{height: 4}} />
              <RevealText text="Powered by *innovation.*" f={f} start={280} size={60} />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Titik penutup FELIXIORITY — terbang dari logo, lalu menjadi portal transisi */}
      <PeriodDot f={f} camIntro={camIntro} pushScale={pushScale} />

      {coverR > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: S1_DOT.x - coverR,
            top: S1_DOT.y - coverR,
            width: coverR * 2,
            height: coverR * 2,
            borderRadius: '50%',
            background: C.terra,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Titik di screen-space supaya posisinya presisi untuk portal transisi. */
const PeriodDot: React.FC<{f: number; camIntro: number; pushScale: number}> = ({f, camIntro, pushScale}) => {
  const t = ramp(f, [238, 276], [0, 1], E.inOut);
  if (f < 238) return null;
  const land = spr(f, 274, SPR.pop);
  // titik akhir dalam koordinat stage, dikonversi ke layar oleh kamera
  const end = toScreen(DOT_STAGE.x, DOT_STAGE.y, camIntro);
  const startP = toScreen(520, 540, camIntro);
  const x = startP.x + (end.x - startP.x) * t;
  const y = startP.y + (end.y - startP.y) * t - Math.sin(t * Math.PI) * 220;
  const tPrev = ramp(f - 1, [238, 276], [0, 1], E.inOut);
  const xp = startP.x + (end.x - startP.x) * tPrev;
  const yp = startP.y + (end.y - startP.y) * tPrev - Math.sin(tPrev * Math.PI) * 220;
  const settle = t >= 1 ? 1 + (1 - land) * 0.6 : 0.7;
  const r = S1_DOT.r * settle * pushScale;
  return (
    <MotionBlur vx={x - xp} vy={y - yp} shutter={0.6} max={30} style={{position: 'absolute', left: 0, top: 0}}>
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: C.terra,
        }}
      />
    </MotionBlur>
  );
};
