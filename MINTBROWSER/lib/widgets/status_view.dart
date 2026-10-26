import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';
import 'mint_button.dart';
import 'toast.dart';

enum StatusTone { error, neutral }

/// Big-icon status card modelled on the "build didn't start" screen:
/// round icon, bold title, short message, stat pair, tip row, action and
/// a collapsible details box.
class StatusView extends StatefulWidget {
  const StatusView({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.tone = StatusTone.neutral,
    this.stats = const [],
    this.tip,
    this.actionLabel,
    this.onAction,
    this.secondaryLabel,
    this.onSecondary,
    this.details,
    this.scrollable = true,
  });

  final IconData icon;
  final String title;
  final String message;
  final StatusTone tone;

  /// (value, caption) pairs shown side by side.
  final List<(String, String)> stats;
  final String? tip;
  final String? actionLabel;
  final VoidCallback? onAction;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final String? details;
  final bool scrollable;

  @override
  State<StatusView> createState() => _StatusViewState();
}

class _StatusViewState extends State<StatusView> {
  bool _showDetails = false;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final isError = widget.tone == StatusTone.error;
    final iconFg = isError ? c.error : c.accentInk;
    final iconBg = isError ? c.errorTile : c.accentTile;

    final content = ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 520),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(milliseconds: 420),
            curve: Motion.emphasized,
            builder: (context, t, child) => Opacity(
              opacity: t,
              child: Transform.translate(offset: Offset(0, 16 * (1 - t)), child: child),
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
              decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(28)),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                    child: Icon(widget.icon, size: 30, color: iconFg),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    widget.title,
                    textAlign: TextAlign.center,
                    style: context.text.headlineSmall?.copyWith(fontSize: 22),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.message,
                    textAlign: TextAlign.center,
                    style: context.text.bodyMedium?.copyWith(color: c.textSecondary),
                  ),
                  if (widget.stats.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    _StatRow(stats: widget.stats),
                  ],
                  if (widget.tip != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: c.elevated,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.lightbulb, size: 18, color: c.accentInk),
                          const SizedBox(width: 10),
                          Expanded(child: Text(widget.tip!, style: context.text.bodySmall)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (widget.actionLabel != null) ...[
            const SizedBox(height: 20),
            MintButton(label: widget.actionLabel!, onPressed: widget.onAction),
          ],
          if (widget.secondaryLabel != null) ...[
            const SizedBox(height: 4),
            MintTextButton(
              label: widget.secondaryLabel!,
              onPressed: widget.onSecondary,
              color: c.textSecondary,
            ),
          ],
          if (widget.details != null) ...[
            const SizedBox(height: 6),
            MintTextButton(
              label: _showDetails ? 'Hide details' : 'Show details',
              trailingIcon: _showDetails ? LucideIcons.chevronUp : LucideIcons.chevronDown,
              color: c.textSecondary,
              onPressed: () => setState(() => _showDetails = !_showDetails),
            ),
            AnimatedSize(
              duration: Motion.screen,
              curve: Motion.emphasized,
              alignment: Alignment.topCenter,
              child: _showDetails
                  ? _DetailsBox(details: widget.details!, tone: widget.tone)
                  : const SizedBox(width: double.infinity),
            ),
          ],
        ],
      ),
    );

    final padded = Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: content);
    if (!widget.scrollable) return Center(child: padded);
    return LayoutBuilder(
      builder: (context, box) => SingleChildScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: box.maxHeight - 48),
          child: Center(child: padded),
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.stats});

  final List<(String, String)> stats;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Container(
      decoration: BoxDecoration(color: c.elevated, borderRadius: BorderRadius.circular(16)),
      child: IntrinsicHeight(
        child: Row(
          children: [
            for (var i = 0; i < stats.length; i++) ...[
              if (i > 0) VerticalDivider(width: 1, thickness: 1, color: c.divider),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  child: Column(
                    children: [
                      Text(
                        stats[i].$1,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.titleSmall?.copyWith(fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Text(stats[i].$2, style: context.text.labelMedium?.copyWith(fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailsBox extends StatelessWidget {
  const _DetailsBox({required this.details, required this.tone});

  final String details;
  final StatusTone tone;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final isError = tone == StatusTone.error;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: (isError ? c.error : c.divider).withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SelectableText(
            details,
            style: context.text.bodySmall?.copyWith(
              color: isError ? Color.lerp(c.error, c.textPrimary, 0.55) : c.textSecondary,
              height: 1.5,
            ),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: MintTextButton(
              label: 'Copy details',
              icon: LucideIcons.copy,
              onPressed: () {
                Clipboard.setData(ClipboardData(text: details));
                MintToast.show(context, title: 'Details copied', kind: ToastKind.success);
              },
            ),
          ),
        ],
      ),
    );
  }
}
