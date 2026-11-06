import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
// Chromium that ships with this environment
Config.setBrowserExecutable(process.env.REMOTION_CHROME ?? null);
