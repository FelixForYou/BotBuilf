import { Composition, Still } from "remotion";
import { Showreel } from "./Showreel";
import { VIDEO } from "./timeline";
import { LogoLayersStill } from "./components/Logo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FelixiorityShowreel"
        component={Showreel}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Still id="LogoLayers" component={LogoLayersStill} width={1920} height={1080} />
    </>
  );
};
