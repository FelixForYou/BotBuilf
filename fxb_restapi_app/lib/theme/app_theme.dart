import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Token warna diambil langsung dari app/globals.css website (hitam + mint).
@immutable
class Fx extends ThemeExtension<Fx> {
  const Fx({
    required this.bg,
    required this.bar,
    required this.card,
    required this.card2,
    required this.card3,
    required this.line,
    required this.fg,
    required this.muted,
    required this.subtle,
    required this.mint,
    required this.mintStrong,
    required this.mintInk,
    required this.mintSoft,
    required this.mintDim,
    required this.danger,
    required this.dangerInk,
    required this.dangerSoft,
    required this.warn,
    required this.warnSoft,
    required this.dark,
  });

  final Color bg, bar, card, card2, card3, line, fg, muted, subtle;
  final Color mint, mintStrong, mintInk, mintSoft, mintDim;
  final Color danger, dangerInk, dangerSoft, warn, warnSoft;
  final bool dark;

  static const darkTokens = Fx(
    bg: Color(0xFF0E0E0F),
    bar: Color(0xDB0E0E0F),
    card: Color(0xFF1C1C1E),
    card2: Color(0xFF262628),
    card3: Color(0xFF2E2E31),
    line: Color(0xFF2C2C2F),
    fg: Color(0xFFF4F4F5),
    muted: Color(0xFFA1A1AA),
    subtle: Color(0xFF6B6B73),
    mint: Color(0xFF5EE0C4),
    mintStrong: Color(0xFF4FD1B2),
    mintInk: Color(0xFF0A2E26),
    mintSoft: Color(0x245EE0C4),
    mintDim: Color(0xFF3B7A69),
    danger: Color(0xFFEF4444),
    dangerInk: Color(0xFFFCA5A5),
    dangerSoft: Color(0x29EF4444),
    warn: Color(0xFFF5B33D),
    warnSoft: Color(0x24F5B33D),
    dark: true,
  );

  static const lightTokens = Fx(
    bg: Color(0xFFF4F5F6),
    bar: Color(0xDBF4F5F6),
    card: Color(0xFFFFFFFF),
    card2: Color(0xFFEEF0F2),
    card3: Color(0xFFE4E7EA),
    line: Color(0xFFE2E5E8),
    fg: Color(0xFF111113),
    muted: Color(0xFF55555E),
    subtle: Color(0xFF8A8A94),
    mint: Color(0xFF2FC8A6),
    mintStrong: Color(0xFF22B394),
    mintInk: Color(0xFF052A22),
    mintSoft: Color(0x242FC8A6),
    mintDim: Color(0xFF9FD9CB),
    danger: Color(0xFFDC2626),
    dangerInk: Color(0xFFB91C1C),
    dangerSoft: Color(0x1ADC2626),
    warn: Color(0xFFD97706),
    warnSoft: Color(0x1FD97706),
    dark: false,
  );

  static Fx of(BuildContext context) => Theme.of(context).extension<Fx>()!;

  @override
  Fx copyWith() => this;

  @override
  Fx lerp(ThemeExtension<Fx>? other, double t) => (other is Fx && t > 0.5) ? other : this;
}

const kMono = 'JetBrainsMono';

/// Radius konsisten (mengikuti rounded-[22px]/[26px]/[18px] website).
class R {
  static const card = 22.0;
  static const big = 26.0;
  static const field = 18.0;
  static const pill = 999.0;
}

ThemeData buildTheme(Fx fx) {
  final base = fx.dark ? ThemeData.dark(useMaterial3: true) : ThemeData.light(useMaterial3: true);
  final text = base.textTheme.apply(fontFamily: 'Inter', bodyColor: fx.fg, displayColor: fx.fg);
  return base.copyWith(
    extensions: [fx],
    scaffoldBackgroundColor: fx.bg,
    canvasColor: fx.bg,
    colorScheme: (fx.dark ? const ColorScheme.dark() : const ColorScheme.light()).copyWith(
      primary: fx.mint,
      onPrimary: fx.mintInk,
      secondary: fx.mint,
      surface: fx.card,
      onSurface: fx.fg,
      error: fx.danger,
    ),
    textTheme: text,
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    splashColor: Colors.transparent,
    dividerColor: fx.line,
    textSelectionTheme: TextSelectionThemeData(cursorColor: fx.mint, selectionColor: fx.mint.withValues(alpha: 0.35), selectionHandleColor: fx.mint),
    // Transisi halaman gaya iOS (slide + parallax + swipe-back) di Android.
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {TargetPlatform.android: CupertinoPageTransitionsBuilder(), TargetPlatform.iOS: CupertinoPageTransitionsBuilder()},
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: fx.bg,
      foregroundColor: fx.fg,
      elevation: 0,
      scrolledUnderElevation: 0,
      systemOverlayStyle: fx.dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? fx.mintInk : fx.muted),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? fx.mint : fx.card3),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: fx.mint),
    datePickerTheme: DatePickerThemeData(backgroundColor: fx.card),
    dialogTheme: DialogThemeData(backgroundColor: fx.card),
  );
}
