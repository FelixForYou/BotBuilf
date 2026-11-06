import vo from './vo-durations.json';
import script from './script.json';

export const FPS = 60;
export type SceneId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6';

// lead-in before narration starts, tail after it ends (seconds)
const PAD: Record<SceneId, [number, number]> = {
  s1: [1.6, 0.5],
  s2: [0.45, 0.45],
  s3: [0.45, 0.7],
  s4: [0.4, 0.45],
  s5: [0.4, 0.5],
  s6: [0.4, 3.2],
};

const ids: SceneId[] = ['s1', 's2', 's3', 's4', 's5', 's6'];

export const SCENES = (() => {
  let from = 0;
  return ids.map((id) => {
    const lead = Math.round(PAD[id][0] * FPS);
    const voFrames = Math.ceil((vo as Record<string, number>)[id] * FPS);
    const duration = lead + voFrames + Math.round(PAD[id][1] * FPS);
    const s = {id, from, duration, lead, voFrames};
    from += duration;
    return s;
  });
})();

export const TOTAL = SCENES.reduce((a, s) => a + s.duration, 0);
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

/**
 * Approximate the frame (relative to scene start) at which a phrase is spoken,
 * by its character position in the narration text. Keeps visuals in sync
 * with the voice-over without manual timing.
 */
export const cue = (id: SceneId, phrase: string, offset = 0) => {
  const s = scene(id);
  const text = (script as {id: string; text: string}[]).find((x) => x.id === id)!.text;
  const idx = text.indexOf(phrase);
  if (idx < 0) throw new Error(`cue: "${phrase}" not found in ${id}`);
  return Math.round(s.lead + (idx / text.length) * s.voFrames + offset);
};
