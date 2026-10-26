import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

/// Small uppercase label above a group ("LANGUAGE", "GUIDE").
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.trailing, this.padding});

  final String text;
  final Widget? trailing;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.fromLTRB(4, 24, 4, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: context.text.labelSmall?.copyWith(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Rounded card holding rows separated by hairlines.
class GroupedCard extends StatelessWidget {
  const GroupedCard({super.key, required this.children, this.padding = EdgeInsets.zero});

  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      rows.add(children[i]);
      if (i < children.length - 1) {
        rows.add(Padding(
          padding: const EdgeInsets.only(left: 64),
          child: Divider(height: 0.6, thickness: 0.6, color: c.divider),
        ));
      }
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: ColoredBox(
        color: c.card,
        child: Padding(padding: padding, child: Column(children: rows)),
      ),
    );
  }
}

/// Mint icon in a soft round badge.
class TileIcon extends StatelessWidget {
  const TileIcon(this.icon, {super.key, this.color, this.size = 36});

  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final fg = color ?? c.accentInk;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: fg.withValues(alpha: 0.13), shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Icon(icon, size: size * 0.52, color: fg),
    );
  }
}

class GroupedTile extends StatefulWidget {
  const GroupedTile({
    super.key,
    required this.title,
    this.icon,
    this.leading,
    this.subtitle,
    this.value,
    this.trailing,
    this.onTap,
    this.onLongPress,
    this.destructive = false,
    this.chevron = true,
  });

  final String title;
  final IconData? icon;
  final Widget? leading;
  final String? subtitle;
  final String? value;
  final Widget? trailing;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool destructive;
  final bool chevron;

  @override
  State<GroupedTile> createState() => _GroupedTileState();
}

class _GroupedTileState extends State<GroupedTile> {
  bool _pressed = false;

  void _set(bool v) {
    if (widget.onTap != null && _pressed != v) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final titleColor = widget.destructive ? c.error : c.textPrimary;
    return Semantics(
      button: widget.onTap != null,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _set(true),
        onTapUp: (_) => _set(false),
        onTapCancel: () => _set(false),
        onTap: widget.onTap,
        onLongPress: widget.onLongPress,
        child: AnimatedContainer(
          duration: _pressed ? const Duration(milliseconds: 60) : Motion.quick,
          color: _pressed ? c.elevated : Colors.transparent,
          constraints: const BoxConstraints(minHeight: 58),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              if (widget.leading != null)
                widget.leading!
              else if (widget.icon != null)
                TileIcon(widget.icon!, color: widget.destructive ? c.error : null),
              if (widget.leading != null || widget.icon != null) const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodyLarge?.copyWith(
                        color: titleColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (widget.subtitle != null && widget.subtitle!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          widget.subtitle!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.labelMedium,
                        ),
                      ),
                  ],
                ),
              ),
              if (widget.value != null) ...[
                const SizedBox(width: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 140),
                  child: Text(
                    widget.value!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.bodyMedium?.copyWith(color: c.textSecondary),
                  ),
                ),
              ],
              if (widget.trailing != null) ...[const SizedBox(width: 8), widget.trailing!],
              if (widget.trailing == null && widget.chevron && widget.onTap != null) ...[
                const SizedBox(width: 6),
                Icon(LucideIcons.chevronRight, size: 20, color: c.textSecondary),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
