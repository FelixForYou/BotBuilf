import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Continuous arc spinner with an eased sweep (smoother than the stock one
/// at small sizes).
class MintSpinner extends StatefulWidget {
  const MintSpinner({super.key, this.size = 20, this.color, this.stroke = 2.4});

  final double size;
  final Color? color;
  final double stroke;

  @override
  State<MintSpinner> createState() => _MintSpinnerState();
}

class _MintSpinnerState extends State<MintSpinner> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Theme.of(context).colorScheme.primary;
    return RepaintBoundary(
      child: SizedBox.square(
        dimension: widget.size,
        child: AnimatedBuilder(
          animation: _c,
          builder: (_, _) => CustomPaint(painter: _ArcPainter(_c.value, color, widget.stroke)),
        ),
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter(this.t, this.color, this.stroke);

  final double t;
  final Color color;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    final track = Paint()
      ..color = color.withValues(alpha: 0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    final r = rect.deflate(stroke / 2);
    canvas.drawArc(r, 0, math.pi * 2, false, track);
    final sweep = (0.25 + 0.5 * Curves.easeInOut.transform((math.sin(t * math.pi * 2) + 1) / 2)) *
        math.pi * 1.4;
    canvas.drawArc(r, t * math.pi * 2 - math.pi / 2, sweep, false, paint);
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.t != t || old.color != color;
}
