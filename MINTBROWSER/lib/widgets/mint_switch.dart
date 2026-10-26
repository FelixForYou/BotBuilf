import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

/// iOS-proportioned switch with a soft spring on the thumb.
class MintSwitch extends StatelessWidget {
  const MintSwitch({super.key, required this.value, required this.onChanged, this.label});

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Semantics(
      toggled: value,
      label: label,
      enabled: onChanged != null,
      child: GestureDetector(
        onTap: onChanged == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onChanged!(!value);
              },
        child: AnimatedContainer(
          duration: Motion.screen,
          curve: Motion.emphasized,
          width: 51,
          height: 31,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: value ? c.accent : (context.isDark ? c.divider : c.lightTrack),
            borderRadius: BorderRadius.circular(16),
          ),
          child: AnimatedAlign(
            duration: Motion.screen,
            curve: Curves.easeOutBack,
            alignment: value ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              width: 27,
              height: 27,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 4,
                    offset: const Offset(0, 1.5),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

extension on MintColors {
  Color get lightTrack => const Color(0xFFDADADF);
}
