import React from 'react';
import {Composition} from 'remotion';
import {Showreel} from './Showreel';
import {FPS, H, W} from './lib/theme';
import {TOTAL} from './lib/timeline';
import './components/Fonts';

export const RemotionRoot: React.FC = () => (
  <Composition id="FelixiorityShowreel" component={Showreel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
