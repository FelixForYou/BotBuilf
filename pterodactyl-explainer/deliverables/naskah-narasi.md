# Naskah Narasi Final — Pterodactyl Panel (Visual Explainer)

Durasi total 05:00 (300 detik). Waktu di bawah adalah posisi rekaman sebenarnya di video.

## Pembuka: di balik balasan bot  (00:00–00:24)

- `00:00.80` Pesan masuk. Bot membalas.
- `00:03.15` Kelihatannya sederhana. Tapi, apa sebenarnya yang bekerja di balik balasan itu?
- `00:08.48` Bot adalah aplikasi. Ia perlu berjalan di perangkat atau server yang terus aktif, agar bisa menerima dan membalas pesan.
- `00:16.30` Untuk mengawasi aplikasi seperti itu, banyak pengelola memakai panel. Salah satunya, Pterodactyl Panel.

## Asal-usul Pterodactyl  (00:24–00:53)

- `00:24.52` Pterodactyl adalah panel pengelolaan server yang gratis dan open source. Kode sumbernya terbuka, dan bisa dipelajari siapa saja.
- `00:33.07` Sejarah proyek ini dimulai sejak tahun 2015.
- `00:37.27` Tujuan awalnya cukup spesifik: mempermudah pengelolaan server game melalui antarmuka web.
- `00:43.22` Server bisa dinyalakan, dipantau, dan diatur langsung dari browser, dengan setiap server berjalan di dalam container yang terisolasi.
- `00:51.63` Lalu, bagaimana dengan bot?

## Dari server game ke aplikasi bot  (00:53–01:27)

- `00:54.37` Dari sudut pandang komputer, bot dan server game sama-sama program yang sedang berjalan.
- `00:59.70` Keduanya butuh lingkungan runtime, seperti Node.js atau Python, dependensi pendukung, sumber daya, dan koneksi jaringan.
- `01:08.23` Karena itu, dengan image container, egg, dan konfigurasi yang sesuai, lingkungan yang dikelola Pterodactyl juga bisa menjalankan bot Telegram atau WhatsApp.
- `01:17.85` Tapi bukan berarti semua kode bot langsung jalan begitu saja. Lingkungannya harus sesuai, prosesnya harus berjalan, dan botnya harus berhasil terhubung.

## Cara kerjanya secara konseptual  (01:27–02:07)

- `01:27.98` Mari lihat susunannya. Di lapisan paling bawah ada VPS, atau mesin server. Dari sinilah CPU, RAM, penyimpanan, dan jaringan berasal.
- `01:37.83` Di atasnya ada Panel, antarmuka pengelolaan yang dibuka lewat browser.
- `01:42.42` Perintah dari Panel diteruskan ke Wings, layanan di mesin node yang mengelola container.
- `01:48.03` Container menyediakan lingkungan proses yang terpisah, dan di dalamnya, kode bot berjalan.
- `01:53.80` Perhatikan, ada dua jalur yang berbeda. Perintah pengelolaan bergerak dari Panel ke Wings. Sedangkan pesan pengguna datang dari layanan Telegram atau WhatsApp langsung ke aplikasi bot, tanpa melewati dashboard panel.

## Satu tempat untuk mengawasi bot  (02:07–02:40)

- `02:07.95` Bagi pengelola, panel menjadi satu tempat untuk mengawasi bot. Ambil contoh bot Telegram fiktif bernama Asisten Bot.
- `02:15.40` Console menampilkan output dan pesan error dari aplikasi, jadi kamu bisa membaca apa yang sedang terjadi.
- `02:22.30` Grafik CPU dan RAM memperlihatkan pemakaian sumber daya dari waktu ke waktu. Angka yang rendah tidak menjamin bot cepat, tapi membantu membaca pola.
- `02:31.93` File manager dipakai untuk mengelola berkas aplikasi.
- `02:35.88` Lalu kontrol start, stop, dan restart mengatur jalannya proses.

## Kehidupan sebuah bot Telegram  (02:40–03:10)

- `02:41.13` Sekarang, lihat keseharian bot itu. Seorang pengguna mengirim perintah sederhana.
- `02:46.80` Aplikasi menerima pesan, memprosesnya, lalu mengirim balasan. Di console, aktivitas itu tercatat, dan pemakaian sumber daya ikut naik sedikit.
- `02:56.25` Bot seperti ini bisa menjawab pertanyaan, mengirim notifikasi, atau membantu admin mengelola komunitas.
- `03:03.00` Tapi ingat, kemampuan membalas berasal dari kode bot. Panel membantu mengelola proses yang menjalankannya.

## Bot WhatsApp dan kebutuhan koneksi  (03:10–03:43)

- `03:10.45` Hal serupa berlaku untuk bot WhatsApp, misalnya bot informasi yang menerima pertanyaan dan menyiapkan jawaban.
- `03:17.45` Bot WhatsApp butuh integrasi dan autentikasi sesuai metode yang digunakan. Pterodactyl mengelola proses aplikasinya, sedangkan hubungan dengan platform ditangani oleh integrasi bot.
- `03:28.92` Jadi ada dua status yang perlu diperhatikan: proses aktif, dan koneksi platform terhubung. Status Running belum tentu berarti bot sudah tersambung.
- `03:38.38` Dan perlu dicatat, Pterodactyl bukan produk resmi WhatsApp maupun Telegram.

## Sumber daya dan lingkungan aplikasi  (03:43–04:16)

- `03:43.85` Sekarang, sumber daya. CPU adalah tenaga untuk memproses setiap perintah.
- `03:49.15` RAM adalah memori kerja, tempat aplikasi menyimpan data sementara saat berjalan.
- `03:54.48` Penyimpanan menampung kode, dependensi, log, dan berkas lainnya.
- `03:58.85` Lalu ada egg. Anggap egg sebagai resep, yaitu konfigurasi yang menentukan lingkungan, runtime, dan perintah awal aplikasi. Egg bukan kode bot itu sendiri.
- `04:09.42` Kebutuhan sumber dayanya bergantung pada kode, fitur, jumlah aktivitas, dan dependensi bot.

## Yang dapat dan tidak dapat diselesaikan panel  (04:16–04:42)

- `04:16.43` Misalkan muncul error di console. Panel membantu kamu melihat masalahnya, lalu menghentikan atau menyalakan ulang proses.
- `04:24.83` Namun perbaikannya tetap harus dilakukan di kode aplikasi.
- `04:28.82` Kelangsungan bot juga ditentukan oleh mesin server, koneksi jaringan, dan layanan platformnya.
- `04:34.73` Software panelnya gratis dan open source, tetapi infrastruktur hosting seperti VPS bisa memiliki biaya.

## Penutup  (04:42–05:00)

- `04:43.00` Jadi, Pterodactyl berawal dari pengelolaan server game.
- `04:46.98` Dengan lingkungan yang sesuai, panel ini juga bisa membantu mengelola aplikasi bot Telegram dan WhatsApp.
- `04:53.77` Kenali prosesnya, dan kamu akan lebih paham apa yang bekerja di balik setiap balasan bot.

Jumlah kata narasi: 610
