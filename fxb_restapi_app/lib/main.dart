import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'config/app_config.dart';
import 'screens/onboarding_screen.dart';
import 'screens/shell.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';
import 'widgets/feedback.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent, systemNavigationBarColor: Colors.transparent, systemNavigationBarContrastEnforced: false),
  );
  final state = AppState();
  await state.init();
  runApp(FxbApp(state: state));
}

class FxbApp extends StatelessWidget {
  const FxbApp({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return App(
      state: state,
      child: ValueListenableBuilder<ThemeMode>(
        valueListenable: state.themeMode,
        builder: (context, mode, _) => MaterialApp(
          title: AppConfig.appName,
          debugShowCheckedModeBanner: false,
          navigatorKey: rootNavigatorKey,
          themeMode: mode,
          theme: buildTheme(Fx.lightTokens),
          darkTheme: buildTheme(Fx.darkTokens),
          themeAnimationDuration: const Duration(milliseconds: 250),
          builder: (context, child) {
            // Batasi skala teks agar tata letak tetap rapi pada font sistem besar.
            final mq = MediaQuery.of(context);
            return MediaQuery(
              data: mq.copyWith(textScaler: mq.textScaler.clamp(minScaleFactor: 0.85, maxScaleFactor: 1.25)),
              child: child!,
            );
          },
          home: state.onboarded ? const Shell() : const OnboardingScreen(),
        ),
      ),
    );
  }
}
