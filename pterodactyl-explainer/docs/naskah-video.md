# Naskah Video — Pterodactyl Panel untuk Bot Telegram & WhatsApp

Durasi 5:00 · 1920×1080 · 60 fps · Bahasa Indonesia

Narasi dibacakan dengan suara hasil voice replication (Gemini 3.8 Flash TTS). Kolom *Narasi* berisi naskah voice-over (607 kata) ; waktunya mengikuti rekaman final.

Semua data di layar (nama bot, log, grafik, percakapan) adalah simulasi. Video tidak berafiliasi dengan Pterodactyl, Telegram, maupun WhatsApp.

## 1. Pembuka — di balik balasan bot  ·  0:01–0:21

**Visual:** Latar putih. Titik mengetik, lalu teks kecil "Pesan masuk." muncul dengan efek blur. Gelembung Telegram meletup dari posisi teks dan terbang melengkung ke ikon server; kamera mengikuti. Teks teracak berubah menjadi "Bot membalas." dan gelembung balasan kembali. Stopwatch berputar ("sekejap"). Kamera mundur memperlihatkan ponsel dengan chat yang terus bertambah. Server berputar memperlihatkan sisi belakangnya, kamera menembusnya ke dunia hitam dengan gelombang jingga. Aplikasi bot, perangkat, dan server aktif muncul; aplikasi berubah bentuk menjadi panel pengelolaan. Judul dan logo Pterodactyl. Panel melipat menjadi garis jingga.

**Teks di layar:**
- Pesan masuk.
- Bot membalas.
- Sekejap. / Terlihat sederhana.
- Apa yang bekerja di baliknya?
- Aplikasi yang terus berjalan
- mengawasi aplikasi → dengan sebuah panel
- PTERODACTYL PANEL

**Narasi:** Pesan masuk. Bot membalas. Hanya butuh sekejap. Di layar, semuanya terlihat sederhana. Tapi, apa sebenarnya yang bekerja di baliknya? Setiap bot adalah aplikasi yang harus terus berjalan, di sebuah perangkat atau server yang aktif. Untuk mengawasi aplikasi itu, banyak pengelola memakai sebuah panel. Salah satunya: Pterodactyl Panel.

**SFX:** ketikan, pop gelembung, whip, benturan lembut, flip, sapuan lensa, morph, ketukan bertahap

## 2. Asal-usul Pterodactyl  ·  0:23–0:49

**Visual:** Garis jingga menjadi garis waktu yang memiring ke 3D. Logo Pterodactyl; tag "Gratis" dan "Open source" melengkung naik. Kartu kode berdiri dari garis, kontributor berdatangan dan mengorbit. Kamera whip ke penanda 2015, angka berputar. Jendela browser tumbuh dari penanda dengan baris Nyalakan / Matikan / Pantau yang menyala bergantian (tanpa tampilan game). Panel hitam menyapu lensa, gelombang menyusut menjadi titik.

**Teks di layar:**
- Pterodactyl
- Gratis · Open source
- Kode sumber terbuka
- Dikembangkan bersama kontributor
- Open source sejak 2015
- Berawal dari pengelolaan server game.
- Lalu, bagaimana dengan bot?

**Narasi:** Pterodactyl adalah panel pengelolaan server yang gratis dan open source. Artinya, kode sumbernya terbuka untuk dipelajari dan dikembangkan siapa saja. Pengembangannya berjalan terbuka, bersama banyak kontributor. Proyek ini sudah ada sejak tahun 2015. Tujuan awalnya sederhana: mempermudah pengelolaan server game lewat antarmuka web. Menyalakan, mematikan, dan memantau server, cukup dari browser. Lalu, bagaimana dengan bot?

**SFX:** pop tag, flip kartu, ketikan, whip, acakan angka, klik tombol, sapuan lensa

## 3. Dari server game ke aplikasi bot  ·  0:52–1:21

