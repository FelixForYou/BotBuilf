// Tangkapan layar UI dengan data NYATA dari backend yang sedang berjalan (alat bantu
// pengembangan, dilewati secara default). Jalankan:
//
//   flutter test test/screenshots --update-goldens \
//     --dart-define=FXB_SHOTS=true --dart-define=FXB_BASE_URL=http://localhost:3000
//
// Hasil PNG ada di test/screenshots/shots/ (diabaikan git).
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fxb_restapi/main.dart';
import 'package:fxb_restapi/screens/dashboard/keys_screen.dart';
import 'package:fxb_restapi/screens/docs/endpoint_detail_screen.dart';
import 'package:fxb_restapi/screens/explorer/runner_screen.dart';
import 'package:fxb_restapi/screens/admin/admin_screen.dart';
import 'package:fxb_restapi/screens/onboarding_screen.dart';
import 'package:fxb_restapi/state/app_state.dart';
import 'package:fxb_restapi/widgets/feedback.dart';
import 'package:fxb_restapi/widgets/page.dart';
import 'package:shared_preferences/shared_preferences.dart';

const shots = bool.fromEnvironment('FXB_SHOTS');

Future<void> _font(String family, List<String> files) async {
  final l = FontLoader(family);
  for (final f in files) {
    l.addFont(Future.value(ByteData.sublistView(File(f).readAsBytesSync())));
  }
  await l.load();
}

String _pub(String pkg) => Directory('${Platform.environment['HOME']}/.pub-cache/hosted/pub.dev').listSync().firstWhere((d) => d.path.contains('/$pkg-')).path;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;

  setUpAll(() async {
    if (!shots) return;
    await _font('Inter', [
      for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) 'assets/fonts/Inter-$w.ttf',
    ]);
    await _font('JetBrainsMono', ['assets/fonts/JetBrainsMono-Regular.ttf', 'assets/fonts/JetBrainsMono-Bold.ttf']);
    await _font('packages/cupertino_icons/CupertinoIcons', ['${_pub('cupertino_icons')}/assets/CupertinoIcons.ttf']);
    final sdk = Platform.environment['FLUTTER_ROOT'] ?? '/root/sdk/flutter';
    await _font('MaterialIcons', ['$sdk/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf']);
  });

  testWidgets('screens', skip: !shots, (tester) async {
    tester.view.physicalSize = const Size(720, 1600); // Vivo Y17s
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.reset);
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({'onboarded': true});

    final state = AppState();
    await tester.runAsync(state.init);

    Future<void> settle([int ms = 1200]) async {
      for (var i = 0; i < 6; i++) {
        await tester.runAsync(() => Future<void>.delayed(Duration(milliseconds: ms ~/ 6)));
        await tester.pump(const Duration(milliseconds: 200));
      }
      await tester.pump(const Duration(seconds: 1));
    }

    Future<void> shot(String name) async {
      await expectLater(find.byType(FxbApp), matchesGoldenFile('shots/$name.png'));
    }

    // Akun demo: user pertama pada DB kosong menjadi admin (aturan backend).
    await tester.runAsync(() async {
      try {
        await state.register('Felix Demo', 'demo@felixiority.test', 'demo-password-1');
      } catch (_) {
        await state.login('demo@felixiority.test', 'demo-password-1');
      }
      await state.api.gateway(method: 'GET', path: '/api/v1/tools/uuid', params: {});
      await state.api.gateway(method: 'POST', path: '/api/v1/tools/hash', params: {'text': 'felix'});
      await state.api.gateway(method: 'POST', path: '/api/v1/tools/hash', params: {});
    });
    await tester.runAsync(() => state.logout());

    await tester.pumpWidget(FxbApp(state: state));
    await settle(2500);
    await shot('01_home');

    await tester.tap(find.text('Docs').last);
    await settle();
    await shot('02_docs');

    final nav = rootNavigatorKey.currentState!;
    final cat = state.catalog.value!;
    nav.push(FxRoute(builder: (_) => EndpointDetailScreen(endpoint: cat.byId('tools/hash')!)));
    await settle();
    await shot('03_endpoint_detail');
    nav.pop();
    await settle();

    await tester.tap(find.text('Akun').last);
    await settle();
    await shot('04_login');

    await tester.runAsync(() => state.login('demo@felixiority.test', 'demo-password-1'));
    await settle(2500);
    await shot('05_dashboard');

    nav.push(FxRoute(builder: (_) => const KeysScreen()));
    await settle(2000);
    await shot('06_keys');
    nav.pop();
    await settle();

    nav.push(FxRoute(builder: (_) => RunnerScreen(endpoint: cat.byId('tools/hash')!)));
    await settle();
    await tester.tap(find.text('Kirim request'));
    await settle(2500);
    await tester.drag(find.byType(CustomScrollView).last, const Offset(0, -520));
    await settle();
    await shot('07_runner_success');
    nav.pop();
    await settle();

    nav.push(
      FxRoute(
        builder: (_) => RunnerScreen(endpoint: cat.byId('video/status')!, initial: const {'taskId': 'task-tidak-ada'}),
      ),
    );
    await settle();
    await tester.tap(find.text('Kirim request'));
    await settle(2500);
    await tester.drag(find.byType(CustomScrollView).last, const Offset(0, -380));
    await settle();
    await shot('08_runner_error');
    nav.pop();
    await settle();

    nav.push(FxRoute(builder: (_) => const AdminScreen()));
    await settle(2500);
    await shot('09_admin');
    nav.pop();
    await settle();

    await tester.tap(find.text('Menu').last);
    await settle();
    await shot('10_menu');

    state.setTheme(ThemeMode.light);
    await tester.tap(find.text('Beranda').last);
    await settle();
    await shot('11_home_light');
    state.setTheme(ThemeMode.dark);

    nav.push(FxRoute(builder: (_) => const OnboardingScreen(replay: true)));
    await settle();
    await shot('12_onboarding');
    nav.pop();
    await settle();
  });
}
