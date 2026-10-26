import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

enum ToastKind { info, success, warning, error }

/// Floating banner that drops in from the top (see "Flutter builds have
/// known bugs" in the reference). One at a time; swipe up to dismiss.
abstract final class MintToast {
  static _ToastHandle? _current;

  static void show(
    BuildContext context, {
    required String title,
    String? message,
    ToastKind kind = ToastKind.info,
    String? actionLabel,
    VoidCallback? onAction,
    Duration duration = const Duration(milliseconds: 2800),
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;
    _current?.dismiss(immediate: true);
    late final _ToastHandle handle;
    final key = GlobalKey<_ToastViewState>();
    final entry = OverlayEntry(
      builder: (_) => _ToastView(
        key: key,
        title: title,
        message: message,
        kind: kind,
        actionLabel: actionLabel,
        onAction: onAction == null
            ? null
            : () {
                handle.dismiss();
                onAction();
              },
        onDismissed: () => handle.remove(),
      ),
    );
    handle = _ToastHandle(entry, key);
    _current = handle;
    overlay.insert(entry);
    handle.timer = Timer(duration, handle.dismiss);
  }
}

class _ToastHandle {
  _ToastHandle(this.entry, this.key);
  final OverlayEntry entry;
  final GlobalKey<_ToastViewState> key;
  Timer? timer;
  bool _removed = false;

  void dismiss({bool immediate = false}) {
    timer?.cancel();
    if (immediate || key.currentState == null) {
      remove();
    } else {
      key.currentState!.hide();
    }
  }

  void remove() {
    if (_removed) return;
    _removed = true;
    timer?.cancel();
    entry.remove();
    if (MintToast._current == this) MintToast._current = null;
  }
}

class _ToastView extends StatefulWidget {
  const _ToastView({
    super.key,
    required this.title,
    required this.message,
    required this.kind,
    required this.actionLabel,
    required this.onAction,
    required this.onDismissed,
  });

  final String title;
  final String? message;
  final ToastKind kind;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback onDismissed;

  @override
  State<_ToastView> createState() => _ToastViewState();
}

class _ToastViewState extends State<_ToastView> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: Motion.screen,
    reverseDuration: const Duration(milliseconds: 220),
  )..forward();
  double _drag = 0;

  void hide() {
    if (!mounted) return;
    _c.reverse().whenComplete(widget.onDismissed);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final (icon, fg) = switch (widget.kind) {
      ToastKind.info => (LucideIcons.info, c.accentInk),
      ToastKind.success => (LucideIcons.check, c.accentInk),
      ToastKind.warning => (LucideIcons.triangleAlert, c.warning),
      ToastKind.error => (LucideIcons.circleAlert, c.error),
    };
    final anim = CurvedAnimation(parent: _c, curve: Motion.emphasized, reverseCurve: Motion.exit);
    final top = MediaQuery.paddingOf(context).top + 8;
    return Positioned(
      top: top,
      left: 12,
      right: 12,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: AnimatedBuilder(
            animation: anim,
            builder: (context, child) => Opacity(
              opacity: anim.value.clamp(0, 1),
              child: Transform.translate(
                offset: Offset(0, -80 * (1 - anim.value) + _drag),
                child: child,
              ),
            ),
            child: GestureDetector(
              onVerticalDragUpdate: (d) => setState(() => _drag = (_drag + d.delta.dy).clamp(-80, 12)),
              onVerticalDragEnd: (d) {
                if (_drag < -24 || d.velocity.pixelsPerSecond.dy < -300) {
                  hide();
                } else {
                  setState(() => _drag = 0);
                }
              },
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
                  decoration: BoxDecoration(
                    color: context.isDark ? const Color(0xFF2A2A2C) : c.card,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: c.divider.withValues(alpha: 0.6)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: context.isDark ? 0.4 : 0.12),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: widget.kind == ToastKind.warning ? c.warning : fg.withValues(alpha: 0.16),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          icon,
                          size: 17,
                          color: widget.kind == ToastKind.warning ? Colors.black : fg,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              widget.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: context.text.titleSmall?.copyWith(fontSize: 16),
                            ),
                            if (widget.message != null)
                              Text(
                                widget.message!,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: context.text.bodySmall,
                              ),
                          ],
                        ),
                      ),
                      if (widget.actionLabel != null)
                        GestureDetector(
                          onTap: widget.onAction,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            child: Text(
                              widget.actionLabel!,
                              style: context.text.titleSmall?.copyWith(color: c.accentInk),
                            ),
                          ),
                        ),
                    ],
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
