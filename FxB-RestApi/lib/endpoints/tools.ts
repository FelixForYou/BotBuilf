import { createHash, randomBytes, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import sharp from "sharp";
import { run, one } from "../db";
import { AppError } from "../errors";
import { parsePublicUrl, providerFetch, providerJson, safeFetch } from "../net";
import { clampInt, loadImage } from "./input";
import { binary, json, type EndpointDef } from "./types";

const T = (d: Omit<EndpointDef, "category" | "method" | "response"> & Partial<Pick<EndpointDef, "method" | "response">>): EndpointDef => ({
  method: "GET",
  response: "json",
  ...d,
  category: "tools",
});

const DOMAIN = /^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const MAX_UPLOAD = () => Number(process.env.MAX_UPLOAD_MB || 4) * 1024 * 1024;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const c = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return c ? decodeEntities(c.trim()) : null;
}

async function storeFile(name: string, mime: string, data: Uint8Array, userId: string | null): Promise<string> {
  const id = randomBytes(9).toString("base64url");
  await run("INSERT INTO files (id,name,mime,size,data,user_id,created_at) VALUES (?,?,?,?,?,?,?)", [id, name.slice(0, 120), mime, data.byteLength, data, userId, Date.now()]);
  return id;
}

function sniffImage(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
}

// Tipe file yang boleh diunggah & disajikan (bukan HTML/SVG/JS agar tidak bisa dipakai XSS).
const SAFE_MIME = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain", "application/zip", "audio/mpeg", "audio/ogg",
  "audio/mp4", "video/mp4", "video/webm", "application/json", "application/octet-stream",
]);

