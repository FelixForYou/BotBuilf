// Uji integrasi NYATA terhadap backend FxB RestApi yang sedang berjalan.
// Dilewati secara default. Jalankan dengan:
//
//   flutter test test/backend_contract_test.dart \
//     --dart-define=FXB_LIVE=true --dart-define=FXB_BASE_URL=http://localhost:3000
//
// PERINGATAN: membuat akun & data uji di database backend tujuan. Gunakan backend
// lokal/staging, bukan produksi.
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fxb_restapi/config/app_config.dart';
import 'package:fxb_restapi/core/api_client.dart';
import 'package:fxb_restapi/core/api_exception.dart';
import 'package:fxb_restapi/core/session_store.dart';
import 'package:fxb_restapi/models/models.dart';
import 'package:http/http.dart' as http;

const live = bool.fromEnvironment('FXB_LIVE');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  // flutter_test memblokir HTTP sungguhan; aktifkan kembali untuk uji ini.
  HttpOverrides.global = null;

  final stamp = DateTime.now().millisecondsSinceEpoch;
  final emailA = 'admin$stamp@test.local';
  final emailB = 'user$stamp@test.local';
  const pw = 'rahasia-123';

  late ApiClient a; // admin (user pertama pada DB kosong)
  late ApiClient b; // user biasa

  setUpAll(() {
    FlutterSecureStorage.setMockInitialValues({});
    a = ApiClient(store: SessionStore());
    b = ApiClient(store: SessionStore(_MemStorage()));
  });

  group('kontrak backend (live: ${AppConfig.baseUrl})', skip: !live, () {
    test('publik: stats, catalog, plans', () async {
      final s = PublicStats.fromJson(await a.get('/api/stats') as Map);
      expect(s.endpoints, greaterThan(0));
      final c = Catalog.fromJson(await a.get('/api/catalog') as Map);
      expect(c.categories, isNotEmpty);
      expect(c.byId('tools/hash'), isNotNull);
      final p = PlansInfo.fromJson(await a.get('/api/plans') as Map);
      expect(p.freeDaily, greaterThan(0));
    });

    test('validasi Origin backend tetap aktif (request tanpa Origin ditolak)', () async {
      final r = await http.post(AppConfig.uri('/api/auth/login'), headers: {'content-type': 'application/json'}, body: '{"email":"x@y.zz","password":"x"}');
      expect(r.statusCode, 403);
      expect(r.body, contains('FORBIDDEN_ORIGIN'));
    });

    test('register → sesi cookie tersimpan → /api/auth/me', () async {
      final data = await a.post('/api/auth/register', {'name': 'Admin Uji', 'email': emailA, 'password': pw}) as Map;
      expect(data['apiKey'], startsWith('fxb_'));
      expect(a.store.cachedSession, isNotNull);
      final me = User.fromJson(await a.get('/api/auth/me') as Map);
      expect(me.email, emailA);
      expect(me.quota, isNotNull);

      await b.post('/api/auth/register', {'name': 'User Uji', 'email': emailB, 'password': pw});
      final meB = User.fromJson(await b.get('/api/auth/me') as Map);
      expect(meB.isAdmin, isFalse);
    });

    test('validasi form register (email ganda → EMAIL_TAKEN 409)', () async {
      final c = ApiClient(store: SessionStore(_MemStorage()));
      await expectLater(
        c.post('/api/auth/register', {'name': 'Xy', 'email': emailB, 'password': pw}),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', anyOf('EMAIL_TAKEN', 'RATE_LIMITED'))),
      );
    });

    late String keyId;
    late String secret;
    test('API key: buat, daftar, ganti nama, buat ulang', () async {
      final created = await b.post('/api/keys', {'name': 'Bot Uji'}) as Map;
      keyId = created['id'] as String;
      secret = created['key'] as String;
      final list = (await b.get('/api/keys') as List).whereType<Map>().map(ApiKeyInfo.new).toList();
      expect(list.any((k) => k.id == keyId && k.active), isTrue);
      await b.patch('/api/keys/$keyId', {'name': 'Bot Uji 2'});
      final regen = await b.patch('/api/keys/$keyId', {'action': 'regenerate'}) as Map;
      expect(regen['key'], isNot(secret));
      secret = regen['key'] as String;
    });

    test('gateway dengan API key: POST JSON tools/hash', () async {
      final r = await b.gateway(method: 'POST', path: '/api/v1/tools/hash', params: {'text': 'halo'}, apiKey: secret);
      expect(r.status, 200, reason: r.text);
      expect((r.json as Map)['status'], true);
      expect(r.headers['x-ratelimit-remaining'], isNotNull);
    });

    test('gateway mode sesi (seperti Explorer website): GET tools/uuid', () async {
      final r = await b.gateway(method: 'GET', path: '/api/v1/tools/uuid', params: {});
      expect(r.status, 200, reason: r.text);
      expect((r.json as Map)['result'], isNotNull);
    });

    test('gateway: parameter salah → INVALID_PARAMS dengan details', () async {
      final r = await b.gateway(method: 'POST', path: '/api/v1/tools/hash', params: {}, apiKey: secret);
      expect(r.status, 400);
      expect(r.errorCode, 'INVALID_PARAMS');
      expect(r.error?['details'], isA<List>());
    });

    test('gateway: key salah → INVALID_API_KEY 401', () async {
      final r = await b.gateway(method: 'GET', path: '/api/v1/tools/uuid', params: {}, apiKey: 'fxb_${'0' * 40}');
      expect(r.status, 401);
      expect(r.errorCode, anyOf('INVALID_API_KEY', 'INVALID_API_KEY_FORMAT'));
    });

    test('gateway multipart: upload/file mengembalikan URL file', () async {
      final bytes = Uint8List.fromList('halo dari aplikasi FxB'.codeUnits);
      final r = await b.gateway(method: 'POST', path: '/api/v1/upload/file', params: {}, files: {'file': GatewayFile('uji.txt', bytes)}, apiKey: secret);
      expect(r.status, 200, reason: r.text);
      final res = (r.json as Map)['result'] as Map;
      final url = (res['url'] ?? res['link'] ?? res.values.firstWhere((v) => v is String && v.contains('/f/'))) as String;
      expect(url, contains('/f/'));
    });

    test('video/status: task milik orang lain / tidak ada → TASK_NOT_FOUND', () async {
      final r = await b.gateway(method: 'GET', path: '/api/v1/video/status', params: {'taskId': 'tidak-ada'}, apiKey: secret);
      expect(r.status, 404);
      expect(r.errorCode, 'TASK_NOT_FOUND');
    });

    test('ai/qwerty: sessionId asing ditolak SESSION_NOT_FOUND', () async {
      final r = await b.gateway(method: 'POST', path: '/api/v1/ai/qwerty', params: {'text': 'hai', 'sessionId': 'bukan-sesi'}, apiKey: secret);
      expect(r.status, 404);
      expect(r.errorCode, 'SESSION_NOT_FOUND');
    });

    test('statistik penggunaan & order', () async {
      final u = Usage.fromJson(await b.get('/api/usage', query: {'days': '7'}) as Map);
      expect(u.total, greaterThan(0));
      expect(u.series.length, 7);
      expect(await b.get('/api/orders'), isA<List>());
    });

    test('non-admin ditolak di /api/admin/*', () async {
      await expectLater(b.get('/api/admin/stats'), throwsA(isA<ApiException>().having((e) => e.status, 'status', 403)));
    });

    test('admin: stats, users, keys, endpoints, plans, orders, settings', () async {
      final s = await a.get('/api/admin/stats') as Map;
      expect(s['users'], greaterThanOrEqualTo(2));
      final users = await a.get('/api/admin/users', query: {'q': emailB}) as List;
      expect(users.single['email'], emailB);
      final keys = await a.get('/api/admin/keys', query: {'q': emailB}) as List;
      expect(keys, isNotEmpty);
      final eps = await a.get('/api/admin/endpoints') as List;
      expect(eps.any((e) => (e as Map)['id'] == 'tools/uuid'), isTrue);
      expect(await a.get('/api/admin/orders'), isA<List>());
      final st = await a.get('/api/admin/settings') as Map;
      expect(st['providers'], isA<List>());

      // Maintenance on → gateway 503 MAINTENANCE → off lagi.
      final id = Uri.encodeComponent('tools/uuid');
      await a.patch('/api/admin/endpoints/$id', {'enabled': false, 'tier': 'free', 'note': 'uji aplikasi'});
      await Future<void>.delayed(const Duration(milliseconds: 200));
      final m = await b.gateway(method: 'GET', path: '/api/v1/tools/uuid', params: {}, apiKey: secret);
      expect(m.status, 503);
      expect(m.errorCode, 'MAINTENANCE');
      await a.patch('/api/admin/endpoints/$id', {'enabled': true, 'tier': 'free', 'note': ''});

      // Paket: buat → ubah → hapus.
      final pid = 'uji-$stamp';
      await a.post('/api/admin/plans', {
        'id': pid,
        'name': 'Uji',
        'description': '',
        'price': 15000,
        'duration_days': 30,
        'daily_limit': 5000,
        'rpm_limit': 60,
        'rank': 1,
        'sort': 9,
        'active': false,
      });
      await a.patch('/api/admin/plans/$pid', {'name': 'Uji 2', 'price': 20000, 'duration_days': 30, 'daily_limit': 5000, 'rpm_limit': 60, 'active': false});
      final del = await a.delete('/api/admin/plans/$pid') as Map;
      expect(del['deleted'], true);

      // Admin key: ubah limit key user B lalu kembalikan.
      final kid = (keys.first as Map)['id'];
      await a.patch('/api/admin/keys/$kid', {'tier': 'free', 'daily_limit': 321, 'rpm_limit': null, 'expires_at': null});
      final k2 = (await a.get('/api/admin/keys', query: {'q': emailB}) as List).firstWhere((k) => (k as Map)['id'] == kid) as Map;
      expect(k2['daily_limit'], 321);

      // Pengaturan: simpan nilai yang sama (tidak mengubah perilaku).
      final cur = st['settings'] as Map;
      final saved = await a.patch('/api/admin/settings', {'free_rpm': cur['free_rpm']}) as Map;
      expect((saved['settings'] as Map)['free_rpm'], cur['free_rpm']);
    });

    test('ganti password → cookie baru berlaku, profil bisa diubah', () async {
      final before = b.store.cachedSession;
      await b.post('/api/account/password', {'current': pw, 'next': '$pw-baru'});
      expect(b.store.cachedSession, isNot(before));
      final r = await b.patch('/api/account', {'name': 'User Uji Baru'}) as Map;
      expect(r['name'], 'User Uji Baru');
    });

    test('logout → me null, login lagi → sesi baru', () async {
      await b.post('/api/auth/logout');
      expect(b.store.cachedSession, isNull);
      expect(await b.get('/api/auth/me'), isNull);
      await b.post('/api/auth/login', {'email': emailB, 'password': '$pw-baru'});
      expect(User.fromJson(await b.get('/api/auth/me') as Map).email, emailB);
    });

    test('login salah → INVALID_CREDENTIALS', () async {
      final c = ApiClient(store: SessionStore(_MemStorage()));
      await expectLater(
        c.post('/api/auth/login', {'email': emailB, 'password': 'salah-sekali'}),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', anyOf('INVALID_CREDENTIALS', 'RATE_LIMITED'))),
      );
    });

    test('revoke key & hapus akun user uji', () async {
      await b.delete('/api/keys/$keyId');
      final r = await b.gateway(method: 'GET', path: '/api/v1/tools/uuid', params: {}, apiKey: secret);
      expect(r.errorCode, 'KEY_REVOKED');
      await b.delete('/api/account', {'password': '$pw-baru'});
      expect(b.store.cachedSession, isNull);
    });
  });
}

/// Penyimpanan terpisah per klien agar dua akun uji tidak berbagi cookie.
class _MemStorage extends FlutterSecureStorage {
  _MemStorage();
  final _m = <String, String>{};
  @override
  Future<String?> read({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => _m[key];
  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value == null) {
      _m.remove(key);
    } else {
      _m[key] = value;
    }
  }

  @override
  Future<void> delete({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => _m.remove(key);
}
