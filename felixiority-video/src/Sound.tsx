import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {TOTAL} from './lib/timeline';
import {WAREHOUSE_TICKS} from './scenes/S04Warehouse';

type Sfx =
  | 'whoosh-soft'
  | 'camera-sweep'
  | 'swoosh-layered'
  | 'whoosh-in'
  | 'ui-click'
  | 'digital-pop'
  | 'bubble-pop'
  | 'mechanical'
  | 'tick'
  | 'sparkle'
  | 'impact-low'
  | 'outro-chime'
  | 'riser'
  | 'data-blip'
  | 'typing'
  | 'success';

/** [frame global, efek, volume] — setiap cue disinkronkan dengan animasinya. */
const CUES: [number, Sfx, number][] = [
  // 01 Brand Awakening
  [0, 'digital-pop', 0.3],
  [18, 'whoosh-soft', 0.35],
  [28, 'camera-sweep', 0.28],
  [96, 'digital-pop', 0.45],
  [104, 'whoosh-soft', 0.5],
  [120, 'bubble-pop', 0.4],
  [124, 'whoosh-soft', 0.3],
  [150, 'sparkle', 0.4],
  [178, 'camera-sweep', 0.42],
  [206, 'typing', 0.3],
  [238, 'whoosh-soft', 0.35],
  [262, 'whoosh-soft', 0.18],
  [274, 'digital-pop', 0.5],
  [352, 'whoosh-in', 0.65],
  // 02 Tools
  [410, 'swoosh-layered', 0.5],
  [440, 'digital-pop', 0.25],
  [454, 'digital-pop', 0.22],
  [530, 'ui-click', 0.42],
  [595, 'ui-click', 0.42],
  [660, 'ui-click', 0.42],
  [725, 'ui-click', 0.42],
  [729, 'data-blip', 0.25],
  [741, 'data-blip', 0.25],
  [753, 'data-blip', 0.25],
  [782, 'camera-sweep', 0.32],
  [828, 'ui-click', 0.6],
  [836, 'whoosh-soft', 0.5],
  // 03 Felix Panel
  [904, 'whoosh-soft', 0.28],
  [992, 'ui-click', 0.6],
  [1016, 'whoosh-soft', 0.32],
  [1048, 'typing', 0.32],
  [1062, 'typing', 0.28],
  [1094, 'ui-click', 0.6],
  [1116, 'whoosh-soft', 0.28],
  [1124, 'data-blip', 0.28],
  [1168, 'success', 0.5],
  [1208, 'whoosh-soft', 0.28],
  [1228, 'data-blip', 0.22],
  [1246, 'data-blip', 0.22],
  [1252, 'mechanical', 0.5],
  [1264, 'data-blip', 0.22],
  [1284, 'success', 0.3],
  [1300, 'digital-pop', 0.38],
  [1346, 'whoosh-in', 0.6],
  // 04 Warehouse
  [1404, 'camera-sweep', 0.32],
  [1470, 'digital-pop', 0.28],
  ...WAREHOUSE_TICKS.filter((t) => t + 1300 > 1330).map((t) => [t + 1300, 'tick', 0.32] as [number, Sfx, number]),
  // 05 Telegram
  [1840, 'swoosh-layered', 0.62],
  [1880, 'bubble-pop', 0.45],
  [1884, 'data-blip', 0.2],
  [1902, 'data-blip', 0.2],
  [1924, 'bubble-pop', 0.42],
  [1932, 'bubble-pop', 0.35],
  [1970, 'ui-click', 0.55],
  [1988, 'bubble-pop', 0.42],
  [1994, 'bubble-pop', 0.35],
  [2030, 'ui-click', 0.55],
  [2040, 'data-blip', 0.2],
  [2050, 'bubble-pop', 0.42],
  [2058, 'data-blip', 0.2],
  [2076, 'data-blip', 0.2],
  [2102, 'success', 0.48],
  [2108, 'bubble-pop', 0.4],
  [2118, 'digital-pop', 0.42],
  [2156, 'data-blip', 0.2],
  [2176, 'digital-pop', 0.42],
  [2184, 'data-blip', 0.2],
  [2202, 'data-blip', 0.2],
  [2232, 'digital-pop', 0.42],
  [2280, 'whoosh-soft', 0.55],
  // 06 Studio
  [2329, 'camera-sweep', 0.5],
  [2421, 'whoosh-soft', 0.28],
  [2525, 'whoosh-soft', 0.26],
  [2547, 'whoosh-soft', 0.26],
  [2571, 'whoosh-soft', 0.22],
  [2655, 'ui-click', 0.6],
  [2661, 'whoosh-soft', 0.34],
  [2680, 'tick', 0.18],
  [2700, 'tick', 0.18],
  [2720, 'tick', 0.18],
  [2740, 'tick', 0.18],
  [2763, 'success', 0.52],
  // 07 Semile AI
  [2800, 'swoosh-layered', 0.58],
  [2870, 'bubble-pop', 0.42],
  [2874, 'typing', 0.28],
  [2950, 'typing', 0.22],
  [3010, 'typing', 0.18],
  [3100, 'digital-pop', 0.32],
  [3130, 'digital-pop', 0.28],
  [3172, 'whoosh-soft', 0.4],
  // 08 Final
  [3220, 'whoosh-soft', 0.45],
  [3224, 'swoosh-layered', 0.42],
  [3260, 'data-blip', 0.28],
  [3274, 'riser', 0.5],
  [3314, 'whoosh-in', 0.55],
  [3366, 'impact-low', 0.95],
  [3376, 'sparkle', 0.5],
  [3390, 'whoosh-soft', 0.28],
  [3458, 'camera-sweep', 0.28],
  [3470, 'typing', 0.28],
  [3502, 'whoosh-soft', 0.22],
  [3512, 'sparkle', 0.55],
  [3550, 'whoosh-soft', 0.4],
  [3560, 'outro-chime', 0.7],
];

export const SoundTrack: React.FC = () => (
  <>
    {CUES.map(([at, name, vol], i) => {
      const fadeEnd = (f: number) => vol * interpolate(at + f, [TOTAL - 34, TOTAL - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return (
        <Sequence key={i} from={at} durationInFrames={Math.max(1, TOTAL - at)} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={fadeEnd} />
        </Sequence>
      );
    })}
  </>
);
