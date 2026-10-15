// Render beberapa frame sebagai PNG untuk pemeriksaan visual cepat.
// Pakai: node scripts/stills.mjs [frame1 frame2 ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const list = frames.length ? frames : [30, 110, 160, 215, 300, 420, 590, 680, 820, 960, 1010, 1100, 1200, 1350, 1420, 1500, 1700];
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'FelixiorityPromo', browserExecutable});
mkdirSync('out/stills', {recursive: true});
for (const frame of list) {
	await renderStill({composition, serveUrl, frame, output: `out/stills/f${String(frame).padStart(4, '0')}.png`, browserExecutable, chromiumOptions: {gl: 'angle'}});
	console.log('frame', frame);
}
