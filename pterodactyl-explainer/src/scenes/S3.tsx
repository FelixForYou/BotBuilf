import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cpu, Layers, Loader, Network, Package, Settings2, Egg, CircleCheck, X} from 'lucide-react';
import {Chip, KText, Stage} from '../components/core';
import {ContainerBox, Icon, NodeLogo, PythonLogo, TelegramLogo, WhatsAppLogo} from '../components/graphics';
import {WSvg, At, cpath, cbez, Pt} from '../components/world';
import {Sfx} from '../components/Sfx';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 00:55–01:25 — Dari server game ke aplikasi bot
 * Shot 11 "bot?" menjadi objek proses; setara dengan server game: sama-sama program
 * Shot 12 kebutuhan lingkungan mengorbit: runtime (Node.js/Python), dependensi, sumber daya, jaringan
 * Shot 13 image container + egg + konfigurasi masuk; cabang ke Telegram & WhatsApp
 * Shot 14 kepingan tak sesuai terpental; tiga syarat: lingkungan, proses, koneksi
 */
export const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s3');
  const tSame = L(0, 'sama-sama');
  const tEnv = L(1);
  const tNode = L(1, 'node');
  const tPy = L(1, 'python');
  const tDep = L(1, 'dependensi');
  const tRes = L(1, 'sumber daya');
  const tNet = L(1, 'koneksi');
  const tImg = L(2, 'image');
  const tEgg = L(2, 'egg');
  const tCfg = L(2, 'konfigurasi');
  const tRun = L(2, 'menjalankan');
  const tTg = L(2, 'telegram');
  const tWa = L(2, 'whatsapp');
  const tBut = L(3);
  const tC1 = L(3, 'lingkungannya');
  const tC2 = L(3, 'prosesnya');
  const tC3 = L(3, 'botnya');

  // objek proses (lingkaran berdenyut di tengah)
  const proc = sp(f, 6, {damping: 14, stiffness: 110});
  const boxDraw = ip(f, [tSame + 10, tEnv + 10], [0, 1], E.inOut);
  // kamera mengorbit ringan sepanjang shot 12–13
  const orbit = kf(f, [tEnv - 20, tImg, tRun, tBut], [0, -10, 8, 0], E.inOut) + drift(f, 6, 1.2, 0.5);
  const camScale = kf(f, [0, tEnv, tImg, tRun + 40, tBut, tC1, LE(3), dur], [1.15, 1, 0.95, 0.82, 0.82, 0.78, 0.78, 6], E.inOut);
  const camX = kf(f, [tRun - 10, tRun + 60, tBut + 10, tC1], [0, 220, 220, 420], E.inOut);
  const brFade = 1 - ip(f, [tC1 - 20, tC1 + 20], [0, 0.85]);
  const zoomOut = ip(f, [LE(3) + 4, dur], [0, 1], E.in);

  // label "server game" vs "bot"
  const eq = ip(f, [tSame - 30, tSame + 10], [0, 1], E.out);
  const eqOut = ip(f, [tEnv - 10, tEnv + 20], [0, 1]);

  // runtime berganti Node.js <-> Python
  const runtimeIdx = f < tPy - 4 ? 0 : 1;
  const runtimeFlip = ip(f, [tPy - 14, tPy + 6], [0, 1], E.inOut);

  // orbit item lingkungan
  const envItems = [
    {t: tNode - 6, label: 'Runtime', ang: -150},
    {t: tDep - 6, label: 'Dependensi', ang: -30},
    {t: tRes - 6, label: 'Sumber daya', ang: 30},
    {t: tNet - 6, label: 'Jaringan', ang: 150},
  ];
  const envGather = ip(f, [tImg - 30, tImg + 30], [0, 1], E.inOut);

  // lapisan konfigurasi yang masuk ke container
  const layers = [
    {t: tImg, label: 'Image container', icon: Layers},
    {t: tEgg, label: 'Egg', icon: Egg},
    {t: tCfg, label: 'Konfigurasi', icon: Settings2},
  ];

  // cabang ke platform
  const brA: Pt[] = [[150, -40], [360, -40], [420, -230], [640, -240]];
  const brB: Pt[] = [[150, 40], [360, 40], [420, 230], [640, 240]];
  const brDraw = ip(f, [tRun, tTg + 20], [0, 1], E.inOut);
  const tgIn = sp(f, tTg - 4, {damping: 12});
  const waIn = sp(f, tWa - 4, {damping: 12});

  // kepingan tidak sesuai terpental
  const bad = ip(f, [tBut, tBut + 60], [0, 1], E.linear);
  const badX = 700 - 760 * Math.min(1, bad * 1.6) + (bad > 0.62 ? (bad - 0.62) * 900 : 0);
  const badY = -360 + (bad < 0.62 ? 360 * (bad / 0.62) ** 2 : 360 - (bad - 0.62) * 700 + 1200 * (bad - 0.62) ** 2);

  const checks = [
    {t: tC1, text: 'Lingkungan sesuai.'},
    {t: tC2, text: 'Proses berjalan.'},
    {t: tC3, text: 'Bot terhubung.'},
  ];

  return (
    <Stage dark={0}>
      {/* pertanyaan dari section sebelumnya menyusut menjadi objek proses */}
      <KText text="Lalu, bagaimana dengan bot?" at={-60} out={0} x={960} y={540} size={92} weight={700} accent={[{word: 'bot?', color: C.ember}]} />

      <AbsoluteFill style={{perspective: 1900}}>
        <div style={{position: 'absolute', left: 960, top: 540, transformStyle: 'preserve-3d',
          transform: `scale(${camScale}) rotateY(${orbit}deg) rotateX(${6 + orbit * 0.2}deg) translateX(${-camX}px)`}}>
          {/* container */}
          <At x={0} y={-30} z={-20}>
            <ContainerBox size={460} draw={boxDraw} color={C.ink} fill="rgba(255,255,255,0.0)" glow={C.coral} />
          </At>
          {/* objek proses */}
          <At x={0} y={10} z={30} s={proc * (1 + 0.04 * Math.sin(f * 0.08))}>
            <div style={{width: 130, height: 130, borderRadius: 34, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 20px 60px rgba(0,0,0,0.25), 0 0 0 ${8 + 6 * Math.sin(f * 0.08)}px rgba(255,106,43,0.18)`}}>
              <div style={{fontFamily: MONO, fontWeight: 600, color: '#fff', fontSize: 22, textAlign: 'center', lineHeight: 1.2}}>
                {f < tImg ? 'proses' : 'bot'}
                <div style={{fontSize: 15, opacity: 0.6, marginTop: 4}}>{f < tNode ? 'program' : runtimeIdx === 0 ? 'node' : 'python'}</div>
              </div>
            </div>
          </At>

          {/* Shot 11: server game = bot */}
          <At x={-470} y={10} o={eq * (1 - eqOut)}>
            <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: C.gray}}>server game</div>
          </At>
          <At x={440} y={10} o={eq * (1 - eqOut)}>
            <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: C.ink}}>bot</div>
          </At>
          <WSvg o={eq * (1 - eqOut)}>
            <path d="M-340,10 L-110,10" stroke={C.gray} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f} />
            <path d="M370,10 L110,10" stroke={C.ink} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-f} />
          </WSvg>

          {/* Shot 12: kebutuhan lingkungan */}
          {envItems.map((it, i) => {
            const a = sp(f, it.t, {damping: 15});
            const ang = ((it.ang + (f - it.t) * 0.04) * Math.PI) / 180;
            const r = 420 * (1 - envGather * 0.55);
            const x = Math.cos(ang) * r * 1.05;
            const y = Math.sin(ang) * r * 0.55 + 10;
            const icon = i === 1 ? Package : i === 2 ? Cpu : Network;
            return (
              <At key={i} x={x} y={y} z={40} s={clamp01(a) * (1 - envGather * 0.5)} o={clamp01(a) * (1 - envGather)}>
                {i === 0 ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 26px', borderRadius: 20, background: '#fff',
                    boxShadow: '0 16px 50px rgba(0,0,0,0.12)', border: '1px solid #eee'}}>
                    <div style={{position: 'relative', width: 54, height: 54, perspective: 400}}>
                      <div style={{position: 'absolute', inset: 0, transform: `rotateY(${runtimeFlip * 180}deg)`, backfaceVisibility: 'hidden'}}>
                        <NodeLogo size={54} />
                      </div>
                      <div style={{position: 'absolute', inset: 0, transform: `rotateY(${runtimeFlip * 180 - 180}deg)`, backfaceVisibility: 'hidden'}}>
                        <PythonLogo size={54} />
                      </div>
                    </div>
                    <div style={{fontFamily: FONT}}>
                      <div style={{fontSize: 18, color: C.gray, fontWeight: 600}}>Runtime</div>
                      <div style={{fontSize: 28, fontWeight: 700, color: C.ink}}>{runtimeFlip < 0.5 ? 'Node.js' : 'Python'}</div>
                    </div>
                  </div>
                ) : (
                  <Chip text={it.label} icon={<Icon i={icon} size={30} color={C.ember} draw={p(f, it.t, 40)} />} bg="#fff" color={C.ink} size={28}
                    style={{boxShadow: '0 16px 50px rgba(0,0,0,0.12)', border: '1px solid #eee'}} />
                )}
              </At>
            );
          })}

          {/* Shot 13: lapisan konfigurasi masuk */}
          {layers.map((ly, i) => {
            const a = ip(f, [ly.t - 10, ly.t + 40], [0, 1], E.inOut);
            const inside = ip(f, [ly.t + 30, ly.t + 60], [0, 1], E.in);
            return (
              <At key={i} x={-560 + 560 * inside} y={-200 + i * 110 - inside * (i * 110 - 120)} z={60} s={1 - inside * 0.7} o={clamp01(a * 2) * (1 - inside)}>
                <Chip text={ly.label} icon={<Icon i={ly.icon} size={30} color={C.ink} />} bg="#fff" color={C.ink} size={28}
                  style={{boxShadow: '0 16px 50px rgba(0,0,0,0.12)', border: `2px solid ${C.coral}`}} />
              </At>
            );
          })}
          {/* label lapisan di sisi container setelah masuk */}
          <At x={0} y={-300} o={ip(f, [tCfg + 50, tCfg + 80], [0, 1]) * (1 - zoomOut)}>
            <div style={{display: 'flex', gap: 10, fontFamily: FONT, fontSize: 30, fontWeight: 600, color: C.gray}}>
              image · egg · konfigurasi
            </div>
          </At>

          {/* cabang ke Telegram & WhatsApp */}
          <WSvg o={brFade}>
            {[brA, brB].map((b, i) => (
              <g key={i}>
                <path d={cpath(b[0], b[1], b[2], b[3])} stroke={C.ink} strokeOpacity={0.15 * brDraw} strokeWidth={3} fill="none" />
                <path d={cpath(b[0], b[1], b[2], b[3])} stroke={i ? C.whatsapp : C.telegram} strokeWidth={3} fill="none"
                  strokeDasharray={800} strokeDashoffset={800 * (1 - brDraw)} />
              </g>
            ))}
          </WSvg>
          {[brA, brB].map((b, i) => {
            const tt = ((f - tTg) * 0.012 + i * 0.5) % 1;
            if (f < tTg + 20) return null;
            const q = cbez(tt, b[0], b[1], b[2], b[3]);
            return (
              <At key={i} x={q[0]} y={q[1]} z={10} o={brFade}>
                <div style={{width: 14, height: 14, borderRadius: 7, background: i ? C.whatsapp : C.telegram, boxShadow: `0 0 14px ${i ? C.whatsapp : C.telegram}`}} />
              </At>
            );
          })}
          <At x={720} y={-240} s={clamp01(tgIn)} o={brFade}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <TelegramLogo size={86} reveal={tgIn} />
              <span style={{fontFamily: FONT, fontSize: 34, fontWeight: 650, color: C.ink}}>Telegram</span>
            </div>
          </At>
          <At x={730} y={240} s={clamp01(waIn)} o={brFade}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <WhatsAppLogo size={86} reveal={waIn} />
              <span style={{fontFamily: FONT, fontSize: 34, fontWeight: 650, color: C.ink}}>WhatsApp</span>
            </div>
          </At>

          {/* kepingan tidak sesuai */}
          {bad > 0 && bad < 1 && (
            <At x={badX} y={badY} z={80} r={bad * 260}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, background: '#fff', border: `2px dashed ${C.err}`,
                fontFamily: MONO, fontSize: 22, color: C.err}}>
                <Icon i={X} size={22} color={C.err} /> runtime tidak sesuai
              </div>
            </At>
          )}
        </div>
      </AbsoluteFill>

      {/* Shot 11 teks */}
      <KText text="Sama-sama program yang berjalan." at={tSame} out={tEnv + 10} x={960} y={900} size={54} weight={600}
        accent={[{word: 'program', color: C.ember}]} />

      {/* Shot 14: tiga syarat */}
      {checks.map((c, i) => {
        const a = sp(f, c.t - 6, {damping: 16});
        const done = ip(f, [c.t + 24, c.t + 40], [0, 1]);
        return (
          <div key={i} style={{position: 'absolute', left: 1060, top: 360 + i * 130, opacity: clamp01(a) * (1 - zoomOut * 2), transform: `translateX(${(1 - a) * 80}px)`,
            display: 'flex', alignItems: 'center', gap: 26}}>
            <div style={{width: 64, height: 64, borderRadius: 32, background: done > 0.5 ? C.ink : '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${1 + 0.15 * Math.sin(Math.PI * done)})`}}>
              {done > 0.5 ? (
                <Icon i={CircleCheck} size={38} color="#fff" draw={ip(done, [0.5, 1], [0, 1])} />
              ) : (
                <div style={{transform: `rotate(${f * 6}deg)`, display: 'flex'}}>
                  <Icon i={Loader} size={34} color={C.gray} />
                </div>
              )}
            </div>
            <div style={{fontFamily: FONT, fontSize: 54, fontWeight: 650, letterSpacing: '-0.02em', color: C.ink}}>{c.text}</div>
          </div>
        );
      })}

      {/* masuk ke dalam container -> gelap */}
      <AbsoluteFill style={{background: '#050505', opacity: ip(zoomOut, [0.45, 1], [0, 1])}} />

      <Sfx at={0} s="suck_1" v={0.22} />
      <Sfx at={8} s="pop_4" v={0.3} />
      <Sfx at={tSame - 30} s="slide_paper_2" v={0.2} />
      <Sfx at={tSame + 12} s="draw_2" v={0.3} />
      <Sfx at={tNode - 6} s="snap_1" v={0.26} />
      <Sfx at={tPy - 14} s="switch_2" v={0.28} />
      <Sfx at={tDep - 6} s="snap_2" v={0.24} />
      <Sfx at={tRes - 6} s="snap_3" v={0.24} />
      <Sfx at={tNet - 6} s="snap_1" v={0.22} />
      <Sfx at={tImg - 30} s="slide_soft_2" v={0.22} />
      <Sfx at={tImg + 30} s="thud_2" v={0.3} />
      <Sfx at={tEgg + 30} s="thud_1" v={0.28} />
      <Sfx at={tCfg + 30} s="thud_3" v={0.28} />
      <Sfx at={tRun} s="draw_1" v={0.24} />
      <Sfx at={tTg - 4} s="pop_2" v={0.3} />
      <Sfx at={tWa - 4} s="pop_3" v={0.3} />
      <Sfx at={tTg + 20} s="data_2" v={0.16} />
      <Sfx at={tBut + 10} s="error_1" v={0.2} />
      <Sfx at={tC1 + 24} s="confirm_1" v={0.24} />
      <Sfx at={tC2 + 24} s="tick_1" v={0.26} />
      <Sfx at={tC3 + 24} s="confirm_1" v={0.24} />
      <Sfx at={LE(3) + 4} s="suck_2" v={0.3} />
    </Stage>
  );
};

