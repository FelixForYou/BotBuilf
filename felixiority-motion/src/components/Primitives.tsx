import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, SHADOW } from "../theme";

/** Bintang empat sudut — diambil dari bahasa visual kilauan logo asli. */
export const Sparkle: React.FC<{ size: number; color?: string; style?: React.CSSProperties; core?: boolean }> = ({
  size,
  color = C.gold,
  style,
  core = true,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", ...style }}>
    <path
      d="M0,-50 C4,-14 14,-4 50,0 C14,4 4,14 0,50 C-4,14 -14,4 -50,0 C-14,-4 -4,-14 0,-50 Z"
      fill={color}
      stroke={C.felixDeep}
      strokeWidth={core ? 5 : 0}
      strokeLinejoin="round"
    />
    {core ? <path d="M0,-26 C2,-7 7,-2 26,0 C7,2 2,7 0,26 C-2,7 -7,2 -26,0 C-7,-2 -2,-7 0,-26 Z" fill="#FFF7D1" opacity={0.85} /> : null}
  </svg>
);

/** Latar warm white dengan grid titik halus + vignette lembut. */
export const Backdrop: React.FC<{ dots?: number; offsetX?: number; offsetY?: number; color?: string; scale?: number }> = ({
  dots = 0.5,
  offsetX = 0,
  offsetY = 0,
  color = C.warmWhite,
  scale = 1,
}) => (
  <AbsoluteFill style={{ background: color }}>
    {dots > 0 ? (
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line} 1.4px, transparent 1.6px)`,
          backgroundSize: `${36 * scale}px ${36 * scale}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          opacity: dots,
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)",
        }}
      />
    ) : null}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 45%, rgba(255,255,255,0.7), rgba(255,255,255,0) 60%)" }} />
  </AbsoluteFill>
);

export const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; radius?: number; float?: boolean }> = ({
  style,
  children,
  radius = 22,
  float,
}) => (
  <div
    style={{
      background: C.white,
      borderRadius: radius,
      boxShadow: float ? SHADOW.float : SHADOW.card,
      border: `1px solid ${C.line}`,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties }> = ({
  children,
  color = C.charcoalSoft,
  bg = C.softGray,
  style,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: F.ui,
      fontSize: 15,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Dot: React.FC<{ color?: string; size?: number; pulse?: number }> = ({ color = C.green, size = 9, pulse = 0 }) => (
  <span style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    <span
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        transform: `scale(${1 + pulse * 1.6})`,
        opacity: 1 - pulse,
      }}
    />
  </span>
);

type IconName =
  | "server"
  | "pulse"
  | "users"
  | "broom"
  | "cart"
  | "card"
  | "check"
  | "bolt"
  | "send"
  | "bell"
  | "box"
  | "play"
  | "cpu"
  | "spark"
  | "grid"
  | "arrow";

const paths: Record<IconName, React.ReactNode> = {
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
    </>
  ),
  broom: (
    <>
      <path d="M14 4l-4.5 8" />
      <path d="M6 12h7l2 8H4z" />
      <path d="M8 16v4M11 16v4" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2.2 11h10.6L21 7.5H7" />
      <circle cx="9" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bolt: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  send: <path d="M21 3L3 10.5l7 2.5 2.5 7zM10 13l11-10" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  box: (
    <>
      <path d="M12 2.8l8.5 4.7v9L12 21.2l-8.5-4.7v-9z" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9.2" />
    </>
  ),
  play: <path d="M7 4.5v15l12.5-7.5z" />,
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9.5 9.5h5v5h-5zM9 2.5v3M15 2.5v3M9 18.5v3M15 18.5v3M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" />
    </>
  ),
  spark: <path d="M12 2.5c.8 5 4.5 8.7 9.5 9.5-5 .8-8.7 4.5-9.5 9.5-.8-5-4.5-8.7-9.5-9.5 5-.8 8.7-4.5 9.5-9.5z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; stroke?: number; style?: React.CSSProperties }> = ({
  name,
  size = 24,
  color = C.charcoal,
  stroke = 1.8,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {paths[name]}
  </svg>
);

export const IconTile: React.FC<{ name: IconName; size?: number; bg?: string; color?: string }> = ({
  name,
  size = 52,
  bg = C.terracottaSoft,
  color = C.terracottaDeep,
}) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
    <Icon name={name} size={size * 0.5} color={color} />
  </div>
);

/** Kursor pointer untuk interaksi UI (klik dengan efek tekan). */
export const Cursor: React.FC<{ x: number; y: number; press?: number; style?: React.CSSProperties }> = ({ x, y, press = 0, style }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - press * 0.14})`, transformOrigin: "4px 4px", ...style }}>
    <svg width={34} height={40} viewBox="0 0 34 40" style={{ filter: "drop-shadow(0 6px 8px rgba(38,37,34,0.25))" }}>
      <path d="M3 3l26 14-11.5 3.2L12 33z" fill={C.charcoal} stroke={C.white} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
    <div
      style={{
        position: "absolute",
        left: -26,
        top: -26,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2px solid ${C.terracotta}`,
        opacity: press > 0 ? (1 - press) * 0.9 : 0,
        transform: `scale(${0.4 + press * 1.2})`,
      }}
    />
  </div>
);

export const fmt = (n: number) => Math.round(n).toLocaleString("id-ID");
