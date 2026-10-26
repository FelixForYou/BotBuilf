import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/motion/motion.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/url_utils.dart';
import '../../../data/models/browser_tab.dart';
import '../../../router.dart';
import '../../../state/bookmarks_provider.dart';
import '../../../state/core_providers.dart';
import '../../../state/downloads_provider.dart';
import '../../../state/settings_provider.dart';
import '../../../state/tabs_provider.dart';
import '../../../widgets/grouped_list.dart';
import '../../../widgets/pressable.dart';
import '../../../widgets/sheets.dart';
import '../../../widgets/site_icon.dart';
import '../../../widgets/toast.dart';
import '../../floating/floating_launcher.dart';

Future<void> sharePage(BuildContext context, BrowserTab tab) async {
  if (tab.url.isEmpty) return;
  final box = context.findRenderObject() as RenderBox?;
  await SharePlus.instance.share(
    ShareParams(
      uri: Uri.tryParse(tab.url),
      subject: tab.displayTitle,
      sharePositionOrigin: box == null ? null : box.localToGlobal(Offset.zero) & box.size,
    ),
  );
}

/// Bookmarks or un-bookmarks [tab] with an undo toast.
void toggleBookmark(BuildContext context, BookmarksNotifier notifier, BrowserTab tab) {
  final existing = notifier.find(tab.url);
  final added = notifier.toggle(tab.url, tab.displayTitle);
  HapticFeedback.lightImpact();
  MintToast.show(
    context,
    title: added ? 'Bookmarked' : 'Bookmark removed',
    message: tab.displayTitle,
    kind: ToastKind.success,
    actionLabel: 'Undo',
    onAction: () => added ? notifier.remove(tab.url) : notifier.restore(existing!),
  );
}

Future<void> showBrowserMenu(BuildContext context, WidgetRef ref) {
  return showMintSheet<void>(context, builder: (_) => const _BrowserMenu());
}

class _BrowserMenu extends ConsumerWidget {
  const _BrowserMenu();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final tab = ref.watch(tabsProvider.select((s) => s.active));
    final tabs = ref.read(tabsProvider.notifier);
    final settings = ref.watch(settingsProvider);
    final bookmark = ref.watch(bookmarksProvider.select(
      (list) => list.where((b) => normalizeUrl(b.url) == normalizeUrl(tab.url)).firstOrNull,
    ));
    final activeDownloads = ref.watch(downloadsProvider.select((d) => d.where((e) => e.isActive).length));
    final hasPage = !tab.showHome && UrlUtils.isWeb(tab.url);
    final nav = Navigator.of(context);
    final router = GoRouter.of(context);
    // Actions run after the sheet is gone, so use long-lived handles.
    final host = rootNavigatorKey.currentContext ?? context;
    final bookmarks = ref.read(bookmarksProvider.notifier);
    final bridge = ref.read(nativeBridgeProvider);

