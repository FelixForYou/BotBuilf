// Renders key screens to PNGs for visual review against the design
// references. Not part of the normal suite (fonts render differently per OS):
//   flutter test --tags screenshots --update-goldens test/screenshots
@Tags(['screenshots'])
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mint_browser/core/theme/app_theme.dart';
import 'package:mint_browser/data/models/app_settings.dart';
import 'package:mint_browser/data/models/browser_tab.dart';
import 'package:mint_browser/data/storage/vault.dart';
import 'package:mint_browser/features/browser/browser_screen.dart';
import 'package:mint_browser/features/browser/widgets/browser_menu.dart';
import 'package:mint_browser/features/browser/widgets/error_view.dart';
import 'package:mint_browser/features/onboarding/onboarding_screen.dart';
import 'package:mint_browser/features/settings/settings_screen.dart';
import 'package:mint_browser/features/tabs/tabs_screen.dart';
import 'package:mint_browser/router.dart';
import 'package:mint_browser/state/core_providers.dart';
import 'package:mint_browser/state/history_provider.dart';
import 'package:mint_browser/state/settings_provider.dart';
import 'package:mint_browser/state/tabs_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _loadFonts() async {
  final inter = FontLoader('Inter');
  for (final f in ['Regular', 'Medium', 'SemiBold', 'Bold', 'BoldItalic']) {
    inter.addFont(rootBundle.load('assets/fonts/Inter-$f.ttf'));
  }
  await inter.load();
  final lucide = FontLoader('packages/lucide_icons_flutter/Lucide')
    ..addFont(rootBundle.load('packages/lucide_icons_flutter/assets/lucide.ttf'));
  await lucide.load();
}

Future<ProviderContainer> _container({AppearanceMode mode = AppearanceMode.dark}) async {
  SharedPreferences.setMockInitialValues({});
  final sp = await SharedPreferences.getInstance();
  final c = ProviderContainer(overrides: [
    sharedPreferencesProvider.overrideWithValue(sp),
    vaultProvider.overrideWithValue(MemoryVault()),
  ]);
  c.read(settingsProvider.notifier).update((s) => s.copyWith(appearance: mode, onboardingDone: true));
  final h = c.read(historyProvider.notifier);
  final now = DateTime.now();
  h.record('https://www.wikipedia.org/wiki/Mint', 'Mint – Wikipedia', at: now);
  h.record('https://news.ycombinator.com', 'Hacker News', at: now.subtract(const Duration(minutes: 40)));
  h.record('https://flutter.dev/docs', 'Flutter documentation', at: now.subtract(const Duration(hours: 2)));
  return c;
}

Future<void> _shoot(
  WidgetTester t,
  String name,
  Widget screen, {
  ProviderContainer? container,
  ThemeMode theme = ThemeMode.dark,
  Future<void> Function(WidgetTester t)? after,
}) async {
  t.view.physicalSize = const Size(1080, 2340);
  t.view.devicePixelRatio = 3;
  t.view.padding = const FakeViewPadding(top: 120, bottom: 60);
  t.view.viewPadding = const FakeViewPadding(top: 120, bottom: 60);
  addTearDown(t.view.reset);
  final c = container ?? await _container();
  await t.pumpWidget(UncontrolledProviderScope(
    container: c,
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: rootNavigatorKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: theme,
      home: screen,
    ),
  ));
  await t.pumpAndSettle(const Duration(milliseconds: 100));
  if (after != null) await after(t);
  await expectLater(find.byType(MaterialApp), matchesGoldenFile('../../docs/screenshots/$name.png'));
  // Let debounced saves and toasts finish before teardown.
  await t.pumpWidget(const SizedBox());
  await t.pump(const Duration(seconds: 5));
}

void main() {
  setUpAll(_loadFonts);

  testWidgets('onboarding', (t) => _shoot(t, '01_onboarding', const OnboardingScreen()));

  testWidgets('home', (t) => _shoot(t, '02_home', const BrowserScreen()));

  testWidgets('home private', (t) async {
    final c = await _container();
    c.read(tabsProvider.notifier).newTab(private: true);
    await _shoot(t, '03_home_private', const BrowserScreen(), container: c);
  });

  testWidgets('menu sheet', (t) async {
    await _shoot(t, '04_menu', const BrowserScreen(), after: (t) async {
      showBrowserMenu(t.element(find.byType(BrowserScreen)));
      await t.pumpAndSettle();
    });
  });

  testWidgets('tabs', (t) async {
    final c = await _container();
    final n = c.read(tabsProvider.notifier);
    n.newTab();
    n.newTab(private: false);
    n.newTab();
    await _shoot(t, '05_tabs', const TabsScreen(), container: c);
  });

  testWidgets('settings', (t) => _shoot(t, '06_settings', const SettingsScreen()));

  testWidgets('error', (t) => _shoot(
        t,
        '07_error',
        Scaffold(
          body: SafeArea(
            child: PageErrorView(
              error: const PageError(
                url: 'https://example.org/page',
                type: 'hostLookup',
                description: 'net::ERR_NAME_NOT_RESOLVED',
                code: -2,
              ),
              onRetry: () {},
              onHome: () {},
            ),
          ),
        ),
        after: (t) async {
          await t.tap(find.text('Show details'));
          await t.pumpAndSettle();
        },
      ));

  testWidgets('home light', (t) async {
    final c = await _container(mode: AppearanceMode.light);
    await _shoot(t, '08_home_light', const BrowserScreen(), container: c, theme: ThemeMode.light);
  });
}
