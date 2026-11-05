import React from "react";
import { Composition } from "remotion";
import { FelixiorityVideo, VIDEO_DURATION } from "./Video";
import { FPS, K } from "./lib/anim";

export const RemotionRoot: React.FC = () => (
  <Composition id="Felixiority" component={FelixiorityVideo} durationInFrames={VIDEO_DURATION * K} fps={FPS} width={1920} height={1080} />
);
