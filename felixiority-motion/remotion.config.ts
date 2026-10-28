import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
// Komposisi CSS 3D + blur cukup berat; batasi agar render stabil di mesin 4 core.
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 4));
// Opsional: pakai Chrome/Chromium yang sudah terpasang (mis. di CI / sandbox).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
