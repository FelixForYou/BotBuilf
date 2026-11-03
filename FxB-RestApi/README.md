# FxB RestApi — by FELIXIORITY

Layanan REST API publik untuk developer bot Telegram, WhatsApp, website, dan aplikasi.
Satu API key untuk **Downloader**, **AI**, **AI Image**, **Entertainment**, dan **Stalker & Tools**,
dengan sistem **API key Free & Premium**, **pembayaran (Midtrans / Xendit / transfer manual)**,
**dashboard pengguna**, **dashboard admin**, dan **dokumentasi interaktif** (Try API + OpenAPI 3.1).

UI mengikuti gaya screenshot referensi: latar hitam pekat, kartu abu gelap dengan sudut besar,
aksen mint, tombol pill besar, drawer "Menu", bottom sheet "Create · Step 1 of 2", step indicator
ala layar build, kartu gagal dengan ikon power merah + "Hide details / Copy details", tur onboarding,
serta tombol bantuan smiley mengambang.

---

## Isi

| Area | Yang tersedia |
| --- | --- |
| Gateway API | `GET/POST /api/v1/{kategori}/{endpoint}` — autentikasi `?apikey=` / `X-API-Key` / `Authorization: Bearer`, cek tier, rate limit per menit & harian (reset 00:00 WIB), validasi parameter, log request, CORS, header `X-RateLimit-*` |
| Endpoint | 64 endpoint (lihat `/docs` atau `/api/openapi.json`) |
| Free key | Dibuat sendiri oleh user, limit harian, hanya endpoint free, statistik |
| Premium | Paket (harga, masa aktif, limit) dikelola admin; order → invoice → pembayaran → aktif otomatis via webhook terverifikasi; upgrade, perpanjangan (sisa masa aktif ditambahkan), revoke, regenerate |
| Halaman | Home, Dokumentasi, Detail endpoint (Try API, Copy, contoh kode cURL/JS/Python/PHP), API Explorer, Kategori, Pricing + Checkout, Login/Register, Dashboard, API Key Manager, Statistik, Riwayat Order + Invoice, Pengaturan, Panduan/FAQ, Privacy, Terms |
| Admin | Ringkasan statistik, pengguna (role/tangguhkan/hapus), API key (tier/paket/limit/kedaluwarsa/revoke), endpoint (on/off, ganti tier, catatan maintenance), paket, pembayaran (verifikasi manual), pengaturan limit & status provider |

### Daftar endpoint

- **Downloader** — `downloader/tiktok` (video tanpa WM, foto slide, audio), `tiktok-audio`, `instagram`, `youtube`*, `facebook`, `pinterest`, `twitter`, `soundcloud`, `aio`*
- **AI** — `ai/models`, `ai/chat`, `ai/assistant`* (multi-turn), `ai/code`*, `ai/translate`, `ai/summarize`, `ai/generate`*, `ai/translate-basic` (MyMemory, tanpa AI)
- **AI Image** — `ai-image/text2img`, `ai-image/generator` (preset gaya), `ai-image/img2img`*, `ai-image/removebg`*, `ai-image/upscale`*, `ai-image/enhance`*
- **Entertainment** — `fun/joke`, `fun/fact`, `fun/truth`, `fun/dare`, `quotes/random`, `game/trivia`, `game/tebak-tebakan`, `game/math`, `maker/quote-card`, `maker/ttp`, `meme/generate`, `meme/templates`, `meme/random`, `anime/search`, `anime/top`, `anime/image`, `komik/search`, `komik/chapters`, `music/search`, `music/lyrics`, `random/image`
- **Stalker & Tools** — `stalk/github`, `stalk/tiktok`, `stalk/npm`, `tools/metadata`, `tools/dns`, `tools/whois`, `tools/ip`, `tools/shorten`, `tools/qrcode`, `tools/screenshot`*, `tools/encode`, `tools/hash`, `tools/json-format`, `tools/uuid`, `tools/password`, `tools/weather`, `tools/currency`, `tools/upload`, `tools/upload-image`, `tools/image-resize`

`*` = premium secara default (admin bisa mengubah tier endpoint mana pun dari dashboard).

### Kejujuran soal provider

Endpoint yang butuh layanan eksternal **tidak berpura-pura berfungsi**. Bila kredensial belum diisi,
endpoint tampil **"Belum aktif"** di dokumentasi dan gateway membalas `503 PROVIDER_UNAVAILABLE`.

