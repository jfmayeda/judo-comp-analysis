import { Composition } from "remotion";
import { Film } from "./Film";

export const RemotionRoot = () => (
  <Composition
    id="Launch"
    component={Film}
    durationInFrames={32 * 30}
    fps={30}
    width={1920}
    height={1080}
  />
);
