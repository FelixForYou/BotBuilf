import 'package:flutter/material.dart';

/// Inter set with SF Pro–like metrics: tight tracking on large sizes,
/// comfortable line height on body copy.
abstract final class AppTypography {
  static const family = 'Inter';

  static TextTheme textTheme(Color primary, Color secondary) {
    TextStyle s(double size, FontWeight w, {double height = 1.3, double ls = 0, Color? c}) =>
        TextStyle(
          fontFamily: family,
          fontSize: size,
          fontWeight: w,
          height: height,
          letterSpacing: ls,
          color: c ?? primary,
        );

    return TextTheme(
      // Large screen titles ("Menu", "Settings").
      displaySmall: s(30, FontWeight.w700, height: 1.15, ls: -0.6),
      // Hero headings (onboarding, status pages).
      headlineMedium: s(26, FontWeight.w700, height: 1.2, ls: -0.5),
      headlineSmall: s(22, FontWeight.w700, height: 1.25, ls: -0.4),
      // Section headings.
      titleLarge: s(20, FontWeight.w600, height: 1.3, ls: -0.3),
      titleMedium: s(17, FontWeight.w600, height: 1.3, ls: -0.2),
      titleSmall: s(15, FontWeight.w600, height: 1.3, ls: -0.1),
      bodyLarge: s(16, FontWeight.w400, height: 1.45, ls: -0.1),
      bodyMedium: s(15, FontWeight.w400, height: 1.45, ls: -0.1),
      bodySmall: s(14, FontWeight.w400, height: 1.4, c: secondary),
      // Buttons.
      labelLarge: s(16, FontWeight.w600, height: 1.2, ls: -0.1),
      // Captions.
      labelMedium: s(13, FontWeight.w500, height: 1.3, c: secondary),
      // Uppercase section labels.
      labelSmall: s(12, FontWeight.w500, height: 1.3, ls: 0.6, c: secondary),
    );
  }
}