| Butuh konfigurasi | Endpoint |
| --- | --- |
| `ANTHROPIC_API_KEY` dan/atau `OPENAI_COMPAT_*` | semua `ai/*` kecuali `ai/models` & `ai/translate-basic` |
| `COBALT_API_URL` (instance Cobalt sendiri) | Instagram, YouTube, Facebook, Pinterest, X, SoundCloud, AIO |
| `REMOVEBG_API_KEY` | `ai-image/removebg` |
| `REPLICATE_API_TOKEN` + `REPLICATE_*_MODEL` | `ai-image/img2img`, `upscale`, `enhance` |

Endpoint lain memakai API publik yang sah tanpa kunci (TikWM, Pollinations, Jikan, MangaDex, iTunes,
lyrics.ovh, JokeAPI, Open Trivia DB, Memegen, Open-Meteo, Frankfurter, ipwho.is, Cloudflare DoH, RDAP,
GitHub API, npm registry, Microlink) atau diproses lokal (QR, maker, hash, encoder, JSON, resize, upload,
shortener). Ketersediaan API publik pihak ketiga bisa berubah; kegagalan dibalas dengan error yang jelas
(`502 PROVIDER_ERROR` / `504 PROVIDER_TIMEOUT` / `503 PROVIDER_RATE_LIMITED`).

---

## Teknologi

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Motion (Framer Motion) · Lucide · Turso/libSQL
(`@libsql/client`, file SQLite saat lokal) · Anthropic SDK resmi · sharp · qrcode · `next/og` · Vitest.

```
FxB-RestApi/
├─ app/
│  ├─ api/v1/[...path]/route.ts   ← gateway publik
│  ├─ api/auth|account|keys|usage|plans|orders|catalog|stats|openapi.json
│  ├─ api/payments/midtrans|xendit ← webhook
│  ├─ api/admin/*                  ← API admin
│  ├─ s/[code] (short link), f/[id] (file upload)
│  └─ (halaman) docs, explorer, categories, pricing, dashboard/*, admin/*, guide, legal/*
├─ components/                     ← design system (ui.tsx), shell (top bar, drawer, tur), runner (Try API)
├─ lib/
│  ├─ gateway.ts   auth key + tier + limit + validasi + log
│  ├─ endpoints/   registry, definisi endpoint per kategori, OpenAPI generator
│  ├─ providers/   AI (Claude & OpenAI-compatible), Cobalt, Replicate
│  ├─ payments.ts  order, Midtrans, Xendit, aktivasi premium idempoten
│  ├─ net.ts       fetch anti-SSRF (DNS dipaku, redirect divalidasi ulang)
│  └─ db.ts / schema.ts / auth.ts / keys.ts / limits.ts / settings.ts
└─ tests/          vitest
```

Skema database dibuat otomatis saat request pertama (tidak perlu migrasi manual). Paket awal
(Starter/Pro/Ultimate) di-seed sekali bila tabel paket kosong dan bisa diubah/dihapus dari admin.

---

## Menjalankan lokal

Butuh Node.js ≥ 20.9.

```bash
cd FxB-RestApi
npm install
cp .env.example .env.local   # isi SESSION_SECRET; sisanya opsional
npm run dev                  # http://localhost:3000
```

Tanpa `TURSO_DATABASE_URL`, data disimpan di `FxB-RestApi/data/fxb.db`.
User pertama yang mendaftar menjadi **admin** (atau email yang sama dengan `ADMIN_EMAIL`).

```bash
npm test          # unit test
npm run typecheck
npm run build && npm start
```

---

## Deploy ke Vercel + Turso

1. **Database Turso**
   ```bash
   turso db create fxb-restapi
   turso db show fxb-restapi --url        # → TURSO_DATABASE_URL
   turso db tokens create fxb-restapi     # → TURSO_AUTH_TOKEN
   ```
2. **Vercel** → New Project → import repo ini → **Root Directory = `FxB-RestApi`** (framework Next.js terdeteksi otomatis).
3. Isi Environment Variables minimal: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `APP_URL`, `ADMIN_EMAIL`.
   Tambahkan kredensial provider/pembayaran sesuai kebutuhan (lihat `.env.example`).
4. Deploy, buka situs, daftar dengan `ADMIN_EMAIL` → otomatis admin.
5. Cek **Admin › Pengaturan** untuk melihat provider mana yang sudah aktif.

