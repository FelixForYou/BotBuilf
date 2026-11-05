import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { K } from "./lib/anim";
import { PROJECTS, type Kind } from "./lib/data";
import { PER_PROJECT, START, TR, VIDEO_DURATION } from "./timeline";

/**
 * Musik latar + SFX yang disinkronkan dengan animasi.
 * Semua waktu dalam satuan 30 fps (dikali K saat dipasang).
 */
type Sfx = "whoosh-long" | "whoosh" | "whip" | "riser" | "hit" | "tick" | "key" | "switch" | "mouse-click" | "ding" | "page-turn" | "shutter-modern";
type Cue = { at: number; sfx: Sfx; vol: number };

const cues: Cue[] = [];
const cue = (at: number, sfx: Sfx, vol: number) => cues.push({ at: Math.max(0, Math.round(at)), sfx, vol });

// ---------- Hero (intro mulai di T = 40)
cue(14, "whoosh-long", 0.55); // tirai biru terangkat
cue(48, "hit", 0.55); // huruf FELIXIORITY naik
cue(54, "whoosh", 0.3); // judul per kata
[56, 60, 64].forEach((t) => cue(t, "tick", 0.45)); // tiga node terbuka
[74, 79, 84].forEach((t) => cue(t, "page-turn", 0.18)); // kabel tergambar
[88, 91, 94, 97].forEach((t) => cue(t, "key", 0.35)); // respons API
cue(135, "mouse-click", 0.55); // tombol terisi biru
cue(222, "riser", 0.45); // menuju handoff
cue(250, "whoosh-long", 0.5); // jendela website membesar
cue(281, "hit", 0.6); // teks "Yang sedang dibangun"

// ---------- Project
const artCues: Record<Kind, [number, Sfx, number][]> = {
  api: [...Array.from({ length: 12 }, (_, i) => [30 + i * 3.4, "key", 0.28] as [number, Sfx, number]), [58, "tick", 0.3]],
  chat: [[14, "tick", 0.35], [30, "tick", 0.25], [58, "tick", 0.35], [72, "tick", 0.25]],
  panel: [[66, "mouse-click", 0.5]],
  tools: [[14, "tick", 0.25], [24, "tick", 0.25], [34, "tick", 0.25]],
  warehouse: [[48, "tick", 0.35], [54, "tick", 0.35], [60, "tick", 0.35], [66, "tick", 0.35]],
  bot: [[16, "tick", 0.3], [64, "mouse-click", 0.5], [72, "tick", 0.3]],
  glass: [[56, "switch", 0.35]],
  motion: [[30, "tick", 0.3], [48, "tick", 0.3], [66, "tick", 0.3]],
};
PROJECTS.forEach((p, i) => {
  const s = START.projects + i * PER_PROJECT;
  if (i > 0) cue(s - 12, "whoosh-long", 0.4);
  cue(s + 4, "shutter-modern", 0.12);
  artCues[p.kind].forEach(([t, sfx, vol]) => cue(s + 8 + t, sfx, vol));
});

// ---------- Tirai antar-adegan
[START.about, START.services, START.contact, START.outro].forEach((s) => {
  cue(s, "whoosh-long", 0.55);
  cue(s + TR * 0.45, "hit", 0.4);
  cue(s + TR * 0.6, "whoosh", 0.3);
});

// ---------- Tentang
cue(START.about + TR / 2 + 8, "whoosh", 0.25);
[0, 1, 2, 3].forEach((i) => cue(START.about + 44 + i * 6, "tick", 0.35));

// ---------- Layanan
[0, 1, 2, 3].forEach((i) => cue(START.services + 70 + i * 22, "switch", 0.4));

// ---------- Kontak
cue(START.contact + 80, "mouse-click", 0.55);
cue(START.contact + 94, "ding", 0.3);

// ---------- Outro
cue(START.outro + 10, "hit", 0.75);
cue(START.outro + 40, "ding", 0.4);

export const SoundTrack: React.FC = () => {
  const { fps } = useVideoConfig();
  const total = VIDEO_DURATION * K;
  return (
    <>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) =>
          interpolate(f, [0, fps * 1.5, total - fps * 2.5, total], [0, 0.95, 0.95, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {cues.map((c, i) => (
        <Sequence key={i} name={`sfx ${c.sfx}`} from={c.at * K} layout="none">
          <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.vol} />
        </Sequence>
      ))}
    </>
  );
};
