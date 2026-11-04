import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile} from 'remotion';
import {IconCss} from './components/graphics';
import {section} from './lib/timeline';
import {S1} from './scenes/S1';
import {S2} from './scenes/S2';
import {S3} from './scenes/S3';
import {S4} from './scenes/S4';
import {S5} from './scenes/S5';
import {S6} from './scenes/S6';
import {S7} from './scenes/S7';
import {S8} from './scenes/S8';
import {S9} from './scenes/S9';
import {S10} from './scenes/S10';

const SCENES: [string, React.FC][] = [
  ['s1', S1], ['s2', S2], ['s3', S3], ['s4', S4], ['s5', S5],
  ['s6', S6], ['s7', S7], ['s8', S8], ['s9', S9], ['s10', S10],
];

export const Explainer: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <IconCss />
    {SCENES.map(([id, Comp]) => {
      const s = section(id);
      return (
        <Sequence key={id} from={s.start} durationInFrames={s.end - s.start} name={`${id} · ${s.title}`}>
          <Comp />
        </Sequence>
      );
    })}
    <Html5Audio src={staticFile('audio/narration.wav')} volume={1} />
  </AbsoluteFill>
);
