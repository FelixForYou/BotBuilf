import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/motion/motion.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/url_utils.dart';
import '../../../data/models/bookmark.dart';
import '../../../data/models/browser_tab.dart';
import '../../../router.dart';
import '../../../state/bookmarks_provider.dart';
import '../../../state/history_provider.dart';
import '../../../state/settings_provider.dart';
import '../../../state/tabs_provider.dart';
import '../../../widgets/app_logo.dart';
import '../../../widgets/dashed_border.dart';
import '../../../widgets/dialogs.dart';
import '../../../widgets/grouped_list.dart';
import '../../../widgets/headers.dart';
import '../../../widgets/pressable.dart';
import '../../../widgets/sheets.dart';
import '../../../widgets/site_icon.dart';
import '../../../widgets/toast.dart';
import '../web/web_engine.dart';
import 'add_favorite_sheet.dart';

/// Start page shown in new tabs: identity header, search pill, favorites
/// and recent pages.
class NewTabPage extends ConsumerWidget {
  const NewTabPage({super.key, required this.tab, required this.onSearch});

  final BrowserTab tab;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final engine = ref.read(webEngineProvider);
    final tabCount = ref.watch(tabsProvider.select((s) => s.tabs.length));
    final engineName = ref.watch(settingsProvider.select((s) => s.searchEngine.label));

