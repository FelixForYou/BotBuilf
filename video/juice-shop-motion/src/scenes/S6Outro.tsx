import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Corners, MaskWords, Panel, SectionLabel, Sfx, Typewriter, clamp, easeInOut, prog, useSpring} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FACTS, FONT} from '../theme';

const BENEFITS = [
  {i: 'target', t: 'Latihan legal & gratis', d: 'Open source, lisensi MIT'},
  {i: 'bug', t: `${FACTS.challenges} tantangan nyata`, d: 'Mencakup OWASP Top Ten'},
  {i: 'wrench', t: 'Serang & perbaiki', d: 'Berpikir seperti penyerang, bangun yang aman'},
];

export const S6Outro: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s6');
  const tEthic = cue('s6', 'Gunakan hanya', -10);
  const tVisit = cue('s6', 'Kunjungi', -14);
  const endCard = prog(f, tVisit, tVisit + 34, easeInOut);
  const logoS = useSpring(tVisit + 8, 13);

  return (
    <AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.4} />
      {BENEFITS.map((_, i) => (
        <Sfx key={i} at={18 + i * 16} name="beep2" volume={0.3} />
      ))}
      <Sfx at={tEthic} name="scan" volume={0.35} />
      <Sfx at={tEthic + 12} name="blip" volume={0.4} />
      <Sfx at={tVisit - 20} name="riser" volume={0.4} />
      <Sfx at={tVisit + 8} name="impact" volume={0.55} />
      <Sfx at={tVisit + 30} name="typing_short" volume={0.35} />
      <Sfx at={tVisit + 110} name="star" volume={0.5} />
      <Sfx at={duration - 70} name="hum" volume={0.3} />

      {/* summary + ethics */}
      <AbsoluteFill style={{opacity: 1 - endCard, transform: `scale(${1 - endCard * 0.1})`, filter: `blur(${endCard * 10}px)`}}>
        <SectionLabel index="05" title="Kesimpulan" start={2} />
        <div style={{position: 'absolute', left: 90, top: 160}}>
          <MaskWords text="Kenapa Juice Shop?" start={6} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 76, color: C.text}} highlight={{'Shop?': C.cyan}} />
        </div>
        <div style={{position: 'absolute', left: 90, top: 300, display: 'flex', flexDirection: 'column', gap: 22}}>
          {BENEFITS.map((b, i) => {
            const p = prog(f, 16 + i * 16, 46 + i * 16);
            return (
              <Panel key={b.t} style={{width: 860, padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24, opacity: p, transform: `translateX(${(1 - p) * -80}px)`}}>
                <div style={{width: 72, height: 72, borderRadius: 18, background: `${C.cyan}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon name={b.i} size={40} color={C.cyan} draw={p} />
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 34, color: C.text}}>{b.t}</div>
                  <div style={{fontFamily: FONT.mono, fontSize: 20, color: C.muted, marginTop: 4}}>{b.d}</div>
                </div>
                <Icon name="check" size={36} color={C.green} stroke={3} draw={prog(f, 30 + i * 16, 50 + i * 16)} />
              </Panel>
            );
          })}
        </div>

        {/* ethics shield */}
        {(() => {
          const p = prog(f, tEthic, tEthic + 30);
          const pulse = 1 + Math.sin(f / 10) * 0.03;
          return (
            <div style={{position: 'absolute', left: 1060, top: 200, width: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
              <div style={{position: 'relative', width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width={300} height={300} viewBox="-150 -150 300 300" style={{position: 'absolute'}}>
                  <circle r={140} fill="none" stroke={C.green} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="6 10" transform={`rotate(${f})`} />
                  <circle r={118} fill={`${C.green}10`} stroke={C.green} strokeOpacity={0.6} strokeWidth={2} pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - p)} transform="rotate(-90)" />
                </svg>
                <div style={{transform: `scale(${pulse})`}}>
                  <Icon name="shieldCheck" size={150} color={C.green} stroke={1.4} draw={p} style={{filter: `drop-shadow(0 0 20px ${C.green}88)`}} />
                </div>
              </div>
              <div style={{marginTop: 30, fontFamily: FONT.mono, fontSize: 22, color: C.green, letterSpacing: 4}}>ETIKA & LEGALITAS</div>
              <div style={{marginTop: 14, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 38, color: C.text, lineHeight: 1.3}}>
                Gunakan hanya di lingkungan <span style={{color: C.green}}>milikmu sendiri</span> atau yang <span style={{color: C.green}}>sudah berizin</span>.
              </div>
              <div style={{marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.mono, fontSize: 20, color: C.muted}}>
                <Icon name="alert" size={22} color={C.amber} /> Menguji sistem orang lain tanpa izin = melanggar hukum
              </div>
            </div>
          );
        })()}
      </AbsoluteFill>

      {/* end card */}
      {endCard > 0 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: endCard * interpolate(f, [duration - 24, duration], [1, 0], clamp)}}>
          <svg width={900} height={900} viewBox="-450 -450 900 900" style={{position: 'absolute', opacity: 0.6}}>
            <circle r={330} fill="none" stroke={C.cyan} strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="3 9" transform={`rotate(${f * 0.5})`} />
            <circle r={380} fill="none" stroke={C.green} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="80 40" transform={`rotate(${-f * 0.3})`} />
          </svg>
          <Img src={staticFile('juiceshop-logo.svg')} style={{height: 230, transform: `scale(${logoS}) translateY(${(1 - logoS) * 40}px)`, filter: `drop-shadow(0 0 40px ${C.cyan}55)`}} />
          <div style={{height: 26}} />
          <MaskWords text="OWASP Juice Shop" start={tVisit + 16} stagger={6} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 104, color: C.text, justifyContent: 'center', letterSpacing: -1}} highlight={{OWASP: C.cyan}} />
          <div style={{height: 30}} />
          <div style={{position: 'relative', padding: '18px 36px', border: `2px solid ${C.cyan}`, borderRadius: 14, background: `${C.cyan}10`, display: 'flex', alignItems: 'center', gap: 18, opacity: prog(f, tVisit + 26, tVisit + 40)}}>
            <Icon name="repo" size={36} color={C.cyan} />
            <Typewriter text={FACTS.url} start={tVisit + 30} cps={36} style={{fontFamily: FONT.mono, fontSize: 44, color: C.text}} />
          </div>
          <div style={{height: 34}} />
          <div style={{display: 'flex', gap: 24, alignItems: 'center', opacity: prog(f, tVisit + 100, tVisit + 120)}}>
            {(() => {
              const glow = 0.5 + 0.5 * Math.sin(f / 12);
              return (
                <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 12, background: '#21262d', border: `1.5px solid ${C.amber}`, boxShadow: `0 0 ${20 + glow * 30}px ${C.amber}88`, fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: C.text}}>
                  <Icon name="star" size={32} color={C.amber} fill={C.amber} /> Beri Star di GitHub
                </div>
              );
            })()}
            <div style={{fontFamily: FONT.mono, fontSize: 26, color: C.muted}}>
              {FACTS.license} License · {FACTS.stars} stars · {FACTS.version}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
