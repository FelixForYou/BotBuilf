import 'package:flutter/animation.dart';

/// Shared timing so every surface moves with the same character.
abstract final class Motion {
  static const press = Duration(milliseconds: 120);
  static const quick = Duration(milliseconds: 180);
  static const screen = Duration(milliseconds: 320);
  static const drawer = Duration(milliseconds: 360);
  static const sheet = Duration(milliseconds: 400);
  static const modal = Duration(milliseconds: 260);

  /// Close to UIKit's default ease-out: fast start, long soft landing.
  static const Curve emphasized = Cubic(0.2, 0.9, 0.25, 1.0);
  static const Curve standard = Cubic(0.25, 0.1, 0.25, 1.0);
  static const Curve exit = Cubic(0.4, 0.0, 1.0, 1.0);

  /// Critically damped-ish spring used for drags that settle into place.
  static const SpringDescription spring = SpringDescription(
    mass: 1,
    stiffness: 420,
    damping: 38,
  );
}
