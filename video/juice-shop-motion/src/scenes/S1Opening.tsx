import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Chip, Corners, DecodeText, Glitch, MaskWords, Sfx, Typewriter, clamp, prog} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FONT} from '../theme';

const BOOT = [
  '> init secure_lab --mode=training',
  '> loading modules ........ [ OK ]',
  '> sandbox: localhost only   [ OK ]',
  '> topic: ethical_hacking',
];

/** concentric HUD rings rotating around the centre */
const Rings: React.FC<{p: number}> = ({p}) => {
  const f = useCurrentFrame();
  const r = [300, 360, 430];
  return (
    <svg width={1000} height={1000} viewBox="-500 -500 1000 1000" style={{position: 'absolute', left: 460, top: 40, opacity: 0.8 * p}}>
      {r.map((rad, i) => (
        <g key={i} transform={`rotate(${(i % 2 ? -1 : 1) * f * (0.25 + i * 0.12)})`}>
          <circle
            r={rad}
            fill="none"
            stroke={i === 1 ? C.green : C.cyan}
            strokeOpacity={0.35 - i * 0.07}
            strokeWidth={i === 0 ? 2 : 1.2}
            strokeDasharray={i === 0 ? '4 14' : i === 1 ? '120 40 10 40' : '2 8'}
            pathLength={1000}
            strokeDashoffset={1000 * (1 - p)}
          />
        </g>
      ))}
      {new Array(36).fill(0).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const len = i % 3 === 0 ? 18 : 8;
        return (
          <line key={i} x1={Math.cos(a) * 470} y1={Math.sin(a) * 470} x2={Math.cos(a) * (470 - len)} y2={Math.sin(a) * (470 - len)} stroke={C.cyan} strokeOpacity={0.4 * p} strokeWidth={2} />
        );
      })}
    </svg>
  );
};

export const S1Opening: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s1');
  const tCyber = 30;
  const tQuestion = cue('s1', 'Tapi', -6);
  const tAman = cue('s1', 'aman');
  const tLegal = cue('s1', 'legal');

  const ringP = prog(f, 4, 70);
  const lineP = prog(f, 0, 40);
  // main title moves up when the question appears
  const up = prog(f, tQuestion - 10, tQuestion + 20);

  return (
    <AbsoluteFill>
      <Sfx at={0} name="hum" volume={0.5} />
      <Sfx at={6} name="chatter" volume={0.35} />
      <Sfx at={tCyber - 4} name="impact" volume={0.6} />
      <Sfx at={tCyber + 2} name="whoosh" volume={0.45} />
      <Sfx at={tCyber + 48} name="blip" volume={0.4} />
      <Sfx at={tQuestion} name="whoosh_rev" volume={0.35} />
      <Sfx at={tAman} name="glitch" volume={0.35} />
      <Sfx at={tLegal} name="glitch" volume={0.4} />
      <Sfx at={duration - 30} name="riser" volume={0.35} />

      <Rings p={ringP} />

      {/* horizontal HUD lines sweeping in */}
      {[180, 900].map((y, i) => (
        <div key={y} style={{position: 'absolute', top: y, left: i ? 1920 - 1920 * lineP : 0, width: 1920 * lineP, height: 1.5, background: `linear-gradient(90deg, transparent, ${C.cyan}88, transparent)`}} />
      ))}

      {/* boot log, top-left */}
      <div style={{position: 'absolute', left: 90, top: 70, fontFamily: FONT.mono, fontSize: 21, lineHeight: 1.6, color: C.muted}}>
        {BOOT.map((l, i) => (
          <div key={i} style={{color: l.includes('OK') ? C.green : C.muted}}>
            <Typewriter text={l} start={6 + i * 14} cps={90} caret={i === BOOT.length - 1} />
          </div>
        ))}
      </div>

      {/* top-right status */}
      <div style={{position: 'absolute', right: 90, top: 76, display: 'flex', gap: 14, alignItems: 'center', fontFamily: FONT.mono, fontSize: 20, color: C.green, opacity: prog(f, 20, 40)}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: C.green, boxShadow: `0 0 14px ${C.green}`, opacity: Math.floor(f / 20) % 2 ? 1 : 0.35}} />
        SYSTEM ONLINE
      </div>

      {/* centre title block */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `translateY(${-up * 120}px) scale(${1 - up * 0.18})`}}>
        <div style={{opacity: prog(f, tCyber + 30, tCyber + 50)}}>
          <Chip>
            <Icon name="shield" size={24} color={C.cyan} />
            Ethical Hacking · Latihan Legal
          </Chip>
        </div>
        <div style={{height: 26}} />
        <Glitch at={tCyber} dur={16}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 168,
              letterSpacing: interpolate(f, [tCyber, tCyber + 80], [40, 6], clamp),
              color: C.text,
              textShadow: `0 0 40px ${C.cyan}55`,
              lineHeight: 1,
            }}
          >
            <DecodeText text="CYBERSECURITY" start={tCyber} dur={34} />
          </div>
        </Glitch>
        <div style={{height: 22}} />
        <MaskWords
          text="Belajar paling efektif lewat praktik"
          start={tCyber + 40}
          stagger={5}
          style={{fontFamily: FONT.body, fontSize: 46, color: C.muted, justifyContent: 'center'}}
          highlight={{praktik: C.cyan}}
        />
      </AbsoluteFill>

      {/* the question */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 190}}>
        <div style={{display: 'flex', gap: 40, alignItems: 'center'}}>
          {[
            {t: 'Aman?', at: tAman, icon: 'lock'},
            {t: 'Legal?', at: tLegal, icon: 'shieldCheck'},
          ].map((q) => {
            const p = prog(f, q.at - 6, q.at + 18);
            return (
              <div key={q.t} style={{position: 'relative', transform: `scale(${0.7 + 0.3 * p})`, opacity: p}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '18px 34px', border: `2px solid ${C.green}88`, borderRadius: 14, background: `${C.green}12`}}>
                  <Icon name={q.icon} size={46} color={C.green} draw={p} />
                  <Glitch at={q.at} dur={12}>
                    <span style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: C.text}}>{q.t}</span>
                  </Glitch>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* data stream columns on the edges */}
      {[60, 1840].map((x, k) => (
        <div key={x} style={{position: 'absolute', left: x, top: 260, fontFamily: FONT.mono, fontSize: 16, color: C.cyan, opacity: 0.35 * ringP, lineHeight: 1.5}}>
          {new Array(18).fill(0).map((_, i) => (
            <div key={i}>{Math.floor(random(`d${k}${i}${Math.floor(f / 6)}`) * 0xffff).toString(16).padStart(4, '0')}</div>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};
