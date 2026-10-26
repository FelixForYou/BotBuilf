import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/url_utils.dart';
import '../../data/models/history_entry.dart';
import '../../router.dart';
import '../../state/history_provider.dart';
import '../../state/settings_provider.dart';
import '../../state/tabs_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/mint_text_field.dart';
import '../../widgets/sheets.dart';
import '../../widgets/site_icon.dart';
import '../../widgets/status_view.dart';
import '../../widgets/toast.dart';
import '../browser/web/web_engine.dart';

/// Opens [url] in the active tab and returns to the browser.
void openInBrowser(BuildContext context, WidgetRef ref, String url, {bool newTab = false, bool private = false}) {
  final tabs = ref.read(tabsProvider.notifier);
  if (newTab || private || ref.read(tabsProvider).active.isPrivate != private) {
    tabs.newTab(url: url, private: private);
  } else {
    ref.read(webEngineProvider).load(ref.read(tabsProvider).activeId, url);
  }
  context.go(Routes.browser);
}

Future<void> showLinkActions(
  BuildContext context,
  WidgetRef ref, {
  required String url,
  required String title,
  List<Widget> extra = const [],
}) {
  return showMintSheet<void>(
    context,
    builder: (sheet) => Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              SiteIcon(url: url, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: sheet.text.titleMedium),
                    Text(url, maxLines: 1, overflow: TextOverflow.ellipsis, style: sheet.text.labelMedium),
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
                openInBrowser(context, ref, url, newTab: true);
              },
            ),
            GroupedTile(
              icon: LucideIcons.venetianMask,
              title: 'Open in private tab',
              onTap: () {
                Navigator.of(sheet).pop();
                openInBrowser(context, ref, url, private: true);
              },
            ),
            GroupedTile(
              icon: LucideIcons.copy,
              title: 'Copy link',
              chevron: false,
              onTap: () {
                Navigator.of(sheet).pop();
                Clipboard.setData(ClipboardData(text: url));
                MintToast.show(context, title: 'Link copied', kind: ToastKind.success);
              },
            ),
            ...extra,
          ]),
        ],
      ),
    ),
  );
}

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  void _delete(HistoryEntry e) {
    final n = ref.read(historyProvider.notifier);
    n.remove(e);
    MintToast.show(context, title: 'Removed from history', actionLabel: 'Undo', onAction: () => n.restore(e));
  }

  Future<void> _clearAll() async {
    final ok = await confirmDialog(
      context,
      title: 'Clear all history?',
      message: 'Every page you’ve visited will be removed from this device.',
      confirmLabel: 'Clear',
      destructive: true,
      icon: LucideIcons.trash2,
    );
    if (ok) await ref.read(historyProvider.notifier).clear();
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(historyProvider);
    final saveHistory = ref.watch(settingsProvider.select((s) => s.saveHistory));
    final entries = ref.read(historyProvider.notifier).search(_query.text);
    final all = ref.read(historyProvider);

    // Group by calendar day, newest first.
    final groups = <String, List<HistoryEntry>>{};
    for (final e in entries) {
      groups.putIfAbsent(Formatters.dayLabel(e.visitedAt), () => []).add(e);
    }

    return Scaffold(
      appBar: MintTopBar(
        title: 'History',
        actions: [
          if (all.isNotEmpty)
            MintIconButton(icon: LucideIcons.trash2, tooltip: 'Clear history', onPressed: _clearAll),
        ],
      ),
      body: all.isEmpty
          ? StatusView(
              icon: LucideIcons.history,
              title: saveHistory ? 'No history yet' : 'History is off',
              message: saveHistory
                  ? 'Pages you visit in normal tabs appear here. Private tabs are never saved.'
                  : 'Turn on “Save history” in Settings to keep a record of pages you visit.',
              actionLabel: 'Start browsing',
              onAction: () => context.go(Routes.browser),
            )
          : CustomScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              slivers: [
                SliverToBoxAdapter(
                  child: ContentWidth(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: MintTextField(
                        controller: _query,
                        hint: 'Search history',
                        prefixIcon: LucideIcons.search,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ),
                ),
                if (entries.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: StatusView(
                      icon: LucideIcons.search,
                      title: 'No matches',
                      message: 'Nothing in your history matches “${_query.text.trim()}”.',
                      scrollable: false,
                    ),
                  ),
                for (final g in groups.entries)
                  SliverToBoxAdapter(
                    child: ContentWidth(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SectionLabel(g.key),
                          GroupedCard(children: [
                            for (final e in g.value)
                              Dismissible(
                                key: ValueKey('${e.url}-${e.visitedAt.millisecondsSinceEpoch}'),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  color: context.mint.error,
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  child: const Icon(LucideIcons.trash2, color: Colors.white, size: 20),
                                ),
                                onDismissed: (_) => _delete(e),
                                child: GroupedTile(
                                  leading: SiteIcon(url: e.url, size: 36, radius: 18),
                                  title: e.title.isEmpty ? UrlUtils.display(e.url) : e.title,
                                  subtitle: '${Formatters.time(e.visitedAt)} · ${UrlUtils.display(e.url)}',
                                  chevron: false,
                                  onTap: () => openInBrowser(context, ref, e.url),
                                  onLongPress: () => showLinkActions(
                                    context,
                                    ref,
                                    url: e.url,
                                    title: e.title,
                                    extra: [
                                      Builder(
                                        builder: (sheet) => GroupedTile(
                                          icon: LucideIcons.trash2,
                                          title: 'Remove from history',
                                          destructive: true,
                                          chevron: false,
                                          onTap: () {
                                            Navigator.of(sheet).pop();
                                            _delete(e);
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ]),
                        ],
                      ),
                    ),
                  ),
                SliverToBoxAdapter(child: SizedBox(height: 32 + MediaQuery.paddingOf(context).bottom)),
              ],
            ),
    );
  }
}
