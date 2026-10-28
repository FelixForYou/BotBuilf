import { AbsoluteFill, Sequence } from "remotion";
import "./fonts";
import { CircleReveal, RectReveal, SlabWipe } from "./components/Transitions";
import { S01BrandAwakening } from "./scenes/S01BrandAwakening";
import { S02Tools } from "./scenes/S02Tools";
import { S03FelixPanel } from "./scenes/S03FelixPanel";
import { S04Warehouse, S4_FROM } from "./scenes/S04Warehouse";
import { S05Telegram } from "./scenes/S05Telegram";
import { S06Studio } from "./scenes/S06Studio";
import { OVERLAP, SCENES, type SceneKey } from "./timeline";
import { C } from "./theme";

/** Scene tetap ter-mount sedikit melewati batasnya agar wipe yang lebih panjang dari overlap tetap punya latar. */
const TAIL = 12;

const seq = (k: SceneKey) => {
  const from = k === "s01" ? 0 : SCENES[k].start - OVERLAP;
  return { from, durationInFrames: SCENES[k].end - from + TAIL };
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
  </AbsoluteFill>
);
