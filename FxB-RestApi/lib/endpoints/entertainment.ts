import { AppError } from "../errors";
import { DARES, QUOTES, RIDDLES, TRUTHS } from "../data";
import { providerFetch, providerJson } from "../net";
import { clampInt, pick } from "./input";
import { binary, json, type EndpointDef } from "./types";

const E = (d: Omit<EndpointDef, "category" | "method" | "response"> & Partial<Pick<EndpointDef, "method" | "response">>): EndpointDef => ({
  method: "GET",
  response: "json",
  ...d,
  category: "entertainment",
});

const qParam = (example: string) => ({ name: "q", type: "string" as const, required: true, description: "Kata kunci pencarian.", example, max: 100 });

function memegenText(s: string): string {
  if (!s) return "_";
  return s
    .replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "_").replace(/\?/g, "~q").replace(/&/g, "~a").replace(/%/g, "~p")
    .replace(/#/g, "~h").replace(/\//g, "~s").replace(/\\/g, "~b").replace(/</g, "~l").replace(/>/g, "~g").replace(/"/g, "''");
}

export const entertainmentEndpoints: EndpointDef[] = [
  // ---------------- Fun ----------------
  E({
    id: "fun/joke",
    group: "Fun",
    name: "Random Joke",
    description: "Lelucon acak (filter aman aktif).",
    tier: "free",
    provider: "JokeAPI",
    params: [{ name: "category", type: "enum", options: ["Any", "Programming", "Misc", "Pun"], default: "Any", description: "Kategori." }],
    example: { category: "Programming", type: "twopart", setup: "Why do programmers prefer dark mode?", delivery: "Because light attracts bugs." },
    handler: async ({ params }) => {
      const r = await providerJson<{ error?: boolean; category: string; type: string; joke?: string; setup?: string; delivery?: string }>(
        `https://v2.jokeapi.dev/joke/${params.category || "Any"}?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit`,
      );
      if (r.error) throw new AppError("PROVIDER_ERROR", "Gagal mengambil lelucon.", 502);
      return json({ category: r.category, type: r.type, joke: r.joke ?? null, setup: r.setup ?? null, delivery: r.delivery ?? null });
    },
  }),
  E({
    id: "fun/fact",
    group: "Fun",
    name: "Random Fact",
    description: "Fakta unik acak (bahasa Inggris/Jerman).",
    tier: "free",
    provider: "Useless Facts",
    params: [{ name: "lang", type: "enum", options: ["en", "de"], default: "en", description: "Bahasa." }],
    example: { fact: "Honey never spoils.", source: "https://..." },
    handler: async ({ params }) => {
      const r = await providerJson<{ text: string; source_url?: string }>(`https://uselessfacts.jsph.pl/api/v2/facts/random?language=${params.lang || "en"}`);
      return json({ fact: r.text, source: r.source_url ?? null });
    },
  }),
  E({
    id: "fun/truth",
    group: "Fun",
    name: "Truth",
    description: "Pertanyaan truth acak untuk game Truth or Dare.",
    tier: "free",
    params: [],
    example: { truth: "Apa ketakutan terbesarmu?" },
    handler: async () => json({ truth: pick(TRUTHS) }),
  }),
  E({
    id: "fun/dare",
    group: "Fun",
    name: "Dare",
    description: "Tantangan dare acak untuk game Truth or Dare.",
    tier: "free",
    params: [],
    example: { dare: "Kirim stiker paling aneh yang kamu punya ke grup." },
    handler: async () => json({ dare: pick(DARES) }),
  }),
  E({
    id: "quotes/random",
    group: "Quotes",
    name: "Random Quotes",
    description: "Kutipan tokoh acak, bisa difilter berdasarkan tag.",
    tier: "free",
    params: [{ name: "tag", type: "enum", options: ["any", ...Array.from(new Set(QUOTES.map((q) => q.tag)))], default: "any", description: "Tag kutipan." }],
    example: { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds", tag: "programming" },
    handler: async ({ params }) => {
      const pool = params.tag && params.tag !== "any" ? QUOTES.filter((q) => q.tag === params.tag) : QUOTES;
      return json(pick(pool));
    },
  }),
  // ---------------- Game ----------------
  E({
    id: "game/trivia",
    group: "Game",
    name: "Trivia Quiz",
    description: "Soal kuis pilihan ganda dari Open Trivia Database.",
    tier: "free",
    provider: "Open Trivia DB",
    params: [
      { name: "amount", type: "number", default: "1", description: "Jumlah soal 1–10." },
      { name: "difficulty", type: "enum", options: ["easy", "medium", "hard"], description: "Tingkat kesulitan (opsional)." },
    ],
    example: [{ category: "Science: Computers", difficulty: "easy", question: "What does CPU stand for?", options: ["Central Processing Unit", "..."], answer: "Central Processing Unit" }],
    handler: async ({ params }) => {
      const amount = clampInt(params.amount, 1, 1, 10);
      const diff = params.difficulty ? `&difficulty=${params.difficulty}` : "";
      const r = await providerJson<{ response_code: number; results: { category: string; difficulty: string; question: string; correct_answer: string; incorrect_answers: string[] }[] }>(
        `https://opentdb.com/api.php?amount=${amount}&type=multiple&encode=url3986${diff}`,
      );
      if (r.response_code !== 0) throw new AppError("PROVIDER_RATE_LIMITED", "Bank soal sedang membatasi permintaan. Coba lagi 5 detik lagi.", 503);
      const d = decodeURIComponent;
      return json(
        r.results.map((q) => {
          const options = [...q.incorrect_answers.map(d), d(q.correct_answer)].sort(() => Math.random() - 0.5);
          return { category: d(q.category), difficulty: q.difficulty, question: d(q.question), options, answer: d(q.correct_answer) };
        }),
      );
    },
  }),
  E({
    id: "game/tebak-tebakan",
    group: "Game",
    name: "Tebak-tebakan",
    description: "Teka-teki/tebak-tebakan bahasa Indonesia beserta jawaban.",
    tier: "free",
    params: [],
    example: { question: "Apa yang punya gigi tapi tidak bisa menggigit?", answer: "Sisir" },
    handler: async () => {
      const r = pick(RIDDLES);
      return json({ question: r.q, answer: r.a });
    },
  }),
  E({
    id: "game/math",
    group: "Game",
    name: "Math Quiz",
    description: "Soal matematika acak beserta jawaban, untuk game bot.",
    tier: "free",
    params: [{ name: "level", type: "enum", options: ["easy", "medium", "hard"], default: "easy", description: "Tingkat kesulitan." }],
    example: { question: "12 × 7 = ?", answer: 84, level: "easy" },
    handler: async ({ params }) => {
      const lvl = params.level || "easy";
      const max = lvl === "easy" ? 20 : lvl === "medium" ? 100 : 1000;
      const r = (n: number) => 1 + Math.floor(Math.random() * n);
      const ops = lvl === "easy" ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
      const op = pick(ops);
      let a = r(max);
      let b = r(op === "×" ? Math.min(max, lvl === "hard" ? 99 : 12) : max);
      let answer: number;
      if (op === "÷") {
        answer = r(lvl === "hard" ? 99 : 12);
        a = answer * b;
      } else answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
      if (op === "-" && answer < 0 && lvl === "easy") {
        [a, b] = [b, a];
        answer = a - b;
      }
      return json({ question: `${a} ${op} ${b} = ?`, answer, level: lvl });
    },
  }),
  // ---------------- Meme ----------------
  E({
    id: "meme/generate",
    group: "Meme",
    name: "Meme Generator",
    description: "Buat meme dari template populer dengan teks atas/bawah.",
    tier: "free",
    provider: "Memegen.link",
    response: "image",
    params: [
      { name: "template", type: "string", required: true, description: "ID template (lihat /meme/templates).", example: "drake", max: 40 },
      { name: "top", type: "string", description: "Teks atas.", example: "Pakai scraping manual", max: 120 },
      { name: "bottom", type: "string", description: "Teks bawah.", example: "Pakai FxB RestApi", max: 120 },
    ],
    example: "(binary image/png)",
    handler: async ({ params }) => {
      if (!/^[a-z0-9_-]{1,40}$/i.test(params.template)) throw new AppError("BAD_REQUEST", "Template tidak valid.");
      const r = await providerFetch(`https://api.memegen.link/images/${params.template}/${memegenText(params.top ?? "")}/${memegenText(params.bottom ?? "")}.png`);
      if (r.status === 404) throw new AppError("NOT_FOUND", "Template tidak ditemukan.", 404);
      if (!r.ok) throw new AppError("PROVIDER_ERROR", "Gagal membuat meme.", 502);
      return binary(new Uint8Array(await r.arrayBuffer()), "image/png");
    },
  }),
  E({
    id: "meme/templates",
    group: "Meme",
    name: "Meme Templates",
    description: "Daftar template meme yang tersedia.",
    tier: "free",
    provider: "Memegen.link",
    params: [],
    example: [{ id: "drake", name: "Drakeposting", lines: 2, example: "https://api.memegen.link/images/drake.png" }],
    handler: async () => {
      const r = await providerJson<{ id: string; name: string; lines: number; blank: string }[]>("https://api.memegen.link/templates/");
      return json(r.map((t) => ({ id: t.id, name: t.name, lines: t.lines, example: t.blank })));
    },
  }),
  E({
    id: "meme/random",
    group: "Meme",
    name: "Random Meme",
    description: "Meme acak dari subreddit populer (konten NSFW disaring).",
    tier: "free",
    provider: "Meme API",
    params: [{ name: "subreddit", type: "enum", options: ["memes", "dankmemes", "wholesomememes", "ProgrammerHumor", "indonesia"], default: "memes", description: "Sumber." }],
    example: { title: "When the code works", url: "https://i.redd.it/....png", subreddit: "ProgrammerHumor", author: "user", ups: 1200, link: "https://redd.it/..." },
    handler: async ({ params }) => {
      const r = await providerJson<{ memes: { title: string; url: string; subreddit: string; author: string; ups: number; postLink: string; nsfw: boolean; spoiler: boolean }[] }>(
        `https://meme-api.com/gimme/${params.subreddit || "memes"}/10`,
      );
      const safe = r.memes.filter((m) => !m.nsfw && !m.spoiler);
      if (!safe.length) throw new AppError("NOT_FOUND", "Tidak ada meme aman saat ini. Coba lagi.", 404);
      const m = pick(safe);
      return json({ title: m.title, url: m.url, subreddit: m.subreddit, author: m.author, ups: m.ups, link: m.postLink });
    },
  }),
  // ---------------- Anime ----------------
  E({
    id: "anime/search",
    group: "Anime",
    name: "Anime Search",
    description: "Cari anime (judul, skor, episode, sinopsis) dari MyAnimeList via Jikan.",
    tier: "free",
    provider: "Jikan (MyAnimeList)",
    params: [qParam("one piece")],
    example: [{ id: 21, title: "One Piece", type: "TV", episodes: null, score: 8.7, status: "Currently Airing", year: 1999, image: "https://...", url: "https://myanimelist.net/anime/21", synopsis: "..." }],
    handler: async ({ params }) => {
      const r = await providerJson<{ data: Record<string, unknown>[] }>(`https://api.jikan.moe/v4/anime?sfw=true&limit=8&q=${encodeURIComponent(params.q)}`);
      return json(r.data.map(mapAnime));
    },
  }),
  E({
    id: "anime/top",
    group: "Anime",
    name: "Top Anime",
    description: "Daftar anime teratas (airing, upcoming, atau populer).",
    tier: "free",
    provider: "Jikan (MyAnimeList)",
    params: [{ name: "filter", type: "enum", options: ["airing", "upcoming", "bypopularity", "favorite"], default: "airing", description: "Filter." }],
    example: [{ id: 52991, title: "Sousou no Frieren", score: 9.3 }],
    handler: async ({ params }) => {
      const r = await providerJson<{ data: Record<string, unknown>[] }>(`https://api.jikan.moe/v4/top/anime?sfw=true&limit=15&filter=${params.filter || "airing"}`);
      return json(r.data.map(mapAnime));
    },
  }),
  E({
    id: "anime/image",
    group: "Anime",
    name: "Anime Image / Reaction",
    description: "Gambar/GIF anime SFW acak per kategori (waifu, neko, hug, pat, dll).",
    tier: "free",
    provider: "waifu.pics",
    params: [{ name: "type", type: "enum", options: ["waifu", "neko", "shinobu", "megumin", "hug", "pat", "smile", "wave", "happy", "dance", "cry", "wink"], default: "waifu", description: "Kategori." }],
    example: { type: "waifu", url: "https://i.waifu.pics/abc.jpg" },
    handler: async ({ params }) => {
      const r = await providerJson<{ url: string }>(`https://api.waifu.pics/sfw/${params.type || "waifu"}`);
      return json({ type: params.type || "waifu", url: r.url });
    },
  }),
  // ---------------- Komik ----------------
  E({
    id: "komik/search",
    group: "Komik",
    name: "Komik / Manga Search",
    description: "Cari manga, manhwa, manhua di MangaDex (konten aman).",
    tier: "free",
    provider: "MangaDex",
    params: [qParam("solo leveling")],
    example: [{ id: "32d76d19-...", title: "Solo Leveling", status: "completed", year: 2018, tags: ["Action"], cover: "https://uploads.mangadex.org/covers/...", description: "..." }],
    handler: async ({ params }) => {
      const r = await providerJson<{ data: MdManga[] }>(
        `https://api.mangadex.org/manga?limit=8&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&title=${encodeURIComponent(params.q)}`,
      );
      return json(r.data.map(mapManga));
    },
  }),
  E({
    id: "komik/chapters",
    group: "Komik",
    name: "Komik Chapters",
    description: "Daftar chapter terbaru sebuah manga (EN/ID) dari MangaDex.",
    tier: "free",
    provider: "MangaDex",
    params: [
      { name: "id", type: "string", required: true, description: "ID manga dari /komik/search.", example: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0", max: 64 },
      { name: "lang", type: "enum", options: ["en", "id"], default: "en", description: "Bahasa terjemahan." },
    ],
    example: [{ id: "...", chapter: "200", title: "Epilogue", pages: 30, published: "2023-01-01T00:00:00Z", url: "https://mangadex.org/chapter/..." }],
    handler: async ({ params }) => {
      if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw new AppError("BAD_REQUEST", "ID manga tidak valid.");
      const r = await providerJson<{ data: { id: string; attributes: { chapter: string | null; title: string | null; pages: number; publishAt: string } }[] }>(
        `https://api.mangadex.org/manga/${params.id}/feed?limit=30&order[chapter]=desc&translatedLanguage[]=${params.lang || "en"}&contentRating[]=safe&contentRating[]=suggestive`,
      );
      return json(r.data.map((c) => ({ id: c.id, chapter: c.attributes.chapter, title: c.attributes.title, pages: c.attributes.pages, published: c.attributes.publishAt, url: `https://mangadex.org/chapter/${c.id}` })));
    },
  }),
  // ---------------- Music ----------------
  E({
    id: "music/search",
    group: "Music",
    name: "Music Search",
    description: "Cari lagu (judul, artis, album, preview 30 detik, artwork) dari iTunes.",
    tier: "free",
    provider: "iTunes Search API",
    params: [qParam("tulus hati-hati di jalan")],
    example: [{ title: "Hati-Hati di Jalan", artist: "Tulus", album: "Manusia", duration: 242, preview: "https://audio-ssl.itunes.apple.com/....m4a", artwork: "https://...", url: "https://music.apple.com/..." }],
    handler: async ({ params }) => {
      const r = await providerJson<{ results: Record<string, unknown>[] }>(`https://itunes.apple.com/search?media=music&entity=song&limit=10&country=ID&term=${encodeURIComponent(params.q)}`);
      return json(
        r.results.map((t) => ({
          title: t.trackName, artist: t.artistName, album: t.collectionName, genre: t.primaryGenreName,
          duration: Math.round(Number(t.trackTimeMillis ?? 0) / 1000), release: t.releaseDate, preview: t.previewUrl ?? null,
          artwork: typeof t.artworkUrl100 === "string" ? t.artworkUrl100.replace("100x100", "600x600") : null, url: t.trackViewUrl,
        })),
      );
    },
  }),
  E({
    id: "music/lyrics",
    group: "Music",
    name: "Lyrics",
    description: "Ambil lirik lagu berdasarkan artis & judul.",
    tier: "free",
    provider: "lyrics.ovh",
    params: [
      { name: "artist", type: "string", required: true, description: "Nama artis.", example: "Coldplay", max: 100 },
      { name: "title", type: "string", required: true, description: "Judul lagu.", example: "Yellow", max: 150 },
    ],
    example: { artist: "Coldplay", title: "Yellow", lyrics: "Look at the stars..." },
    handler: async ({ params }) => {
      const r = await providerFetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(params.artist)}/${encodeURIComponent(params.title)}`, { timeoutMs: 15_000 });
      if (r.status === 404) throw new AppError("NOT_FOUND", "Lirik tidak ditemukan.", 404);
      if (!r.ok) throw new AppError("PROVIDER_ERROR", "Layanan lirik sedang bermasalah.", 502);
      const b = (await r.json()) as { lyrics?: string };
      if (!b.lyrics) throw new AppError("NOT_FOUND", "Lirik tidak ditemukan.", 404);
      return json({ artist: params.artist, title: params.title, lyrics: b.lyrics.replace(/\r\n/g, "\n").trim() });
    },
  }),
  // ---------------- Random images ----------------
  E({
    id: "random/image",
    group: "Random",
    name: "Random Animal Image",
    description: "Gambar hewan acak: kucing, anjing, rubah, bebek.",
    tier: "free",
    provider: "TheCatAPI / Dog CEO / RandomFox / Random-d.uk",
    params: [{ name: "type", type: "enum", options: ["cat", "dog", "fox", "duck"], default: "cat", description: "Jenis hewan." }],
    example: { type: "cat", url: "https://cdn2.thecatapi.com/images/abc.jpg" },
    handler: async ({ params }) => {
      const type = params.type || "cat";
      let url: string;
      if (type === "dog") url = (await providerJson<{ message: string }>("https://dog.ceo/api/breeds/image/random")).message;
      else if (type === "fox") url = (await providerJson<{ image: string }>("https://randomfox.ca/floof/")).image;
      else if (type === "duck") url = (await providerJson<{ url: string }>("https://random-d.uk/api/v2/random")).url;
      else url = (await providerJson<{ url: string }[]>("https://api.thecatapi.com/v1/images/search"))[0]?.url;
      if (!url) throw new AppError("PROVIDER_ERROR", "Gagal mengambil gambar.", 502);
      return json({ type, url });
    },
  }),
];

function mapAnime(a: Record<string, unknown>) {
  const img = (a.images as { jpg?: { large_image_url?: string; image_url?: string } } | undefined)?.jpg;
  return {
    id: a.mal_id, title: a.title, title_english: a.title_english ?? null, type: a.type, episodes: a.episodes, score: a.score,
    status: a.status, year: a.year, rating: a.rating, genres: ((a.genres as { name: string }[]) ?? []).map((g) => g.name),
    image: img?.large_image_url ?? img?.image_url ?? null, url: a.url, synopsis: a.synopsis,
  };
}

interface MdManga {
  id: string;
  attributes: { title: Record<string, string>; description: Record<string, string>; status: string; year: number | null; tags: { attributes: { name: { en: string } } }[] };
  relationships: { type: string; attributes?: { fileName?: string } }[];
}
function mapManga(m: MdManga) {
  const cover = m.relationships.find((r) => r.type === "cover_art")?.attributes?.fileName;
  return {
    id: m.id,
    title: m.attributes.title.en ?? Object.values(m.attributes.title)[0],
    status: m.attributes.status,
    year: m.attributes.year,
    tags: m.attributes.tags.map((t) => t.attributes.name.en).slice(0, 8),
    cover: cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover}.512.jpg` : null,
    description: (m.attributes.description.id ?? m.attributes.description.en ?? "").slice(0, 600),
    url: `https://mangadex.org/title/${m.id}`,
  };
}
