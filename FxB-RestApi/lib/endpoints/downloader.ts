import { AppError } from "../errors";
import { providerJson } from "../net";
import { cobalt, hostMatches } from "../providers/media";
import { json, type EndpointDef } from "./types";

const TIKWM = () => (process.env.TIKWM_API_URL ?? "https://www.tikwm.com").replace(/\/+$/, "");
const abs = (u: unknown) => (typeof u === "string" && u ? (u.startsWith("http") ? u : TIKWM() + u) : null);

const urlParam = (example: string) => ({ name: "url", type: "string" as const, required: true, description: "Link postingan publik.", example, max: 500 });

function requireHost(url: string, hosts: string[], label: string) {
  if (!hostMatches(url, hosts)) throw new AppError("BAD_REQUEST", `Link harus dari ${label}.`);
}

const cobaltExample = {
  type: "single",
  filename: "video_1080p.mp4",
  url: "https://cobalt.example.com/tunnel?id=...",
  audio: null,
  items: [],
};

function cobaltEndpoint(o: {
  id: string;
  name: string;
  description: string;
  hosts: string[];
  label: string;
  example: string;
  tier?: "free" | "premium";
  audio?: boolean;
}): EndpointDef {
  return {
    id: o.id,
    category: "downloader",
    group: "Media",
    name: o.name,
    description: o.description,
    method: "GET",
    tier: o.tier ?? "free",
    provider: "Cobalt (self-hosted)",
    requires: ["COBALT_API_URL"],
    response: "json",
    params: [
      urlParam(o.example),
      ...(o.audio
        ? [{ name: "type", type: "enum" as const, options: ["video", "audio"], default: "video", description: "Ambil video atau audio saja." }]
        : []),
      { name: "quality", type: "enum" as const, options: ["360", "480", "720", "1080"], default: "720", description: "Kualitas video maksimum." },
    ],
    example: cobaltExample,
    handler: async ({ params }) => {
      requireHost(params.url, o.hosts, o.label);
      return json(await cobalt(params.url, { audioOnly: params.type === "audio", quality: params.quality || "720" }));
    },
  };
}

interface TikwmVideo {
  code: number;
  msg: string;
  data?: {
    id: string;
    title: string;
    region?: string;
    duration?: number;
    cover?: string;
    play?: string;
    wmplay?: string;
    hdplay?: string;
    music?: string;
    images?: string[];
    music_info?: { title?: string; author?: string; play?: string; duration?: number };
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    create_time?: number;
    author?: { unique_id?: string; nickname?: string; avatar?: string };
  };
}

