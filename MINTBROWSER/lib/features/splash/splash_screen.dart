import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../router.dart';
import '../../state/core_providers.dart';
import '../../state/settings_provider.dart';
import '../../state/tabs_provider.dart';
import '../../widgets/app_logo.dart';
import '../browser/web/web_engine.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();

  late final Animation<double> _scale = Tween(begin: 0.78, end: 1.0)
      .animate(CurvedAnimation(parent: _c, curve: const Interval(0, 0.75, curve: Curves.easeOutBack)));
  late final Animation<double> _fade =
      CurvedAnimation(parent: _c, curve: const Interval(0, 0.5, curve: Curves.easeOut));
  late final Animation<double> _needle =
      CurvedAnimation(parent: _c, curve: const Interval(0.2, 1, curve: Motion.emphasized));
  late final Animation<double> _title =
      CurvedAnimation(parent: _c, curve: const Interval(0.35, 0.9, curve: Motion.emphasized));

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    // Warm up the web layer and check for a link this app was opened with.
    ref.read(webEngineProvider);
    String? launchUrl;
    try {
      launchUrl = await ref.read(nativeBridgeProvider).initialUrl();
    } catch (_) {}
    if (launchUrl != null && launchUrl.isNotEmpty) {
      ref.read(tabsProvider.notifier).newTab(url: launchUrl);
    }
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    final done = ref.read(settingsProvider).onboardingDone;
    context.go(done || launchUrl != null ? Routes.browser : Routes.onboarding);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Scaffold(
      backgroundColor: context.isDark ? Colors.black : c.background,
      body: Center(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Opacity(
                opacity: _fade.value,
                child: Transform.scale(
                  scale: _scale.value,
                  child: SizedBox.square(
                    dimension: 112,
                    child: CustomPaint(
                      painter: LogoPainter(
                        accent: c.accent,
                        tile: c.accentTile,
                        needleRotation: -0.9 * (1 - _needle.value),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Opacity(
                opacity: _title.value,
                child: Transform.translate(
                  offset: Offset(0, 10 * (1 - _title.value)),
                  child: Text('Mint Browser', style: context.text.headlineSmall),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
