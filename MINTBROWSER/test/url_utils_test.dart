import 'package:flutter_test/flutter_test.dart';
import 'package:mint_browser/core/utils/formatters.dart';
import 'package:mint_browser/core/utils/url_utils.dart';
import 'package:mint_browser/data/models/app_settings.dart';

void main() {
  group('UrlUtils.looksLikeUrl', () {
    test('recognises addresses', () {
      for (final s in [
        'example.com',
        'sub.domain.co.id/path?q=1',
        'https://flutter.dev',
        'localhost:8080',
        '192.168.1.1',
        'about:blank',
      ]) {
        expect(UrlUtils.looksLikeUrl(s), isTrue, reason: s);
      }
    });

    test('treats everything else as a search', () {
      for (final s in ['flutter webview', '3.14', 'hello', 'a.b', '']) {
        expect(UrlUtils.looksLikeUrl(s), isFalse, reason: s);
      }
    });
  });

  group('UrlUtils.resolve', () {
    test('adds https to bare domains and http to local hosts', () {
      expect(UrlUtils.resolve('example.com', SearchEngine.google), 'https://example.com');
      expect(UrlUtils.resolve('localhost:3000', SearchEngine.google), 'http://localhost:3000');
    });

    test('searches with the chosen engine', () {
      expect(
        UrlUtils.resolve('mint green', SearchEngine.duckDuckGo),
        'https://duckduckgo.com/?q=mint+green',
      );
    });

    test('custom engine uses its template, falls back when invalid', () {
      expect(
        UrlUtils.resolve('x y', SearchEngine.custom, customTemplate: 'https://s.example/?q=%s'),
        'https://s.example/?q=x+y',
      );
      expect(
        UrlUtils.resolve('x', SearchEngine.custom, customTemplate: 'nope'),
        'https://www.google.com/search?q=x',
      );
    });
  });

  test('template validation', () {
    expect(UrlUtils.isValidTemplate('https://a.b/s?q=%s'), isTrue);
    expect(UrlUtils.isValidTemplate('https://a.b/s?q='), isFalse);
    expect(UrlUtils.isValidTemplate('ftp://a.b/%s'), isFalse);
  });

  test('display and schemes', () {
    expect(UrlUtils.display('https://www.wikipedia.org/wiki/X'), 'wikipedia.org');
    expect(UrlUtils.isExternalScheme('tel:123'), isTrue);
    expect(UrlUtils.isExternalScheme('intent://x#Intent;end'), isTrue);
    expect(UrlUtils.isExternalScheme('https://a.b'), isFalse);
    expect(UrlUtils.fileNameFromUrl('https://a.b/files/report%201.pdf'), 'report 1.pdf');
  });

  test('formatters', () {
    final now = DateTime(2026, 10, 26, 12);
    expect(Formatters.dayLabel(DateTime(2026, 10, 26, 8), now: now), 'Today');
    expect(Formatters.dayLabel(DateTime(2026, 10, 25), now: now), 'Yesterday');
    expect(Formatters.dayLabel(DateTime(2025, 1, 2), now: now), 'Jan 2, 2025');
    expect(Formatters.bytes(50580000), '48.2 MB');
    expect(Formatters.bytes(512), '512 B');
  });
}
