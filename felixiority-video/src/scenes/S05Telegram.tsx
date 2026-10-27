import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {E, lerp, ramp, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {Kicker, RevealText} from '../components/Text';
import {MotionBlur} from '../components/MotionBlur';
import {IBell, ICpu, IBroom, ISend, IServer, ICheck} from '../components/Icons';
import {Cursor} from '../components/Cursor';

/* ---------------------------------------------------------------- konstanta */
const PHONE = {x: 150, y: 110, w: 470, h: 860};
const BOT = {x: 850, y: 700};
const CORE = {x: 1170, y: 700};
const SERVERS = [
  {x: 1580, y: 560, name: 'nara-mc'},
  {x: 1580, y: 700, name: 'felix-02'},
  {x: 1580, y: 840, name: 'bot-api'},
];
const PATHS = {
  phone: `M ${PHONE.x + PHONE.w} 700 C 700 700 740 ${BOT.y} ${BOT.x - 40} ${BOT.y}`,
  core: `M ${BOT.x + 40} ${BOT.y} C 980 ${BOT.y} 1020 ${CORE.y} ${CORE.x - 64} ${CORE.y}`,
  s0: `M ${CORE.x + 64} ${CORE.y} C 1330 ${CORE.y} 1330 ${SERVERS[0].y} ${SERVERS[0].x - 120} ${SERVERS[0].y}`,
  s1: `M ${CORE.x + 64} ${CORE.y} C 1330 ${CORE.y} 1330 ${SERVERS[1].y} ${SERVERS[1].x - 120} ${SERVERS[1].y}`,
  s2: `M ${CORE.x + 64} ${CORE.y} C 1330 ${CORE.y} 1330 ${SERVERS[2].y} ${SERVERS[2].x - 120} ${SERVERS[2].y}`,
};
const LEN = Object.fromEntries(Object.entries(PATHS).map(([k, d]) => [k, getLength(d)])) as Record<keyof typeof PATHS, number>;

/** Arus data: [path, start, durasi, arah(1 maju / -1 balik)] */
const FLOWS: [keyof typeof PATHS, number, number, 1 | -1][] = [
  ['phone', 44, 34, 1],
  ['core', 62, 34, 1],
  ['phone', 140, 30, 1],
  ['phone', 200, 30, 1],
  ['core', 218, 30, 1],
  ['s1', 236, 30, 1],
  ['s0', 316, 34, -1],
  ['s1', 316, 34, -1],
  ['s2', 316, 34, -1],
  ['core', 344, 30, -1],
  ['phone', 362, 30, -1],
];

const TOASTS = [
  {at: 278, Icon: IServer, title: 'Server felix-02 online', sub: 'Node SG-01 · 4 GB RAM', tone: C.green},
  {at: 336, Icon: ICpu, title: 'Monitoring aktif', sub: 'CPU 23% · RAM 1,2 GB', tone: C.terra},
  {at: 392, Icon: IBroom, title: 'Pembersihan otomatis', sub: '3 server kedaluwarsa dihapus', tone: C.ink},
];
const TOAST = {x: 1430, w: 380, h: 88, y0: 112};

export const S05Telegram: React.FC = () => {
  const f = useCurrentFrame();

  // wipe pesawat kertas (kanan → kiri)
  const wipe = ramp(f, [0, 42], [0, 1], E.inOut);
  const edge = lerp(wipe, 2250, -350);
  const edgePrev = lerp(ramp(f - 1, [0, 42], [0, 1], E.inOut), 2250, -350);
  const clip = wipe < 1 ? `polygon(${edge + 160}px 0, 2200px 0, 2200px 1080px, ${edge - 160}px 1080px)` : undefined;

  // keluar: toast terakhir membesar memenuhi layar
  const grow = ramp(f, [440, 486], [0, 1], E.snap);
  const lastToastY = TOAST.y0 + 2 * (TOAST.h + 14);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: C.warm, clipPath: clip}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 45% 50% at 70% 64%, rgba(204,120,92,0.08), rgba(250,249,246,0) 70%)'}} />
        <div style={{position: 'absolute', left: 760, top: 120}}>
          <Kicker f={f} start={30} n="05" label="TELEGRAM AUTOMATION" />
          <div style={{marginTop: 22}}>
            <RevealText text="Automation" f={f} start={40} size={100} />
            <RevealText text="*That Works.*" f={f} start={52} size={100} />
          </div>
        </div>
        <FlowDiagram f={f} />
        <Phone f={f} />
        <Toasts f={f} grow={grow} />
        <Cursor
          f={f}
          show={[100, 214]}
          presses={[130, 190]}
          keys={[
            [100, 760, 980],
            [124, PHONE.x + 110, 0],
            [134, PHONE.x + 114, 0],
            [182, PHONE.x + 240, 0],
            [214, PHONE.x + 380, 1000],
          ].map(([fr, x, y]) => [fr, x, y || tapY(fr)] as [number, number, number])}
        />
      </AbsoluteFill>

      {/* pesawat kertas yang melintas dekat kamera */}
      {wipe > 0 && wipe < 1 ? (
        <MotionBlur vx={edge - edgePrev} shutter={0.18} max={12} style={{position: 'absolute', left: 0, top: 0}}>
          <div style={{position: 'absolute', left: edge - 260, top: 380 - wipe * 140, transform: `rotate(${-14 + wipe * 10}deg) scale(1.6)`}}>
            <PaperPlane />
          </div>
          <div style={{position: 'absolute', left: edge + 200, top: 520 - wipe * 140, width: 900, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.terra}, rgba(204,120,92,0))`, transform: `rotate(${-8 + wipe * 6}deg)`, transformOrigin: '0 50%'}} />
        </MotionBlur>
      ) : null}

      {/* toast → layar penuh (match ke kanvas Scene 06) */}
      {grow > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: lerp(grow, TOAST.x, -4),
            top: lerp(grow, lastToastY, -4),
            width: lerp(grow, TOAST.w, 1928),
            height: lerp(grow, TOAST.h, 1088),
            borderRadius: lerp(grow, 18, 0),
            background: C.white,
            boxShadow: shadow.float,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** posisi y tombol untuk kursor (mengikuti scroll chat) */
const tapY = (fr: number) => (fr < 160 ? 384 : 612);

const PaperPlane: React.FC = () => (
  <svg width="260" height="200" viewBox="0 0 260 200" style={{overflow: 'visible', filter: 'drop-shadow(0 30px 30px rgba(38,37,34,0.25))'}}>
    <path d="M10 95 L250 10 L120 130 Z" fill="#FFFFFF" stroke="rgba(38,37,34,0.15)" />
    <path d="M120 130 L250 10 L170 190 Z" fill="#EFEDE8" stroke="rgba(38,37,34,0.15)" />
    <path d="M120 130 L135 180 L150 150 Z" fill={C.terraDeep} />
    <path d="M10 95 L120 130 L135 180 Z" fill={C.terra} />
  </svg>
);

/* ------------------------------------------------------------------- phone */
type Msg = {at: number; h: number; side: 'bot' | 'user'; node: (f: number) => React.ReactNode};

const Bubble: React.FC<{side: 'bot' | 'user'; children: React.ReactNode; w?: number}> = ({side, children, w}) => (
  <div
    style={{
      maxWidth: 330,
      width: w,
      padding: '13px 16px',
      borderRadius: 18,
      borderBottomLeftRadius: side === 'bot' ? 6 : 18,
      borderBottomRightRadius: side === 'user' ? 6 : 18,
      background: side === 'user' ? C.terra : C.white,
      color: side === 'user' ? '#fff' : C.ink,
      fontSize: 17,
      lineHeight: 1.35,
      boxShadow: side === 'bot' ? shadow.soft : undefined,
      border: side === 'bot' ? `1px solid ${C.line}` : undefined,
    }}
  >
    {children}
  </div>
);

const KeyBtn: React.FC<{label: string; pressed?: number; selected?: boolean}> = ({label, pressed = 0, selected}) => (
  <div
    style={{
      height: 46,
      borderRadius: 12,
      background: selected ? C.ink : 'rgba(255,255,255,0.92)',
      color: selected ? '#fff' : C.ink,
      border: `1px solid ${selected ? C.ink : C.line}`,
      fontSize: 15,
      fontWeight: 560,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${1 - pressed * 0.06})`,
      boxShadow: shadow.soft,
    }}
  >
    {label}
  </div>
);

