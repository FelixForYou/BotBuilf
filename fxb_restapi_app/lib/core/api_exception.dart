/// Error yang aman ditampilkan ke pengguna.
///
/// [code] mengikuti kode error backend (UNAUTHORIZED, RATE_LIMITED, dst.) atau
/// kode lokal aplikasi (NETWORK, TIMEOUT, BACKEND_UNAVAILABLE, BAD_RESPONSE).
class ApiException implements Exception {
  ApiException(this.code, this.message, {this.status = 0, this.details, this.retryAfter});

  final String code;
  final String message;
  final int status;
  final Object? details;
  final int? retryAfter;

  /// Error yang berasal dari jaringan/aplikasi, bukan dari backend.
  bool get isLocal => status == 0;
  bool get isUnauthorized => status == 401 && (code == 'UNAUTHORIZED');
  bool get isBackendDown => code == 'BACKEND_UNAVAILABLE';

  /// Pesan error per parameter dari `error.details` (INVALID_PARAMS).
  Map<String, String> get fieldErrors {
    final d = details;
    if (d is! List) return const {};
    final out = <String, String>{};
    for (final e in d) {
      if (e is Map && e['param'] is String) out[e['param'] as String] = '${e['message'] ?? 'Tidak valid'}';
    }
    return out;
  }

  String get title => switch (code) {
    'NETWORK' => 'Tidak ada koneksi',
    'TIMEOUT' => 'Server terlalu lama merespons',
    'BACKEND_UNAVAILABLE' => 'Backend belum dapat diakses',
    'UNAUTHORIZED' => 'Sesi berakhir',
    'FORBIDDEN' || 'FORBIDDEN_ORIGIN' => 'Akses ditolak',
    'RATE_LIMITED' => 'Terlalu banyak percobaan',
    'NOT_FOUND' => 'Data tidak ditemukan',
    'INVALID_CREDENTIALS' => 'Login gagal',
    'BAD_RESPONSE' => 'Respons tidak dikenali',
    _ => 'Permintaan gagal',
  };

  @override
  String toString() => 'ApiException($code, $status): $message';
}
