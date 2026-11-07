import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts bundled locally (from @fontsource) so rendering needs no network.
for (const w of ["500", "600", "700", "800"]) {
  loadFont({ family: "Inter", url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: w });
}
for (const w of ["400", "500", "700"]) {
  loadFont({ family: "JetBrains Mono", url: staticFile(`fonts/jetbrains-mono-latin-${w}-normal.woff2`), weight: w });
}
loadFont({ family: "Instrument Serif", url: staticFile("fonts/instrument-serif-latin-400-italic.woff2"), style: "italic", weight: "400" });

export const FONT = "'Inter', 'DejaVu Sans', sans-serif";
export const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";
export const SERIF = "'Instrument Serif', serif";

// Light, minimal palette (white + soft pastels, one blue accent)
export const C = {
  bg: "#fbfbfd",
  ink: "#0b0d12",
  text: "#1f2430",
  muted: "#6b7280",
  faint: "#a3abb9",
  line: "#e8ebf2",
  card: "#ffffff",
  blue: "#2f6bff",
  blueSoft: "#e8efff",
  kali: "#367bf0",
  green: "#16a34a",
  greenSoft: "#e7f7ed",
  orange: "#f08c00",
  orangeSoft: "#fff3e0",
  red: "#e5484d",
  redSoft: "#fdecec",
  violet: "#7c5cff",
  violetSoft: "#f0ecff",
  navy: "#070d1f",
};

export const SHADOW = "0 24px 60px rgba(25, 35, 70, 0.08), 0 4px 14px rgba(25, 35, 70, 0.05)";

export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const PAD = 70; // side margin
