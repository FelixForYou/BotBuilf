import React from "react";
import { siTelegram, siWhatsapp } from "simple-icons";
import { C } from "../lib/theme";

/**
 * Pterodactyl logo — paths copied verbatim from the official asset
 * github.com/pterodactyl/panel/.github/assets/logo-dark.svg (MIT repo; Pterodactyl® is a
 * trademark of its owners). Proportions untouched; only the wordmark fill is themeable.
 */
const MARK =
  "M 1153.300781 4732.21875 C 1153.179688 4734.238281 1151.378906 4735.730469 1149.371094 4735.480469 L 1146.621094 4735.128906 L 1153.441406 4729.921875 Z M 1237.460938 4684.519531 L 1192.5 4705.878906 L 1175.949219 4744.699219 L 1168.179688 4741.171875 L 1180.960938 4711.328125 L 1150.378906 4725.78125 L 1115 4754.519531 L 1152.21875 4744.488281 L 1160.941406 4771.191406 L 1228.769531 4795.480469 L 1198.730469 4768.601562 Z M 1237.460938 4684.519531";

import wordmark from "../data/ptero-wordmark.json";

export const PteroMark: React.FC<{ size?: number; color?: string; draw?: number }> = ({ size = 64, color = C.ptero, draw = 1 }) => (
  <svg width={size} height={size * (115 / 126)} viewBox="1113 4682 126 115" style={{ display: "block", overflow: "visible" }}>
    <path d={MARK} fill={color} fillOpacity={Math.min(1, draw * 1.6 - 0.4)} stroke={color} strokeWidth={2}
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, draw * 1.4)} />
  </svg>
);

export const PteroLogo: React.FC<{ height?: number; text?: string; mark?: string; reveal?: number }> = ({
  height = 60,
  text = "#ffffff",
  mark = C.ptero,
  reveal = 1,
}) => {
  const w = height * (662 / 122.96);
  const id = "pr" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={w} height={height} viewBox="1109.00 4678.52 662.0 122.96" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id={id}>
          <rect x={1109} y={4670} width={140 + 530 * reveal} height={140} />
        </clipPath>
      </defs>
      <path d={MARK} fill={mark} />
      <g clipPath={`url(#${id})`}>
        {(wordmark as string[]).map((d, i) => (
          <path key={i} d={d} fill={text} />
        ))}
      </g>
    </svg>
  );
};

/** Telegram / WhatsApp glyphs from Simple Icons (CC0; sourced from each brand's official resources). */
export const BrandLogo: React.FC<{ brand: "telegram" | "whatsapp"; size?: number; mono?: string; inner?: string }> = ({
  brand,
  size = 48,
  mono,
  inner = "#fff",
}) => {
  const icon = brand === "telegram" ? siTelegram : siWhatsapp;
  const col = mono ?? `#${icon.hex}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      {brand === "telegram" ? <circle cx={12} cy={12} r={10.5} fill={inner} /> : <circle cx={12} cy={12} r={9} fill={inner} />}
      <path d={icon.path} fill={col} />
    </svg>
  );
};
