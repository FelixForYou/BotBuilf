import 'package:flutter/material.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';
import 'mint_button.dart';
import 'mint_text_field.dart';

/// Modal that fades and scales in from 92%.
Future<T?> showMintDialog<T>(BuildContext context, {required WidgetBuilder builder}) {
  return showGeneralDialog<T>(
    context: context,
    useRootNavigator: true,
    barrierDismissible: true,
    barrierLabel: 'Dismiss',
    barrierColor: context.mint.scrim,
    transitionDuration: Motion.modal,
    pageBuilder: (context, _, _) => builder(context),
    transitionBuilder: (context, a, _, child) {
      final curved = CurvedAnimation(parent: a, curve: Motion.emphasized, reverseCurve: Motion.exit);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(scale: Tween(begin: 0.92, end: 1.0).animate(curved), child: child),
      );
    },
  );
}

class MintDialog extends StatelessWidget {
  const MintDialog({
    super.key,
    required this.title,
    this.message,
    this.content,
    required this.actions,
    this.icon,
    this.iconColor,
  });

  final String title;
  final String? message;
  final Widget? content;
  final List<Widget> actions;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return SafeArea(
      child: Center(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.viewInsetsOf(context).bottom),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Material(
              color: c.card,
              borderRadius: BorderRadius.circular(26),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(22, 24, 22, 18),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: (iconColor ?? c.accentInk).withValues(alpha: 0.14),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(icon, color: iconColor ?? c.accentInk, size: 24),
                        ),
                        const SizedBox(height: 14),
                      ],
                      Text(title, textAlign: TextAlign.center, style: context.text.titleLarge),
                      if (message != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          message!,
                          textAlign: TextAlign.center,
                          style: context.text.bodyMedium?.copyWith(color: c.textSecondary),
                        ),
                      ],
                      if (content != null) ...[const SizedBox(height: 16), content!],
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          for (var i = 0; i < actions.length; i++) ...[
                            if (i > 0) const SizedBox(width: 10),
                            Expanded(child: actions[i]),
                          ],
                        ],
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

Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  bool destructive = false,
  IconData? icon,
}) async {
  final r = await showMintDialog<bool>(
    context,
    builder: (context) => MintDialog(
      title: title,
      message: message,
      icon: icon,
      iconColor: destructive ? context.mint.error : null,
      actions: [
        MintButton(
          label: cancelLabel,
          height: 50,
          variant: MintButtonVariant.secondary,
          onPressed: () => Navigator.of(context).pop(false),
        ),
        MintButton(
          label: confirmLabel,
          height: 50,
          variant: destructive ? MintButtonVariant.danger : MintButtonVariant.primary,
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    ),
  );
  return r ?? false;
}

Future<String?> promptDialog(
  BuildContext context, {
  required String title,
  String? message,
  String initial = '',
  String label = '',
  String confirmLabel = 'Save',
}) {
  return showMintDialog<String>(
    context,
    builder: (context) => _PromptDialog(
      title: title,
      message: message,
      initial: initial,
      label: label,
      confirmLabel: confirmLabel,
    ),
  );
}

class _PromptDialog extends StatefulWidget {
  const _PromptDialog({
    required this.title,
    required this.message,
    required this.initial,
    required this.label,
    required this.confirmLabel,
  });

  final String title;
  final String? message;
  final String initial;
  final String label;
  final String confirmLabel;

  @override
  State<_PromptDialog> createState() => _PromptDialogState();
}

class _PromptDialogState extends State<_PromptDialog> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MintDialog(
      title: widget.title,
      message: widget.message,
      content: MintTextField(
        controller: _controller,
        label: widget.label.isEmpty ? null : widget.label,
        autofocus: true,
        textInputAction: TextInputAction.done,
        onSubmitted: (v) => Navigator.of(context).pop(v),
      ),
      actions: [
        MintButton(
          label: 'Cancel',
          height: 50,
          variant: MintButtonVariant.secondary,
          onPressed: () => Navigator.of(context).pop(),
        ),
        MintButton(
          label: widget.confirmLabel,
          height: 50,
          onPressed: () => Navigator.of(context).pop(_controller.text),
        ),
      ],
    );
  }
}
