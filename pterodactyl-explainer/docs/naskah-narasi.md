# Naskah narasi final

Suara: `id-ID-ArdiNeural` (Microsoft Edge TTS, laki-laki muda), rate +8%. Waktu di bawah diambil dari rekaman sebenarnya (`src/data/timeline.json`).
**Total: 607 kata · narasi berakhir di 04:55.64 · video 05:00.00 (18.000 frame @ 60 fps)**


## S01 — Pembuka: di balik balasan bot  ·  00:01.00–00:24.83  ·  47 kata

Pesan masuk. Bot membalas. Hanya butuh sekejap. Di layar, semuanya terlihat sederhana. Tapi, apa sebenarnya yang bekerja di baliknya? Setiap bot adalah aplikasi yang harus terus berjalan, di sebuah perangkat atau server yang aktif. Untuk mengawasi aplikasi itu, banyak pengelola memakai sebuah panel. Salah satunya: Pterodactyl Panel.

## S02 — Asal-usul Pterodactyl  ·  00:26.08–00:54.16  ·  55 kata

Pterodactyl adalah panel pengelolaan server yang gratis dan open source. Artinya, kode sumbernya terbuka untuk dipelajari dan dikembangkan siapa saja. Pengembangannya berjalan terbuka, bersama banyak kontributor. Proyek ini sudah ada sejak tahun 2015. Tujuan awalnya sederhana: mempermudah pengelolaan server game lewat antarmuka web. Menyalakan, mematikan, dan memantau server, cukup dari browser. Lalu, bagaimana dengan bot?

## S03 — Dari server game ke aplikasi bot  ·  00:55.41–01:26.79  ·  66 kata

Jawabannya ada pada cara kerja aplikasi. Server game dan bot sama-sama program. Bagi sistem, keduanya adalah proses yang perlu dijalankan dan diawasi. Keduanya butuh lingkungan runtime, misalnya Node.js atau Python, ditambah dependensi, sumber daya, dan koneksi jaringan. Karena itu, dengan konfigurasi yang sesuai, lingkungan yang dikelola Pterodactyl juga bisa menjalankan bot Telegram maupun WhatsApp. Kode botnya tetap perlu disesuaikan. Lingkungan sesuai, proses berjalan, lalu bot terhubung.

## S04 — Cara kerjanya secara konseptual  ·  01:28.04–01:59.88  ·  71 kata

Mari lihat susunannya. Paling bawah ada VPS, atau mesin server. Di sinilah CPU, RAM, penyimpanan, dan jaringan disediakan. Di atasnya ada Panel, antarmuka pengelolaan yang dibuka lewat browser. Perintah dari Panel diteruskan ke Wings, layanan yang mengelola container di mesin itu. Container memberi lingkungan proses yang terpisah, dan di dalamnya, kode bot berjalan. Pesan dari pengguna tidak lewat dashboard Panel. Pesan mengalir dari layanan Telegram atau WhatsApp, langsung ke aplikasi bot.

## S05 — Satu tempat untuk mengawasi bot  ·  02:01.13–02:29.93  ·  66 kata

Dari sini terlihat peran utama Panel: satu tempat untuk mengawasi bot. Ambil contoh Asisten Bot, sebuah bot Telegram fiktif. Lewat console, pengelola bisa membaca output dan pesan error dari aplikasi. Grafik CPU dan RAM menunjukkan pemakaian sumber daya, meski angka yang rendah bukan jaminan bot pasti cepat. File manager membantu mengelola berkas. Semuanya terkumpul dalam satu tampilan. Lalu, tombol start, stop, dan restart mengatur jalannya proses.

## S06 — Keseharian bot Telegram  ·  02:31.18–03:02.10  ·  61 kata

Sekarang, ikuti keseharian Asisten Bot. Seorang pengguna mengirim perintah sederhana, misalnya jadwal, untuk melihat agenda. Aplikasi menerima permintaan itu, memprosesnya, lalu mengirim balasan. Bot seperti ini bisa menjawab pertanyaan, mengirim notifikasi, atau membantu administrasi komunitas. Setiap aktivitas meninggalkan jejak di console, dan pemakaian sumber daya ikut bergerak. Tapi ingat, kemampuan membalas berasal dari kode bot. Panel membantu mengelola proses yang menjalankannya.

## S07 — Bot WhatsApp dan kebutuhan koneksi  ·  03:03.35–03:31.26  ·  61 kata

Bagaimana dengan WhatsApp? Misalnya, sebuah bot informasi yang menerima pesan dan menyiapkan jawaban. Aplikasi seperti ini butuh integrasi dan autentikasi, dan kompatibilitas serta koneksinya bergantung pada metode yang digunakan. Pterodactyl mengelola proses aplikasinya, sementara hubungan dengan platform ditangani oleh integrasi bot. Jadi, perhatikan dua hal: proses yang aktif, dan koneksi platform yang terhubung. Status Running saja belum menjamin bot bisa membalas.

## S08 — Sumber daya dan lingkungan aplikasi  ·  03:32.51–04:03.01  ·  61 kata

Mari masuk ke sumber dayanya. CPU mengerjakan perhitungan, misalnya saat bot memproses pesan. RAM menampung data yang sedang dipakai aplikasi. Penyimpanan menyimpan kode, dependensi, dan berkas lainnya. Lalu ada egg: resep konfigurasi lingkungan, berisi image container, runtime, dan perintah awal aplikasi. Egg bukan kode bot itu sendiri. Kapasitas yang dibutuhkan pun berbeda-beda, bergantung pada kode, fitur, jumlah aktivitas, dan dependensi botnya.

## S09 — Yang dapat dan tidak dapat diselesaikan panel  ·  04:04.26–04:34.03  ·  72 kata

Lalu, apa yang bisa dan tidak bisa diselesaikan panel? Misalnya, muncul error di console. Panel membantu kita melihat masalah dan mengendalikan proses, tapi perbaikannya tetap ada di kode aplikasi. Panel juga tidak otomatis membuat bot atau menyediakan RAM gratis. Kelangsungan bot ikut ditentukan oleh mesin server, jaringan, dan layanan platformnya. Tidak ada panel yang bisa menjanjikan bot selalu aktif tanpa kendala. Software panelnya gratis dan open source, tapi infrastruktur hosting bisa berbiaya.

## S10 — Penutup  ·  04:35.28–04:55.64  ·  47 kata

Jadi, Pterodactyl berawal dari pengelolaan server game. Dengan lingkungan yang sesuai, panel ini juga bisa membantu mengelola bot Telegram dan WhatsApp. Panel mengelola, server menyediakan tenaga, dan bot menjalankan logikanya. Kini, setiap kali bot membalas, kamu tahu apa yang bekerja di baliknya. Kenali proses di balik botmu.
