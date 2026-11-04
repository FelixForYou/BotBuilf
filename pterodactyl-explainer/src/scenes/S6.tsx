import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bell, Cpu, FileCode, MessageCircle, ShieldCheck, Cog} from 'lucide-react';
import {IrisWipe, KText, Panel, SimTag, Stage} from '../components/core';
import {Icon, PteroMark, TelegramLogo} from '../components/graphics';
import {Bubble, ChatWindow, Msg} from '../components/chat';
import {ChartBox, ConsoleBox, ConsoleLine} from '../components/ptero';
import {At, WSvg, cbez, cpath, Pt} from '../components/world';
import {Sfx} from '../components/Sfx';
import {cpuSim} from './S5';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 02:35–03:05 — Kehidupan sebuah bot Telegram
 * Shot 25 jendela chat masuk; pengguna mengirim perintah
 * Shot 26 pesan diproses aplikasi; console mencatat; CPU naik sedikit; balasan terkirim
 * Shot 27 tiga kegunaan: menjawab, notifikasi, membantu admin komunitas
 * Shot 28 kode bot = logika balasan; panel = mengelola proses
 */
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s6');
  const tUser = L(0, 'pengguna');
  const tCmd = L(0, 'perintah');
  const tRecv = L(1);
  const tProc = L(1, 'memprosesnya');
  const tReply = L(1, 'balasan');
  const tLog = L(1, 'console');
  const tRes = L(1, 'sumber daya');
  const tUse = L(2);
  const tU1 = L(2, 'menjawab');
  const tU2 = L(2, 'notifikasi');
  const tU3 = L(2, 'admin');
  const tCode = L(3);
  const tCode2 = L(3, 'kode bot');
  const tPanel = L(3, 'panel');

  const iris = ip(f, [0, 40], [0, 1], E.in);
  const chatIn = sp(f, 12, {damping: 20, stiffness: 70});
  const sideIn = sp(f, tRecv - 30, {damping: 20, stiffness: 70});
  const useMode = ip(f, [tUse - 20, tUse + 30], [0, 1], E.inOut);
  const codeMode = ip(f, [tCode - 15, tCode + 30], [0, 1], E.inOut);

  const msgs: Msg[] = [
    {at: tCmd, text: '/jadwal', from: 'user', time: '07.58'},
    {at: tReply, typingFrom: tProc + 10, text: 'Jadwal hari ini:\n09.00  Rapat tim\n13.00  Kelas daring', from: 'bot', time: '07.58'},
  ];
  const lines: ConsoleLine[] = [
    {at: -300, text: '[info] menunggu pesan...', kind: 'dim'},
    {at: tRecv + 10, text: '[info] pesan masuk: /jadwal', kind: 'info'},
    {at: tProc + 20, text: '[info] mengambil data jadwal', kind: 'info'},
    {at: tReply + 4, text: '[ok]   balasan terkirim (120 ms)', kind: 'ok'},
    {at: tU2 + 10, text: '[info] notifikasi terjadwal dikirim', kind: 'info'},
  ];
  const bump = (fr: number) => cpuSim(fr) + 0.16 * Math.exp(-(((fr - (tProc + 20)) / 50) ** 2));

  // jalur pesan: chat -> proses bot -> chat
  const a: Pt = [-260, 120];
  const b: Pt = [260, -20];
  const go = ip(f, [tRecv - 10, tProc + 10], [0, 1], E.inOut);
  const back = ip(f, [tProc + 20, tReply], [0, 1], E.inOut);
  const pathGo = [a, [-80, 260], [80, -180], b] as Pt[];
  const pathBack = [b, [120, 240], [-80, 260], [-260, 220]] as Pt[];
  const pGo = cbez(go, pathGo[0], pathGo[1], pathGo[2], pathGo[3]);
  const pBack = cbez(back, pathBack[0], pathBack[1], pathBack[2], pathBack[3]);

  // komposisi menyusut saat kegunaan muncul
  const groupS = 1 - 0.38 * useMode;
  const groupX = -560 * useMode;
  const groupO = 1 - codeMode;

  const uses = [
    {t: tU1, icon: MessageCircle, title: 'Menjawab pertanyaan', ex: 'Jam buka perpustakaan?'},
    {t: tU2, icon: Bell, title: 'Mengirim notifikasi', ex: 'Pengingat: kelas 13.00'},
    {t: tU3, icon: ShieldCheck, title: 'Membantu admin komunitas', ex: 'Selamat datang di grup!'},
  ];

  return (
    <Stage dark={0}>
      <AbsoluteFill style={{background: '#050505', opacity: 1 - iris}} />
      <AbsoluteFill>
        <IrisWipe progress={iris} x={960} y={540} color="#ffffff" />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: iris >= 1 ? 1 : 0}} />

      {/* komposisi utama: chat + aplikasi + console */}
      <AbsoluteFill style={{perspective: 2000, opacity: groupO}}>
        <div style={{position: 'absolute', left: 960 + groupX, top: 540, transformStyle: 'preserve-3d',
          transform: `scale(${groupS}) rotateY(${kf(f, [0, tRecv, tUse, dur], [14, 6, 10, 4], E.inOut) + drift(f, 13, 1, 0.5)}deg) rotateX(4deg)`}}>
          {/* jendela chat */}
          <At x={-520} y={10} z={0} s={0.6 + 0.4 * chatIn} o={clamp01(chatIn * 1.5)}>
            <div style={{boxShadow: `0 40px 100px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04), 0 0 80px ${C.coral}33`, borderRadius: 26}}>
              <ChatWindow w={600} h={860} platform="telegram" title="Asisten Bot" subtitle="bot · contoh fiktif" msgs={msgs} size={26} />
            </div>
          </At>
          {/* jalur pesan */}
          <WSvg>
            <path d={cpath(pathGo[0], pathGo[1], pathGo[2], pathGo[3])} stroke={C.telegram} strokeWidth={3} fill="none" strokeDasharray="8 10"
              strokeDashoffset={-f} opacity={ip(f, [tRecv - 20, tRecv], [0, 0.7])} />
            <path d={cpath(pathBack[0], pathBack[1], pathBack[2], pathBack[3])} stroke={C.ink} strokeWidth={2.5} fill="none" strokeDasharray="8 10"
              strokeDashoffset={-f} opacity={ip(f, [tProc + 10, tProc + 30], [0, 0.4])} />
          </WSvg>
          {go > 0 && go < 1 && (
            <At x={pGo[0]} y={pGo[1]} s={0.55}>
              <Bubble text="/jadwal" from="user" platform="telegram" size={26} />
            </At>
          )}
          {back > 0 && back < 1 && (
            <At x={pBack[0]} y={pBack[1]}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: C.ink, boxShadow: `0 0 0 6px ${C.coral}55`}} />
            </At>
          )}
          {/* proses aplikasi bot */}
          <At x={330} y={-20} z={40} s={clamp01(sideIn)}>
            <div style={{width: 200, height: 200, borderRadius: 40, background: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 30px 80px rgba(0,0,0,0.25), 0 0 0 ${10 + 10 * kf(f, [tProc - 10, tProc + 20, tReply], [0, 1, 1]) * Math.abs(Math.sin(f * 0.12))}px ${C.coral}40`}}>
              <div style={{transform: `rotate(${f > tProc - 10 && f < tReply ? f * 4 : 0}deg)`, display: 'flex'}}>
                <Icon i={Cog} size={64} color="#fff" sw={1.6} />
              </div>
              <div style={{fontFamily: MONO, fontSize: 20, color: '#fff'}}>aplikasi bot</div>
            </div>
          </At>
          {/* console + grafik */}
          <At x={830} y={-200} z={-60} s={clamp01(sideIn)} o={clamp01(sideIn)}>
            <Panel w={680} h={300} bg="#0d1014" glow={0.6} radius={18}>
              <ConsoleBox w={680} h={300} lines={lines} size={21} showInput={false} />
            </Panel>
          </At>
          <At x={830} y={170} z={-60} s={clamp01(sideIn)} o={clamp01(sideIn)}>
            <Panel w={680} h={270} bg="#1f2630" glow={0.5 * ip(f, [tRes - 10, tRes + 20], [0, 1])} radius={18}>
              <ChartBox w={680} h={270} label="CPU · Asisten Bot" value={bump} icon={Cpu} color={C.ptero} unit={(v) => `${(v * 100).toFixed(1)}%`} />
            </Panel>
          </At>
        </div>
      </AbsoluteFill>
      <SimTag dark={false} text="data simulasi" style={{right: 60, bottom: 40, opacity: groupO * iris}} />

      {/* Shot 27: kegunaan */}
      {uses.map((u, i) => {
        const a2 = sp(f, u.t - 8, {damping: 16});
        const o = clamp01(a2) * (1 - codeMode);
        return (
          <div key={i} style={{position: 'absolute', left: 820 + i * 20, top: 190 + i * 250, width: 900, opacity: o, transform: `translateX(${(1 - clamp01(a2)) * 120}px) rotate(${(1 - clamp01(a2)) * 3}deg)`,
            display: 'flex', alignItems: 'center', gap: 28, padding: '28px 34px', borderRadius: 28, background: '#fff', boxShadow: '0 24px 70px rgba(0,0,0,0.12)', border: '1px solid #eee', boxSizing: 'border-box'}}>
            <div style={{width: 84, height: 84, borderRadius: 22, background: '#fff3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Icon i={u.icon} size={44} color={C.ember} draw={p(f, u.t, 40)} />
            </div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT, fontSize: 38, fontWeight: 700, color: C.ink, letterSpacing: '-0.015em'}}>{u.title}</div>
              <div style={{marginTop: 10, transform: `scale(${0.8 + 0.2 * p(f, u.t + 14, 20)})`, transformOrigin: '0 50%', opacity: p(f, u.t + 14, 20)}}>
                <Bubble text={u.ex} from="bot" platform="telegram" size={22} style={{justifyContent: 'flex-start'}} />
              </div>
            </div>
            <TelegramLogo size={40} />
          </div>
        );
      })}

      {/* Shot 28: kode bot vs panel */}
      {codeMode > 0 && (
        <AbsoluteFill style={{perspective: 1800}}>
          {[0, 1].map((k) => {
            const a3 = sp(f, k === 0 ? tCode - 10 : tPanel - 10, {damping: 16});
            const x = k === 0 ? 520 : 1400;
            return (
              <div key={k} style={{position: 'absolute', left: x - 380, top: 250, width: 760, height: 560, opacity: clamp01(a3) * codeMode,
                transform: `rotateY(${(k === 0 ? 8 : -8) * (1 - clamp01(a3)) + (k === 0 ? 4 : -4)}deg) translateY(${(1 - clamp01(a3)) * 60}px)`}}>
                <Panel w={760} h={560} bg={k === 0 ? '#0d1014' : '#151a21'} glow={0.8 * clamp01(a3)} radius={26}>
                  {k === 0 ? (
                    <div style={{padding: 40}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT, fontSize: 40, fontWeight: 750, color: '#fff'}}>
                        <Icon i={FileCode} size={44} color={C.coralSoft} /> Kode bot
                      </div>
                      <div style={{fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: 8}}>berisi logika balasan</div>
                      <div style={{fontFamily: MONO, fontSize: 24, lineHeight: 1.75, color: '#c9d2de', marginTop: 28}}>
                        {[
                          ["bot.command(", "'jadwal'", ', async (ctx) => {'],
                          ['  const data = ', 'await ', 'ambilJadwal()'],
                          ['  ctx.reply(', 'format(data)', ')'],
                          ['})', '', ''],
                        ].map((ln, i) => (
                          <div key={i} style={{opacity: clamp01((f - tCode - 20 - i * 8) / 14)}}>
                            {ln[0]}<span style={{color: C.coralSoft}}>{ln[1]}</span>{ln[2]}
                          </div>
                        ))}
                        <div style={{marginTop: 18, fontSize: 21, color: '#6b7685'}}>BOT_TOKEN = ************ (disensor)</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{padding: 40}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT, fontSize: 40, fontWeight: 750, color: '#fff'}}>
                        <PteroMark size={48} /> Panel
                      </div>
                      <div style={{fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: 8}}>mengelola proses yang menjalankannya</div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 34}}>
                        {['menjalankan & menghentikan proses', 'membaca output console', 'memantau sumber daya'].map((t, i) => (
                          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT, fontSize: 28, color: '#e6ebf2', opacity: clamp01((f - tPanel - i * 10) / 16)}}>
                            <div style={{width: 12, height: 12, borderRadius: 6, background: C.ptero}} /> {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Panel>
              </div>
            );
          })}
          <KText text="Balasan berasal dari kode bot." at={tCode2} out={LE(3) + 10} x={960} y={140} size={56} weight={700} accent={[{word: 'kode', color: C.ember}, {word: 'bot.', color: C.ember}]} />
        </AbsoluteFill>
      )}

      <Sfx at={0} s="riser_1" v={0.16} />
      <Sfx at={14} s="slide_glass_1" v={0.24} />
      <Sfx at={tCmd - 2} s="type_3" v={0.22} />
      <Sfx at={tCmd + 2} s="pop_1" v={0.3} />
      <Sfx at={tRecv - 10} s="data_1" v={0.2} />
      <Sfx at={tProc - 6} s="switch_1" v={0.2} />
      <Sfx at={tReply - 2} s="pop_3" v={0.3} />
      <Sfx at={tLog} s="type_1" v={0.14} />
      <Sfx at={tUse - 20} s="slide_soft_2" v={0.24} />
      <Sfx at={tU1 - 8} s="snap_1" v={0.24} />
      <Sfx at={tU2 - 8} s="snap_2" v={0.24} />
      <Sfx at={tU3 - 8} s="snap_3" v={0.24} />
      <Sfx at={tCode - 15} s="slide_paper_2" v={0.24} />
      <Sfx at={tCode2} s="type_4" v={0.16} />
      <Sfx at={tPanel - 10} s="thud_1" v={0.24} />
    </Stage>
  );
};
