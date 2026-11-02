# Video motion graphics: Bot Telegram Node.js di Pterodactyl

Animasi berbasis HTML (UI bergaya Telegram/BotFather dan panel Pterodactyl) yang disinkronkan ke voice over.

- `gl.js` — layer 3D Three.js: latar grid 3D, ikon 3D (Telegram, JS, rak server), angka langkah 3D, dan file zip 3D.
- `index.html` + `scenes.js` — semua adegan; `render(t)` menggambar frame pada detik `t`. UI dibuat 2.5D (kamera CSS 3D). Pratinjau perlu server lokal karena memakai ES module, misalnya `npx serve .` lalu buka `index.html` (atau `index.html?t=25` untuk satu frame).
- `timeline.json` — perkiraan waktu tiap kalimat voice over (dari deteksi jeda audio).
- `render.js` — render ke MP4 dengan Playwright + ffmpeg.

```bash
npm install
```

```bash
node render.js voice-over.wav hasil.mp4 30 4
```
