import data from '../data/timeline.json';

export type Line = {text: string; subtitle: string; start: number; end: number; file: string};
export type Section = {id: string; title: string; start: number; end: number; lines: Line[]};
export const TL = data as {fps: number; durationInFrames: number; sections: Section[]};

export const section = (id: string) => {
  const s = TL.sections.find((x) => x.id === id);
  if (!s) throw new Error('section ' + id);
  return s;
};

/**
 * Cue lokal (frame relatif terhadap awal section) untuk baris narasi.
 * L(i) = awal baris i; L(i, 'kata') = perkiraan saat kata itu diucapkan
 * (proporsional terhadap posisi karakter dalam baris rekaman).
 */
export const cues = (id: string) => {
  const s = section(id);
  const L = (i: number, word?: string, nth = 0) => {
    const ln = s.lines[i];
    if (!ln) return s.end - s.start;
    const st = ln.start - s.start;
    if (!word) return st;
    const t = ln.text.toLowerCase();
    let idx = -1;
    let from = 0;
    for (let k = 0; k <= nth; k++) {
      idx = t.indexOf(word.toLowerCase(), from);
      from = idx + 1;
    }
    if (idx < 0) return st;
    return Math.round(st + (ln.end - ln.start) * (idx / t.length));
  };
  const LE = (i: number) => {
    const ln = s.lines[i];
    return ln ? ln.end - s.start : s.end - s.start;
  };
  return {L, LE, dur: s.end - s.start, start: s.start};
};
