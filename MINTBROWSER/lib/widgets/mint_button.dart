import 'package:flutter/material.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';
import 'pressable.dart';
import 'spinner.dart';

enum MintButtonVariant { primary, secondary, danger }

class MintButton extends StatelessWidget {
  const MintButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
    this.variant = MintButtonVariant.primary,
    this.expand = true,
    this.height = 56,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final MintButtonVariant variant;
  final bool expand;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final enabled = onPressed != null && !loading;
    final (bg, fg) = switch (variant) {
      MintButtonVariant.primary => (c.accent, c.onAccent),
      MintButtonVariant.secondary => (c.elevated, c.textPrimary),
      MintButtonVariant.danger => (c.errorTile, c.error),
    };
    // Disabled keeps the shape but drops into the background (see the
    // "Continue" button in the reference).
    final disabled = onPressed == null && !loading;
    final effectiveBg = disabled ? Color.lerp(bg, c.background, 0.45)! : bg;
    final effectiveFg = disabled ? fg.withValues(alpha: 0.55) : fg;

    final content = AnimatedSwitcher(
      duration: Motion.quick,
      switchInCurve: Motion.emphasized,
      transitionBuilder: (child, a) => FadeTransition(
        opacity: a,
        child: ScaleTransition(scale: Tween(begin: 0.85, end: 1.0).animate(a), child: child),
      ),
      child: loading
          ? MintSpinner(key: const ValueKey('l'), size: 22, color: effectiveFg)
          : Row(
              key: const ValueKey('c'),
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 20, color: effectiveFg),
                  const SizedBox(width: 10),
                ],
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.labelLarge?.copyWith(
                      color: effectiveFg,
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
    );

    return Pressable(
      onTap: enabled ? onPressed : null,
      haptic: true,
      semanticLabel: label,
      child: AnimatedContainer(
        duration: Motion.quick,
        curve: Motion.standard,
        height: height,
        width: expand ? double.infinity : null,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: effectiveBg,
          borderRadius: BorderRadius.circular(height / 2 > 20 ? 20 : height / 2),
        ),
        child: content,
      ),
    );
  }
}

/// Text-only action ("Skip", "Hide details").
class MintTextButton extends StatelessWidget {
  const MintTextButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.color,
    this.icon,
    this.trailingIcon,
  });

  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  final IconData? icon;
  final IconData? trailingIcon;

  @override
  Widget build(BuildContext context) {
    final fg = color ?? context.mint.accentInk;
    return Pressable(
      onTap: onPressed,
      scale: 0.94,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 18, color: fg), const SizedBox(width: 8)],
            Text(label, style: context.text.titleSmall?.copyWith(color: fg)),
            if (trailingIcon != null) ...[
              const SizedBox(width: 6),
              Icon(trailingIcon, size: 18, color: fg),
            ],
          ],
        ),
      ),
    );
  }
}

/// Round icon button used in toolbars and headers.
class MintIconButton extends StatelessWidget {
  const MintIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    required this.tooltip,
    this.size = 44,
    this.iconSize = 22,
    this.filled = false,
    this.color,
    this.background,
    this.onLongPress,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final VoidCallback? onLongPress;
  final String tooltip;
  final double size;
  final double iconSize;
  final bool filled;
  final Color? color;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final fg = color ?? c.textPrimary;
    return Tooltip(
      message: tooltip,
      waitDuration: const Duration(milliseconds: 600),
      child: Pressable(
        onTap: onPressed,
        onLongPress: onLongPress,
        scale: 0.88,
        semanticLabel: tooltip,
        child: AnimatedOpacity(
          duration: Motion.quick,
          opacity: onPressed == null ? 0.35 : 1,
          child: Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: background ?? (filled ? c.elevated : Colors.transparent),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: iconSize, color: fg),
          ),
        ),
      ),
    );
  }
}
