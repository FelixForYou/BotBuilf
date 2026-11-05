# FELIXIORITY · Video Portfolio (Remotion)

Video motion graphics ±47 detik (1920×1080, 30 fps) yang dibuat dari desain website portfolio Felixiority:
palet putih tulang / hitam arang / satu biru solid, font Bricolage Grotesque + Instrument Serif + JetBrains Mono,
dan koreografi yang sama dengan animasi GSAP di situs.

## Alur adegan

| # | Adegan | Isi |
|---|--------|-----|
| 1 | Hero | Tirai biru → garis grid → huruf FELIXIORITY naik → judul per kata → diagram Website / Rest API / Infrastruktur dengan kabel dan denyut data → jendela website membesar jadi panggung gelap |
| 2 | Project | 8 project (FxB RestApi, Semile AI, FELIX PANEL, FELIXIORITY TOOLS, 3D User Warehouse, FxB Cpanel, FxBgraM, Motion & Remotion Studio) masing-masing dengan ilustrasi antarmuka beranimasi, status, kategori, dan teknologi |
| 3 | Tentang | "Produk yang dipakai, server yang dirawat." + daftar fokus |
| 4 | Layanan | 4 layanan dengan sorotan bergantian |
| 5 | Kontak | Ajakan menghubungi + tombol |
| 6 | Outro | Wordmark FELIXIORITY di atas biru |

Antar-adegan memakai transisi tirai biru seperti transisi halaman di situs.

## Perintah

```bash
npm install
npm run dev            # buka Remotion Studio
npx remotion render Felixiority out/felixiority-portfolio.mp4
```

Font dibundel di `public/fonts`, jadi render tidak butuh akses internet.
Teks dan data project ada di `src/lib/data.ts`; warna dan font di `src/lib/theme.ts`.
