import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cpu, MemoryStick, HardDrive, Network, Feather, Ban} from 'lucide-react';
import {Box3D, HBeam, KText, Panel, Stage, VBeam, WarmGlow, LightSweep} from '../components/core';
import {Icon, TelegramLogo, WhatsAppLogo} from '../components/graphics';
import {Sfx} from '../components/Sfx';
import {MiniDash} from './shared';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 01:25–02:00 — Cara kerjanya secara konseptual
 * Shot 15 kamera turun ke lapisan VPS; modul CPU/RAM/penyimpanan/jaringan menyala
 * Shot 16 lapisan Panel melayang di atas; kamera menengadah
 * Shot 17 jalur perintah Panel -> Wings (daemon di node)
 * Shot 18 Wings membuka container; kode bot berjalan di dalamnya
 * Shot 19 dua jalur: perintah pengelolaan vs pesan pengguna (langsung ke bot)
 */
export const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s4');
  const tVps = L(0, 'vps');
  const tCpu = L(0, 'cpu');
  const tRam = L(0, 'ram');
  const tSto = L(0, 'penyimpanan');
  const tNet = L(0, 'jaringan');
  const tPanel = L(1);
  const tBrowser = L(1, 'browser');
  const tCmd = L(2);
  const tWings = L(2, 'wings');
  const tNode = L(2, 'node');
  const tCont = L(3);
  const tCode = L(3, 'kode bot');
  const tTwo = L(4);
  const tMgmt = L(4, 'perintah');
  const tMsg = L(4, 'sedangkan');
  const tDirect = L(4, 'langsung');
  const tNot = L(4, 'tanpa');

  // kamera (orbit isometrik)
  const rx = kf(f, [0, tVps, tPanel, tCmd, tCont, tTwo, dur], [20, 58, 50, 54, 60, 52, 50], E.inOut);
  const rz = kf(f, [0, tVps, tPanel, tCont, tTwo, dur], [0, -32, -26, -38, -28, -22], E.inOut) + drift(f, 7, 1.2, 0.5);
  const sc = kf(f, [0, tVps, tSto, tPanel, tCmd, tCont, tCode + 30, tTwo, dur], [1.6, 1.12, 1.02, 0.82, 0.84, 0.92, 0.95, 0.76, 0.72], E.inOut);
  const ty = kf(f, [0, tPanel, tCmd, tCont, tTwo], [0, 170, 150, 170, 130], E.inOut);
  const tx = kf(f, [tCont, tCode + 30, tTwo], [0, 120, 40], E.inOut);

  // lapisan
  const vps = sp(f, 4, {damping: 22, stiffness: 50});
  const mods = [
    {t: tCpu, icon: Cpu, label: 'CPU', x: -300, y: -150},
    {t: tRam, icon: MemoryStick, label: 'RAM', x: -300, y: -20},
    {t: tSto, icon: HardDrive, label: 'Penyimpanan', x: -300, y: 110},
    {t: tNet, icon: Network, label: 'Jaringan', x: -300, y: 240},
  ];
  const panelIn = sp(f, tPanel - 10, {damping: 18, stiffness: 70});
  const wingsIn = sp(f, tWings - 10, {damping: 14});
  const cmdDraw = ip(f, [tCmd + 10, tWings + 20], [0, 1], E.inOut);
  const contIn = sp(f, tNode, {damping: 16, stiffness: 90});
  const lidOpen = ip(f, [tCont + 10, tCont + 60], [0, 1], E.inOut);
  const codeRun = ip(f, [tCode - 10, tCode + 20], [0, 1]);
  const msgDraw = ip(f, [tMsg, tDirect + 30], [0, 1], E.inOut);
  const mgmtPulse = ip(f, [tMgmt - 10, tMgmt + 20], [0, 1]);
  const notX = sp(f, tNot, {damping: 14});

  const PANEL_Z = 520;
  const WX = 120, WY = -170; // Wings
  const CX = 150, CY = 120; // container

  const pk = (start: number, speed = 0.012, n = 2) =>
    f < start ? [] : Array.from({length: n}).map((_, i) => (((f - start) * speed + i / n) % 1 + 1) % 1);

  return (
    <Stage dark={1}>
      <AbsoluteFill style={{background: '#050505'}} />
      <LightSweep o={0.3} seed={7} angle={-28} />
      <WarmGlow x={960} y={600} r={900} o={0.7} seed={8} />

      <AbsoluteFill style={{perspective: 2400}}>
        <div style={{position: 'absolute', left: 960 - tx, top: 560 + ty, transformStyle: 'preserve-3d',
          transform: `scale(${sc}) rotateX(${rx}deg) rotateZ(${rz}deg)`}}>
          {/* VPS / mesin server */}
          <Box3D w={980} d={700} h={46} z={-46 + 0 * vps} o={clamp01(vps * 1.4)} top="#171b21" side="#0c0f13" front="#11151a"
            topStyle={{boxShadow: `inset 0 0 0 2px rgba(255,106,43,${0.35 * vps})`}}>
            <div style={{position: 'absolute', left: 30, top: 22, fontFamily: FONT, fontSize: 28, fontWeight: 700, color: '#e9edf2', letterSpacing: '-0.01em'}}>
              VPS / mesin server
            </div>
            <div style={{position: 'absolute', left: 30, top: 60, fontFamily: MONO, fontSize: 18, color: '#7d8898'}}>node · sumber daya komputasi</div>
            {/* grid */}
            <svg width={980} height={700} style={{position: 'absolute', inset: 0}}>
              {Array.from({length: 13}).map((_, i) => (
                <line key={i} x1={i * 80} x2={i * 80} y1={0} y2={700} stroke="#fff" strokeOpacity={0.035} />
              ))}
              {Array.from({length: 9}).map((_, i) => (
                <line key={i} y1={i * 80} y2={i * 80} x1={0} x2={980} stroke="#fff" strokeOpacity={0.035} />
              ))}
            </svg>
          </Box3D>
          {/* modul sumber daya */}
          {mods.map((m, i) => {
            const a = sp(f, m.t - 8, {damping: 13});
            const lit = 0.6 + 0.4 * Math.sin(f * 0.08 + i);
            return (
              <Box3D key={i} x={m.x} y={m.y} w={240} d={100} h={18 + 22 * clamp01(a)} o={clamp01(a)} top="#232a34" side="#151a20" front="#1a2028"
                topStyle={{display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', boxShadow: `inset 0 0 0 2px rgba(255,106,43,${0.5 * lit * clamp01(a)})`}}>
                <Icon i={m.icon} size={34} color={C.coralSoft} draw={p(f, m.t, 30)} />
                <span style={{fontFamily: FONT, fontWeight: 650, fontSize: 24, color: '#e9edf2'}}>{m.label}</span>
              </Box3D>
            );
          })}
          {/* Wings */}
          <Box3D x={WX} y={WY} w={300} d={150} h={24 + 36 * clamp01(wingsIn)} o={clamp01(wingsIn)} top="#1f2733" side="#121820" front="#18202a"
            topStyle={{display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', boxShadow: `inset 0 0 0 2px rgba(61,123,253,${0.7 * clamp01(wingsIn)})`}}>
            <Icon i={Feather} size={34} color="#7aa6ff" />
            <div style={{fontFamily: FONT}}>
              <div style={{fontSize: 28, fontWeight: 700, color: '#fff'}}>Wings</div>
              <div style={{fontSize: 17, color: '#8fa1b8', fontFamily: MONO}}>daemon · kelola container</div>
            </div>
          </Box3D>
          {/* container + kode bot */}
          <Box3D x={CX} y={CY} w={380} d={250} h={30 + 90 * clamp01(contIn)} o={clamp01(contIn)} top={`rgba(13,16,20,${1 - 0.0 * lidOpen})`} side="#11161c" front="#141a21"
            border="rgba(255,106,43,0.55)"
            topStyle={{padding: 20, boxSizing: 'border-box'}}>
            <div style={{fontFamily: FONT, fontSize: 20, fontWeight: 650, color: C.coralSoft, marginBottom: 10}}>container · lingkungan terpisah</div>
            <div style={{fontFamily: MONO, fontSize: 18, lineHeight: 1.55, color: '#c9d2de', opacity: lidOpen}}>
              {['bot.on("message", balas)', 'const jawab = cari(teks)', 'kirim(jawab)', 'log("pesan diproses")'].map((l, i) => {
                const active = codeRun > 0 && Math.floor(f / 18) % 4 === i;
                return (
                  <div key={i} style={{color: active ? '#fff' : '#8b97a8', background: active ? 'rgba(255,106,43,0.18)' : undefined, borderRadius: 4, padding: '0 6px'}}>
                    {l}
                  </div>
                );
              })}
            </div>
          </Box3D>

          {/* Panel melayang + jalur perintah ke Wings */}
          <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d',
            transform: `translate3d(-120px, -40px, ${PANEL_Z + (1 - panelIn) * 200}px) rotateZ(${-rz}deg) rotateX(${-rx + 8}deg)`, opacity: clamp01(panelIn) * (1 - 0.55 * msgDraw)}}>
            <div style={{position: 'absolute', left: -330, top: -230}}>
              <Panel w={660} h={400} bg="#151a21" glow={0.9 * clamp01(panelIn)} radius={20}>
                <MiniDash big seed={2} />
              </Panel>
              <div style={{position: 'absolute', left: 0, right: 0, top: -64, textAlign: 'center', fontFamily: FONT, fontSize: 30, fontWeight: 700, color: '#fff',
                opacity: ip(f, [tBrowser - 10, tBrowser + 20], [0, 1])}}>
                Panel · antarmuka web di browser
              </div>
            </div>
          </div>
          <VBeam f={f} x={WX} y={WY} z0={60} z1={PANEL_Z - 60} color={C.coral} draw={cmdDraw} t={pk(tWings + 20, 0.01 * (1 + mgmtPulse), 2)} dashed />
          {/* Wings -> container */}
          <HBeam x0={WX} y0={WY + 70} x1={CX} y1={CY - 120} z={62} color={C.coral} draw={ip(f, [tNode, tCont], [0, 1])} t={pk(tCont, 0.014, 1)} width={4} />

          {/* layanan platform (di luar node) -> langsung ke bot */}
          <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translate3d(820px, 360px, 220px) rotateZ(${-rz}deg) rotateX(${-rx}deg)`,
            opacity: ip(f, [tMsg - 20, tMsg + 10], [0, 1])}}>
            <div style={{position: 'absolute', left: -150, top: -80, width: 300, height: 160, borderRadius: 28, background: 'rgba(255,255,255,0.96)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
              <TelegramLogo size={70} />
              <WhatsAppLogo size={70} />
            </div>
            <div style={{position: 'absolute', left: -200, width: 400, top: 96, textAlign: 'center', fontFamily: FONT, fontSize: 22, fontWeight: 600, color: '#fff'}}>
              layanan platform
            </div>
          </div>
          <HBeam x0={820} y0={360} x1={CX + 120} y1={CY + 60} z={140} color={C.telegram} draw={msgDraw} t={pk(tDirect, 0.011, 3)} width={5} />
          <HBeam x0={820} y0={400} x1={CX + 140} y1={CY + 100} z={120} color={C.whatsapp} draw={msgDraw} t={pk(tDirect + 20, 0.011, 3)} width={5} />
        </div>
      </AbsoluteFill>

      {/* tanda: pesan tidak lewat dashboard */}
      <div style={{position: 'absolute', left: 1380, top: 150, opacity: clamp01(notX), transform: `scale(${0.8 + 0.2 * clamp01(notX)})`, display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px', borderRadius: 16, background: 'rgba(20,20,22,0.85)', border: '1px solid rgba(255,255,255,0.15)'}}>
        <Icon i={Ban} size={30} color={C.coralSoft} />
        <span style={{fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#fff'}}>pesan tidak melewati dashboard</span>
      </div>
      {/* legenda dua jalur */}
      <div style={{position: 'absolute', left: 90, top: 120, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#fff'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: ip(f, [tMgmt - 10, tMgmt + 15], [0, 1])}}>
          <div style={{width: 46, height: 6, borderRadius: 3, background: C.coral, boxShadow: `0 0 10px ${C.coral}`}} /> jalur pengelolaan: Panel ke Wings
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: ip(f, [tMsg, tMsg + 25], [0, 1])}}>
          <div style={{width: 46, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.telegram}, ${C.whatsapp})`}} /> jalur pesan: platform ke bot
        </div>
      </div>

      <KText text="Server menyediakan tenaga." at={tCpu} out={tPanel - 6} x={960} y={970} size={54} color="#fff" accent={[{word: 'tenaga.', color: C.coralSoft}]} />
      <KText text="Panel mengelola." at={tWings} out={tCont - 6} x={960} y={970} size={54} color="#fff" accent={[{word: 'mengelola.', color: C.coralSoft}]} />
      <KText text="Bot menjalankan logika." at={tCode - 10} out={tTwo + 20} x={960} y={970} size={54} color="#fff" accent={[{word: 'logika.', color: C.coralSoft}]} />

      <Sfx at={0} s="slide_heavy_2" v={0.3} />
      <Sfx at={tVps - 20} s="thud_3" v={0.4} />
      <Sfx at={tCpu - 8} s="click_1" v={0.25} />
      <Sfx at={tRam - 8} s="click_3" v={0.25} />
      <Sfx at={tSto - 8} s="click_2" v={0.25} />
      <Sfx at={tNet - 8} s="click_4" v={0.25} />
      <Sfx at={tPanel - 10} s="slide_glass_1" v={0.3} />
      <Sfx at={tWings - 10} s="thud_2" v={0.3} />
      <Sfx at={tWings + 20} s="data_1" v={0.2} />
      <Sfx at={tNode} s="snap_2" v={0.24} />
      <Sfx at={tCont + 8} s="slide_paper_1" v={0.22} />
      <Sfx at={tCode - 10} s="type_2" v={0.18} />
      <Sfx at={tMsg} s="slide_soft_1" v={0.22} />
      <Sfx at={tDirect} s="data_2" v={0.2} />
      <Sfx at={tNot} s="snap_3" v={0.24} />
      <Sfx at={LE(4) + 10} s="suck_1" v={0.24} />
    </Stage>
  );
};
