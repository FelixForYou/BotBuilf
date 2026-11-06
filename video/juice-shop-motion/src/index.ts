import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Video} from './Video';
import {FPS, TOTAL} from './timeline';

const Root: React.FC = () =>
  React.createElement(Composition, {
    id: 'JuiceShop',
    component: Video,
    durationInFrames: TOTAL,
    fps: FPS,
    width: 1920,
    height: 1080,
  });

registerRoot(Root);
