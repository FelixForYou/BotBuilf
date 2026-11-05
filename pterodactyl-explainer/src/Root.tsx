import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, TOTAL_FRAMES } from "./lib/time";
import { ShortVideo } from "./short/ShortVideo";
import { SHORT_FRAMES } from "./short/time";

export const Root: React.FC = () => (
  <>
  <Composition id="PterodactylExplainer" component={Video} defaultProps={{ narration: true }} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
  <Composition id="PterodactylShort" component={ShortVideo} durationInFrames={SHORT_FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
