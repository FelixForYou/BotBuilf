import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Font dibundel lokal (public/fonts) supaya render tidak bergantung pada jaringan.
loadFont({ family: "Bricolage Grotesque", url: staticFile("fonts/bricolage.woff2"), weight: "400 800" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/instrument-serif-italic.woff2"), style: "italic", weight: "400" });
loadFont({ family: "JetBrains Mono", url: staticFile("fonts/jetbrains-mono.woff2"), weight: "400 500" });

// Bahasa visual FELIXIORITY: putih tulang, hitam arang, satu biru solid. Sudut tegas, garis tipis.
export const C = {
  bone: "#f2eee6",
  bone2: "#e7e2d7",
  bone3: "#d9d3c6",
  ink: "#161616",
  ink2: "#2c2c2b",
  muted: "#6b675f",
  dark: "#111111",
  dark2: "#1b1b1a",
  blue: "#1f3dff",
  warn: "#c2410c",
  line: "rgba(22,22,22,0.16)",
  lineStrong: "rgba(22,22,22,0.42)",
  lineDark: "rgba(242,238,230,0.16)",
  boneDim: "rgba(242,238,230,0.55)",
};

export const F = {
  sans: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif',
  serif: '"Instrument Serif", "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
};
