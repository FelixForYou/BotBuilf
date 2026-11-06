import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background, ScreenFx, SceneShell, clamp, easeInOut} from './components/fx';
import {S1Opening} from './scenes/S1Opening';
import {S2Intro} from './scenes/S2Intro';
import {S3GitHub} from './scenes/S3GitHub';
import {S4Explain} from './scenes/S4Explain';
import {S5Demo} from './scenes/S5Demo';
import {S6Outro} from './scenes/S6Outro';
import {SCENES} from './timeline';
import {C, FONT, fontCss} from './theme';

const MAP: Record<string, React.FC> = {s1: S1Opening, s2: S2Intro, s3: S3GitHub, s4: S4Explain, s5: S5Demo, s6: S6Outro};

/** Diagonal light-sweep wipe that bridges two scenes */
const Wipe: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 16, at + 16], [0, 1], {...clamp, easing: easeInOut});
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-60, 160]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(105deg, transparent ${x - 30}%, ${C.cyan}22 ${x - 12}%, ${C.cyan}cc ${x - 1}%, #ffffff ${x}%, ${C.green}aa ${x + 1.5}%, ${C.bg}f2 ${x + 6}%, ${C.bg}f2 ${x + 18}%, transparent ${x + 34}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** small persistent HUD: scene progress + brand mark */
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const total = SCENES[SCENES.length - 1].from + SCENES[SCENES.length - 1].duration;
  const idx = SCENES.findIndex((s) => f >= s.from && f < s.from + s.duration);
  const vis = interpolate(f, [100, 130, total - 260, total - 230], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, bottom: 26, display: 'flex', alignItems: 'center', gap: 16, opacity: vis * 0.8}}>
      {SCENES.map((s, i) => {
        const p = interpolate(f, [s.from, s.from + s.duration], [0, 1], clamp);
        return (
          <div key={s.id} style={{flex: s.duration, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', background: i === idx ? C.cyan : `${C.cyan}88`}} />
          </div>
        );
      })}
      <div style={{fontFamily: FONT.mono, fontSize: 16, color: C.muted, letterSpacing: 2, whiteSpace: 'nowrap'}}>
        0{Math.max(1, idx + 1)} / 0{SCENES.length}
      </div>
    </div>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <style>{fontCss}</style>
    <Background />
    {SCENES.map((s) => {
      const Comp = MAP[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
          <SceneShell duration={s.duration} out={s.id === 's6' ? 1 : 16}>
            <Comp />
          </SceneShell>
          <Sequence from={s.lead} layout="none">
            <Audio src={staticFile(`vo/${s.id}.wav`)} volume={1} />
          </Sequence>
        </Sequence>
      );
    })}
    {SCENES.slice(1).map((s) => (
      <Wipe key={s.id} at={s.from} />
    ))}
    <Hud />
    <ScreenFx />
  </AbsoluteFill>
);
