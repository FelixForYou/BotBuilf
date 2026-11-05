import React from "react";
import { Composition } from "remotion";
import { FelixiorityVideo, VIDEO_DURATION } from "./Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="Felixiority" component={FelixiorityVideo} durationInFrames={VIDEO_DURATION} fps={30} width={1920} height={1080} />
);
