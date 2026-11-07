import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Captions, Chrome, Shell } from "./components/Ui";
import { S1Hook } from "./scenes/S1Hook";
import { S2What } from "./scenes/S2What";
import { S3History } from "./scenes/S3History";
import { S4Functions } from "./scenes/S4Functions";
import { S5Tools } from "./scenes/S5Tools";
import { S6Usage } from "./scenes/S6Usage";
import { S7Who } from "./scenes/S7Who";
import { S8Closing } from "./scenes/S8Closing";
import { C } from "./theme";
import { beat, easeInOut, prog, TL } from "./timing";

const SCENES: Record<string, { C: React.FC; label: string; tint: [string, string] }> = {
  s1: { C: S1Hook, label: "INTRO", tint: ["#efeaff", "#fff1e8"] },
  s2: { C: S2What, label: "01 · APA ITU", tint: ["#e9f0ff", "#f1ecff"] },
  s3: { C: S3History, label: "02 · SEJARAH", tint: ["#fff1e6", "#eef3ff"] },
  s4: { C: S4Functions, label: "03 · FUNGSI", tint: ["#e9faf1", "#eef2ff"] },
  s5: { C: S5Tools, label: "04 · TOOLS", tint: ["#eef2ff", "#fff4e8"] },
  s6: { C: S6Usage, label: "05 · CARA PAKAI", tint: ["#f0ecff", "#e9faf3"] },
  s7: { C: S7Who, label: "06 · PENGGUNA", tint: ["#fff3e6", "#ecf1ff"] },
  s8: { C: S8Closing, label: "07 · PENUTUP", tint: ["#e9f0ff", "#effaf4"] },
};

/** Scene layer; the last scene fades into a dark end card. */
const SceneLayer: React.FC<{ id: string; index: number; dur: number; parts: { start: number; dur: number; text: string }[] }> = ({ id, index, dur, parts }) => {
  const f = useCurrentFrame();
  const def = SCENES[id];
  const Comp = def.C;
  const dark = id === "s8" ? prog(f, beat("s8", "dark"), 24, easeInOut) : 0;
  return (
    <>
      <Backdrop tint={def.tint} dark={dark} />
      <Shell dur={dur}>
        <Comp />
      </Shell>
      <Chrome section={def.label} index={index + 1} total={8} dark={dark} />
      <Captions parts={parts} dark={dark > 0.5} />
    </>
  );
};

export const KaliVideo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {TL.scenes.map((s, i) => (
      <Sequence key={s.id} name={`${String(i + 1).padStart(2, "0")} ${SCENES[s.id].label}`} from={s.from} durationInFrames={s.dur}>
        <SceneLayer id={s.id} index={i} dur={s.dur} parts={s.parts} />
      </Sequence>
    ))}
    <Audio src={staticFile("audio/mix.wav")} />
  </AbsoluteFill>
);