const pressAmt = (f: number, at: number) => (f >= at - 5 && f <= at + 8 ? 1 - Math.abs(f - at) / 8 : 0);

const MSGS: Msg[] = [
  {at: 40, h: 50, side: 'user', node: () => <Bubble side="user">/start</Bubble>},
  {
    at: 84,
    h: 76,
    side: 'bot',
    node: () => (
      <Bubble side="bot">
        Halo, Felix! Mau kelola apa <br />
        hari ini?
      </Bubble>
    ),
  },
  {
    at: 92,
    h: 102,
    side: 'bot',
    node: (f) => (
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 400}}>
        <KeyBtn label="Order Panel" pressed={pressAmt(f, 130)} selected={f > 130} />
        <KeyBtn label="Cek Server" />
        <KeyBtn label="Status Node" />
        <KeyBtn label="Bantuan" />
      </div>
    ),
  },
  {at: 148, h: 50, side: 'bot', node: () => <Bubble side="bot">Pilih paket panel:</Bubble>},
  {
    at: 154,
    h: 154,
    side: 'bot',
    node: (f) => (
      <div style={{display: 'grid', gap: 8, width: 400}}>
        <KeyBtn label="1 GB · Rp5.000" />
        <KeyBtn label="4 GB · Rp12.000" pressed={pressAmt(f, 190)} selected={f > 190} />
        <KeyBtn label="Unlimited · Rp25.000" />
      </div>
    ),
  },
  {
    at: 210,
    h: 92,
    side: 'bot',
    node: (f) => (
      <Bubble side="bot" w={330}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <span>Memproses pesanan…</span>
          <span style={{fontFamily: F.mono, fontSize: 14, color: C.ink3}}>{Math.round(ramp(f, [214, 262]) * 100)}%</span>
        </div>
        <div style={{marginTop: 10, height: 6, borderRadius: 3, background: C.gray}}>
          <div style={{width: `${ramp(f, [214, 262], [0, 100], E.inOut)}%`, height: 6, borderRadius: 3, background: C.terra}} />
        </div>
      </Bubble>
    ),
  },
  {
    at: 268,
    h: 196,
    side: 'bot',
    node: (f) => (
      <Bubble side="bot" w={330}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 650}}>
          <span style={{width: 26, height: 26, borderRadius: 13, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <ICheck size={15} color="#fff" stroke={3} />
          </span>
          Server felix-02 aktif
        </div>
        <div style={{marginTop: 12, fontFamily: F.mono, fontSize: 13.5, color: C.ink2, lineHeight: 1.7}}>
          RAM 4 GB · Node SG-01
          <br />
          Login: felix · Panel siap
        </div>
        <div style={{marginTop: 12, height: 42, borderRadius: 11, background: C.terra, color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + Math.sin(ramp(f, [290, 310]) * Math.PI) * 0.04})`}}>
          Buka Panel
        </div>
      </Bubble>
    ),
  },
];

const Phone: React.FC<{f: number}> = ({f}) => {
  const p = spr(f, 10, SPR.gentle);
  const areaH = PHONE.h - 84 - 74;
  const gap = 10;
  let y = 0;
  const placed = MSGS.map((m) => {
    const vis = ramp(f, [m.at, m.at + 18], [0, 1], E.out);
    const top = y;
    y += (m.h + gap) * vis;
    return {m, vis, top};
  });
  const scroll = Math.max(0, y - areaH + 16);
  const typing = (f > 66 && f < 84) || (f > 136 && f < 148) || (f > 198 && f < 210) || (f > 256 && f < 268);
  return (
    <div
      style={{
        position: 'absolute',
        left: PHONE.x,
        top: PHONE.y,
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: 46,
        background: '#F3F1EC',
        border: `10px solid ${C.white}`,
        boxShadow: shadow.float,
        overflow: 'hidden',
        fontFamily: F.sans,
        transform: `translateY(${(1 - p) * 120}px) rotate(${(1 - p) * -4}deg)`,
        boxSizing: 'border-box',
      }}
    >
      {/* header */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 84, background: C.white, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, zIndex: 2}}>
        <div style={{width: 46, height: 46, borderRadius: 23, background: C.purpleSoft, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile('brand/felixiority-cutout.png')} style={{width: 44, height: 44}} />
        </div>
        <div>
          <div style={{fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em'}}>Felixiority Bot</div>
          <div style={{fontSize: 13, color: typing ? C.terra : C.ink3}}>{typing ? 'mengetik…' : 'bot · online'}</div>
        </div>
        <div style={{marginLeft: 'auto', fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: '0.08em'}}>KONSEP UI</div>
      </div>
      {/* messages */}
      <div style={{position: 'absolute', left: 16, right: 16, top: 84 + 14, height: areaH, overflow: 'hidden'}}>
        {placed.map(({m, vis, top}, i) =>
          vis > 0 ? (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: top - scroll,
                display: 'flex',
                justifyContent: m.side === 'user' ? 'flex-end' : 'flex-start',
                opacity: vis,
                transform: `translateY(${(1 - vis) * 16}px) scale(${0.9 + 0.1 * vis})`,
                transformOrigin: m.side === 'user' ? '100% 100%' : '0% 100%',
              }}
            >
              {m.node(f)}
            </div>
          ) : null,
        )}
        {typing ? (
          <div style={{position: 'absolute', left: 0, top: y - scroll, display: 'flex', gap: 5, padding: '14px 16px', borderRadius: 16, background: C.white, border: `1px solid ${C.line}`}}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{width: 7, height: 7, borderRadius: 4, background: C.ink3, transform: `translateY(${Math.sin((f - k * 4) / 4) * 2.5}px)`}} />
            ))}
          </div>
        ) : null}
      </div>
      {/* input */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: C.white, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12}}>
        <div style={{flex: 1, height: 44, borderRadius: 22, background: C.gray, fontSize: 15, color: C.ink3, display: 'flex', alignItems: 'center', padding: '0 18px'}}>Ketik pesan…</div>
        <div style={{width: 44, height: 44, borderRadius: 22, background: C.terra, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <ISend size={20} color="#fff" />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ flow diagram */
const FlowDiagram: React.FC<{f: number}> = ({f}) => {
  const draw = (k: keyof typeof PATHS, s: number) => ramp(f, [s, s + 40], [0, 1], E.inOut);
  const s1Online = f > 262;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {(Object.keys(PATHS) as (keyof typeof PATHS)[]).map((k, i) => {
          const p = draw(k, 34 + i * 6);
          return <path key={k} d={PATHS[k]} fill="none" stroke={C.ink} strokeOpacity={0.16} strokeWidth={1.6} strokeDasharray={`${LEN[k] * p} 9999`} />;
        })}
        {FLOWS.map(([k, s, d, dir], i) =>
          [0, 1, 2, 3, 4].map((n) => {
            const t = (f - s - n * 4) / d;
            if (t < 0 || t > 1) return null;
            const e = E.inOut(t);
            const pt = getPointAtLength(PATHS[k], LEN[k] * (dir === 1 ? e : 1 - e));
            if (!pt) return null;
            return <circle key={`${i}-${n}`} cx={pt.x} cy={pt.y} r={n === 0 ? 5 : 3.5 - n * 0.5} fill={C.terra} opacity={1 - n * 0.18} />;
          }),
        )}
      </svg>
      <Node f={f} at={40} x={BOT.x} y={BOT.y} label="Bot" active={pulseOn(f, ['core', 'phone'])}>
        <div style={{width: 80, height: 80, borderRadius: 40, background: C.white, border: `1px solid ${C.line}`, boxShadow: shadow.card, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <ISend size={30} color={C.terra} />
        </div>
      </Node>
      <Node f={f} at={48} x={CORE.x} y={CORE.y} label="Felixiority Core" active={pulseOn(f, ['core', 's0', 's1', 's2'])}>
        <div style={{width: 128, height: 128, borderRadius: 32, background: C.ink, boxShadow: shadow.float, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile('brand/felixiority-cutout.png')} style={{width: 92, height: 92}} />
        </div>
      </Node>
      {SERVERS.map((s, i) => {
        const p = spr(f, 56 + i * 6, SPR.gentle);
        const status = i === 1 ? (f < 236 ? 'Menunggu' : s1Online ? 'Online' : 'Provisioning') : 'Online';
        const col = status === 'Online' ? C.green : status === 'Provisioning' ? C.terra : C.ink3;
        const flash = i === 1 ? Math.sin(ramp(f, [262, 290]) * Math.PI) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x - 120,
              top: s.y - 42,
              width: 240,
              height: 84,
              borderRadius: 18,
              background: C.white,
              border: `1px solid ${flash > 0.05 ? C.green : C.line}`,
              boxShadow: flash > 0.05 ? `0 0 0 ${6 * flash}px rgba(94,156,110,0.15), ${shadow.card}` : shadow.card,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 18px',
              fontFamily: F.sans,
              opacity: p,
              transform: `translateX(${(1 - p) * 60}px) scale(${1 + flash * 0.04})`,
            }}
          >
            <IServer size={24} color={C.ink} />
            <div>
              <div style={{fontFamily: F.mono, fontSize: 15, fontWeight: 600}}>{s.name}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: col, marginTop: 3, fontWeight: 500}}>
                <span style={{width: 7, height: 7, borderRadius: 4, background: col, opacity: status === 'Provisioning' ? 0.4 + 0.6 * Math.abs(Math.sin(f / 6)) : 1}} />
                {status}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const pulseOn = (f: number, keys: (keyof typeof PATHS)[]) =>
  FLOWS.some(([k, s, d]) => keys.includes(k) && f >= s && f <= s + d + 16);

const Node: React.FC<{f: number; at: number; x: number; y: number; label: string; active: boolean; children: React.ReactNode}> = ({f, at, x, y, label, active, children}) => {
  const p = spr(f, at, SPR.pop);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p * (active ? 1.04 : 1)})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {children}
      <div style={{position: 'absolute', top: '100%', marginTop: 14, fontFamily: F.mono, fontSize: 13, letterSpacing: '0.1em', color: active ? C.terra : C.ink2, whiteSpace: 'nowrap'}}>{label.toUpperCase()}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ toasts */
const Toasts: React.FC<{f: number; grow: number}> = ({f, grow}) => (
  <>
    {TOASTS.map((t, i) => {
      const p = spr(f, t.at, SPR.pop);
      if (f < t.at) return null;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: TOAST.x,
            top: TOAST.y0 + i * (TOAST.h + 14),
            width: TOAST.w,
            height: TOAST.h,
            borderRadius: 18,
            background: C.white,
            border: `1px solid ${C.line}`,
            boxShadow: shadow.float,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 18px',
            boxSizing: 'border-box',
            fontFamily: F.sans,
            opacity: Math.min(1, p) * (i === 2 ? 1 - grow : 1),
            transform: `translateX(${(1 - p) * 120}px)`,
          }}
        >
          <div style={{width: 44, height: 44, borderRadius: 12, background: C.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
            <t.Icon size={22} color={t.tone} />
            <span style={{position: 'absolute', right: -3, top: -3, width: 12, height: 12, borderRadius: 6, background: C.terra, border: '2px solid #fff'}} />
          </div>
          <div>
            <div style={{fontSize: 16.5, fontWeight: 620, letterSpacing: '-0.01em'}}>{t.title}</div>
            <div style={{fontSize: 14, color: C.ink2, marginTop: 2}}>{t.sub}</div>
          </div>
          <IBell size={18} color={C.ink3} style={{marginLeft: 'auto', alignSelf: 'flex-start', marginTop: 18}} />
        </div>
      );
    })}
  </>
);
