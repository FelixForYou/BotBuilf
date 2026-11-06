import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {MaskWords, Panel, SectionLabel, Sfx, clamp, easeInOut, prog} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FACTS, FONT} from '../theme';

// Challenge counts per category, from data/static/challenges.yml (116 total, 16 categories)
const CATS: [string, number][] = [
  ['Sensitive Data Exposure', 17],
  ['Injection', 14],
  ['Improper Input Validation', 12],
  ['Broken Access Control', 12],
  ['XSS', 9],
  ['Vulnerable Components', 9],
  ['Broken Authentication', 9],
  ['Miscellaneous', 6],
  ['Security Misconfiguration', 5],
  ['Cryptographic Issues', 5],
  ['Observability Failures', 4],
  ['Broken Anti Automation', 4],
  ['Security through Obscurity', 3],
  ['Insecure Deserialization', 3],
  ['XXE', 2],
  ['Unvalidated Redirects', 2],
];

const PERSONAS = [
  {icon: 'grad', t: 'Pelajar', d: 'Belajar dari nol'},
  {icon: 'code', t: 'Developer', d: 'Paham kode aman'},
  {icon: 'shieldCheck', t: 'Penguji Keamanan', d: 'Asah skill & tools'},
  {icon: 'trophy', t: 'Trainer & CTF', d: 'Workshop & lomba'},
];

