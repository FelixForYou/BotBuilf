import { continueRender, delayRender, staticFile } from "remotion";

const faces: [string, string, string][] = [
  ["Inter", "400", "fonts/inter-latin-400-normal.woff2"],
  ["Inter", "500", "fonts/inter-latin-500-normal.woff2"],
  ["Inter", "600", "fonts/inter-latin-600-normal.woff2"],
  ["Inter", "700", "fonts/inter-latin-700-normal.woff2"],
  ["JetBrains Mono", "400", "fonts/jetbrains-mono-latin-400-normal.woff2"],
  ["JetBrains Mono", "500", "fonts/jetbrains-mono-latin-500-normal.woff2"],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, weight, file]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
      return f.load().then((ff) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
