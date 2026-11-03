/// Konfigurasi aplikasi FxB RestApi.
///
/// Domain backend diatur oleh developer di file ini SEBELUM build.
/// Pengguna aplikasi tidak perlu (dan tidak bisa) mengubah domain.
///
/// Bisa juga ditimpa saat build tanpa mengedit file:
///   flutter build apk --release --dart-define=FXB_BASE_URL=https://domain-lain.xyz
///
/// JANGAN menaruh SESSION_SECRET, password admin, atau kredensial provider di sini.
/// Semua rahasia tetap berada di server (file .env.local backend).
class AppConfig {
  AppConfig._();

  /// Base URL backend website FxB RestApi (tanpa garis miring di akhir).
  static const String baseUrl = String.fromEnvironment('FXB_BASE_URL', defaultValue: 'https://api.felixiority.xyz');

  static const String appName = 'FxB RestApi';
  static const String brand = 'FELIXIORITY';
  static const String version = '1.0.0';

  /// Batas waktu untuk API internal (auth, dashboard, admin).
  static const Duration apiTimeout = Duration(seconds: 25);

  /// Batas waktu untuk gateway /api/v1 (server memakai maxDuration 60 detik).
  static const Duration gatewayTimeout = Duration(seconds: 75);

  /// Origin yang dikirim pada request yang mengubah data, sesuai cek CSRF backend
  /// (lib/http.ts → assertSameOrigin membandingkan host Origin dengan Host).
  static String get origin {
    final u = Uri.parse(baseUrl);
    return '${u.scheme}://${u.authority}';
  }

  static Uri uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse(baseUrl);
    final full = Uri.parse('$baseUrl$path');
    return Uri(
      scheme: base.scheme,
      host: base.host,
      port: base.hasPort ? base.port : null,
      path: full.path,
      queryParameters: (query == null || query.isEmpty) ? null : query,
    );
  }
}
