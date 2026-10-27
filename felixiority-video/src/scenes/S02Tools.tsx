import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {E, expLerp, kf, lerp, ramp, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {PANEL_RECT, S2_LIVE_DOT} from '../lib/layout';
import {S1_DOT} from './S01Awakening';
import {Counter, Kicker, RevealText} from '../components/Text';
import {IBroom, IPulse, IServer, IUsers, IArrow, ICheck, ILayers, IBox, IGlobe} from '../components/Icons';
import {Cursor} from '../components/Cursor';

const FEATURES = [
  {label: 'Server Management', sub: 'Buat, mulai, hentikan', Icon: IServer, at: 120},
  {label: 'Real-Time Monitoring', sub: 'CPU, RAM, jaringan', Icon: IPulse, at: 185},
  {label: 'User Management', sub: 'Akses & peran', Icon: IUsers, at: 250},
  {label: 'Automation & Cleanup', sub: 'Tugas terjadwal', Icon: IBroom, at: 315},
];

const DASH = {x: 820, y: 175, w: 1000, h: 720};
const BTN = {x: 776, y: 640, w: 180, h: 40}; // dalam koordinat dashboard

const activeIndex = (f: number) => {
  let a = -1;
  FEATURES.forEach((ft, i) => {
    if (f >= ft.at) a = i;
  });
  return f > 375 ? -1 : a;
};

export const S02Tools: React.FC = () => {
  const f = useCurrentFrame();

  // ---- lingkaran terracotta dari Scene 01 mengecil menjadi titik live
  const shrink = ramp(f, [0, 36], [0, 1], E.inOut);
  const coverR = expLerp(shrink, 2300, 6);
  const coverX = lerp(E.inOut(shrink), S1_DOT.x, S2_LIVE_DOT.x);
  const coverY = lerp(E.inOut(shrink), S1_DOT.y, S2_LIVE_DOT.y);

  // ---- kamera dashboard
  const flat = ramp(f, [372, 412], [0, 1], E.inOut);
  const act = activeIndex(f);
  const focusRY = [-4, 6, -8, 4];
  const orbitBase = kf(f, [
    [0, -34],
    [90, -16],
    [370, -11],
  ], E.out);
  let focusOffset = 0;
  FEATURES.forEach((ft, i) => {
    const on = ramp(f, [ft.at, ft.at + 40], [0, 1], E.inOut) - (i < 3 ? ramp(f, [FEATURES[i + 1].at, FEATURES[i + 1].at + 40], [0, 1], E.inOut) : ramp(f, [372, 400], [0, 1], E.inOut));
    focusOffset += on * focusRY[i];
  });
  const rotY = lerp(flat, orbitBase + focusOffset, 0);
  const rotX = lerp(flat, kf(f, [[0, 18], [100, 9], [370, 6]], E.out), 0);
  const dashIn = spr(f, 8, SPR.gentle);
  const dashZ = lerp(flat, (1 - dashIn) * -900, 0);
  const exit = ramp(f, [428, 466], [0, 1], E.inOut);

  // ---- tombol CTA → kartu yang membesar menjadi kontainer Scene 03
  const grow = ramp(f, [426, 470], [0, 1], E.snap);
  const btnScreen = {x: DASH.x + BTN.x, y: DASH.y + BTN.y, w: BTN.w, h: BTN.h};
  const pressAt = 418;
  const btnPress = f >= pressAt - 4 && f <= pressAt + 8 ? 1 - Math.abs(f - pressAt) / 8 : 0;

  return (
    <AbsoluteFill style={{background: C.warm, overflow: 'hidden'}}>
      {/* soft ambient */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 60% at 72% 50%, rgba(204,120,92,0.07), rgba(250,249,246,0) 70%)'}} />

      {/* ---- Kolom kiri */}
      <div style={{position: 'absolute', left: 120, top: 150, width: 640}}>
        <LivePill f={f} />
        <Kicker f={f} start={30} out={398} n="02" label="FELIXIORITY TOOLS" style={{marginTop: 40}} />
        <div style={{marginTop: 26}}>
          <RevealText text="Manage Everything." f={f} start={42} out={402} size={92} />
          <RevealText text="*Effortlessly.*" f={f} start={56} out={406} size={92} />
        </div>
        <div style={{marginTop: 28, width: 560}}>
          <RevealText
            text="Platform manajemen infrastruktur Pterodactyl — server, node, dan pengguna dalam satu kendali."
            f={f}
            start={72}
            out={408}
            stagger={1.4}
            size={24}
            font="sans"
            weight={400}
            color={C.ink2}
            tracking="-0.01em"
            lineHeight={1.4}
          />
        </div>
        <FeatureList f={f} act={act} />
      </div>

      {/* ---- Dashboard 3D */}
      <div
        style={{
          position: 'absolute',
          left: DASH.x,
          top: DASH.y,
          width: DASH.w,
          height: DASH.h,
          perspective: 2400,
          perspectiveOrigin: '50% 50%',
          opacity: 1 - exit,
          filter: exit > 0.02 ? `blur(${exit * 10}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${dashZ - exit * 300}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          <Dashboard f={f} act={act} flat={flat} btnPress={btnPress} />
        </div>
      </div>

      <Cursor
        f={f}
        show={[372, 436]}
        presses={[pressAt]}
        keys={[
          [372, 1500, 1010],
          [412, btnScreen.x + 120, btnScreen.y + 26],
          [440, btnScreen.x + 128, btnScreen.y + 30],
        ]}
      />

      {/* kartu yang tumbuh */}
      {grow > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: lerp(grow, btnScreen.x, PANEL_RECT.x),
            top: lerp(grow, btnScreen.y, PANEL_RECT.y),
            width: lerp(grow, btnScreen.w, PANEL_RECT.w),
            height: lerp(grow, btnScreen.h, PANEL_RECT.h),
            borderRadius: lerp(grow, 12, PANEL_RECT.r),
            background: mixColor(C.terra, '#FFFFFF', ramp(grow, [0.15, 0.6], [0, 1], E.linear)),
            boxShadow: shadow.float,
            border: `1px solid rgba(38,37,34,${0.08 * grow})`,
          }}
        />
      ) : null}

      {/* lingkaran penutup */}
      {shrink < 1 ? (
        <div style={{position: 'absolute', left: coverX - coverR, top: coverY - coverR, width: coverR * 2, height: coverR * 2, borderRadius: '50%', background: C.terra}} />
      ) : null}
    </AbsoluteFill>
  );
};

export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const LivePill: React.FC<{f: number}> = ({f}) => {
  const w = ramp(f, [30, 70], [0, 1], E.out);
  const out = ramp(f, [396, 420], [0, 1], E.in);
  const pulse = (f % 60) / 60;
  return (
    <div style={{display: 'flex', alignItems: 'center', height: 42, opacity: 1 - out}}>
      <div style={{position: 'relative', width: 42, height: 42}}>
        <div style={{position: 'absolute', left: 21 - 6, top: 21 - 6, width: 12, height: 12, borderRadius: 6, background: C.terra}} />
        {f > 36 ? (
          <div
            style={{
              position: 'absolute',
              left: 21 - 6 - pulse * 12,
              top: 21 - 6 - pulse * 12,
              width: 12 + pulse * 24,
              height: 12 + pulse * 24,
              borderRadius: '50%',
              border: `1.5px solid ${C.terra}`,
              opacity: 1 - pulse,
            }}
          />
        ) : null}
      </div>
      <div style={{overflow: 'hidden', width: 360 * w, whiteSpace: 'nowrap', fontFamily: F.mono, fontSize: 15, letterSpacing: '0.1em', color: C.ink2}}>
        LIVE · <Counter f={f} start={40} to={128} /> SERVER BERJALAN
      </div>
    </div>
  );
};

const FeatureList: React.FC<{f: number; act: number}> = ({f, act}) => {
  const rowH = 74;
  // pill highlight yang berpindah (shared element)
  let hy = 0;
  FEATURES.forEach((ft, i) => {
    if (i > 0) hy += ramp(f, [ft.at, ft.at + 26], [0, rowH], E.inOut);
  });
  const hOn = ramp(f, [FEATURES[0].at - 8, FEATURES[0].at + 18], [0, 1], E.out) * (1 - ramp(f, [372, 396], [0, 1], E.in));
  return (
    <div style={{position: 'relative', marginTop: 46}}>
      <div
        style={{
          position: 'absolute',
          left: -16,
          top: hy - 7,
          width: 560,
          height: rowH - 6,
          borderRadius: 16,
          background: C.white,
          boxShadow: shadow.card,
          opacity: hOn,
          transform: `scale(${0.96 + hOn * 0.04})`,
        }}
      />
      {FEATURES.map((ft, i) => {
        const s = 96 + i * 8;
        const p = spr(f, s, SPR.snappy);
        const o = ramp(f, [404 + i * 3, 430 + i * 3], [0, 1], E.in);
        const on = act === i ? ramp(f, [ft.at, ft.at + 16]) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              height: rowH,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 18,
              opacity: p * (1 - o),
              transform: `translateX(${(1 - p) * -40 + o * -40}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: on > 0.5 ? C.terra : C.gray,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: on > 0.5 ? '#fff' : C.ink,
                transform: `scale(${1 + Math.sin(on * Math.PI) * 0.12})`,
              }}
            >
              <ft.Icon size={22} />
            </div>
            <div>
              <div style={{fontFamily: F.sans, fontSize: 23, fontWeight: 560, color: C.ink, letterSpacing: '-0.015em', lineHeight: '26px'}}>{ft.label}</div>
              <div style={{fontFamily: F.sans, fontSize: 16, color: C.ink3, marginTop: 3}}>{ft.sub}</div>
            </div>
            <div style={{marginLeft: 'auto', marginRight: 10, marginTop: 12, opacity: on, color: C.terra, transform: `translateX(${(1 - on) * -10}px)`}}>
              <IArrow size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- Dashboard */

const Card: React.FC<{
  f: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  flat: number;
  focus?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({f, at, x, y, w, h, z, flat, focus = 0, children, style}) => {
  const p = spr(f, at, SPR.gentle);
  const zz = lerp(flat, z + (1 - p) * 500 + focus * 50, 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 18,
        background: C.white,
        border: `1px solid ${focus > 0.01 ? `rgba(204,120,92,${0.25 + focus * 0.6})` : C.line}`,
        boxShadow: focus > 0.01 ? `0 0 0 ${4 * focus}px rgba(204,120,92,0.12), ${shadow.float}` : shadow.card,
        transform: `translateZ(${zz}px)`,
        opacity: ramp(f, [at, at + 14]),
        padding: 20,
        boxSizing: 'border-box',
        fontFamily: F.sans,
        color: C.ink,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const CardTitle: React.FC<{children: React.ReactNode; right?: React.ReactNode}> = ({children, right}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em'}}>
    <span>{children}</span>
    {right}
  </div>
);

const focusAmt = (f: number, i: number, act: number) => (act === i ? ramp(f, [FEATURES[i].at, FEATURES[i].at + 24], [0, 1], E.out) : 0);

const Dashboard: React.FC<{f: number; act: number; flat: number; btnPress: number}> = ({f, act, flat, btnPress}) => {
  const fs = (i: number) => focusAmt(f, i, act);
  return (
    <>
      {/* bayangan lantai */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 40,
          right: 40,
          bottom: -20,
          borderRadius: 30,
          background: 'rgba(38,37,34,0.18)',
          filter: 'blur(40px)',
          transform: `translateZ(${lerp(flat, -60, 0)}px)`,
          opacity: 1 - flat * 0.5,
        }}
      />
      {/* base panel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 26,
          background: '#F6F4F0',
          border: `1px solid ${C.line}`,
          boxShadow: shadow.float,
          overflow: 'hidden',
          fontFamily: F.sans,
        }}
      >
        {/* sidebar */}
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 200, borderRight: `1px solid ${C.line}`, background: C.warm, padding: '20px 16px', boxSizing: 'border-box'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <Img src={staticFile('brand/felixiority-cutout.png')} style={{width: 34, height: 34}} />
            <div style={{fontSize: 14, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.1}}>
              Felixiority
              <div style={{fontSize: 11, fontWeight: 500, color: C.ink3, fontFamily: F.mono, letterSpacing: '0.08em'}}>TOOLS</div>
            </div>
          </div>
          <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 4}}>
            {[
              ['Ringkasan', ILayers],
              ['Server', IServer],
              ['Node', IGlobe],
              ['Pengguna', IUsers],
              ['Otomasi', IBroom],
              ['Paket', IBox],
            ].map(([label, Icon], i) => {
              const I = Icon as typeof IServer;
              const on = i === 0;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: on ? 600 : 450,
                    background: on ? C.white : 'transparent',
                    boxShadow: on ? shadow.soft : undefined,
                    color: on ? C.ink : C.ink2,
                    opacity: ramp(f, [20 + i * 4, 34 + i * 4]),
                  }}
                >
                  <I size={17} color={on ? C.terra : C.ink2} />
                  {label as string}
                </div>
              );
            })}
          </div>
        </div>
        {/* topbar */}
        <div style={{position: 'absolute', left: 200, right: 0, top: 0, height: 64, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16}}>
          <div style={{fontSize: 17, fontWeight: 650, letterSpacing: '-0.02em'}}>Ringkasan Infrastruktur</div>
          <div style={{marginLeft: 'auto', width: 220, height: 34, borderRadius: 10, background: C.white, border: `1px solid ${C.line}`, fontSize: 13, color: C.ink3, display: 'flex', alignItems: 'center', padding: '0 12px'}}>
            Cari server, node…
          </div>
          <div style={{width: 34, height: 34, borderRadius: 17, background: C.terraSoft, color: C.terraDeep, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>FX</div>
        </div>
      </div>

      {/* stat cards */}
      {[
        {label: 'Server', to: 128, dec: 0, suf: '', delta: '+12 minggu ini'},
        {label: 'Pengguna', to: 2418, dec: 0, suf: '', delta: '+86 hari ini'},
        {label: 'Node', to: 12, dec: 0, suf: '', delta: '3 region'},
        {label: 'Uptime', to: 99.98, dec: 2, suf: '%', delta: '30 hari'},
      ].map((s, i) => (
        <Card key={i} f={f} at={30 + i * 6} x={224 + i * 190} y={86} w={176} h={112} z={46} flat={flat} focus={i === 1 ? fs(2) : i === 0 ? fs(0) * 0.6 : 0} style={{padding: 16}}>
          <div style={{fontSize: 13, color: C.ink2, fontWeight: 500}}>{s.label}</div>
          <div style={{fontSize: 34, fontWeight: 650, letterSpacing: '-0.04em', marginTop: 6}}>
            <Counter f={f} start={36 + i * 6} to={s.to} decimals={s.dec} suffix={s.suf} dur={80} />
          </div>
          <div style={{fontSize: 12, color: i === 3 ? C.green : C.terra, marginTop: 4, fontWeight: 500}}>{s.delta}</div>
        </Card>
      ))}

      {/* chart */}
      <Card f={f} at={54} x={224} y={214} w={470} h={240} z={30} flat={flat} focus={fs(1)}>
        <CardTitle right={<span style={{fontFamily: F.mono, fontSize: 11, color: C.terra, letterSpacing: '0.08em'}}>● REAL-TIME</span>}>Penggunaan CPU</CardTitle>
        <LiveChart f={f} />
      </Card>

      {/* server list */}
      <Card f={f} at={62} x={708} y={214} w={268} h={240} z={36} flat={flat} focus={fs(0)}>
        <CardTitle right={<span style={{fontSize: 12, color: C.ink3}}>128</span>}>Server</CardTitle>
        <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9}}>
          {[
            ['felix-01', 'Online'],
            ['nara-mc', 'Online'],
            ['bot-api', 'Online'],
            ['dev-02', 'Mulai…'],
            ['old-test', 'Dihapus'],
          ].map(([n, st], i) => {
            const starting = st === 'Mulai…' && f > 140;
            const status = starting ? 'Online' : st;
            const col = status === 'Online' ? C.green : status === 'Dihapus' ? C.terra : C.ink3;
            const removed = st === 'Dihapus' ? ramp(f, [330, 350], [0, 1], E.inOut) : 0;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 13,
                  height: 26,
                  opacity: ramp(f, [70 + i * 4, 84 + i * 4]) * (1 - removed * 0.7),
                  transform: `translateX(${removed * 20}px)`,
                  textDecoration: removed > 0.5 ? 'line-through' : undefined,
                }}
              >
                <IServer size={15} color={C.ink2} />
                <span style={{marginLeft: 8, fontFamily: F.mono, fontSize: 12.5}}>{n}</span>
                <span style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: col, fontWeight: 500}}>
                  <span style={{width: 7, height: 7, borderRadius: 4, background: col}} />
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* users */}
      <Card f={f} at={70} x={224} y={468} w={300} h={226} z={26} flat={flat} focus={fs(2)}>
        <CardTitle right={<span style={{fontSize: 12, color: C.ink3}}>Aktif</span>}>Pengguna</CardTitle>
        <div style={{display: 'flex', marginTop: 16}}>
          {['FX', 'NR', 'AD', 'MK', 'SR', 'JL'].map((n, i) => {
            const p = spr(f, 90 + i * 5, SPR.pop);
            const cols = [C.terra, C.ink, C.purple, '#D9A441', C.green, C.ink2];
            return (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginLeft: i ? -10 : 0,
                  background: cols[i],
                  border: '3px solid #fff',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${p}) translateY(${(1 - p) * 10}px)`,
                }}
              >
                {n}
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10}}>
          {[
            ['Admin', 4, 0.12],
            ['Reseller', 38, 0.38],
            ['Member', 2376, 0.92],
          ].map(([r, n, w], i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5}}>
              <span style={{width: 62, color: C.ink2}}>{r as string}</span>
              <div style={{flex: 1, height: 6, borderRadius: 3, background: C.gray}}>
                <div style={{width: `${(w as number) * 100 * ramp(f, [100 + i * 8, 170 + i * 8])}%`, height: 6, borderRadius: 3, background: i === 2 ? C.terra : C.ink}} />
              </div>
              <span style={{width: 40, textAlign: 'right', fontFamily: F.mono, fontSize: 12}}>
                <Counter f={f} start={100 + i * 8} to={n as number} />
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* automation */}
      <Card f={f} at={78} x={538} y={468} w={438} h={226} z={34} flat={flat} focus={fs(3)}>
        <CardTitle right={<span style={{fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: '0.06em'}}>CRON · 03:00</span>}>Otomasi & Pembersihan</CardTitle>
        <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9}}>
          {['Hapus server kedaluwarsa', 'Backup harian semua node', 'Sinkronisasi alokasi'].map((t, i) => {
            const done = ramp(f, [318 + i * 12, 328 + i * 12]);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: done > 0.5 ? C.ink : C.ink2}}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    border: `1.5px solid ${done > 0.5 ? C.terra : C.gray2}`,
                    background: done > 0.5 ? C.terra : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${1 + Math.sin(done * Math.PI) * 0.25})`,
                  }}
                >
                  {done > 0.5 ? <ICheck size={13} color="#fff" stroke={2.6} /> : null}
                </div>
                {t}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 20, bottom: 22, width: 200}}>
          <div style={{fontSize: 11.5, color: C.ink3, fontFamily: F.mono, letterSpacing: '0.04em'}}>
            DIBERSIHKAN · <Counter f={f} start={318} to={37} dur={50} /> SERVER
          </div>
          <div style={{marginTop: 7, height: 6, borderRadius: 3, background: C.gray}}>
            <div style={{width: `${ramp(f, [316, 362], [0, 100], E.inOut)}%`, height: 6, borderRadius: 3, background: C.terra}} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: BTN.x - 538,
            top: BTN.y - 468,
            width: BTN.w,
            height: BTN.h,
            borderRadius: 12,
            background: C.terra,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transform: `scale(${1 - btnPress * 0.06})`,
            boxShadow: '0 6px 16px -6px rgba(204,120,92,0.6)',
          }}
        >
          Order Panel Baru <IArrow size={16} color="#fff" />
        </div>
      </Card>
    </>
  );
};

