import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cpu, MemoryStick, Info} from 'lucide-react';
import {KText, SimTag, Stage, WarmGlow, LightSweep} from '../components/core';
import {Icon, TelegramLogo} from '../components/graphics';
import {ChartBox, ConsoleBox, ConsoleLine, FileList, PteroShell, PowerState, StatColumn, uptimeStr} from '../components/ptero';
import {Sfx} from '../components/Sfx';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT} from '../lib/theme';
import {cues} from '../lib/timeline';

/* Data simulasi yang dipakai juga oleh adegan lain. */
export const cpuSim = (fr: number) => 0.06 + 0.03 * Math.sin(fr * 0.031) + 0.02 * Math.sin(fr * 0.13 + 1) + 0.05 * Math.max(0, Math.sin(fr * 0.011)) ** 8;
export const ramSim = (fr: number) => 0.31 + 0.015 * Math.sin(fr * 0.007) + 0.01 * Math.sin(fr * 0.05);

/*
 * 02:00–02:35 — Satu tempat untuk mengawasi bot
 * Shot 20 masuk ke panel: halaman server "Asisten Bot" (fiktif)
 * Shot 21 console: output & error aplikasi
 * Shot 22 grafik CPU & RAM
 * Shot 23 file manager
 * Shot 24 kontrol start / stop / restart
 */
