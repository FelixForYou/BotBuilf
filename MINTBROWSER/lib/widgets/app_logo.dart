import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Scan-frame brackets around a compass needle — the app mark.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 96, this.tile = true});

  final double size;

  /// Draw the rounded tile behind the mark.
  final bool tile;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return SizedBox.square(
      dimension: size,
      child: CustomPaint(
        painter: LogoPainter(
          accent: c.accent,
          tile: tile ? c.accentTile : null,
        ),
      ),
    );
  }
}

class LogoPainter extends CustomPainter {
  LogoPainter({required this.accent, this.tile, this.needleRotation = 0});

  final Color accent;
  final Color? tile;
  final double needleRotation;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide;
    final rect = Offset.zero & Size.square(s);
    if (tile != null) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(s * 0.28)),
        Paint()..color = tile!,
      );
    }
    final inset = s * 0.2;
    final arm = s * 0.16;
    final frame = rect.deflate(inset);
    final stroke = Paint()
      ..color = accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = s * 0.055
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final r = s * 0.05;
    for (final corner in [
      (frame.topLeft, 1.0, 1.0),
      (frame.topRight, -1.0, 1.0),
      (frame.bottomLeft, 1.0, -1.0),
      (frame.bottomRight, -1.0, -1.0),
    ]) {
      final (p, dx, dy) = corner;
      final path = Path()
        ..moveTo(p.dx, p.dy + dy * arm)
        ..lineTo(p.dx, p.dy + dy * r)
        ..quadraticBezierTo(p.dx, p.dy, p.dx + dx * r, p.dy)
        ..lineTo(p.dx + dx * arm, p.dy);
      canvas.drawPath(path, stroke);
    }

    // Compass needle.
    final center = rect.center;
    final len = s * 0.2;
    final w = s * 0.085;
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(math.pi / 4 + needleRotation);
    final north = Path()
      ..moveTo(0, -len)
      ..lineTo(w, 0)
      ..lineTo(-w, 0)
      ..close();
    final south = Path()
      ..moveTo(0, len)
      ..lineTo(w, 0)
      ..lineTo(-w, 0)
      ..close();
    canvas.drawPath(north, Paint()..color = accent);
    canvas.drawPath(south, Paint()..color = accent.withValues(alpha: 0.45));
    canvas.restore();
  }

  @override
  bool shouldRepaint(LogoPainter old) =>
      old.accent != accent || old.tile != tile || old.needleRotation != needleRotation;
}
