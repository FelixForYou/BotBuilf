import React from 'react';
import {Img, staticFile} from 'remotion';

// Ukuran asli hasil cutout (scripts/cutout-logo.py)
export const LOGO = {w: 1436, h: 1440, split: 988};

type LayerT = {x?: number; y?: number; s?: number; r?: number; sx?: number; sy?: number; o?: number; blur?: number};

const tf = (t: LayerT) =>
  `translate(${t.x ?? 0}px, ${t.y ?? 0}px) rotate(${t.r ?? 0}deg) scale(${(t.s ?? 1) * (t.sx ?? 1)}, ${(t.s ?? 1) * (t.sy ?? 1)})`;

/**
 * Logo Felixiority asli dengan layer terpisah (karakter & wordmark).
 * `assembled` = 1 → beralih ke gambar utuh (piksel identik saat layer sejajar).
 * Ukuran ditentukan oleh `width`; koordinat layer dalam piksel tampilan.
 */
export const LogoRig: React.FC<{
  width: number;
  character?: LayerT;
  wordmark?: LayerT;
  assembled?: number;
  style?: React.CSSProperties;
}> = ({width, character = {}, wordmark = {}, assembled = 1, style}) => {
  const k = width / LOGO.w;
  const h = LOGO.h * k;
  const splitPx = LOGO.split * k;
  return (
    <div style={{position: 'relative', width, height: h, ...style}}>
      {assembled < 1 ? (
        <>
          <Img
            src={staticFile('brand/felixiority-character.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width,
              height: splitPx,
              transform: tf(character),
              transformOrigin: '50% 85%',
              opacity: character.o ?? 1,
              WebkitMaskImage: 'linear-gradient(to bottom, #000 92%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 92%, transparent 100%)',
              filter: character.blur ? `blur(${character.blur}px)` : undefined,
            }}
          />
          <Img
            src={staticFile('brand/felixiority-wordmark.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: splitPx,
              width,
              height: h - splitPx,
              transform: tf(wordmark),
              transformOrigin: '50% 50%',
              opacity: wordmark.o ?? 1,
              filter: wordmark.blur ? `blur(${wordmark.blur}px)` : undefined,
            }}
          />
        </>
      ) : null}
      {assembled > 0 ? (
        <Img src={staticFile('brand/felixiority-cutout.png')} style={{position: 'absolute', inset: 0, width, height: h, opacity: assembled}} />
      ) : null}
    </div>
  );
};