export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s5');
  const tName = L(0, 'asisten');
  const tCon = L(1);
  const tErr = L(1, 'error');
  const tChart = L(2);
  const tLow = L(2, 'angka');
  const tFiles = L(3);
  const tPow = L(4);
  const tStart = L(4, 'start');
  const tStop = L(4, 'stop');
  const tRestart = L(4, 'restart');

  const enter = sp(f, 0, {damping: 24, stiffness: 45});
  // fokus kamera per fitur
  const focusX = kf(f, [0, tCon, tCon + 40, tChart, tChart + 40, tFiles, tFiles + 40, tPow, tPow + 40, LE(4) + 20], [0, 0, 160, 160, 120, 120, 160, 160, 520, 60], E.inOut);
  const focusY = kf(f, [0, tCon, tCon + 40, tChart, tChart + 40, tFiles, tFiles + 40, tPow, tPow + 40, LE(4) + 20], [0, 0, -60, -60, 190, 190, -60, -60, -270, 0], E.inOut);
  const zoom = kf(f, [0, tCon, tCon + 40, tChart, tChart + 40, tFiles, tFiles + 40, tPow, tPow + 40, LE(4) + 20, dur], [0.86, 0.86, 1.12, 1.12, 1.14, 1.14, 1.1, 1.1, 1.45, 0.9, 0.86], E.inOut);
  const ry = kf(f, [0, 60, tCon, tChart, tFiles, tPow, dur], [-26, -12, -8, 6, -6, 4, -4], E.inOut) + drift(f, 9, 1, 0.5);
  const rx = kf(f, [0, 60, dur], [24, 10, 6], E.inOut);

  const chartsIn = ip(f, [tChart - 10, tChart + 40], [0, 1], E.inOut);
  const filesIn = ip(f, [tFiles - 10, tFiles + 30], [0, 1], E.inOut);
  const filesOut = ip(f, [tPow - 10, tPow + 20], [0, 1], E.inOut);
  const fileMode = filesIn * (1 - filesOut);

  // status daya
  let state: PowerState = 'running';
  let press: 'start' | 'restart' | 'stop' | null = null;
  let pressAmt = 0;
  if (f >= tStart - 4 && f < tStop - 4) {
    press = 'start';
    pressAmt = p(f, tStart - 4, 20);
  }
  if (f >= tStop - 4) {
    press = 'stop';
    pressAmt = p(f, tStop - 4, 16);
    state = f < tStop + 30 ? 'stopping' : 'offline';
  }
  if (f >= tRestart - 4) {
    press = 'restart';
    pressAmt = p(f, tRestart - 4, 16);
    state = f < tRestart + 50 ? 'starting' : 'running';
  }
  if (f > tRestart + 60) press = null;

  const lines: ConsoleLine[] = [
    {at: -400, text: '> asisten-bot@1.0.0 start', kind: 'cmd'},
    {at: -380, text: '> node index.js', kind: 'cmd'},
    {at: -300, text: '[info] memuat konfigurasi...', kind: 'info'},
    {at: -260, text: '[info] BOT_TOKEN=************ (disensor)', kind: 'dim'},
    {at: -200, text: '[ok]   terhubung ke Bot API Telegram', kind: 'ok'},
    {at: 40, text: '[info] menunggu pesan...', kind: 'info'},
    {at: tCon + 30, text: '[info] pesan masuk: /jadwal', kind: 'info'},
    {at: tErr - 4, text: '[error] gagal memuat jadwal: request timeout', kind: 'err'},
    {at: tErr + 40, text: '[warn] mencoba lagi (1/3)...', kind: 'warn'},
    {at: tErr + 90, text: '[ok]   jadwal terkirim', kind: 'ok'},
    {at: tChart + 60, text: '[info] pesan masuk: /bantuan', kind: 'info'},
    {at: tFiles + 30, text: '[info] pengingat harian terjadwal', kind: 'info'},
    {at: tStop + 6, text: '[panel] proses dihentikan', kind: 'warn'},
    {at: tRestart + 10, text: '> node index.js', kind: 'cmd'},
    {at: tRestart + 50, text: '[ok]   terhubung ke Bot API Telegram', kind: 'ok'},
  ];
  const errIdx = lines.findIndex((l) => l.kind === 'err');

  const W = 1600;
  const H = 920;
  const consoleH = 300 + 290 * (1 - chartsIn);

  return (
    <Stage dark={1}>
      <AbsoluteFill style={{background: '#050505'}} />
      <LightSweep o={0.28} seed={11} />
      <WarmGlow x={960} y={560} r={980} o={0.75} seed={12} />
      <AbsoluteFill style={{perspective: 2200}}>
        <div style={{position: 'absolute', left: 960, top: 560, transformStyle: 'preserve-3d',
          transform: `translateZ(${-600 * (1 - enter)}px) scale(${zoom}) rotateX(${rx}deg) rotateY(${ry}deg) translate(${-focusX}px, ${-focusY}px)`}}>
          <div style={{position: 'absolute', left: -W / 2, top: -H / 2, borderRadius: 26, overflow: 'hidden',
            boxShadow: `0 0 22px 4px ${C.coral}aa, 0 0 140px 30px ${C.coral}44, 0 40px 120px rgba(0,0,0,0.6)`}}>
            <PteroShell w={W} h={H} tab={fileMode > 0.5 ? 'Files' : 'Console'} state={state} press={press} pressAmt={pressAmt}
              desc="Bot Telegram · Node.js · contoh fiktif">
              {/* console + grafik */}
              <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - fileMode, transform: `translateX(${-60 * fileMode}px)`}}>
                <ConsoleBox w={1150} h={consoleH} lines={lines} size={22} highlight={errIdx} highlightAt={tErr + 4} />
                <div style={{position: 'absolute', left: 0, top: consoleH + 18, display: 'flex', gap: 20, opacity: chartsIn, transform: `translateY(${(1 - chartsIn) * 60}px)`}}>
                  <ChartBox w={565} h={272} label="CPU" value={cpuSim} icon={Cpu} color={C.ptero} draw={chartsIn} unit={(v) => `${(v * 100).toFixed(1)}%`} />
                  <ChartBox w={565} h={272} label="Memori" value={ramSim} icon={MemoryStick} color={C.coral} draw={chartsIn} unit={(v) => `${Math.round(v * 1024)} MiB`} />
                </div>
              </div>
              {/* file manager */}
              <div style={{position: 'absolute', left: 0, top: 0, opacity: fileMode, transform: `translateX(${60 * (1 - fileMode)}px)`}}>
                <FileList w={1150} size={23} hlAmt={ip(f, [tFiles + 40, tFiles + 70], [0, 1])} rows={[
                  {name: 'node_modules', size: '—', icon: 'folder', at: tFiles},
                  {name: 'src', size: '—', icon: 'folder', at: tFiles + 5},
                  {name: 'index.js', size: '4.1 KB', icon: 'code', at: tFiles + 10, hl: true},
                  {name: 'package.json', size: '0.6 KB', icon: 'code', at: tFiles + 15},
                  {name: '.env (isi disensor)', size: '0.1 KB', icon: 'key', at: tFiles + 20},
                  {name: 'bot.log', size: '18 KB', icon: 'text', at: tFiles + 25},
                ]} />
              </div>
              {/* kolom statistik */}
              <div style={{position: 'absolute', left: 1182, top: 0}}>
                <StatColumn cpu={state === 'offline' ? 0 : cpuSim(f)} mem={state === 'offline' ? 0 : ramSim(f)} disk="212 MiB" uptime={state === 'running' ? uptimeStr(f) : '—'} w={350} />
              </div>
            </PteroShell>
            <SimTag text="tampilan disederhanakan · data simulasi" style={{right: 34, bottom: 10}} />
          </div>
        </div>
      </AbsoluteFill>

      {/* label fitur */}
      <FeatureLabel f={f} at={tCon} out={tChart - 6} text="Console" sub="output & error aplikasi" />
      <FeatureLabel f={f} at={tChart} out={tFiles - 6} text="Grafik CPU & RAM" sub="pemakaian sumber daya dari waktu ke waktu" />
      <FeatureLabel f={f} at={tFiles} out={tPow - 6} text="File manager" sub="berkas aplikasi" />
      <FeatureLabel f={f} at={tPow} out={LE(4) + 10} text="Start · Stop · Restart" sub="mengatur jalannya proses" />

      {/* catatan: angka rendah != jaminan cepat */}
      <div style={{position: 'absolute', left: 960, top: 980, transform: 'translateX(-50%)', opacity: ip(f, [tLow - 6, tLow + 20], [0, 1]) * (1 - ip(f, [tFiles - 20, tFiles], [0, 1])),
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px', borderRadius: 999, background: 'rgba(20,20,22,0.9)', border: '1px solid rgba(255,255,255,0.15)'}}>
        <Icon i={Info} size={26} color={C.coralSoft} />
        <span style={{fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#fff'}}>CPU rendah belum tentu bot cepat — grafik membantu membaca pola</span>
      </div>

      {/* nama bot */}
      <div style={{position: 'absolute', left: 90, top: 70, display: 'flex', alignItems: 'center', gap: 16, opacity: ip(f, [tName - 10, tName + 20], [0, 1]) * (1 - ip(f, [tCon, tCon + 20], [0, 1]))}}>
        <TelegramLogo size={46} />
        <span style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: '#fff'}}>Asisten Bot</span>
        <span style={{fontFamily: FONT, fontSize: 22, color: 'rgba(255,255,255,0.55)'}}>bot fiktif</span>
      </div>
      <KText text="Satu tempat untuk mengawasi bot." at={10} out={tName + 10} x={960} y={110} size={52} color="#fff" accent={[{word: 'mengawasi', color: C.coralSoft}]} />

      <Sfx at={0} s="suck_2" v={0.26} />
      <Sfx at={20} s="slide_glass_2" v={0.26} />
      <Sfx at={tName - 6} s="pop_1" v={0.24} />
      <Sfx at={tCon + 4} s="slide_paper_2" v={0.22} />
      <Sfx at={tCon + 30} s="type_3" v={0.18} />
      <Sfx at={tErr - 4} s="error_1" v={0.24} />
      <Sfx at={tErr + 90} s="tick_3" v={0.22} />
      <Sfx at={tChart - 6} s="slide_soft_2" v={0.22} />
      <Sfx at={tChart + 10} s="draw_1" v={0.24} />
      <Sfx at={tLow - 6} s="snap_2" v={0.2} />
      <Sfx at={tFiles - 6} s="slide_paper_1" v={0.24} />
      <Sfx at={tFiles + 2} s="data_3" v={0.16} />
      <Sfx at={tPow} s="slide_soft_1" v={0.22} />
      <Sfx at={tStart - 4} s="click_1" v={0.3} />
      <Sfx at={tStop - 4} s="click_4" v={0.3} />
      <Sfx at={tRestart - 4} s="click_2" v={0.3} />
      <Sfx at={tRestart + 50} s="powerup_1" v={0.2} />
    </Stage>
  );
};

const FeatureLabel: React.FC<{f: number; at: number; out: number; text: string; sub: string}> = ({f, at, out, text, sub}) => {
  const a = sp(f, at, {damping: 18});
  const o = clamp01(a) * (1 - ip(f, [out, out + 18], [0, 1]));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, top: 40, opacity: o, transform: `translateY(${(1 - clamp01(a)) * 24}px)`, padding: '18px 30px', borderRadius: 22, background: 'rgba(5,5,5,0.82)', border: '1px solid rgba(255,255,255,0.1)'}}>
      <div style={{fontFamily: FONT, fontSize: 50, fontWeight: 750, letterSpacing: '-0.02em', color: '#fff'}}>{text}</div>
      <div style={{fontFamily: FONT, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 4}}>{sub}</div>
    </div>
  );
};

