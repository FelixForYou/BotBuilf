# Sumber Fakta & Lisensi Aset

## 1. Sumber resmi untuk fakta sejarah dan teknis

Semua fakta di narasi diverifikasi dari repositori resmi proyek Pterodactyl di GitHub
(diakses 4 November 2026). Tidak ada tanggal rilis, pendiri, atau pencapaian lain yang disebut
selain yang tertulis di sumber berikut.

| Klaim di video | Sumber resmi | Kutipan |
|---|---|---|
| Panel pengelolaan server game yang gratis & open source | `pterodactyl/panel` → `README.md` | "Pterodactyl® is a free, open-source game server management panel built with PHP, React, and Go." |
| Sejarah proyek sejak 2015 | `pterodactyl/documentation` → `project/about.md` (bagian License) | "Pterodactyl® Copyright © 2015 Dane Everitt and contributors." |
| Lisensi MIT | `pterodactyl/panel` → `LICENSE.md`; `project/about.md` | "Code released under the MIT License." |
| Dibangun dengan PHP, React, Go | `pterodactyl/panel` → `README.md` | lihat kutipan baris pertama |
| Setiap server berjalan di container terisolasi | `pterodactyl/panel` → `README.md`; `documentation/README.md` | "runs all game servers in isolated Docker containers"; "All servers run in isolated Docker containers…" |
| Wings = control plane / daemon di node yang mengelola server (container) | `pterodactyl/wings` → `README.md` | "Wings is Pterodactyl's server control plane… control all aspects of the server lifecycle." |
| Egg = konfigurasi lingkungan: image Docker + perintah awal (startup) | `pterodactyl/documentation` → `community/config/eggs/creating_a_custom_egg.md` | "…provide a valid docker image, as well as a start command…" |
| Panel juga dipakai komunitas untuk aplikasi non-game (mis. bot) | `pterodactyl/documentation` → `project/introduction.md` | daftar egg komunitas menyertakan "Discord ATLBot" |

Tautan:
- https://github.com/pterodactyl/panel
- https://github.com/pterodactyl/wings
- https://github.com/pterodactyl/documentation (situs: https://pterodactyl.io)

Batasan yang sengaja dijaga di narasi:
- Tidak menjanjikan uptime, keamanan sempurna, atau restart otomatis.
- Tidak menyebut angka RAM minimum.
- "Running" dibedakan dari "terhubung ke platform".
- Pterodactyl tidak disebut sebagai produk resmi/afiliasi WhatsApp atau Telegram.
- Contoh bot, nama, pesan, log, dan grafik adalah fiktif/simulasi; token ditampilkan sebagai `************ (disensor)`.

## 2. Aset visual

| Aset | Sumber | Lisensi / catatan |
|---|---|---|
| Logo Pterodactyl (`public/svg/pterodactyl-logo-*.svg`, `src/data/pterodactyl-logo.json`) | `pterodactyl/panel/.github/assets/logo-light.svg` & `logo-dark.svg` | Merek dagang Pterodactyl®; dipakai apa adanya (bentuk & proporsi asli) untuk identifikasi. |
| Logo Telegram, WhatsApp, Node.js, Python | paket npm `simple-icons` v16 | Data ikon CC0-1.0; logo adalah merek dagang pemiliknya, dipakai hanya untuk identifikasi. |
| Ikon antarmuka | paket npm `lucide-react` (satu keluarga, stroke 1.75) | ISC License |
| Ilustrasi teknis (server rack, container, CPU, RAM, penyimpanan, jaringan, gauge, folder) | dibuat khusus di `src/components/graphics.tsx` (SVG beranimasi) | Bagian dari source proyek ini |
| Font Inter | `@fontsource/inter` (dibundel lokal di `public/fonts`) | SIL Open Font License 1.1 |
| Font JetBrains Mono | `@fontsource/jetbrains-mono` (dibundel lokal) | SIL Open Font License 1.1 |
| UI bergaya Pterodactyl | digambar ulang & disederhanakan dengan React | Tidak memakai tangkapan layar; ditandai "tampilan disederhanakan · data simulasi" |

## 3. Aset audio

| Aset | Sumber | Lisensi / catatan |
|---|---|---|
| SFX (`public/audio/sfx/*.wav`, 45 file) | disintesis prosedural oleh `scripts/make_sfx.py` (numpy/scipy) | Dibuat sendiri, tanpa sampel pihak ketiga |
| Narasi (`narration/lines/*.wav`, `public/audio/narration.wav`) | TTS Piper, model `id_ID-news_tts-medium` (paket sherpa-onnx `vits-piper-id_ID-news_tts-medium`), lalu dikonversi ke register suara laki-laki dengan vocoder WORLD (`pyworld`) oleh `scripts/tts_narration.py` | Periksa lisensi dataset model sebelum penggunaan komersial. Dapat diganti rekaman suara manusia (lihat README). |
| Musik | — | Tidak ada musik (sesuai brief) |
