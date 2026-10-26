import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mint_browser/data/models/app_settings.dart';
import 'package:mint_browser/data/models/site_permission.dart';
import 'package:mint_browser/data/storage/prefs_store.dart';
import 'package:mint_browser/data/storage/vault.dart';
import 'package:mint_browser/state/bookmarks_provider.dart';
import 'package:mint_browser/state/core_providers.dart';
import 'package:mint_browser/state/history_provider.dart';
import 'package:mint_browser/state/settings_provider.dart';
import 'package:mint_browser/state/site_permissions_provider.dart';
import 'package:mint_browser/state/tabs_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<(ProviderContainer, MemoryVault)> makeContainer([Map<String, Object> prefs = const {}]) async {
  SharedPreferences.setMockInitialValues(prefs);
  final sp = await SharedPreferences.getInstance();
  final vault = MemoryVault();
  final c = ProviderContainer(overrides: [
    sharedPreferencesProvider.overrideWithValue(sp),
    vaultProvider.overrideWithValue(vault),
  ]);
  addTearDown(c.dispose);
  return (c, vault);
}

void main() {
  group('settings', () {
    test('persist and reload', () async {
      final (c, _) = await makeContainer();
      c.read(settingsProvider.notifier).update((s) => s.copyWith(
            searchEngine: SearchEngine.brave,
            textZoom: 400,
            appearance: AppearanceMode.light,
          ));
      final s = c.read(settingsProvider);
      expect(s.textZoom, AppSettings.maxZoom);
      final raw = c.read(sharedPreferencesProvider).getString(PrefsStore.settingsKey)!;
      final back = AppSettings.fromJson((jsonDecode(raw) as Map).cast());
      expect(back.searchEngine, SearchEngine.brave);
      expect(back.appearance, AppearanceMode.light);
    });
  });

  group('bookmarks', () {
    test('seeds favorites once, toggles and restores', () async {
      final (c, _) = await makeContainer();
      expect(c.read(favoritesProvider), isNotEmpty);
      final n = c.read(bookmarksProvider.notifier);
      expect(n.toggle('https://dart.dev/', 'Dart'), isTrue);
      expect(n.isBookmarked('https://dart.dev'), isTrue, reason: 'trailing slash ignored');
      final b = n.find('https://dart.dev')!;
      expect(n.toggle('https://dart.dev', 'Dart'), isFalse);
      n.restore(b);
      expect(n.isBookmarked('https://dart.dev'), isTrue);
      n.setFavorite('https://dart.dev', true);
      expect(c.read(favoritesProvider).any((f) => f.url == 'https://dart.dev/'), isTrue);
    });
  });

  group('history', () {
    test('records, merges repeat visits and respects the setting', () async {
      final (c, vault) = await makeContainer();
      final n = c.read(historyProvider.notifier);
      await n.loaded;
      final t0 = DateTime(2026, 1, 1, 10);
      n.record('https://a.com', 'A', at: t0);
      n.record('https://b.com', 'B', at: t0.add(const Duration(minutes: 1)));
      n.record('https://a.com', 'A2', at: t0.add(const Duration(minutes: 2)));
      expect(c.read(historyProvider).map((e) => e.url), ['https://a.com', 'https://b.com']);
      expect(c.read(historyProvider).first.title, 'A2');

      n.record('about:blank', '');
      expect(c.read(historyProvider), hasLength(2));

      c.read(settingsProvider.notifier).update((s) => s.copyWith(saveHistory: false));
      n.record('https://c.com', 'C');
      expect(c.read(historyProvider), hasLength(2));

      await n.flush();
      expect(vault.data[HistoryNotifier.vaultKey], contains('https://b.com'));
      expect(n.search('b.c'), hasLength(1));
      await n.clear();
      expect(vault.data.containsKey(HistoryNotifier.vaultKey), isFalse);
    });

    test('loads encrypted entries on start', () async {
      SharedPreferences.setMockInitialValues({});
      final sp = await SharedPreferences.getInstance();
      final vault = MemoryVault()
        ..data[HistoryNotifier.vaultKey] = jsonEncode([
          {'u': 'https://x.com', 't': 'X', 'v': 1},
        ]);
      final c = ProviderContainer(overrides: [
        sharedPreferencesProvider.overrideWithValue(sp),
        vaultProvider.overrideWithValue(vault),
      ]);
      addTearDown(c.dispose);
      c.read(historyProvider);
      await c.read(historyProvider.notifier).loaded;
      expect(c.read(historyProvider).single.title, 'X');
    });
  });

  group('tabs', () {
    test('open, close, reopen and private bookkeeping', () async {
      final (c, _) = await makeContainer();
      final n = c.read(tabsProvider.notifier);
      expect(c.read(tabsProvider).tabs, hasLength(1));

      final a = n.newTab(url: 'https://a.com');
      final p = n.newTab(private: true);
      expect(c.read(tabsProvider).activeId, p);
      expect(c.read(tabsProvider).private, hasLength(1));

      var ended = false;
      n.listener = _Listener(() => ended = true);
      n.close(p);
      expect(ended, isTrue);
      expect(c.read(tabsProvider).active.isPrivate, isFalse);

      n.close(a);
      expect(n.canReopenClosed, isTrue);
      final r = n.reopenClosed()!;
      expect(c.read(tabsProvider).byId(r)!.url, 'https://a.com');

      n.closeAll(private: false);
      expect(c.read(tabsProvider).tabs, hasLength(1), reason: 'always keeps one tab');
    });

    test('restores normal tabs but never private ones', () async {
      final (c, _) = await makeContainer();
      final n = c.read(tabsProvider.notifier);
      n.newTab(url: 'https://keep.me');
      n.newTab(url: 'https://secret.me', private: true);
      await n.saveNow();
      final raw = c.read(sharedPreferencesProvider).getString(PrefsStore.tabsKey)!;
      expect(raw, contains('keep.me'));
      expect(raw, isNot(contains('secret.me')));

      final (c2, _) = await makeContainer({PrefsStore.tabsKey: raw});
      expect(c2.read(tabsProvider).tabs.map((t) => t.url), contains('https://keep.me'));
    });
  });

  group('site permissions', () {
    test('saved choices win over defaults', () async {
      final (c, _) = await makeContainer();
      final n = c.read(sitePermissionsProvider.notifier);
      expect(n.verdict('a.com', SiteCapability.camera), PermissionVerdict.ask);
      n.decide('a.com', SiteCapability.camera, SiteDecision.allow);
      expect(n.verdict('a.com', SiteCapability.camera), PermissionVerdict.allow);
      c.read(settingsProvider.notifier).update((s) => s.copyWith(microphoneDefault: PermissionDefault.block));
      expect(n.verdict('a.com', SiteCapability.microphone), PermissionVerdict.block);
      n.decide('a.com', SiteCapability.camera, null);
      expect(c.read(sitePermissionsProvider), isEmpty);
    });
  });
}

class _Listener implements TabLifecycleListener {
  _Listener(this.onEnd);
  final void Function() onEnd;
  @override
  void onTabClosed(_) {}
  @override
  void onPrivateSessionEnded() => onEnd();
}
