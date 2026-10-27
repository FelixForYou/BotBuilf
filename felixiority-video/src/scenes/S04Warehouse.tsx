import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, kf, ramp, rand, spr, SPR} from '../lib/anim';
import {C, F, shadow} from '../lib/theme';
import {PORTAL, portalAt} from '../lib/layout';
import {SCENES} from '../lib/timeline';
import {Counter, Kicker, RevealText} from '../components/Text';

/* ---------------------------------------------------------------- 3D box */
type Face = {top: string; front: string; side: string; back?: string; left?: string};

const Box3D: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  c: Face;
  border?: string;
  topContent?: React.ReactNode;
  frontContent?: React.ReactNode;
  radius?: number;
}> = ({x, y, z, w, d, h, c, border = 'rgba(38,37,34,0.10)', topContent, frontContent, radius = 3}) => {
  const base: React.CSSProperties = {position: 'absolute', boxSizing: 'border-box', border: `1px solid ${border}`, borderRadius: radius, backfaceVisibility: 'visible'};
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: d, transformStyle: 'preserve-3d', transform: `translateZ(${z}px)`}}>
      <div style={{...base, left: 0, top: 0, width: w, height: d, background: c.top, transform: `translateZ(${h}px)`}}>{topContent}</div>
      <div style={{...base, left: 0, top: d, width: w, height: h, background: c.front, transformOrigin: '0 0', transform: 'rotateX(90deg)'}}>{frontContent}</div>
      <div style={{...base, left: 0, top: 0, width: w, height: h, background: c.back ?? c.front, transformOrigin: '0 0', transform: 'rotateX(90deg)'}} />
      <div style={{...base, left: w, top: 0, width: h, height: d, background: c.side, transformOrigin: '0 0', transform: 'rotateY(-90deg)'}} />
      <div style={{...base, left: 0, top: 0, width: h, height: d, background: c.left ?? c.side, transformOrigin: '0 0', transform: 'rotateY(-90deg)'}} />
    </div>
  );
};

/* -------------------------------------------------------------- layout data */
const ROWS = [-560, -190, 180, 550];
const SLOTS = 8;
const SPACING = 140;
const CRATE = {w: 96, d: 96, h: 84};
const BOARD_T = 16;
const UPPER = 176;
const SHELF = {x0: -600, len: 1200, depth: 150};

const NAMES = ['FX', 'NR', 'AD', 'MK', 'SR', 'JL', 'RN', 'DV', 'YS', 'BL', 'KI', 'TO', 'AR', 'LU', 'EM', 'ZA'];
const CRATES = ROWS.flatMap((ry, r) =>
  [0, 1].flatMap((tier) =>
    Array.from({length: SLOTS}, (_, s) => {
      const i = r * SLOTS * 2 + tier * SLOTS + s;
      const kind = rand(i * 7.7 + 3);
      return {
        x: SHELF.x0 + 60 + s * SPACING + (SPACING - CRATE.w) / 2 - 30,
        y: ry + (SHELF.depth - CRATE.d) / 2,
        z: tier === 0 ? BOARD_T : UPPER + BOARD_T,
        name: NAMES[i % NAMES.length],
        kind: kind > 0.94 ? 'brand' : kind > 0.8 ? 'terra' : kind > 0.68 ? 'ink' : 'white',
        // jadwal pendaratan: menyebar, tingkat bawah lebih dulu
        at: 14 + Math.floor(rand(i * 3.1 + 1) * 340) + tier * 30,
      };
    }),
  ),
).sort((a, b) => a.at - b.at);

export const WAREHOUSE_TICKS = CRATES.filter((_, i) => i % 6 === 2).map((c) => c.at + 22);

const crateFaces = (kind: string): Face => {
  switch (kind) {
    case 'brand':
      return {top: C.purple, front: '#7430DA', side: '#6629C4', left: '#7A36E2'};
    case 'terra':
      return {top: '#D88B71', front: C.terra, side: '#B9694F', left: '#C47258'};
    case 'ink':
      return {top: '#3A3935', front: C.ink, side: '#1E1D1A', left: '#2C2B28'};
    default:
      return {top: '#FFFFFF', front: '#F3F1EC', side: '#E4E1DB', left: '#ECE9E3'};
  }
};

