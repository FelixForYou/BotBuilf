import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/browser_tab.dart';
import '../data/storage/prefs_store.dart';
import 'core_providers.dart';
import 'settings_provider.dart';

@immutable
class TabsState {
  const TabsState({required this.tabs, required this.activeId});

  final List<BrowserTab> tabs;
  final String activeId;

  BrowserTab get active => tabs.firstWhere((t) => t.id == activeId, orElse: () => tabs.first);
  List<BrowserTab> get normal => tabs.where((t) => !t.isPrivate).toList();
  List<BrowserTab> get private => tabs.where((t) => t.isPrivate).toList();
  BrowserTab? byId(String id) => tabs.where((t) => t.id == id).firstOrNull;
}

/// Hooks the web layer registers so tab lifecycle can release native views.
abstract interface class TabLifecycleListener {
  void onTabClosed(BrowserTab tab);
  void onPrivateSessionEnded();
}

final tabsProvider = NotifierProvider<TabsNotifier, TabsState>(TabsNotifier.new);

class TabsNotifier extends Notifier<TabsState> {
  static const maxClosedHistory = 15;

  final List<BrowserTab> _closed = [];
  TabLifecycleListener? listener;
  Timer? _saveTimer;
  int _seq = 0;

  PrefsStore get _store => ref.read(prefsStoreProvider);

  @override
  TabsState build() {
    ref.onDispose(() => _saveTimer?.cancel());
    final store = ref.read(prefsStoreProvider);
    if (ref.read(settingsProvider).restoreTabs) {
      final saved = store.readList(PrefsStore.tabsKey).map(BrowserTab.fromJson).toList();
      if (saved.isNotEmpty) {
        final activeId = store.readString(PrefsStore.activeTabKey);
        return TabsState(
          tabs: saved,
          activeId: saved.any((t) => t.id == activeId) ? activeId! : saved.last.id,
        );
      }
    }
    final first = _make();
    return TabsState(tabs: [first], activeId: first.id);
  }

  bool get canReopenClosed => _closed.isNotEmpty;

  BrowserTab _make({String url = '', bool private = false}) => BrowserTab(
        id: 't${DateTime.now().microsecondsSinceEpoch}_${_seq++}',
        url: url,
        isPrivate: private,
        showHome: url.isEmpty,
        lastActive: DateTime.now(),
      );

  String newTab({String url = '', bool private = false, bool activate = true}) {
    final tab = _make(url: url, private: private);
    state = TabsState(tabs: [...state.tabs, tab], activeId: activate ? tab.id : state.activeId);
    _scheduleSave();
    return tab.id;
  }

  void activate(String id) {
    if (state.byId(id) == null) return;
    state = TabsState(
      tabs: [
        for (final t in state.tabs) t.id == id ? t.copyWith(lastActive: DateTime.now()) : t,
      ],
      activeId: id,
    );
    _scheduleSave();
  }

  void close(String id) {
    final tab = state.byId(id);
    if (tab == null) return;
    if (!tab.isPrivate && !tab.isBlank) {
      _closed.add(tab.copyWith(thumbnail: null));
      if (_closed.length > maxClosedHistory) _closed.removeAt(0);
    }
    final remaining = state.tabs.where((t) => t.id != id).toList();
    listener?.onTabClosed(tab);

    var activeId = state.activeId;
    if (id == activeId) {
      // Prefer the most recently used tab of the same kind.
      final sameKind = remaining.where((t) => t.isPrivate == tab.isPrivate).toList()
        ..sort((a, b) => b.lastActive.compareTo(a.lastActive));
      final others = [...remaining]..sort((a, b) => b.lastActive.compareTo(a.lastActive));
      activeId = (sameKind.firstOrNull ?? others.firstOrNull)?.id ?? '';
    }
    if (remaining.isEmpty) {
      final fresh = _make();
      remaining.add(fresh);
      activeId = fresh.id;
    }
    state = TabsState(tabs: remaining, activeId: activeId);
    if (tab.isPrivate && !remaining.any((t) => t.isPrivate)) listener?.onPrivateSessionEnded();
    _scheduleSave();
  }

  void closeAll({required bool private}) {
    for (final t in state.tabs.where((t) => t.isPrivate == private).toList()) {
      close(t.id);
    }
  }

  /// Reopens the most recently closed normal tab.
  String? reopenClosed() {
    if (_closed.isEmpty) return null;
    final t = _closed.removeLast();
    return newTab(url: t.url);
  }

  void patch(String id, BrowserTab Function(BrowserTab t) change) {
    final idx = state.tabs.indexWhere((t) => t.id == id);
    if (idx < 0) return;
    final before = state.tabs[idx];
    final after = change(before);
    final tabs = [...state.tabs]..[idx] = after;
    state = TabsState(tabs: tabs, activeId: state.activeId);
    if (!after.isPrivate && (before.url != after.url || before.title != after.title)) {
      _scheduleSave();
    }
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 600), saveNow);
  }

  /// Persists normal tabs; private tabs are never written to disk.
  Future<void> saveNow() async {
    _saveTimer?.cancel();
    final normal = state.normal;
    await _store.write(PrefsStore.tabsKey, normal.map((t) => t.toJson()).toList());
    final active = state.active;
    final activeId = active.isPrivate
        ? (normal.isEmpty ? '' : (normal.toList()
              ..sort((a, b) => b.lastActive.compareTo(a.lastActive)))
            .first
            .id)
        : active.id;
    await _store.writeString(PrefsStore.activeTabKey, activeId);
  }
}
