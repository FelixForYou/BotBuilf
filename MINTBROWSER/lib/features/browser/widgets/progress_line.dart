import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Thin mint loading bar that eases forward and fades out when done.
class ProgressLine extends StatelessWidget {
  const ProgressLine({super.key, required this.progress, required this.loading});

  final double progress;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return SizedBox(
      height: 2.5,
      child: AnimatedOpacity(
        opacity: loading ? 1 : 0,
        duration: Duration(milliseconds: loading ? 120 : 420),
        curve: Curves.easeOut,
        child: TweenAnimationBuilder<double>(
          tween: Tween(end: loading ? progress.clamp(0.05, 1.0) : 1.0),
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
          builder: (context, v, _) => Align(
            alignment: Alignment.centerLeft,
            child: FractionallySizedBox(
              widthFactor: v,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: c.accent,
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(2)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
