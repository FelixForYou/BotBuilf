# Integrasi DANA — kredensial, webhook, dan UAT

FxB Pay memakai produk **DANA Payment Gateway (SNAP)**. Endpoint, header, format signature, dan status di kode
ini bersumber dari SDK resmi [`dana-node`](https://github.com/dana-id/dana-node) v2.2.2 (dibangkitkan dari
https://dashboard.dana.id/api-docs-v2/) dan skrip UAT resmi [`dana-id/uat-script`](https://github.com/dana-id/uat-script).
Selalu cocokkan dengan dokumentasi terbaru di Merchant Portal sebelum go-live.

| Operasi | Endpoint (relatif ke base URL) |
|---|---|
| Create Order | `POST /payment-gateway/v1.0/debit/payment-host-to-host.htm` |
| Query Payment | `POST /payment-gateway/v1.0/debit/status.htm` (`serviceCode` = `54`) |
| Cancel Order | `POST /payment-gateway/v1.0/debit/cancel.htm` |
| Refund Order | `POST /payment-gateway/v1.0/debit/refund.htm` |
| Finish Notify (DANA → FxB Pay) | `POST {APP_URL}/api/webhooks/dana/{sandbox|production}` |

Base URL: Sandbox `https://api.sandbox.dana.id`, Production `https://api.saas.dana.id`.

Header permintaan: `X-TIMESTAMP` (`yyyy-MM-ddTHH:mm:ss+07:00`), `X-SIGNATURE`, `X-PARTNER-ID`, `X-EXTERNAL-ID`,
`CHANNEL-ID` (`<partnerId>-SERVER`), `ORIGIN`. Signature: `base64(RSA-SHA256(privateKey,
"POST:" + path + ":" + lowercase(hex(sha256(minifiedBody))) + ":" + X-TIMESTAMP))`. Tes
`tests/dana-signature.test.ts` membuktikan hasilnya identik dengan `DanaSignatureUtil` milik SDK.

> Mengapa tidak memanggil kelas SDK langsung? SDK memilih kunci verifikasi webhook dan validasi `validUpTo` dari
> variabel proses `DANA_ENV`, sementara FxB Pay menjalankan Sandbox & Production berdampingan dalam satu proses.
> Implementasi kami mereproduksi logika SDK dan diuji setara dengannya. SDK tetap terpasang sebagai devDependency.

## 1. Mendapatkan kredensial

1. Daftar/masuk ke **Merchant Portal DANA** (https://dashboard.dana.id/) dan ajukan produk **Payment Gateway**.
2. Di server Anda, buat pasangan kunci RSA: `npm run keygen -- rsa`.
3. Unggah **public key** ke Merchant Portal. Simpan private key dengan aman (jangan commit, jangan kirim lewat chat).
4. Catat dari Merchant Portal: **Partner ID / Client ID** (`X-PARTNER-ID`), **Merchant ID**, opsional Sub Merchant ID /
   External Store ID, **MCC** usaha Anda, dan **public key DANA** (wajib untuk Production).
5. Jika ingin QRIS, pastikan akses QRIS memang aktif di akun merchant.

## 2. Memasukkan kredensial

Admin → **Pengaturan DANA** → pilih **Sandbox** atau **Production** → isi formulir → konfirmasi password admin.
Kredensial disimpan terenkripsi AES-256-GCM (`APP_ENCRYPTION_KEY`), tidak pernah dikirim ke browser, dan setiap
perubahan masuk audit log. Field rahasia yang dikosongkan = tidak diubah.

Tekan **Validasi sekarang**: FxB Pay memeriksa kelengkapan, konektivitas HTTPS, lalu mengirim Query Payment untuk
referensi acak. Respons "tidak ditemukan" (`404xxxx`) berarti signature diterima; `401xxxx` berarti Partner ID/kunci salah.

## 3. Webhook (Finish Notify)

- Salin **Notify URL** dari halaman Pengaturan DANA dan daftarkan di Merchant Portal. URL yang sama juga dikirim pada
  `urlParams` (`NOTIFICATION`) setiap order; `PAY_RETURN` diarahkan ke `/pay/{id}/selesai`.
- `APP_URL` harus HTTPS publik. Untuk sandbox lokal gunakan tunnel HTTPS dan set `APP_URL` ke domain tunnel.
- Verifikasi: signature RSA-SHA256 dengan public key DANA env terkait (Sandbox default memakai public key sandbox
  resmi dari SDK). Lalu dicocokkan: referensi (`originalPartnerReferenceNo`), merchant ID, nominal, mata uang (IDR), status.
- `00` → LUNAS (saldo dicatat sekali saja), `05` → kedaluwarsa/dibatalkan. Callback duplikat → idempoten; callback
  `05` setelah lunas → diabaikan; callback lunas setelah kedaluwarsa → tetap dicatat dan ditandai untuk tinjauan;
  nominal/merchant tidak cocok → tidak dikreditkan, ditahan untuk tinjauan admin.
- Error internal dibalas 5xx agar DANA mengirim ulang (aman karena idempoten). Semua notifikasi disimpan (header disensor)
  dan terlihat di Pengaturan DANA → Notifikasi masuk.
- Timeout saat Create Order → order ditandai "tidak pasti", tidak dibuat ulang; job melakukan Query Payment. Jika DANA
  tidak mengenal order, pembeli bisa mencoba lagi; jika order ada tanpa URL checkout, order dibatalkan di DANA.

## 4. Menjalankan pengujian & UAT

Admin → **Sandbox & UAT**. Tiga kategori dipisah tegas:

1. **Pengujian lokal aplikasi** — 12 skenario otomatis memakai *test harness lokal* (kunci RSA milik FxB Pay yang
   **hanya** diterima endpoint notify sandbox): pembayaran berhasil, ditutup, kedaluwarsa, signature salah, callback
   duplikat, nominal tidak cocok, timeout, callback terlambat, tidak berurutan, race condition, refund, integritas ledger.
2. **Integrasi DANA Sandbox** — panggilan nyata: validasi konfigurasi, konektivitas, autentikasi & signature, signature
   salah ditolak, Create Order, Query, field tidak valid, Cancel, pembayaran manual dengan akun uji DANA, Finish Notify
   diterima, Query lunas, Refund.
3. **Status UAT resmi Merchant Portal** — jalankan skenario wajib di Merchant Portal (*Mandatory API Testing*;
   skrip resmi `dana-id/uat-script` dapat membantu), lalu **catat manual** hasilnya beserta bukti. FxB Pay tidak bisa
   membaca status ini dan tidak pernah menandainya lulus dari simulasi lokal.

Setiap hasil menyimpan request/response yang disensor, response code, durasi, waktu, dan penyebab gagal; dapat diulang,
disalin, dan diekspor (JSON).

**Simulasi callback** (khusus admin, khusus Sandbox) mengirim Finish Notify bertanda tangan harness melalui jalur
verifikasi yang sama. Endpoint Production tidak memuat kunci harness → simulasi tidak mungkin menambah saldo Production.

## 5. Aktivasi Production

Checklist di halaman Sandbox & UAT dihitung dari data nyata: kredensial Production lengkap, HTTPS, kunci enkripsi
khusus, seluruh tes lokal & sandbox lulus, UAT resmi wajib tercatat lulus, **status persetujuan merchant tercatat
"Disetujui DANA"**, semua admin ber-2FA, SMTP, worker hidup, tidak ada penarikan berstatus tidak pasti. Aktivasi
memerlukan ketik `AKTIFKAN PRODUCTION` + password admin dan ditolak server bila checklist belum lengkap.
Tombol ini hanya membuka mode Production di FxB Pay — **tidak menggantikan persetujuan DANA**.