export const S04Warehouse: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + SCENES.warehouse.from;
  const portal = portalAt(g);

  // kamera dolly isometrik
  const rotZ = kf(f, [[0, -48], [100, -46], [580, -34]], E.inOut);
  const rotX = kf(f, [[0, 60], [100, 58], [580, 54]], E.inOut);
  const camS = kf(f, [[0, 0.5], [100, 0.56], [580, 0.66]], E.inOut);
  const camX = kf(f, [[0, 260], [100, 230], [580, 150]], E.inOut);
  const camY = kf(f, [[0, 120], [100, 110], [580, 70]], E.inOut);

  const landed = CRATES.filter((c) => f > c.at + 20).length;

  const world = (
    <AbsoluteFill style={{background: C.warm, overflow: 'hidden'}}>
      {/* cahaya ambient */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 70% at 62% 55%, #FFFFFF 0%, #F6F3EE 55%, #EAE6DF 100%)'}} />
      <AbsoluteFill style={{perspective: 6000, perspectiveOrigin: '50% 40%'}}>
        <div
          style={{
            position: 'absolute',
            left: 960 + camX,
            top: 540 + camY,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `scale(${camS}) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          }}
        >
          {/* lantai */}
          <div
            style={{
              position: 'absolute',
              left: -1300,
              top: -1100,
              width: 2600,
              height: 2200,
              borderRadius: 40,
              background: `radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(250,249,246,0) 80%), repeating-linear-gradient(0deg, rgba(38,37,34,0.06) 0 1.5px, transparent 1.5px 100px), repeating-linear-gradient(90deg, rgba(38,37,34,0.06) 0 1.5px, transparent 1.5px 100px), #F4F1EC`,
            }}
          />
          {/* garis jalur terracotta di lantai */}
          <div style={{position: 'absolute', left: -760, top: -20 - 1, width: 1520 * ramp(f, [20, 140], [0, 1], E.inOut), height: 3, background: C.terra, opacity: 0.55, transform: 'translateZ(1px)'}} />
          {ROWS.map((ry, r) => (
            <Shelf key={r} y={ry} f={f} r={r} />
          ))}
          {CRATES.map((c, i) => (
            <Crate key={i} c={c} f={f} />
          ))}
        </div>
      </AbsoluteFill>
      {/* lighting atas */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(250,249,246,0.85) 0%, rgba(250,249,246,0) 26%)', pointerEvents: 'none'}} />
      <Overlay f={f} landed={landed} />
    </AbsoluteFill>
  );

  // sebelum & selama portal: tampil di dalam jendela Scene 03
  if (portal.t < 1) {
    const o = ramp(g, [1300, 1314]);
    const r = portal.rect;
    return (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', borderRadius: 10 * (1 - portal.t), opacity: o}}>
          <div
            style={{
              position: 'absolute',
              left: -r.x,
              top: -r.y,
              width: 1920,
              height: 1080,
              transformOrigin: '960px 540px',
              transform: `translate(${portal.cx - 960}px, ${portal.cy - 540}px) scale(${portal.k / (1920 / PORTAL.w)})`,
            }}
          >
            {world}
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  return world;
};

const Shelf: React.FC<{y: number; f: number; r: number}> = ({y, f, r}) => {
  const p = spr(f, 4 + r * 5, SPR.gentle);
  const board: Face = {top: '#FFFFFF', front: '#E9E5DE', side: '#DCD7CF'};
  const post: Face = {top: C.ink, front: '#3A3935', side: C.ink};
  const zOff = (1 - p) * -120;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateZ(${zOff}px)`}}>
      {/* bayangan rak */}
      <div style={{position: 'absolute', left: SHELF.x0 - 20, top: y - 10, width: SHELF.len + 40, height: SHELF.depth + 50, borderRadius: 30, background: 'rgba(38,37,34,0.10)', filter: 'blur(14px)', transform: 'translateZ(1px)'}} />
      <Box3D x={SHELF.x0} y={y} z={0} w={SHELF.len} d={SHELF.depth} h={BOARD_T} c={board} />
      {[0, 1].map((side) =>
        [0, 1].map((e) => (
          <Box3D key={`${side}${e}`} x={SHELF.x0 + (e ? SHELF.len - 12 : 0)} y={y + (side ? SHELF.depth - 12 : 0)} z={BOARD_T} w={12} d={12} h={UPPER} c={post} radius={2} />
        )),
      )}
      <Box3D x={SHELF.x0} y={y} z={UPPER} w={SHELF.len} d={SHELF.depth} h={BOARD_T} c={board} />
      {/* label rak */}
      <div
        style={{
          position: 'absolute',
          left: SHELF.x0 - 150,
          top: y + 40,
          width: 120,
          height: 70,
          borderRadius: 14,
          background: C.ink,
          color: '#fff',
          fontFamily: F.mono,
          fontSize: 34,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateZ(2px)',
          opacity: p,
        }}
      >
        {String.fromCharCode(65 + r)}
      </div>
    </div>
  );
};

const Crate: React.FC<{c: (typeof CRATES)[number]; f: number}> = ({c, f}) => {
  if (f < c.at) return null;
  const p = spr(f, c.at, SPR.bouncy);
  const drop = (1 - p) * 620;
  const squash = Math.max(0, Math.min(0.12, (p - 1) * 0.9));
  const faces = crateFaces(c.kind);
  const dark = c.kind === 'ink' || c.kind === 'brand' || c.kind === 'terra';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d'}}>
      {/* bayangan kontak — membesar saat mendekat */}
      <div
        style={{
          position: 'absolute',
          left: c.x - 8,
          top: c.y - 4,
          width: CRATE.w + 24,
          height: CRATE.d + 24,
          borderRadius: 18,
          background: 'rgba(38,37,34,0.22)',
          filter: 'blur(8px)',
          transform: `translateZ(${c.z + 1}px) scale(${0.5 + 0.5 * Math.min(1, p)})`,
          opacity: Math.min(1, p) * 0.9,
        }}
      />
      <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateZ(${drop}px)`, opacity: ramp(f, [c.at, c.at + 6])}}>
        <Box3D
          x={c.x}
          y={c.y}
          z={c.z}
          w={CRATE.w}
          d={CRATE.d}
          h={CRATE.h * (1 - squash)}
          c={faces}
          radius={8}
          topContent={
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: dark ? 'rgba(255,255,255,0.92)' : C.ink, transform: 'rotate(90deg)'}}>
              {c.name}
            </div>
          }
          frontContent={<div style={{position: 'absolute', left: 14, right: 14, bottom: 16, height: 8, borderRadius: 4, background: dark ? 'rgba(255,255,255,0.35)' : C.terra, opacity: 0.8}} />}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ overlay */
