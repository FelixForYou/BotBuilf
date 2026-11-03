import 'package:flutter_test/flutter_test.dart';
import 'package:fxb_restapi/core/format.dart';
import 'package:fxb_restapi/core/snippets.dart';
import 'package:fxb_restapi/models/models.dart';
import 'package:fxb_restapi/widgets/code.dart';

void main() {
  test('format angka & rupiah gaya id-ID', () {
    expect(fmtNum(0), '0');
    expect(fmtNum(1234567), '1.234.567');
    expect(fmtIDR(25000), 'Rp25.000');
    expect(mmss(75000), '01:15');
    expect(fmtBytes(2048), '2.0 KB');
  });

  test('tanggal memakai WIB (UTC+7)', () {
    // 2026-11-03 17:30 UTC = 2026-11-04 00:30 WIB
    final ms = DateTime.utc(2026, 11, 3, 17, 30).millisecondsSinceEpoch;
    expect(fmtDate(ms), '4 Nov 2026');
    expect(fmtTimeWib(ms), '00.30');
  });

  test('fmtRel', () {
    final now = DateTime(2026, 1, 1, 12);
    expect(fmtRel(now.millisecondsSinceEpoch - 30000, now: now), 'baru saja');
    expect(fmtRel(now.millisecondsSinceEpoch - 5 * 60000, now: now), '5 mnt lalu');
    expect(fmtRel(null), '—');
  });

  Endpoint ep(String method, List<Map<String, Object>> params) => Endpoint.fromJson({
    'id': 'tools/dns',
    'category': 'tools',
    'group': 'Network',
    'name': 'DNS',
    'description': '',
    'method': method,
    'path': '/api/v1/tools/dns',
    'tier': 'free',
    'response': 'json',
    'params': params,
    'status': 'online',
  });

  test('snippet GET identik dengan website (apikey di query)', () {
    final s = snippets(
      ep('GET', [
        {'name': 'domain', 'type': 'string', 'required': true, 'description': '', 'example': 'google.com'},
      ]),
      'https://api.felixiority.xyz',
    );
    expect(s['cURL'], 'curl "https://api.felixiority.xyz/api/v1/tools/dns?domain=google.com&apikey=YOUR_API_KEY"');
    expect(s.keys, ['cURL', 'JavaScript', 'Python', 'PHP']);
  });

  test('snippet multipart untuk parameter file wajib', () {
    final s = snippets(
      ep('POST', [
        {'name': 'file', 'type': 'file', 'required': true, 'description': ''},
      ]),
      'https://x.y',
    );
    expect(s['cURL'], contains('-F "file=@./file.png"'));
    expect(s['cURL'], contains('X-API-Key: YOUR_API_KEY'));
  });

  test('collectUrls menemukan tautan hasil di JSON bersarang', () {
    final urls = collectUrls({
      'url': 'https://api.felixiority.xyz/f/abc',
      'nested': [
        {'thumb': 'https://cdn.x/a.jpg'},
        'bukan url',
      ],
    });
    expect(urls, ['https://api.felixiority.xyz/f/abc', 'https://cdn.x/a.jpg']);
    expect(looksLikeImage(urls[1]), isTrue);
  });

  test('model Endpoint & ApiKeyInfo membaca JSON backend', () {
    final e = Endpoint.fromJson({
      'id': 'video/status',
      'method': 'GET',
      'tier': 'premium',
      'status': 'maintenance',
      'params': [
        {'name': 'taskId', 'type': 'string', 'required': true, 'description': 'x', 'max': 100},
      ],
    });
    expect(e.premium, isTrue);
    expect(e.online, isFalse);
    expect(e.params.single.required, isTrue);
    final k = ApiKeyInfo({'id': 'key_1', 'status': 'active', 'effective_tier': 'premium', 'used_today': '7', 'daily': 1000});
    expect(k.premium, isTrue);
    expect(k.usedToday, 7);
  });
}
