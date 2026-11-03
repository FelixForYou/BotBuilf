import 'dart:math' as math;

import 'package:flutter/physics.dart';
import 'package:flutter/widgets.dart';

/// Kurva pegas (spring) natural ala iOS, dihitung dari SpringSimulation.
class SpringCurve extends Curve {
  const SpringCurve({this.damping = 0.82, this.stiffness = 180});

  final double damping;
  final double stiffness;

  @override
  double transformInternal(double t) {
    final desc = SpringDescription.withDampingRatio(mass: 1, stiffness: stiffness, ratio: damping);
    final sim = SpringSimulation(desc, 0, 1, 0);
    // Normalisasi: simulasi dianggap selesai di ~ 4/(ζω) detik.
    final settle = 4.6 / (damping * math.sqrt(stiffness));
    return sim.x(t * settle);
  }
}

class Springs {
  /// Gerak utama: sedikit overshoot, cepat diam.
  static const smooth = SpringCurve(damping: 0.86, stiffness: 200);

  /// Untuk elemen kecil (indikator tab, thumb segmented).
  static const snappy = SpringCurve(damping: 0.78, stiffness: 260);

  /// Untuk tekan tombol.
  static const press = SpringCurve(damping: 0.7, stiffness: 320);
}

/// Hormati pengaturan "Hapus animasi" / reduce motion pada perangkat.
class Motion {
  static bool reduced(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  static Duration of(BuildContext context, int ms) => reduced(context) ? Duration.zero : Duration(milliseconds: ms);
}
