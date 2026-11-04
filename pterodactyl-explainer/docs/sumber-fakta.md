# Catatan sumber fakta

Semua klaim sejarah dan teknis di narasi diverifikasi ke sumber resmi proyek (diakses 4 November 2026).
Video tidak menyebut tanggal peluncuran spesifik, nama pendiri, atau pencapaian apa pun di luar yang tercantum di sini.

| Klaim di video | Sumber resmi | Kutipan / dasar |
|---|---|---|
| Pterodactyl adalah panel pengelolaan server yang **gratis dan open source** | README repo resmi `github.com/pterodactyl/panel` | "Pterodactyl® is a free, open-source game server management panel built with PHP, React, and Go." |
| Proyek open source **sejak 2015** | Situs resmi `pterodactyl.io` | "Open source since 2015." · "MIT licensed and built in public by … contributors" |
| Lisensi MIT (kartu "gratis & open source (MIT)") | `LICENSE.md` di repo resmi | "The MIT License (MIT)" |
| Tujuan awal: mengelola **server game** lewat antarmuka web | README resmi & judul situs | "game server management panel" · "Pterodactyl · Game servers, handled." |
| Setiap server berjalan di **container** terpisah | README resmi & `pterodactyl.io` | "runs all game servers in isolated Docker containers" · "Every server runs in its own Docker container" |
| **Wings** menangani pengelolaan container di node | README `github.com/pterodactyl/wings` & `pterodactyl.io` | "Wings is Pterodactyl's server control plane … control all aspects of the server lifecycle." · "Wings gives every server its own Docker container" |
| Panel menyediakan console, file, dan kontrol proses | `pterodactyl.io` | "with a live console, files, backups and schedules" |
| **Egg** = resep konfigurasi lingkungan (image, perintah awal, konfigurasi) | `pterodactyl.io` (bagian Eggs) | "An Egg is a portable recipe … the Docker image it runs in, its startup command, …" |
| Egg tersedia juga untuk aplikasi/bahasa, bukan hanya game | `pterodactyl.io` → menu Eggs | kategori "Games · Applications · Languages" |

## Klaim yang sengaja dibatasi (sesuai brief)

- Penggunaan untuk bot disebut **"dengan konfigurasi yang sesuai"**; kode bot "tetap perlu disesuaikan".
- Panel **tidak** otomatis membuat bot, **tidak** menyediakan RAM gratis, dan **tidak** menggantikan koneksi ke Telegram/WhatsApp.
- Status "Running" **belum menjamin** bot terhubung dan membalas; tidak ada janji uptime mutlak, keamanan sempurna, atau restart otomatis.
- WhatsApp: kompatibilitas & koneksi bergantung pada metode integrasi; Pterodactyl tidak disebut sebagai produk resmi WhatsApp/Telegram.
- Tidak ada angka RAM minimum universal. Grafik CPU/RAM berlabel "data simulasi", dan narasi menegaskan CPU rendah bukan jaminan bot cepat.
- Software panel gratis, sedangkan infrastruktur hosting bisa berbiaya.

## Tautan

- https://pterodactyl.io/
- https://github.com/pterodactyl/panel (README.md, LICENSE.md)
- https://github.com/pterodactyl/wings (README.md)