**Visual:** Titik jingga berubah menjadi objek proses. Label "Server game" dan "Bot" tersedot ke dalamnya; label berubah "Program" → "Proses". Container datang dari depan kamera menyelubungi proses; runtime berganti Node.js → Python. Chip dependensi, sumber daya, dan koneksi berlabuh. Cabang ke logo Telegram dan WhatsApp dengan pulsa data. Kartu kode "tetap perlu disesuaikan". Tiga centang. Container melesat menembus lensa.

**Teks di layar:**
- Cara kerja aplikasi
- Program → Proses
- Runtime: Node.js / Python
- Dengan konfigurasi yang sesuai
- tetap perlu disesuaikan
- Lingkungan sesuai. Proses berjalan. Bot terhubung.

**Narasi:** Jawabannya ada pada cara kerja aplikasi. Server game dan bot sama-sama program. Bagi sistem, keduanya adalah proses yang perlu dijalankan dan diawasi. Keduanya butuh lingkungan runtime, misalnya Node.js atau Python, ditambah dependensi, sumber daya, dan koneksi jaringan. Karena itu, dengan konfigurasi yang sesuai, lingkungan yang dikelola Pterodactyl juga bisa menjalankan bot Telegram maupun WhatsApp. Kode botnya tetap perlu disesuaikan. Lingkungan sesuai, proses berjalan, lalu bot terhubung.

**SFX:** morph, acakan teks, latch, whip + benturan kartu, aliran data, flip, centang

## 4. Cara kerjanya secara konseptual  ·  1:23–1:53

**Visual:** Kamera mundur dari lantai VPS; modul CPU, RAM, Penyimpanan, Jaringan berdiri satu per satu. Panel (browser) turun dari depan lensa. Paket "start" melaju ke lapisan Wings; container meletup saat paket tiba. Kamera menyelam ke container dan menemukan kode bot berjalan. Gelembung pesan memantul dari Panel (tanda silang) lalu berbelok langsung ke bot. Panel melesat ke lensa.

**Teks di layar:**
- Server menyediakan tenaga.
- Panel mengelola.
- Container: lingkungan proses terpisah
- Bot menjalankan logika.
- Pesan tidak lewat dashboard panel.
- jalur perintah / jalur pesan

**Narasi:** Mari lihat susunannya. Paling bawah ada VPS, atau mesin server. Di sinilah CPU, RAM, penyimpanan, dan jaringan disediakan. Di atasnya ada Panel, antarmuka pengelolaan yang dibuka lewat browser. Perintah dari Panel diteruskan ke Wings, layanan yang mengelola container di mesin itu. Container memberi lingkungan proses yang terpisah, dan di dalamnya, kode bot berjalan. Pesan dari pengguna tidak lewat dashboard Panel. Pesan mengalir dari layanan Telegram atau WhatsApp, langsung ke aplikasi bot.

**SFX:** benturan modul, sapuan lensa, aliran data, kaca, whip, ketikan panjang, error kecil

## 5. Satu tempat untuk mengawasi bot  ·  1:55–2:24

**Visual:** Jendela Pterodactyl dari dekat lalu mundur. Label "bot Telegram fiktif". Badan panel membuka menjadi grid melengkung 2×2: console (error disorot), grafik CPU & RAM, file manager, kontrol power; titik belahnya bergeser mengikuti bagian yang dibahas. Grid menyatu kembali. Dolly ke tombol Start / Stop / Restart, status berganti. Garis grafik RAM memanjang menyeret latar putih.

**Teks di layar:**
- Satu tempat untuk mengawasi bot.
- Console: output & error
- Grafik CPU & RAM
- CPU rendah bukan jaminan bot cepat
- File manager
- Semua dalam satu tampilan.
- Start · Stop · Restart

**Narasi:** Dari sini terlihat peran utama Panel: satu tempat untuk mengawasi bot. Ambil contoh Asisten Bot, sebuah bot Telegram fiktif. Lewat console, pengelola bisa membaca output dan pesan error dari aplikasi. Grafik CPU dan RAM menunjukkan pemakaian sumber daya, meski angka yang rendah bukan jaminan bot pasti cepat. File manager membantu mengelola berkas. Semuanya terkumpul dalam satu tampilan. Lalu, tombol start, stop, dan restart mengatur jalannya proses.

