import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../config/app_config.dart';
import 'api_exception.dart';
import 'session_store.dart';

/// Klien HTTP untuk backend website FxB RestApi.
///
/// Kontrak backend (dibaca dari source Next.js):
/// - API internal (`/api/auth`, `/api/keys`, `/api/admin`, …) membalas
///   `{ ok: true, data }` atau `{ ok: false, error: { code, message, details } }`.
/// - Login membuat cookie httpOnly `fxb_session`. Aplikasi menyimpannya di
///   penyimpanan aman lalu mengirimnya kembali sebagai header Cookie.
/// - Request yang mengubah data diperiksa `assertSameOrigin`: header Origin harus
///   ber-host sama dengan domain backend. Aplikasi mengirim Origin = domain backend
///   yang dikonfigurasi developer. Tidak ada validasi yang dimatikan.
class ApiClient {
  ApiClient({SessionStore? store, http.Client Function()? clientFactory}) : store = store ?? SessionStore(), _factory = clientFactory ?? http.Client.new {
    _client = _factory();
  }

  final SessionStore store;
  final http.Client Function() _factory;
  late http.Client _client;

  static const sessionCookie = 'fxb_session';
  static const _ua = 'FxBRestApi-Android/${AppConfig.version}';

  /// Dipanggil saat backend menyatakan sesi tidak berlaku (401 UNAUTHORIZED).
  void Function()? onSessionExpired;

  Future<Map<String, String>> _headers({bool json = false, bool mutating = false}) async {
    final h = <String, String>{'Accept': 'application/json', 'User-Agent': _ua};
    final token = await store.readSession();
    if (token != null) h['Cookie'] = '$sessionCookie=$token';
    if (json) h['Content-Type'] = 'application/json';
    if (mutating) h['Origin'] = AppConfig.origin;
    return h;
  }

  /// Ambil nilai `fxb_session` dari header Set-Cookie (bila ada) lalu simpan.
  Future<void> captureCookie(Map<String, String> headers) async {
    final raw = headers['set-cookie'];
    if (raw == null) return;
    final m = RegExp('(?:^|[,;\\s])$sessionCookie=([^;,]*)').firstMatch(raw);
    if (m == null) return;
    final value = m.group(1)!.trim();
    final lower = raw.toLowerCase();
    final expired = value.isEmpty || lower.contains('max-age=0') || lower.contains('expires=thu, 01 jan 1970');
    await store.writeSession(expired ? null : value);
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) => _send('GET', path, query: query);
  Future<dynamic> post(String path, [Object? body]) => _send('POST', path, body: body ?? const {});
  Future<dynamic> patch(String path, Object body) => _send('PATCH', path, body: body);
  Future<dynamic> delete(String path, [Object? body]) => _send('DELETE', path, body: body);

  Future<dynamic> _send(String method, String path, {Map<String, String>? query, Object? body}) async {
    final mutating = method != 'GET';
    final uri = AppConfig.uri(path, query);
    // Hanya GET yang boleh diulang otomatis (sekali, saat koneksi putus).
    // POST/PATCH/DELETE tidak pernah diulang otomatis agar tidak membuat data ganda.
    final attempts = mutating ? 1 : 2;
    for (var i = 0; i < attempts; i++) {
      try {
        final req = http.Request(method, uri);
        req.headers.addAll(await _headers(json: body != null, mutating: mutating));
        if (body != null) req.body = jsonEncode(body);
        final streamed = await _client.send(req).timeout(AppConfig.apiTimeout);
        final res = await http.Response.fromStream(streamed).timeout(AppConfig.apiTimeout);
        await captureCookie(res.headers);
        return _decodeEnvelope(res);
      } on ApiException {
        rethrow;
      } catch (e) {
        final err = mapTransportError(e);
        if (i + 1 < attempts && err.code == 'NETWORK') {
          await Future<void>.delayed(const Duration(milliseconds: 700));
          continue;
        }
        throw err;
      }
    }
    throw ApiException('NETWORK', 'Tidak dapat terhubung ke server.');
  }