export const toolEndpoints: EndpointDef[] = [
  // ---------------- Stalker (data profil publik via API resmi/publik) ----------------
  T({
    id: "stalk/github",
    group: "Stalker",
    name: "GitHub Profile",
    description: "Info profil publik GitHub + repositori teratas (GitHub REST API resmi).",
    tier: "free",
    provider: "GitHub API",
    params: [{ name: "username", type: "string", required: true, description: "Username GitHub.", example: "torvalds", max: 39 }],
    example: { username: "torvalds", name: "Linus Torvalds", bio: null, followers: 230000, following: 0, public_repos: 8, avatar: "https://avatars.githubusercontent.com/u/1024025", top_repos: [{ name: "linux", stars: 190000 }] },
    handler: async ({ params }) => {
      if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(params.username)) throw new AppError("BAD_REQUEST", "Username tidak valid.");
      const h: Record<string, string> = { Accept: "application/vnd.github+json" };
      if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const u = await providerJson<Record<string, unknown>>(`https://api.github.com/users/${params.username}`, { headers: h });
      const repos = await providerJson<{ name: string; stargazers_count: number; language: string | null; html_url: string; description: string | null }[]>(
        `https://api.github.com/users/${params.username}/repos?sort=updated&per_page=100`,
        { headers: h },
      ).catch(() => []);
      return json({
        username: u.login, name: u.name, bio: u.bio, company: u.company, blog: u.blog, location: u.location, followers: u.followers, following: u.following,
        public_repos: u.public_repos, avatar: u.avatar_url, url: u.html_url, created_at: u.created_at,
        top_repos: repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5).map((r) => ({ name: r.name, stars: r.stargazers_count, language: r.language, description: r.description, url: r.html_url })),
      });
    },
  }),
  T({
    id: "stalk/tiktok",
    group: "Stalker",
    name: "TikTok Profile",
    description: "Info profil publik TikTok (nama, bio, followers, likes).",
    tier: "free",
    provider: "TikWM",
    params: [{ name: "username", type: "string", required: true, description: "Username tanpa @.", example: "tiktok", max: 40 }],
    example: { username: "tiktok", nickname: "TikTok", bio: "...", verified: true, avatar: "https://...", followers: 80000000, following: 1, likes: 400000000, videos: 1200 },
    handler: async ({ params }) => {
      const name = params.username.replace(/^@/, "");
      if (!/^[a-z0-9._]{2,30}$/i.test(name)) throw new AppError("BAD_REQUEST", "Username tidak valid.");
      const base = (process.env.TIKWM_API_URL ?? "https://www.tikwm.com").replace(/\/+$/, "");
      const r = await providerJson<{ code: number; msg: string; data?: { user: Record<string, unknown>; stats: Record<string, number> } }>(`${base}/api/user/info?unique_id=${encodeURIComponent(name)}`);
      if (r.code !== 0 || !r.data) throw new AppError("NOT_FOUND", "Akun tidak ditemukan atau privat.", 404);
      const u = r.data.user;
      const s = r.data.stats;
      return json({ username: u.uniqueId, nickname: u.nickname, bio: u.signature, verified: !!u.verified, private: !!u.privateAccount, avatar: u.avatarLarger ?? u.avatarMedium, followers: s.followerCount, following: s.followingCount, likes: s.heartCount ?? s.heart, videos: s.videoCount });
    },
  }),
  T({
    id: "stalk/npm",
    group: "Stalker",
    name: "NPM Package Info",
    description: "Info paket npm: versi terbaru, deskripsi, lisensi, unduhan mingguan.",
    tier: "free",
    provider: "npm Registry",
    params: [{ name: "name", type: "string", required: true, description: "Nama paket.", example: "next", max: 214 }],
    example: { name: "next", version: "16.0.0", description: "The React Framework", license: "MIT", weekly_downloads: 9000000, homepage: "https://nextjs.org" },
    handler: async ({ params }) => {
      if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(params.name)) throw new AppError("BAD_REQUEST", "Nama paket tidak valid.");
      const p = await providerJson<{ name: string; description?: string; "dist-tags": { latest: string }; license?: string; homepage?: string; repository?: { url?: string }; maintainers?: { name: string }[]; time?: Record<string, string> }>(
        `https://registry.npmjs.org/${params.name.replace("/", "%2F")}`,
      );
      const dl = await providerJson<{ downloads: number }>(`https://api.npmjs.org/downloads/point/last-week/${params.name}`).catch(() => ({ downloads: null }));
      return json({ name: p.name, version: p["dist-tags"].latest, description: p.description ?? null, license: p.license ?? null, homepage: p.homepage ?? null, repository: p.repository?.url ?? null, maintainers: (p.maintainers ?? []).map((m) => m.name), updated: p.time?.modified ?? null, weekly_downloads: dl.downloads });
    },
  }),
  // ---------------- Web & network ----------------
  T({
    id: "tools/metadata",
    group: "Web",
    name: "Website Metadata",
    description: "Ambil judul, deskripsi, Open Graph, favicon dari sebuah URL.",
    tier: "free",
    params: [{ name: "url", type: "string", required: true, description: "URL halaman.", example: "https://github.com", max: 1000 }],
    example: { url: "https://github.com/", status: 200, title: "GitHub", description: "...", image: "https://github.githubassets.com/...png", site_name: "GitHub", favicon: "https://github.com/favicon.ico", content_type: "text/html" },
    handler: async ({ params }) => {
      const r = await safeFetch(params.url, { maxBytes: 2 * 1024 * 1024, headers: { Accept: "text/html,*/*" } });
      const ct = String(r.headers["content-type"] ?? "");
      const html = ct.includes("html") ? r.body.toString("utf8") : "";
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
      const icon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1];
      const resolve = (v: string | null | undefined) => {
        if (!v) return null;
        try {
          return new URL(v, r.url).toString();
        } catch {
          return null;
        }
      };
      return json({
        url: r.url, status: r.status, content_type: ct || null,
        title: metaContent(html, "og:title") ?? (title ? decodeEntities(title.trim()) : null),
        description: metaContent(html, "og:description") ?? metaContent(html, "description"),
        image: resolve(metaContent(html, "og:image")), site_name: metaContent(html, "og:site_name"), type: metaContent(html, "og:type"),
        theme_color: metaContent(html, "theme-color"), favicon: resolve(icon) ?? resolve("/favicon.ico"),
      });
    },
  }),
  T({
    id: "tools/dns",
    group: "Network",
    name: "DNS Lookup",
    description: "Cek record DNS (A, AAAA, MX, TXT, NS, CNAME, SOA, CAA) via DNS-over-HTTPS.",
    tier: "free",
    provider: "Cloudflare DNS (DoH)",
    params: [
      { name: "domain", type: "string", required: true, description: "Nama domain.", example: "google.com", max: 253 },
      { name: "type", type: "enum", options: ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"], default: "A", description: "Tipe record." },
    ],
    example: { domain: "google.com", type: "A", records: [{ name: "google.com", type: "A", ttl: 300, data: "142.250.4.100" }] },
    handler: async ({ params }) => {
      const d = params.domain.toLowerCase().replace(/\.$/, "");
      if (!DOMAIN.test(d)) throw new AppError("BAD_REQUEST", "Domain tidak valid.");
      const type = params.type || "A";
      const r = await providerJson<{ Status: number; Answer?: { name: string; type: number; TTL: number; data: string }[] }>(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${type}`,
        { headers: { Accept: "application/dns-json" } },
      );
      const TYPES: Record<number, string> = { 1: "A", 28: "AAAA", 15: "MX", 16: "TXT", 2: "NS", 5: "CNAME", 6: "SOA", 257: "CAA" };
      return json({ domain: d, type, status: r.Status === 0 ? "NOERROR" : r.Status === 3 ? "NXDOMAIN" : `RCODE_${r.Status}`, records: (r.Answer ?? []).map((a) => ({ name: a.name.replace(/\.$/, ""), type: TYPES[a.type] ?? String(a.type), ttl: a.TTL, data: a.data })) });
    },
  }),
  T({
    id: "tools/whois",
    group: "Network",
    name: "Domain WHOIS (RDAP)",
    description: "Info registrasi domain: registrar, tanggal dibuat/kedaluwarsa, nameserver.",
    tier: "free",
    provider: "RDAP (IANA bootstrap)",
    params: [{ name: "domain", type: "string", required: true, description: "Nama domain.", example: "github.com", max: 253 }],
    example: { domain: "github.com", registrar: "MarkMonitor Inc.", created: "2007-10-09T18:20:50Z", expires: "2026-10-09T18:20:50Z", nameservers: ["dns1.p08.nsone.net"], status: ["client transfer prohibited"] },
    handler: async ({ params }) => {
      const d = params.domain.toLowerCase();
      if (!DOMAIN.test(d)) throw new AppError("BAD_REQUEST", "Domain tidak valid.");
      const r = await providerJson<{ events?: { eventAction: string; eventDate: string }[]; entities?: { roles: string[]; vcardArray?: [string, [string, object, string, string][]] }[]; nameservers?: { ldhName: string }[]; status?: string[] }>(
        `https://rdap.org/domain/${encodeURIComponent(d)}`,
        { headers: { Accept: "application/rdap+json" } },
      );
      const ev = (a: string) => r.events?.find((e) => e.eventAction === a)?.eventDate ?? null;
      const reg = r.entities?.find((e) => e.roles.includes("registrar"));
      const fn = reg?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3] ?? null;
      return json({ domain: d, registrar: fn, created: ev("registration"), updated: ev("last changed"), expires: ev("expiration"), nameservers: (r.nameservers ?? []).map((n) => n.ldhName.toLowerCase()), status: r.status ?? [] });
    },
  }),
  T({
    id: "tools/ip",
    group: "Network",
    name: "IP Lookup",
    description: "Geolokasi & info jaringan alamat IP publik (negara, kota, ISP, ASN, zona waktu).",
    tier: "free",
    provider: "ipwho.is",
    params: [{ name: "ip", type: "string", required: true, description: "Alamat IPv4/IPv6.", example: "8.8.8.8", max: 45 }],
    example: { ip: "8.8.8.8", type: "IPv4", country: "United States", country_code: "US", region: "California", city: "Mountain View", lat: 37.38, lon: -122.08, isp: "Google LLC", asn: 15169, timezone: "America/Los_Angeles" },
    handler: async ({ params }) => {
      if (!isIP(params.ip)) throw new AppError("BAD_REQUEST", "Alamat IP tidak valid.");
      const r = await providerJson<Record<string, unknown> & { success: boolean; message?: string; connection?: Record<string, unknown>; timezone?: { id?: string } }>(`https://ipwho.is/${params.ip}`);
      if (!r.success) throw new AppError("BAD_REQUEST", String(r.message ?? "IP tidak dapat dicari (privat/reserved?)."));
      return json({ ip: r.ip, type: r.type, continent: r.continent, country: r.country, country_code: r.country_code, region: r.region, city: r.city, lat: r.latitude, lon: r.longitude, isp: r.connection?.isp ?? null, org: r.connection?.org ?? null, asn: r.connection?.asn ?? null, timezone: r.timezone?.id ?? null });
    },
  }),
  T({
    id: "tools/shorten",
    group: "Web",
    name: "URL Shortener",
    description: "Perpendek URL menjadi link /s/kode di domain FxB RestApi.",
    tier: "free",
    params: [
      { name: "url", type: "string", required: true, description: "URL tujuan (http/https).", example: "https://github.com/felixforyou", max: 2000 },
      { name: "alias", type: "string", description: "Alias kustom 4–32 karakter (a-z, 0-9, - _).", example: "", max: 32 },
    ],
    example: { code: "aB3dE9", short_url: "https://your-domain/s/aB3dE9", url: "https://github.com/felixforyou" },
    handler: async ({ params, base, userId }) => {
      const target = parsePublicUrl(params.url).toString();
      let code = params.alias;
      if (code) {
        if (!/^[A-Za-z0-9_-]{4,32}$/.test(code)) throw new AppError("BAD_REQUEST", "Alias 4–32 karakter: huruf, angka, - atau _.");
        if (await one("SELECT code FROM short_links WHERE code=?", [code])) throw new AppError("CONFLICT", "Alias sudah dipakai.", 409);
      } else code = randomBytes(5).toString("base64url").replace(/[-_]/g, "x").slice(0, 7);
      await run("INSERT INTO short_links (code,url,user_id,hits,created_at) VALUES (?,?,?,0,?)", [code, target, userId, Date.now()]);
      return json({ code, short_url: `${base}/s/${code}`, url: target });
    },
  }),
  T({
    id: "tools/screenshot",
    group: "Web",
    name: "Website Screenshot",
    description: "Ambil screenshot halaman web (desktop/mobile, opsional full page).",
    tier: "premium",
    provider: "Microlink",
    response: "image",
    params: [
      { name: "url", type: "string", required: true, description: "URL halaman.", example: "https://github.com", max: 1000 },
      { name: "device", type: "enum", options: ["desktop", "mobile"], default: "desktop", description: "Viewport." },
      { name: "full", type: "boolean", default: "false", description: "Full page." },
    ],
    example: "(binary image/png)",
    handler: async ({ params }) => {
      const target = parsePublicUrl(params.url).toString();
      const key = process.env.MICROLINK_API_KEY;
      const qs = new URLSearchParams({ url: target, screenshot: "true", meta: "false", embed: "screenshot.url", "screenshot.fullPage": params.full === "true" ? "true" : "false", device: params.device === "mobile" ? "iPhone X" : "Macbook Pro 13" });
      const r = await providerFetch(`https://${key ? "pro." : ""}api.microlink.io/?${qs}`, { headers: key ? { "x-api-key": key } : {}, timeoutMs: 45_000 });
      if (r.status === 429) throw new AppError("PROVIDER_RATE_LIMITED", "Kuota screenshot penyedia habis. Coba lagi nanti.", 503);
      const ct = r.headers.get("content-type") ?? "";
      if (!r.ok || !ct.startsWith("image/")) throw new AppError("PROVIDER_ERROR", "Screenshot gagal. Pastikan URL dapat diakses publik.", 502);
      return binary(new Uint8Array(await r.arrayBuffer()), ct);
    },
  }),
  // ---------------- Text utils ----------------
  T({
    id: "tools/encode",
    group: "Text",
    name: "Text Encoder / Decoder",
    description: "Encode/decode Base64, Base64URL, URL, Hex, Binary, ROT13.",
    tier: "free",
    params: [
      { name: "text", type: "string", required: true, description: "Teks input.", example: "FxB RestApi", max: 20000 },
      { name: "type", type: "enum", options: ["base64", "base64url", "url", "hex", "binary", "rot13"], default: "base64", description: "Jenis encoding." },
      { name: "mode", type: "enum", options: ["encode", "decode"], default: "encode", description: "Mode." },
    ],
    example: { type: "base64", mode: "encode", input: "FxB RestApi", output: "RnhCIFJlc3RBcGk=" },
    handler: async ({ params }) => {
      const { text } = params;
      const type = params.type || "base64";
      const mode = params.mode || "encode";
      const rot = (s: string) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.charCodeAt(0) - (c <= "Z" ? 65 : 97) + 13) % 26) + (c <= "Z" ? 65 : 97)));
      let out: string;
      try {
        if (mode === "encode") {
          out = type === "base64" ? Buffer.from(text).toString("base64")
            : type === "base64url" ? Buffer.from(text).toString("base64url")
            : type === "url" ? encodeURIComponent(text)
            : type === "hex" ? Buffer.from(text).toString("hex")
            : type === "binary" ? [...Buffer.from(text)].map((b) => b.toString(2).padStart(8, "0")).join(" ")
            : rot(text);
        } else {
          if (type === "hex" && !/^([0-9a-f]{2})*$/i.test(text.replace(/\s/g, ""))) throw new Error();
          if (type === "binary" && !/^[01\s]+$/.test(text)) throw new Error();
          out = type === "base64" ? Buffer.from(text, "base64").toString("utf8")
            : type === "base64url" ? Buffer.from(text, "base64url").toString("utf8")
            : type === "url" ? decodeURIComponent(text)
            : type === "hex" ? Buffer.from(text.replace(/\s/g, ""), "hex").toString("utf8")
            : type === "binary" ? Buffer.from(text.trim().split(/\s+/).map((b) => parseInt(b, 2))).toString("utf8")
            : rot(text);
        }
      } catch {
        throw new AppError("BAD_REQUEST", `Input bukan ${type} yang valid.`);
      }
      return json({ type, mode, input: text, output: out });
    },
  }),
  T({
    id: "tools/hash",
    group: "Text",
    name: "Hash Generator",
    description: "Hitung hash MD5, SHA-1, SHA-256, SHA-512 dari teks.",
    tier: "free",
    params: [
      { name: "text", type: "string", required: true, description: "Teks input.", example: "hello", max: 50000 },
      { name: "algo", type: "enum", options: ["md5", "sha1", "sha256", "sha512"], default: "sha256", description: "Algoritma." },
    ],
    example: { algo: "sha256", hash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" },
    handler: async ({ params }) => json({ algo: params.algo || "sha256", hash: createHash(params.algo || "sha256").update(params.text).digest("hex") }),
  }),
  T({
    id: "tools/json-format",
    method: "POST",
    group: "Text",
    name: "JSON Formatter & Validator",
    description: "Validasi, rapikan (pretty print), atau minify JSON.",
    tier: "free",
    params: [
      { name: "json", type: "string", required: true, description: "String JSON.", example: '{"name":"FxB","ok":true}', max: 200000 },
      { name: "mode", type: "enum", options: ["pretty", "minify"], default: "pretty", description: "Mode output." },
      { name: "indent", type: "number", default: "2", description: "Indentasi 1–8 (mode pretty)." },
    ],
    example: { valid: true, output: '{\n  "name": "FxB",\n  "ok": true\n}', size: { input: 24, output: 34 } },
    handler: async ({ params }) => {
      let v: unknown;
      try {
        v = JSON.parse(params.json);
      } catch (e) {
        return json({ valid: false, error: (e as Error).message, output: null });
      }
      const out = params.mode === "minify" ? JSON.stringify(v) : JSON.stringify(v, null, clampInt(params.indent, 2, 1, 8));
      return json({ valid: true, output: out, size: { input: params.json.length, output: out.length } });
    },
  }),
  T({
    id: "tools/uuid",
    group: "Generator",
    name: "UUID Generator",
    description: "Buat UUID v4 acak (kriptografis).",
    tier: "free",
    params: [{ name: "count", type: "number", default: "1", description: "Jumlah 1–50." }],
    example: { uuids: ["3b241101-e2bb-4255-8caf-4136c566a962"] },
    handler: async ({ params }) => json({ uuids: Array.from({ length: clampInt(params.count, 1, 1, 50) }, () => randomUUID()) }),
  }),
  T({
    id: "tools/password",
    group: "Generator",
    name: "Password Generator",
    description: "Buat password acak yang kuat (crypto random).",
    tier: "free",
    params: [
      { name: "length", type: "number", default: "16", description: "Panjang 8–128." },
      { name: "symbols", type: "boolean", default: "true", description: "Sertakan simbol." },
    ],
    example: { password: "q9#Lm2!xT7@pVz4&", length: 16, entropy_bits: 104 },
    handler: async ({ params }) => {
      const len = clampInt(params.length, 16, 8, 128);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789" + (params.symbols === "false" ? "" : "!@#$%^&*-_=+?");
      const out: string[] = [];
      while (out.length < len) {
        for (const b of randomBytes(len * 2)) {
          if (b < 256 - (256 % chars.length) && out.length < len) out.push(chars[b % chars.length]);
        }
      }
      return json({ password: out.join(""), length: len, entropy_bits: Math.floor(len * Math.log2(chars.length)) });
    },
  }),
  // ---------------- Info ----------------
  T({
    id: "tools/weather",
    group: "Info",
    name: "Weather",
    description: "Cuaca saat ini & prakiraan 3 hari berdasarkan nama kota.",
    tier: "free",
    provider: "Open-Meteo",
    params: [{ name: "city", type: "string", required: true, description: "Nama kota.", example: "Jakarta", max: 80 }],
    example: { location: "Jakarta, Indonesia", current: { temperature: 31.2, humidity: 66, wind: 9.4, condition: "Berawan sebagian" }, daily: [{ date: "2026-11-03", min: 25.1, max: 33.4, condition: "Hujan ringan" }] },
    handler: async ({ params }) => {
      const g = await providerJson<{ results?: { name: string; country: string; latitude: number; longitude: number; timezone: string; admin1?: string }[] }>(
        `https://geocoding-api.open-meteo.com/v1/search?count=1&language=id&name=${encodeURIComponent(params.city)}`,
      );
      const loc = g.results?.[0];
      if (!loc) throw new AppError("NOT_FOUND", "Kota tidak ditemukan.", 404);
      const w = await providerJson<{ current: Record<string, number>; daily: { time: string[]; temperature_2m_min: number[]; temperature_2m_max: number[]; weather_code: number[]; precipitation_probability_max: number[] } }>(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&timezone=${encodeURIComponent(loc.timezone)}&forecast_days=3&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_min,temperature_2m_max,weather_code,precipitation_probability_max`,
      );
      return json({
        location: [loc.name, loc.admin1, loc.country].filter(Boolean).join(", "),
        coordinates: { lat: loc.latitude, lon: loc.longitude },
        timezone: loc.timezone,
        current: { temperature: w.current.temperature_2m, feels_like: w.current.apparent_temperature, humidity: w.current.relative_humidity_2m, wind: w.current.wind_speed_10m, condition: wmo(w.current.weather_code) },
        daily: w.daily.time.map((d, i) => ({ date: d, min: w.daily.temperature_2m_min[i], max: w.daily.temperature_2m_max[i], rain_chance: w.daily.precipitation_probability_max[i], condition: wmo(w.daily.weather_code[i]) })),
      });
    },
  }),
  T({
    id: "tools/currency",
    group: "Info",
    name: "Currency Converter",
    description: "Konversi mata uang dengan kurs referensi ECB terbaru.",
    tier: "free",
    provider: "Frankfurter (ECB)",
    params: [
      { name: "from", type: "string", required: true, description: "Kode mata uang asal.", example: "USD", max: 3 },
      { name: "to", type: "string", required: true, description: "Kode mata uang tujuan.", example: "IDR", max: 3 },
      { name: "amount", type: "number", default: "1", description: "Jumlah." },
    ],
    example: { from: "USD", to: "IDR", amount: 1, rate: 16250.5, result: 16250.5, date: "2026-11-02" },
    handler: async ({ params }) => {
      const from = params.from.toUpperCase();
      const to = params.to.toUpperCase();
      if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) throw new AppError("BAD_REQUEST", "Kode mata uang harus 3 huruf (ISO 4217).");
      const amount = Number(params.amount || 1);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) throw new AppError("BAD_REQUEST", "Jumlah tidak valid.");
      if (from === to) return json({ from, to, amount, rate: 1, result: amount, date: new Date().toISOString().slice(0, 10) });
      const r = await providerJson<{ date: string; rates: Record<string, number> }>(`https://api.frankfurter.app/latest?from=${from}&to=${to}`).catch((e) => {
        if (e instanceof AppError && e.status === 404) throw new AppError("BAD_REQUEST", "Mata uang tidak didukung.");
        throw e;
      });
      const rate = r.rates[to];
      if (!rate) throw new AppError("BAD_REQUEST", "Mata uang tidak didukung.");
      return json({ from, to, amount, rate, result: Math.round(amount * rate * 10000) / 10000, date: r.date });
    },
  }),
  // ---------------- Files ----------------
  T({
    id: "tools/upload",
    method: "POST",
    group: "Upload",
    name: "File Upload",
    description: "Unggah file (multipart field `file`) dan dapatkan link publik. Maks 4 MB.",
    tier: "free",
    params: [{ name: "file", type: "file", required: true, description: "File (gambar, PDF, audio, video, zip, teks)." }],
    example: { id: "Xy12abCdEf", url: "https://your-domain/f/Xy12abCdEf", name: "doc.pdf", mime: "application/pdf", size: 120334 },
    handler: async ({ files, base, userId }) => {
      const f = files.file;
      if (!f) throw new AppError("BAD_REQUEST", "Field `file` wajib diunggah (multipart/form-data).");
      if (f.size === 0) throw new AppError("BAD_REQUEST", "File kosong.");
      if (f.size > MAX_UPLOAD()) throw new AppError("TOO_LARGE", `File maksimal ${MAX_UPLOAD() / 1048576} MB.`, 413);
      const data = new Uint8Array(await f.arrayBuffer());
      const sniff = sniffImage(data);
      let mime = sniff ?? (f.type || "application/octet-stream").split(";")[0].toLowerCase();
      if (!SAFE_MIME.has(mime)) mime = "application/octet-stream";
      const id = await storeFile(f.name || "file", mime, data, userId);
      return json({ id, url: `${base}/f/${id}`, name: f.name, mime, size: f.size });
    },
  }),
  T({
    id: "tools/upload-image",
    method: "POST",
    group: "Upload",
    name: "Image Upload",
    description: "Unggah gambar (field `image`, PNG/JPG/GIF/WEBP) — divalidasi & dikompres jadi WEBP opsional.",
    tier: "free",
    params: [
      { name: "image", type: "file", required: true, description: "File gambar maks 4 MB." },
      { name: "webp", type: "boolean", default: "false", description: "Konversi ke WEBP (lebih kecil)." },
    ],
    example: { id: "Ab12cdEfGh", url: "https://your-domain/f/Ab12cdEfGh", mime: "image/webp", size: 48211, width: 1080, height: 1080 },
    handler: async ({ files, params, base, userId }) => {
      const f = files.image;
      if (!f) throw new AppError("BAD_REQUEST", "Field `image` wajib diunggah.");
      if (f.size > MAX_UPLOAD()) throw new AppError("TOO_LARGE", `Gambar maksimal ${MAX_UPLOAD() / 1048576} MB.`, 413);
      let data: Uint8Array = new Uint8Array(await f.arrayBuffer());
      let mime = sniffImage(data);
      if (!mime) throw new AppError("BAD_REQUEST", "File bukan gambar PNG/JPG/GIF/WEBP.");
      const meta = await sharp(data).metadata().catch(() => null);
      if (!meta?.width) throw new AppError("BAD_REQUEST", "Gambar rusak atau tidak valid.");
      if (params.webp === "true" && mime !== "image/gif") {
        data = new Uint8Array(await sharp(data).rotate().webp({ quality: 82 }).toBuffer());
        mime = "image/webp";
      }
      const id = await storeFile(f.name || "image", mime, data, userId);
      return json({ id, url: `${base}/f/${id}`, mime, size: data.byteLength, width: meta.width, height: meta.height });
    },
  }),
  T({
    id: "tools/image-resize",
    group: "Image",
    name: "Image Resize & Convert",
    description: "Ubah ukuran & format gambar (PNG/JPEG/WEBP/AVIF) dengan resampling Lanczos.",
    tier: "free",
    response: "image",
    params: [
      { name: "url", type: "string", description: "URL gambar (atau POST file `image`).", example: "https://picsum.photos/id/237/1200/800", max: 1000 },
      { name: "image", type: "file", description: "File gambar (POST multipart)." },
      { name: "width", type: "number", description: "Lebar target (px, maks 4096).", example: "600" },
      { name: "height", type: "number", description: "Tinggi target (px, maks 4096)." },
      { name: "format", type: "enum", options: ["png", "jpeg", "webp", "avif"], default: "webp", description: "Format output." },
      { name: "quality", type: "number", default: "85", description: "Kualitas 1–100." },
    ],
    example: "(binary image/webp)",
    handler: async (ctx) => {
      const { buf } = await loadImage(ctx);
      const w = ctx.params.width ? clampInt(ctx.params.width, 0, 1, 4096) : undefined;
      const h = ctx.params.height ? clampInt(ctx.params.height, 0, 1, 4096) : undefined;
      const q = clampInt(ctx.params.quality, 85, 1, 100);
      const fmt = (ctx.params.format || "webp") as "png" | "jpeg" | "webp" | "avif";
      let p = sharp(buf).rotate();
      if (w || h) p = p.resize({ width: w, height: h, fit: "inside", kernel: "lanczos3" });
      const out = await p.toFormat(fmt, { quality: q }).toBuffer();
      return binary(new Uint8Array(out), `image/${fmt}`);
    },
  }),
];

function wmo(c: number): string {
  if (c === 0) return "Cerah";
  if (c <= 2) return "Cerah berawan";
  if (c === 3) return "Berawan";
  if (c <= 48) return "Berkabut";
  if (c <= 57) return "Gerimis";
  if (c <= 67) return "Hujan";
  if (c <= 77) return "Salju";
  if (c <= 82) return "Hujan lebat";
  if (c <= 86) return "Hujan salju";
  return "Badai petir";
}
