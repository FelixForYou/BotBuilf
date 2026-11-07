import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (from @fontsource) so rendering needs no network.
for (const w of ["400", "500", "700"]) {
  loadFont({ family: "Space Grotesk", url: staticFile(`fonts/space-grotesk-latin-${w}-normal.woff2`), weight: w });
  loadFont({ family: "JetBrains Mono", url: staticFile(`fonts/jetbrains-mono-latin-${w}-normal.woff2`), weight: w });
}

export const FONT = "'Space Grotesk', 'DejaVu Sans', sans-serif";
// Box-drawing glyphs fall back to DejaVu Sans Mono, the ㉿ glyph to WenQuanYi.
export const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', 'WenQuanYi Zen Hei', monospace";

export const C = {
  bg: "#03060f",
  bg2: "#070d16",
  panel: "rgba(10, 20, 34, 0.82)",
  panelSolid: "#0a1422",
  line: "rgba(80, 200, 255, 0.18)",
  lineStrong: "rgba(80, 220, 255, 0.45)",
  cyan: "#22d3ee",
  blue: "#3b82f6",
  kali: "#367bf0",
  kaliDeep: "#1a3d82",
  navy: "#060b18",
  green: "#34d399",
  lime: "#a3e635",
  yellow: "#facc15",
  orange: "#f97316",
  red: "#f43f5e",
  text: "#e6f1ff",
  muted: "#8aa0bb",
  dim: "#4b5d75",
};

export const FPS = 60;
export const W = 1920;
export const H = 1080;
