import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, lerp, ramp, rand, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {PANEL_RECT, PORTAL, portalAt} from '../lib/layout';
import {SCENES} from '../lib/timeline';
import {Kicker, RevealText} from '../components/Text';
import {Cursor} from '../components/Cursor';
import {IArrow, IBox, ICard, ICart, ICheck, IServer, IBolt} from '../components/Icons';
import {MotionBlur} from '../components/MotionBlur';

const P = PANEL_RECT;
const STEPS = [
  {label: 'Pilih Produk', Icon: ICart, at: 0},
  {label: 'Checkout', Icon: ICard, at: 140},
  {label: 'Pembayaran', Icon: IBolt, at: 232},
  {label: 'Deployment', Icon: IServer, at: 322},
];

const PRODUCTS = [
  {name: 'Panel Starter', ram: '1 GB', price: 'Rp5.000', feats: ['1 GB RAM', '50% CPU', '5 GB Disk']},
  {name: 'Panel Pro', ram: '4 GB', price: 'Rp12.000', feats: ['4 GB RAM', '150% CPU', '20 GB Disk'], hot: true},
  {name: 'Panel Unlimited', ram: '∞', price: 'Rp25.000', feats: ['RAM tanpa batas', 'CPU tanpa batas', 'Disk tanpa batas']},
];

