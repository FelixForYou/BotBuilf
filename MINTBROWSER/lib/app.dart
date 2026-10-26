import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme/app_theme.dart';
import 'features/browser/web/web_engine.dart';
import 'router.dart';
import 'state/core_providers.dart';
import 'state/history_provider.dart';
import 'state/settings_provider.dart';
import 'state/tabs_provider.dart';

class MintApp extends ConsumerStatefulWidget {
  const MintApp({super.key});

  @override
  ConsumerState<MintApp> createState() => _MintAppState();
}

class _MintAppState extends ConsumerState<MintApp> with WidgetsBindingObserver {
  StreamSubscription<String>? _openUrlSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _openUrlSub = ref.read(nativeBridgeProvider).openUrlRequests.listen(_openExternalUrl);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _openUrlSub?.cancel();
    super.dispose();
  }

  /// A link shared to the app or sent back from the floating window.
  void _openExternalUrl(String url) {
    ref.read(webEngineProvider);
    ref.read(tabsProvider.notifier).newTab(url: url);
    final location = router.routerDelegate.currentConfiguration.uri.path;
    if (location.startsWith(Routes.browser)) router.go(Routes.browser);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      ref.read(tabsProvider.notifier).saveNow();
      ref.read(historyProvider.notifier).flush();
      ref.read(nativeBridgeProvider).flushCookies().catchError((_) {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final appearance = ref.watch(settingsProvider.select((s) => s.appearance));
    return MaterialApp.router(
      title: 'Mint Browser',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: appearance.themeMode,
      themeAnimationDuration: const Duration(milliseconds: 280),
      themeAnimationCurve: Curves.easeOut,
      routerConfig: router,
      scrollBehavior: const _MintScrollBehavior(),
      builder: (context, child) {
        final theme = Theme.of(context);
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: AppTheme.overlayStyle(theme.brightness, theme.scaffoldBackgroundColor),
          child: child!,
        );
      },
    );
  }
}

/// iOS-style bouncing scroll everywhere, no Android glow.
class _MintScrollBehavior extends MaterialScrollBehavior {
  const _MintScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());

  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) =>
      child;
}
