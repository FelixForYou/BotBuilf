import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cog, KeyRound, Link, Lock, LockOpen, Unlink, Activity, Info} from 'lucide-react';
import {KText, Panel, SimTag, Stage, WarmGlow, LightSweep, WaveLight} from '../components/core';
import {Icon, PteroMark, TelegramLogo, WhatsAppLogo} from '../components/graphics';
import {Bubble, ChatWindow, Msg} from '../components/chat';
import {StatusPill} from '../components/ptero';
import {Sfx} from '../components/Sfx';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 03:05–03:35 — Bot WhatsApp dan kebutuhan koneksi
 * Shot 29 gelembung Telegram berubah menjadi komposisi WhatsApp; bot informasi
 * Shot 30 rantai: Pterodactyl (proses) — aplikasi bot — integrasi & autentikasi — platform
 * Shot 31 dua status: proses aktif vs koneksi platform terhubung
 * Shot 32 catatan: bukan produk resmi WhatsApp / Telegram
 */
export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s7');
  const tWa = L(0, 'whatsapp');
  const tInfo = L(0, 'informasi');
  const tAns = L(0, 'menyiapkan');
  const tInt = L(1);
  const tAuth = L(1, 'autentikasi');
  const tPtero = L(1, 'pterodactyl');
  const tPlat = L(1, 'sedangkan');
  const tTwo = L(2);
  const tS1 = L(2, 'proses aktif');
  const tS2 = L(2, 'koneksi');
  const tRun = L(2, 'running');
  const tNote = L(3);

  // Shot 29: morf gelembung
  const morph = ip(f, [6, tWa + 10], [0, 1], E.inOut);
  const dark = ip(f, [tWa - 10, tWa + 40], [0, 1], E.inOut);
  const bubbleOut = ip(f, [tInfo - 10, tInfo + 20], [0, 1], E.inOut);
  const chatIn = sp(f, tInfo - 14, {damping: 20, stiffness: 70});
  const chatOut = ip(f, [tTwo - 20, tTwo + 20], [0, 1], E.inOut);
  const chainIn = ip(f, [tInt - 20, tInt + 30], [0, 1], E.inOut);
  const chatX = -520 * chainIn;
  const statusIn = ip(f, [tTwo - 10, tTwo + 30], [0, 1], E.inOut);
  const noteIn = ip(f, [tNote - 10, tNote + 30], [0, 1], E.inOut);
  const toWhite = ip(f, [LE(3) + 6, dur], [0, 1], E.inOut);

  const msgs: Msg[] = [
    {at: tInfo + 6, text: 'Kantor buka hari apa saja?', from: 'user', time: '10.02'},
    {at: tAns + 30, typingFrom: tAns - 10, text: 'Senin–Jumat, pukul 08.00–16.00.', from: 'bot', time: '10.02'},
  ];

  const tg = {r: 0x26, g: 0xa5, b: 0xe4};
  const wa = {r: 0x25, g: 0xd3, b: 0x66};
  const mix = (a: number, b: number) => Math.round(a + (b - a) * morph);
  const accent = `rgb(${mix(tg.r, wa.r)},${mix(tg.g, wa.g)},${mix(tg.b, wa.b)})`;

  // status
  const procOn = f > tS1 + 10;
  const linkOn = f > LE(2) - 30;
  const lockClosed = ip(f, [tAuth, tAuth + 30], [0, 1]);

  const chain = [
    {label: 'Pterodactyl', sub: 'mengelola proses', icon: 'ptero', at: tPtero - 10},
    {label: 'Aplikasi bot', sub: 'kode & logika', icon: Cog, at: tInt},
    {label: 'Integrasi & autentikasi', sub: 'sesuai metode yang dipakai', icon: KeyRound, at: tAuth - 10},
    {label: 'Platform WhatsApp', sub: 'layanan pihak platform', icon: 'wa', at: tPlat},
  ] as const;

  return (
    <Stage dark={0}>
      <AbsoluteFill style={{background: '#050505', opacity: dark}} />
      <LightSweep o={0.25 * dark * (1 - noteIn)} seed={15} color={C.coral} />
      <WarmGlow x={960} y={600} r={900} o={0.6 * dark * (1 - toWhite)} seed={16} />
      <WaveLight y={760} amp={26} o={0.35 * noteIn * (1 - toWhite)} seed={5} />

      {/* Shot 29: gelembung tunggal yang berubah identitas */}
      {bubbleOut < 1 && (
        <div style={{position: 'absolute', left: 960, top: 500, transform: `translate(-50%, -50%) scale(${1.6 - 0.6 * bubbleOut})`, opacity: 1 - bubbleOut}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{position: 'relative', width: 70, height: 70}}>
              <div style={{position: 'absolute', inset: 0, opacity: 1 - morph}}><TelegramLogo size={70} /></div>
              <div style={{position: 'absolute', inset: 0, opacity: morph, transform: `rotate(${(1 - morph) * -40}deg)`}}><WhatsAppLogo size={70} /></div>
            </div>
            <div style={{padding: '18px 26px', borderRadius: 24, borderBottomLeftRadius: 6 + 18 * (1 - morph), background: '#fff', fontFamily: FONT, fontSize: 32,
              boxShadow: `0 10px 40px rgba(0,0,0,0.15), 0 0 0 3px ${accent}`}}>
              Bot informasi
            </div>
          </div>
        </div>
      )}

      {/* jendela chat WhatsApp */}
      <AbsoluteFill style={{perspective: 2000, opacity: clamp01(chatIn) * (1 - chatOut)}}>
        <div style={{position: 'absolute', left: 960 + chatX, top: 560, transform: `translate(-50%, -50%) rotateY(${12 - 10 * chainIn + drift(f, 17, 1, 0.5)}deg) rotateX(4deg) scale(${(0.7 + 0.3 * clamp01(chatIn)) * (1 - 0.15 * chainIn)})`,
          borderRadius: 26, boxShadow: `0 0 20px 3px ${C.coral}99, 0 0 120px 30px ${C.coral}33`}}>
          <ChatWindow w={600} h={820} platform="whatsapp" title="Info Kantor" subtitle="bot · contoh fiktif" msgs={msgs} size={26} />
        </div>
      </AbsoluteFill>

      {/* Shot 30: rantai tanggung jawab */}
      <div style={{position: 'absolute', left: 690, top: 170, width: 1150, opacity: chainIn * (1 - chatOut)}}>
        {chain.map((c, i) => {
          const a = sp(f, c.at, {damping: 16});
          const managed = i <= 1;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 26, opacity: clamp01(a), transform: `translateX(${(1 - clamp01(a)) * 80}px)`}}>
              <div style={{width: 96, height: 96, borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: `2px solid ${managed ? C.ptero : C.whatsapp}88`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                {c.icon === 'ptero' ? <PteroMark size={58} /> : c.icon === 'wa' ? <WhatsAppLogo size={56} /> : i === 2 ? (
                  <Icon i={lockClosed > 0.5 ? Lock : LockOpen} size={46} color="#fff" />
                ) : (
                  <div style={{transform: `rotate(${f * 2}deg)`, display: 'flex'}}><Icon i={c.icon as never} size={46} color="#fff" /></div>
                )}
              </div>
              <div>
                <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: '#fff'}}>{c.label}</div>
                <div style={{fontFamily: FONT, fontSize: 24, color: 'rgba(255,255,255,0.6)'}}>{c.sub}</div>
              </div>
            </div>
          );
        })}
        {/* kurung kurawal tanggung jawab */}
        <div style={{position: 'absolute', left: 620, top: 0, height: 232, width: 8, borderRadius: 4, background: C.ptero, opacity: ip(f, [tPtero, tPtero + 20], [0, 1])}} />
        <div style={{position: 'absolute', left: 650, top: 92, fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#9fbaff', opacity: ip(f, [tPtero, tPtero + 20], [0, 1])}}>
          dikelola panel
        </div>
        <div style={{position: 'absolute', left: 620, top: 244, height: 232, width: 8, borderRadius: 4, background: C.whatsapp, opacity: ip(f, [tPlat, tPlat + 20], [0, 1])}} />
        <div style={{position: 'absolute', left: 650, top: 330, fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#8be3ad', opacity: ip(f, [tPlat, tPlat + 20], [0, 1])}}>
          ditangani integrasi bot
        </div>
      </div>

      {/* Shot 31: dua status */}
      {statusIn > 0 && (
        <AbsoluteFill style={{opacity: statusIn * (1 - noteIn)}}>
          <KText text="Dua hal yang perlu diperhatikan" at={tTwo} out={tNote - 10} x={960} y={190} size={50} color="#fff" weight={650} />
          {[0, 1].map((k) => {
            const a = sp(f, k === 0 ? tS1 - 10 : tS2 - 10, {damping: 16});
            const on = k === 0 ? procOn : linkOn;
            const flip = k === 1 ? ip(f, [LE(2) - 30, LE(2) - 10], [0, 1]) : 0;
            const warnGlow = k === 1 && f > tRun - 10 && !linkOn ? 0.5 + 0.5 * Math.sin(f * 0.15) : 0;
            return (
              <div key={k} style={{position: 'absolute', left: k === 0 ? 220 : 1000, top: 330, width: 700, height: 360, opacity: clamp01(a),
                transform: `translateY(${(1 - clamp01(a)) * 60}px) scale(${1 + 0.03 * Math.sin(Math.PI * flip)})`}}>
                <Panel w={700} h={360} bg="#12161c" glow={0.5 + 0.6 * warnGlow} glowColor={k === 1 && !linkOn ? C.warn : C.coral} radius={28}>
                  <div style={{padding: 40, fontFamily: FONT}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                      <Icon i={k === 0 ? Activity : on ? Link : Unlink} size={46} color={on ? C.ok : C.warn} />
                      <div style={{fontSize: 40, fontWeight: 750, color: '#fff'}}>{k === 0 ? 'Proses aktif' : 'Koneksi platform'}</div>
                    </div>
                    <div style={{fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 12}}>
                      {k === 0 ? 'aplikasi berjalan di container' : 'bot tersambung ke layanan WhatsApp'}
                    </div>
                    <div style={{marginTop: 46, display: 'flex', alignItems: 'center', gap: 20}}>
                      {k === 0 ? (
                        <StatusPill state={on ? 'running' : 'starting'} size={30} />
                      ) : (
                        <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: '10px 24px', borderRadius: 999, background: on ? `${C.ok}22` : `${C.warn}22`,
                          color: on ? C.ok : C.warn, fontWeight: 650, fontSize: 30}}>
                          <div style={{width: 16, height: 16, borderRadius: 8, background: on ? C.ok : C.warn}} />
                          {on ? 'Terhubung' : 'Belum terhubung'}
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 960, top: 780, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderRadius: 999,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)', opacity: ip(f, [tRun - 10, tRun + 15], [0, 1])}}>
            <Icon i={Info} size={28} color={C.warn} />
            <span style={{fontFamily: FONT, fontSize: 30, fontWeight: 600, color: '#fff'}}>Status Running belum tentu berarti bot sudah tersambung</span>
          </div>
          <SimTag text="ilustrasi status" style={{left: 220, top: 720}} />
        </AbsoluteFill>
      )}

      {/* Shot 32: catatan resmi */}
      {noteIn > 0 && (
        <AbsoluteFill style={{opacity: noteIn * (1 - toWhite)}}>
          <div style={{position: 'absolute', left: 960, top: 400, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 40}}>
            <PteroMark size={110} draw={p(f, tNote, 50)} />
            <div style={{width: 2, height: 110, background: 'rgba(255,255,255,0.25)'}} />
            <div style={{display: 'flex', gap: 26, opacity: 0.85}}>
              <TelegramLogo size={90} reveal={p(f, tNote + 10, 30)} />
              <WhatsAppLogo size={90} reveal={p(f, tNote + 18, 30)} />
            </div>
          </div>
          <KText text="Bukan produk resmi WhatsApp maupun Telegram." at={tNote + 10} x={960} y={600} size={56} color="#fff" weight={650}
            accent={[{word: 'Bukan', color: C.coralSoft}]} />
          <div style={{position: 'absolute', left: 960, top: 690, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.55)', opacity: p(f, tNote + 40, 30)}}>
            Pterodactyl tidak berafiliasi dengan WhatsApp maupun Telegram.
          </div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: toWhite}} />

      <Sfx at={6} s="switch_2" v={0.22} />
      <Sfx at={tWa - 10} s="slide_soft_1" v={0.26} />
      <Sfx at={tInfo - 14} s="slide_glass_2" v={0.26} />
      <Sfx at={tInfo + 6} s="pop_2" v={0.28} />
      <Sfx at={tAns + 30} s="pop_4" v={0.28} />
      <Sfx at={tInt - 20} s="slide_paper_2" v={0.22} />
      <Sfx at={tAuth} s="snap_2" v={0.28} />
      <Sfx at={tAuth + 22} s="click_3" v={0.3} />
      <Sfx at={tPtero - 10} s="snap_1" v={0.24} />
      <Sfx at={tPlat} s="snap_3" v={0.24} />
      <Sfx at={tTwo - 10} s="slide_heavy_1" v={0.26} />
      <Sfx at={tS1} s="switch_1" v={0.26} />
      <Sfx at={tRun - 10} s="error_1" v={0.16} />
      <Sfx at={LE(2) - 30} s="confirm_1" v={0.26} />
      <Sfx at={tNote - 10} s="thud_2" v={0.28} />
      <Sfx at={LE(3) + 6} s="riser_2" v={0.18} />
    </Stage>
  );
};

