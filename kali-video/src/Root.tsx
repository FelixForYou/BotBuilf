import { Composition } from "remotion";
import { KaliVideo } from "./Video";
import { FPS, H, W } from "./theme";
import { TL } from "./timing";

export const RemotionRoot: React.FC = () => (
  <Composition id="KaliLinuxVideo" component={KaliVideo} durationInFrames={TL.total} fps={FPS} width={W} height={H} />
);
