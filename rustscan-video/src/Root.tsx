import { Composition } from "remotion";
import { RustScanVideo } from "./Video";
import { FPS, H, W } from "./theme";
import { TL } from "./timing";

export const RemotionRoot: React.FC = () => (
  <Composition id="RustScanVideo" component={RustScanVideo} durationInFrames={TL.total} fps={FPS} width={W} height={H} />
);