**SFX:** whip, morph, ketikan, error, aliran data, klik tombol, desis naik

## 6. Keseharian bot Telegram  ·  2:26–2:56

**Visual:** Garis biru tertarik ke jendela chat "Asisten Bot". Perintah /jadwal terbang ke kotak proses (spinner), balasan agenda kembali. Kartu kegunaan menumpuk diagonal. Pesan /info terbang ke console dan menjadi baris log; grafik RAM ikut naik. Kartu console berputar: sisi belakangnya kode bot. Kartu panel masuk. Gelembung "Pesan baru masuk" di tengah.

**Teks di layar:**
- Keseharian Asisten Bot
- Terima · proses · balas
- Menjawab pertanyaan / Mengirim notifikasi / Administrasi komunitas
- Jejak di console
- Balasan berasal dari kode bot
- Panel mengelola prosesnya

**Narasi:** Sekarang, ikuti keseharian Asisten Bot. Seorang pengguna mengirim perintah sederhana, misalnya jadwal, untuk melihat agenda. Aplikasi menerima permintaan itu, memprosesnya, lalu mengirim balasan. Bot seperti ini bisa menjawab pertanyaan, mengirim notifikasi, atau membantu administrasi komunitas. Setiap aktivitas meninggalkan jejak di console, dan pemakaian sumber daya ikut bergerak. Tapi ingat, kemampuan membalas berasal dari kode bot. Panel membantu mengelola proses yang menjalankannya.

**SFX:** ketikan, pop pesan, whip, benturan kartu, lonceng kecil, flip

## 7. Bot WhatsApp dan kebutuhan koneksi  ·  2:58–3:28

**Visual:** Gelembung biru berubah hijau, dunia hitam mengembang darinya. Gelembung masuk ke chat WhatsApp "Info Layanan" (bot informasi fiktif). Rantai Aplikasi bot → Integrasi & autentikasi (kunci tersensor) → Layanan WhatsApp tersusun dari tiga arah, dengan garis zona tanggung jawab. Rantai melebur menjadi dua kartu: Proses aktif dan Koneksi platform. Koneksi berubah terputus, pesan belum terbalas. Kartu berputar ke lensa.

**Teks di layar:**
- Bagaimana dengan WhatsApp?
- Kompatibilitas & koneksi bergantung pada metode integrasi
- Pterodactyl: mengelola proses aplikasi
- Integrasi bot: hubungan dengan platform
- Perhatikan dua hal.
- "Running" belum menjamin bot bisa membalas

**Narasi:** Bagaimana dengan WhatsApp? Misalnya, sebuah bot informasi yang menerima pesan dan menyiapkan jawaban. Aplikasi seperti ini butuh integrasi dan autentikasi, dan kompatibilitas serta koneksinya bergantung pada metode yang digunakan. Pterodactyl mengelola proses aplikasinya, sementara hubungan dengan platform ditangani oleh integrasi bot. Jadi, perhatikan dua hal: proses yang aktif, dan koneksi platform yang terhubung. Status Running saja belum menjamin bot bisa membalas.

**SFX:** morph, whip, latch, benturan kartu, garis, status, error kecil, flip + sapuan lensa

## 8. Sumber daya dan lingkungan aplikasi  ·  3:30–4:01

**Visual:** Kartu putih menjauh menjadi kartu sumber daya, lalu terbuka menjadi tiga lapisan. Kamera whip: CPU (pesan melintas chip), RAM (blok data jatuh), Penyimpanan (berkas keluar dari folder). Egg turun, resepnya mengalir ke daftar; egg berubah menjadi container dan bot masuk. Empat faktor kapasitas masuk, bar merespons, lalu bar menyusut.

**Teks di layar:**
- Masuk ke sumber daya
- CPU · RAM · Penyimpanan
- Egg: resep lingkungan
- Image container / Runtime / Perintah awal
- Egg: lingkungan · Kode bot: terpisah
- Kapasitas berbeda-beda
- Tidak ada satu angka RAM yang berlaku untuk semua bot.

