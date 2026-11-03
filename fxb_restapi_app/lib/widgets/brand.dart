import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Maskot FxB: wajah "‹ ‿ ›" dalam tudung mint (sama dengan components/brand.tsx).
const mascotSvg = '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ef0d6"/><stop offset="1" stop-color="#2fbf9f"/></linearGradient></defs>
<path d="M32 3C17 3 7 15 7 30c0 9 3 16 8 22 3 4 9 7 17 7s14-3 17-7c5-6 8-13 8-22C57 15 47 3 32 3Z" fill="url(#g)"/>
<path d="M32 15c-9.5 0-16 7-16 16 0 8.5 6.5 15 16 15s16-6.5 16-15c0-9-6.5-16-16-16Z" fill="#0b1f1b"/>
<path d="M24 27l-4 4 4 4M40 27l4 4-4 4" stroke="#e8fff9" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M28 36c2.4 2 5.6 2 8 0" stroke="#e8fff9" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>''';

class Mascot extends StatelessWidget {
  const Mascot({super.key, this.size = 64});
  final double size;
  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: SvgPicture.string(mascotSvg, width: size, height: size, excludeFromSemantics: true),
  );
}

/// Smiley tombol bantuan (components/brand.tsx → Smiley).
class Smiley extends StatelessWidget {
  const Smiley({super.key, this.size = 28, required this.color});
  final double size;
  final Color color;
  @override
  Widget build(BuildContext context) => CustomPaint(size: Size.square(size), painter: _SmileyPainter(color));
}

class _SmileyPainter extends CustomPainter {
  _SmileyPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 32;
    canvas.scale(s);
    final fill = Paint()..color = color;
    canvas.drawCircle(const Offset(11, 11), 1.6, fill);
    canvas.drawCircle(const Offset(21, 11), 1.6, fill);
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.6
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(6, 17)
      ..cubicTo(6, 18, 7, 21, 9, 21)
      ..moveTo(26, 17)
      ..cubicTo(26, 18, 25, 21, 23, 21)
      ..moveTo(10, 22)
      ..cubicTo(13.5, 24.6, 18.5, 24.6, 22, 22);
    canvas.drawPath(path, p);
  }

  @override
  bool shouldRepaint(covariant _SmileyPainter old) => old.color != color;
}
