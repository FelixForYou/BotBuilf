import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bubble} from '../components/chat';
import {KText, Panel, Stage, WarmGlow, World, IrisWipe, WaveLight} from '../components/core';
import {PteroMark, ServerRack, TelegramLogo} from '../components/graphics';
import {At, WSvg, cpath, cbez, Pt} from '../components/world';
import {Sfx} from '../components/Sfx';
import {MiniDash} from './shared';
import {E, clamp01, drift, ip, kf, sp} from '../lib/anim';
import {C, FONT} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 00:00–00:25 — Pembuka: di balik balasan bot
 * Shot 1  teks "Pesan masuk." + gelembung pengguna
 * Shot 2  "Bot membalas." + gelembung balasan
 * Shot 3  "Apa yang bekerja di baliknya?" — kamera mengikuti pesan ke server
 * Shot 4  pesan masuk ke server, balasan keluar; latar berganti hitam
 * Shot 5  mundur: panel pengelolaan melayang + judul "Pterodactyl Panel"
 */
export const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {L, dur} = cues('s1');

  const tIn = L(0);
  const tBot = L(0, 'bot');
  const tQ = L(1, 'tapi');
  const tApp = L(2);
  const tServer = L(2, 'server');
  const tPanel = L(3);
  const tName = L(3, 'pterodactyl');

  // --- kamera dunia ---
  const camX = kf(f, [0, tQ, tQ + 150, tApp + 40], [0, 0, 620, 980], E.inOut);
  const camY = kf(f, [tApp, tPanel], [0, -10]);
  const pull = ip(f, [tPanel - 30, tName + 60], [0, 1], E.inOut);
  const camZ = kf(f, [0, tQ, tApp + 60, tPanel - 30, tName + 60, dur], [0, -60, 120, 160, -260, -330], E.inOut);
  const camRy = kf(f, [tPanel - 20, tName + 40, dur], [0, -8, -4], E.inOut) + drift(f, 2, 0.6, 0.6);
  const camRx = kf(f, [tPanel - 20, dur], [0, 4]);

  // --- latar putih -> hitam lewat iris dari server ---
  const irisStart = tPanel - 70;
  const iris = ip(f, [irisStart, irisStart + 55], [0, 1], E.in);

  // --- gelembung & jalur pesan ---
  const userBubbleIn = sp(f, tIn + 18, {damping: 14});
  const botBubbleIn = sp(f, tBot + 14, {damping: 14});
  const serverPos: Pt = [980, 20];
  const pathA: Pt[] = [[-300, 140], [100, 340], [600, 300], [serverPos[0] - 190, serverPos[1] + 20]];
  const travel = ip(f, [tQ + 30, tApp + 10], [0, 1], E.inOut);
  const shrink = ip(f, [tQ, tQ + 40], [1, 0.38], E.out);
  const msgPos = cbez(travel, pathA[0], pathA[1], pathA[2], pathA[3]);
  const pathB: Pt[] = [[serverPos[0] + 210, serverPos[1] - 20], [1300, -120], [1420, -260], [1520, -300]];
  const replyT = ip(f, [tServer - 10, tServer + 80], [0, 1], E.out);
  const replyPos = cbez(replyT, pathB[0], pathB[1], pathB[2], pathB[3]);
  const serverDraw = ip(f, [tQ + 40, tQ + 140], [0, 1], E.inOut);
  const serverActive = ip(f, [tApp - 10, tApp + 20], [0, 1]);
  const absorb = ip(f, [tApp - 5, tApp + 12], [0, 1]);

  return (
    <Stage dark={0}>
      <World cam={{x: camX, y: camY, z: camZ, ry: camRy, rx: camRx}}>
        {/* jalur pesan putus-putus */}
        <WSvg>
          <path d={cpath(pathA[0], pathA[1], pathA[2], pathA[3])} stroke={C.ink} strokeOpacity={0.35 * ip(f, [tQ + 10, tQ + 50], [0, 1]) * (1 - iris)}
            strokeWidth={2} strokeDasharray="8 10" strokeDashoffset={-f * 0.6} fill="none" />
          <path d={cpath(pathB[0], pathB[1], pathB[2], pathB[3])} stroke={C.ink} strokeOpacity={0.35 * ip(f, [tServer - 20, tServer + 20], [0, 1]) * (1 - iris)}
            strokeWidth={2} strokeDasharray="8 10" strokeDashoffset={-f * 0.6} fill="none" />
        </WSvg>

        {/* server abstrak */}
        <At x={serverPos[0]} y={serverPos[1]} s={1 + 0.04 * Math.sin(Math.PI * absorb)} o={ip(f, [tQ + 30, tQ + 60], [0, 1])}>
          <div style={{position: 'relative'}}>
            <ServerRack w={380} units={3} draw={serverDraw} active={serverActive} seed={1} />
            <div style={{position: 'absolute', left: '50%', top: -70, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 24, fontWeight: 600,
              color: C.ink, whiteSpace: 'nowrap', opacity: ip(f, [tApp + 10, tApp + 40], [0, 1]) * (1 - iris)}}>
              Aplikasi bot sedang berjalan
            </div>
            <div style={{position: 'absolute', left: '50%', bottom: -64, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 21, fontWeight: 500,
              color: C.gray, whiteSpace: 'nowrap', opacity: ip(f, [tServer, tServer + 30], [0, 1]) * (1 - iris)}}>
              perangkat atau server yang aktif
            </div>
          </div>
        </At>

        {/* gelembung pengguna -> perjalanan ke server */}
        <At x={f < tQ ? -300 : msgPos[0]} y={f < tQ ? 140 : msgPos[1]} s={userBubbleIn * shrink * (1 - absorb)} o={1 - absorb}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <Bubble text="Halo, jam buka hari ini?" from="user" platform="telegram" size={30} />
          </div>
        </At>
        {/* balasan bot muncul di kanan (shot 2), lalu keluar dari server (shot 4) */}
        <At x={f < tQ ? 330 : replyPos[0]} y={f < tQ ? 140 : replyPos[1]}
          s={f < tQ ? botBubbleIn * ip(f, [tQ - 20, tQ], [1, 0.0001]) : ip(f, [tServer - 10, tServer + 20], [0.3, 0.6], E.back)}
          o={f < tQ ? 1 : ip(f, [tServer - 10, tServer + 5], [0, 1]) * (1 - iris)}>
          <Bubble text="Buka pukul 08.00–17.00." from="bot" platform="telegram" size={30} />
        </At>
        {/* ikon platform kecil di awal jalur */}
        <At x={-560} y={140} s={ip(f, [tIn + 10, tIn + 40], [0, 1], E.back) * ip(f, [tQ, tQ + 30], [1, 0])}>
          <TelegramLogo size={44} />
        </At>

      </World>

      {/* teks layar putih */}
      {f < tQ + 40 && (
        <>
          <KText text="Pesan masuk." at={tIn} out={tQ - 10} x={600} y={300} size={84} weight={650} />
          <KText text="Bot membalas." at={tBot} out={tQ - 6} x={1330} y={300} size={84} weight={650} accent={[{word: 'membalas', color: C.ember}]} />
        </>
      )}
      <KText text="Apa yang bekerja di baliknya?" at={tQ + 6} out={tApp - 10} x={960} y={860} size={64} weight={600}
        accent={[{word: 'baliknya', color: C.ember}]} />

      {/* iris putih -> hitam */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <IrisWipe progress={iris} x={960} y={540} color="#050505" />
      </AbsoluteFill>

      {iris > 0 && <DarkLayer f={f} tPanel={tPanel} tName={tName} dur={dur} iris={iris} />}

      {/* SFX */}
      <Sfx at={tIn - 2} s="snap_1" v={0.25} />
      <Sfx at={tIn + 18} s="pop_1" v={0.35} />
      <Sfx at={tBot - 2} s="snap_3" v={0.22} />
      <Sfx at={tBot + 14} s="pop_3" v={0.3} />
      <Sfx at={tQ + 10} s="slide_paper_1" v={0.3} />
      <Sfx at={tQ + 40} s="draw_2" v={0.25} />
      <Sfx at={tQ + 110} s="slide_soft_1" v={0.25} />
      <Sfx at={tApp - 6} s="suck_1" v={0.25} />
      <Sfx at={tApp + 4} s="data_3" v={0.25} />
      <Sfx at={tServer - 8} s="pop_2" v={0.28} />
      <Sfx at={irisStart} s="riser_1" v={0.25} />
      <Sfx at={tPanel + 6} s="slide_heavy_1" v={0.35} />
      <Sfx at={tName - 10} s="shimmer_1" v={0.28} />
    </Stage>
  );
};