const FEED_BASE = [['@nara', 'B-04'], ['@adit', 'A-02'], ['@mika', 'D-07'], ['@sora', 'C-01'], ['@juli', 'B-06'], ['@rian', 'A-08'], ['@devi', 'D-03'], ['@yuki', 'C-05'], ['@lana', 'A-05'], ['@bima', 'C-07'], ['@tari', 'D-01'], ['@ezra', 'B-02']];
const FEED = Array.from({length: 12}, (_, i) => FEED_BASE[i % FEED_BASE.length]);

const Overlay: React.FC<{f: number; landed: number}> = ({f, landed}) => {
  const step = Math.floor(Math.max(0, f - 150) / 42);
  return (
    <>
      <div style={{position: 'absolute', left: 120, top: 120}}>
        <Kicker f={f} start={104} n="04" label="USER WAREHOUSE" />
        <div style={{marginTop: 22}}>
          <RevealText text="Every User." f={f} start={114} size={96} />
          <RevealText text="*One Living Space.*" f={f} start={126} size={96} />
        </div>
        <div style={{marginTop: 22, width: 470}}>
          <RevealText
            text="Setiap pengguna panel tersimpan sebagai objek 3D — tertata otomatis di rak digital."
            f={f}
            start={142}
            stagger={1.4}
            size={22}
            font="sans"
            color={C.ink2}
            tracking="-0.01em"
            lineHeight={1.4}
          />
        </div>
      </div>
      {/* kartu statistik */}
      <Glass f={f} at={170} style={{left: 120, bottom: 110, width: 420}}>
        <div style={{display: 'flex', gap: 34}}>
          {[
            ['Pengguna', <Counter key="a" f={f} start={170} to={2418} dur={300} />],
            ['Rak aktif', <span key="b">4</span>],
            ['Slot terisi', <span key="c">{landed}/64</span>],
          ].map(([l, v], i) => (
            <div key={i}>
              <div style={{fontSize: 13, color: C.ink3, fontFamily: F.mono, letterSpacing: '0.08em'}}>{(l as string).toUpperCase()}</div>
              <div style={{fontSize: 34, fontWeight: 650, letterSpacing: '-0.04em', marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
            </div>
          ))}
        </div>
      </Glass>
      {/* feed */}
      <Glass f={f} at={190} style={{right: 120, bottom: 110, width: 360, height: 196, overflow: 'hidden'}}>
        <div style={{fontSize: 13, color: C.ink3, fontFamily: F.mono, letterSpacing: '0.08em', marginBottom: 12}}>● PENEMPATAN OTOMATIS</div>
        <div style={{position: 'relative', height: 130, overflow: 'hidden'}}>
          {FEED.map(([u, slot], i) => {
            const k = i - step;
            const yy = ramp(f, [150 + i * 42, 150 + i * 42 + 18], [1, 0], E.out);
            if (k > 0 || k < -3) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (-k) * 42 + yy * -30,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 16,
                  opacity: (1 - yy) * (1 - (-k) * 0.28),
                }}
              >
                <span style={{fontFamily: F.mono, fontWeight: 600}}>{u}</span>
                <span style={{margin: '0 10px', color: C.ink3}}>→</span>
                <span style={{color: C.ink2}}>Rak {slot}</span>
                <span style={{marginLeft: 'auto', width: 8, height: 8, borderRadius: 4, background: k === 0 ? C.terra : C.green}} />
              </div>
            );
          })}
        </div>
      </Glass>
    </>
  );
};

const Glass: React.FC<{f: number; at: number; style: React.CSSProperties; children: React.ReactNode}> = ({f, at, style, children}) => {
  const p = spr(f, at, SPR.gentle);
  return (
    <div
      style={{
        position: 'absolute',
        padding: 24,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.78)',
        border: `1px solid rgba(255,255,255,0.9)`,
        boxShadow: shadow.card,
        fontFamily: F.sans,
        color: C.ink,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
