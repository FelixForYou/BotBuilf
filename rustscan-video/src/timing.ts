import { Easing, interpolate, spring } from "remotion";
import timeline from "./timeline.json";
import cues from "./cues.json";
import { FPS } from "./theme";

export type SceneId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8";

export const TL = timeline;

export const scene = (id: SceneId) => {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scene ${id}`);
  return s;
};

type Cue = { ref: string; off: number };

/** Local frame (within its scene) of a named beat from cues.json. */
export const beat = (id: SceneId, name: string): number => {
  const sc = scene(id);
  const c = (cues as Record<string, Record<string, Cue>>)[id][name];
  if (!c) throw new Error(`Unknown beat ${id}.${name}`);
  let base = 0;
  if (c.ref === "end") base = sc.dur;
  else if (c.ref.startsWith("p")) base = sc.parts[Number(c.ref.slice(1))].start;
  return Math.round(base + c.off * FPS);
};

/** Local frame of a narration part start, plus seconds offset. */
export const part = (id: SceneId, i: number, offSec = 0) =>
  Math.round(scene(id).parts[i].start + offSec * FPS);

export const sec = (s: number) => Math.round(s * FPS);

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // expo-out
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 progress starting at `start` over `dur` frames. */
export const prog = (f: number, start: number, dur: number, e = ease) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const spr = (f: number, start: number, damping = 14, stiffness = 120) =>
  spring({ frame: f - start, fps: FPS, config: { damping, stiffness, mass: 1 } });

/** Fade/scale out over the last frames of a window. */
export const outro = (f: number, end: number, dur = 18) =>
  1 - prog(f, end - dur, dur, easeInOut);
