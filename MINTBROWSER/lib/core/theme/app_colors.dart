import 'package:flutter/material.dart';

/// Raw palette. Dark values follow the design system exactly; light values
/// are tuned counterparts that keep the same hierarchy.
abstract final class Palette {
  static const background = Color(0xFF101010);
  static const card = Color(0xFF1D1D1F);
  static const elevated = Color(0xFF262628);
  static const accent = Color(0xFF55DDC0);
  static const accentPressed = Color(0xFF38BFA3);
  static const textPrimary = Color(0xFFF5F5F7);
  static const textSecondary = Color(0xFF96969B);
  static const divider = Color(0xFF303033);
  static const error = Color(0xFFF05252);
  static const warning = Color(0xFFF5AC45);

  /// Deep mint tile used behind large icons (onboarding, empty states).
  static const accentTileDark = Color(0xFF173B33);

  static const lightBackground = Color(0xFFF5F5F7);
  static const lightCard = Color(0xFFFFFFFF);
  static const lightElevated = Color(0xFFEDEDF0);
  static const lightTextPrimary = Color(0xFF101010);
  static const lightTextSecondary = Color(0xFF6E6E73);
  static const lightDivider = Color(0xFFE2E2E6);
  static const lightAccentInk = Color(0xFF16977D);
  static const accentTileLight = Color(0xFFD9F6EF);
}

/// Semantic colors resolved for the current brightness.
@immutable
class MintColors extends ThemeExtension<MintColors> {
  const MintColors({
    required this.background,
    required this.card,
    required this.elevated,
    required this.accent,
    required this.accentPressed,
    required this.accentInk,
    required this.onAccent,
    required this.accentTile,
    required this.textPrimary,
    required this.textSecondary,
    required this.divider,
    required this.error,
    required this.errorTile,
    required this.warning,
    required this.scrim,
  });

  final Color background;
  final Color card;
  final Color elevated;

  /// Fill color for primary buttons, toggles and indicators.
  final Color accent;
  final Color accentPressed;

  /// Accent used for text and line icons (readable on [background]).
  final Color accentInk;
  final Color onAccent;
  final Color accentTile;
  final Color textPrimary;
  final Color textSecondary;
  final Color divider;
  final Color error;
  final Color errorTile;
  final Color warning;
  final Color scrim;

  static const dark = MintColors(
    background: Palette.background,
    card: Palette.card,
    elevated: Palette.elevated,
    accent: Palette.accent,
    accentPressed: Palette.accentPressed,
    accentInk: Palette.accent,
    onAccent: Color(0xFF0B2620),
    accentTile: Palette.accentTileDark,
    textPrimary: Palette.textPrimary,
    textSecondary: Palette.textSecondary,
    divider: Palette.divider,
    error: Palette.error,
    errorTile: Color(0xFF3A1D1D),
    warning: Palette.warning,
    scrim: Color(0x99000000),
  );

  static const light = MintColors(
    background: Palette.lightBackground,
    card: Palette.lightCard,
    elevated: Palette.lightElevated,
    accent: Palette.accent,
    accentPressed: Palette.accentPressed,
    accentInk: Palette.lightAccentInk,
    onAccent: Color(0xFF0B2620),
    accentTile: Palette.accentTileLight,
    textPrimary: Palette.lightTextPrimary,
    textSecondary: Palette.lightTextSecondary,
    divider: Palette.lightDivider,
    error: Color(0xFFD93A3A),
    errorTile: Color(0xFFFBE3E3),
    warning: Color(0xFFD98A1F),
    scrim: Color(0x66000000),
  );

  @override
  MintColors copyWith() => this;

  @override
  MintColors lerp(ThemeExtension<MintColors>? other, double t) {
    if (other is! MintColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return MintColors(
      background: l(background, other.background),
      card: l(card, other.card),
      elevated: l(elevated, other.elevated),
      accent: l(accent, other.accent),
      accentPressed: l(accentPressed, other.accentPressed),
      accentInk: l(accentInk, other.accentInk),
      onAccent: l(onAccent, other.onAccent),
      accentTile: l(accentTile, other.accentTile),
      textPrimary: l(textPrimary, other.textPrimary),
      textSecondary: l(textSecondary, other.textSecondary),
      divider: l(divider, other.divider),
      error: l(error, other.error),
      errorTile: l(errorTile, other.errorTile),
      warning: l(warning, other.warning),
      scrim: l(scrim, other.scrim),
    );
  }
}

extension MintThemeX on BuildContext {
  MintColors get mint => Theme.of(this).extension<MintColors>()!;
  TextTheme get text => Theme.of(this).textTheme;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}