    return ListView(
      padding: const EdgeInsets.only(top: 20, bottom: 32),
      children: [
        ContentWidth(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Header(tab: tab, tabCount: tabCount),
              const SizedBox(height: 22),
              _SearchPill(engineName: engineName, onTap: onSearch),
              if (tab.isPrivate) ...[const SizedBox(height: 16), const _PrivateCard()],
              _Favorites(tab: tab, onOpen: (url) => engine.load(tab.id, url)),
              if (!tab.isPrivate) _Recent(onOpen: (url) => engine.load(tab.id, url)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.tab, required this.tabCount});

  final BrowserTab tab;
  final int tabCount;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Row(
      children: [
        const AppLogo(size: 64),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mint Browser', style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(
                tab.isPrivate ? 'Private tab' : 'New tab',
                style: context.text.bodyMedium?.copyWith(color: c.accentInk, fontWeight: FontWeight.w500),
              ),
              Text(
                '$tabCount ${tabCount == 1 ? 'tab' : 'tabs'} open',
                style: context.text.labelMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SearchPill extends StatelessWidget {
  const _SearchPill({required this.engineName, required this.onTap});

  final String engineName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Pressable(
      onTap: onTap,
      scale: 0.98,
      semanticLabel: 'Search or type URL',
      child: Container(
        height: 58,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(18)),
        child: Row(
          children: [
            Icon(LucideIcons.search, size: 20, color: c.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Search or type URL',
                style: context.text.bodyLarge?.copyWith(color: c.textSecondary),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: c.elevated, borderRadius: BorderRadius.circular(10)),
              child: Text(engineName, style: context.text.labelMedium?.copyWith(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrivateCard extends ConsumerWidget {
  const _PrivateCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final isolated = ref.watch(privateIsolationProvider).value;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              TileIcon(LucideIcons.venetianMask, size: 40),
              const SizedBox(width: 12),
              Expanded(child: Text('You’re browsing privately', style: context.text.titleMedium)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Pages here aren’t saved to history and the tab isn’t restored after a restart. '
            'Cookies and site data are erased when you close your last private tab.',
            style: context.text.bodyMedium?.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(color: c.elevated, borderRadius: BorderRadius.circular(14)),
            child: Row(
              children: [
                Icon(
                  isolated == false ? LucideIcons.triangleAlert : LucideIcons.shieldCheck,
                  size: 17,
                  color: isolated == false ? c.warning : c.accentInk,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isolated == null
                        ? 'Checking session isolation…'
                        : isolated
                            ? 'Separate cookie jar from your normal tabs'
                            : 'This device’s WebView can’t separate cookies. Update Android System WebView for full isolation.',
                    style: context.text.labelMedium?.copyWith(color: c.textPrimary),
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

class _Favorites extends ConsumerWidget {
  const _Favorites({required this.tab, required this.onOpen});

  final BrowserTab tab;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favorites = ref.watch(favoritesProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionLabel('Favorites'),
        LayoutBuilder(
          builder: (context, box) {
            final perRow = box.maxWidth >= 560 ? 6 : 4;
            const spacing = 12.0;
            final w = (box.maxWidth - spacing * (perRow - 1)) / perRow;
            return Wrap(
              spacing: spacing,
              runSpacing: 14,
              children: [
                for (final (i, b) in favorites.indexed)
                  _Appear(
                    index: i,
                    child: SizedBox(
                      width: w,
                      child: _FavoriteTile(
                        bookmark: b,
                        fetchIcon: !tab.isPrivate,
                        onTap: () => onOpen(b.url),
                        onLongPress: () => _favoriteActions(context, ref, b),
                      ),
                    ),
                  ),
                SizedBox(width: w, child: _AddTile(onTap: () => showAddFavoriteSheet(context, ref))),
              ],
            );
          },
        ),
      ],
    );
  }

  Future<void> _favoriteActions(BuildContext context, WidgetRef ref, Bookmark b) async {
    final tabs = ref.read(tabsProvider.notifier);
    final bookmarks = ref.read(bookmarksProvider.notifier);
    await showMintSheet<void>(
      context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                SiteIcon(url: b.url, size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: sheet.text.titleMedium),
                      Text(UrlUtils.display(b.url), maxLines: 1, style: sheet.text.labelMedium),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GroupedCard(children: [
              GroupedTile(
                icon: LucideIcons.squarePlus,
                title: 'Open in new tab',
                onTap: () {
                  Navigator.of(sheet).pop();
                  tabs.newTab(url: b.url);
                },
              ),
              GroupedTile(
                icon: LucideIcons.venetianMask,
                title: 'Open in private tab',
                onTap: () {
                  Navigator.of(sheet).pop();
                  tabs.newTab(url: b.url, private: true);
                },
              ),
              GroupedTile(
                icon: LucideIcons.type,
                title: 'Rename',
                onTap: () async {
                  Navigator.of(sheet).pop();
                  final name = await promptDialog(context, title: 'Rename favorite', initial: b.title, label: 'Name');
                  if (name != null) bookmarks.rename(b.url, name);
                },
              ),
              GroupedTile(
                icon: LucideIcons.trash2,
                title: 'Remove from favorites',
                destructive: true,
                chevron: false,
                onTap: () {
                  Navigator.of(sheet).pop();
                  bookmarks.setFavorite(b.url, false);
                  MintToast.show(
                    context,
                    title: 'Removed from favorites',
                    message: 'Still saved in Bookmarks.',
                    actionLabel: 'Undo',
                    onAction: () => bookmarks.setFavorite(b.url, true),
                  );
                },
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

/// Staggered fade-up for grid items on first build.
class _Appear extends StatelessWidget {
  const _Appear({required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 320 + 40 * index.clamp(0, 8)),
      curve: Motion.emphasized,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, 12 * (1 - t)), child: child),
      ),
      child: child,
    );
  }
}

class _FavoriteTile extends StatelessWidget {
  const _FavoriteTile({
    required this.bookmark,
    required this.fetchIcon,
    required this.onTap,
    required this.onLongPress,
  });

  final Bookmark bookmark;
  final bool fetchIcon;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Pressable(
      onTap: onTap,
      onLongPress: onLongPress,
      scale: 0.92,
      semanticLabel: bookmark.title,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(18)),
            alignment: Alignment.center,
            child: SiteIcon(url: bookmark.url, size: 40, fetch: fetchIcon, radius: 12),
          ),
          const SizedBox(height: 8),
          Text(
            bookmark.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: context.text.labelMedium?.copyWith(color: c.textPrimary),
          ),
        ],
      ),
    );
  }
}

class _AddTile extends StatelessWidget {
  const _AddTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Pressable(
      onTap: onTap,
      scale: 0.92,
      semanticLabel: 'Add favorite',
      child: Column(
        children: [
          DashedBorder(
            color: c.textSecondary.withValues(alpha: 0.5),
            radius: 18,
            child: SizedBox(
              width: 60,
              height: 60,
              child: Center(
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: c.accentTile, shape: BoxShape.circle),
                  child: Icon(LucideIcons.plus, size: 18, color: c.accent),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text('Add', style: context.text.labelMedium),
        ],
      ),
    );
  }
}

class _Recent extends ConsumerWidget {
  const _Recent({required this.onOpen});

  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final saveHistory = ref.watch(settingsProvider.select((s) => s.saveHistory));
    final recent = ref.watch(historyProvider).take(5).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionLabel(
          'Recent',
          trailing: recent.isEmpty
              ? null
              : GestureDetector(
                  onTap: () => context.push(Routes.history),
                  child: Text('See all', style: context.text.labelMedium?.copyWith(color: c.accentInk)),
                ),
        ),
        if (recent.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(20)),
            child: Row(
              children: [
                Icon(LucideIcons.clock, size: 18, color: c.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    saveHistory
                        ? 'Pages you visit will show up here.'
                        : 'History is turned off in Settings.',
                    style: context.text.bodySmall,
                  ),
                ),
              ],
            ),
          )
        else
          GroupedCard(
            children: [
              for (final e in recent)
                GroupedTile(
                  leading: SiteIcon(url: e.url, size: 36, radius: 18),
                  title: e.title.isEmpty ? UrlUtils.display(e.url) : e.title,
                  subtitle: UrlUtils.display(e.url),
                  onTap: () => onOpen(e.url),
                ),
            ],
          ),
      ],
    );
  }
}
