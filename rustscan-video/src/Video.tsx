import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Background, Captions, GlitchTransition, HUD, SceneShell, Scanlines } from "./components/Fx";
import { S1Intro } from "./scenes/S1Intro";
import { S2Reveal } from "./scenes/S2Reveal";
import { S3Github } from "./scenes/S3Github";
import { S4How } from "./scenes/S4How";
import { S5Install } from "./scenes/S5Install";
import { S6Demo } from "./scenes/S6Demo";
import { S7Features } from "./scenes/S7Features";
import { S8Outro } from "./scenes/S8Outro";
import { C } from "./theme";
import { TL } from "./timing";

const SCENES: Record<string, { C: React.FC; label: string; glowX: number; glowY: number }> = {
  s1: { C: S1Intro, label: "INTRODUCTION", glowX: 30, glowY: 40 },
  s2: { C: S2Reveal, label: "TOOL REVEAL", glowX: 30, glowY: 40 },
  s3: { C: S3Github, label: "GITHUB REPOSITORY", glowX: 50, glowY: 30 },
  s4: { C: S4How, label: "HOW IT WORKS", glowX: 50, glowY: 45 },
  s5: { C: S5Install, label: "KALI LINUX INSTALLATION", glowX: 35, glowY: 40 },
  s6: { C: S6Demo, label: "LIVE DEMONSTRATION", glowX: 35, glowY: 50 },
  s7: { C: S7Features, label: "FEATURES & BENEFITS", glowX: 50, glowY: 40 },
  s8: { C: S8Outro, label: "OUTRO", glowX: 50, glowY: 40 },
};

export const RustScanVideo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {TL.scenes.map((s, i) => {
      const def = SCENES[s.id];
      const Comp = def.C;
      return (
        <Sequence key={s.id} name={`${String(i + 1).padStart(2, "0")} ${def.label}`} from={s.from} durationInFrames={s.dur}>
          <Background glowX={def.glowX} glowY={def.glowY} glow={i % 2 ? C.kali : C.cyan} />
          <SceneShell dur={s.dur}>
            <Comp />
          </SceneShell>
          <HUD label={def.label} index={i + 1} />
          <Captions parts={s.parts} />
        </Sequence>
      );
    })}
    {TL.scenes.slice(1).map((s) => (
      <GlitchTransition key={`t${s.id}`} at={s.from} />
    ))}
    <Scanlines />
    <Audio src={staticFile("audio/mix.wav")} />
  </AbsoluteFill>
);