  dynamic _decodeEnvelope(http.Response res) {
    Object? j;
    try {
      j = jsonDecode(utf8.decode(res.bodyBytes));
    } catch (_) {
      j = null;
    }
    if (j is Map && j['ok'] == true && res.statusCode < 400) return j['data'];
    if (j is Map && j['error'] is Map) {
      final e = j['error'] as Map;
      final ex = ApiException(
        '${e['code'] ?? 'ERROR'}',
        '${e['message'] ?? 'Permintaan gagal (HTTP ${res.statusCode}).'}',
        status: res.statusCode,
        details: e['details'],
        retryAfter: int.tryParse(res.headers['retry-after'] ?? ''),
      );
      if (ex.isUnauthorized) {
        unawaited(store.writeSession(null));
        onSessionExpired?.call();
      }
      throw ex;
    }
    throw statusError(res.statusCode);
  }

  /// Error untuk respons non-JSON (biasanya dari reverse proxy / panel saat backend mati).
  static ApiException statusError(int status) {
    if (status == 502 || status == 503 || status == 504 || status == 521 || status == 522 || status == 523 || status == 530) {
      return ApiException(
        'BACKEND_UNAVAILABLE',
        'Backend ${AppConfig.uri('/').host} belum dapat diakses (HTTP $status). '
            'Server Pterodactyl kemungkinan sedang mati, restart, atau belum menjalankan aplikasi. '
            'Coba lagi beberapa saat lagi.',
        status: status,
      );
    }
    if (status == 429) {
      return ApiException('RATE_LIMITED', 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.', status: status);
    }
    return ApiException('BAD_RESPONSE', 'Server membalas dengan format yang tidak dikenali (HTTP $status).', status: status);
  }

  static ApiException mapTransportError(Object e) {
    if (e is ApiException) return e;
    if (e is TimeoutException) {
      return ApiException('TIMEOUT', 'Server tidak merespons tepat waktu. Periksa koneksi lalu coba lagi.');
    }
    if (e is HandshakeException || e is TlsException) {
      return ApiException('NETWORK', 'Koneksi aman (HTTPS) ke server gagal. Periksa jam perangkat atau jaringan.');
    }
    if (e is SocketException || e is http.ClientException || e is HttpException) {
      return ApiException('NETWORK', 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
    }
    return ApiException('NETWORK', 'Koneksi gagal: $e');
  }

  // ---------------------------------------------------------------------------
  // Gateway publik /api/v1 (dipakai API Explorer / Try API)
  // ---------------------------------------------------------------------------

  /// Kirim request ke gateway. Tidak pernah diulang otomatis.
  ///
  /// [apiKey] → header X-API-Key. Tanpa key, aplikasi memakai "mode Explorer"
  /// yang sama seperti website: cookie sesi + `Sec-Fetch-Site: same-origin`,
  /// sehingga kuota dihitung pada key terbaik akun (atau kuota uji coba IP bila
  /// belum login). Validasi tier, limit, dan parameter tetap dilakukan server.
  Future<GatewayResult> gateway({
    required String method,
    required String path,
    required Map<String, String> params,
    Map<String, GatewayFile> files = const {},
    String? apiKey,
    GatewayCancel? cancel,
  }) async {
    final client = _factory();
    cancel?._attach(client);
    final started = DateTime.now();
    try {
      final headers = <String, String>{'Accept': 'application/json, */*', 'User-Agent': _ua};
      if (apiKey != null && apiKey.trim().isNotEmpty) {
        headers['X-API-Key'] = apiKey.trim();
      } else {
        final token = await store.readSession();
        if (token != null) headers['Cookie'] = '$sessionCookie=$token';
        headers['Sec-Fetch-Site'] = 'same-origin';
        headers['Origin'] = AppConfig.origin;
      }
      final useForm = files.isNotEmpty;
      late http.BaseRequest req;
      if (method == 'GET' && !useForm) {
        req = http.Request('GET', AppConfig.uri(path, params))..headers.addAll(headers);
      } else if (useForm) {
        final m = http.MultipartRequest('POST', AppConfig.uri(path))..headers.addAll(headers);
        m.fields.addAll(params);
        for (final e in files.entries) {
          m.files.add(http.MultipartFile.fromBytes(e.key, e.value.bytes, filename: e.value.name, contentType: MediaType.parse(e.value.contentType)));
        }
        req = m;
      } else {
        req = http.Request('POST', AppConfig.uri(path))
          ..headers.addAll({...headers, 'Content-Type': 'application/json'})
          ..body = jsonEncode(params);
      }
      final streamed = await client.send(req).timeout(AppConfig.gatewayTimeout);
      final headerMs = DateTime.now().difference(started).inMilliseconds;
      final bytes = await streamed.stream.toBytes().timeout(AppConfig.gatewayTimeout);
      return GatewayResult.fromBytes(
        status: streamed.statusCode,
        headers: streamed.headers,
        bytes: bytes,
        ms: headerMs,
        totalMs: DateTime.now().difference(started).inMilliseconds,
      );
    } catch (e) {
      if (cancel?.cancelled ?? false) throw const GatewayCancelled();
      throw mapTransportError(e);
    } finally {
      client.close();
    }
  }
}

class GatewayFile {
  GatewayFile(this.name, this.bytes, {String? contentType}) : contentType = contentType ?? mimeFor(name);
  final String name;
  final Uint8List bytes;

  /// Content-Type bagian multipart. Backend upload/file memeriksa tipe ini
  /// (png, jpeg, webp, pdf, txt) dan mencocokkannya dengan isi file.
  final String contentType;

  static String mimeFor(String name) {
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
    return switch (ext) {
      'png' => 'image/png',
      'jpg' || 'jpeg' => 'image/jpeg',
      'webp' => 'image/webp',
      'gif' => 'image/gif',
      'svg' => 'image/svg+xml',
      'pdf' => 'application/pdf',
      'txt' || 'log' || 'md' || 'csv' => 'text/plain',
      'json' => 'application/json',
      'mp4' => 'video/mp4',
      'mp3' => 'audio/mpeg',
      _ => 'application/octet-stream',
    };
  }
}

class GatewayCancelled implements Exception {
  const GatewayCancelled();
}

/// Membatalkan request gateway yang sedang berjalan (menutup koneksinya).
class GatewayCancel {
  http.Client? _c;
  bool cancelled = false;
  void _attach(http.Client c) => _c = c;
  void cancel() {
    cancelled = true;
    _c?.close();
  }
}

class GatewayResult {
  GatewayResult({
    required this.status,
    required this.headers,
    required this.bytes,
    required this.contentType,
    required this.ms,
    required this.totalMs,
    this.json,
    this.text,
  });

  factory GatewayResult.fromBytes({
    required int status,
    required Map<String, String> headers,
    required Uint8List bytes,
    required int ms,
    required int totalMs,
  }) {
    final ct = headers['content-type'] ?? '';
    Object? json;
    String? text;
    if (ct.contains('json') || ct.startsWith('text/') || ct.contains('svg') || ct.isEmpty) {
      text = utf8.decode(bytes, allowMalformed: true);
      if (!ct.contains('svg')) {
        try {
          json = jsonDecode(text);
        } catch (_) {}
      }
    }
    return GatewayResult(status: status, headers: headers, bytes: bytes, contentType: ct, ms: ms, totalMs: totalMs, json: json, text: text);
  }

  final int status;
  final Map<String, String> headers;
  final Uint8List bytes;
  final String contentType;
  final int ms;
  final int totalMs;
  final Object? json;
  final String? text;

  bool get ok => status >= 200 && status < 300;
  bool get isImage => contentType.startsWith('image/') && !isSvg;
  bool get isSvg => contentType.contains('svg');
  bool get isJson => json != null;

  Map? get error => json is Map ? (json as Map)['error'] as Map? : null;
  String? get errorCode => error?['code']?.toString();

  /// Respons non-JSON 5xx = berasal dari proxy/panel, bukan dari aplikasi FxB.
  bool get backendDown => !isJson && (status == 502 || status == 503 || status == 504 || status >= 520);
}
