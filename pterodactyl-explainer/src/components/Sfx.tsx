import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';

/**
 * SFX tunggal pada frame lokal `at`. Volume dijaga rendah agar narasi tetap jelas.
 * Nama file mengacu ke public/audio/sfx/<s>.wav (dibuat oleh scripts/make_sfx.py).
 */
export const Sfx: React.FC<{at: number; s: string; v?: number; dur?: number}> = ({at, s, v = 0.25, dur = 150}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={dur} layout="none" name={`sfx:${s}`}>
    <Html5Audio src={staticFile(`audio/sfx/${s}.wav`)} volume={v} />
  </Sequence>
);
