"use client";

import { Download, Image as ImageIcon, KeyRound, ShieldCheck, Smile, Sparkles, Wrench, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CodeBlock, PageTransition, SectionLabel, Steps } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export default function GuidePage() {
  const { lang } = useApp();
  const id = lang === "id";
  const [origin, setOrigin] = useState("https://your-domain");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[30px] font-extrabold">{id ? "Panduan" : "Guide"}</h1>
        <p className="mt-1 text-[15px] text-muted">{id ? "Fitur, cara kerja, FAQ, dan troubleshooting FxB RestApi." : "Features, how it works, FAQ and troubleshooting."}</p>

        <section id="features" className="scroll-mt-24">
          <SectionLabel>{id ? "Fitur" : "Features"}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [Download, "Downloader", id ? "TikTok (video/foto/audio), Instagram, YouTube, Facebook, Pinterest, X, SoundCloud, AIO." : "TikTok, Instagram, YouTube, Facebook, Pinterest, X, SoundCloud, AIO."],
              [Sparkles, "AI", id ? "Chat, coding, asisten multi-turn, translate, summarize, text generator, multi-model." : "Chat, coding, multi-turn assistant, translate, summarize, generator, multi-model."],
              [ImageIcon, "AI Image", id ? "Text to image, style generator, img2img, remove background, upscale, enhance." : "Text to image, styles, img2img, background removal, upscale, enhance."],
              [Smile, "Entertainment", id ? "Joke, fakta, truth/dare, trivia, tebak-tebakan, quote card, TTP, meme, anime, komik, musik, lirik." : "Jokes, facts, truth/dare, trivia, riddles, quote cards, memes, anime, manga, music, lyrics."],
              [Wrench, "Stalker & Tools", id ? "Profil GitHub/TikTok/npm, metadata web, DNS, WHOIS, IP, shortener, QR, screenshot, encoder, hash, JSON, upload, cuaca, kurs." : "GitHub/TikTok/npm profiles, metadata, DNS, WHOIS, IP, shortener, QR, screenshot, encoders, upload, weather, currency."],
              [ShieldCheck, id ? "Keamanan" : "Security", id ? "Key di-hash SHA-256, rate limit per menit & harian, proteksi SSRF, webhook terverifikasi." : "SHA-256 hashed keys, per-minute & daily limits, SSRF protection, verified webhooks."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Download;
              return (
                <Card key={title as string} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-soft text-mint"><I className="size-5" /></span>
                  <div><div className="font-semibold">{title as string}</div><p className="mt-0.5 text-[14px] text-muted">{text as string}</p></div>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="how" className="scroll-mt-24">
          <SectionLabel>{id ? "Cara kerja" : "How it works"}</SectionLabel>
          <Card>
            <Steps
              steps={[
                { label: id ? "Daftar & dapatkan key" : "Sign up & get a key", sub: id ? "Key free dibuat otomatis saat daftar." : "A free key is created on sign-up.", state: "done" },
                { label: id ? "Kirim request" : "Send a request", sub: "GET/POST /api/v1/{kategori}/{endpoint}", state: "done" },
                { label: id ? "Server memvalidasi" : "Server validates", sub: id ? "Key, tier, limit, lalu parameter." : "Key, tier, limits, then params.", state: "done" },
                { label: id ? "Terima JSON" : "Receive JSON", sub: '{ "status": true, "creator": "FELIXIORITY", "result": … }', state: "done" },
              ]}
            />
          </Card>
          <CodeBlock
            className="mt-3"
            lang="javascript"
            code={`// Node.js / bot WhatsApp & Telegram\nconst API = "${origin}/api/v1";\nconst KEY = process.env.FXB_API_KEY;\n\nasync function fxb(path, params = {}) {\n  const res = await fetch(\`\${API}/\${path}?\` + new URLSearchParams(params), {\n    headers: { "X-API-Key": KEY },\n  });\n  const data = await res.json();\n  if (!data.status) throw new Error(data.error.message);\n  return data.result;\n}\n\nconst video = await fxb("downloader/tiktok", { url: "https://vt.tiktok.com/..." });\nconsole.log(video.video.nowm);`}
          />
        </section>

        <section id="faq" className="scroll-mt-24">
          <SectionLabel>FAQ</SectionLabel>
          <div className="space-y-3">
            {(id
              ? [
                  ["Apakah gratis?", "Ya. Key free punya limit harian dan hanya bisa memakai endpoint free. Premium membuka semua endpoint dan limit lebih besar."],
                  ["Kenapa sebuah endpoint berstatus 'Belum aktif'?", "Endpoint itu butuh penyedia eksternal (mis. AI, remove.bg, Cobalt) yang kredensialnya belum diatur admin. Kami tidak berpura-pura endpoint berfungsi."],
                  ["Di mana key saya disimpan?", "Hanya hash SHA-256 yang disimpan. Key asli ditampilkan sekali saat dibuat; jika hilang, gunakan 'Buat ulang'."],
                  ["Bisa dipakai dari browser (frontend)?", "Bisa (CORS aktif), tapi jangan taruh key premium di kode frontend publik. Panggil dari server/bot."],
                  ["Kapan limit reset?", "Setiap 00:00 WIB. Cek header X-RateLimit-Remaining dan X-RateLimit-Reset."],
                ]
              : [
                  ["Is it free?", "Yes. Free keys have a daily limit and access free endpoints only. Premium unlocks everything with higher limits."],
                  ["Why is an endpoint 'Not configured'?", "It needs an external provider (AI, remove.bg, Cobalt…) whose credentials the admin hasn't set. We never pretend an endpoint works."],
                  ["How is my key stored?", "Only a SHA-256 hash is stored. The key is shown once; use 'Regenerate' if lost."],
                  ["Can I call it from the browser?", "Yes (CORS enabled), but don't embed premium keys in public frontend code."],
                  ["When do limits reset?", "Daily at 00:00 WIB (UTC+7). See X-RateLimit-Remaining and X-RateLimit-Reset headers."],
                ]
            ).map(([q, a]) => (
              <details key={q} className="group rounded-[22px] bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<span className="text-muted transition group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-[14.5px] text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="tips" className="scroll-mt-24">
          <SectionLabel>{id ? "Tips & troubleshooting" : "Tips & troubleshooting"}</SectionLabel>
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
            {[
              ["401", id ? "Tambahkan ?apikey= atau header X-API-Key. Pastikan key tidak dicabut / sudah dibuat ulang." : "Add ?apikey= or X-API-Key. Make sure the key isn't revoked or regenerated."],
              ["403", id ? "Endpoint premium atau akun ditangguhkan. Upgrade key di Pricing." : "Premium endpoint or suspended account. Upgrade on Pricing."],
              ["429", id ? "Limit tercapai. Hormati header Retry-After, beri jeda antar request di bot." : "Limit reached. Honor Retry-After and space out bot requests."],
              ["400", id ? "Lihat error.details untuk parameter yang salah." : "Check error.details for the invalid parameter."],
              ["502/504", id ? "Penyedia eksternal lambat/gagal. Coba lagi beberapa saat; tidak dihitung sebagai kesalahanmu." : "Upstream provider failed/slow. Retry shortly."],
              ["503", id ? "Endpoint maintenance atau belum dikonfigurasi admin." : "Endpoint in maintenance or not configured."],
            ].map(([c, t]) => (
              <div key={c} className="flex gap-3 px-4 py-3.5 text-[14.5px]"><span className="flex w-16 shrink-0 items-center gap-1 font-mono font-semibold text-danger"><Zap className="size-3.5" />{c}</span><span className="text-muted">{t}</span></div>
            ))}
          </div>
          <Card className="mt-3 flex items-center gap-3 text-[14px] text-muted"><KeyRound className="size-5 shrink-0 text-mint" />{id ? "Simpan key di variabel lingkungan (.env), bukan di repository publik." : "Keep keys in environment variables, not in public repositories."}</Card>
        </section>
        <p className="mt-10 text-center text-[13px] text-subtle">{BRAND.name} · {BRAND.developer}</p>
      </div>
    </PageTransition>
  );
}
