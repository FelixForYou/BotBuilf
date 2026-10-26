import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/browser_tab.dart';
import '../../widgets/app_logo.dart';

/// Snapshot of a tab: its last captured screenshot or a start-page stand-in.
class TabPreview extends StatelessWidget {
  const TabPreview({super.key, required this.tab});

  final BrowserTab tab;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    if (!tab.showHome && tab.thumbnail != null) {
      return Image.memory(
        tab.thumbnail!,
        fit: BoxFit.cover,
        alignment: Alignment.topCenter,
        gaplessPlayback: true,
        filterQuality: FilterQuality.medium,
        width: double.infinity,
        height: double.infinity,
      );
    }
    return ColoredBox(
      color: c.background,
      child: Center(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (tab.showHome || tab.url.isEmpty)
                  const AppLogo(size: 48)
                else
                  Icon(LucideIcons.globe, size: 36, color: c.textSecondary),
                const SizedBox(height: 10),
                Text(
                  tab.showHome || tab.url.isEmpty
                      ? (tab.isPrivate ? 'Private tab' : 'New tab')
                      : 'Tap to load',
                  style: context.text.labelMedium,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Hero shuttle shared by the browser content and the tab cards: the
/// snapshot with corners that round as it shrinks into a card. The route
/// animation runs 0→1 towards the tabs overview in both directions.
Widget tabHeroShuttle(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromContext,
  BuildContext toContext,
) {
  BrowserTab? tabOf(BuildContext ctx) {
    final child = (ctx.widget as Hero).child;
    return child is TabPreviewHost ? child.tab : null;
  }

  final tab = tabOf(fromContext) ?? tabOf(toContext);
  return AnimatedBuilder(
    animation: animation,
    builder: (context, _) => ClipRRect(
      borderRadius: BorderRadius.circular(20 * animation.value),
      child: tab == null ? ColoredBox(color: context.mint.background) : TabPreview(tab: tab),
    ),
  );
}

/// Marks the hero child that carries the tab to draw during flight.
class TabPreviewHost extends StatelessWidget {
  const TabPreviewHost({super.key, required this.tab, required this.child});

  final BrowserTab tab;
  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}
