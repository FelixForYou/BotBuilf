import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/bookmark.dart';
import '../data/storage/prefs_store.dart';
import 'core_providers.dart';

final bookmarksProvider = NotifierProvider<BookmarksNotifier, List<Bookmark>>(BookmarksNotifier.new);

/// Favorites only, in the order they were added.
final favoritesProvider = Provider<List<Bookmark>>(
  (ref) => ref.watch(bookmarksProvider).where((b) => b.favorite).toList().reversed.toList(),
);

String normalizeUrl(String url) => url.endsWith('/') ? url.substring(0, url.length - 1) : url;

class BookmarksNotifier extends Notifier<List<Bookmark>> {
  PrefsStore get _store => ref.read(prefsStoreProvider);

  static final _seed = [
    ('https://www.google.com', 'Google'),
    ('https://www.wikipedia.org', 'Wikipedia'),
    ('https://www.youtube.com', 'YouTube'),
    ('https://github.com', 'GitHub'),
  ];

  /// Newest first.
  @override
  List<Bookmark> build() {
    final store = ref.read(prefsStoreProvider);
    if (!store.readBool(PrefsStore.bookmarksSeededKey)) {
      final now = DateTime.now();
      final seeded = [
        for (var i = 0; i < _seed.length; i++)
          Bookmark(
            url: _seed[i].$1,
            title: _seed[i].$2,
            createdAt: now.subtract(Duration(seconds: i)),
            favorite: true,
          ),
      ];
      store.writeBool(PrefsStore.bookmarksSeededKey, true);
      store.write(PrefsStore.bookmarksKey, seeded.map((b) => b.toJson()).toList());
      return seeded;
    }
    return store.readList(PrefsStore.bookmarksKey).map(Bookmark.fromJson).toList();
  }

  Bookmark? find(String url) {
    final n = normalizeUrl(url);
    return state.where((b) => normalizeUrl(b.url) == n).firstOrNull;
  }

  bool isBookmarked(String url) => find(url) != null;

  void add(String url, String title, {bool favorite = false}) {
    final existing = find(url);
    if (existing != null) {
      if (favorite && !existing.favorite) setFavorite(url, true);
      return;
    }
    _set([
      Bookmark(
        url: url,
        title: title.trim().isEmpty ? url : title.trim(),
        createdAt: DateTime.now(),
        favorite: favorite,
      ),
      ...state,
    ]);
  }

  /// Returns true when the page is bookmarked afterwards.
  bool toggle(String url, String title) {
    if (isBookmarked(url)) {
      remove(url);
      return false;
    }
    add(url, title);
    return true;
  }

  void setFavorite(String url, bool favorite) {
    final n = normalizeUrl(url);
    _set([for (final b in state) normalizeUrl(b.url) == n ? b.copyWith(favorite: favorite) : b]);
  }

  void rename(String url, String title) {
    final t = title.trim();
    if (t.isEmpty) return;
    final n = normalizeUrl(url);
    _set([for (final b in state) normalizeUrl(b.url) == n ? b.copyWith(title: t) : b]);
  }

  void remove(String url) {
    final n = normalizeUrl(url);
    _set(state.where((b) => normalizeUrl(b.url) != n).toList());
  }

  /// Puts back a bookmark removed moments ago (undo).
  void restore(Bookmark b) {
    if (isBookmarked(b.url)) return;
    final next = [...state, b]..sort((a, c) => c.createdAt.compareTo(a.createdAt));
    _set(next);
  }

  void _set(List<Bookmark> next) {
    state = next;
    _store.write(PrefsStore.bookmarksKey, next.map((b) => b.toJson()).toList());
  }
}
