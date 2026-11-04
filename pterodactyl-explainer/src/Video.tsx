import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { OVERLAP, SegId, sceneRange, segStart, segments } from "./lib/time";
import { loadFonts } from "./lib/fonts";
import { SfxCue } from "./lib/sfx";
import { S01, sfx01 } from "./scenes/S01";
import { S02, sfx02 } from "./scenes/S02";
import { S03, sfx03 } from "./scenes/S03";
import { S04, sfx04 } from "./scenes/S04";
import { S05, sfx05 } from "./scenes/S05";
import { S06, sfx06 } from "./scenes/S06";
import { S07, sfx07 } from "./scenes/S07";
import { S08, sfx08 } from "./scenes/S08";
import { S09, sfx09 } from "./scenes/S09";
import { S10, sfx10 } from "./scenes/S10";

loadFonts();

const scenes: [SegId, React.FC][] = [
  ["s01", S01], ["s02", S02], ["s03", S03], ["s04", S04], ["s05", S05],
  ["s06", S06], ["s07", S07], ["s08", S08], ["s09", S09], ["s10", S10],
];

export const allSfx: SfxCue[] = [
  ...sfx01(), ...sfx02(), ...sfx03(), ...sfx04(), ...sfx05(),
  ...sfx06(), ...sfx07(), ...sfx08(), ...sfx09(), ...sfx10(),
].sort((a, b) => a.at - b.at);

/** Incoming scene fades in over the overlap while sharing objects with the outgoing one. */
const Fader: React.FC<{ children: React.ReactNode; first: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  // Scenes hand over with in-scene transitions (match cuts, sweeps, morphs): no crossfade.
  void f; void first; void interpolate; void OVERLAP;
  return <AbsoluteFill>{children}</AbsoluteFill>;
};

export type VideoProps = { narration?: boolean };

export const Video: React.FC<VideoProps> = ({ narration = false }) => (
  <AbsoluteFill style={{ background: "#030303" }}>
    {scenes.map(([id, Comp], i) => {
      const { from, dur } = sceneRange(id);
      return (
        <Sequence key={id} from={from} durationInFrames={dur} name={`scene ${id}`}>
          <Fader first={i === 0}>
            <Comp />
          </Fader>
        </Sequence>
      );
    })}
    {narration && segments.map((sg) => (
      <Sequence key={"vo" + sg.id} from={segStart(sg.id as SegId)} durationInFrames={Math.ceil(sg.audioDur * 60) + 2} name={`vo ${sg.id}`}>
        <Audio src={staticFile(`audio/vo/${sg.id}.mp3`)} volume={1} />
      </Sequence>
    ))}
    {allSfx.map((c, i) => (
      <Sequence key={"sfx" + i} from={Math.max(0, c.at)} durationInFrames={300} name={`sfx ${c.name}`} layout="none">
        <Audio src={staticFile(`audio/sfx/${c.name}.wav`)} volume={c.vol ?? 0.5} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