/** Hitam + cahaya + judul. Dirender di atas iris, objek dunia dirender ulang di atasnya. */
const DarkLayer: React.FC<{f: number; tPanel: number; tName: number; dur: number; iris: number}> = ({f, tPanel, tName, dur, iris}) => {
  const glow = ip(f, [tPanel - 30, tPanel + 60], [0, 1]);
  const title = sp(f, tName - 6, {damping: 16, stiffness: 90});
  const logoIn = ip(f, [tName - 20, tName + 40], [0, 1], E.out);
  const panelIn = sp(f, tPanel + 10, {damping: 20, stiffness: 70});
  const settle = ip(f, [tName, dur], [0, 1], E.soft);
  return (
    <AbsoluteFill style={{opacity: ip(iris, [0.5, 1], [0, 1])}}>
      <AbsoluteFill style={{background: '#050505'}} />
      <WaveLight y={620} amp={36} o={0.55 * glow} progress={glow} seed={1} />
      <WarmGlow x={960} y={560} r={820} o={0.85 * glow} seed={2} />
      {/* panel melayang, tampilan kamera tetap (ruang hitam) */}
      <AbsoluteFill style={{perspective: 1800}}>
        <div style={{position: 'absolute', left: 960, top: 520, transformStyle: 'preserve-3d',
          transform: `rotateY(${-10 + 6 * settle + drift(f, 3, 1.2, 0.6)}deg) rotateX(${6 - 2 * settle}deg)`}}>
          {[-1, 1].map((side) => (
            <div key={side} style={{position: 'absolute', left: -230 + side * 520, top: -145 + side * 40,
              transform: `translateZ(${-280 + 30 * Math.sin(f * 0.01 + side)}px) rotateY(${side * -8}deg) scale(${0.85 + 0.15 * panelIn})`, opacity: 0.85 * panelIn}}>
              <Panel w={460} h={290} bg={side < 0 ? '#151a21' : '#f4f1ee'} glow={0.5 * panelIn} radius={18}>
                <MiniDash light={side > 0} seed={side} />
              </Panel>
            </div>
          ))}
          <div style={{position: 'absolute', left: -380, top: -230, transform: `translateZ(${-120 + 120 * panelIn}px) scale(${0.7 + 0.3 * panelIn})`, opacity: panelIn}}>
            <Panel w={760} h={460} bg="#151a21" glow={0.9 * panelIn} radius={22}>
              <MiniDash seed={0} big />
            </Panel>
          </div>
        </div>
      </AbsoluteFill>
      {/* judul besar menyatu dengan gerak panel */}
      <div style={{position: 'absolute', left: 960, top: 905, transform: `translate(-50%, -50%) translateY(${(1 - title) * 40}px)`, opacity: clamp01(title * 1.3),
        display: 'flex', alignItems: 'center', gap: 28, filter: `blur(${(1 - clamp01(title)) * 10}px)`}}>
        <PteroMark size={92} draw={logoIn} />
        <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 104, letterSpacing: '-0.035em', color: '#fff', whiteSpace: 'nowrap'}}>
          Pterodactyl <span style={{color: C.coralSoft}}>Panel</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

