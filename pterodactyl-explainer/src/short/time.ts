import timeline from "../data/timeline_short.json";

/** Timing for the vertical short cut (same idea as lib/time.ts, separate recording). */
export const FPS = 60;
export type PId = "p1" | "p2" | "p3" | "p4" | "p5" | "p6";
type Word = { w: string; t: number; e: number };
type Seg = { id: string; start: number; audioDur: number; speechEnd: number; words: Word[] };
const segs = timeline.segments as Seg[];
const byId = Object.fromEntries(segs.map((s) => [s.id, s])) as Record<PId, Seg>;
export const shortSegments = segs;
export const SHORT_FRAMES = Math.round(timeline.total * FPS);

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^0-9a-z]/g, "");
const sec = (s: number) => Math.round(s * FPS);
export const pStart = (id: PId) => sec(byId[id].start);
const order: PId[] = ["p1", "p2", "p3", "p4", "p5", "p6"];
export const LEAD = 24;
export const pRange = (id: PId) => {
  const i = order.indexOf(id);
  const from = i === 0 ? 0 : pStart(id) - LEAD;
  const to = i === order.length - 1 ? SHORT_FRAMES : pStart(order[i + 1]) - LEAD;
  return { from, dur: to - from };
};
export const pcue = (id: PId, phrase: string, nth = 0, edge: "start" | "end" = "start") => {
  const ws = byId[id].words;
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  for (let i = 0; i <= ws.length - target.length; i++) {
    if (target.every((t, j) => norm(ws[i + j].w) === t)) {
      if (nth-- > 0) continue;
      const w = edge === "start" ? ws[i] : ws[i + target.length - 1];
      return sec(edge === "start" ? w.t : w.e);
    }
  }
  throw new Error(`short cue not found: ${id} "${phrase}"`);
};
export const localP = (id: PId) => {
  const { from, dur } = pRange(id);
  return { from, dur, c: (phrase: string, nth = 0, edge: "start" | "end" = "start") => pcue(id, phrase, nth, edge) - from, end: sec(byId[id].speechEnd) - from };
};
