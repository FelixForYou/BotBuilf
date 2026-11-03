import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/page.dart';

/// Kebijakan Privasi & Syarat Layanan (teks sama dengan app/legal/* website).
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.terms});
  final bool terms;

  static const _privacy = [
    (
      'Data yang kami simpan',
      '• Akun: nama, email, hash password (scrypt).\n• API key: hanya hash SHA-256 dan prefix 10 karakter.\n• Log request: endpoint, status, latensi, waktu, dan hash IP (bukan IP mentah). Parameter request (mis. URL atau teks prompt) tidak disimpan di log.\n• Order: paket, nominal, status, dan referensi transaksi dari payment gateway.',
    ),
    (
      'Data yang tidak kami simpan',
      'Detail kartu, nomor rekening, atau kredensial e-wallet tidak pernah melewati server kami — pembayaran diproses langsung oleh payment gateway (Midtrans/Xendit).',
    ),
    (
      'Pihak ketiga',
      'Beberapa endpoint meneruskan parameter ke penyedia eksternal yang tercantum di dokumentasi setiap endpoint (mis. penyedia AI, downloader, cuaca). Kebijakan privasi penyedia tersebut berlaku untuk data yang kamu kirim ke endpoint itu.',
    ),
    (
      'File & short link',
      'File yang diunggah lewat endpoint upload dan link pendek bersifat publik bagi siapa pun yang memiliki URL-nya. Jangan unggah data sensitif.',
    ),
    (
      'Retensi',
      'Log request disimpan maksimal 90 hari (dapat diatur). Menghapus akun akan menghapus akun dan seluruh API key; riwayat order disimpan untuk keperluan pembukuan.',
    ),
    (
      'Cookie & penyimpanan aplikasi',
      'Website memakai satu cookie sesi httpOnly (fxb_session) untuk login. Aplikasi Android menyimpan token sesi yang sama secara terenkripsi di perangkat (Android Keystore), beserta salinan API key yang kamu buat di aplikasi ini. Preferensi tema disimpan lokal.',
    ),
    ('Kontak', 'Pertanyaan privasi dapat diajukan kepada pengelola layanan, FELIXIORITY.'),
  ];

  static const _terms = [
    ('Penerimaan', 'Dengan membuat akun atau memakai API FxB RestApi kamu menyetujui syarat ini.'),
    (
      'Penggunaan yang diizinkan',
      'Kamu bertanggung jawab atas konten yang kamu proses. Dilarang memakai layanan untuk: melanggar hak cipta atau ketentuan platform asal konten, mengunduh konten privat tanpa izin, spam, penipuan, mengumpulkan data pribadi orang lain, atau aktivitas ilegal lainnya. Endpoint profil hanya menampilkan informasi publik.',
    ),
    (
      'API key & limit',
      'Key bersifat pribadi; jangan dibagikan. Kami dapat menangguhkan key/akun yang menyalahgunakan layanan atau mencoba melewati rate limit.',
    ),
    (
      'Premium & pembayaran',
      'Paket premium berlaku sesuai masa aktif yang tertera dan aktif setelah pembayaran terverifikasi. Perpanjangan menambah sisa masa aktif. Pembayaran yang sudah diverifikasi tidak dapat dikembalikan kecuali layanan tidak dapat diberikan karena kesalahan kami.',
    ),
    (
      'Ketersediaan',
      'Sebagian endpoint bergantung pada penyedia pihak ketiga yang dapat berubah atau berhenti sewaktu-waktu. Kami berupaya memberi pesan error yang jelas, namun tidak menjamin ketersediaan 100%.',
    ),
    ('Perubahan', 'Syarat, harga, dan limit dapat berubah. Perubahan harga tidak memengaruhi paket yang sudah dibayar.'),
  ];

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final sections = terms ? _terms : _privacy;
    return FxPage(
      title: terms ? 'Syarat Layanan' : 'Kebijakan Privasi',
      subtitle: 'Diperbarui 3 November 2026',
      children: [
        const SizedBox(height: 12),
        for (final s in sections)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FxCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.$1, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Text(s.$2, style: TextStyle(fontSize: 14.5, color: fx.muted, height: 1.45)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
