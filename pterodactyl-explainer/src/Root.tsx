import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, TOTAL_FRAMES } from "./lib/time";

export const Root: React.FC = () => (
  <Composition id="PterodactylExplainer" component={Video} defaultProps={{ narration: true }} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
