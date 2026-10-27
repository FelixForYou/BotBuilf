import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C} from './lib/theme';
import {SCENES} from './lib/timeline';
import {EditorialHud, Grain} from './components/Chrome';
import {SoundTrack} from './Sound';
import {S01Awakening} from './scenes/S01Awakening';
import {S02Tools} from './scenes/S02Tools';
import {S03Panel} from './scenes/S03Panel';
import {S04Warehouse} from './scenes/S04Warehouse';
import {S05Telegram} from './scenes/S05Telegram';
import {S06Studio} from './scenes/S06Studio';
import {S07SemileAI} from './scenes/S07SemileAI';
import {S08Final} from './scenes/S08Final';

export const Showreel: React.FC = () => (
  <AbsoluteFill style={{background: C.warm}}>
    <Sequence from={SCENES.awakening.from} durationInFrames={SCENES.awakening.dur} name="01 Brand Awakening">
      <S01Awakening />
    </Sequence>
    <Sequence from={SCENES.tools.from} durationInFrames={SCENES.tools.dur} name="02 Felixiority Tools">
      <S02Tools />
    </Sequence>
    <Sequence from={SCENES.panel.from} durationInFrames={SCENES.panel.dur} name="03 Felix Panel">
      <S03Panel />
    </Sequence>
    <Sequence from={SCENES.warehouse.from} durationInFrames={SCENES.warehouse.dur} name="04 User Warehouse">
      <S04Warehouse />
    </Sequence>
    <Sequence from={SCENES.telegram.from} durationInFrames={SCENES.telegram.dur} name="05 Telegram Automation">
      <S05Telegram />
    </Sequence>
    <Sequence from={SCENES.studio.from} durationInFrames={SCENES.studio.dur} name="06 Remotion Studio">
      <S06Studio />
    </Sequence>
    <Sequence from={SCENES.ai.from} durationInFrames={SCENES.ai.dur} name="07 Semile AI">
      <S07SemileAI />
    </Sequence>
    <Sequence from={SCENES.final.from} durationInFrames={SCENES.final.dur} name="08 Final Brand Reveal">
      <S08Final />
    </Sequence>
    <EditorialHud />
    <Grain />
    <SoundTrack />
  </AbsoluteFill>
);
