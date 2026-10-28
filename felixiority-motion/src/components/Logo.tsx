import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";

/** Ukuran asli kanvas stiker hasil cutout (scripts/cutout_logo.py). */
export const LOGO_W = 1434;
export const LOGO_H = 1438;

export const LOGO_SRC = {
  sticker: staticFile("logo/felixiority-sticker.png"),
  character: staticFile("logo/felixiority-character.png"),
  wordmark: staticFile("logo/felixiority-wordmark.png"),
};

export type LayerT = { x?: number; y?: number; s?: number; r?: number; sx?: number; sy?: number; o?: number };

const tf = (t: LayerT = {}) =>
  `translate(${t.x ?? 0}px, ${t.y ?? 0}px) rotate(${t.r ?? 0}deg) scale(${(t.s ?? 1) * (t.sx ?? 1)}, ${(t.s ?? 1) * (t.sy ?? 1)})`;

/**
 * Logo Felixiority sebagai dua layer (karakter + wordmark) yang bisa digerakkan
 * terpisah untuk parallax / layer separation. Posisi 0 = susunan asli.
 */
export const FelixLogo: React.FC<{
  width: number;
  character?: LayerT;
  wordmark?: LayerT;
  /** posisi kilau spotlight -1..2 (di luar 0..1 = tidak terlihat) */
  sheen?: number;
  /** 0..1 kekuatan bayangan kontak di bawah logo */
  shadow?: number;
  /** jarak "lantai" untuk bayangan (px pada skala width) */
  lift?: number;
  style?: React.CSSProperties;
}> = ({ width, character, wordmark, sheen = -1, shadow = 0.6, lift = 0, style }) => {
  const k = width / LOGO_W;
  const h = LOGO_H * k;
  const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width,
    height: h,
    transformOrigin: "50% 70%",
  };
  return (
    <div style={{ position: "relative", width, height: h, ...style }}>
      {/* contact shadow — mengecil & memudar saat logo terangkat */}
      <div
        style={{
          position: "absolute",
          left: width * 0.14,
          right: width * 0.14,
          top: h * 0.9,
          height: h * 0.1,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(38,37,34,0.38), rgba(38,37,34,0))",
          opacity: shadow / (1 + lift * 0.01),
          transform: `scale(${1 / (1 + lift * 0.004)})`,
          filter: `blur(${6 + lift * 0.05}px)`,
        }}
      />
      <div style={{ ...layer, transform: tf(character), opacity: character?.o ?? 1 }}>
        <Img src={LOGO_SRC.character} style={{ width, height: h, display: "block" }} />
      </div>
      <div style={{ ...layer, transform: tf(wordmark), opacity: wordmark?.o ?? 1, transformOrigin: "50% 80%" }}>
        <Img src={LOGO_SRC.wordmark} style={{ width, height: h, display: "block" }} />
        {sheen > -0.5 && sheen < 1.5 ? <Sheen width={width} height={h} pos={sheen} src={LOGO_SRC.wordmark} /> : null}
      </div>
      {sheen > -0.5 && sheen < 1.5 ? (
        <div style={{ ...layer, transform: tf(character) }}>
          <Sheen width={width} height={h} pos={sheen - 0.15} src={LOGO_SRC.character} />
        </div>
      ) : null}
    </div>
  );
};

/** Kilau spotlight yang dibatasi bentuk stiker (CSS mask). */
const Sheen: React.FC<{ width: number; height: number; pos: number; src: string }> = ({ width, height, pos, src }) => {
  const x = -60 + pos * 220;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "100% 100%",
        maskImage: `url(${src})`,
        maskSize: "100% 100%",
        background: `linear-gradient(105deg, rgba(255,255,255,0) ${x - 18}%, rgba(255,255,255,0.65) ${x}%, rgba(255,255,255,0) ${x + 18}%)`,
        mixBlendMode: "soft-light",
      }}
    />
  );
};

/** Still pratinjau untuk memeriksa hasil layer separation. */
export const LogoLayersStill: React.FC = () => (
  <AbsoluteFill style={{ background: C.warmWhite, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
    <FelixLogo width={560} />
    <FelixLogo width={560} character={{ y: -80, r: -4 }} wordmark={{ y: 60 }} sheen={0.5} />
  </AbsoluteFill>
);
