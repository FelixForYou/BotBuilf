import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Chip, Corners, MaskWords, Panel, Sfx, clamp, prog, useSpring} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FACTS, FONT} from '../theme';

const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const s = useSpring(6, 14);
  const mask = prog(f, 4, 40);
  return (
    <div style={{position: 'relative', width: 520, height: 520}}>
      {/* rotating HUD ring */}
      <svg width={520} height={520} viewBox="-260 -260 520 520" style={{position: 'absolute', inset: 0}}>
        <circle r={240} fill="none" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - mask)} transform="rotate(-90)" />
        <g transform={`rotate(${f * 0.6})`}>
          <circle r={218} fill="none" stroke={C.green} strokeOpacity={0.45} strokeWidth={4} strokeDasharray="60 30 6 30" />
        </g>
        <g transform={`rotate(${-f * 0.9})`}>
          <circle r={256} fill="none" stroke={C.cyan} strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="2 10" />
        </g>
        {/* scanning arc */}
        <g transform={`rotate(${f * 3})`}>
          <path d="M 0 -240 A 240 240 0 0 1 170 -170" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" opacity={0.9 * mask} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 70,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.cyan}22, transparent 70%)`,
          clipPath: `circle(${mask * 60}% at 50% 50%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('juiceshop-logo.svg')}
          style={{height: 300, transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -12}deg)`, filter: `drop-shadow(0 0 30px ${C.cyan}66)`}}
        />
      </div>
    </div>
  );
};

export const S2Intro: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s2');
  const tName = cue('s2', 'O-wasp Juice Shop', -4);
  const tFlag = cue('s2', 'Flagship', -14);
  const tLead = cue('s2', 'dipimpin', -6);
  const tShop = cue('s2', 'Sebuah toko', -4);
  const tVuln = cue('s2', 'celah keamanan', -6);

  // layout phase: logo on the left; leaders then morph into "what is it" panel
  const phase2 = prog(f, tShop - 10, tShop + 20);

  return (
    <AbsoluteFill>
      <Sfx at={2} name="scan" volume={0.45} />
      <Sfx at={10} name="impact" volume={0.45} />
      <Sfx at={tName} name="whoosh" volume={0.45} />
      <Sfx at={tFlag + 4} name="beep2" volume={0.45} />
      <Sfx at={tLead} name="chatter" volume={0.3} />
      <Sfx at={tLead + 10} name="click" volume={0.5} />
      <Sfx at={tLead + 22} name="click" volume={0.5} />
      <Sfx at={tShop - 6} name="whoosh_rev" volume={0.4} />
      <Sfx at={tVuln} name="buzz" volume={0.4} />
      <Sfx at={tVuln + 4} name="glitch" volume={0.3} />

      <div style={{position: 'absolute', left: 170, top: 270}}>
        <Logo />
      </div>

      <div style={{position: 'absolute', left: 780, top: 250, width: 1020}}>
        <div style={{opacity: prog(f, tFlag, tFlag + 20), transform: `translateX(${(1 - prog(f, tFlag, tFlag + 24)) * -30}px)`}}>
          <Chip color={C.green}>
            <Icon name="flag" size={22} color={C.green} />
            OWASP Flagship Project
          </Chip>
        </div>
        <div style={{height: 26}} />
        <div style={{fontFamily: FONT.mono, fontSize: 30, color: C.cyan, letterSpacing: 10, opacity: prog(f, tName, tName + 20)}}>OWASP</div>
        <MaskWords
          text="Juice Shop"
          start={tName + 6}
          stagger={7}
          dur={30}
          style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 150, color: C.text, lineHeight: 1.02, letterSpacing: -2}}
        />
        <div style={{height: 4, marginTop: 14, width: 560 * prog(f, tName + 20, tName + 60), background: `linear-gradient(90deg, ${C.cyan}, ${C.green}, transparent)`}} />

        {/* leaders */}
        <div style={{marginTop: 46, height: 220, position: 'relative'}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - phase2, transform: `translateY(${-phase2 * 30}px)`}}>
            <div style={{fontFamily: FONT.mono, fontSize: 20, color: C.muted, letterSpacing: 4, marginBottom: 18, opacity: prog(f, tLead, tLead + 16)}}>
              PROJECT LEADERS
            </div>
            <div style={{display: 'flex', gap: 26}}>
              {FACTS.leaders.map((l, i) => {
                const p = prog(f, tLead + 8 + i * 12, tLead + 34 + i * 12);
                return (
                  <Panel key={l.handle} style={{padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, position: 'relative'}}>
                    <div style={{width: 64, height: 64, borderRadius: 32, border: `2px solid ${C.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${C.cyan}14`}}>
                      <Icon name="users" size={34} color={C.cyan} />
                    </div>
                    <div>
                      <div style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 32, color: C.text}}>{l.name}</div>
                      <div style={{fontFamily: FONT.mono, fontSize: 21, color: C.muted}}>@{l.handle}</div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>

          {/* what is it */}
          <div style={{position: 'absolute', inset: 0, opacity: phase2, transform: `translateY(${(1 - phase2) * 30}px)`}}>
            <MaskWords
              text="Toko online yang sengaja dibuat penuh celah keamanan."
              start={tShop}
              stagger={4}
              style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 48, color: C.text, lineHeight: 1.25, maxWidth: 980}}
              highlight={{sengaja: C.green, celah: C.red, 'keamanan.': C.red}}
            />
            <div style={{display: 'flex', gap: 18, marginTop: 30}}>
              {[
                {i: 'bug', t: 'Insecure by design', c: C.red},
                {i: 'target', t: 'Target latihan', c: C.cyan},
              ].map((b, k) => {
                const p = prog(f, tVuln + k * 10, tVuln + 24 + k * 10);
                return (
                  <div key={b.t} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 12, border: `1.5px solid ${b.c}66`, background: `${b.c}12`, color: b.c, fontFamily: FONT.mono, fontSize: 24, opacity: p, transform: `scale(${0.8 + 0.2 * p})`}}>
                    <Icon name={b.i} size={28} color={b.c} draw={p} />
                    {b.t}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* frame corners around whole composition */}
      <div style={{position: 'absolute', left: 80, top: 80, opacity: interpolate(f, [0, 20, duration - 20, duration], [0, 1, 1, 0], clamp)}}>
        <Corners w={1760} h={920} size={40} color={`${C.cyan}88`} />
      </div>
    </AbsoluteFill>
  );
};
