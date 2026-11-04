import {continueRender, delayRender, staticFile} from 'remotion';

// Inter (SIL OFL 1.1) & JetBrains Mono (SIL OFL 1.1) — dibundel lokal dari @fontsource.
let loaded = false;
export const loadFont = () => {
  if (!loaded && typeof document !== 'undefined') {
    loaded = true;
    const faces: [string, string, number][] = [
      ['Inter', 'fonts/inter-latin-400-normal.woff2', 400],
      ['Inter', 'fonts/inter-latin-500-normal.woff2', 500],
      ['Inter', 'fonts/inter-latin-600-normal.woff2', 600],
      ['Inter', 'fonts/inter-latin-700-normal.woff2', 700],
      ['Inter', 'fonts/inter-latin-800-normal.woff2', 800],
      ['JetBrains Mono', 'fonts/jetbrains-mono-latin-400-normal.woff2', 400],
      ['JetBrains Mono', 'fonts/jetbrains-mono-latin-600-normal.woff2', 600],
    ];
    const handle = delayRender('fonts');
    Promise.all(
      faces.map(([fam, src, w]) => {
        const f = new FontFace(fam, `url(${staticFile(src)}) format('woff2')`, {weight: String(w)});
        return f.load().then((ff) => document.fonts.add(ff));
      }),
    )
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }
  return '"Inter", "Helvetica Neue", Arial, sans-serif';
};
