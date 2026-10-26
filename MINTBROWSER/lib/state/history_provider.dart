import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/utils/url_utils.dart';
import '../data/models/history_entry.dart';
import 'core_providers.dart';
import 'settings_provider.dart';

final historyProvider = NotifierProvider<HistoryNotifier, List<HistoryEntry>>(HistoryNotifier.new);

/// Browsing history, newest first, stored encrypted in the [Vault].
class HistoryNotifier extends Notifier<List<HistoryEntry>> {
  static const vaultKey = 'history.v1';
  static const maxEntries = 500;
  static const _mergeWindow = Duration(minutes: 30);

  Timer? _saveTimer;
  bool _loaded = false;
  final _loadCompleter = Completer<void>();

  /// Completes once the encrypted history has been read.
  Future<void> get loaded => _loadCompleter.future;

  @override
  List<HistoryEntry> build() {
    ref.onDispose(() {
      if (_saveTimer?.isActive ?? false) {
        _saveTimer!.cancel();
        _persistNow();
      }
    });
    Future.microtask(_load);
    return const [];
  }

  Future<void> _load() async {
    try {
      final raw = await ref.read(vaultProvider).read(vaultKey);
      if (raw != null) {
        final loaded = (jsonDecode(raw) as List)
            .whereType<Map>()
            .map((m) => HistoryEntry.fromJson(m.cast<String, Object?>()))
            .toList();
        // Keep anything recorded while loading on top.
        final seen = state.map((e) => e.url).toSet();
        state = [...state, ...loaded.where((e) => !seen.contains(e.url))];
      }
    } catch (_) {
      // Corrupt payload: start fresh.
    } finally {
      _loaded = true;
      if (!_loadCompleter.isCompleted) _loadCompleter.complete();
    }
  }

  void record(String url, String title, {DateTime? at}) {
    if (!ref.read(settingsProvider).saveHistory) return;
    if (!UrlUtils.isWeb(url)) return;
    final now = at ?? DateTime.now();
    final idx = state.indexWhere((e) => e.url == url);
    final next = [...state];
    if (idx >= 0 && now.difference(next[idx].visitedAt) < _mergeWindow) {
      final e = next.removeAt(idx);
      next.insert(0, e.copyWith(title: title.isEmpty ? e.title : title, visitedAt: now));
    } else {
      next.insert(0, HistoryEntry(url: url, title: title, visitedAt: now));
    }
    if (next.length > maxEntries) next.removeRange(maxEntries, next.length);
    _set(next);
  }

  void updateTitle(String url, String title) {
    if (title.isEmpty) return;
    final idx = state.indexWhere((e) => e.url == url);
    if (idx < 0 || state[idx].title == title) return;
    final next = [...state];
    next[idx] = next[idx].copyWith(title: title);
    _set(next);
  }

  void remove(HistoryEntry entry) =>
      _set(state.where((e) => !(e.url == entry.url && e.visitedAt == entry.visitedAt)).toList());

  void restore(HistoryEntry entry) {
    final next = [...state, entry]..sort((a, b) => b.visitedAt.compareTo(a.visitedAt));
    _set(next);
  }

  Future<void> clear() async {
    _saveTimer?.cancel();
    state = const [];
    await ref.read(vaultProvider).delete(vaultKey);
  }

  List<HistoryEntry> search(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return state;
    return state
        .where((e) => e.url.toLowerCase().contains(q) || e.title.toLowerCase().contains(q))
        .toList();
  }

  void _set(List<HistoryEntry> next) {
    state = next;
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 1200), _persistNow);
  }

  Future<void> _persistNow() async {
    if (!_loaded) await loaded;
    await ref.read(vaultProvider).write(
          vaultKey,
          jsonEncode(state.map((e) => e.toJson()).toList()),
        );
  }

  /// Writes pending changes immediately (used by tests and on app pause).
  Future<void> flush() async {
    if (_saveTimer?.isActive ?? false) {
      _saveTimer!.cancel();
      await _persistNow();
    }
  }
}
