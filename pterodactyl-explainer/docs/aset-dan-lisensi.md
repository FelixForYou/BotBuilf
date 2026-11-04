# Aset, sumber, dan lisensi

| Aset | Lokasi | Sumber | Lisensi / status |
|---|---|---|---|
| Logo Pterodactyl (mark + wordmark) | `public/svg/pterodactyl-logo-*.svg`, path disalin ke `src/components/Logos.tsx` & `src/data/ptero-wordmark.json` | Repo resmi `pterodactyl/panel/.github/assets/` | Kode repo berlisensi MIT; Pterodactyl® adalah merek pemiliknya. Dipakai hanya untuk identifikasi, bentuk & proporsi tidak diubah. |
| Glyph Telegram & WhatsApp | `simple-icons` (npm) | Simple Icons, diturunkan dari brand resource resmi (telegram.org, Meta brand resources) | CC0-1.0 (ikon); merek milik pemiliknya. Warna resmi #26A5E4 / #25D366. |
| Ikon antarmuka (satu keluarga) | `lucide` (npm), dirender lewat `src/components/Icon.tsx` | lucide.dev | ISC |
| Ilustrasi server, container, CPU, RAM, folder, terminal, jaringan, egg | `src/components/Illustrations.tsx` | Dibuat khusus untuk proyek ini (SVG, dianimasikan per bagian) | Milik proyek |
| Font Inter | `public/fonts/inter-*.woff2` | @fontsource/inter | SIL OFL 1.1 (`public/fonts/LICENSE-Inter.txt`) |
| Font JetBrains Mono | `public/fonts/jetbrains-mono-*.woff2` | @fontsource/jetbrains-mono | SIL OFL 1.1 (`public/fonts/LICENSE-JetBrainsMono.txt`) |
| Narasi (10 berkas) | `public/audio/vo/*.mp3` + `*.words.json` | Direkam dengan Google AI Studio, **Gemini 3.8 Flash TTS (voice replication)**, dari suara yang pemiliknya sudah memberi izin (termasuk rekaman persetujuan yang disyaratkan Google). Timing kata diukur ulang dengan faster-whisper + `scripts/align_words.py` | Audio ber-watermark SynthID dari Google; ikuti ketentuan Gemini API dan izin pemilik suara |
| Narasi TTS awal (cadangan) | `public/audio/vo_tts/` | Microsoft Edge TTS `id-ID-ArdiNeural` (`scripts/gen_tts.py`) | Suara sintetis; tidak dipakai di render final |
| SFX (37 berkas) | `public/audio/sfx/*.wav` | Disintesis secara prosedural oleh `scripts/gen_sfx.py` (noise + oscillator + envelope) | Milik proyek, tanpa sampel pihak ketiga |
| Musik | — | Tidak ada musik (sesuai brief) | — |

Semua data di layar (nama bot "Asisten Bot", log console, grafik, percakapan, file) adalah **fiktif/simulasi**.
Token, sesi, dan kunci hanya ditampilkan sebagai placeholder tersensor; tidak ada nomor pribadi atau kredensial asli.
"Visual explainer by FELIXIORITY" adalah kredit pembuat video; video menyatakan tidak berafiliasi dengan Pterodactyl, Telegram, maupun WhatsApp.
