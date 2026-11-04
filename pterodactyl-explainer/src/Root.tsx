import React from 'react';
import {Composition} from 'remotion';
import {Explainer} from './Explainer';
import {TL} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Explainer" component={Explainer} durationInFrames={TL.durationInFrames} fps={TL.fps} width={1920} height={1080} />
  </>
);
