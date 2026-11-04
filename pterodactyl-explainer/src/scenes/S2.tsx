import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Box, CircleCheck, Code, Globe, Play, Scale, Settings, Activity} from 'lucide-react';
import {Chip, Curved, DashGrid, KText, Panel, Stage, WarmGlow, WaveLight, LightSweep} from '../components/core';
import {Icon} from '../components/graphics';
import {Sfx} from '../components/Sfx';
import {MiniDash} from './shared';
import {StatusPill} from '../components/ptero';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 00:25–00:55 — Asal-usul Pterodactyl
 * Shot 6  panel -> label gratis / open source / MIT + struktur kode
 * Shot 7  panel melebur ke garis waktu melengkung, tahun 2015
 * Shot 8  "Berawal dari pengelolaan server game." + jendela browser terbuka
 * Shot 9  kartu pengelolaan proses (start, pantau, atur) dalam container terisolasi
 * Shot 10 semua menjauh, berganti putih: "Lalu, bagaimana dengan bot?"
 */
export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {L, dur} = cues('s2');
  const tFree = L(0, 'gratis');
  const tOpen = L(0, 'open');
  const tCode = L(0, 'kode');
  const tHist = L(1);
  const tYear = L(1, 'tahun');
  const tGoal = L(2);
  const tGame = L(2, 'server game');
  const tWeb = L(2, 'antarmuka');
  const tOps = L(3);
  const tOn = L(3, 'dinyalakan');
  const tMon = L(3, 'dipantau');
  const tSet = L(3, 'diatur');
  const tCont = L(3, 'container');
  const tQ = L(4);

  // ---------- Shot 6: panel + atribut proyek ----------
  const s6out = ip(f, [tHist - 30, tHist + 20], [0, 1], E.in);
  const panelY = ip(f, [0, 70], [-10, -60], E.out);
  const panelRy = kf(f, [0, 90, tHist], [-6, 8, 12], E.inOut) + drift(f, 1, 1.2, 0.7);
  const chips = [
    {t: tFree, label: 'Gratis', icon: CircleCheck, x: -560, y: -170},
    {t: tOpen, label: 'Open source', icon: Code, x: -600, y: 10},
    {t: tOpen + 30, label: 'Lisensi MIT', icon: Scale, x: -540, y: 190},
  ];
  const codeIn = sp(f, tCode - 6, {damping: 18});

  // ---------- Shot 7: garis waktu melengkung ----------
  const tlIn = ip(f, [tHist - 20, tHist + 40], [0, 1], E.out);
  const tlOut = ip(f, [tGoal + 10, tGoal + 60], [0, 1], E.inOut);
  const curve = kf(f, [tHist - 20, tHist + 50, tYear + 60, tGoal + 40], [1.3, 0.55, 0.45, 0], E.inOut);
  const scrollYear = kf(f, [tHist - 20, tYear + 30], [2010.5, 2015], E.inOut);
  const yearRoll = ip(f, [tYear - 8, tYear + 34], [0, 1], E.out);

  // ---------- Shot 8–9: browser + kartu proses ----------
  const browserIn = sp(f, tGoal + 30, {damping: 20, stiffness: 80});
  const browserOut = ip(f, [tQ - 40, tQ + 10], [0, 1], E.in);
  const camRy = kf(f, [tGoal + 30, tOps, tCont, tQ], [-14, -6, 6, 0], E.inOut) + drift(f, 4, 1, 0.5);
  const camRx = kf(f, [tGoal + 30, tQ], [8, 4], E.inOut);
  const contDraw = ip(f, [tCont - 10, tCont + 60], [0, 1], E.inOut);

  // ---------- Shot 10: putih ----------
  const white = ip(f, [tQ - 20, tQ + 12], [0, 1], E.inOut);

  return (
    <Stage dark={1}>
      <AbsoluteFill style={{background: '#050505'}} />
      <LightSweep o={0.35 * (1 - white) * ip(f, [tGoal, tGoal + 60], [0, 1])} seed={3} />
      <WarmGlow x={960} y={560} r={860} o={0.8 * (1 - tlIn * 0.5 * (1 - tlOut)) * (1 - white)} seed={4} />
      <WaveLight y={640} amp={30} o={0.5 * (1 - s6out)} seed={2} />

      {/* Shot 6 */}
      {f < tHist + 30 && (
        <AbsoluteFill style={{perspective: 1800, opacity: 1 - s6out}}>
          <div style={{position: 'absolute', left: 960, top: 540 + panelY, transformStyle: 'preserve-3d',
            transform: `rotateY(${panelRy}deg) rotateX(4deg) scale(${1 - s6out * 0.6})`}}>
            <div style={{position: 'absolute', left: -380 + 120, top: -230, transform: `translateZ(${-40 * codeIn}px)`}}>
              <Panel w={760} h={460} bg="#151a21" glow={0.9} radius={22}>
                <MiniDash seed={0} big />
              </Panel>
            </div>
            {chips.map((c, i) => {
              const a = sp(f, c.t, {damping: 13, stiffness: 140});
              return (
                <div key={i} style={{position: 'absolute', left: c.x, top: c.y, transform: `translateZ(${120 + i * 20}px) translateX(${(1 - a) * 160}px) scale(${a})`, opacity: clamp01(a)}}>
                  <Chip text={c.label} icon={<Icon i={c.icon} size={30} color={C.coralSoft} />} bg="rgba(20,20,22,0.85)" size={30}
                    style={{border: '1px solid rgba(255,138,76,0.45)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}} />
                </div>
              );
            })}
            {/* struktur kode (direktori repositori panel) */}
            <div style={{position: 'absolute', left: 560, top: -40, transform: `translateZ(${160 * codeIn}px) rotateY(-10deg) scale(${0.8 + 0.2 * codeIn})`, opacity: codeIn}}>
              <Panel w={380} h={330} bg="#0d1014" glow={0.6} radius={18}>
                <div style={{padding: 26, fontFamily: MONO, fontSize: 22, color: '#c9d2de', lineHeight: 1.7}}>
                  <div style={{color: C.coralSoft, marginBottom: 6}}>pterodactyl/panel</div>
                  {['app/', 'config/', 'database/', 'resources/', 'routes/'].map((d, i) => (
                    <div key={d} style={{opacity: clamp01((f - tCode - i * 6) / 14)}}>
                      <span style={{color: '#6b7685'}}>├─ </span>{d}
                    </div>
                  ))}
                  <div style={{display: 'flex', gap: 10, marginTop: 14, opacity: clamp01((f - tCode - 40) / 16)}}>
                    {['PHP', 'React', 'Go'].map((t) => (
                      <span key={t} style={{fontFamily: FONT, fontSize: 17, fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)'}}>{t}</span>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Shot 7: garis waktu */}
      {f > tHist - 25 && f < tGoal + 70 && (
        <AbsoluteFill style={{opacity: tlIn * (1 - tlOut), perspective: 1600}}>
          <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${1 + 0.15 * tlOut})`, transformOrigin: '50% 60%'}}>
            <Curved w={1920} h={1080} span={curve} strips={18}>
              <Timeline f={f} year={scrollYear} roll={yearRoll} tYear={tYear} />
            </Curved>
          </div>
        </AbsoluteFill>
      )}

      {/* Shot 8–9: browser + kartu proses */}
      {f > tGoal + 20 && (
        <AbsoluteFill style={{perspective: 2000}}>
          <div style={{position: 'absolute', left: 960, top: 600, transformStyle: 'preserve-3d',
            transform: `translateZ(${-900 * browserOut}px) rotateY(${camRy}deg) rotateX(${camRx}deg) scale(${0.4 + 0.6 * browserIn})`, opacity: clamp01(browserIn * 1.5) * (1 - browserOut * 0.7)}}>
            <div style={{position: 'absolute', left: -700, top: -330}}>
              <Panel w={1400} h={680} bg="#101318" glow={0.8} radius={24}>
                {/* bilah browser abstrak */}
                <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', background: '#181c23', borderBottom: '1px solid #262d38'}}>
                  {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.8}} />)}
                  <div style={{marginLeft: 22, flex: 1, height: 38, borderRadius: 10, background: '#0f1217', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
                    fontFamily: MONO, fontSize: 19, color: '#8b95a3'}}>
                    <Icon i={Globe} size={18} color="#8b95a3" />
                    {'panel.contoh.id'.slice(0, Math.floor(ip(f, [tWeb, tWeb + 40], [0, 15], E.linear)))}
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26, padding: 34}}>
                  {Array.from({length: 6}).map((_, i) => (
                    <ProcCard key={i} i={i} f={f} tOps={tOps} tOn={tOn} tMon={tMon} tSet={tSet} contDraw={contDraw} />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* teks kunci */}
      <KText text="Berawal dari pengelolaan server game." at={tGame - 18} out={tOps - 4} x={960} y={150} size={60} color="#fff" weight={650}
        accent={[{word: 'server', color: C.coralSoft}, {word: 'game.', color: C.coralSoft}]} />
      <KText text="Dinyalakan · dipantau · diatur" at={tOn - 4} out={tQ - 40} x={960} y={140} size={46} color="#fff" weight={600} stagger={8} />

      {/* Shot 10: putih + pertanyaan */}
      <AbsoluteFill style={{background: '#fff', opacity: white}} />
      <KText text="Lalu, bagaimana dengan bot?" at={tQ + 4} x={960} y={540} size={92} weight={700} accent={[{word: 'bot?', color: C.ember}]} />

      <Sfx at={2} s="slide_soft_2" v={0.22} />
      <Sfx at={tFree - 2} s="snap_2" v={0.3} />
      <Sfx at={tOpen - 2} s="snap_1" v={0.28} />
      <Sfx at={tOpen + 28} s="snap_3" v={0.26} />
      <Sfx at={tCode - 6} s="slide_glass_1" v={0.28} />
      <Sfx at={tCode + 4} s="type_1" v={0.2} />
      <Sfx at={tHist - 28} s="suck_2" v={0.26} />
      <Sfx at={tYear - 8} s="thud_2" v={0.4} />
      <Sfx at={tYear + 2} s="tick_2" v={0.2} />
      <Sfx at={tGoal + 26} s="slide_glass_2" v={0.3} />
      <Sfx at={tWeb} s="type_3" v={0.22} />
      <Sfx at={tOn} s="switch_1" v={0.3} />
      <Sfx at={tMon} s="data_1" v={0.2} />
      <Sfx at={tSet} s="click_2" v={0.28} />
      <Sfx at={tCont - 6} s="draw_1" v={0.28} />
      <Sfx at={tQ - 30} s="riser_2" v={0.2} />
      <Sfx at={tQ + 4} s="snap_1" v={0.22} />
    </Stage>
  );
};

/** Garis waktu dengan tick tahun; 2015 menjadi titik fokus. */
const Timeline: React.FC<{f: number; year: number; roll: number; tYear: number}> = ({f, year, roll}) => {
  const px = 260; // px per tahun
  const y0 = 600;
  const years = Array.from({length: 18}).map((_, i) => 2006 + i);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <DashGrid cols={[300, 1620]} rows={[230, 900]} color="rgba(255,255,255,0.4)" />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <line x1={0} x2={1920} y1={y0} y2={y0} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
        {years.map((yr) => {
          const x = 960 + (yr - year) * px;
          const major = yr === 2015;
          return (
            <g key={yr}>
              <line x1={x} x2={x} y1={y0 - (major ? 30 : 14)} y2={y0 + (major ? 30 : 14)} stroke={major ? C.coral : '#fff'} strokeOpacity={major ? 1 : 0.5} strokeWidth={major ? 4 : 2} />
              {!major && (
                <text x={x} y={y0 + 60} textAnchor="middle" fontFamily={FONT} fontSize={26} fontWeight={500} fill="#fff" fillOpacity={0.35}>
                  {yr}
                </text>
              )}
              {Array.from({length: 3}).map((_, k) => (
                <line key={k} x1={x + ((k + 1) * px) / 4} x2={x + ((k + 1) * px) / 4} y1={y0 - 6} y2={y0 + 6} stroke="#fff" strokeOpacity={0.25} strokeWidth={1.5} />
              ))}
            </g>
          );
        })}
        <circle cx={960 + (2015 - year) * px} cy={y0} r={12 + 4 * Math.sin(f * 0.1)} fill={C.coral} />
        <circle cx={960 + (2015 - year) * px} cy={y0} r={30 + 20 * ((f * 0.02) % 1)} fill="none" stroke={C.coral} strokeOpacity={1 - ((f * 0.02) % 1)} strokeWidth={2} />
      </svg>
      {/* digit tahun berguling */}
      <div style={{position: 'absolute', left: 960 + (2015 - year) * px, top: 400, transform: 'translate(-50%, -50%)', display: 'flex', fontFamily: FONT,
        fontWeight: 800, fontSize: 230, letterSpacing: '-0.05em', color: '#fff', lineHeight: 1}}>
        {'2015'.split('').map((d, i) => {
          const a = clamp01(roll * 1.6 - i * 0.18);
          return (
            <div key={i} style={{height: 230, overflow: 'hidden'}}>
              <div style={{transform: `translateY(${(1 - E.out(a)) * 230}px)`, opacity: a}}>{d}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 960 + (2015 - year) * px, top: 690, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 30, fontWeight: 500,
        color: 'rgba(255,255,255,0.7)', opacity: roll, whiteSpace: 'nowrap'}}>
        awal sejarah proyek Pterodactyl
      </div>
    </div>
  );
};

/** Kartu proses generik (tanpa tampilan game): status, aksi, isolasi container. */
const ProcCard: React.FC<{i: number; f: number; tOps: number; tOn: number; tMon: number; tSet: number; contDraw: number}> = ({i, f, tOps, tOn, tMon, tSet, contDraw}) => {
  const a = sp(f, tOps - 40 + i * 6, {damping: 18});
  const running = f > tOn + i * 5;
  const state = f > tOn + i * 5 + 25 ? 'running' : running ? 'starting' : 'offline';
  const mon = ip(f, [tMon + i * 4, tMon + 40 + i * 4], [0, 1]);
  const set = ip(f, [tSet + i * 4, tSet + 30 + i * 4], [0, 1], E.out);
  const pts = Array.from({length: 24}).map((_, k) => {
    const v = 0.35 + 0.3 * Math.sin(k * 0.6 + f * 0.05 + i) + 0.12 * Math.sin(k * 1.7 - f * 0.03);
    return `${k ? 'L' : 'M'}${(k / 23) * 330},${50 - v * 44 * mon}`;
  });
  const per = 1500;
  return (
    <div style={{position: 'relative', opacity: clamp01(a), transform: `translateY(${(1 - a) * 40}px)`}}>
      {/* garis isolasi container */}
      <svg width={420} height={270} style={{position: 'absolute', left: -14, top: -14, overflow: 'visible'}}>
        <rect x={2} y={2} width={410} height={262} rx={20} fill="none" stroke={C.coral} strokeWidth={2.2} strokeDasharray="10 8"
          strokeDashoffset={-f * 0.4} opacity={contDraw} />
        <rect x={2} y={2} width={410} height={262} rx={20} fill="none" stroke={C.coral} strokeWidth={2.2}
          strokeDasharray={per} strokeDashoffset={per * (1 - contDraw)} opacity={0.4 * contDraw} />
      </svg>
      <div style={{height: 236, borderRadius: 14, background: '#1a1f27', border: '1px solid #2a3240', padding: 22, boxSizing: 'border-box', fontFamily: FONT}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <Icon i={Box} size={24} color="#8b95a3" />
          <div style={{fontSize: 22, fontWeight: 650, color: '#e6ebf2'}}>Server {String(i + 1).padStart(2, '0')}</div>
          <div style={{marginLeft: 'auto'}}><StatusPill state={state as never} size={15} /></div>
        </div>
        <svg width={330} height={56} style={{marginTop: 18}}>
          <path d={pts.join(' ')} fill="none" stroke={C.ptero} strokeWidth={2.4} opacity={0.3 + 0.7 * mon} />
        </svg>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 14}}>
          <div style={{width: 40, height: 40, borderRadius: 10, background: running ? '#16a34a' : '#2a3240', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon i={Play} size={20} color="#fff" />
          </div>
          <div style={{width: 40, height: 40, borderRadius: 10, background: '#2a3240', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon i={Activity} size={20} color={mon > 0.5 ? C.ptero : '#8b95a3'} />
          </div>
          <div style={{width: 40, height: 40, borderRadius: 10, background: '#2a3240', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon i={Settings} size={20} color={set > 0.5 ? C.coralSoft : '#8b95a3'} />
          </div>
          <div style={{flex: 1, height: 8, borderRadius: 4, background: '#2a3240', marginLeft: 6, overflow: 'hidden'}}>
            <div style={{width: `${30 + 40 * set + 10 * Math.sin(i)}%`, height: '100%', background: C.coralSoft, opacity: 0.4 + 0.6 * set}} />
          </div>
        </div>
      </div>
    </div>
  );
};
