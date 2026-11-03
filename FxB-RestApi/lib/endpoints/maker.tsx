import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { binary, type EndpointDef } from "./types";
import { clampInt } from "./input";

const THEMES: Record<string, { bg: string; fg: string; accent: string; sub: string }> = {
  mint: { bg: "#0f0f10", fg: "#f4f4f5", accent: "#5ee0c4", sub: "#a1a1aa" },
  light: { bg: "#f6f7f8", fg: "#111113", accent: "#0f9e83", sub: "#52525b" },
  sunset: { bg: "#1b0f14", fg: "#fff1f2", accent: "#fb7185", sub: "#fda4af" },
  ocean: { bg: "#06141f", fg: "#e0f2fe", accent: "#38bdf8", sub: "#7dd3fc" },
};

async function render(el: React.ReactElement, w: number, h: number): Promise<Uint8Array> {
  const res = new ImageResponse(el, { width: w, height: h });
  return new Uint8Array(await res.arrayBuffer());
}

function hex(v: string | undefined, def: string): string {
  return v && /^#?[0-9a-fA-F]{6}$/.test(v) ? (v.startsWith("#") ? v : `#${v}`) : def;
}

export const makerEndpoints: EndpointDef[] = [
  {
    id: "maker/quote-card",
    category: "entertainment",
    group: "Maker",
    name: "Quote Card Maker",
    description: "Buat kartu kutipan estetik (PNG 1080x1080) untuk status/story.",
    method: "GET",
    tier: "free",
    response: "image",
    params: [
      { name: "text", type: "string", required: true, description: "Isi kutipan.", example: "Sedikit demi sedikit, lama-lama menjadi bukit.", max: 280 },
      { name: "author", type: "string", description: "Nama penulis.", example: "Peribahasa Indonesia", max: 60 },
      { name: "theme", type: "enum", options: Object.keys(THEMES), default: "mint", description: "Tema warna." },
    ],
    example: "(binary image/png)",
    handler: async ({ params }) => {
      const t = THEMES[params.theme || "mint"];
      const size = params.text.length > 160 ? 46 : params.text.length > 80 ? 58 : 72;
      const img = await render(
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: t.bg, color: t.fg }}>
          <div style={{ fontSize: 160, color: t.accent, lineHeight: 1, marginBottom: 8 }}>“</div>
          <div style={{ fontSize: size, lineHeight: 1.3, fontWeight: 700 }}>{params.text}</div>
          {params.author ? <div style={{ marginTop: 48, fontSize: 36, color: t.accent }}>{`— ${params.author}`}</div> : null}
          <div style={{ position: "absolute", bottom: 56, right: 96, fontSize: 24, color: t.sub }}>FxB RestApi · FELIXIORITY</div>
        </div>,
        1080,
        1080,
      );
      return binary(img, "image/png");
    },
  },
  {
    id: "maker/ttp",
    category: "entertainment",
    group: "Maker",
    name: "Text to Picture (TTP)",
    description: "Ubah teks menjadi gambar stiker 512x512 (cocok untuk stiker WhatsApp).",
    method: "GET",
    tier: "free",
    response: "image",
    params: [
      { name: "text", type: "string", required: true, description: "Teks stiker.", example: "GASS POLL", max: 120 },
      { name: "color", type: "string", default: "ffffff", description: "Warna teks (hex tanpa #)." },
      { name: "bg", type: "string", description: "Warna latar (hex). Kosong = transparan." },
    ],
    example: "(binary image/png)",
    handler: async ({ params }) => {
      const len = params.text.length;
      const fs = len < 10 ? 110 : len < 25 ? 80 : len < 60 ? 56 : 40;
      const img = await render(
        <div
          style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32,
            background: params.bg ? hex(params.bg, "#000000") : "transparent", color: hex(params.color, "#ffffff"),
            fontSize: fs, fontWeight: 800, textShadow: "0 0 6px #000, 0 0 2px #000",
          }}
        >
          {params.text}
        </div>,
        512,
        512,
      );
      return binary(img, "image/png");
    },
  },
  {
    id: "tools/qrcode",
    category: "tools",
    group: "Generator",
    name: "QR Code Generator",
    description: "Buat QR code PNG atau SVG dari teks/URL.",
    method: "GET",
    tier: "free",
    response: "image",
    params: [
      { name: "text", type: "string", required: true, description: "Isi QR.", example: "https://github.com", max: 2000 },
      { name: "size", type: "number", default: "512", description: "Ukuran px 128–2048." },
      { name: "format", type: "enum", options: ["png", "svg"], default: "png", description: "Format output." },
      { name: "dark", type: "string", default: "000000", description: "Warna modul (hex)." },
      { name: "light", type: "string", default: "ffffff", description: "Warna latar (hex)." },
    ],
    example: "(binary image/png)",
    handler: async ({ params }) => {
      const opts = { width: clampInt(params.size, 512, 128, 2048), margin: 2, color: { dark: hex(params.dark, "#000000"), light: hex(params.light, "#ffffff") }, errorCorrectionLevel: "M" as const };
      if (params.format === "svg") {
        const svg = await QRCode.toString(params.text, { ...opts, type: "svg" });
        return binary(new TextEncoder().encode(svg), "image/svg+xml");
      }
      return binary(new Uint8Array(await QRCode.toBuffer(params.text, { ...opts, type: "png" })), "image/png");
    },
  },
];
