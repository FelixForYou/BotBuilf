// Render beberapa frame sekaligus (QA cepat): node scripts/stills.mjs out/qa 10 200 400
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "FelixiorityShowreel", puppeteerInstance: browser, browserExecutable });
await Promise.all(
  frames.map(async (fr) => {
    await renderStill({
      composition, serveUrl, frame: Number(fr), output: path.join(outDir, `f${String(fr).padStart(4, "0")}.png`),
      puppeteerInstance: browser, browserExecutable, scale: Number(process.env.SCALE ?? 0.5),
    });
  }),
);
await browser.close({ silent: true });
console.log("ok", frames.length);
