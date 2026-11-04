import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
// Lingkungan render ini tidak bisa mengunduh browser Remotion;
// pakai chrome-headless-shell lokal bila tersedia (atau set REMOTION_BROWSER).
const local = process.env.REMOTION_BROWSER ??
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
import fs from 'fs';
if (fs.existsSync(local)) {
  Config.setBrowserExecutable(local);
}
Config.setChromiumOpenGlRenderer('swangle');
