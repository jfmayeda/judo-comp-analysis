import { Composition } from "remotion";
import { Film } from "./Film";
import TL from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LaunchFilm"
      component={Film}
      durationInFrames={TL.duration * TL.fps}
      fps={TL.fps}
      width={1920}
      height={1080}
    />
  );
};
