import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/theme/app_colors.dart';
import 'mint_button.dart';

/// Centered-title bar with a back chevron and optional actions, separated
/// from content by a hairline (the "WZH 2 APK" header).
class MintTopBar extends StatelessWidget implements PreferredSizeWidget {
  const MintTopBar({super.key, required this.title, this.actions = const [], this.onBack});

  final String title;
  final List<Widget> actions;
  final VoidCallback? onBack;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final canPop = Navigator.of(context).canPop();
    return Material(
      color: c.background,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 56,
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.divider, width: 0.6))),
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Row(
            children: [
              SizedBox(
                width: 96,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: (canPop || onBack != null)
                      ? MintIconButton(
                          icon: LucideIcons.chevronLeft,
                          iconSize: 26,
                          tooltip: 'Back',
                          onPressed: onBack ?? () => Navigator.of(context).maybePop(),
                        )
                      : null,
                ),
              ),
              Expanded(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              SizedBox(
                width: 96,
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: actions),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Big left-aligned title with a close button ("Menu  ×").
class LargeTitleHeader extends StatelessWidget {
  const LargeTitleHeader({super.key, required this.title, this.onClose, this.trailing});

  final String title;
  final VoidCallback? onClose;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 8, 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.displaySmall,
            ),
          ),
          ?trailing,
          if (onClose != null)
            MintIconButton(icon: LucideIcons.x, iconSize: 26, tooltip: 'Close', onPressed: onClose),
        ],
      ),
    );
  }
}

/// Constrains content width on tablets/foldables and adds side gutters.
class ContentWidth extends StatelessWidget {
  const ContentWidth({super.key, required this.child, this.maxWidth = 640, this.padding = 16});

  final Widget child;
  final double maxWidth;
  final double padding;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(padding: EdgeInsets.symmetric(horizontal: padding), child: child),
      ),
    );
  }
}