Route gateway memakai runtime Node.js dengan `maxDuration = 60` detik. Proses berat (AI image, screenshot,
downloader) dijalankan di provider eksternal (Replicate, Microlink, Cobalt), jadi tidak perlu worker
terpisah. Untuk Cobalt, jalankan instance sendiri (Docker) di VPS/Render/Fly lalu isi `COBALT_API_URL`.

### Pembayaran

- **Midtrans (Snap)**: isi `MIDTRANS_SERVER_KEY` (+ `MIDTRANS_IS_PRODUCTION=true` di produksi).
  Di dashboard Midtrans › Settings › Payment › Notification URL: `https://DOMAIN/api/payments/midtrans`.
  Webhook diverifikasi dengan `signature_key` (SHA-512) **dan** dicek ulang ke Status API Midtrans.
- **Xendit (Invoice)**: isi `XENDIT_SECRET_KEY` dan `XENDIT_CALLBACK_TOKEN` (Verification Token dari dashboard Xendit).
  Callback URL invoice: `https://DOMAIN/api/payments/xendit`. Token dibandingkan secara constant-time dan status invoice dicek ulang ke API Xendit.
- **Transfer manual**: isi instruksi di **Admin › Pengaturan**. Admin menekan "Tandai lunas" di **Admin › Pembayaran**.

Aktivasi premium bersifat idempoten (webhook ganda tidak menambah masa aktif dua kali) dan
nominal dibandingkan dengan harga order.

---

## Memakai API

```bash
curl "https://DOMAIN/api/v1/tools/dns?domain=google.com&apikey=fxb_xxx"
curl -H "X-API-Key: fxb_xxx" "https://DOMAIN/api/v1/downloader/tiktok?url=https://vt.tiktok.com/..."
curl -X POST -H "X-API-Key: fxb_xxx" -F "image=@foto.jpg" https://DOMAIN/api/v1/tools/upload-image
```

Respons sukses:

```json
{ "status": true, "creator": "FELIXIORITY", "endpoint": "tools/dns", "result": { ... } }
```

Respons error:

```json
{ "status": false, "creator": "FELIXIORITY", "error": { "code": "RATE_LIMITED", "message": "..." } }
```

| HTTP | Kode |
| --- | --- |
| 400 | `INVALID_PARAMS` (lihat `error.details`) |
| 401 | `API_KEY_REQUIRED`, `INVALID_API_KEY`, `KEY_REVOKED` |
| 403 | `PREMIUM_REQUIRED`, `ACCOUNT_SUSPENDED` |
| 404 | `ENDPOINT_NOT_FOUND`, `NOT_FOUND` |
| 429 | `RATE_LIMITED` (+ `Retry-After`) |
| 502/504 | `PROVIDER_ERROR`, `PROVIDER_TIMEOUT` |
| 503 | `PROVIDER_UNAVAILABLE`, `MAINTENANCE` |

API Explorer & tombol Try API di situs dapat dipakai tanpa menempel key: saat login, request
memakai key terbaik milik user; tanpa login ada kuota uji coba kecil per IP (hanya endpoint free,
hanya dari origin situs sendiri).

---

## Keamanan

- API key hanya disimpan sebagai **SHA-256**; secret ditampilkan sekali (bisa dibuat ulang).
- Password di-hash **scrypt**; sesi = token acak 256-bit di cookie `httpOnly`, `SameSite=Lax`, `Secure` (produksi), hash-nya di database.
- Semua endpoint dashboard/admin yang mengubah data memeriksa **Origin** (CSRF) dan role.
- Brute-force login/registrasi dibatasi; pesan login tidak membocorkan apakah email terdaftar.
- **Anti-SSRF** untuk URL dari pengguna: hanya http/https publik, DNS diresolusi & dipaku ke IP yang lolos
  blocklist (privat, loopback, link-local/metadata cloud, CGNAT, IPv6 ULA, IPv4-mapped), setiap redirect divalidasi ulang, ukuran & waktu dibatasi.
- File upload: ukuran dibatasi, tipe dideteksi dari magic bytes, HTML/SVG/JS tidak pernah disajikan inline,
  disajikan dengan `Content-Security-Policy: sandbox` + `nosniff`.
- Log menyimpan hash IP, bukan IP mentah; parameter request tidak dicatat.

---

© FELIXIORITY — FxB RestApi.
