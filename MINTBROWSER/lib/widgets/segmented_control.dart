import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

class SegmentOption<T> {
  const SegmentOption(this.value, this.label, {this.icon});
  final T value;
  final String label;
  final IconData? icon;
}

/// Two-or-more segment picker matching the "Upload | Website" control.
class SegmentedControl<T> extends StatelessWidget {
  const SegmentedControl({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.height = 52,
  });

  final List<SegmentOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final index = options.indexWhere((o) => o.value == value).clamp(0, options.length - 1);
    return Container(
      height: height,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.isDark ? const Color(0xFF181819) : c.elevated,
        borderRadius: BorderRadius.circular(16),
      ),
      child: LayoutBuilder(
        builder: (context, box) {
          final w = box.maxWidth / options.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: Motion.screen,
                curve: Motion.emphasized,
                left: w * index,
                top: 0,
                bottom: 0,
                width: w,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: context.isDark ? c.elevated : c.card,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              Row(
                children: [
                  for (var i = 0; i < options.length; i++)
                    Expanded(
                      child: Semantics(
                        selected: i == index,
                        button: true,
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () {
                            if (i == index) return;
                            HapticFeedback.selectionClick();
                            onChanged(options[i].value);
                          },
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: Motion.quick,
                              style: context.text.titleSmall!.copyWith(
                                color: i == index ? c.accentInk : c.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (options[i].icon != null) ...[
                                    Icon(
                                      options[i].icon,
                                      size: 17,
                                      color: i == index ? c.accentInk : c.textPrimary,
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Flexible(
                                    child: Text(
                                      options[i].label,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