    void close() => nav.pop();

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.86),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasPage)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 16),
                child: Row(
                  children: [
                    SiteIcon(url: tab.url, size: 44, fetch: !tab.isPrivate),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tab.displayTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.titleMedium,
                          ),
                          Row(
                            children: [
                              Icon(
                                UrlUtils.isSecure(tab.url) ? LucideIcons.lock : LucideIcons.info,
                                size: 13,
                                color: UrlUtils.isSecure(tab.url) ? c.accentInk : c.warning,
                              ),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  UrlUtils.isSecure(tab.url)
                                      ? '${UrlUtils.display(tab.url)} · Encrypted (HTTPS)'
                                      : '${UrlUtils.display(tab.url)} · Not secure',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: context.text.labelMedium,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    _CopyLink(url: tab.url),
                  ],
                ),
              ),
            _QuickActions(actions: [
              _Quick(
                icon: LucideIcons.star,
                label: bookmark != null ? 'Saved' : 'Bookmark',
                active: bookmark != null,
                onTap: hasPage
                    ? () {
                        close();
                        toggleBookmark(host, bookmarks, tab);
                      }
                    : null,
              ),
              _Quick(
                icon: LucideIcons.share2,
                label: 'Share',
                onTap: hasPage
                    ? () {
                        close();
                        sharePage(host, tab);
                      }
                    : null,
              ),
              _Quick(
                icon: LucideIcons.pictureInPicture2,
                label: 'Float',
                onTap: () {
                  close();
                  openInFloatingWindow(host, bridge, tab);
                },
              ),
              _Quick(
                icon: LucideIcons.monitor,
                label: 'Desktop',
                active: settings.desktopMode,
                onTap: () => ref
                    .read(settingsProvider.notifier)
                    .update((s) => s.copyWith(desktopMode: !s.desktopMode)),
              ),
            ]),
            const SizedBox(height: 16),
            GroupedCard(children: [
              GroupedTile(
                icon: LucideIcons.squarePlus,
                title: 'New tab',
                onTap: () {
                  close();
                  tabs.newTab();
                },
              ),
              GroupedTile(
                icon: LucideIcons.venetianMask,
                title: 'New private tab',
                onTap: () {
                  close();
                  tabs.newTab(private: true);
                },
              ),
              if (tabs.canReopenClosed)
                GroupedTile(
                  icon: LucideIcons.rotateCcw,
                  title: 'Reopen closed tab',
                  onTap: () {
                    close();
                    tabs.reopenClosed();
                  },
                ),
            ]),
            const SizedBox(height: 12),
            GroupedCard(children: [
              GroupedTile(
                icon: LucideIcons.history,
                title: 'History',
                onTap: () {
                  close();
                  router.push(Routes.history);
                },
              ),
              GroupedTile(
                icon: LucideIcons.bookmark,
                title: 'Bookmarks',
                onTap: () {
                  close();
                  router.push(Routes.bookmarks);
                },
              ),
              GroupedTile(
                icon: LucideIcons.download,
                title: 'Downloads',
                value: activeDownloads > 0 ? '$activeDownloads active' : null,
                onTap: () {
                  close();
                  router.push(Routes.downloads);
                },
              ),
            ]),
            const SizedBox(height: 12),
            GroupedCard(children: [
              if (hasPage)
                GroupedTile(
                  icon: bookmark?.favorite ?? false ? LucideIcons.starOff : LucideIcons.layoutGrid,
                  title: bookmark?.favorite ?? false ? 'Remove from favorites' : 'Add to favorites',
                  chevron: false,
                  onTap: () {
                    close();
                    if (bookmark?.favorite ?? false) {
                      bookmarks.setFavorite(tab.url, false);
                    } else {
                      bookmarks.add(tab.url, tab.displayTitle, favorite: true);
                    }
                    MintToast.show(
                      host,
                      title: bookmark?.favorite ?? false ? 'Removed from favorites' : 'Added to favorites',
                      kind: ToastKind.success,
                    );
                  },
                ),
              GroupedTile(
                icon: LucideIcons.aArrowUp,
                title: 'Text size',
                trailing: _ZoomStepper(zoom: settings.textZoom),
              ),
              GroupedTile(
                icon: LucideIcons.settings,
                title: 'Settings',
                onTap: () {
                  close();
                  router.push(Routes.settings);
                },
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

class _CopyLink extends StatelessWidget {
  const _CopyLink({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Pressable(
      onTap: () {
        Clipboard.setData(ClipboardData(text: url));
        MintToast.show(context, title: 'Link copied', kind: ToastKind.success);
      },
      scale: 0.9,
      semanticLabel: 'Copy link',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: c.elevated, borderRadius: BorderRadius.circular(12)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.link, size: 15, color: c.accentInk),
            const SizedBox(width: 6),
            Text('Copy', style: context.text.labelMedium?.copyWith(color: c.accentInk)),
          ],
        ),
      ),
    );
  }
}

class _Quick {
  const _Quick({required this.icon, required this.label, required this.onTap, this.active = false});
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool active;
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.actions});

  final List<_Quick> actions;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Container(
      decoration: BoxDecoration(color: c.elevated.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(20)),
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          for (final a in actions)
            Expanded(
              child: Pressable(
                onTap: a.onTap,
                scale: 0.9,
                semanticLabel: a.label,
                child: AnimatedOpacity(
                  duration: Motion.quick,
                  opacity: a.onTap == null ? 0.35 : 1,
                  child: Column(
                    children: [
                      AnimatedContainer(
                        duration: Motion.quick,
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: a.active ? c.accent : c.card,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(a.icon, size: 20, color: a.active ? c.onAccent : c.textPrimary),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        a.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.labelMedium?.copyWith(color: c.textPrimary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ZoomStepper extends ConsumerWidget {
  const _ZoomStepper({required this.zoom});

  final int zoom;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    void step(int d) => ref.read(settingsProvider.notifier).update((s) => s.copyWith(textZoom: s.textZoom + d));
    Widget btn(IconData icon, VoidCallback? onTap, String label) => Pressable(
          onTap: onTap,
          scale: 0.85,
          semanticLabel: label,
          child: AnimatedOpacity(
            duration: Motion.quick,
            opacity: onTap == null ? 0.35 : 1,
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: c.elevated, shape: BoxShape.circle),
              child: Icon(icon, size: 16, color: c.textPrimary),
            ),
          ),
        );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        btn(LucideIcons.minus, zoom > 50 ? () => step(-10) : null, 'Smaller text'),
        SizedBox(
          width: 52,
          child: Text(
            '$zoom%',
            textAlign: TextAlign.center,
            style: context.text.titleSmall?.copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
          ),
        ),
        btn(LucideIcons.plus, zoom < 200 ? () => step(10) : null, 'Larger text'),
      ],
    );
  }
}
