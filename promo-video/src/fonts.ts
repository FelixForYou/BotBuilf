import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {fonts} from './config';

// Font disimpan lokal di public/fonts (SIL OFL) agar render tidak bergantung internet.
const faces: Array<[string, string, string]> = [
	[fonts.display, 'plus-jakarta-sans-latin-500-normal.woff2', '500'],
	[fonts.display, 'plus-jakarta-sans-latin-700-normal.woff2', '700'],
	[fonts.display, 'plus-jakarta-sans-latin-800-normal.woff2', '800'],
	[fonts.mono, 'jetbrains-mono-latin-400-normal.woff2', '400'],
	[fonts.mono, 'jetbrains-mono-latin-700-normal.woff2', '700'],
];

export const fontsReady = Promise.all(
	faces.map(([family, file, weight]) =>
		loadFont({family, url: staticFile(`fonts/${file}`), weight, format: 'woff2'}),
	),
);
