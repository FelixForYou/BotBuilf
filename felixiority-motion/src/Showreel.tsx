import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import "./fonts";
import { CircleReveal, RectReveal, SlabWipe } from "./components/Transitions";
import { E, mix, prog } from "./lib/anim";
import { S01BrandAwakening } from "./scenes/S01BrandAwakening";
import { S02Tools } from "./scenes/S02Tools";
import { S03FelixPanel } from "./scenes/S03FelixPanel";
import { S04Warehouse, S4_FROM } from "./scenes/S04Warehouse";
import { S05Telegram } from "./scenes/S05Telegram";
import { S06Studio, S6_RENDER_BTN } from "./scenes/S06Studio";
import { S07SemileAI } from "./scenes/S07SemileAI";
import { S08FinalReveal, S7_TILE, TILE_SCALE, tileRect } from "./scenes/S08FinalReveal";
import { SoundDesign } from "./sfx";
import { OVERLAP, SCENES, type SceneKey } from "./timeline";
import { C, SHADOW } from "./theme";

/** Scene tetap ter-mount sedikit melewati batasnya agar wipe yang lebih panjang dari overlap tetap punya latar. */
const TAIL = 12;

const seq = (k: SceneKey) => {
  const from = k === "s01" ? 0 : SCENES[k].start - OVERLAP;
  return { from, durationInFrames: SCENES[k].end - from + TAIL };
};

/** Akhir Scene 07: seluruh frame mengecil menjadi satu tile komposisi Scene 08. */
const ShrinkToTile: React.FC<{ startAt: number; children: React.ReactNode }> = ({ startAt, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, startAt, startAt + OVERLAP, E.inOut);
  if (p <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = tileRect(S7_TILE);
  const k = mix(1, TILE_SCALE, p);
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${mix(0, r.x, p)}px, ${mix(0, r.y, p)}px) scale(${k})`,
        borderRadius: (14 * p) / k,
        overflow: "hidden",
        boxShadow: p > 0.05 ? SHADOW.float : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Showreel: React.FC = () => (
  <AbsoluteFill style={{ background: C.warmWhite }}>
    <Sequence name="01 Brand Awakening" {...seq("s01")}>
      <S01BrandAwakening />
    </Sequence>
    <Sequence name="02 Felixiority Tools" {...seq("s02")}>
      <CircleReveal cy={530}>
        <S02Tools />
      </CircleReveal>
    </Sequence>
    <Sequence name="03 Felix Panel" {...seq("s03")}>
      <S03FelixPanel />
    </Sequence>
    <Sequence name="04 User Warehouse" {...seq("s04")}>
      <RectReveal from={S4_FROM}>
        <S04Warehouse />
      </RectReveal>
    </Sequence>
    <Sequence name="05 Telegram Automation" {...seq("s05")}>
      <SlabWipe>
        <S05Telegram />
      </SlabWipe>
    </Sequence>
    <Sequence name="06 Remotion Studio" {...seq("s06")}>
      <S06Studio />
    </Sequence>
    {/* Scene 08 dirender di bawah Scene 07 agar 07 bisa mengecil menjadi tile-nya */}
    <Sequence name="08 Final Reveal" from={SCENES.s08.start - OVERLAP} durationInFrames={SCENES.s08.end - SCENES.s08.start + OVERLAP}>
      <S08FinalReveal />
    </Sequence>
    <Sequence name="07 Semile AI" {...seq("s07")}>
      <ShrinkToTile startAt={SCENES.s07.end - SCENES.s07.start}>
        <CircleReveal cx={S6_RENDER_BTN.x} cy={S6_RENDER_BTN.y} easing={E.inOut}>
          <S07SemileAI />
        </CircleReveal>
      </ShrinkToTile>
    </Sequence>
    <SoundDesign />
  </AbsoluteFill>
);
