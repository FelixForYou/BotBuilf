import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';
import '../widgets/common.dart';
import '../widgets/page.dart';
import 'shell.dart';

/// Tur pengenalan (teks dari components/shell.tsx website).
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, this.replay = false});
  final bool replay;
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pc = PageController();
  int _i = 0;

  static const _slides = [
    (
      CupertinoIcons.lock_shield,
      'Satu key, ',
      'semua API',
      'Buat API key gratis dalam hitungan detik, lalu panggil downloader, AI, tools, dan hiburan dari bot atau aplikasimu.',
    ),
    (
      CupertinoIcons.checkmark_shield,
      'Kami cek ',
      'duluan',
      'Setiap request divalidasi: parameter, limit, dan izin key — jadi errornya jelas dan kuotamu tidak terbuang.',
    ),
    (
      CupertinoIcons.chevron_left_slash_chevron_right,
      'Coba ',
      'langsung',
      'Dokumentasi interaktif: lihat parameter, salin contoh, dan tekan Try API untuk melihat respons nyata.',
    ),
    (CupertinoIcons.sparkles, 'Naik ke ', 'Premium', 'Limit lebih besar, endpoint premium, dan aktivasi otomatis setelah pembayaran terverifikasi.'),
  ];

  void _done() {
    App.of(context).markOnboarded();
    if (widget.replay) {
      Navigator.of(context).pop();
    } else {
      Navigator.of(context).pushReplacement(FxRoute(builder: (_) => const Shell()));
    }
  }

  void _next() {
    if (_i >= _slides.length - 1) return _done();
    _pc.nextPage(duration: Motion.of(context, 520), curve: Springs.smooth);
  }

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 12, 0),
                child: Pressable(
                  onTap: _done,
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Text('Lewati', style: TextStyle(fontSize: 16, color: fx.muted)),
                  ),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pc,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _i = i),
                itemBuilder: (context, i) {
                  final s = _slides[i];
                  return AnimatedBuilder(
                    animation: _pc,
                    builder: (context, child) {
                      var d = 0.0;
                      if (_pc.hasClients && _pc.position.haveDimensions) d = (_pc.page ?? 0) - i;
                      final t = (1 - d.abs()).clamp(0.0, 1.0);
                      return Opacity(
                        opacity: 0.25 + 0.75 * t,
                        child: Transform.scale(scale: 0.92 + 0.08 * t, child: child),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 30),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 126,
                            height: 126,
                            decoration: BoxDecoration(color: const Color(0xFF1F5F50), borderRadius: BorderRadius.circular(34)),
                            child: Icon(s.$1, size: 64, color: fx.mint),
                          ),
                          const SizedBox(height: 30),
                          Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(text: s.$2),
                                TextSpan(
                                  text: s.$3,
                                  style: const TextStyle(fontStyle: FontStyle.italic),
                                ),
                              ],
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.4),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            s.$4,
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 16, color: fx.muted, height: 1.45),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _slides.length; i++)
                  AnimatedContainer(
                    duration: Motion.of(context, 360),
                    curve: Springs.snappy,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _i ? 26 : 8,
                    height: 8,
                    decoration: BoxDecoration(color: i == _i ? fx.mint : fx.card3, borderRadius: BorderRadius.circular(4)),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 26, 22, 18),
              child: FxButton(_i == _slides.length - 1 ? 'Mulai' : 'Lanjut', big: true, expand: true, onTap: _next),
            ),
          ],
        ),
      ),
    );
  }
}
