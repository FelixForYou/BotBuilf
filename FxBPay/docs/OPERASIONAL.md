# Operasional

## Worker & job

`npm run worker` memproses antrean `jobs` (PostgreSQL, `FOR UPDATE SKIP LOCKED`, aman multi-instance):
`webhook.deliver` (retry backoff 30 dtk → maks 6 jam, 8 percobaan), `payment.query` (cek status DANA, pembatalan
order kedaluwarsa), `payments.sweep` (tiap menit), `ledger.release_held` (tiap 5 menit), `reconcile.run` (tiap 6 jam
per env), `email.send`, `maintenance.cleanup` (harian). Di serverless gunakan `/api/cron` tiap menit.
Admin → Ringkasan memberi peringatan bila job tertunda > 5 menit.

## Rekonsiliasi

Admin → Settlement & rekonsiliasi → **Jalankan rekonsiliasi**: integritas ledger, status lunas ↔ jurnal capture,
nominal jurnal ↔ tagihan, refund ↔ jurnal, saldo dicadangkan ↔ penarikan/refund terbuka, dan Query Payment resmi
ke DANA untuk order terbuka (hasil "lunas di DANA" dicatat melalui jalur resmi yang sama dan ditandai diperbaiki).
Catat setiap settlement dari DANA (nominal + referensi mutasi bank) agar piutang DANA berkurang dan selisih terlihat.

## Backup & pemulihan

```bash
BACKUP_DIR=/var/backups/fxbpay BACKUP_KEEP=28 npm run backup     # pg_dump format custom + verifikasi + rotasi
# cron: 0 */6 * * * cd /srv/fxbpay && DATABASE_URL=... npm run backup
```

Simpan salinan di lokasi berbeda (object storage terenkripsi). **Cadangkan juga `APP_ENCRYPTION_KEY` terpisah dari
backup database** — tanpa kunci ini kredensial DANA & secret webhook tidak dapat dibuka.

Pemulihan:

```bash
createdb fxbpay_restore
pg_restore --no-owner --dbname=postgres://.../fxbpay_restore /var/backups/fxbpay/fxbpay-YYYYMMDDTHHMMSSZ.dump
DATABASE_URL=postgres://.../fxbpay_restore npm run db:migrate   # memastikan skema terbaru
```

Setelah pulih: hentikan worker lama, arahkan `DATABASE_URL` ke database hasil restore, jalankan rekonsiliasi untuk
kedua env, lalu jalankan Query Payment (rekonsiliasi melakukannya otomatis) agar pembayaran yang terjadi setelah titik
backup tercatat dari sumber resmi DANA. Uji prosedur ini berkala di staging.

## Keamanan (ringkas)

- Sesi: token acak 256-bit, disimpan sebagai hash, cookie `HttpOnly` + `SameSite=Lax` + `Secure`/`__Host-` saat HTTPS;
  admin 12 jam, pengguna 7 hari; ganti password mencabut sesi lain.
- CSRF: header wajib `X-FxB-CSRF` + pemeriksaan Origin untuk semua mutasi ber-cookie. API merchant memakai Bearer key (tanpa cookie).
- Password: scrypt (N=32768); rate limit login per IP & email, kunci akun 15 menit setelah 8 gagal; 2FA TOTP anti-replay.
- Otorisasi di server pada setiap route; data pengguna selalu difilter `user_id` (tes isolasi di `tests/isolation-api.test.ts`).
- SQL injection: query terparameter Drizzle; XSS: React escaping + CSP; CSV injection dinetralkan.
- Secret: kredensial DANA & secret webhook terenkripsi AES-256-GCM; API key disimpan sebagai SHA-256; log & pusat UAT menyensor header/field sensitif.
- SSRF: webhook hanya https, port 443/8443, DNS dicek ke alamat publik pada saat koneksi (anti DNS-rebinding), tanpa redirect.
- Audit log append-only untuk kredensial, biaya, saldo, role, penarikan, refund, aktivasi production.
