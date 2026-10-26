import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/motion/motion.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/url_utils.dart';
import '../../../data/models/browser_tab.dart';
import '../../../widgets/mint_button.dart';
import '../../../widgets/pressable.dart';

/// Home · address pill · new tab · tab count · menu.
class TopToolbar extends StatelessWidget {
  const TopToolbar({
    super.key,
    required this.tab,
    required this.tabCount,
    required this.onHome,
    required this.onAddress,
    required this.onNewTab,
    required this.onTabs,
    required this.onMenu,
  });

  final BrowserTab tab;
  final int tabCount;
  final VoidCallback onHome;
  final VoidCallback onAddress;
  final VoidCallback onNewTab;
  final VoidCallback onTabs;
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60,
      child: Row(
        children: [
          const SizedBox(width: 4),
          MintIconButton(icon: LucideIcons.house, tooltip: 'Start page', onPressed: onHome),
          Expanded(child: _AddressPill(tab: tab, onTap: onAddress)),
          MintIconButton(icon: LucideIcons.plus, iconSize: 24, tooltip: 'New tab', onPressed: onNewTab),
          _TabCountButton(count: tabCount, private: tab.isPrivate, onTap: onTabs),
          MintIconButton(icon: LucideIcons.ellipsisVertical, tooltip: 'Menu', onPressed: onMenu),
          const SizedBox(width: 2),
        ],
      ),
    );
  }
}

class _AddressPill extends StatelessWidget {
  const _AddressPill({required this.tab, required this.onTap});

  final BrowserTab tab;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final showingPage = !tab.showHome && tab.url.isNotEmpty;
    final text = showingPage ? UrlUtils.display(tab.url) : 'Search or type URL';
    final IconData leading = tab.isPrivate
        ? LucideIcons.venetianMask
        : !showingPage
            ? LucideIcons.search
            : UrlUtils.isSecure(tab.url)
                ? LucideIcons.lock
                : LucideIcons.info;
    return Pressable(
      onTap: onTap,
      scale: 0.98,
      semanticLabel: 'Address bar, $text',
      child: Container(
        height: 44,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: tab.isPrivate ? c.accentTile : c.elevated,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          children: [
            Icon(
              leading,
              size: 15,
              color: tab.isPrivate ? c.accentInk : c.textSecondary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AnimatedSwitcher(
                duration: Motion.quick,
                layoutBuilder: (current, previous) => Stack(
                  alignment: Alignment.centerLeft,
                  children: [...previous, ?current],
                ),
                child: Text(
                  text,
                  key: ValueKey(text),
                  maxLines: 1,
                  overflow: TextOverflow.fade,
                  softWrap: false,
                  style: context.text.bodyLarge?.copyWith(
                    color: showingPage ? c.textPrimary : c.textSecondary,
                    fontWeight: showingPage ? FontWeight.w500 : FontWeight.w400,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabCountButton extends StatelessWidget {
  const _TabCountButton({required this.count, required this.private, required this.onTap});

  final int count;
  final bool private;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final fg = private ? c.accentInk : c.textPrimary;
    return Tooltip(
      message: 'Tabs',
      child: Pressable(
        onTap: onTap,
        scale: 0.88,
        semanticLabel: '$count tabs open',
        child: SizedBox(
          width: 44,
          height: 44,
          child: Center(
            child: Container(
              width: 24,
              height: 24,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: fg, width: 2),
                borderRadius: BorderRadius.circular(7),
              ),
              child: AnimatedSwitcher(
                duration: Motion.quick,
                transitionBuilder: (child, a) => ScaleTransition(scale: a, child: child),
                child: Text(
                  count > 99 ? '∞' : '$count',
                  key: ValueKey(count),
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: count > 9 ? 10.5 : 12,
                    fontWeight: FontWeight.w700,
                    color: fg,
                    height: 1,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Back · forward · reload/stop · bookmark · share.
class BottomToolbar extends StatelessWidget {
  const BottomToolbar({
    super.key,
    required this.canBack,
    required this.canForward,
    required this.loading,
    required this.bookmarked,
    required this.hasPage,
    required this.onBack,
    required this.onForward,
    required this.onReload,
    required this.onStop,
    required this.onBookmark,
    required this.onShare,
  });

  final bool canBack;
  final bool canForward;
  final bool loading;
  final bool bookmarked;
  final bool hasPage;
  final VoidCallback onBack;
  final VoidCallback onForward;
  final VoidCallback onReload;
  final VoidCallback onStop;
  final VoidCallback onBookmark;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return SizedBox(
      height: 56,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          MintIconButton(
            icon: LucideIcons.arrowLeft,
            tooltip: 'Back',
            onPressed: canBack ? onBack : null,
          ),
          MintIconButton(
            icon: LucideIcons.arrowRight,
            tooltip: 'Forward',
            onPressed: canForward ? onForward : null,
          ),
          AnimatedSwitcher(
            duration: Motion.quick,
            transitionBuilder: (child, a) => RotationTransition(
              turns: Tween(begin: 0.75, end: 1.0).animate(a),
              child: FadeTransition(opacity: a, child: child),
            ),
            child: loading
                ? MintIconButton(
                    key: const ValueKey('stop'),
                    icon: LucideIcons.x,
                    tooltip: 'Stop',
                    onPressed: onStop,
                  )
                : MintIconButton(
                    key: const ValueKey('reload'),
                    icon: LucideIcons.rotateCw,
                    tooltip: 'Reload',
                    onPressed: hasPage ? onReload : null,
                  ),
          ),
          MintIconButton(
            icon: LucideIcons.star,
            tooltip: bookmarked ? 'Remove bookmark' : 'Bookmark',
            color: bookmarked ? c.accentInk : null,
            background: bookmarked ? c.accent.withValues(alpha: 0.14) : null,
            onPressed: hasPage ? onBookmark : null,
          ),
          MintIconButton(
            icon: LucideIcons.share2,
            tooltip: 'Share',
            onPressed: hasPage ? onShare : null,
          ),
        ],
      ),
    );
  }
}
