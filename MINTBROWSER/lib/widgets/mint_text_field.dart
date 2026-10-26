import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

/// Filled field with a floating caption ("App name") and a mint focus ring.
class MintTextField extends StatefulWidget {
  const MintTextField({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.error,
    this.autofocus = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
    this.prefixIcon,
    this.focusNode,
    this.clearable = true,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final String? error;
  final bool autofocus;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final IconData? prefixIcon;
  final FocusNode? focusNode;
  final bool clearable;

  @override
  State<MintTextField> createState() => _MintTextFieldState();
}

class _MintTextFieldState extends State<MintTextField> {
  late final FocusNode _focus = widget.focusNode ?? FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(_rebuild);
    widget.controller.addListener(_rebuild);
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    _focus.removeListener(_rebuild);
    widget.controller.removeListener(_rebuild);
    if (widget.focusNode == null) _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final hasError = widget.error != null && widget.error!.isNotEmpty;
    final borderColor = hasError
        ? c.error
        : _focus.hasFocus
            ? c.accent
            : Colors.transparent;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: Motion.quick,
          curve: Motion.standard,
          padding: const EdgeInsets.fromLTRB(16, 10, 10, 10),
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor, width: 1.5),
          ),
          child: Row(
            children: [
              if (widget.prefixIcon != null) ...[
                Icon(widget.prefixIcon, size: 20, color: c.textSecondary),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (widget.label != null)
                      Text(widget.label!, style: context.text.labelMedium?.copyWith(fontSize: 12)),
                    TextField(
                      controller: widget.controller,
                      focusNode: _focus,
                      autofocus: widget.autofocus,
                      keyboardType: widget.keyboardType,
                      textInputAction: widget.textInputAction,
                      onSubmitted: widget.onSubmitted,
                      onChanged: widget.onChanged,
                      style: context.text.bodyLarge,
                      cursorWidth: 2,
                      decoration: InputDecoration(
                        isDense: true,
                        filled: false,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 6),
                        hintText: widget.hint,
                        hintStyle: context.text.bodyLarge?.copyWith(color: c.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: Motion.quick,
                transitionBuilder: (child, a) => ScaleTransition(scale: a, child: child),
                child: widget.clearable && widget.controller.text.isNotEmpty
                    ? GestureDetector(
                        key: const ValueKey('clear'),
                        onTap: () {
                          widget.controller.clear();
                          widget.onChanged?.call('');
                        },
                        child: Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: c.textSecondary.withValues(alpha: 0.55),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(LucideIcons.x, size: 14, color: c.card),
                        ),
                      )
                    : const SizedBox(key: ValueKey('none'), width: 34),
              ),
            ],
          ),
        ),
        AnimatedSize(
          duration: Motion.quick,
          curve: Motion.emphasized,
          alignment: Alignment.topLeft,
          child: hasError
              ? Padding(
                  padding: const EdgeInsets.fromLTRB(6, 8, 6, 0),
                  child: Row(
                    children: [
                      Icon(LucideIcons.triangleAlert, size: 15, color: c.error),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          widget.error!,
                          style: context.text.labelMedium?.copyWith(color: c.error),
                        ),
                      ),
                    ],
                  ),
                )
              : const SizedBox(width: double.infinity),
        ),
      ],
    );
  }
}
