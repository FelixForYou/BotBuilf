import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/browser_tab.dart';
import '../../router.dart';
import '../../state/bookmarks_provider.dart';
import '../../state/tabs_provider.dart';
import '../tabs/tab_preview.dart';
import 'home/new_tab_page.dart';
import 'web/web_engine.dart';
import 'widgets/browser_menu.dart';
import 'widgets/error_view.dart';
import 'widgets/progress_line.dart';
import 'widgets/toolbars.dart';

class BrowserScreen extends ConsumerStatefulWidget {
  const BrowserScreen({super.key});

  @override
  ConsumerState<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends ConsumerState<BrowserScreen> with SingleTickerProviderStateMixin {
  /// 1 = toolbars fully shown, 0 = tucked away while reading.
  late final AnimationController _bars = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 280),
    value: 1,
  );
  late final CurvedAnimation _barsCurve =
      CurvedAnimation(parent: _bars, curve: Motion.emphasized, reverseCurve: Motion.standard);
  late final WebEngine _engine = ref.read(webEngineProvider);
  double _lastY = 0;

  @override
  void initState() {
    super.initState();
    _engine.scrollY.addListener(_onScroll);
  }

  @override
  void dispose() {
    _engine.scrollY.removeListener(_onScroll);
    _barsCurve.dispose();
    _bars.dispose();
    super.dispose();
  }

  void _onScroll() {
    final y = _engine.scrollY.value;
    final dy = y - _lastY;
    _lastY = y;
    if (y <= 24) {
      _showBars();
    } else if (dy > 6) {
      _hideBars();
    } else if (dy < -12) {
      _showBars();
    }
  }

  void _showBars() {
    if (_bars.status != AnimationStatus.forward && _bars.value < 1) _bars.forward();
  }

  void _hideBars() {
    if (_bars.status != AnimationStatus.reverse && _bars.value > 0) _bars.reverse();
  }

  TabsNotifier get _tabs => ref.read(tabsProvider.notifier);

  bool _canBack(BrowserTab t) => t.error != null || (!t.showHome && (t.canGoBack || t.url.isNotEmpty));
  bool _canForward(BrowserTab t) => t.showHome ? t.url.isNotEmpty : t.canGoForward;

  Future<void> _back(BrowserTab t) async {
    if (t.error != null) _tabs.patch(t.id, (x) => x.copyWith(clearError: true));
    if (!t.showHome && t.canGoBack && await _engine.goBack(t.id)) return;
    _tabs.patch(t.id, (x) => x.copyWith(showHome: true, clearError: true));
  }

  Future<void> _forward(BrowserTab t) async {
    if (t.showHome) {
      _tabs.patch(t.id, (x) => x.copyWith(showHome: false));
      return;
    }
    await _engine.goForward(t.id);
  }

  void _home(BrowserTab t) {
    if (t.isLoading) _engine.stop(t.id);
    _tabs.patch(t.id, (x) => x.copyWith(showHome: true, clearError: true));
  }

  Future<void> _openSearch(BrowserTab t) async {
    final text = await context.push<String>(Routes.search, extra: t.showHome ? '' : t.url);
    if (text == null || !mounted) return;
    await _engine.submit(ref.read(tabsProvider).activeId, text);
  }

  Future<void> _openTabs(BrowserTab t) async {
    if (!t.showHome) {
      await _engine.captureThumbnail(t.id).timeout(const Duration(milliseconds: 300), onTimeout: () {});
    }
    if (mounted) await context.push(Routes.tabs);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final tab = ref.watch(tabsProvider.select((s) => s.active));
    final count = ref.watch(tabsProvider.select((s) => s.tabs.where((t) => t.isPrivate == s.active.isPrivate).length));
    final bookmarked = ref.watch(bookmarksProvider.select(
      (list) => tab.url.isNotEmpty && list.any((b) => normalizeUrl(b.url) == normalizeUrl(tab.url)),
    ));
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final padding = MediaQuery.paddingOf(context);

    // Bars always come back for anything that is not plain reading.
    ref.listen<(String, bool, bool, bool)>(
      tabsProvider.select((s) => (s.activeId, s.active.showHome, s.active.error != null, s.active.isLoading)),
      (prev, next) {
        if (prev?.$1 != next.$1 || next.$2 || next.$3 || (next.$4 && !(prev?.$4 ?? false))) {
          _lastY = 0;
          _showBars();
        }
      },
    );

    final hasPage = !tab.showHome && tab.url.isNotEmpty && tab.error == null;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (_canBack(tab)) {
          await _back(tab);
        } else {
          await SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: c.background,
        body: Column(
          children: [
            ColoredBox(
              color: c.background,
              child: Padding(
                padding: EdgeInsets.only(top: padding.top),
                child: Column(
                  children: [
                    SizeTransition(
                      sizeFactor: _barsCurve,
                      alignment: Alignment.bottomCenter,
                      child: TopToolbar(
                        tab: tab,
                        tabCount: count,
                        onHome: () => _home(tab),
                        onAddress: () => _openSearch(tab),
                        onNewTab: () => _tabs.newTab(private: tab.isPrivate),
                        onTabs: () => _openTabs(tab),
                        onMenu: () => showBrowserMenu(context, ref),
                      ),
                    ),
                    Stack(
                      children: [
                        Divider(height: 2.5, thickness: 0.6, color: c.divider),
                        ProgressLine(progress: tab.progress, loading: tab.isLoading && !tab.showHome),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: Hero(
                tag: 'tab-${tab.id}',
                flightShuttleBuilder: tabHeroShuttle,
                child: TabPreviewHost(
                  tab: tab,
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 220),
                    switchInCurve: Motion.standard,
                    switchOutCurve: Motion.standard,
                    child: _content(tab),
                  ),
                ),
              ),
            ),
            if (!keyboardOpen)
              ColoredBox(
                color: c.background,
                child: Column(
                  children: [
                    Divider(height: 0.6, thickness: 0.6, color: c.divider),
                    SizeTransition(
                      sizeFactor: _barsCurve,
                      alignment: Alignment.topCenter,
                      child: BottomToolbar(
                        canBack: _canBack(tab),
                        canForward: _canForward(tab),
                        loading: tab.isLoading && !tab.showHome,
                        bookmarked: bookmarked,
                        hasPage: hasPage,
                        onBack: () => _back(tab),
                        onForward: () => _forward(tab),
                        onReload: () => _engine.reload(tab.id),
                        onStop: () => _engine.stop(tab.id),
                        onBookmark: () => toggleBookmark(context, ref.read(bookmarksProvider.notifier), tab),
                        onShare: () => sharePage(context, tab),
                      ),
                    ),
                    SizedBox(height: padding.bottom),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _content(BrowserTab tab) {
    if (tab.showHome || tab.url.isEmpty) {
      return NewTabPage(
        key: ValueKey('home-${tab.id}'),
        tab: tab,
        onSearch: () => _openSearch(tab),
      );
    }
    if (tab.error != null) {
      return ColoredBox(
        key: ValueKey('error-${tab.id}'),
        color: context.mint.background,
        child: PageErrorView(
          error: tab.error!,
          onRetry: () => _engine.reload(tab.id),
          onHome: () => _home(tab),
        ),
      );
    }
    final session = _engine.sessionFor(tab);
    return _WebContent(key: ValueKey('web-${tab.id}'), controller: session.controller);
  }
}

class _WebContent extends StatelessWidget {
  const _WebContent({super.key, required this.controller});

  final WebViewController controller;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: WebViewWidget(controller: controller),
    );
  }
}
