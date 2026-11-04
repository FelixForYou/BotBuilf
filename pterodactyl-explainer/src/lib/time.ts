import timeline from "../data/timeline.json";

export const FPS = 60;
export const TOTAL_FRAMES = 18000;

export type SegId = "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07" | "s08" | "s09" | "s10";
type Word = { w: string; t: number; e: number };
type Seg = { id: string; start: number; audioDur: number; speechEnd: number; words: Word[] };

const segs = timeline.segments as Seg[];
const byId = Object.fromEntries(segs.map((s) => [s.id, s])) as Record<SegId, Seg>;
export const segments = segs;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^0-9a-z]/g, "");

export const sec = (s: number) => Math.round(s * FPS);
export const segStart = (id: SegId) => sec(byId[id].start);
export const segSpeechEnd = (id: SegId) => sec(byId[id].speechEnd);

/** Lead time: visuals of a scene begin a bit before its narration. */
export const LEAD = 36;
const order: SegId[] = ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10"];
/** Scene boundaries in absolute frames. Scenes overlap by OVERLAP frames for continuity. */
export const OVERLAP = 0;
export const sceneRange = (id: SegId): { from: number; dur: number } => {
  const i = order.indexOf(id);
  const from = i === 0 ? 0 : segStart(id) - LEAD;
  const to = i === order.length - 1 ? TOTAL_FRAMES : segStart(order[i + 1]) - LEAD + OVERLAP;
  return { from, dur: to - from };
};

/**
 * Absolute frame of a phrase in a segment's real recording.
 * `phrase` is matched word-by-word (case/punctuation-insensitive) against the
 * spoken words; `nth` picks a later occurrence. `edge` "end" returns the end of the last word.
 */
export const cue = (id: SegId, phrase: string, nth = 0, edge: "start" | "end" = "start"): number => {
  const ws = byId[id].words;
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  let found = -1;
  for (let i = 0; i <= ws.length - target.length; i++) {
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (norm(ws[i + j].w) !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      if (nth === 0) {
        found = i;
        break;
      }
      nth--;
    }
  }
  if (found === -1) throw new Error(`cue not found: ${id} "${phrase}"`);
  const w = edge === "start" ? ws[found] : ws[found + target.length - 1];
  return sec(edge === "start" ? w.t : w.e);
};

/** Cue relative to the start of a scene (what useCurrentFrame() returns inside its Sequence). */
export const makeLocal = (id: SegId) => {
  const { from } = sceneRange(id);
  return {
    from,
    c: (phrase: string, nth = 0, edge: "start" | "end" = "start") => cue(id, phrase, nth, edge) - from,
    seg: segStart(id) - from,
    end: segSpeechEnd(id) - from,
    dur: sceneRange(id).dur,
  };
};
