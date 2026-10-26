import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../data/models/download_entry.dart';

class NativeDownloadRequest {
  const NativeDownloadRequest({
    required this.tabId,
    required this.url,
    required this.userAgent,
    required this.contentDisposition,
    required this.mimeType,
    required this.contentLength,
  });

  final String tabId;
  final String url;
  final String userAgent;
  final String contentDisposition;
  final String mimeType;
  final int contentLength;
}

class NativeDownloadStatus {
  const NativeDownloadStatus({
    required this.id,
    required this.status,
    required this.downloaded,
    required this.total,
    required this.fileName,
    required this.mimeType,
  });

  final int id;
  final DownloadStatus status;
  final int downloaded;
  final int total;
  final String fileName;
  final String mimeType;
}

class WebHookResult {
  const WebHookResult({required this.attached, required this.isolated});
  final bool attached;

  /// Whether a private tab got its own cookie/storage profile.
  final bool isolated;
}

/// Thin typed layer over the Kotlin side (see MainActivity.kt).
class NativeBridge {
  NativeBridge() {
    _app.setMethodCallHandler(_onAppCall);
    _web.setMethodCallHandler(_onWebCall);
  }

  static const _app = MethodChannel('mint/app');
  static const _web = MethodChannel('mint/web');
  static const _downloads = MethodChannel('mint/downloads');
  static const _floating = MethodChannel('mint/floating');

  final _openUrl = StreamController<String>.broadcast();
  final _downloadRequests = StreamController<NativeDownloadRequest>.broadcast();

  /// URLs handed to the app from other apps or the floating window.
  Stream<String> get openUrlRequests => _openUrl.stream;
  Stream<NativeDownloadRequest> get downloadRequests => _downloadRequests.stream;

  Future<Object?> _onAppCall(MethodCall call) async {
    if (call.method == 'openUrl' && call.arguments is String) {
      _openUrl.add(call.arguments as String);
    }
    return null;
  }

  Future<Object?> _onWebCall(MethodCall call) async {
    if (call.method == 'onDownload') {
      final m = (call.arguments as Map).cast<String, Object?>();
      _downloadRequests.add(NativeDownloadRequest(
        tabId: m['tabId'] as String? ?? '',
        url: m['url'] as String? ?? '',
        userAgent: m['userAgent'] as String? ?? '',
        contentDisposition: m['contentDisposition'] as String? ?? '',
        mimeType: m['mimeType'] as String? ?? '',
        contentLength: (m['contentLength'] as num?)?.toInt() ?? -1,
      ));
    }
    return null;
  }

  Future<T?> _invoke<T>(MethodChannel ch, String method, [Object? args]) async {
    try {
      return await ch.invokeMethod<T>(method, args);
    } on MissingPluginException {
      return null;
    } on PlatformException catch (e) {
      debugPrint('NativeBridge ${ch.name}.$method failed: ${e.code} ${e.message}');
      rethrow;
    }
  }

  // ── App ───────────────────────────────────────────────────────────────

  Future<String?> initialUrl() => _invoke<String>(_app, 'getInitialUrl');

  /// Requests Android runtime permissions; returns true if all were granted.
  Future<bool> requestAndroidPermissions(List<String> kinds) async =>
      await _invoke<bool>(_app, 'requestPermissions', kinds) ?? false;

  Future<List<String>> pickFiles({required bool multiple, required List<String> accept}) async {
    final r = await _invoke<List<Object?>>(_app, 'pickFiles', {
      'multiple': multiple,
      'accept': accept,
    });
    return r?.whereType<String>().toList() ?? const [];
  }

  /// Hands a non-web URL (tel:, mailto:, intent:, market:) to Android.
  /// Returns a fallback web URL from an intent: link when no app handles it.
  Future<({bool handled, String? fallback})> openExternal(String url) async {
    final r = await _invoke<Map<Object?, Object?>>(_app, 'openExternal', url);
    return (handled: r?['handled'] == true, fallback: r?['fallback'] as String?);
  }

  Future<void> openDefaultBrowserSettings() => _invoke<void>(_app, 'openDefaultAppsSettings');

