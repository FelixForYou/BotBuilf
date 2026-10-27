// Render beberapa frame sebagai PNG untuk QA visual: node scripts/stills.mjs 0 120 240 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frames = process.argv.slice(2).map(Number);
const outDir = process.env.STILLS_DIR || 'out/stills';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'FelixiorityShowreel'});
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, scale: Number(process.env.SCALE || 0.5), chromiumOptions: {gl: 'angle'}});
  console.log('✓', output);
}
