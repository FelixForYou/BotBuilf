import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/browser_tab.dart';
import '../../state/tabs_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/pressable.dart';
import '../../widgets/segmented_control.dart';
import '../../widgets/site_icon.dart';
import '../../widgets/status_view.dart';
import '../../widgets/toast.dart';
import 'tab_preview.dart';

class TabsScreen extends ConsumerStatefulWidget {
  const TabsScreen({super.key});

  @override
  ConsumerState<TabsScreen> createState() => _TabsScreenState();
}

class _TabsScreenState extends ConsumerState<TabsScreen> {
  late bool _private = ref.read(tabsProvider).active.isPrivate;

  TabsNotifier get _tabs => ref.read(tabsProvider.notifier);

  void _open(BrowserTab t) {
    HapticFeedback.selectionClick();
    _tabs.activate(t.id);
    Navigator.of(context).pop();
  }

  void _close(BrowserTab t) {
    _tabs.close(t.id);
    if (!t.isPrivate && !t.isBlank) {
      MintToast.show(
        context,
        title: 'Tab closed',
        message: t.displayTitle,
        actionLabel: 'Undo',
        onAction: () => _tabs.reopenClosed(),
      );
    }
  }

  void _newTab() {
    _tabs.newTab(private: _private);
    Navigator.of(context).pop();
  }

  Future<void> _closeAll(int count) async {
    final ok = await confirmDialog(
      context,
      title: _private ? 'Close all private tabs?' : 'Close all tabs?',
      message: _private
          ? 'Cookies and site data from this private session will be erased.'
          : 'You can reopen recently closed tabs from the menu.',
      confirmLabel: 'Close $count',
      destructive: true,
      icon: LucideIcons.trash2,
    );
    if (ok) _tabs.closeAll(private: _private);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final state = ref.watch(tabsProvider);
    final list = _private ? state.private : state.normal;
    final width = MediaQuery.sizeOf(context).width;
    final columns = width >= 1000 ? 4 : width >= 640 ? 3 : 2;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            LargeTitleHeader(
              title: 'Tabs',
              onClose: () => Navigator.of(context).pop(),
            ),
            ContentWidth(
              maxWidth: 720,
              child: Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 8),
                child: SegmentedControl<bool>(
                  value: _private,
                  onChanged: (v) => setState(() => _private = v),
                  options: [
                    SegmentOption(false, 'Tabs · ${state.normal.length}', icon: LucideIcons.layers),
                    SegmentOption(true, 'Private · ${state.private.length}', icon: LucideIcons.venetianMask),
                  ],
                ),
              ),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: Motion.screen,
                switchInCurve: Motion.emphasized,
                transitionBuilder: (child, a) => FadeTransition(
                  opacity: a,
                  child: SlideTransition(
                    position: Tween(begin: Offset(_private ? 0.06 : -0.06, 0), end: Offset.zero).animate(a),
                    child: child,
                  ),
                ),
                child: list.isEmpty
                    ? StatusView(
                        key: ValueKey('empty-$_private'),
                        icon: _private ? LucideIcons.venetianMask : LucideIcons.layers,
                        title: _private ? 'No private tabs' : 'No tabs',
                        message: _private
                            ? 'Private tabs keep their own cookies and leave no history.'
                            : 'Open a tab to start browsing.',
                        actionLabel: _private ? 'New private tab' : 'New tab',
                        onAction: _newTab,
                      )
                    : GridView.builder(
                        key: ValueKey('grid-$_private'),
                        padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + MediaQuery.paddingOf(context).bottom),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 0.74,
                        ),
                        itemCount: list.length,
                        itemBuilder: (context, i) {
                          final t = list[i];
                          return _TabCard(
                            key: ValueKey(t.id),
                            tab: t,
                            active: t.id == state.activeId,
                            onOpen: () => _open(t),
                            onClose: () => _close(t),
                          );
                        },
                      ),
              ),
            ),
            Container(
              decoration: BoxDecoration(border: Border(top: BorderSide(color: c.divider, width: 0.6))),
              padding: const EdgeInsets.fromLTRB(12, 10, 16, 10),
              child: Row(
                children: [
                  MintTextButton(
                    label: 'Close all',
                    color: list.isEmpty ? c.textSecondary : c.error,
                    onPressed: list.isEmpty ? null : () => _closeAll(list.length),
                  ),
                  const Spacer(),
                  MintButton(
                    label: _private ? 'New private tab' : 'New tab',
                    icon: LucideIcons.plus,
                    expand: false,
                    height: 50,
                    onPressed: _newTab,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabCard extends StatefulWidget {
  const _TabCard({
    super.key,
    required this.tab,
    required this.active,
    required this.onOpen,
    required this.onClose,
  });

  final BrowserTab tab;
  final bool active;
  final VoidCallback onOpen;
  final VoidCallback onClose;

  @override
  State<_TabCard> createState() => _TabCardState();
}

class _TabCardState extends State<_TabCard> {
  bool _closing = false;

  void _close() {
    if (_closing) return;
    HapticFeedback.lightImpact();
    setState(() => _closing = true);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final t = widget.tab;
    return AnimatedScale(
      scale: _closing ? 0.85 : 1,
      duration: const Duration(milliseconds: 200),
      curve: Motion.exit,
      onEnd: () {
        if (_closing) widget.onClose();
      },
      child: AnimatedOpacity(
        opacity: _closing ? 0 : 1,
        duration: const Duration(milliseconds: 200),
        child: Dismissible(
          key: ValueKey('dismiss-${t.id}'),
          direction: DismissDirection.horizontal,
          onDismissed: (_) => widget.onClose(),
          child: Pressable(
            onTap: widget.onOpen,
            scale: 0.96,
            semanticLabel: t.displayTitle,
            child: Container(
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: widget.active ? c.accent : c.divider.withValues(alpha: 0.6),
                  width: widget.active ? 2 : 0.8,
                ),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(10, 6, 2, 6),
                    child: Row(
                      children: [
                        if (t.showHome || t.url.isEmpty)
                          Icon(
                            t.isPrivate ? LucideIcons.venetianMask : LucideIcons.house,
                            size: 16,
                            color: c.accentInk,
                          )
                        else
                          SiteIcon(url: t.url, size: 18, fetch: !t.isPrivate, radius: 5),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            t.displayTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.labelMedium?.copyWith(
                              color: c.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        MintIconButton(
                          icon: LucideIcons.x,
                          size: 34,
                          iconSize: 17,
                          color: c.textSecondary,
                          tooltip: 'Close tab',
                          onPressed: _close,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
                      child: Hero(
                        tag: 'tab-${t.id}',
                        flightShuttleBuilder: tabHeroShuttle,
                        child: TabPreviewHost(
                          tab: t,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: TabPreview(tab: t),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
