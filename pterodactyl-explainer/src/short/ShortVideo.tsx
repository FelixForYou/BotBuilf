import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFonts } from "../lib/fonts";
import { FONT } from "../lib/theme";
import { SfxCue } from "../lib/sfx";
import cues from "../data/cues_short.json";
import { PId, pRange, pStart, shortSegments } from "./time";
import { SP1, SP2, SP3, SP4, SP5, SP6, sfxP1, sfxP2, sfxP3, sfxP4, sfxP5, sfxP6 } from "./Scenes";

loadFonts();

const scenes: [PId, React.FC][] = [["p1", SP1], ["p2", SP2], ["p3", SP3], ["p4", SP4], ["p5", SP5], ["p6", SP6]];
const sfx: SfxCue[] = [...sfxP1(), ...sfxP2(), ...sfxP3(), ...sfxP4(), ...sfxP5(), ...sfxP6()].sort((a, b) => a.at - b.at);

/** Burned-in captions (most TikTok viewers watch muted). Sits above TikTok's bottom UI. */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 60;
  const cur = (cues as { a: number; b: number; text: string }[]).find((c) => t >= c.a - 0.05 && t <= c.b + 0.1);
  if (!cur) return null;
  const q = Math.min(1, (t - cur.a + 0.05) / 0.12);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 1370, width: 900, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(8,8,9,0.72)", color: "#fff", fontFamily: FONT, fontSize: 40, fontWeight: 600, lineHeight: 1.25, padding: "14px 24px", borderRadius: 18, textAlign: "center",
          opacity: q, transform: `translateY(${(1 - q) * 10}px)` }}>
          {cur.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ShortVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#030303" }}>
    {scenes.map(([id, Comp]) => {
      const { from, dur } = pRange(id);
      return (
        <Sequence key={id} from={from} durationInFrames={dur} name={`short ${id}`}>
          <Comp />
        </Sequence>
      );
    })}
    <Captions />
    {shortSegments.map((sg) => (
      <Sequence key={"vo" + sg.id} from={pStart(sg.id as PId)} durationInFrames={Math.ceil(sg.audioDur * 60) + 2} name={`vo ${sg.id}`}>
        <Audio src={staticFile(`audio/vo_short/${sg.id}.mp3`)} />
      </Sequence>
    ))}
    {sfx.map((c, i) => (
      <Sequence key={"sfx" + i} from={Math.max(0, c.at)} durationInFrames={300} layout="none">
        <Audio src={staticFile(`audio/sfx/${c.name}.wav`)} volume={(c.vol ?? 0.5) * 0.8} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
