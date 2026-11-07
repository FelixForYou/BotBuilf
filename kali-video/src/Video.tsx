import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Background, Captions, GlitchTransition, HUD, SceneShell, Scanlines } from "./components/Fx";
import { S1Opening } from "./scenes/S1Opening";
import { S2What } from "./scenes/S2What";
import { S3History } from "./scenes/S3History";
import { S4Functions } from "./scenes/S4Functions";
import { S5Tools } from "./scenes/S5Tools";
import { S6Usage } from "./scenes/S6Usage";
import { S7Who } from "./scenes/S7Who";
import { S8Closing } from "./scenes/S8Closing";
import { C } from "./theme";
import { TL } from "./timing";

const SCENES: Record<string, { C: React.FC; label: string; glowX: number; glowY: number }> = {
  s1: { C: S1Opening, label: "OPENING", glowX: 60, glowY: 40 },
  s2: { C: S2What, label: "APA ITU KALI LINUX?", glowX: 40, glowY: 40 },
  s3: { C: S3History, label: "SEJARAH SINGKAT", glowX: 50, glowY: 50 },
  s4: { C: S4Functions, label: "FUNGSI KALI LINUX", glowX: 70, glowY: 45 },
  s5: { C: S5Tools, label: "TOOLS POPULER", glowX: 50, glowY: 45 },
  s6: { C: S6Usage, label: "CARA PENGGUNAAN", glowX: 50, glowY: 50 },
  s7: { C: S7Who, label: "SIAPA PENGGUNANYA?", glowX: 50, glowY: 40 },
  s8: { C: S8Closing, label: "PENUTUP", glowX: 50, glowY: 45 },
};

export const KaliVideo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {TL.scenes.map((s, i) => {
      const def = SCENES[s.id];
      const Comp = def.C;
      return (
        <Sequence key={s.id} name={`${String(i + 1).padStart(2, "0")} ${def.label}`} from={s.from} durationInFrames={s.dur}>
          <Background glowX={def.glowX} glowY={def.glowY} glow={i % 2 ? C.cyan : C.kali} />
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
