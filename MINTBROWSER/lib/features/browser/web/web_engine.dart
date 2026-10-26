import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../../core/platform/native_bridge.dart';
import '../../../core/utils/url_utils.dart';
import '../../../data/models/app_settings.dart';
import '../../../data/models/browser_tab.dart';
import '../../../data/models/site_permission.dart';
import '../../../router.dart';
import '../../../state/core_providers.dart';
import '../../../state/downloads_provider.dart';
import '../../../state/history_provider.dart';
import '../../../state/settings_provider.dart';
import '../../../state/site_permissions_provider.dart';
import '../../../state/tabs_provider.dart';
import '../../../widgets/dialogs.dart';
import '../../../widgets/mint_button.dart';
import '../../../widgets/toast.dart';
import '../widgets/permission_prompt.dart';

final webEngineProvider = Provider<WebEngine>((ref) {
  final engine = WebEngine(ref);
  ref.onDispose(engine.dispose);
  return engine;
});

/// Whether private tabs get their own cookie jar on this device
/// (androidx.webkit multi-profile, WebView 110+). Null until checked.
final privateIsolationProvider = FutureProvider<bool>(
  (ref) => ref.read(nativeBridgeProvider).isProfileIsolationSupported(),
);

const _desktopUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/131.0.0.0 Safari/537.36';

/// Native WebView plus bookkeeping for one tab.
class TabSession {
  TabSession(this.tabId, this.controller, this.isPrivate);

  final String tabId;
  final WebViewController controller;
  final bool isPrivate;
  late final Future<void> ready;
  int? nativeId;
  String? pendingUrl;
}

/// Owns every tab's [WebViewController] and translates WebView callbacks into
/// [TabsNotifier] updates. Only a few sessions stay alive; older background
/// tabs are discarded and reload from their saved URL when reopened.
class WebEngine implements TabLifecycleListener {
  WebEngine(this.ref) {
    ref.read(tabsProvider.notifier).listener = this;
    _settingsSub = ref.listen<AppSettings>(settingsProvider, (prev, next) {
      if (prev != null) _applySettings(prev, next);
    });
    _downloadSub = _bridge.downloadRequests.listen(_onDownload);
    // Leftovers from a previous run (private tabs are never restored).
    unawaited(_bridge.wipePrivateProfiles().catchError((_) {}));
  }

  final Ref ref;
  static const maxLiveSessions = 5;

  final Map<String, TabSession> _sessions = {};
  final List<String> _lru = [];
  late final ProviderSubscription<AppSettings> _settingsSub;
  late final StreamSubscription<NativeDownloadRequest> _downloadSub;
  final Map<String, Timer> _metaTimers = {};

  /// Profile name used by the current private session; rotated when the
  /// last private tab closes so a new session never sees old data.
  String _privateProfile = _newProfileName();

  /// Scroll offsets reported by the active page (for the collapsing bars).
  final ValueNotifier<double> scrollY = ValueNotifier(0);

  static String _newProfileName() => 'mint_private_${DateTime.now().millisecondsSinceEpoch}';

  NativeBridge get _bridge => ref.read(nativeBridgeProvider);
  TabsNotifier get _tabs => ref.read(tabsProvider.notifier);
  AppSettings get _settings => ref.read(settingsProvider);

  void dispose() {
    _settingsSub.close();
    _downloadSub.cancel();
    for (final t in _metaTimers.values) {
      t.cancel();
    }
    scrollY.dispose();
  }

  bool hasSession(String tabId) => _sessions.containsKey(tabId);

  /// Returns the live session for [tab], creating (and loading) it if needed.
  TabSession sessionFor(BrowserTab tab) {
    final existing = _sessions[tab.id];
    if (existing != null) {
      _touch(tab.id);
      return existing;
    }
    final controller = WebViewController.fromPlatformCreationParams(
      const PlatformWebViewControllerCreationParams(),
    );
    final session = TabSession(tab.id, controller, tab.isPrivate);
    session.ready = _configure(session, tab.url);
    _sessions[tab.id] = session;
    _touch(tab.id);
    _evict();
    return session;
  }

