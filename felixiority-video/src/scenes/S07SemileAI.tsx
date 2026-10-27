import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, lerp, ramp, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {Kicker, RevealText} from '../components/Text';
import {ISpark, ISend} from '../components/Icons';

export const CHAT_RECT = {x: 1010, y: 150, w: 790, h: 790, r: 30};

const USER_TEXT = 'Ringkas kondisi semua server hari ini.';
const AI_TEXT =
  'Semua 128 server berjalan normal dengan uptime 99,98%. Tiga node mendekati batas RAM — saya sarankan memindahkan 6 server ke node SG-02 malam ini. Mau saya jadwalkan otomatis?';
const AI_WORDS = AI_TEXT.split(' ');
const STREAM = {start: 150, end: 300};

/* jaringan "kecerdasan": node pada bola yang berputar perlahan */
const NODES = Array.from({length: 16}, (_, i) => {
  const y = 1 - (i / 15) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = i * 2.399963;
  return {x: Math.cos(th) * r, y, z: Math.sin(th) * r};
});
const EDGES: [number, number][] = [];
NODES.forEach((a, i) =>
  NODES.forEach((b, j) => {
    if (j <= i) return;
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d < 0.9) EDGES.push([i, j]);
  }),
);

export const S07SemileAI: React.FC = () => {
  const f = useCurrentFrame();

  // wipe kaca cair (kiri → kanan)
  const wipe = ramp(f, [0, 48], [0, 1], E.inOut);
  const edge = lerp(wipe, -300, 2250);
  const clip = wipe < 1 ? `polygon(-10px 0, ${edge + 120}px 0, ${edge - 120}px 1080px, -10px 1080px)` : undefined;

  const exit = ramp(f, [372, 418], [0, 1], E.inOut);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: C.warm, clipPath: clip}}>
        {/* orbs lembut di balik kaca */}
        <AbsoluteFill style={{opacity: 1 - exit}}>
          <Orb x={1250 + Math.sin(f / 70) * 60} y={330 + Math.cos(f / 80) * 40} r={300} color="rgba(204,120,92,0.38)" />
          <Orb x={1650 + Math.cos(f / 60) * 50} y={760 + Math.sin(f / 75) * 50} r={260} color="rgba(135,55,250,0.16)" />
          <Orb x={400 + Math.sin(f / 90) * 40} y={900} r={320} color="rgba(238,236,232,1)" />
        </AbsoluteFill>
        <Constellation f={f} exit={exit} />

        {/* kolom kiri */}
        <div style={{position: 'absolute', left: 120, top: 210}}>
          <Kicker f={f} start={30} out={364} n="07" label="SEMILE AI" />
          <div style={{marginTop: 26}}>
            <RevealText text="Intelligence," f={f} start={40} out={366} size={108} />
            <RevealText text="*Reimagined.*" f={f} start={54} out={370} size={108} />
          </div>
          <div style={{marginTop: 30, width: 600}}>
            <RevealText
              text="Asisten AI yang memahami infrastruktur Anda dan bertindak bersama Anda."
              f={f}
              start={72}
              out={368}
              stagger={1.4}
              size={24}
              font="sans"
              color={C.ink2}
              tracking="-0.01em"
              lineHeight={1.4}
            />
          </div>
          <Identity f={f} exit={exit} />
        </div>

        <ChatCard f={f} exit={exit} />
      </AbsoluteFill>

      {/* lempeng kaca yang menyapu frame */}
      {wipe > 0 && wipe < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: edge - 210,
            top: -120,
            width: 420,
            height: 1320,
            transform: 'rotate(6.3deg)',
            borderRadius: 60,
            background: 'linear-gradient(100deg, rgba(255,255,255,0.55), rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.5))',
            backdropFilter: 'blur(22px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 30px 80px rgba(38,37,34,0.18), inset 0 0 0 1px rgba(255,255,255,0.4)',
          }}
        >
          <div style={{position: 'absolute', left: 40, top: 0, bottom: 0, width: 3, background: 'rgba(255,255,255,0.9)', filter: 'blur(1px)'}} />
          <div style={{position: 'absolute', right: 70, top: 0, bottom: 0, width: 1.5, background: 'rgba(204,120,92,0.5)'}} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Orb: React.FC<{x: number; y: number; r: number; color: string}> = ({x, y, r, color}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(closest-side, ${color}, rgba(250,249,246,0))`}} />
);

const Constellation: React.FC<{f: number; exit: number}> = ({f, exit}) => {
  const cx = 1330;
  const cy = 560;
  const R = 760 * (1 + exit * 0.2);
  const a = f / 160;
  const tilt = 0.35;
  const proj = NODES.map((n) => {
    const x1 = n.x * Math.cos(a) + n.z * Math.sin(a);
    const z1 = -n.x * Math.sin(a) + n.z * Math.cos(a);
    const y1 = n.y * Math.cos(tilt) - z1 * Math.sin(tilt);
    const z2 = n.y * Math.sin(tilt) + z1 * Math.cos(tilt);
    const s = 1 / (1.9 - z2 * 0.5);
    return {x: cx + x1 * R * s * 1.4, y: cy + y1 * R * s * 1.4, z: z2, s};
  });
  const appear = ramp(f, [20, 100], [0, 1], E.out);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: appear * (1 - exit)}}>
      {EDGES.map(([i, j], k) => {
        const p = ramp(f, [30 + k * 1.2, 70 + k * 1.2]);
        const A = proj[i];
        const B = proj[j];
        const depth = (A.z + B.z) / 2;
        return <line key={k} x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p} stroke={C.ink} strokeOpacity={0.12 + (depth + 1) * 0.08} strokeWidth={1.3} />;
      })}
      {EDGES.filter((_, k) => k % 3 === 0).map(([i, j], k) => {
        const t = ((f + k * 23) % 90) / 90;
        const A = proj[i];
        const B = proj[j];
        return <circle key={k} cx={A.x + (B.x - A.x) * t} cy={A.y + (B.y - A.y) * t} r={3} fill={C.terra} opacity={Math.sin(t * Math.PI) * 0.9} />;
      })}
      {proj.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={(3 + p.s * 6) * spr(0 + f, 30 + i * 3, SPR.pop)} fill={i % 5 === 0 ? C.terra : '#fff'} stroke={C.ink} strokeOpacity={0.35} strokeWidth={1.2} />
      ))}
    </svg>
  );
};

const SemileGlyph: React.FC<{size: number; f: number}> = ({size, f}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r={44} fill={C.ink} />
    <circle r={26} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="120 44" transform={`rotate(${f * 1.5})`} />
    <circle r={8} fill={C.terra} />
  </svg>
);

const Identity: React.FC<{f: number; exit: number}> = ({f, exit}) => {
  const p = spr(f, 96, SPR.gentle);
  return (
    <div style={{marginTop: 44, display: 'flex', alignItems: 'center', gap: 16, opacity: p * (1 - exit), transform: `translateY(${(1 - p) * 20}px)`}}>
      <SemileGlyph size={58} f={f} />
      <div>
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 26, letterSpacing: '0.04em', color: C.ink}}>SEMILE AI</div>
        <div style={{fontFamily: F.mono, fontSize: 13, letterSpacing: '0.12em', color: C.ink3, marginTop: 2}}>MODEL IDENTITY</div>
      </div>
      <div
        style={{
          marginLeft: 12,
          padding: '10px 18px',
          borderRadius: 30,
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: shadow.soft,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: '0.06em',
          color: C.ink,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{width: 8, height: 8, borderRadius: 4, background: C.terra}} />
        Mile Oneace 1.0
      </div>
    </div>
  );
};

const ChatCard: React.FC<{f: number; exit: number}> = ({f, exit}) => {
  const p = spr(f, 24, SPR.gentle);
  const R = CHAT_RECT;
  const n = Math.floor(ramp(f, [STREAM.start, STREAM.end], [0, AI_WORDS.length], E.linear));
  const streaming = f >= STREAM.start - 20 && f < STREAM.end + 10;
  const thinking = f >= 118 && f < STREAM.start;
  const content = 1 - ramp(f, [376, 404], [0, 1], E.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: R.r,
        background: `rgba(255,255,255,${lerp(exit, 0.55, 1)})`,
        backdropFilter: 'blur(28px) saturate(1.25)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.25)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: `${shadow.float}, inset 0 1px 0 rgba(255,255,255,0.9)`,
        transform: `translateY(${(1 - p) * 80}px) scale(${0.96 + 0.04 * p})`,
        opacity: Math.min(1, p * 1.4),
        overflow: 'hidden',
        fontFamily: F.sans,
        color: C.ink,
      }}
    >
      <div style={{opacity: content}}>
        {/* header */}
        <div style={{height: 82, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: '1px solid rgba(38,37,34,0.07)'}}>
          <SemileGlyph size={40} f={f} />
          <div style={{fontSize: 19, fontWeight: 650}}>Semile AI</div>
          <div style={{fontFamily: F.mono, fontSize: 12.5, padding: '6px 12px', borderRadius: 20, background: 'rgba(38,37,34,0.05)', color: C.ink2, letterSpacing: '0.06em'}}>Mile Oneace 1.0</div>
          <div style={{marginLeft: 'auto', fontFamily: F.mono, fontSize: 11, letterSpacing: '0.1em', color: C.ink3}}>KONSEP UI</div>
        </div>
        {/* user */}
        <Appear f={f} at={70} style={{display: 'flex', justifyContent: 'flex-end', padding: '32px 28px 0'}}>
          <div style={{maxWidth: 520, padding: '16px 20px', borderRadius: 22, borderBottomRightRadius: 6, background: C.terra, color: '#fff', fontSize: 20, lineHeight: 1.4}}>
            <Typed text={USER_TEXT} f={f} start={74} />
          </div>
        </Appear>
        {/* AI */}
        <Appear f={f} at={116} style={{display: 'flex', gap: 14, padding: '28px 28px 0'}}>
          <div style={{flexShrink: 0, marginTop: 2}}>
            <SemileGlyph size={34} f={f} />
          </div>
          <div style={{flex: 1}}>
            {thinking ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: C.ink3, height: 34}}>
                <ISpark size={18} color={C.terra} style={{transform: `rotate(${f * 3}deg)`}} />
                Menganalisis 12 node…
              </div>
            ) : (
              <div style={{fontSize: 21, lineHeight: 1.55, letterSpacing: '-0.005em'}}>
                {AI_WORDS.map((w, i) => {
                  const o = ramp(f, [STREAM.start + (i / AI_WORDS.length) * (STREAM.end - STREAM.start), STREAM.start + (i / AI_WORDS.length) * (STREAM.end - STREAM.start) + 8]);
                  return (
                    <React.Fragment key={i}>
                      <span style={{opacity: o, filter: o < 1 ? `blur(${(1 - o) * 3}px)` : undefined}}>{w}</span>
                      {i === n - 1 && streaming ? (
                        <span style={{display: 'inline-block', width: 0, position: 'relative'}}>
                          <span style={{position: 'absolute', left: 4, top: -18, width: 10, height: 10, borderRadius: 5, background: C.terra, opacity: 0.6 + 0.4 * Math.sin(f / 4)}} />
                        </span>
                      ) : null}{' '}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            {/* kartu data */}
            <Appear f={f} at={300} style={{marginTop: 22}}>
              <div style={{display: 'flex', gap: 12}}>
                {[
                  ['SG-01', 0.86],
                  ['SG-02', 0.41],
                  ['JKT-01', 0.83],
                ].map(([nm, v], i) => (
                  <div key={i} style={{flex: 1, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(38,37,34,0.07)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 13}}>
                      <span>{nm}</span>
                      <span style={{color: (v as number) > 0.8 ? C.terra : C.green}}>{Math.round((v as number) * 100 * ramp(f, [304 + i * 6, 350 + i * 6], [0, 1], E.out))}%</span>
                    </div>
                    <div style={{marginTop: 10, height: 6, borderRadius: 3, background: C.gray}}>
                      <div style={{width: `${(v as number) * 100 * ramp(f, [304 + i * 6, 350 + i * 6], [0, 1], E.out)}%`, height: 6, borderRadius: 3, background: (v as number) > 0.8 ? C.terra : C.green}} />
                    </div>
                  </div>
                ))}
              </div>
            </Appear>
            <Appear f={f} at={330} style={{marginTop: 18, display: 'flex', gap: 10}}>
              {['Ya, jadwalkan', 'Lihat detail node'].map((t, i) => (
                <div key={i} style={{padding: '10px 16px', borderRadius: 14, fontSize: 15, fontWeight: 560, background: i === 0 ? C.ink : 'rgba(255,255,255,0.75)', color: i === 0 ? '#fff' : C.ink, border: '1px solid rgba(38,37,34,0.08)'}}>
                  {t}
                </div>
              ))}
            </Appear>
          </div>
        </Appear>
        {/* input */}
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(38,37,34,0.07)', display: 'flex', alignItems: 'center', padding: '0 12px 0 22px', fontSize: 17, color: C.ink3}}>
          Tanya Semile…
          <div style={{marginLeft: 'auto', width: 44, height: 44, borderRadius: 14, background: C.terra, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <ISend size={20} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Appear: React.FC<{f: number; at: number; style?: React.CSSProperties; children: React.ReactNode}> = ({f, at, style, children}) => {
  const p = spr(f, at, SPR.gentle);
  if (f < at) return null;
  return <div style={{...style, opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 18}px)`}}>{children}</div>;
};

const Typed: React.FC<{text: string; f: number; start: number}> = ({text, f, start}) => {
  const n = Math.floor(ramp(f, [start, start + text.length * 0.9], [0, text.length], E.linear));
  return (
    <span>
      {text.slice(0, n)}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
    </span>
  );
};

