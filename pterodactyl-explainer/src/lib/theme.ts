export const C = {
  white: "#fbfbfa",
  paper: "#f4f3f1",
  ink: "#0b0b0c",
  black: "#030303",
  coal: "#111113",
  panel: "#16171a",
  panel2: "#1d1f23",
  line: "#2a2c31",
  gray: "#8a8d93",
  grayLight: "#c9cbcf",
  orange: "#ff6a2b",
  coral: "#ff8a5c",
  ember: "#ff4d12",
  telegram: "#26A5E4",
  whatsapp: "#25D366",
  ptero: "#3d7bfd",
  ok: "#3ecf8e",
  warn: "#f5b544",
  err: "#f0524f",
};

export const FONT = "'Inter', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const glow = (a = 1, size = 1) =>
  `0 0 ${40 * size}px rgba(255,106,43,${0.55 * a}), 0 0 ${110 * size}px rgba(255,77,18,${0.35 * a}), 0 30px 80px rgba(0,0,0,${0.5 * a})`;
export const softShadow = (a = 1) => `0 24px 60px rgba(10,10,12,${0.14 * a}), 0 4px 14px rgba(10,10,12,${0.08 * a})`;
