# Riset: RustScan untuk Kali Linux

Diperiksa pada 7 November 2026. Setiap fakta di video diambil dari sumber di bawah.

## Kenapa RustScan

Kandidat dicek di kali.org/tools. Metapackage menentukan apakah sebuah tool sudah "bawaan" (terpasang di image default):

| Tool | Metapackage Kali | Status |
|---|---|---|
| nuclei | default, everything, large | bawaan, tidak dipilih |
| httpx-toolkit | default, everything, large | bawaan |
| feroxbuster | default, everything, large | bawaan |
| **rustscan** | — (paket tersedia, versi 2.4.1) | **bukan bawaan, dipilih** |
| trufflehog, sherlock, katana, naabu, dalfox, gitleaks, subfinder | — | bukan bawaan |

RustScan dipilih karena README dan wiki-nya lengkap, punya paket resmi di Kali, dan bisa didemokan dengan aman ke `127.0.0.1`.

## Repository

- URL: https://github.com/bee-san/RustScan (dulu `RustScan/RustScan`, sekarang redirect)
- Stars: **21k**, forks: **1.4k**, rilis terbaru: **v2.4.1** (shields.io, 7 Nov 2026)
- Lisensi: **GPL-3.0-only** (`Cargo.toml`)
- Penulis: `Autumn <autumn@skerritt.blog>` (`Cargo.toml`), pemilik GitHub: `bee-san`
- Deskripsi crate: "Faster Nmap Scanning with Rust"
- Tagline README: "The Modern Port Scanner. Find ports quickly (3 seconds at its fastest)."
- Fitur di README (dikutip apa adanya):
  - Scans all 65k ports in 3 seconds.
  - Full scripting engine support (Python, Lua, Shell).
  - Adaptive learning.
  - The usuals: IPv6, CIDR, file input and more.
  - Automatically pipes ports into Nmap.
  - Accessible (dirancang ramah screen reader, flag `--accessible`)
- Async: `tokio` + `futures::stream::FuturesUnordered` (`Cargo.toml`, `src/scanner/mod.rs`)
- Logo: `pictures/rustscan.png` dari repository

## Instalasi di Kali

- `sudo apt install rustscan`: dari kali.org/tools/rustscan (versi 2.4.1)
- `cargo install rustscan`: README menyebut "RustScan only officially supports Cargo installations"
- Wiki Installation-Guide: "You need Nmap. If you have Kali Linux or Parrot OS installed, you already have Nmap."
- Teks apt di video adalah simulasi dari pesan apt standar. Output `cargo install` dan `rustscan --version` diambil dari instalasi sungguhan.

## Demo (dijalankan sungguhan)

Lab: dua `python3 -m http.server` yang di-bind ke 127.0.0.1 pada port 3000 dan 8080.

```
rustscan -a 127.0.0.1 -r 3000-9000 --ulimit 5000 -- -sV
```

- Flag diverifikasi dari `rustscan -h` (v2.4.1): `-a/--addresses`, `-r/--range`, `-u/--ulimit`, argumen setelah `--` diteruskan ke Nmap
- Output di video adalah kutipan dari run asli. Baris diringkas tapi tidak diubah, dan waktunya dipercepat (diberi label TIMELAPSE).
- Benchmark: `rustscan -a 127.0.0.1 -r 1-65535 -g --ulimit 5000` selesai dalam **3,12 dtk** di localhost

## Keterbatasan (dari repository)

- Deteksi layanan/versi dikerjakan oleh Nmap, bukan oleh RustScan sendiri
- Batch size yang terlalu tinggi bisa membuat port tidak terdeteksi. Pesannya ada di `src/main.rs` ("This is usually caused by a high batch size"), dan bisa diturunkan dengan `-b`.
- Peringatan di `rustscan -h`: "Do not use this program against sensitive infrastructure..."
