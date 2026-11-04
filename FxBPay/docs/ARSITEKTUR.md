# Arsitektur keuangan

## Akun ledger (per env: `sandbox` / `production`)

| Akun | Jenis | Sisi normal | Boleh negatif |
|---|---|---|---|
| `user_available` (per pengguna) | Liabilitas | Kredit | Tidak |
| `user_held` (per pengguna) | Liabilitas | Kredit | Tidak |
| `user_reserved` (per pengguna) | Liabilitas | Kredit | Tidak |
| `platform_fee` | Pendapatan | Kredit | Tidak |
| `provider_clearing` (piutang DANA) | Aset | Debit | Ya |
| `settlement_bank` (rekening platform) | Aset | Debit | Ya |
| `platform_adjustment` | Ekuitas | Kredit | Ya |

Invarian (dicek rekonsiliasi): aset = liabilitas pengguna + pendapatan + ekuitas.

## Jurnal

| Peristiwa | Debit | Kredit | Idempotency key |
|---|---|---|---|
| Pembayaran terverifikasi | provider_clearing (bruto) | user_held / user_available (bersih) + platform_fee (biaya) | `payment:{id}:capture` |
| Masa tahan selesai | user_held | user_available | `payment:{id}:release` |
| Penarikan diajukan | user_available | user_reserved | `withdrawal:{id}:reserve` |
| Penarikan dicairkan | user_reserved | settlement_bank (bersih) + platform_fee (biaya) | `withdrawal:{id}:paid` |
| Penarikan ditolak/gagal | user_reserved | user_available | `withdrawal:{id}:release` |
| Refund diajukan | user_available | user_reserved | `refund:{id}:reserve` |
| Refund berhasil | user_reserved | provider_clearing | `refund:{id}:complete` |
| Refund gagal | user_reserved | user_available | `refund:{id}:release` |
| Settlement DANA masuk | settlement_bank | provider_clearing | `settlement:{id}` |
| Koreksi admin (+/−) | platform_adjustment / user_available | user_available / platform_adjustment | `adjustment:{uuid}` |
| Reversal | kebalikan jurnal asal | | `reversal:{journalId}` |

Pengaman di database (`drizzle/0001_guards.sql`): entri, jurnal, audit log tidak bisa diubah/dihapus; jurnal harus
seimbang saat commit; nominal & pemilik pembayaran tidak bisa diubah; CHECK saldo non-negatif.

## Status pembayaran

```
CREATED ─▶ PENDING ─▶ PAID ─▶ REFUND_PENDING ─▶ PARTIALLY_REFUNDED ─▶ REFUNDED
   │          │                      ▲  └──────────▶ PAID (refund gagal)
   ├──────────┴─▶ EXPIRED / FAILED / CANCELLED ──▶ PAID  (hanya bila diverifikasi provider: callback terlambat)
```

Pemetaan `latestTransactionStatus` DANA: `00` → PAID · `01` Initiated, `02` Paying → PENDING ·
`05` → EXPIRED (lewat masa berlaku) / CANCELLED · `07` → tidak ditemukan (tidak mengubah status).

Timeline UI: Dibuat → Menunggu Pembayaran → Pembayaran Terverifikasi → Saldo Dicatat; settlement ditampilkan terpisah.

## Penarikan

`PENDING_REVIEW → APPROVED → (PROCESSING) → PAID`, atau `REJECTED` / `FAILED` (saldo kembali). `UNCERTAIN` hanya
bisa ditutup sebagai `PAID` (dengan bukti) atau `FAILED` (dengan konfirmasi bank) — tidak bisa dicoba ulang begitu saja.
