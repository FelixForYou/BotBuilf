import 'package:flutter/material.dart';

import '../models/models.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';

/// Grafik batang bertumpuk sukses/error per hari (components/charts.tsx).
class SeriesChart extends StatelessWidget {
  const SeriesChart({super.key, required this.series, this.height = 150});
  final List<SeriesPoint> series;
  final double height;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final max = series.fold<int>(1, (m, p) => (p.success + p.error) > m ? p.success + p.error : m);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: height,
          child: RepaintBoundary(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: Motion.of(context, 700),
              curve: Curves.easeOutCubic,
              builder: (context, t, _) => CustomPaint(painter: _BarsPainter(series, max, t, fx)),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(series.isEmpty ? '' : _short(series.first.date), style: TextStyle(fontSize: 12, color: fx.muted)),
            const Spacer(),
            _Legend(color: fx.mint, label: 'Sukses'),
            const SizedBox(width: 12),
            _Legend(color: fx.danger, label: 'Error'),
            const Spacer(),
            Text(series.isEmpty ? '' : _short(series.last.date), style: TextStyle(fontSize: 12, color: fx.muted)),
          ],
        ),
      ],
    );
  }

  static String _short(String d) => d.length >= 10 ? '${d.substring(8, 10)}/${d.substring(5, 7)}' : d;
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 5),
      Text(label, style: TextStyle(fontSize: 12, color: Fx.of(context).muted)),
    ],
  );
}

class _BarsPainter extends CustomPainter {
  _BarsPainter(this.series, this.max, this.t, this.fx);
  final List<SeriesPoint> series;
  final int max;
  final double t;
  final Fx fx;

  @override
  void paint(Canvas canvas, Size size) {
    if (series.isEmpty) return;
    final n = series.length;
    final gap = n > 30 ? 2.0 : 5.0;
    final w = (size.width - gap * (n - 1)) / n;
    final ok = Paint()..color = fx.mint;
    final err = Paint()..color = fx.danger;
    final empty = Paint()..color = fx.card3;
    for (var i = 0; i < n; i++) {
      final p = series[i];
      final x = i * (w + gap);
      final total = p.success + p.error;
      if (total == 0) {
        canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x, size.height - 4, w, 4), const Radius.circular(2)), empty);
        continue;
      }
      final h = (total / max) * size.height * t;
      final he = (p.error / total) * h;
      final r = Radius.circular(w.clamp(0, 6) / 2);
      canvas.drawRRect(RRect.fromRectAndCorners(Rect.fromLTWH(x, size.height - h, w, h - he), topLeft: r, topRight: r), ok);
      if (he > 0) {
        canvas.drawRRect(RRect.fromRectAndCorners(Rect.fromLTWH(x, size.height - he, w, he), bottomLeft: r, bottomRight: r), err);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _BarsPainter old) => old.t != t || old.series != series || old.fx != fx;
}
