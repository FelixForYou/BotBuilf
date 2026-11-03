import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fxb_restapi/config/app_config.dart';
import 'package:fxb_restapi/core/api_client.dart';
import 'package:fxb_restapi/core/api_exception.dart';
import 'package:fxb_restapi/core/session_store.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

http.Response jsonRes(Object body, {int status = 200, Map<String, String> headers = const {}}) =>
    http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json', ...headers});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  ApiClient make(Future<http.Response> Function(http.Request) handler) => ApiClient(store: SessionStore(), clientFactory: () => MockClient(handler));

  test('login mengirim Origin + JSON, menyimpan cookie fxb_session, lalu mengirimnya kembali', () async {
    final seen = <http.Request>[];
    final api = make((req) async {
      seen.add(req);
      if (req.url.path == '/api/auth/login') {
        return jsonRes(
          {
            'ok': true,
            'data': {
              'user': {'id': 'usr_1'},
            },
          },
          headers: {'set-cookie': 'fxb_session=tok123abc; Path=/; Expires=Wed, 03 Dec 2026 10:00:00 GMT; HttpOnly; SameSite=lax'},
        );
      }
      return jsonRes({
        'ok': true,
        'data': {'id': 'usr_1', 'email': 'a@b.co', 'name': 'A', 'role': 'user', 'status': 'active', 'created_at': 1},
      });
    });

    await api.post('/api/auth/login', {'email': 'a@b.co', 'password': 'x'});
    expect(seen.first.method, 'POST');
    expect(seen.first.headers['Origin'], AppConfig.origin);
    expect(seen.first.headers['Content-Type'], startsWith('application/json'));
    expect(jsonDecode(seen.first.body), {'email': 'a@b.co', 'password': 'x'});
    expect(api.store.cachedSession, 'tok123abc');

    final me = await api.get('/api/auth/me');
    expect((me as Map)['email'], 'a@b.co');
    expect(seen.last.headers['Cookie'], 'fxb_session=tok123abc');
    expect(seen.last.headers.containsKey('Origin'), isFalse, reason: 'GET tidak perlu Origin');
  });

  test('cookie kosong / kedaluwarsa dari logout menghapus sesi', () async {
    final api = make(
      (req) async => jsonRes({'ok': true, 'data': true}, headers: {'set-cookie': 'fxb_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'}),
    );
    await api.store.writeSession('lama');
    await api.post('/api/auth/logout');
    expect(api.store.cachedSession, isNull);
  });

  test('ganti password: cookie sesi baru menggantikan yang lama', () async {
    final api = make((req) async => jsonRes({'ok': true, 'data': true}, headers: {'set-cookie': 'fxb_session=baru999; Path=/; HttpOnly'}));
    await api.store.writeSession('lama');
    await api.post('/api/account/password', {'current': 'a', 'next': 'bbbbbbbb'});
    expect(api.store.cachedSession, 'baru999');
  });

  test('error envelope backend diteruskan apa adanya (code, message, details, Retry-After)', () async {
    final api = make(
      (req) async => jsonRes(
        {
          'ok': false,
          'error': {
            'code': 'RATE_LIMITED',
            'message': 'Terlalu banyak percobaan.',
            'details': [
              {'param': 'email', 'message': 'x'},
            ],
          },
        },
        status: 429,
        headers: {'retry-after': '30'},
      ),
    );
    try {
      await api.post('/api/auth/login', {'email': 'a', 'password': 'b'});
      fail('harus melempar');
    } on ApiException catch (e) {
      expect(e.code, 'RATE_LIMITED');
      expect(e.status, 429);
      expect(e.retryAfter, 30);
      expect(e.fieldErrors, {'email': 'x'});
    }
  });

  test('401 UNAUTHORIZED menghapus sesi dan memanggil onSessionExpired', () async {
    var expired = 0;
    final api = make(
      (req) async => jsonRes({
        'ok': false,
        'error': {'code': 'UNAUTHORIZED', 'message': 'Silakan login terlebih dahulu.'},
      }, status: 401),
    );
    api.onSessionExpired = () => expired++;
    await api.store.writeSession('tok');
    await expectLater(api.get('/api/keys'), throwsA(isA<ApiException>().having((e) => e.code, 'code', 'UNAUTHORIZED')));
    expect(api.store.cachedSession, isNull);
    expect(expired, 1);
  });

  test('502 HTML dari proxy/panel → BACKEND_UNAVAILABLE (tidak disamarkan)', () async {
    final api = make((req) async => http.Response('<html>502 Bad Gateway</html>', 502, headers: {'content-type': 'text/html'}));
    await expectLater(
      api.get('/api/stats'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'BACKEND_UNAVAILABLE').having((e) => e.status, 'status', 502)),
    );
  });

  test('POST tidak pernah diulang otomatis saat koneksi putus', () async {
    var calls = 0;
    final api = make((req) async {
      calls++;
      throw const SocketException('down');
    });
    await expectLater(api.post('/api/keys', {'name': 'x'}), throwsA(isA<ApiException>().having((e) => e.code, 'code', 'NETWORK')));
    expect(calls, 1);
  });

  test('GET diulang sekali saat koneksi putus lalu berhasil', () async {
    var calls = 0;
    final api = make((req) async {
      calls++;
      if (calls == 1) throw const SocketException('blip');
      return jsonRes({'ok': true, 'data': 5});
    });
    expect(await api.get('/api/stats'), 5);
    expect(calls, 2);
  });

  test('gateway mode sesi: cookie + Sec-Fetch-Site same-origin, query GET', () async {
    late http.BaseRequest seen;
    final api = make((req) async {
      seen = req;
      return jsonRes({'status': true, 'result': 1}, headers: {'x-tier': 'free', 'x-ratelimit-remaining': '99'});
    });
    await api.store.writeSession('tok');
    final r = await api.gateway(method: 'GET', path: '/api/v1/tools/dns', params: {'domain': 'google.com'});
    expect(seen.url.path, '/api/v1/tools/dns');
    expect(seen.url.queryParameters, {'domain': 'google.com'});
    expect(seen.headers['Cookie'], 'fxb_session=tok');
    expect(seen.headers['Sec-Fetch-Site'], 'same-origin');
    expect(r.ok, isTrue);
    expect(r.headers['x-tier'], 'free');
    expect((r.json as Map)['result'], 1);
  });

  test('gateway mode API key: X-API-Key, tanpa cookie, body JSON untuk POST', () async {
    late http.Request seen;
    final api = make((req) async {
      seen = req;
      return jsonRes({
        'status': false,
        'error': {'code': 'INVALID_PARAMS', 'message': 'x'},
      }, status: 400);
    });
    await api.store.writeSession('tok');
    final r = await api.gateway(method: 'POST', path: '/api/v1/ai/qwerty', params: {'text': 'hai'}, apiKey: 'fxb_abc');
    expect(seen.headers['X-API-Key'], 'fxb_abc');
    expect(seen.headers.containsKey('Cookie'), isFalse);
    expect(jsonDecode(seen.body), {'text': 'hai'});
    expect(r.ok, isFalse);
    expect(r.errorCode, 'INVALID_PARAMS');
  });

  test('gateway: respons gambar biner dikenali, 502 HTML ditandai backendDown', () async {
    final png = [137, 80, 78, 71];
    var n = 0;
    final api = make((req) async {
      n++;
      return n == 1
          ? http.Response.bytes(png, 200, headers: {'content-type': 'image/png'})
          : http.Response('<html>Bad gateway</html>', 502, headers: {'content-type': 'text/html'});
    });
    final img = await api.gateway(method: 'GET', path: '/api/v1/tools/qr', params: {'text': 'x'});
    expect(img.isImage, isTrue);
    expect(img.bytes.length, 4);
    final down = await api.gateway(method: 'GET', path: '/api/v1/tools/qr', params: {'text': 'x'});
    expect(down.backendDown, isTrue);
  });

  test('id endpoint ber-slash tetap ter-encode untuk /api/admin/endpoints/{id}', () {
    final u = AppConfig.uri('/api/admin/endpoints/${Uri.encodeComponent('tools/dns')}');
    expect(u.toString(), endsWith('/api/admin/endpoints/tools%2Fdns'));
  });
}