export const S03Panel: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SCENES.panel.from;
  const portal = portalAt(g);
  const wcx = PORTAL.x + PORTAL.w / 2;
  const wcy = PORTAL.y + PORTAL.h / 2;

  // kamera menuju jendela: titik jendela → pusat layar, skala k
  const camT = `translate(${portal.cx - wcx}px, ${portal.cy - wcy}px) scale(${portal.k})`;
  const step = STEPS.reduce((a, s, i) => (f >= s.at ? i : a), 0);

  return (
    <AbsoluteFill style={{background: C.warm, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: camT, transformOrigin: `${wcx}px ${wcy}px`}}>
        {/* Judul */}
        <div style={{position: 'absolute', left: P.x, top: 92}}>
          <Kicker f={f} start={12} n="03" label="FELIX PANEL" />
          <div style={{marginTop: 16}}>
            <RevealText text="From Order to *Deployment.*" f={f} start={22} size={84} />
          </div>
        </div>
        <div style={{position: 'absolute', right: 1920 - P.x - P.w, top: 168, width: 460, textAlign: 'right'}}>
          <RevealText
            text="Sistem pemesanan panel otomatis — dari memilih paket hingga server aktif."
            f={f}
            start={40}
            stagger={1.5}
            size={21}
            font="sans"
            color={C.ink2}
            tracking="-0.01em"
            lineHeight={1.4}
            align="right"
          />
        </div>

        {/* Kontainer (match cut dari tombol Scene 02) */}
        <div
          style={{
            position: 'absolute',
            left: P.x,
            top: P.y,
            width: P.w,
            height: P.h,
            borderRadius: P.r,
            background: C.white,
            boxShadow: shadow.float,
            border: `1px solid ${C.line}`,
            overflow: 'hidden',
            fontFamily: F.sans,
            color: C.ink,
          }}
        >
          <Header f={f} step={step} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 88, bottom: 0}}>
            <Products f={f} />
            <CheckoutForm f={f} />
            <Payment f={f} />
            <Deploy f={f} />
          </div>
        </div>

        <Cursor
          f={f}
          show={[60, 300]}
          presses={[112, 214]}
          keys={[
            [60, 1500, 1000],
            [104, P.x + 820, P.y + 88 + 500],
            [124, P.x + 830, P.y + 88 + 505],
            [190, P.x + 1360, P.y + 88 + 560],
            [206, P.x + 1360, P.y + 88 + 572],
            [240, P.x + 1380, P.y + 88 + 590],
            [300, P.x + 1700, P.y + 900],
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ header */
const Header: React.FC<{f: number; step: number}> = ({f, step}) => {
  const prog = STEPS.reduce((a, s, i) => a + (i ? ramp(f, [s.at - 10, s.at + 20], [0, 1], E.inOut) : 0), 0);
  const sx = 520;
  const gap = 260;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 88, borderBottom: `1px solid ${C.line}`}}>
      <div style={{position: 'absolute', left: 32, top: 26, display: 'flex', alignItems: 'center', gap: 12, opacity: ramp(f, [6, 22])}}>
        <div style={{width: 36, height: 36, borderRadius: 10, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <IBox size={20} color="#fff" />
        </div>
        <div style={{fontSize: 19, fontWeight: 650, letterSpacing: '-0.02em'}}>Felix Panel</div>
        <div style={{fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: '0.1em', marginLeft: 4}}>KONSEP UI</div>
      </div>
      {/* garis progres */}
      <div style={{position: 'absolute', left: sx, top: 43, width: gap * 3, height: 2, background: C.gray}} />
      <div style={{position: 'absolute', left: sx, top: 43, width: (gap * 3 * prog) / 3, height: 2, background: C.terra}} />
      {STEPS.map((s, i) => {
        const p = spr(f, 10 + i * 5, SPR.pop);
        const done = i < step;
        const cur = i === step;
        const hit = ramp(f, [s.at - 4, s.at + 14]);
        return (
          <div key={i} style={{position: 'absolute', left: sx + i * gap - 18, top: 26, display: 'flex', alignItems: 'center', gap: 10, transform: `scale(${p})`, transformOrigin: '18px 18px'}}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: done ? C.terra : cur ? C.ink : C.white,
                border: `1.5px solid ${done ? C.terra : cur ? C.ink : C.gray2}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: done || cur ? '#fff' : C.ink3,
                transform: `scale(${1 + (cur ? Math.sin(hit * Math.PI) * 0.18 : 0)})`,
              }}
            >
              {done ? <ICheck size={18} color="#fff" stroke={2.6} /> : <s.Icon size={17} />}
            </div>
            <span style={{fontSize: 15, fontWeight: cur ? 650 : 500, color: cur || done ? C.ink : C.ink3, background: C.white, paddingRight: 8}}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- products */
const CARD = {w: 420, h: 480, y: 60};
const cardX = (i: number) => 820 - CARD.w / 2 + (i - 1) * 470;

const Products: React.FC<{f: number}> = ({f}) => {
  return (
    <>
      {PRODUCTS.map((p, i) => {
        const inp = spr(f, 24 + i * 7, SPR.gentle);
        const sel = i === 1;
        const lift = sel ? spr(f, 112, SPR.pop) : 0;
        const away = !sel ? ramp(f, [128, 156], [0, 1], E.in) : 0;
        // kartu terpilih ber-morph menjadi ringkasan di kiri (shared element)
        const morph = sel ? ramp(f, [136, 176], [0, 1], E.inOut) : 0;
        const x = lerp(morph, cardX(i), 56);
        const y = lerp(morph, CARD.y, 48);
        const w = lerp(morph, CARD.w, 440);
        const h = lerp(morph, CARD.h, 552);
        const xPrev = sel ? lerp(ramp(f - 1, [136, 176], [0, 1], E.inOut), cardX(i), 56) : x;
        if (away >= 1) return null;
        return (
          <MotionBlur key={i} vx={x - xPrev} shutter={0.4} style={{position: 'absolute', left: 0, top: 0}}>
            <div
              style={{
                position: 'absolute',
                left: x + (i === 0 ? -away * 300 : i === 2 ? away * 300 : 0),
                top: y + (1 - inp) * 120 - lift * 10 * (1 - morph),
                width: w,
                height: h,
                borderRadius: 22,
                background: sel && f > 112 ? C.warm : C.white,
                border: `${sel && f > 112 ? 2 : 1}px solid ${sel && f > 112 ? C.terra : C.line}`,
                boxShadow: lift > 0 ? shadow.float : shadow.card,
                opacity: inp * (1 - away),
                padding: 32,
                boxSizing: 'border-box',
                transform: `scale(${1 + lift * 0.03 * (1 - morph)})`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{fontFamily: F.mono, fontSize: 13, letterSpacing: '0.12em', color: C.ink2}}>{morph > 0.5 ? 'RINGKASAN PESANAN' : 'PAKET'}</span>
                {p.hot ? (
                  <span style={{fontSize: 12, fontWeight: 600, color: C.terraDeep, background: C.terraSoft, padding: '5px 10px', borderRadius: 20}}>Populer</span>
                ) : null}
              </div>
              <div style={{fontSize: 32, fontWeight: 650, letterSpacing: '-0.03em', marginTop: 26}}>{p.name}</div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10}}>
                <span style={{fontFamily: F.serif, fontSize: 64, letterSpacing: '-0.02em'}}>{p.price}</span>
                <span style={{fontSize: 16, color: C.ink3}}>/ bulan</span>
              </div>
              <div style={{height: 1, background: C.line, margin: '22px 0'}} />
              {p.feats.map((ft, k) => (
                <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, marginBottom: 14, color: C.ink2}}>
                  <ICheck size={18} color={C.terra} stroke={2.4} /> {ft}
                </div>
              ))}
              {morph > 0.6 ? (
                <div style={{opacity: ramp(f, [168, 190]), marginTop: 18}}>
                  <div style={{height: 1, background: C.line, marginBottom: 18}} />
                  {[
                    ['Lokasi', 'Singapura · SG-01'],
                    ['Egg', 'Node.js / Bot'],
                    ['Total', 'Rp12.000'],
                  ].map(([a, b], k) => (
                    <div key={k} style={{display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 12}}>
                      <span style={{color: C.ink3}}>{a}</span>
                      <span style={{fontWeight: k === 2 ? 700 : 500}}>{b}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    left: 32,
                    right: 32,
                    bottom: 30,
                    height: 50,
                    borderRadius: 14,
                    background: sel ? C.terra : C.gray,
                    color: sel ? '#fff' : C.ink,
                    fontSize: 16,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transform: `scale(${sel && f >= 108 && f <= 120 ? 0.96 : 1})`,
                  }}
                >
                  {sel && f > 112 ? 'Dipilih' : 'Pilih paket'} {sel ? <IArrow size={16} color="#fff" /> : null}
                </div>
              )}
            </div>
          </MotionBlur>
        );
      })}
    </>
  );
};

/* ---------------------------------------------------------------- checkout */
const Field: React.FC<{f: number; label: string; value: string; typeAt: number; y: number}> = ({f, label, value, typeAt, y}) => {
  const n = Math.floor(ramp(f, [typeAt, typeAt + value.length * 1.6], [0, value.length], E.linear));
  const focus = f >= typeAt - 4 && f < typeAt + value.length * 1.6 + 8;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1000}}>
      <div style={{fontSize: 14, color: C.ink2, fontWeight: 500}}>{label}</div>
      <div
        style={{
          marginTop: 8,
          height: 56,
          borderRadius: 14,
          border: `1.5px solid ${focus ? C.terra : C.gray2}`,
          boxShadow: focus ? '0 0 0 4px rgba(204,120,92,0.12)' : undefined,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          fontSize: 19,
          fontFamily: F.mono,
          background: C.white,
        }}
      >
        {value.slice(0, n)}
        {focus && Math.floor(f / 15) % 2 === 0 ? <span style={{width: 2, height: 24, background: C.terra, marginLeft: 2}} /> : null}
      </div>
    </div>
  );
};

const CheckoutForm: React.FC<{f: number}> = ({f}) => {
  const inn = ramp(f, [150, 186], [0, 1], E.out);
  const out = ramp(f, [226, 250], [0, 1], E.in);
  if (inn <= 0 || out >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 560, top: 48, width: 1000, height: 560, opacity: inn * (1 - out), transform: `translateX(${(1 - inn) * 80 - out * 80}px)`}}>
      <div style={{fontSize: 30, fontWeight: 650, letterSpacing: '-0.03em'}}>Detail akun panel</div>
      <div style={{fontSize: 16, color: C.ink3, marginTop: 6}}>Akun Pterodactyl dibuat otomatis setelah pembayaran.</div>
      <Field f={f} label="Username panel" value="felix" typeAt={168} y={100} />
      <Field f={f} label="Email" value="felix@felixiority.id" typeAt={180} y={200} />
      <div style={{position: 'absolute', left: 0, top: 300, width: 1000, display: 'flex', gap: 12}}>
        {['Singapura', 'Jakarta', 'Tokyo'].map((r, i) => (
          <div
            key={i}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: `1.5px solid ${i === 0 ? C.ink : C.gray2}`,
              fontSize: 16,
              fontWeight: i === 0 ? 600 : 450,
              color: i === 0 ? C.ink : C.ink2,
              opacity: ramp(f, [176 + i * 4, 190 + i * 4]),
            }}
          >
            {r}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 460,
          height: 60,
          width: 340,
          borderRadius: 16,
          background: C.ink,
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transform: `scale(${f >= 210 && f <= 220 ? 0.96 : 1})`,
        }}
      >
        Lanjut ke Pembayaran <IArrow size={18} color="#fff" />
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------- payment */
const QR: React.FC<{f: number; start: number}> = ({f, start}) => {
  const N = 25;
  const cell = 11;
  const cells: React.ReactNode[] = [];
  const finder = (x: number, y: number) => x < 7 && y < 7;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const inF = finder(x, y) || finder(N - 1 - x, y) || finder(x, N - 1 - y);
      if (inF) continue;
      if (rand(x * 31 + y * 17 + 5) > 0.52) {
        const d = (x + y) / (2 * N);
        const p = ramp(f, [start + d * 40, start + d * 40 + 10]);
        if (p > 0) cells.push(<rect key={`${x}-${y}`} x={x * cell + (1 - p) * 4} y={y * cell + (1 - p) * 4} width={cell * p} height={cell * p} rx={2} fill={C.ink} />);
      }
    }
  const fp = ramp(f, [start, start + 16], [0, 1], E.out);
  const F3 = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  return (
    <svg width={N * cell} height={N * cell}>
      {F3.map(([x, y], i) => (
        <g key={i} transform={`translate(${(x + 3.5) * cell} ${(y + 3.5) * cell}) scale(${fp})`}>
          <rect x={-3.5 * cell} y={-3.5 * cell} width={7 * cell} height={7 * cell} rx={10} fill="none" stroke={C.ink} strokeWidth={cell} />
          <rect x={-1.5 * cell} y={-1.5 * cell} width={3 * cell} height={3 * cell} rx={4} fill={C.terra} />
        </g>
      ))}
      {cells}
    </svg>
  );
};

const Payment: React.FC<{f: number}> = ({f}) => {
  const inn = ramp(f, [236, 270], [0, 1], E.out);
  const out = ramp(f, [314, 330], [0, 1], E.in);
  if (inn <= 0 || out >= 1) return null;
  const ok = ramp(f, [288, 306], [0, 1], E.out);
  const sec = Math.max(0, 299 - Math.floor((f - 236) / 6));
  return (
    <div style={{position: 'absolute', left: 560, top: 48, width: 1000, height: 560, opacity: inn * (1 - out), transform: `translateX(${(1 - inn) * 80 - out * 80}px)`}}>
      <div style={{fontSize: 30, fontWeight: 650, letterSpacing: '-0.03em'}}>Pembayaran</div>
      <div style={{fontSize: 16, color: C.ink3, marginTop: 6}}>Pindai kode untuk membayar — ilustrasi konsep.</div>
      <div style={{position: 'absolute', left: 0, top: 96, width: 340, height: 340, borderRadius: 24, border: `1px solid ${C.line}`, background: C.warm, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{opacity: 1 - ok * 0.85, transform: `scale(${1 - ok * 0.06})`}}>
          <QR f={f} start={244} />
        </div>
        {ok > 0 ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={150} height={150} viewBox="0 0 150 150" style={{transform: `scale(${0.6 + 0.4 * spr(f, 288, SPR.pop)})`}}>
              <circle cx={75} cy={75} r={66} fill={C.terra} opacity={ok} />
              <path d="M44 78 L66 99 L108 55" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={110} strokeDashoffset={110 * (1 - ramp(f, [294, 312], [0, 1], E.out))} />
            </svg>
          </div>
        ) : null}
      </div>
      <div style={{position: 'absolute', left: 400, top: 110}}>
        <div style={{fontFamily: F.mono, fontSize: 13, letterSpacing: '0.12em', color: C.ink3}}>TOTAL TAGIHAN</div>
        <div style={{fontFamily: F.serif, fontSize: 88, letterSpacing: '-0.02em', marginTop: 6}}>Rp12.000</div>
        <div style={{marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, fontSize: 19}}>
          {ok > 0.5 ? (
            <>
              <span style={{width: 10, height: 10, borderRadius: 5, background: C.green}} />
              <span style={{fontWeight: 600}}>Pembayaran diterima</span>
            </>
          ) : (
            <>
              <span style={{width: 10, height: 10, borderRadius: 5, background: C.terra, opacity: 0.5 + 0.5 * Math.sin(f / 5)}} />
              <span style={{color: C.ink2}}>Menunggu pembayaran…</span>
              <span style={{fontFamily: F.mono, color: C.ink3}}>
                0{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
        <div style={{marginTop: 30, width: 520, height: 8, borderRadius: 4, background: C.gray}}>
          <div style={{width: `${ramp(f, [250, 300], [0, 100], E.inOut)}%`, height: 8, borderRadius: 4, background: ok > 0.5 ? C.green : C.terra}} />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ deploy */
const LOGS = [
  ['Membuat akun panel “felix”', 334],
  ['Mengalokasikan node SG-01 · port 25565', 352],
  ['Memasang egg Node.js / Bot', 370],
  ['Menyalakan server felix-02', 388],
  ['Server online · siap digunakan', 404],
] as const;

const Deploy: React.FC<{f: number}> = ({f}) => {
  const inn = ramp(f, [328, 360], [0, 1], E.out);
  if (inn <= 0) return null;
  const prog = ramp(f, [334, 410], [0, 1], E.inOut);
  return (
    <div style={{position: 'absolute', left: 560, top: 48, width: 1040, height: 600, opacity: inn, transform: `translateX(${(1 - inn) * 80}px)`}}>
      <div style={{fontSize: 30, fontWeight: 650, letterSpacing: '-0.03em'}}>Deployment</div>
      <div style={{fontSize: 16, color: C.ink3, marginTop: 6}}>Server dibuat & dinyalakan otomatis.</div>
      <div style={{position: 'absolute', left: 0, top: 100, width: 470}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 14, color: C.ink2}}>
          <span>felix-02</span>
          <span>{Math.round(prog * 100)}%</span>
        </div>
        <div style={{marginTop: 10, height: 8, borderRadius: 4, background: C.gray, overflow: 'hidden'}}>
          <div style={{width: `${prog * 100}%`, height: 8, borderRadius: 4, background: C.terra}} />
        </div>
        <div style={{marginTop: 26, display: 'flex', flexDirection: 'column', gap: 16}}>
          {LOGS.map(([t, at], i) => {
            const p = ramp(f, [at, at + 16]);
            const done = f > at + 14;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 16.5, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, fontFamily: F.mono, color: i === 4 ? C.ink : C.ink2}}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: done ? (i === 4 ? C.green : C.ink) : C.gray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done ? <ICheck size={13} color="#fff" stroke={3} /> : null}
                </span>
                {t}
              </div>
            );
          })}
        </div>
      </div>
      <ServerObject f={f} />
      <PortalWindow f={f} />
    </div>
  );
};

/** Objek server 3D (CSS 3D) yang naik dengan spring. */
const ServerObject: React.FC<{f: number}> = ({f}) => {
  const p = spr(f, 372, SPR.bouncy);
  if (f < 368) return null;
  const rot = -32 + Math.sin((f - 372) / 40) * 6;
  const W = 230;
  const Hh = 150;
  const D = 160;
  const face: React.CSSProperties = {position: 'absolute', boxSizing: 'border-box', borderRadius: 6};
  const units = [0, 1, 2];
  return (
    <div style={{position: 'absolute', left: 620, top: 10, width: 400, height: 340, perspective: 1400}}>
      {/* bayangan */}
      <div style={{position: 'absolute', left: 80, top: 286, width: 240, height: 40, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(38,37,34,0.25), transparent)', transform: `scale(${p})`}} />
      <div
        style={{
          position: 'absolute',
          left: 200 - W / 2,
          top: 110,
          width: W,
          height: Hh,
          transformStyle: 'preserve-3d',
          transform: `translateY(${(1 - p) * 140}px) rotateX(-18deg) rotateY(${rot}deg) scale(${0.4 + 0.6 * p})`,
        }}
      >
        {/* depan */}
        <div style={{...face, width: W, height: Hh, background: C.white, border: `1px solid ${C.gray2}`, transform: `translateZ(${D / 2}px)`, padding: 12}}>
          {units.map((u) => (
            <div key={u} style={{height: 36, marginBottom: 8, borderRadius: 6, background: C.warm, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6}}>
              {[0, 1, 2].map((l) => (
                <span key={l} style={{width: 7, height: 7, borderRadius: 4, background: l === 0 ? (Math.floor((f + u * 7 + l * 3) / 8) % 3 ? C.green : '#9fd0ab') : l === 1 ? C.terra : C.gray2}} />
              ))}
              <span style={{marginLeft: 'auto', width: 70, height: 4, borderRadius: 2, background: C.gray2}} />
            </div>
          ))}
        </div>
        {/* samping kanan */}
        <div style={{...face, width: D, height: Hh, left: W / 2 - D / 2, background: '#E9E6E0', border: `1px solid ${C.gray2}`, transform: `rotateY(90deg) translateZ(${W / 2}px)`}} />
        {/* atas */}
        <div style={{...face, width: W, height: D, top: Hh / 2 - D / 2, background: '#F7F5F1', border: `1px solid ${C.gray2}`, transform: `rotateX(90deg) translateZ(${Hh / 2}px)`}}>
          <div style={{position: 'absolute', left: 16, top: 16, width: 40, height: 6, borderRadius: 3, background: C.terra}} />
        </div>
        {/* samping kiri */}
        <div style={{...face, width: D, height: Hh, left: W / 2 - D / 2, background: '#DEDAD3', transform: `rotateY(-90deg) translateZ(${W / 2}px)`}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 310,
          textAlign: 'center',
          fontFamily: F.mono,
          fontSize: 13,
          letterSpacing: '0.12em',
          color: C.green,
          opacity: ramp(f, [406, 420]),
        }}
      >
        ● FELIX-02 ONLINE
      </div>
    </div>
  );
};

/** Jendela preview (16:9) yang menjadi portal kamera ke Scene 04. */
const PortalWindow: React.FC<{f: number}> = ({f}) => {
  if (f < 420) return null;
  const o = ramp(f, [420, 434]);
  // jendela pada koordinat kontainer: PORTAL dikurangi offset Deploy (560, 88+48)
  const lx = PORTAL.x - P.x - 560;
  const ly = PORTAL.y - P.y - 88 - 48;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: lx - 14,
          top: ly - 14,
          width: PORTAL.w + 28,
          height: PORTAL.h + 62,
          borderRadius: 18,
          background: C.white,
          border: `1px solid ${C.line}`,
          boxShadow: shadow.float,
          opacity: o,
        }}
      >
        <div style={{position: 'absolute', left: 14, top: PORTAL.h + 26, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8}}>
          Lihat di User Warehouse <IArrow size={15} color={C.terra} />
        </div>
      </div>
      {/* lubang jendela: diisi oleh Scene 04 (dirender di atas) */}
      <div style={{position: 'absolute', left: lx, top: ly, width: PORTAL.w, height: PORTAL.h, borderRadius: 10, background: C.gray, opacity: o}} />
    </>
  );
};
