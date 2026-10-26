import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../motion/motion.dart';
import 'app_colors.dart';
import 'app_typography.dart';

abstract final class AppTheme {
  static ThemeData dark() => _build(MintColors.dark, Brightness.dark);
  static ThemeData light() => _build(MintColors.light, Brightness.light);

  static ThemeData _build(MintColors c, Brightness b) {
    final text = AppTypography.textTheme(c.textPrimary, c.textSecondary);
    final scheme = ColorScheme(
      brightness: b,
      primary: c.accent,
      onPrimary: c.onAccent,
      secondary: c.accentInk,
      onSecondary: c.onAccent,
      error: c.error,
      onError: Colors.white,
      surface: c.background,
      onSurface: c.textPrimary,
      surfaceContainerLowest: c.background,
      surfaceContainerLow: c.card,
      surfaceContainer: c.card,
      surfaceContainerHigh: c.elevated,
      surfaceContainerHighest: c.elevated,
      onSurfaceVariant: c.textSecondary,
      outline: c.divider,
      outlineVariant: c.divider,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: b,
      colorScheme: scheme,
      fontFamily: AppTypography.family,
      textTheme: text,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      dividerColor: c.divider,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      splashColor: Colors.transparent,
      hoverColor: Colors.transparent,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      extensions: [c],
      iconTheme: IconThemeData(color: c.textPrimary, size: 22),
      dividerTheme: DividerThemeData(color: c.divider, thickness: 0.6, space: 0.6),
      appBarTheme: AppBarTheme(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: text.titleMedium,
        iconTheme: IconThemeData(color: c.textPrimary, size: 22),
        systemOverlayStyle: overlayStyle(b, c.background),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: c.accentInk,
        selectionColor: c.accent.withValues(alpha: 0.35),
        selectionHandleColor: c.accent,
      ),
      cupertinoOverrideTheme: CupertinoThemeData(primaryColor: c.accentInk),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.accent,
        linearTrackColor: Colors.transparent,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.elevated,
        contentTextStyle: text.bodyMedium,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.card,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: c.card,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: false,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.card,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: text.titleMedium,
        contentTextStyle: text.bodyMedium?.copyWith(color: c.textSecondary),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {TargetPlatform.android: MintPageTransitionsBuilder()},
      ),
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStatePropertyAll(c.textSecondary.withValues(alpha: 0.4)),
        radius: const Radius.circular(8),
        thickness: const WidgetStatePropertyAll(3),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(color: c.elevated, borderRadius: BorderRadius.circular(10)),
        textStyle: text.labelMedium?.copyWith(color: c.textPrimary),
      ),
    );
  }

  /// Light status/navigation icons on dark surfaces and vice versa;
  /// transparent bars so content can draw edge-to-edge.
  static SystemUiOverlayStyle overlayStyle(Brightness b, Color navColor) {
    final dark = b == Brightness.dark;
    return SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      statusBarBrightness: b,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
      systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      systemNavigationBarContrastEnforced: false,
    );
  }
}

/// iOS-like horizontal slide with a parallax on the outgoing page.
class MintPageTransitionsBuilder extends PageTransitionsBuilder {
  const MintPageTransitionsBuilder();

  @override
  Duration get transitionDuration => Motion.screen;

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return MintSlideTransition(
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
    );
  }
}

class MintSlideTransition extends StatelessWidget {
  const MintSlideTransition({
    super.key,
    required this.animation,
    required this.secondaryAnimation,
    required this.child,
  });

  final Animation<double> animation;
  final Animation<double> secondaryAnimation;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final inCurve = CurvedAnimation(
      parent: animation,
      curve: Motion.emphasized,
      reverseCurve: Motion.emphasized.flipped,
    );
    final outCurve = CurvedAnimation(parent: secondaryAnimation, curve: Motion.emphasized);
    return SlideTransition(
      position: Tween(begin: Offset.zero, end: const Offset(-0.28, 0)).animate(outCurve),
      child: SlideTransition(
        position: Tween(begin: const Offset(1, 0), end: Offset.zero).animate(inCurve),
        child: DecoratedBox(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 18,
                offset: const Offset(-4, 0),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
