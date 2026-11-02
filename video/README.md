# Video motion graphics: Bot Telegram Node.js di Pterodactyl

Animasi berbasis HTML (UI bergaya Telegram/BotFather dan panel Pterodactyl) yang disinkronkan ke voice over.

- `index.html` + `scenes.js` — semua adegan; `render(t)` menggambar frame pada detik `t`. Buka `index.html` di browser untuk pratinjau, atau `index.html?t=25` untuk melihat satu frame.
- `timeline.json` — perkiraan waktu tiap kalimat voice over (dari deteksi jeda audio).
- `render.js` — render ke MP4 dengan Playwright + ffmpeg.

```bash
node render.js voice-over.wav hasil.mp4 30 4
```
