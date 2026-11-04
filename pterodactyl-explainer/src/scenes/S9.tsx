import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Server, Wifi, Cloud, Cog, Receipt, Code, FileCode, CircleCheck} from 'lucide-react';
import {KText, Panel, Stage, WarmGlow, LightSweep, WaveLight} from '../components/core';
import {Icon, PteroMark, TelegramLogo, WhatsAppLogo} from '../components/graphics';
import {ConsoleBox, ConsoleLine, PowerBar, StatusPill, PowerState} from '../components/ptero';
import {Sfx} from '../components/Sfx';
import {E, clamp01, drift, ip, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 04:05–04:35 — Yang dapat dan tidak dapat diselesaikan panel
 * Shot 38 error muncul di console; panel menghentikan / menyalakan ulang proses
 * Shot 39 baris bermasalah diperbesar -> ilustrasi kode aplikasi diperbaiki
 * Shot 40 rantai kelangsungan: mesin server, jaringan, layanan platform, bot
 * Shot 41 software gratis & open source vs infrastruktur hosting berbiaya
 */
export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const {L} = cues('s9');
  const tErr = L(0, 'error');
  const tSee = L(0, 'melihat');
  const tStop = L(0, 'menghentikan');
  const tRe = L(0, 'menyalakan');
  const tFix = L(1);
  const tCode = L(1, 'kode aplikasi');
  const tChain = L(2);
  const cMesin = L(2, 'mesin');
  const cNet = L(2, 'koneksi');
  const cPlat = L(2, 'layanan');
  const tCost = L(3);
  const tFree = L(3, 'gratis');
  const tInfra = L(3, 'infrastruktur');
  const tBiaya = L(3, 'biaya');

  const darkIn = ip(f, [0, 36], [0, 1], E.inOut);
  const conIn = sp(f, 0, {damping: 22, stiffness: 60});
  const zoomCode = ip(f, [tFix - 20, tFix + 30], [0, 1], E.inOut);
  const codeOut = ip(f, [tChain - 20, tChain + 20], [0, 1], E.inOut);
  const fixed = ip(f, [tCode, tCode + 30], [0, 1], E.inOut);
  const chainOut = ip(f, [tFree - 40, tFree - 5], [0, 1], E.inOut);

  let state: PowerState = 'running';
  let press: 'start' | 'restart' | 'stop' | null = null;
  let amt = 0;
  if (f >= tStop - 6) {
    press = 'stop';
    amt = p(f, tStop - 6, 14);
    state = f < tStop + 26 ? 'stopping' : 'offline';
  }
  if (f >= tRe - 6) {
    press = 'restart';
    amt = p(f, tRe - 6, 14);
    state = f < tRe + 40 ? 'starting' : 'running';
  }

  const lines: ConsoleLine[] = [
    {at: -200, text: '[info] pesan masuk: /profil', kind: 'info'},
    {at: tErr - 10, text: "TypeError: Cannot read properties of undefined (reading 'trim')", kind: 'err'},
    {at: tErr + 2, text: '    at sapa (handler.js:12:38)', kind: 'err'},
    {at: tErr + 10, text: '    at Bot.handleUpdate (bot.js:41:9)', kind: 'dim'},
    {at: tStop + 6, text: '[panel] proses dihentikan', kind: 'warn'},
    {at: tRe + 10, text: '> node index.js', kind: 'cmd'},
    {at: tRe + 40, text: '[ok]   bot berjalan kembali', kind: 'ok'},
  ];

  const chain = [
    {at: cMesin, icon: Server, label: 'Mesin server'},
    {at: cNet, icon: Wifi, label: 'Koneksi jaringan'},
    {at: cPlat, icon: Cloud, label: 'Layanan platform'},
    {at: tChain, icon: Cog, label: 'Bot'},
  ];

  return (
    <Stage dark={0}>
      <AbsoluteFill style={{background: '#050505', opacity: darkIn}} />
      <LightSweep o={0.25 * darkIn} seed={25} />
      <WarmGlow x={960} y={580} r={900} o={0.65 * darkIn} seed={26} />
      <WaveLight y={880} amp={22} o={0.3 * ip(f, [tChain, tChain + 40], [0, 1])} seed={8} />

      {/* Shot 38–39: console -> kode */}
      {codeOut < 1 && (
        <AbsoluteFill style={{perspective: 2000, opacity: 1 - codeOut}}>
          <div style={{position: 'absolute', left: 960, top: 540, transformStyle: 'preserve-3d',
            transform: `scale(${(0.5 + 0.5 * conIn) * (1 + 0.9 * zoomCode)}) translate(${zoomCode * 120}px, ${zoomCode * 70}px) rotateY(${-10 + 8 * conIn + drift(f, 27, 1, 0.5)}deg) rotateX(6deg)`,
            opacity: 1 - zoomCode}}>
            <div style={{position: 'absolute', left: -620, top: -330}}>
              <Panel w={1240} h={640} bg="#151a21" glow={0.9} radius={24}>
                <div style={{display: 'flex', alignItems: 'center', padding: '24px 30px', gap: 20}}>
                  <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 700, color: '#fff'}}>Asisten Bot</div>
                  <StatusPill state={state} size={20} />
                  <div style={{marginLeft: 'auto'}}><PowerBar press={press} pressAmt={amt} /></div>
                </div>
                <div style={{padding: '0 30px'}}>
                  <ConsoleBox w={1180} h={500} lines={lines} size={23} highlight={2} highlightAt={tSee} />
                </div>
              </Panel>
            </div>
          </div>
          {/* ilustrasi kode aplikasi */}
          <div style={{position: 'absolute', left: 960, top: 560, transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * zoomCode})`, opacity: zoomCode, width: 1300}}>
            <Panel w={1300} h={520} bg="#0d1014" glow={0.9} radius={24}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '24px 34px', borderBottom: '1px solid #232a33'}}>
                <Icon i={FileCode} size={30} color={C.coralSoft} />
                <span style={{fontFamily: MONO, fontSize: 24, color: '#c9d2de'}}>handler.js</span>
                <span style={{marginLeft: 'auto', fontFamily: FONT, fontSize: 22, color: 'rgba(255,255,255,0.5)'}}>kode aplikasi · ilustrasi</span>
              </div>
              <div style={{padding: '24px 0', fontFamily: MONO, fontSize: 28, lineHeight: 1.8}}>
                {[
                  [10, 'function sapa(pesan) {', ''],
                  [11, '  // ambil nama pengirim', ''],
                  [12, '', ''],
                  [13, '  return `Halo, ${nama}!`', ''],
                  [14, '}', ''],
                ].map(([n, t], i) => {
                  const isBug = n === 12;
                  return (
                    <div key={i} style={{display: 'flex', background: isBug ? `rgba(${fixed > 0.5 ? '34,197,94' : '239,68,68'},0.16)` : undefined,
                      boxShadow: isBug ? `inset 4px 0 0 ${fixed > 0.5 ? C.ok : C.err}` : undefined}}>
                      <span style={{width: 90, textAlign: 'right', paddingRight: 26, color: '#4b5563'}}>{n}</span>
                      {isBug ? (
                        <span style={{position: 'relative', color: '#e6ebf2'}}>
                          <span style={{opacity: 1 - fixed, position: fixed > 0 ? 'absolute' : 'relative', whiteSpace: 'pre'}}>
                            {'  const nama = pesan.from.username.trim()'}
                          </span>
                          <span style={{opacity: fixed, whiteSpace: 'pre'}}>
                            {fixed > 0 ? "  const nama = pesan.from?.username?.trim() ?? 'teman'" : ''}
                          </span>
                        </span>
                      ) : (
                        <span style={{color: n === 11 ? '#6b7685' : '#c9d2de', whiteSpace: 'pre'}}>{t}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{position: 'absolute', right: 34, bottom: 26, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT, fontSize: 24, fontWeight: 600,
                color: fixed > 0.5 ? C.ok : C.err}}>
                <Icon i={fixed > 0.5 ? CircleCheck : Code} size={28} color={fixed > 0.5 ? C.ok : C.err} />
                {fixed > 0.5 ? 'diperbaiki di kode aplikasi' : 'sumber masalah ada di kode'}
              </div>
            </Panel>
          </div>
        </AbsoluteFill>
      )}

      {/* Shot 40: rantai kelangsungan */}
      {f > tChain - 30 && chainOut < 1 && (
        <AbsoluteFill style={{opacity: ip(f, [tChain - 20, tChain + 10], [0, 1]) * (1 - chainOut)}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {[0, 1, 2].map((i) => {
              const x1 = 360 + i * 400 + 90;
              const x2 = 360 + (i + 1) * 400 - 90;
              const dr = ip(f, [chain[i].at, chain[i].at + 30], [0, 1]);
              return (
                <g key={i}>
                  <line x1={x1} x2={x1 + (x2 - x1) * dr} y1={500} y2={500} stroke={C.coral} strokeWidth={4} />
                  {dr >= 1 && <circle cx={x1 + ((f * 3 + i * 80) % (x2 - x1))} cy={500} r={7} fill="#fff" />}
                </g>
              );
            })}
          </svg>
          {chain.map((c, i) => {
            const a = sp(f, i === 3 ? tChain : c.at - 8, {damping: 14});
            return (
              <div key={i} style={{position: 'absolute', left: 360 + i * 400, top: 500, transform: `translate(-50%, -50%) scale(${clamp01(a)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
                <div style={{width: 170, height: 170, borderRadius: 85, background: '#12161c', border: `2px solid ${C.coral}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 50px ${C.coral}55`}}>
                  {i === 2 ? (
                    <div style={{display: 'flex', gap: 10}}><TelegramLogo size={56} /><WhatsAppLogo size={56} /></div>
                  ) : (
                    <Icon i={c.icon} size={70} color="#fff" draw={p(f, c.at - 8, 40)} />
                  )}
                </div>
                <div style={{fontFamily: FONT, fontSize: 32, fontWeight: 650, color: '#fff', whiteSpace: 'nowrap'}}>{c.label}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* Shot 41: biaya */}
      {f > tFree - 30 && (
        <AbsoluteFill style={{perspective: 1800}}>
          {[0, 1].map((k) => {
            const a = sp(f, k === 0 ? tFree - 10 : tInfra - 10, {damping: 16});
            return (
              <div key={k} style={{position: 'absolute', left: k === 0 ? 260 : 1000, top: 250, opacity: clamp01(a),
                transform: `rotateY(${(k === 0 ? 6 : -6) + drift(f, 30 + k, 1.2, 0.5)}deg) translateY(${(1 - clamp01(a)) * 60}px)`}}>
                <Panel w={660} h={420} bg="#12161c" glow={0.7} radius={28}>
                  <div style={{padding: 44, fontFamily: FONT}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                      {k === 0 ? <PteroMark size={64} /> : <Icon i={Server} size={58} color="#fff" />}
                      <div style={{fontSize: 38, fontWeight: 750, color: '#fff'}}>{k === 0 ? 'Software panel' : 'Infrastruktur hosting'}</div>
                    </div>
                    <div style={{fontSize: 28, color: 'rgba(255,255,255,0.7)', marginTop: 26, lineHeight: 1.45}}>
                      {k === 0 ? 'Gratis dan open source (lisensi MIT).' : 'VPS atau server tempat panel dan bot berjalan bisa memiliki biaya.'}
                    </div>
                    <div style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 650,
                      color: k === 0 ? C.ok : C.coralSoft, opacity: p(f, k === 0 ? tFree + 10 : tBiaya - 6, 24)}}>
                      <Icon i={k === 0 ? CircleCheck : Receipt} size={32} color={k === 0 ? C.ok : C.coralSoft} />
                      {k === 0 ? 'Rp0 untuk software-nya' : 'biaya tergantung penyedia'}
                    </div>
                  </div>
                </Panel>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* kalimat kunci */}
      <KText text="Kontrol lebih jelas." at={tSee} out={tFix - 24} x={960} y={970} size={50} color="#fff" accent={[{word: 'jelas.', color: C.coralSoft}]} />
      <KText text="Pemantauan lebih mudah." at={tRe} out={tFix + 30} x={960} y={970} size={50} color="#fff" accent={[{word: 'mudah.', color: C.coralSoft}]} />
      <KText text="Tetap bergantung pada aplikasi dan infrastrukturnya." at={cPlat + 10} out={tCost + 10} x={960} y={820} size={50} color="#fff"
        accent={[{word: 'aplikasi', color: C.coralSoft}, {word: 'infrastrukturnya.', color: C.coralSoft}]} />

      <Sfx at={0} s="slide_heavy_1" v={0.26} />
      <Sfx at={tErr - 10} s="error_1" v={0.26} />
      <Sfx at={tSee} s="snap_2" v={0.2} />
      <Sfx at={tStop - 6} s="click_4" v={0.3} />
      <Sfx at={tRe - 6} s="click_1" v={0.3} />
      <Sfx at={tRe + 40} s="powerup_1" v={0.16} />
      <Sfx at={tFix - 20} s="suck_1" v={0.24} />
      <Sfx at={tCode - 4} s="type_1" v={0.22} />
      <Sfx at={tCode + 26} s="confirm_1" v={0.24} />
      <Sfx at={tChain - 20} s="slide_soft_2" v={0.22} />
      <Sfx at={cMesin - 8} s="thud_1" v={0.24} />
      <Sfx at={cNet - 8} s="data_3" v={0.18} />
      <Sfx at={cPlat - 8} s="pop_3" v={0.24} />
      <Sfx at={tFree - 10} s="slide_glass_1" v={0.24} />
      <Sfx at={tInfra - 10} s="slide_glass_2" v={0.24} />
      <Sfx at={tBiaya - 6} s="tick_2" v={0.22} />
    </Stage>
  );
};

