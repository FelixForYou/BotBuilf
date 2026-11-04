import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cpu} from 'lucide-react';
import {Panel, Stage, WarmGlow, LightSweep, WaveLight} from '../components/core';
import {ContainerBox, PteroMark, ServerRack} from '../components/graphics';
import {ChatWindow, Msg} from '../components/chat';
import {ChartBox, ConsoleBox, ConsoleLine} from '../components/ptero';
import {Sfx} from '../components/Sfx';
import {cpuSim} from './S5';
import {E, clamp01, drift, ip, kf, sp} from '../lib/anim';
import {C, FONT} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 04:35–05:00 — Penutup
 * Shot 42 objek-objek kembali dan tersusun: server, container, console, grafik, percakapan
 * Shot 43 kamera mundur perlahan, panel tetap aktif
 * Shot 44 judul bertahap + kredit; berakhir tepat di detik 300
 */
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s10');
  const tGame = L(0, 'server game');
  const tBots = L(1);
  const tTg = L(1, 'telegram');
  const tKenali = L(2);
  const tEnd = LE(2);

  const pull = ip(f, [0, dur], [0, 1], E.soft);
  const sc = kf(f, [0, tBots, tKenali, dur], [1.15, 0.95, 0.78, 0.72], E.inOut);
  const ry = kf(f, [0, dur], [-16, 8], E.inOut) + drift(f, 33, 1.5, 0.4);
  const rx = kf(f, [0, dur], [14, 8], E.inOut);
  const lift = kf(f, [tKenali - 30, tKenali + 60], [0, -120], E.inOut);
  const fadeEnd = ip(f, [dur - 50, dur - 2], [0, 1], E.in);

  const lines: ConsoleLine[] = [
    {at: -100, text: '[ok]   terhubung ke Bot API Telegram', kind: 'ok'},
    {at: 40, text: '[info] pesan masuk: /jadwal', kind: 'info'},
    {at: 160, text: '[ok]   balasan terkirim', kind: 'ok'},
    {at: 420, text: '[info] notifikasi terjadwal dikirim', kind: 'info'},
    {at: 700, text: '[info] pesan masuk: /bantuan', kind: 'info'},
    {at: 860, text: '[ok]   balasan terkirim', kind: 'ok'},
  ];
  const tgMsgs: Msg[] = [
    {at: 30, text: '/jadwal', from: 'user', time: '07.58'},
    {at: 150, typingFrom: 70, text: 'Jadwal hari ini siap.', from: 'bot', time: '07.58'},
  ];
  const waMsgs: Msg[] = [
    {at: tTg + 10, text: 'Kantor buka hari apa?', from: 'user', time: '10.02'},
    {at: tTg + 120, typingFrom: tTg + 50, text: 'Senin–Jumat.', from: 'bot', time: '10.02'},
  ];

  // kartu-kartu yang terbang masuk (posisi akhir, delay)
  const cards: {x: number; y: number; z: number; w: number; h: number; d: number; r: number; node: React.ReactNode; bg: string}[] = [
    {x: -560, y: -170, z: -120, w: 520, h: 330, d: 0, r: -4, bg: '#0d1014', node: <ConsoleBox w={520} h={330} lines={lines} size={18} showInput={false} />},
    {x: 30, y: -250, z: 40, w: 560, h: 260, d: 14, r: 2, bg: '#1f2630', node: <ChartBox w={560} h={260} label="CPU" value={cpuSim} icon={Cpu} color={C.ptero} />},
    {x: 600, y: -130, z: -60, w: 400, h: 560, d: 28, r: 4, bg: '#efeae2', node: <ChatWindow w={400} h={560} platform="telegram" title="Asisten Bot" subtitle="contoh fiktif" msgs={tgMsgs} size={19} />},
    {x: -470, y: 250, z: 60, w: 460, h: 300, d: 40, r: 3, bg: '#ffffff', node: (
      <div style={{width: 460, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff'}}>
        <ServerRack w={300} units={3} active={1} seed={5} />
      </div>
    )},
    {x: 70, y: 220, z: 120, w: 420, h: 320, d: 52, r: -3, bg: '#fffaf6', node: (
      <div style={{width: 420, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffaf6'}}>
        <ContainerBox size={260} color={C.ink} glow={C.coral} />
      </div>
    )},
    {x: 610, y: 300, z: 80, w: 380, h: 420, d: 64, r: -5, bg: '#efeae2', node: <ChatWindow w={380} h={420} platform="whatsapp" title="Info Kantor" subtitle="contoh fiktif" msgs={waMsgs} size={18} />},
  ];

  const title = sp(f, tTg + 40, {damping: 18, stiffness: 80});
  const tag = sp(f, tKenali + 10, {damping: 18, stiffness: 80});
  const credit = ip(f, [tKenali + 140, tKenali + 180], [0, 1]);

  return (
    <Stage dark={1}>
      <AbsoluteFill style={{background: '#050505'}} />
      <LightSweep o={0.45 * (1 - fadeEnd)} seed={35} angle={-34} />
      <WarmGlow x={960} y={520} r={1000} o={0.85 * (1 - fadeEnd)} seed={36} />
      <WaveLight y={900} amp={24} o={0.4 * ip(f, [tKenali, tKenali + 60], [0, 1]) * (1 - fadeEnd)} seed={9} />

      <AbsoluteFill style={{perspective: 2200, opacity: 1 - fadeEnd}}>
        <div style={{position: 'absolute', left: 960, top: 520 + lift, transformStyle: 'preserve-3d',
          transform: `translateZ(${-200 * pull}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
          {cards.map((c, i) => {
            const a = sp(f, c.d, {damping: 20, stiffness: 60});
            const from = {x: c.x * 2.4, y: c.y * 2.4 + (i % 2 ? 300 : -300), z: -900};
            const x = from.x + (c.x - from.x) * a;
            const y = from.y + (c.y - from.y) * a;
            const z = from.z + (c.z - from.z) * a + 20 * Math.sin(f * 0.012 + i);
            return (
              <div key={i} style={{position: 'absolute', left: -c.w / 2, top: -c.h / 2, opacity: clamp01(a * 1.5),
                transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${c.r * (1 - a) * 3 + c.r * 0.3}deg)`}}>
                <Panel w={c.w} h={c.h} bg={c.bg} glow={0.7} radius={20}>
                  {c.node}
                </Panel>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* tipografi ringkasan */}
      <div style={{position: 'absolute', left: 960, top: 120, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
        whiteSpace: 'nowrap', opacity: ip(f, [tGame - 20, tGame + 10], [0, 1]) * (1 - ip(f, [tTg + 20, tTg + 50], [0, 1]))}}>
        dari server game, kini juga untuk bot Telegram & WhatsApp
      </div>

      <div style={{position: 'absolute', left: 960, top: 830, transform: `translate(-50%, -50%) translateY(${(1 - clamp01(title)) * 50}px)`, opacity: clamp01(title) * (1 - fadeEnd),
        display: 'flex', alignItems: 'center', gap: 30, filter: `blur(${(1 - clamp01(title)) * 8}px)`}}>
        <PteroMark size={96} draw={ip(f, [tTg + 30, tTg + 100], [0, 1])} />
        <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 110, letterSpacing: '-0.035em', color: '#fff', whiteSpace: 'nowrap'}}>
          Pterodactyl <span style={{color: C.coralSoft}}>Panel</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 960, top: 940, transform: `translate(-50%, -50%) translateY(${(1 - clamp01(tag)) * 30}px)`, opacity: clamp01(tag) * (1 - fadeEnd),
        fontFamily: FONT, fontSize: 46, fontWeight: 550, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap'}}>
        Kenali proses di balik botmu.
      </div>
      <div style={{position: 'absolute', right: 70, bottom: 44, opacity: credit * (1 - fadeEnd), fontFamily: FONT, fontSize: 22, fontWeight: 500, letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.6)', textAlign: 'right'}}>
        Visual explainer by FELIXIORITY
        <div style={{fontSize: 16, opacity: 0.75, marginTop: 4, letterSpacing: '0.02em'}}>Tidak berafiliasi dengan proyek Pterodactyl, Telegram, atau WhatsApp.</div>
      </div>

      <Sfx at={0} s="slide_heavy_2" v={0.26} />
      <Sfx at={14} s="slide_glass_1" v={0.2} />
      <Sfx at={28} s="slide_glass_2" v={0.18} />
      <Sfx at={44} s="slide_paper_1" v={0.16} />
      <Sfx at={60} s="thud_3" v={0.24} />
      <Sfx at={tTg + 10} s="pop_2" v={0.18} />
      <Sfx at={tTg + 34} s="shimmer_2" v={0.26} />
      <Sfx at={tKenali + 8} s="snap_1" v={0.18} />
      <Sfx at={tEnd} s="thud_1" v={0.16} />
    </Stage>
  );
};
