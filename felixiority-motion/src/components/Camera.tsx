import React from "react";
import { AbsoluteFill } from "remotion";

export type CamT = {
  x?: number;
  y?: number;
  z?: number;
  s?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** titik pivot kamera (px pada kanvas 1920×1080) */
  ox?: number;
  oy?: number;
};

/**
 * Kamera 2.5D: memindahkan "dunia" berlawanan arah gerak kamera.
 * Semua anak dengan transform-style preserve-3d ikut mendapat depth/parallax.
 */
export const Camera: React.FC<CamT & { perspective?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x = 0,
  y = 0,
  z = 0,
  s = 1,
  rx = 0,
  ry = 0,
  rz = 0,
  ox = 960,
  oy = 540,
  perspective = 1800,
  children,
  style,
}) => (
  <AbsoluteFill style={{ perspective, perspectiveOrigin: `${ox}px ${oy}px`, overflow: "hidden", ...style }}>
    <AbsoluteFill
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: `${ox}px ${oy}px`,
        transform: `translate3d(${-x}px, ${-y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Layer dengan kedalaman: z positif = lebih dekat ke kamera (parallax lebih kuat). */
export const Layer: React.FC<{ z?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ z = 0, children, style }) => (
  <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translateZ(${z}px)`, ...style }}>{children}</AbsoluteFill>
);
