import { Audio, Sequence, staticFile } from "remotion";
import { VIDEO } from "./timeline";

type Sfx =
  | "whoosh-soft"
  | "whoosh-fast"
  | "swoosh-layered"
  | "camera-sweep"
  | "ui-click"
  | "digital-pop"
  | "soft-tick"
  | "mech-move"
  | "sparkle"
  | "impact-low"
  | "notif"
  | "riser"
  | "outro-chime";

/** [frame global, suara, volume] — disinkronkan dengan animasi tiap scene. */
const CUES: Array<[number, Sfx, number]> = [
  // 01 Brand Awakening
  [0, "digital-pop", 0.45],
  [30, "whoosh-soft", 0.45],
  [96, "camera-sweep", 0.4],
  [138, "swoosh-layered", 0.55],
  [176, "digital-pop", 0.55],
  [186, "sparkle", 0.45],
  [238, "whoosh-fast", 0.3],
  [270, "soft-tick", 0.4],
  [288, "soft-tick", 0.4],
  [340, "riser", 0.45],
  [390, "swoosh-layered", 0.65],
  // 02 Felixiority Tools
  [420, "mech-move", 0.45],
  [452, "digital-pop", 0.25],
  [462, "digital-pop", 0.25],
  [472, "digital-pop", 0.25],
  [570, "ui-click", 0.5],
  [612, "ui-click", 0.5],
  [654, "ui-click", 0.5],
  [696, "ui-click", 0.5],
  [800, "camera-sweep", 0.5],
  [866, "whoosh-soft", 0.5],
  // 03 Felix Panel
  [940, "digital-pop", 0.4],
  [1002, "ui-click", 0.65],
  [1046, "whoosh-fast", 0.3],
  [1092, "ui-click", 0.65],
  [1129, "whoosh-fast", 0.3],
  [1196, "notif", 0.45],
  [1214, "whoosh-fast", 0.3],
  [1250, "mech-move", 0.55],
  [1290, "riser", 0.4],
  [1346, "swoosh-layered", 0.6],
  // 04 3D User Warehouse
  [1372, "camera-sweep", 0.45],
  [1384, "mech-move", 0.45],
  ...[1440, 1468, 1494, 1522, 1548, 1580, 1606, 1640, 1672, 1704].map((fr) => [fr, "soft-tick", 0.22] as [number, Sfx, number]),
  [1610, "digital-pop", 0.45],
  [1826, "whoosh-fast", 0.7],
  [1832, "swoosh-layered", 0.45],
  // 05 Telegram Automation
  [1884, "digital-pop", 0.35],
  [1904, "digital-pop", 0.35],
  [1952, "ui-click", 0.65],
  [1972, "digital-pop", 0.35],
  [2010, "ui-click", 0.65],
  [2040, "digital-pop", 0.35],
  [2110, "notif", 0.45],
  [2116, "ui-click", 0.65],
  [2128, "digital-pop", 0.35],
  [2142, "digital-pop", 0.35],
  [2178, "notif", 0.4],
  [2220, "notif", 0.35],
  [2286, "whoosh-fast", 0.6],
  [2306, "swoosh-layered", 0.55],
  // 06 Remotion Studio
  [2332, "camera-sweep", 0.45],
  [2410, "whoosh-soft", 0.45],
  [2470, "soft-tick", 0.35],
  [2498, "soft-tick", 0.35],
  [2522, "soft-tick", 0.35],
  [2540, "soft-tick", 0.35],
  [2636, "ui-click", 0.65],
  [2642, "riser", 0.45],
  [2734, "digital-pop", 0.55],
  [2736, "sparkle", 0.35],
  [2788, "swoosh-layered", 0.6],
  // 07 Semile AI
  [2830, "whoosh-soft", 0.35],
  [2890, "digital-pop", 0.4],
  [2942, "soft-tick", 0.3],
  ...Array.from({ length: 16 }).map((_, i) => [2956 + i * 12, "soft-tick", 0.13] as [number, Sfx, number]),
  [3154, "digital-pop", 0.35],
  [3204, "camera-sweep", 0.55],
  // 08 Final Brand Reveal
  [3238, "mech-move", 0.4],
  [3288, "riser", 0.55],
  [3316, "whoosh-fast", 0.7],
  [3324, "impact-low", 0.9],
  [3360, "sparkle", 0.5],
  [3352, "soft-tick", 0.35],
  [3368, "soft-tick", 0.35],
  [3438, "whoosh-soft", 0.3],
  [3442, "sparkle", 0.4],
  [3520, "outro-chime", 0.7],
  [3548, "sparkle", 0.3],
];

const FADE_TAIL = 45;

export const SoundDesign: React.FC = () => (
  <>
    {CUES.map(([from, name, vol], i) => (
      <Sequence key={i} from={from} name={`sfx ${name}`} layout="none">
        <Audio
          src={staticFile(`sfx/${name}.wav`)}
          // fade-out global di detik terakhir agar ekor suara tidak terpotong kasar
          volume={(f) => vol * Math.min(1, Math.max(0, (VIDEO.durationInFrames - (from + f)) / FADE_TAIL))}
        />
      </Sequence>
    ))}
  </>
);
