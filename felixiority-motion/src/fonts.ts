import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Semua font dibundel lokal (OFL) — tidak ada request ke layanan eksternal. */
const fonts: Array<{ family: string; file: string; weight: string; style?: string }> = [
  { family: "Geist", file: "Geist-Regular.woff2", weight: "400" },
  { family: "Geist", file: "Geist-Medium.woff2", weight: "500" },
  { family: "Geist", file: "Geist-SemiBold.woff2", weight: "600" },
  { family: "Geist", file: "Geist-Bold.woff2", weight: "700" },
  { family: "Geist Mono", file: "GeistMono-Regular.woff2", weight: "400" },
  { family: "Geist Mono", file: "GeistMono-Medium.woff2", weight: "500" },
  { family: "Inter", file: "inter-latin-400-normal.woff2", weight: "400" },
  { family: "Inter", file: "inter-latin-500-normal.woff2", weight: "500" },
  { family: "Inter", file: "inter-latin-600-normal.woff2", weight: "600" },
  { family: "Instrument Serif", file: "instrument-serif-latin-400-normal.woff2", weight: "400" },
  { family: "Instrument Serif", file: "instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
];

export const fontsReady = Promise.all(
  fonts.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      style: f.style ?? "normal",
      display: "block",
    }),
  ),
);
