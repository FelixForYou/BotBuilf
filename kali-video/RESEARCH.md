# Riset: "Mengenal Kali Linux"

Semua sumber diakses pada 7 November 2026. Setiap klaim di video berasal dari halaman resmi berikut.

## Pengertian (Scene 2)

Sumber: [kali.org/docs/introduction/what-is-kali-linux](https://www.kali.org/docs/introduction/what-is-kali-linux/)

> "Kali Linux (formerly known as BackTrack Linux) is an open-source, Debian-based Linux distribution which allows users to perform advanced penetration testing and security auditing."
>
> "This distribution has several hundred tools … computer forensics, reverse engineering, and vulnerability detection"
>
> "It is free (as in beer) and always will be"

- Klaim di video "ratusan tools" diambil dari frasa "several hundred tools".
- Lapisan Kernel → Debian → Kali di video adalah penyederhanaan untuk menjelaskan arti kata "distribusi".

## Pengembang

- [kali.org/about-us](https://www.kali.org/about-us/), bagian footer: "Kali Linux is part of OffSec's Community Projects."
- Para pendiri: Mati Aharoni (pendiri OffSec), Devon Kearns, dan Jim O'Gorman. Jim O'Gorman saat ini memimpin tim Kali.
- "Offensive Security" adalah nama lama OffSec. Video menyebut keduanya: "Offensive Security, kini bernama OffSec".
- [offsec.com/about](https://www.offsec.com/about/): penyedia pelatihan dan sertifikasi keamanan siber, misalnya PEN-200/OSCP "Penetration Testing with Kali Linux".

## Sejarah (Scene 3)

Sumber: [kali.org/docs/introduction/kali-linux-history](https://www.kali.org/docs/introduction/kali-linux-history/)

| Tanggal | Proyek | Basis |
|---|---|---|
| 2004-08-30 | Whoppix v2 | Knoppix |
| 2005-07-17 | WHAX v3 | Slax |
| 2006-05-26 | BackTrack v1 (WHAX + Auditor Security Collection) | Slackware |
| 2010-01-09 | BackTrack v4 | Ubuntu 8.10 |
| 2013-03-13 | Kali Linux v1 (Moto) | Debian 7 |
| 2015-08-11 | Kali Linux v2 (Sana) | Debian 8 |
| 2016-01-16 | Kali Linux Rolling | Debian Testing |

## Fungsi (Scene 4)

Fungsi-fungsinya disusun dari sumber resmi berikut:

- Penetration testing dan security auditing: dari halaman "What is Kali Linux?"
- Forensik dan deteksi kerentanan: dari halaman "What is Kali Linux?" ("computer forensics … vulnerability detection")
- Wireless: kernel Kali "patched for injection" untuk "wireless assessments"
- Jaringan dan web: kategori tools resmi di kali.org/tools, dengan Nmap, Wireshark, dan Burp Suite sebagai contoh

Seluruh visual di scene ini adalah ilustrasi konsep, bukan tangkapan layar tool. Laporan temuan diberi label "contoh".

## Tools (Scene 5)

Sumber: kali.org/tools/&lt;nama&gt;. Kelima tools masuk metapackage `default` dan `top10`.

| Tool | Versi di Kali | Deskripsi resmi |
|---|---|---|
| nmap | 7.99 | "a utility for network exploration or security auditing" |
| wireshark | 4.6.6 | "a network 'sniffer' - a tool that captures and analyzes packets off the wire" |
| metasploit-framework | 6.5.3 | "open source platform that supports vulnerability research, exploit development…" |
| burpsuite | 2026.8 | "integrated platform for performing security testing of web applications" |
| john | 1.9.0 | "designed to help systems administrators to find weak … passwords" |

Logo tools diambil dari kali.org/images/tool-logo-*.svg. Logo Kali dari kali.org/images/kali-logo.svg.

## Penggunaan (Scene 6)

- Screenshot desktop resmi: kali.org/images/notebook-kali-2024.1.jpg
- Command di terminal:
  - `whoami` → `kali`
  - `grep PRETTY /etc/os-release` → `PRETTY_NAME="Kali GNU/Linux Rolling"`. String OS ini juga tampil di halaman kali.org.
  - `nmap --version` → `Nmap version 7.99 ( https://nmap.org )`, sesuai versi paket Kali.
- Siklus lab (uji → temukan → perbaiki → uji ulang) adalah ilustrasi konsep di lab milik sendiri. Tidak ada serangan yang ditampilkan.

## Pengguna (Scene 7)

Sumber: [kali.org/docs/introduction/should-i-use-kali-linux](https://www.kali.org/docs/introduction/should-i-use-kali-linux/)

> Kali "is NOT a recommended distribution if you're unfamiliar with Linux"

Video merangkum kutipan ini menjadi saran "pemula: kuasai dasar Linux dulu".
