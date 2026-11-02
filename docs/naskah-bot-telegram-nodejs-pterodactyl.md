# Naskah: Cara Menjalankan Server Node.js Bot Telegram di Panel Pterodactyl

> Panduan langkah demi langkah, dari membuat bot di Telegram sampai bot berjalan 24 jam di server Pterodactyl.

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Persiapan](#2-persiapan)
3. [Membuat Bot di BotFather](#3-membuat-bot-di-botfather)
4. [Menyiapkan Kode Bot Node.js](#4-menyiapkan-kode-bot-nodejs)
5. [Membuat Server Node.js di Pterodactyl](#5-membuat-server-nodejs-di-pterodactyl)
6. [Mengunggah File Bot ke Server](#6-mengunggah-file-bot-ke-server)
7. [Mengatur Startup & Variabel](#7-mengatur-startup--variabel)
8. [Menjalankan dan Menguji Bot](#8-menjalankan-dan-menguji-bot)
9. [Mode Webhook (Opsional)](#9-mode-webhook-opsional)
10. [Pemecahan Masalah](#10-pemecahan-masalah)
11. [Tips Keamanan & Perawatan](#11-tips-keamanan--perawatan)
12. [Penutup](#12-penutup)

---

## 1. Pendahuluan

**Pterodactyl** adalah panel manajemen server berbasis web. Setiap server di Pterodactyl berjalan di dalam
**container Docker** yang terisolasi, dengan konfigurasi yang ditentukan oleh sebuah **Egg** (templat).
Untuk bot Telegram berbasis JavaScript, kita memakai Egg **Node.js** (misalnya *Node.js Generic*).

Keuntungan menjalankan bot di Pterodactyl:

- Bot tetap hidup 24 jam walaupun komputer kita mati.
- Ada **console** untuk melihat log secara langsung.
- Tombol **Start / Restart / Stop** dan restart otomatis jika crash.
- **File Manager** dan **SFTP** untuk mengelola kode.
- Batas CPU, RAM, dan disk yang jelas.

---

## 2. Persiapan

| Kebutuhan | Keterangan |
|---|---|
| Akun Telegram | Untuk membuat bot lewat @BotFather |
| Akses panel Pterodactyl | Akun user yang memiliki server Node.js (atau akun admin untuk membuatnya) |
| Kode bot Node.js | Bisa dibuat sendiri atau memakai contoh di bawah |
| (Opsional) Repository Git | Jika ingin bot diambil otomatis dari GitHub |
| (Opsional) Klien SFTP | FileZilla / WinSCP untuk upload file besar |

---

## 3. Membuat Bot di BotFather

1. Buka Telegram, cari **@BotFather**.
2. Kirim perintah `/newbot`.
3. Masukkan **nama bot** (bebas), lalu **username bot** (harus diakhiri `bot`, misalnya `tokoku_bot`).
4. BotFather akan memberikan **token** seperti:

   ```
   1234567890:AAH-contohTokenRahasiaJanganDisebar
   ```

5. **Simpan token ini baik-baik.** Siapa pun yang memegang token dapat mengendalikan bot Anda.

---

## 4. Menyiapkan Kode Bot Node.js

Struktur folder minimal:

```
bot-telegram/
├── package.json
├── index.js
└── .env          (opsional, untuk menyimpan token)
```

### 4.1 `package.json`

```json
{
  "name": "bot-telegram",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "telegraf": "^4.16.3"
  }
}
```

### 4.2 `index.js`

```js
require('dotenv').config();
const { Telegraf } = require('telegraf');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN belum diatur! Isi di file .env atau variabel startup.');
  process.exit(1);
}

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply(`Halo ${ctx.from.first_name}! Bot aktif di Pterodactyl 🚀`));
bot.help((ctx) => ctx.reply('Perintah: /start, /help, /ping'));
bot.command('ping', (ctx) => ctx.reply('pong 🏓'));
bot.on('text', (ctx) => ctx.reply(`Kamu menulis: ${ctx.message.text}`));

bot.catch((err, ctx) => {
  console.error(`Error pada update ${ctx.updateType}:`, err);
});

bot.launch().then(() => console.log('Bot berjalan (mode polling)...'));
console.log('Menyalakan bot...');

// Berhenti dengan rapi saat server di-stop dari panel
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

> Catatan: `bot.launch()` pada Telegraf v4 baru selesai (resolve) ketika bot berhenti, jadi log
> "Menyalakan bot..." adalah penanda bahwa proses sudah jalan.

### 4.3 `.env`

```
BOT_TOKEN=1234567890:AAH-contohTokenRahasiaJanganDisebar
```

> **Jangan** meng-commit `.env` ke GitHub. Tambahkan `.env` dan `node_modules/` ke `.gitignore`.

### 4.4 Uji di komputer sendiri (disarankan)

```bash
npm install
```

```bash
npm start
```

Jika bot sudah membalas `/start` di Telegram, kode siap dipindahkan ke Pterodactyl.
Matikan bot lokal (Ctrl+C) sebelum menjalankannya di panel — **satu token hanya boleh dipakai satu
proses polling**, jika tidak akan muncul error `409 Conflict`.

---

## 5. Membuat Server Node.js di Pterodactyl

> Langkah ini dilakukan **admin panel**. Jika Anda membeli server dari penyedia hosting, biasanya server
> Node.js sudah dibuatkan — lanjut ke bagian 6.

1. Masuk ke **Admin Area** → **Servers** → **Create New**.
2. Isi **Server Name**, pilih **Server Owner**.
3. Tentukan **Allocation** (IP:Port). Bot polling tidak butuh port masuk, tetapi Pterodactyl tetap
   mewajibkan satu alokasi.
4. Atur batas **Memory** (256–512 MB cukup untuk bot sederhana), **Disk**, dan **CPU**.
5. Pada **Nest Configuration**, pilih Nest yang berisi Egg **Node.js** (misalnya *Generic Node.js*).
   Jika belum ada, impor egg Node.js dari repositori komunitas *pterodactyl eggs* (parkervcp).
6. Pilih **Docker Image** sesuai versi Node yang dibutuhkan, contoh: `ghcr.io/parkervcp/yolks:nodejs_20`.
7. Isi **Startup Variables** (lihat bagian 7), lalu klik **Create Server**.
8. Tunggu proses **Installing** selesai.

---

## 6. Mengunggah File Bot ke Server

Masuk ke panel sebagai user, pilih server bot Anda. Ada tiga cara:

### Cara A — File Manager (paling mudah)

1. Buka menu **Files**.
2. Di komputer, kompres folder bot menjadi `bot.zip` (**tanpa** folder `node_modules`).
3. Klik **Upload**, pilih `bot.zip`.
4. Klik titik tiga di samping `bot.zip` → **Unarchive**.
5. Pastikan `package.json` dan `index.js` berada **langsung di direktori utama** (`/home/container`),
   bukan di dalam subfolder. Jika masuk subfolder, pindahkan dengan fitur **Move/Rename**.
6. Hapus `bot.zip` setelah diekstrak.

### Cara B — SFTP

1. Buka menu **Settings** → lihat **SFTP Details** (host, port, username).
2. Login di FileZilla/WinSCP memakai username tersebut dan **password akun panel**.
3. Unggah file ke direktori utama.

### Cara C — Git (otomatis)

Jika egg mendukung variabel **Git Repo Address**:

1. Buka **Startup** → isi `GIT_ADDRESS` dengan URL repo, misalnya `https://github.com/user/bot-telegram.git`.
2. Isi `BRANCH` (misalnya `main`). Untuk repo privat, isi juga username dan *access token*.
3. Aktifkan `AUTO_UPDATE` jika ingin `git pull` setiap kali server start.
4. Buka **Settings** → **Reinstall Server** agar repo di-clone. (Reinstall dapat menghapus file — backup dulu!)

---

## 7. Mengatur Startup & Variabel

Buka menu **Startup**. Nama variabel bisa sedikit berbeda tergantung versi egg, tetapi umumnya:

| Variabel | Contoh nilai | Fungsi |
|---|---|---|
| Main File (`JS_FILE` / `MAIN_FILE`) | `index.js` | File yang dijalankan oleh `node` |
| Additional Node Packages (`NODE_PACKAGES`) | *(kosong)* | Paket tambahan untuk di-install |
| Auto Update (`AUTO_UPDATE`) | `0` / `1` | `git pull` otomatis saat start |
| Docker Image | `nodejs_20` | Versi Node.js |

Contoh **startup command** bawaan egg Node.js Generic (biasanya hanya admin yang bisa mengubah):

```bash
if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/node /home/container/{{JS_FILE}}
```

Artinya, setiap kali tombol **Start** ditekan, panel akan:

1. `git pull` (jika diaktifkan),
2. `npm install` sesuai `package.json`,
3. menjalankan `node index.js`.

### Menyimpan token dengan aman

- **Pilihan 1:** buat file `.env` lewat **Files → New File**, isi `BOT_TOKEN=...`.
- **Pilihan 2:** minta admin menambahkan variabel `BOT_TOKEN` pada egg, sehingga token bisa diisi di
  menu **Startup** dan dibaca lewat `process.env.BOT_TOKEN` tanpa menyimpannya di file.

---

## 8. Menjalankan dan Menguji Bot

1. Buka menu **Console**.
2. Klik **Start**.
3. Perhatikan log. Contoh log normal:

   ```
   container@pterodactyl~ Server marked as starting...
   added 15 packages in 3s
   Menyalakan bot...
   Bot berjalan (mode polling)...
   ```

4. Buka Telegram, kirim `/start` ke bot Anda. Jika bot membalas — **selamat, bot sudah online!** 🎉

### Status "Starting" terus-menerus?

Pterodactyl menandai server **Running** saat menemukan teks tertentu di console (diatur pada egg di
bagian *Configuration → Start Configuration*, kunci `done`). Jika teks itu tidak pernah muncul, status
tetap *Starting* walaupun bot sebenarnya sudah berjalan. Solusinya:

- cetak teks yang sesuai di kode Anda (misalnya `console.log('Bot berjalan...')`), **atau**
- minta admin mengubah nilai `done` pada egg agar cocok dengan log bot Anda.

### Perintah console

Menu **Console** mengirim input ke proses (stdin). Bot Telegram biasa tidak membaca stdin, jadi untuk
mengubah kode: edit file → klik **Restart**.

---

## 9. Mode Webhook (Opsional)

Mode **polling** (contoh di atas) paling mudah dan tidak butuh port terbuka. Jika ingin **webhook**:

1. Pastikan server punya **Allocation** (port) yang bisa diakses publik.
2. Telegram mewajibkan **HTTPS** dan hanya mengizinkan port **443, 80, 88, atau 8443**. Biasanya
   diperlukan domain + reverse proxy (Nginx/Caddy) dengan SSL yang meneruskan ke port alokasi.
3. Gunakan port dari Pterodactyl lewat variabel lingkungan `SERVER_PORT`:

```js
bot.launch({
  webhook: {
    domain: 'https://bot.domainanda.com',
    port: Number(process.env.SERVER_PORT) || 3000,
    host: '0.0.0.0',
  },
});
```

> Selalu dengarkan di `0.0.0.0`, bukan `localhost`, agar bisa diakses dari luar container.

---

## 10. Pemecahan Masalah

| Gejala / Error | Penyebab | Solusi |
|---|---|---|
| `Cannot find module 'telegraf'` | Dependensi belum ter-install | Pastikan `package.json` ada di direktori utama, lalu Restart. Hapus `node_modules` jika rusak. |
| `Error: Cannot find module '/home/container/index.js'` | Nama Main File salah / file di subfolder | Sesuaikan variabel Main File atau pindahkan file. |
| `409: Conflict: terminated by other getUpdates request` | Bot jalan di dua tempat dengan token sama | Matikan bot di komputer lokal / server lain. |
| `401: Unauthorized` | Token salah atau sudah di-*revoke* | Ambil token baru via `/token` di @BotFather. |
| `SyntaxError: Unexpected token` / fitur tidak dikenali | Versi Node terlalu lama | Ganti Docker Image ke `nodejs_18`/`nodejs_20` di **Startup**. |
| Server mati sendiri, log `Killed` / `OOM` | RAM tidak cukup | Naikkan limit memori atau optimalkan kode. |
| `ETIMEDOUT` / `ENOTFOUND api.telegram.org` | Node (wings) tidak bisa mengakses internet | Hubungi admin/penyedia hosting untuk cek firewall/DNS. |
| Status *Starting* terus | Teks `done` egg tidak cocok | Lihat bagian 8. |
| `npm ERR! EACCES` | Masalah izin file | Gunakan fitur **Reinstall** atau minta admin memperbaiki kepemilikan file. |

---

## 11. Tips Keamanan & Perawatan

- **Jangan pernah** membagikan token atau mengunggah `.env` ke repo publik. Jika bocor, segera `/revoke` di @BotFather.
- Gunakan menu **Backups** sebelum update besar atau reinstall.
- Gunakan menu **Schedules** untuk restart otomatis berkala (misalnya setiap hari pukul 04.00) jika bot
  cenderung bocor memori.
- Tambahkan sub-user lewat menu **Users** dengan izin terbatas bila bekerja dalam tim.
- Tangani error dengan `bot.catch(...)` dan `process.on('unhandledRejection', ...)` agar bot tidak mudah crash.
- Tidak perlu memakai **PM2** di Pterodactyl — panel sudah mengelola proses dan bisa restart otomatis
  bila crash (jika diaktifkan oleh admin/egg).
- Simpan data penting (database, file JSON) di dalam `/home/container` agar tidak hilang saat restart.

---

## 12. Penutup

Ringkasnya, alur menjalankan bot Telegram Node.js di Pterodactyl adalah:

```
Buat bot di @BotFather → Siapkan kode (package.json + index.js) → Buat server Egg Node.js
→ Upload file / clone Git → Atur Main File & token → Start di Console → Uji di Telegram
```

Dengan langkah-langkah di atas, bot Telegram Anda dapat berjalan stabil 24/7 dengan log, kontrol, dan
manajemen file yang mudah melalui panel Pterodactyl. Selamat mencoba! 🤖
