import React from "react";

/**
 * Stroke icons (24x24 grid). `draw` (0..1) animates the stroke being drawn on,
 * using pathLength=1 so every path draws at the same pace.
 */
type P = {
  size?: number;
  color?: string;
  stroke?: number;
  draw?: number;
  fill?: string;
  style?: React.CSSProperties;
};

const PATHS: Record<string, string[]> = {
  shield: ["M12 2.5 4 5.5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10v-6z"],
  shieldCheck: ["M12 2.5 4 5.5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10v-6z", "m8.5 12 2.5 2.5 4.5-5"],
  lock: ["M6 10.5h12v10H6z", "M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3", "M12 14.5v2.5"],
  terminal: ["M3 4.5h18v15H3z", "m7 9.5 3 2.5-3 2.5", "M12.5 15h4.5"],
  bug: [
    "M8 9.5h8v5a4 4 0 0 1-8 0z",
    "M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5",
    "M4 12h4M16 12h4M5 7l3 2.5M19 7l-3 2.5M5 18l3-2M19 18l-3-2",
  ],
  star: ["m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"],
  code: ["m8 7-5 5 5 5", "m16 7 5 5-5 5", "m13.5 4-3 16"],
  flag: ["M5 21V4", "M5 4h11l-2 4 2 4H5"],
  cap: ["m2 9 10-5 10 5-10 5z", "M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5", "M22 9v5"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
  users: [
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    "M2.5 20a6.5 6.5 0 0 1 13 0",
    "M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 14a6.5 6.5 0 0 1 3 6",
  ],
  laptop: ["M5 5h14v10H5z", "M2.5 19h19"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z", "M12 12h.01"],
  globe: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M3 12h18", "M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"],
  scale: ["M12 3v18", "M7 21h10", "M5 7h14", "m5 7-3 7a3.2 3.2 0 0 0 6 0z", "m19 7-3 7a3.2 3.2 0 0 0 6 0z"],
  eye: ["M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  fork: ["M6 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 21.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M6 6.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 11.5v6"],
  check: ["m4.5 12.5 5 5 10-11"],
  play: ["m7 4.5 13 7.5-13 7.5z"],
  book: ["M4 4.5h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z", "M20 4.5h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"],
  tag: ["M3 3h8l10 10-8 8L3 11z", "M7.5 7.5h.01"],
  docker: [
    "M3 12.5h16.5c1.2 0 2-.6 2.5-1.5-1-.4-1.8-.2-2.3.2C19.4 9.8 18.5 9 18 8.7c-.6.8-.8 2-.3 3.8",
    "M3 12.5c0 4.2 3 7 8 7 5.3 0 8.6-2.8 9.6-7",
    "M5 10h2.5v2.5H5zM8 10h2.5v2.5H8zM11 10h2.5v2.5H11zM8 7h2.5v2.5H8zM11 7h2.5v2.5H11zM14 10h2.5v2.5H14z",
  ],
  folder: ["M3 6.5a1.5 1.5 0 0 1 1.5-1.5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v4h4"],
  cursor: ["M5 3l14 7.5-6.2 1.7L10 18.5z"],
  alert: ["M12 3 2 20.5h20z", "M12 9.5v5", "M12 17.5h.01"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3.5 2"],
  zap: ["M13 2 4 14h7l-1 8 9-12h-7z"],
  cpu: ["M7 7h10v10H7z", "M10 10h4v4h-4z", "M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"],
  server: ["M4 4h16v6H4zM4 14h16v6H4z", "M8 7h.01M8 17h.01"],
  network: ["M12 3v6M12 9 5 15M12 9l7 6", "M3 15h4v5H3zM10 15h4v5h-4zM17 15h4v5h-4z"],
  package: ["m12 2 9 5v10l-9 5-9-5V7z", "m3 7 9 5 9-5M12 12v10"],
  layers: ["m12 3 9 5-9 5-9-5z", "m3 13 9 5 9-5"],
  brain: ["M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1z", "M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"],
  spark: ["M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5"],
};

export type IconName = keyof typeof PATHS;

export const Icon: React.FC<P & { name: IconName }> = ({
  name,
  size = 48,
  color = "currentColor",
  stroke = 1.8,
  draw = 1,
  fill = "none",
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
    style={{ overflow: "visible", ...style }}
  >
    {PATHS[name].map((d, i) => (
      <path
        key={i}
        d={d}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        fill={i === 0 ? fill : "none"}
      />
    ))}
  </svg>
);

/** GitHub mark (filled, official simple shape). */
export const GithubMark: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
