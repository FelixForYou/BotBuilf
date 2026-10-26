import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/url_utils.dart';
import '../../data/models/bookmark.dart';
import '../../router.dart';
import '../../state/bookmarks_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/segmented_control.dart';
import '../../widgets/site_icon.dart';
import '../../widgets/status_view.dart';
import '../../widgets/toast.dart';
import '../history/history_screen.dart';

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});

  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen> {
  bool _favoritesOnly = false;

  BookmarksNotifier get _n => ref.read(bookmarksProvider.notifier);

  void _remove(Bookmark b) {
    _n.remove(b.url);
    MintToast.show(context, title: 'Bookmark removed', message: b.title, actionLabel: 'Undo', onAction: () => _n.restore(b));
  }

  Future<void> _rename(Bookmark b) async {
    final name = await promptDialog(context, title: 'Rename bookmark', initial: b.title, label: 'Name');
    if (name != null) _n.rename(b.url, name);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final all = ref.watch(bookmarksProvider);
    final list = _favoritesOnly ? all.where((b) => b.favorite).toList() : all;

    return Scaffold(
      appBar: const MintTopBar(title: 'Bookmarks'),
      body: Column(
        children: [
          ContentWidth(
            child: Padding(
              padding: const EdgeInsets.only(top: 16, bottom: 4),
              child: SegmentedControl<bool>(
                value: _favoritesOnly,
                onChanged: (v) => setState(() => _favoritesOnly = v),
                options: [
                  SegmentOption(false, 'All · ${all.length}'),
                  SegmentOption(true, 'Favorites · ${all.where((b) => b.favorite).length}'),
                ],
              ),
            ),
          ),
          Expanded(
            child: list.isEmpty
                ? StatusView(
                    icon: _favoritesOnly ? LucideIcons.layoutGrid : LucideIcons.bookmark,
                    title: _favoritesOnly ? 'No favorites' : 'No bookmarks yet',
                    message: _favoritesOnly
                        ? 'Favorites show up as tiles on every new tab. Tap the star on a bookmark to add one.'
                        : 'Tap the star in the toolbar to save the page you’re on.',
                    actionLabel: 'Start browsing',
                    onAction: () => context.go(Routes.browser),
                  )
                : ListView(
                    padding: EdgeInsets.only(bottom: 32 + MediaQuery.paddingOf(context).bottom),
                    children: [
                      ContentWidth(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: GroupedCard(children: [
                            for (final b in list)
                              Dismissible(
                                key: ValueKey(b.url),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  color: c.error,
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  child: const Icon(LucideIcons.trash2, color: Colors.white, size: 20),
                                ),
                                onDismissed: (_) => _remove(b),
                                child: GroupedTile(
                                  leading: SiteIcon(url: b.url, size: 36, radius: 18),
                                  title: b.title,
                                  subtitle: UrlUtils.display(b.url),
                                  trailing: MintIconButton(
                                    icon: LucideIcons.star,
                                    size: 38,
                                    iconSize: 19,
                                    tooltip: b.favorite ? 'Remove from favorites' : 'Add to favorites',
                                    color: b.favorite ? c.accentInk : c.textSecondary,
                                    background: b.favorite ? c.accent.withValues(alpha: 0.14) : null,
                                    onPressed: () => _n.setFavorite(b.url, !b.favorite),
                                  ),
                                  onTap: () => openInBrowser(context, ref, b.url),
                                  onLongPress: () => showLinkActions(
                                    context,
                                    ref,
                                    url: b.url,
                                    title: b.title,
                                    extra: [
                                      Builder(
                                        builder: (sheet) => GroupedTile(
                                          icon: LucideIcons.type,
                                          title: 'Rename',
                                          onTap: () {
                                            Navigator.of(sheet).pop();
                                            _rename(b);
                                          },
                                        ),
                                      ),
                                      Builder(
                                        builder: (sheet) => GroupedTile(
                                          icon: LucideIcons.trash2,
                                          title: 'Delete bookmark',
                                          destructive: true,
                                          chevron: false,
                                          onTap: () {
                                            Navigator.of(sheet).pop();
                                            _remove(b);
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ]),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