**Narasi:** Mari masuk ke sumber dayanya. CPU mengerjakan perhitungan, misalnya saat bot memproses pesan. RAM menampung data yang sedang dipakai aplikasi. Penyimpanan menyimpan kode, dependensi, dan berkas lainnya. Lalu ada egg: resep konfigurasi lingkungan, berisi image container, runtime, dan perintah awal aplikasi. Egg bukan kode bot itu sendiri. Kapasitas yang dibutuhkan pun berbeda-beda, bergantung pada kode, fitur, jumlah aktivitas, dan dependensi botnya.

**SFX:** sapuan lensa, morph, whip, ketukan bertahap, latch, benturan kartu

## 9. Yang dapat dan tidak dapat diselesaikan panel  ·  4:03–4:31

**Visual:** Garis bawah tumbuh menjadi console. Error muncul dan disorot; baris error terlepas menjadi baris kode, perbaikan diketik. Dua kartu: Panel tidak otomatis membuat bot / tidak menyediakan RAM gratis. Sapuan vertikal ke hitam: Mesin server, Jaringan, Layanan platform; tautan sempat putus lalu tersambung. Kartu: Software panel gratis & open source vs Infrastruktur hosting bisa berbiaya. Kartu terbelah melewati kamera.

**Teks di layar:**
- Bisa, dan tidak bisa.
- Pemantauan lebih mudah. / Kontrol lebih jelas.
- Perbaikan ada di kode aplikasi
- Tetap bergantung pada aplikasi dan infrastrukturnya.
- Tidak ada jaminan bot selalu aktif tanpa kendala.

**Narasi:** Lalu, apa yang bisa dan tidak bisa diselesaikan panel? Misalnya, muncul error di console. Panel membantu kita melihat masalah dan mengendalikan proses, tapi perbaikannya tetap ada di kode aplikasi. Panel juga tidak otomatis membuat bot atau menyediakan RAM gratis. Kelangsungan bot ikut ditentukan oleh mesin server, jaringan, dan layanan platformnya. Tidak ada panel yang bisa menjanjikan bot selalu aktif tanpa kendala. Software panelnya gratis dan open source, tapi infrastruktur hosting bisa berbiaya.

**SFX:** error, whip, ketikan, benturan kartu, sapuan lensa, peringatan

## 10. Penutup  ·  4:33–5:00

**Visual:** Klaster kartu (panel, server, container, console, grafik, chat Telegram & WhatsApp) masuk dan terus bergeser; kamera melacak kartu yang disebut. Pesan terakhir menyinggahi chat → server → container. Klaster menyebar melewati kamera. Logo Pterodactyl Panel, kalimat penutup, kredit, fade ke hitam tepat di 5:00.

**Teks di layar:**
- Berawal dari pengelolaan server game.
- Kini juga untuk bot Telegram & WhatsApp.
- Panel mengelola. Server menyediakan tenaga. Bot menjalankan logika.
- Kenali proses di balik botmu.
- Visual explainer by FELIXIORITY

**Narasi:** Jadi, Pterodactyl berawal dari pengelolaan server game. Dengan lingkungan yang sesuai, panel ini juga bisa membantu mengelola bot Telegram dan WhatsApp. Panel mengelola, server menyediakan tenaga, dan bot menjalankan logikanya. Kini, setiap kali bot membalas, kamu tahu apa yang bekerja di baliknya. Kenali proses di balik botmu.

**SFX:** whip, benturan kartu, pop pesan, sapuan lensa, nada penutup

## Catatan fakta

- Pterodactyl adalah panel pengelolaan server yang gratis dan open source (lisensi MIT), open source sejak 2015, awalnya untuk server game.
- Panel menjadi antarmuka web; Wings mengelola container di node; VPS/mesin menyediakan CPU, RAM, penyimpanan, jaringan.
- Egg adalah resep lingkungan (image container, runtime, perintah awal), bukan kode bot.
- Bot tetap butuh kode dan token/metode autentikasi sendiri; status "Running" belum menjamin bot terhubung.
- Sumber: pterodactyl.io, github.com/pterodactyl/panel, github.com/pterodactyl/wings (rincian di docs/sumber-fakta.md).
