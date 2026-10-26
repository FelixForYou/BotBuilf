import '../../data/models/app_settings.dart';

/// Turns whatever the user typed into something a WebView can load.
abstract final class UrlUtils {
  static final _scheme = RegExp(r'^[a-zA-Z][a-zA-Z0-9+.\-]*:');
  static final _hostPort = RegExp(r'^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-fA-F:]+\])(:\d{1,5})?([/?#].*)?$');
  static final _domain = RegExp(
    r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}(:\d{1,5})?([/?#].*)?$',
  );

  /// True when [input] should be navigated to directly instead of searched.
  static bool looksLikeUrl(String input) {
    final s = input.trim();
    if (s.isEmpty || s.contains(RegExp(r'\s'))) return false;
    if (s.startsWith('about:') || s.startsWith('data:')) return true;
    if (s.contains('://')) return _scheme.hasMatch(s);
    return _hostPort.hasMatch(s) || _domain.hasMatch(s);
  }

  /// Resolves typed input to a loadable URL using the chosen search engine.
  static String resolve(String input, SearchEngine engine, {String customTemplate = ''}) {
    final s = input.trim();
    if (looksLikeUrl(s)) {
      if (s.contains('://') || s.startsWith('about:') || s.startsWith('data:')) return s;
      final isLocal = _hostPort.hasMatch(s);
      return '${isLocal ? 'http' : 'https'}://$s';
    }
    return searchUrl(s, engine, customTemplate: customTemplate);
  }

  static String searchUrl(String query, SearchEngine engine, {String customTemplate = ''}) {
    final template = engine == SearchEngine.custom && isValidTemplate(customTemplate)
        ? customTemplate
        : (engine == SearchEngine.custom ? SearchEngine.google.template : engine.template);
    return template.replaceAll('%s', Uri.encodeQueryComponent(query));
  }

  static bool isValidTemplate(String t) {
    final s = t.trim();
    if (!s.contains('%s')) return false;
    final uri = Uri.tryParse(s.replaceAll('%s', 'q'));
    return uri != null && (uri.scheme == 'https' || uri.scheme == 'http') && uri.host.isNotEmpty;
  }

  static String host(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || uri.host.isEmpty) return '';
    return uri.host.startsWith('www.') ? uri.host.substring(4) : uri.host;
  }

  /// Short, human form for the address pill: host only for web pages.
  static String display(String url) {
    if (url.isEmpty) return '';
    final h = host(url);
    return h.isNotEmpty ? h : url;
  }

  static bool isSecure(String url) => url.startsWith('https://');

  static bool isWeb(String url) => url.startsWith('http://') || url.startsWith('https://');

  /// Schemes the WebView should never try to render itself.
  static bool isExternalScheme(String url) {
    final m = _scheme.firstMatch(url);
    if (m == null) return false;
    final scheme = m.group(0)!.toLowerCase();
    return !const {'http:', 'https:', 'about:', 'data:', 'blob:', 'javascript:', 'file:'}
        .contains(scheme);
  }

  /// Search terms if [url] is a results page of [engine], for showing the
  /// query instead of a long URL when editing.
  static String? queryFrom(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return null;
    return uri.queryParameters['q'] ?? uri.queryParameters['query'];
  }

  static String fileNameFromUrl(String url) {
    final uri = Uri.tryParse(url);
    final seg = uri?.pathSegments.where((s) => s.isNotEmpty).lastOrNull;
    return (seg == null || seg.isEmpty) ? 'download' : Uri.decodeComponent(seg);
  }
}
