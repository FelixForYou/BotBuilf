# Storyboard & koreografi (revisi 2)

Revisi ini membangun ulang gerak, bukan mempercepat playback. Prinsip yang dipakai, dipelajari langsung
dari video referensi (dianalisis per 0,1 dtk):

- **Spring berkarakter per objek** (`src/lib/motion.ts`): `SNAP` untuk chip/teks, `POP` untuk elemen kecil,
  `PANEL` untuk kartu berat (overshoot tipis), `WHIP` untuk pan kamera cepat, `GLIDE`/`DRIFT` untuk dolly yang perlu dibaca.
- **Rig kamera berbasis spring yang saling tumpang-tindih**: gerakan berikutnya dimulai sebelum gerakan lama selesai,
  ditambah `breathe()` (orbit halus) agar tidak ada shot yang membeku.
- **Lintasan melengkung 3D** (`arc`): pesan, chip, kartu bergerak lewat depan/belakang kamera, bukan geser lurus.
- **Motion blur terarah dari kecepatan nyata** (`MBlur`, blur pada `Stage`): hanya aktif saat bergerak cepat; teks di layar tetap tajam.
- **Pergantian teks di tempat seperti referensi** (`SwapText`: huruf teracak lalu terkunci).
- **Tanpa crossfade antaradegan**: frame terakhir adegan = frame pertama adegan berikutnya (diverifikasi per titik potong).

## Sambungan antaradegan

| Potong | Teknik | Objek penghubung |
|---|---|---|
| S01 → S02 | lipatan panel + banjir putih | panel melipat jadi tepi → garis jingga = garis waktu |
| S02 → S03 | panel lewat lensa + shape morph | gelombang menyusut jadi titik → titik jadi objek proses |
| S03 → S04 | lens pass | container melesat menembus kamera → permukaan gelap lantai VPS |
| S04 → S05 | match cut | browser Panel terbang ke lensa → jendela Pterodactyl |
| S05 → S06 | wipe oleh garis | garis grafik RAM memanjang, menyeret latar putih |
| S06 → S07 | circle reveal + color morph | gelembung Telegram berubah hijau, dunia hitam mengembang darinya |
| S07 → S08 | card flip ke lensa | kartu status berputar 180°, sisi belakang putih = kartu sumber daya |
| S08 → S09 | shape morph | bar kapasitas menyusut jadi garis bawah → tepi atas console |
| S09 → S10 | split past camera | kartu biaya terbelah melewati kamera → klaster penutup |

Transisi di dalam adegan: lens sweep horizontal (S02) dan vertikal (S09), server berputar memperlihatkan
"baliknya" lalu kamera menembusnya (S01), kamera masuk ke container dan menemukan kode bot (S04),
kartu console berputar dan sisi belakangnya adalah kode bot (S06), egg berubah menjadi container (S08).

## Shot per adegan

| Adegan | Waktu | Koreografi utama |
|---|---|---|
| S01 | 00:00–00:25 | titik mengetik → "Pesan masuk." → gelembung meletup dari teks dan terbang melengkung ke server (kamera whip) → teks teracak jadi "Bot membalas." dan balasan kembali → stopwatch "sekejap" → tarik mundur ke ponsel + lalu lintas pesan → server berputar, kamera menembus sisi belakangnya → aplikasi, perangkat & server datang melengkung → aplikasi berubah bentuk menjadi panel (ikon bot follow-through ke header, isi panel ber-stagger) → judul + logo → panel melipat |
| S02 | 00:25–00:55 | garis waktu memiring ke 3D, penanda meletup → tag Gratis/Open source melengkung naik → kartu kode berdiri dari garis → kontributor berdatangan dan mengorbit → whip ke 2015, angka berputar dengan blur → browser tumbuh dari penanda, baris proses menyala → panel hitam menyapu lensa → pertanyaan, gelombang menyusut |
| S03 | 00:55–01:27 | titik → objek proses → label game/bot tersedot → Program → Proses → container datang dari depan lensa → runtime Node.js → Python → tiga chip berlabuh melengkung → kamera menyusuri cabang Telegram/WhatsApp → kartu kode mengayun masuk → tiga centang → container menembus lensa |
| S04 | 01:27–02:00 | kamera mundur dari lantai VPS → modul berdiri satu per satu (isi beranimasi) → Panel turun dari depan lensa → paket "start" melaju ke Wings, container meletup saat tiba → kamera menyelam ke container, kode bot berjalan → pesan memantul dari Panel lalu berbelok langsung ke bot → Panel melesat ke lensa |
| S05 | 02:00–02:30 | jendela Pterodactyl dari dekat → mundur dan orbit → badan panel membuka jadi grid barrel 2×2; titik belah whip ke console, grafik, file → grid menyatu kembali → dolly ke tombol power, status berganti → garis RAM menyeret latar putih |
| S06 | 02:30–03:02 | garis tertarik ke jendela chat → /jadwal terbang ke proses, balasan kembali → tumpukan kartu kegunaan melayang diagonal → /info terbang ke console dan menjadi baris log → console berputar: sisi belakangnya kode bot → kartu panel masuk → gelembung baru |
| S07 | 03:02–03:31 | gelembung berubah hijau, circle reveal → gelembung masuk ke chat WhatsApp → rantai aplikasi/integrasi/platform tersusun dari tiga arah → garis zona tanggung jawab → rantai melebur jadi dua kartu status → koneksi terputus, pesan belum terbalas → kartu flip ke lensa |
| S08 | 03:31–04:03 | kartu putih menjauh → terbuka jadi tiga lapisan → whip CPU (pesan melintas chip), RAM (blok data jatuh), penyimpanan (berkas melengkung keluar folder) → egg turun, resep mengalir ke daftar → egg jadi container, bot masuk → faktor kapasitas melengkung masuk, bar merespons → bar menyusut |
| S09 | 04:03–04:34 | garis bawah → console mengembang dari garis → error disorot, dolly → baris error terlepas jadi baris kode → perbaikan diketik → dua kartu "tidak" berayun masuk → sapuan vertikal ke hitam → mesin/jaringan/platform melengkung masuk, tautan putus-sambung → kartu biaya → terbelah melewati kamera |
| S10 | 04:34–05:00 | kartu klaster datang dari kiri bawah, klaster terus reshuffle diagonal, kamera melacak kartu yang disebut → pesan terakhir menyinggahi chat → server → container → klaster menyebar melewati kamera → judul, kredit, fade terencana di frame 18.000 |