export const downloaderEndpoints: EndpointDef[] = [
  {
    id: "downloader/tiktok",
    category: "downloader",
    group: "TikTok",
    name: "TikTok Downloader",
    description: "Unduh video TikTok tanpa watermark, slide foto, dan audio/musik.",
    method: "GET",
    tier: "free",
    provider: "TikWM",
    response: "json",
    params: [urlParam("https://www.tiktok.com/@tiktok/video/7106594312292453675")],
    example: {
      id: "7106594312292453675",
      title: "caption video",
      type: "video",
      duration: 15,
      cover: "https://.../cover.jpg",
      video: { nowm: "https://.../play.mp4", hd: "https://.../hd.mp4", wm: "https://.../wm.mp4" },
      images: [],
      audio: { title: "original sound", author: "tiktok", url: "https://.../music.mp3" },
      author: { username: "tiktok", nickname: "TikTok", avatar: "https://..." },
      stats: { plays: 1200000, likes: 98000, comments: 1200, shares: 800 },
    },
    handler: async ({ params }) => {
      requireHost(params.url, ["tiktok.com"], "tiktok.com");
      const r = await providerJson<TikwmVideo>(`${TIKWM()}/api/?hd=1&url=${encodeURIComponent(params.url)}`);
      if (r.code !== 0 || !r.data) throw new AppError("NOT_FOUND", r.msg || "Video tidak ditemukan atau privat.", 404);
      const d = r.data;
      const images = (d.images ?? []).map(abs).filter(Boolean);
      return json({
        id: d.id,
        title: d.title,
        type: images.length ? "photo" : "video",
        duration: d.duration ?? null,
        cover: abs(d.cover),
        video: images.length ? null : { nowm: abs(d.play), hd: abs(d.hdplay), wm: abs(d.wmplay) },
        images,
        audio: { title: d.music_info?.title ?? null, author: d.music_info?.author ?? null, url: abs(d.music_info?.play ?? d.music) },
        author: { username: d.author?.unique_id ?? null, nickname: d.author?.nickname ?? null, avatar: abs(d.author?.avatar) },
        stats: { plays: d.play_count ?? 0, likes: d.digg_count ?? 0, comments: d.comment_count ?? 0, shares: d.share_count ?? 0 },
        created_at: d.create_time ? new Date(d.create_time * 1000).toISOString() : null,
      });
    },
  },
  {
    id: "downloader/tiktok-audio",
    category: "downloader",
    group: "TikTok",
    name: "TikTok Audio",
    description: "Ambil hanya audio/musik dari video TikTok.",
    method: "GET",
    tier: "free",
    provider: "TikWM",
    response: "json",
    params: [urlParam("https://www.tiktok.com/@tiktok/video/7106594312292453675")],
    example: { title: "original sound", author: "tiktok", duration: 15, url: "https://.../music.mp3", cover: "https://..." },
    handler: async ({ params }) => {
      requireHost(params.url, ["tiktok.com"], "tiktok.com");
      const r = await providerJson<TikwmVideo>(`${TIKWM()}/api/?url=${encodeURIComponent(params.url)}`);
      if (r.code !== 0 || !r.data) throw new AppError("NOT_FOUND", r.msg || "Video tidak ditemukan.", 404);
      const m = r.data.music_info ?? {};
      return json({ title: m.title ?? null, author: m.author ?? null, duration: m.duration ?? null, url: abs(m.play ?? r.data.music), cover: abs(r.data.cover) });
    },
  },
  cobaltEndpoint({
    id: "downloader/instagram",
    name: "Instagram Downloader",
    description: "Unduh Reels, video, dan foto/carousel dari postingan Instagram publik.",
    hosts: ["instagram.com"],
    label: "instagram.com",
    example: "https://www.instagram.com/reel/C0abcdEFgh1/",
  }),
  cobaltEndpoint({
    id: "downloader/youtube",
    name: "YouTube Downloader",
    description: "Unduh video atau audio (MP3) YouTube & YouTube Shorts.",
    hosts: ["youtube.com", "youtu.be"],
    label: "YouTube",
    example: "https://youtu.be/dQw4w9WgXcQ",
    audio: true,
    tier: "premium",
  }),
  cobaltEndpoint({
    id: "downloader/facebook",
    name: "Facebook Downloader",
    description: "Unduh video publik Facebook & Facebook Reels.",
    hosts: ["facebook.com", "fb.watch"],
    label: "Facebook",
    example: "https://www.facebook.com/watch/?v=10153231379946729",
  }),
  cobaltEndpoint({
    id: "downloader/pinterest",
    name: "Pinterest Downloader",
    description: "Unduh gambar & video dari pin Pinterest.",
    hosts: ["pinterest.com", "pin.it", "pinterest.co.uk", "id.pinterest.com"],
    label: "Pinterest",
    example: "https://pin.it/1abcDEF",
  }),
  cobaltEndpoint({
    id: "downloader/twitter",
    name: "X / Twitter Downloader",
    description: "Unduh video & GIF dari postingan X (Twitter).",
    hosts: ["twitter.com", "x.com"],
    label: "X/Twitter",
    example: "https://x.com/user/status/1234567890",
  }),
  cobaltEndpoint({
    id: "downloader/soundcloud",
    name: "SoundCloud Downloader",
    description: "Unduh audio dari track SoundCloud publik.",
    hosts: ["soundcloud.com"],
    label: "SoundCloud",
    example: "https://soundcloud.com/artist/track",
    audio: true,
  }),
  {
    ...cobaltEndpoint({
      id: "downloader/aio",
      name: "All-in-One Downloader",
      description: "Satu endpoint untuk semua situs yang didukung Cobalt (Reddit, Vimeo, Tumblr, Bilibili, dll).",
      hosts: [],
      label: "",
      example: "https://www.reddit.com/r/videos/comments/abc123/",
      audio: true,
      tier: "premium",
    }),
    handler: async ({ params }) => json(await cobalt(params.url, { audioOnly: params.type === "audio", quality: params.quality || "720" })),
  },
];