  // ── WebView hooks ─────────────────────────────────────────────────────

  Future<WebHookResult> attachWebView({
    required int webViewId,
    required String tabId,
    required bool isPrivate,
    required String privateProfile,
    required bool blockThirdPartyCookies,
    required bool darken,
  }) async {
    final r = await _invoke<Map<Object?, Object?>>(_web, 'attach', {
      'id': webViewId,
      'tabId': tabId,
      'private': isPrivate,
      'profile': privateProfile,
      'blockThirdPartyCookies': blockThirdPartyCookies,
      'darken': darken,
    });
    return WebHookResult(attached: r?['attached'] == true, isolated: r?['isolated'] == true);
  }

  Future<void> updateWebView({
    required int webViewId,
    required bool blockThirdPartyCookies,
    required bool darken,
  }) =>
      _invoke<void>(_web, 'update', {
        'id': webViewId,
        'blockThirdPartyCookies': blockThirdPartyCookies,
        'darken': darken,
      });

  Future<Uint8List?> capture(int webViewId, {int width = 360}) =>
      _invoke<Uint8List>(_web, 'capture', {'id': webViewId, 'width': width});

  Future<bool> isProfileIsolationSupported() async =>
      await _invoke<bool>(_web, 'isMultiProfileSupported') ?? false;

  Future<void> clearBrowsingData({
    required bool cookies,
    required bool cache,
    required bool storage,
  }) =>
      _invoke<void>(_web, 'clearData', {'cookies': cookies, 'cache': cache, 'storage': storage});

  /// Erases cookies/storage of private profiles; [keep] stays usable.
  Future<void> wipePrivateProfiles({String? keep}) =>
      _invoke<void>(_web, 'wipePrivateProfiles', {'keep': keep});

  Future<void> flushCookies() => _invoke<void>(_web, 'flushCookies');

  // ── Downloads ─────────────────────────────────────────────────────────

  Future<({int id, String fileName})?> enqueueDownload({
    required String url,
    required String userAgent,
    required String contentDisposition,
    required String mimeType,
    required String profile,
  }) async {
    final r = await _invoke<Map<Object?, Object?>>(_downloads, 'enqueue', {
      'url': url,
      'userAgent': userAgent,
      'contentDisposition': contentDisposition,
      'mimeType': mimeType,
      'profile': profile,
    });
    if (r == null) return null;
    return (id: (r['id'] as num).toInt(), fileName: r['fileName'] as String? ?? 'download');
  }

  Future<List<NativeDownloadStatus>> queryDownloads(List<int> ids) async {
    if (ids.isEmpty) return const [];
    final r = await _invoke<List<Object?>>(_downloads, 'query', ids);
    if (r == null) return const [];
    return r.whereType<Map>().map((m) {
      return NativeDownloadStatus(
        id: (m['id'] as num).toInt(),
        status: DownloadStatus.values.firstWhere(
          (s) => s.name == m['status'],
          orElse: () => DownloadStatus.failed,
        ),
        downloaded: (m['downloaded'] as num?)?.toInt() ?? 0,
        total: (m['total'] as num?)?.toInt() ?? -1,
        fileName: m['fileName'] as String? ?? '',
        mimeType: m['mimeType'] as String? ?? '',
      );
    }).toList();
  }

  Future<bool> openDownload(int id) async => await _invoke<bool>(_downloads, 'open', id) ?? false;

  Future<void> removeDownload(int id, {required bool deleteFile}) =>
      _invoke<void>(_downloads, 'remove', {'id': id, 'deleteFile': deleteFile});

  // ── Floating window ───────────────────────────────────────────────────

  Future<bool> canDrawOverlays() async =>
      await _invoke<bool>(_floating, 'canDrawOverlays') ?? false;

  Future<void> requestOverlayPermission() => _invoke<void>(_floating, 'requestPermission');

  Future<bool> openFloatingWindow(String url, String title) async =>
      await _invoke<bool>(_floating, 'open', {'url': url, 'title': title}) ?? false;

  Future<void> closeFloatingWindow() => _invoke<void>(_floating, 'close');
}