const Phase: React.FC<{a: number; b: number; children: React.ReactNode}> = ({a, b, children}) => {
  const f = useCurrentFrame();
  const pin = prog(f, a, a + 24);
  const pout = prog(f, b - 14, b + 6, easeInOut);
  if (f < a - 2 || f > b + 8) return null;
  return (
    <AbsoluteFill style={{opacity: pin * (1 - pout), transform: `translateX(${(1 - pin) * 80 - pout * 80}px)`, filter: `blur(${(1 - pin) * 6 + pout * 6}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

export const S4Explain: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s4');
  const tTop = cue('s4', 'O-wasp Top Ten', -20);
  const tReal = cue('s4', 'plus celah');
  const tRun = cue('s4', 'Jalankan', -10);
  const tFind = cue('s4', 'temukan celahnya', -6);
  const tWho = cue('s4', 'Cocok', -10);
  const max = 17;

  return (
    <AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.4} />
      <Sfx at={10} name="chatter" volume={0.3} />
      <Sfx at={tReal} name="scan" volume={0.35} />
      <Sfx at={tRun - 4} name="whoosh_rev" volume={0.4} />
      <Sfx at={tRun + 20} name="blip" volume={0.35} />
      <Sfx at={tRun + 44} name="blip" volume={0.35} />
      <Sfx at={tFind} name="beep2" volume={0.4} />
      <Sfx at={tWho - 4} name="whoosh" volume={0.4} />
      {PERSONAS.map((_, i) => (
        <Sfx key={i} at={tWho + 14 + i * 12} name="click" volume={0.45} />
      ))}

      <SectionLabel index="03" title="Cara Kerja & Fungsi" start={4} />

      {/* Phase A — vulnerability coverage */}
      <Phase a={0} b={tRun}>
        <div style={{position: 'absolute', left: 90, top: 170, width: 640}}>
          <MaskWords text="Target latihan yang legal" start={8} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 72, color: C.text, lineHeight: 1.05}} highlight={{legal: C.green}} />
          <div style={{marginTop: 30, fontFamily: FONT.body, fontSize: 32, color: C.muted, lineHeight: 1.45, opacity: prog(f, tTop, tTop + 20)}}>
            Mencakup kerentanan dari seluruh <span style={{color: C.cyan}}>OWASP Top Ten</span>, plus celah yang sering ditemukan di aplikasi nyata.
          </div>
          <div style={{display: 'flex', gap: 40, marginTop: 50}}>
            {[
              [FACTS.challenges, 'tantangan'],
              [FACTS.categories, 'kategori'],
            ].map(([n, l], i) => {
              const p = prog(f, tTop + 10 + i * 10, tTop + 60 + i * 10);
              return (
                <div key={l as string}>
                  <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 96, color: i ? C.green : C.cyan, lineHeight: 1}}>{Math.round((n as number) * p)}</div>
                  <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, letterSpacing: 3, textTransform: 'uppercase'}}>{l}</div>
                </div>
              );
            })}
          </div>
        </div>
        <Panel style={{position: 'absolute', left: 800, top: 150, width: 1030, padding: '28px 34px'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 19, color: C.muted, letterSpacing: 3, marginBottom: 16, display: 'flex', justifyContent: 'space-between'}}>
            <span>KATEGORI TANTANGAN</span>
            <span style={{color: C.cyan}}>challenges.yml</span>
          </div>
          {CATS.map(([name, n], i) => {
            const p = prog(f, 16 + i * 4, 50 + i * 4);
            const lit = interpolate(f, [tReal + i * 3, tReal + i * 3 + 10, tReal + i * 3 + 30], [0, 1, 0], clamp);
            return (
              <div key={name} style={{display: 'flex', alignItems: 'center', gap: 16, height: 40, opacity: p}}>
                <div style={{width: 360, fontFamily: FONT.body, fontSize: 21, color: lit > 0.3 ? C.text : '#b4c3dc', whiteSpace: 'nowrap'}}>{name}</div>
                <div style={{flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden'}}>
                  <div style={{width: `${(n / max) * 100 * p}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${C.blue}, ${i % 3 === 1 ? C.green : C.cyan})`, boxShadow: `0 0 ${12 + lit * 20}px ${C.cyan}${lit > 0.3 ? 'cc' : '55'}`}} />
                </div>
                <div style={{width: 40, textAlign: 'right', fontFamily: FONT.mono, fontSize: 20, color: C.cyan}}>{Math.round(n * p)}</div>
              </div>
            );
          })}
        </Panel>
      </Phase>

      {/* Phase B — how it works */}
      <Phase a={tRun} b={tWho}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center'}}>
          <MaskWords text="Jalankan lokal. Temukan celahnya. Pantau progres." start={tRun + 4} stagger={4} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: C.text, justifyContent: 'center'}} highlight={{'lokal.': C.cyan, 'celahnya.': C.green}} />
        </div>
        {(() => {
          const nodes = [
            {icon: 'laptop', t: 'Komputermu', d: 'lingkungan sendiri'},
            {icon: 'server', t: 'Juice Shop', d: 'localhost:3000'},
            {icon: 'bug', t: 'Temukan Celah', d: 'satu per satu'},
            {icon: 'trophy', t: 'Score Board', d: 'progres tercatat'},
          ];
          const x0 = 135;
          const gap = 450;
          return (
            <>
              <svg width={1920} height={1080} style={{position: 'absolute'}}>
                {nodes.slice(0, -1).map((_, i) => {
                  const a = tRun + 20 + i * 18;
                  const p = prog(f, a, a + 26);
                  const x1 = x0 + i * gap + 300;
                  const x2 = x0 + (i + 1) * gap - 20;
                  const packet = ((f - a) % 50) / 50;
                  return (
                    <g key={i}>
                      <line x1={x1} y1={620} x2={x1 + (x2 - x1) * p} y2={620} stroke={C.cyan} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-f} opacity={0.8} />
                      {p >= 1 && <circle cx={x1 + (x2 - x1) * packet} cy={620} r={7} fill={C.green} style={{filter: `drop-shadow(0 0 8px ${C.green})`}} />}
                    </g>
                  );
                })}
              </svg>
              {nodes.map((n, i) => {
                const a = tRun + 10 + i * 18;
                const p = prog(f, a, a + 26);
                const active = i === 2 ? prog(f, tFind, tFind + 12) : 0;
                return (
                  <Panel key={n.t} glow={i === 2 ? C.green : C.cyan} style={{position: 'absolute', left: x0 + i * gap, top: 480, width: 300, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${1 + active * 0.08})`, borderColor: active ? C.green : undefined}}>
                    <div style={{width: 104, height: 104, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${i === 2 ? C.green : C.cyan}18`}}>
                      <Icon name={n.icon} size={60} color={i === 2 ? C.green : C.cyan} draw={p} />
                    </div>
                    <div style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 32, color: C.text}}>{n.t}</div>
                    <div style={{fontFamily: FONT.mono, fontSize: 21, color: C.muted}}>{n.d}</div>
                  </Panel>
                );
              })}
              <div style={{position: 'absolute', left: 0, right: 0, top: 830, display: 'flex', justifyContent: 'center', opacity: prog(f, tRun + 60, tRun + 80)}}>
                <div style={{display: 'flex', gap: 12, alignItems: 'center', fontFamily: FONT.mono, fontSize: 22, color: C.green, padding: '10px 22px', border: `1.5px dashed ${C.green}77`, borderRadius: 10}}>
                  <Icon name="lock" size={22} color={C.green} /> Terisolasi di lingkunganmu — tidak menyentuh sistem orang lain
                </div>
              </div>
            </>
          );
        })()}
      </Phase>

      {/* Phase C — who is it for */}
      <Phase a={tWho} b={duration + 30}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center'}}>
          <MaskWords text="Cocok untuk siapa?" start={tWho + 2} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 76, color: C.text, justifyContent: 'center'}} highlight={{'siapa?': C.cyan}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center', gap: 36}}>
          {PERSONAS.map((p, i) => {
            const a = tWho + 12 + i * 12;
            const s = prog(f, a, a + 28);
            const float = Math.sin((f + i * 20) / 30) * 6;
            return (
              <Panel key={p.t} style={{width: 360, height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: s, transform: `translateY(${(1 - s) * 80 + float}px) rotateY(${(1 - s) * 50}deg)`}}>
                <div style={{position: 'relative', width: 130, height: 130, borderRadius: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.cyan}55`, background: `radial-gradient(circle, ${C.cyan}22, transparent 70%)`}}>
                  <svg width={150} height={150} viewBox="-75 -75 150 150" style={{position: 'absolute', left: -10, top: -10}}>
                    <circle r={72} fill="none" stroke={C.green} strokeWidth={2} strokeDasharray="30 200" transform={`rotate(${f * 2 + i * 90})`} />
                  </svg>
                  <Icon name={p.icon} size={64} color={C.cyan} draw={s} />
                </div>
                <div style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 34, color: C.text, textAlign: 'center'}}>{p.t}</div>
                <div style={{fontFamily: FONT.mono, fontSize: 20, color: C.muted}}>{p.d}</div>
              </Panel>
            );
          })}
        </div>
      </Phase>
    </AbsoluteFill>
  );
};
