import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {audio} from './config';
import './fonts';
import {Background} from './components/Background';
import {DASH_CONSOLE_AT} from './components/Dashboard';
import {TYPE_START, typeEnd} from './components/Terminal';
import {Scene1Intro} from './scenes/Scene1Intro';
import {DASH_T0, Scene2Service} from './scenes/Scene2Service';
import {CARD_FIRST, CARD_STEP, MORPH, Scene3Packages} from './scenes/Scene3Packages';
import {CLICKS, CONSOLE_AT, EXIT, Scene4Flow} from './scenes/Scene4Flow';
import {Scene5CTA} from './scenes/Scene5CTA';

type Sfx = {at: number; file: 'click' | 'type' | 'whoosh'; volume: number; rate?: number};

// Efek suara secukupnya, semuanya disinkronkan ke jadwal animasi.
const sfx: Sfx[] = [
	// ketikan terminal
	...Array.from({length: Math.floor((typeEnd() - TYPE_START) / 3)}, (_, i) => ({
		at: TYPE_START + i * 3,
		file: 'type' as const,
		volume: 0.5,
		rate: 0.9 + ((i * 7) % 5) * 0.06,
	})),
	// transisi
	{at: 118, file: 'whoosh', volume: 0.35},
	{at: 196, file: 'whoosh', volume: 0.8},
	{at: 560, file: 'whoosh', volume: 0.9, rate: 0.9},
	{at: CARD_FIRST + CARD_STEP - 6, file: 'whoosh', volume: 0.4, rate: 1.2},
	{at: CARD_FIRST + 2 * CARD_STEP - 6, file: 'whoosh', volume: 0.4, rate: 1.2},
	{at: MORPH[0] - 4, file: 'whoosh', volume: 0.3, rate: 1.4},
	{at: EXIT[0] - 2, file: 'whoosh', volume: 0.8},
	// konsol dashboard & konsol server
	...DASH_CONSOLE_AT.flatMap((t, i) => [0, 6].map((d) => ({at: DASH_T0 + t + d, file: 'type' as const, volume: 0.3, rate: 1 + i * 0.05}))),
	...CONSOLE_AT.flatMap((t, i) => [0, 6].map((d) => ({at: t + d, file: 'type' as const, volume: 0.35, rate: 1 + i * 0.05}))),
	// klik kursor
	...CLICKS.map((at) => ({at, file: 'click' as const, volume: 0.9})),
];

export const Promo: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: '#050a1f'}}>
			<Background />
			<Scene1Intro />
			<Scene2Service />
			<Scene3Packages />
			<Scene4Flow />
			<Scene5CTA />

			<Audio src={staticFile(audio.music)} volume={audio.musicVolume} />
			{sfx.map((s, i) => (
				<Sequence key={i} from={Math.round(s.at)} durationInFrames={60} layout="none">
					<Audio src={staticFile(`audio/${s.file}.wav`)} volume={s.volume * audio.sfxVolume} playbackRate={s.rate ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
