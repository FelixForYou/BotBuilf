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

type Edge = "none" | "dip" | "zoom";
const edges: Record<PId, [Edge, Edge]> = { p1: ["none", "dip"], p2: ["dip", "zoom"], p3: ["zoom", "zoom"], p4: ["zoom", "zoom"], p5: ["zoom", "none"], p6: ["none", "none"] };
const ease = (t: number) => t * t * (3 - 2 * t);
/** Scene shell: zoom-blur into / out of the colour covers, or a short dip through black. */
const Shell: React.FC<{ id: PId; dur: number; children: React.ReactNode }> = ({ id, dur, children }) => {
  const f = useCurrentFrame();
  const [inE, outE] = edges[id];
  const N = 16;
  const tin = inE === "none" ? 0 : 1 - ease(Math.min(1, f / N));
  const tout = outE === "none" ? 0 : ease(Math.max(0, Math.min(1, (f - (dur - N)) / N)));
  let scale = 1, blur = 0, o = 1;
  if (inE === "zoom") { scale *= 1 + 0.06 * tin; blur += 8 * tin; }
  if (outE === "zoom") { scale *= 1 + 0.08 * tout; blur += 10 * tout; }
  if (inE === "dip") o *= 1 - tin;
  if (outE === "dip") o *= 1 - tout;
  return (
    <AbsoluteFill style={{ opacity: o, transform: scale !== 1 ? `scale(${scale})` : undefined, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

export const ShortVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#030303" }}>
    {scenes.map(([id, Comp]) => {
      const { from, dur } = pRange(id);
      return (
        <Sequence key={id} from={from} durationInFrames={dur} name={`short ${id}`}>
          <Shell id={id} dur={dur}><Comp /></Shell>
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