  void _touch(String id) {
    _lru
      ..remove(id)
      ..add(id);
  }

  void _evict() {
    final activeId = ref.read(tabsProvider).activeId;
    while (_sessions.length > maxLiveSessions) {
      final victim = _lru.firstWhere((id) => id != activeId, orElse: () => '');
      if (victim.isEmpty) break;
      discard(victim);
    }
  }

  /// Drops the native WebView of a tab; the tab keeps its URL.
  void discard(String tabId) {
    _sessions.remove(tabId);
    _lru.remove(tabId);
    _metaTimers.remove(tabId)?.cancel();
  }

  Future<void> _configure(TabSession s, String initialUrl) async {
    final c = s.controller;
    final android = c.platform as AndroidWebViewController;
    final settings = _settings;
    final tabId = s.tabId;

    await c.setJavaScriptMode(
      settings.javaScript ? JavaScriptMode.unrestricted : JavaScriptMode.disabled,
    );
    await c.setBackgroundColor(Colors.white);
    await c.setUserAgent(settings.desktopMode ? _desktopUserAgent : null);
    await c.enableZoom(true);
    await android.setTextZoom(settings.textZoom);
    await android.setMediaPlaybackRequiresUserGesture(true);
    await android.setGeolocationEnabled(true);
    await android.setMixedContentMode(MixedContentMode.compatibilityMode);

    await c.setNavigationDelegate(NavigationDelegate(
      onNavigationRequest: (req) => _onNavigationRequest(s, req),
      onPageStarted: (url) => _tabs.patch(
        tabId,
        (t) => t.copyWith(
          url: url,
          isLoading: true,
          progress: 0.08,
          showHome: false,
          clearError: true,
        ),
      ),
      onProgress: (p) => _tabs.patch(
        tabId,
        (t) => t.copyWith(progress: (p / 100).clamp(t.isLoading ? 0.08 : 0, 1).toDouble()),
      ),
      onPageFinished: (url) => _onPageFinished(s, url),
      onUrlChange: (change) {
        final url = change.url;
        if (url == null || url.isEmpty) return;
        _tabs.patch(tabId, (t) => t.copyWith(url: url));
        _scheduleMetaRefresh(s, record: true);
      },
      onWebResourceError: (e) => _onError(s, e),
      onSslAuthError: (e) async {
        await e.cancel();
        final tab = ref.read(tabsProvider).byId(tabId);
        final platform = e.platform;
        _tabs.patch(
          tabId,
          (t) => t.copyWith(
            isLoading: false,
            progress: 1,
            error: PageError(
              url: platform is AndroidSslAuthError ? platform.url : (s.pendingUrl ?? tab?.url ?? ''),
              type: 'failedSslHandshake',
              description: platform.description,
            ),
          ),
        );
      },
    ));

    await c.setOnScrollPositionChange((change) {
      if (ref.read(tabsProvider).activeId == tabId) scrollY.value = change.y;
    });
    await android.setOnShowFileSelector(
      (params) => _bridge.pickFiles(
        multiple: params.mode == FileSelectorMode.openMultiple,
        accept: params.acceptTypes,
      ),
    );
    await android.setOnPlatformPermissionRequest((req) => _onPermissionRequest(s, req));
    await android.setGeolocationPermissionsPromptCallbacks(
      onShowPrompt: (params) async {
        final allowed = await _resolvePermission(s, {SiteCapability.location}, origin: params.origin);
        return GeolocationPermissionsResponse(allow: allowed, retain: false);
      },
    );
    await android.setOnJavaScriptAlertDialog((r) => _jsAlert(r.message));
    await android.setOnJavaScriptConfirmDialog((r) => _jsConfirm(r.message));
    await android.setOnJavaScriptTextInputDialog((r) => _jsPrompt(r.message, r.defaultText));

    try {
      s.nativeId = android.webViewIdentifier;
      await _bridge.attachWebView(
        webViewId: s.nativeId!,
        tabId: tabId,
        isPrivate: s.isPrivate,
        privateProfile: _privateProfile,
        blockThirdPartyCookies: settings.blockThirdPartyCookies || s.isPrivate,
        darken: settings.darkenPages,
      );
    } catch (e) {
      debugPrint('WebView hook failed: $e');
    }

    if (initialUrl.isNotEmpty) {
      s.pendingUrl = initialUrl;
      await c.loadRequest(Uri.parse(initialUrl));
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  /// Loads typed text (URL or search terms) in [tabId].
  Future<void> submit(String tabId, String input) {
    final s = _settings;
    final url = UrlUtils.resolve(input, s.searchEngine, customTemplate: s.customSearchTemplate);
    return load(tabId, url);
  }

  Future<void> load(String tabId, String url) async {
    final tab = ref.read(tabsProvider).byId(tabId);
    if (tab == null) return;
    if (UrlUtils.isExternalScheme(url)) {
      await _openExternal(tabId, url);
      return;
    }
    _tabs.patch(
      tabId,
      (t) => t.copyWith(url: url, showHome: false, isLoading: true, progress: 0.08, clearError: true),
    );
    final hadSession = hasSession(tabId);
    final s = sessionFor(ref.read(tabsProvider).byId(tabId)!);
    if (!hadSession) return; // _configure loads the patched URL.
    await s.ready;
    s.pendingUrl = url;
    await s.controller.loadRequest(Uri.parse(url));
  }

  Future<void> reload(String tabId) async {
    final tab = ref.read(tabsProvider).byId(tabId);
    final s = _sessions[tabId];
    if (tab == null) return;
    if (s == null || tab.error != null) {
      if (tab.error != null && tab.error!.url.isNotEmpty) return load(tabId, tab.error!.url);
      if (tab.url.isNotEmpty) return load(tabId, tab.url);
      return;
    }
    await s.ready;
    await s.controller.reload();
  }

  Future<void> stop(String tabId) async {
    final s = _sessions[tabId];
    if (s == null) return;
    await s.controller.runJavaScript('window.stop();').catchError((_) {});
    _tabs.patch(tabId, (t) => t.copyWith(isLoading: false, progress: 1));
  }

  Future<bool> goBack(String tabId) async {
    final s = _sessions[tabId];
    if (s == null || !await s.controller.canGoBack()) return false;
    _tabs.patch(tabId, (t) => t.copyWith(clearError: true));
    await s.controller.goBack();
    return true;
  }

  Future<bool> goForward(String tabId) async {
    final s = _sessions[tabId];
    if (s == null || !await s.controller.canGoForward()) return false;
    _tabs.patch(tabId, (t) => t.copyWith(clearError: true));
    await s.controller.goForward();
    return true;
  }

  Future<void> captureThumbnail(String tabId) async {
    final s = _sessions[tabId];
    if (s?.nativeId == null) return;
    try {
      final bytes = await _bridge.capture(s!.nativeId!);
      if (bytes != null && bytes.isNotEmpty) {
        _tabs.patch(tabId, (t) => t.copyWith(thumbnail: bytes));
      }
    } catch (_) {
      // Capturing is best-effort.
    }
  }

  Future<NavigationDecision> _onNavigationRequest(TabSession s, NavigationRequest req) async {
    final url = req.url;
    if (UrlUtils.isExternalScheme(url)) {
      if (req.isMainFrame) unawaited(_openExternal(s.tabId, url));
      return NavigationDecision.prevent;
    }
    if (req.isMainFrame) s.pendingUrl = url;
    return NavigationDecision.navigate;
  }

  Future<void> _openExternal(String tabId, String url) async {
    try {
      final r = await _bridge.openExternal(url);
      if (r.handled) return;
      if (r.fallback != null && UrlUtils.isWeb(r.fallback!)) {
        await load(tabId, r.fallback!);
        return;
      }
    } catch (_) {}
    _toast('No app can open this link', ToastKind.warning, message: url);
  }

  void _onPageFinished(TabSession s, String url) {
    _tabs.patch(s.tabId, (t) => t.copyWith(url: url, isLoading: false, progress: 1));
    _scheduleMetaRefresh(s, record: true, delay: Duration.zero);
    Future.delayed(const Duration(milliseconds: 700), () {
      if (ref.read(tabsProvider).activeId == s.tabId) captureThumbnail(s.tabId);
    });
  }

  void _scheduleMetaRefresh(TabSession s, {bool record = false, Duration? delay}) {
    _metaTimers[s.tabId]?.cancel();
    _metaTimers[s.tabId] = Timer(delay ?? const Duration(milliseconds: 400), () async {
      if (!_sessions.containsKey(s.tabId)) return;
      final c = s.controller;
      try {
        final results = await Future.wait([c.getTitle(), c.canGoBack(), c.canGoForward(), c.currentUrl()]);
        final title = (results[0] as String?) ?? '';
        final url = results[3] as String?;
        _tabs.patch(
          s.tabId,
          (t) => t.copyWith(
            title: title,
            url: (url == null || url.isEmpty) ? null : url,
            canGoBack: results[1] as bool,
            canGoForward: results[2] as bool,
          ),
        );
        if (record && !s.isPrivate && url != null && UrlUtils.isWeb(url)) {
          ref.read(historyProvider.notifier).record(url, title);
        }
      } catch (_) {
        // Session discarded mid-flight.
      }
    });
  }

  void _onError(TabSession s, WebResourceError e) {
    if (e.isForMainFrame != true) return;
    // Cancelled navigations (e.g. a link that turned into a download).
    if (e.errorCode == -3 || e.errorType == WebResourceErrorType.unsupportedScheme) return;
    final tab = ref.read(tabsProvider).byId(s.tabId);
    _tabs.patch(
      s.tabId,
      (t) => t.copyWith(
        isLoading: false,
        progress: 1,
        error: PageError(
          url: e.url ?? s.pendingUrl ?? tab?.url ?? '',
          type: e.errorType?.name ?? 'unknown',
          description: e.description,
          code: e.errorCode,
        ),
      ),
    );
  }

  // ── Settings ────────────────────────────────────────────────────────────

  Future<void> _applySettings(AppSettings prev, AppSettings next) async {
    for (final s in _sessions.values.toList()) {
      final c = s.controller;
      final android = c.platform as AndroidWebViewController;
      try {
        await s.ready;
        if (prev.javaScript != next.javaScript) {
          await c.setJavaScriptMode(
            next.javaScript ? JavaScriptMode.unrestricted : JavaScriptMode.disabled,
          );
        }
        if (prev.textZoom != next.textZoom) await android.setTextZoom(next.textZoom);
        if (prev.desktopMode != next.desktopMode) {
          await c.setUserAgent(next.desktopMode ? _desktopUserAgent : null);
        }
        if ((prev.blockThirdPartyCookies != next.blockThirdPartyCookies ||
                prev.darkenPages != next.darkenPages) &&
            s.nativeId != null) {
          await _bridge.updateWebView(
            webViewId: s.nativeId!,
            blockThirdPartyCookies: next.blockThirdPartyCookies || s.isPrivate,
            darken: next.darkenPages,
          );
        }
        if (prev.desktopMode != next.desktopMode || prev.javaScript != next.javaScript) {
          final tab = ref.read(tabsProvider).byId(s.tabId);
          if (tab != null && !tab.showHome && tab.url.isNotEmpty) await c.reload();
        }
      } catch (_) {
        // A session discarded while applying; it picks up settings on recreate.
      }
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  @override
  void onTabClosed(BrowserTab tab) => discard(tab.id);

  @override
  void onPrivateSessionEnded() {
    for (final id in _sessions.values.where((s) => s.isPrivate).map((s) => s.tabId).toList()) {
      discard(id);
    }
    final old = _privateProfile;
    _privateProfile = _newProfileName();
    unawaited(_bridge.wipePrivateProfiles(keep: _privateProfile).catchError((_) {}));
    debugPrint('Private session $old ended');
  }

  // ── Downloads ───────────────────────────────────────────────────────────

  Future<void> _onDownload(NativeDownloadRequest r) async {
    final tab = ref.read(tabsProvider).byId(r.tabId);
    final profile = (tab?.isPrivate ?? false) ? _privateProfile : '';
    try {
      final entry = await ref.read(downloadsProvider.notifier).start(r, profile: profile);
      _toast(
        'Downloading',
        ToastKind.success,
        message: entry.fileName,
        actionLabel: 'View',
        onAction: () => router.push(Routes.downloads),
      );
    } catch (e) {
      _toast('Download didn’t start', ToastKind.error, message: '$e');
    }
    // A download that opened a blank tab leaves nothing to show.
    if (tab != null && tab.url.isEmpty) _tabs.patch(tab.id, (t) => t.copyWith(showHome: true));
    _tabs.patch(r.tabId, (t) => t.copyWith(isLoading: false, progress: 1));
  }

  // ── Permissions ─────────────────────────────────────────────────────────

  Future<void> _onPermissionRequest(TabSession s, PlatformWebViewPermissionRequest req) async {
    final caps = <SiteCapability>{};
    for (final t in req.types) {
      if (t == WebViewPermissionResourceType.camera) caps.add(SiteCapability.camera);
      if (t == WebViewPermissionResourceType.microphone) caps.add(SiteCapability.microphone);
    }
    if (caps.isEmpty || caps.length != req.types.length) {
      // Protected media / MIDI are not offered.
      await req.deny();
      return;
    }
    final ok = await _resolvePermission(s, caps);
    ok ? await req.grant() : await req.deny();
  }

  Future<bool> _resolvePermission(TabSession s, Set<SiteCapability> caps, {String? origin}) async {
    final tab = ref.read(tabsProvider).byId(s.tabId);
    final host = UrlUtils.host(origin ?? tab?.url ?? '');
    if (host.isEmpty) return false;
    final perms = ref.read(sitePermissionsProvider.notifier);
    final verdicts = {for (final c in caps) c: perms.verdict(host, c)};
    if (verdicts.values.any((v) => v == PermissionVerdict.block)) return false;

    if (verdicts.values.any((v) => v == PermissionVerdict.ask)) {
      final ctx = rootNavigatorKey.currentContext;
      if (ctx == null || !ctx.mounted) return false;
      final decision = await showPermissionPrompt(ctx, host: host, capabilities: caps);
      if (decision == null) return false;
      // Private tabs never write choices to disk.
      if (!s.isPrivate) {
        for (final c in caps) {
          perms.decide(host, c, decision ? SiteDecision.allow : SiteDecision.block);
        }
      }
      if (!decision) return false;
    }
    final kinds = caps.map((c) => c.name).toList();
    final granted = await _bridge.requestAndroidPermissions(kinds);
    if (!granted) {
      _toast(
        'Permission needed',
        ToastKind.warning,
        message: 'Allow ${caps.map((c) => c.label.toLowerCase()).join(' and ')} for Mint in Android settings.',
      );
    }
    return granted;
  }

  // ── JavaScript dialogs ─────────────────────────────────────────────────

  Future<void> _jsAlert(String message) async {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null) return;
    await showMintDialog<void>(
      ctx,
      builder: (context) => MintDialog(
        title: 'This page says',
        message: message,
        actions: [MintButton(label: 'OK', height: 50, onPressed: () => Navigator.of(context).pop())],
      ),
    );
  }

  Future<bool> _jsConfirm(String message) async {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null) return false;
    return confirmDialog(ctx, title: 'This page asks', message: message, confirmLabel: 'OK');
  }

  Future<String> _jsPrompt(String message, String? initial) async {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null) return '';
    return await promptDialog(
          ctx,
          title: 'This page asks',
          message: message,
          initial: initial ?? '',
          confirmLabel: 'OK',
        ) ??
        '';
  }

  void _toast(
    String title,
    ToastKind kind, {
    String? message,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null) return;
    MintToast.show(
      ctx,
      title: title,
      message: message,
      kind: kind,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }
}

/// Icon used for a page error type.
IconData errorIcon(String type) => switch (type) {
      'hostLookup' || 'connect' || 'timeout' => LucideIcons.wifiOff,
      'failedSslHandshake' => LucideIcons.lockKeyhole,
      _ => LucideIcons.power,
    };