const LiveChart: React.FC<{f: number}> = ({f}) => {
  const W = 430;
  const H = 160;
  const N = 48;
  const t = f * 0.9;
  const val = (i: number) => {
    const x = i + t * 0.25;
    return 0.48 + 0.16 * Math.sin(x * 0.42) + 0.09 * Math.sin(x * 1.13 + 1.3) + 0.05 * Math.sin(x * 2.7);
  };
  const pts = Array.from({length: N}, (_, i) => [(i / (N - 1)) * W, H - val(i) * H] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const reveal = ramp(f, [60, 130], [0, 1], E.inOut);
  const last = pts[Math.min(N - 1, Math.floor(reveal * (N - 1)))];
  return (
    <div style={{position: 'relative', marginTop: 14}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
        <span style={{fontSize: 30, fontWeight: 650, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums'}}>{Math.round(val(N - 1) * 100 * 0.62)}%</span>
        <span style={{fontSize: 12, color: C.ink3}}>rata-rata 12 node</span>
      </div>
      <svg width={W} height={H} style={{marginTop: 4, overflow: 'visible'}}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke={C.ink} strokeOpacity={0.06} strokeDasharray="3 5" />
        ))}
        <defs>
          <clipPath id="chartclip">
            <rect x={0} y={-10} width={W * reveal} height={H + 20} />
          </clipPath>
          <linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.terra} stopOpacity={0.22} />
            <stop offset="1" stopColor={C.terra} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g clipPath="url(#chartclip)">
          <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="url(#chartfill)" />
          <path d={d} fill="none" stroke={C.terra} strokeWidth={2.4} strokeLinejoin="round" />
        </g>
        <circle cx={last[0]} cy={last[1]} r={5} fill="#fff" stroke={C.terra} strokeWidth={2.5} opacity={reveal > 0 ? 1 : 0} />
      </svg>
    </div>
  );
};
