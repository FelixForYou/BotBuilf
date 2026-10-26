import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mint_browser/core/theme/app_theme.dart';
import 'package:mint_browser/data/models/browser_tab.dart';
import 'package:mint_browser/data/storage/vault.dart';
import 'package:mint_browser/features/browser/widgets/error_view.dart';
import 'package:mint_browser/features/settings/settings_screen.dart';
import 'package:mint_browser/state/core_providers.dart';
import 'package:mint_browser/state/settings_provider.dart';
import 'package:mint_browser/widgets/mint_button.dart';
import 'package:mint_browser/widgets/mint_switch.dart';
import 'package:mint_browser/widgets/segmented_control.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Widget> app(Widget child) async {
  SharedPreferences.setMockInitialValues({});
  final sp = await SharedPreferences.getInstance();
  return ProviderScope(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(sp),
      vaultProvider.overrideWithValue(MemoryVault()),
    ],
    child: MaterialApp(theme: AppTheme.dark(), home: Scaffold(body: child)),
  );
}

void main() {
  testWidgets('MintButton: tap, disabled and loading states', (t) async {
    var taps = 0;
    await t.pumpWidget(await app(Column(children: [
      MintButton(label: 'Continue', onPressed: () => taps++),
      const MintButton(label: 'Disabled', onPressed: null),
      MintButton(label: 'Busy', loading: true, onPressed: () => taps++),
    ])));
    await t.tap(find.text('Continue'));
    await t.tap(find.text('Disabled'));
    await t.pump(const Duration(milliseconds: 300));
    expect(taps, 1);
    expect(find.text('Busy'), findsNothing, reason: 'spinner replaces the label');
  });

  testWidgets('SegmentedControl reports changes', (t) async {
    var value = 'upload';
    await t.pumpWidget(await app(StatefulBuilder(
      builder: (context, set) => SegmentedControl<String>(
        value: value,
        onChanged: (v) => set(() => value = v),
        options: const [SegmentOption('upload', 'Upload'), SegmentOption('web', 'Website')],
      ),
    )));
    await t.tap(find.text('Website'));
    await t.pumpAndSettle();
    expect(value, 'web');
  });

  testWidgets('error page shows reason, retries and toggles details', (t) async {
    t.view.physicalSize = const Size(1080, 4000);
    addTearDown(t.view.reset);
    var retries = 0;
    await t.pumpWidget(await app(PageErrorView(
      error: const PageError(
        url: 'https://nowhere.example/a',
        type: 'hostLookup',
        description: 'net::ERR_NAME_NOT_RESOLVED',
        code: -2,
      ),
      onRetry: () => retries++,
      onHome: () {},
    )));
    await t.pumpAndSettle();
    expect(find.text('This site can’t be reached'), findsOneWidget);
    expect(find.text('nowhere.example'), findsOneWidget);
    expect(find.byIcon(LucideIcons.wifiOff), findsOneWidget);
    await t.tap(find.text('Try again'));
    expect(retries, 1);
    expect(find.textContaining('ERR_NAME_NOT_RESOLVED'), findsNothing);
    await t.tap(find.text('Show details'));
    await t.pumpAndSettle();
    expect(find.textContaining('ERR_NAME_NOT_RESOLVED', findRichText: true), findsWidgets);
  });

  testWidgets('settings toggles update state', (t) async {
    t.view.physicalSize = const Size(1080, 4000);
    addTearDown(t.view.reset);
    await t.pumpWidget(await app(const SettingsScreen()));
    await t.pumpAndSettle();
    final container = ProviderScope.containerOf(t.element(find.byType(SettingsScreen)));
    expect(container.read(settingsProvider).saveHistory, isTrue);
    await t.tap(find.text('Save history'));
    await t.pumpAndSettle();
    expect(container.read(settingsProvider).saveHistory, isFalse);
    expect(find.byType(MintSwitch), findsNWidgets(6));
  });
}
