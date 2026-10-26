import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../router.dart';
import '../../state/settings_provider.dart';
import '../../widgets/mint_button.dart';

class _Page {
  const _Page(this.icon, this.lead, this.accent, this.tail, this.body);
  final IconData icon;
  final String lead;
  final String accent;
  final String tail;
  final String body;
}

const _pages = [
  _Page(
    LucideIcons.compass,
    'Fast',
    'by',
    'design',
    'Pages open in a lean native WebView, and the toolbar steps aside while you read.',
  ),
  _Page(
    LucideIcons.venetianMask,
    'Private',
    'when',
    'needed',
    'Private tabs keep their own cookies and leave no history once you close them.',
  ),
  _Page(
    LucideIcons.pictureInPicture2,
    'Float',
    'any',
    'page',
    'Pop a page into a small window that stays on top while you use other apps.',
  ),
  _Page(
    LucideIcons.shieldCheck,
    'Yours',
    'to',
    'shape',
    'Choose your search engine, theme and text size. Everything stays on this device.',
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key, this.replay = false});

  /// Opened again from Settings → Take the tour.
  final bool replay;

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  double _page = 0;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() => _page = _controller.page ?? 0));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  int get _index => _page.round();
  bool get _isLast => _index == _pages.length - 1;

  void _finish() {
    ref.read(settingsProvider.notifier).update((s) => s.copyWith(onboardingDone: true));
    context.go(Routes.browser);
  }

  void _next() {
    if (_isLast) return _finish();
    _controller.nextPage(duration: Motion.screen, curve: Motion.emphasized);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              children: [
                SizedBox(
                  height: 52,
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: AnimatedOpacity(
                      duration: Motion.quick,
                      opacity: _isLast ? 0 : 1,
                      child: Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: MintTextButton(
                          label: 'Skip',
                          color: c.textPrimary,
                          onPressed: _isLast ? null : _finish,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    physics: const BouncingScrollPhysics(),
                    itemCount: _pages.length,
                    itemBuilder: (context, i) => _OnboardingPage(page: _pages[i], offset: _page - i),
                  ),
                ),
                _Dots(count: _pages.length, page: _page),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
                  child: MintButton(
                    label: _isLast ? 'Get started' : 'Continue',
                    onPressed: _next,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({required this.page, required this.offset});

  final _Page page;

  /// Distance from the settled position, -1..1 while swiping.
  final double offset;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final t = offset.abs().clamp(0.0, 1.0);
    final base = context.text.headlineMedium!.copyWith(fontSize: 30, letterSpacing: -0.8);
    return LayoutBuilder(
      builder: (context, box) {
        final tile = (box.maxHeight * 0.32).clamp(96.0, 132.0);
        return SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon drifts slower than the page for a light parallax.
                  Transform.translate(
                    offset: Offset(offset * 60, 0),
                    child: Transform.scale(
                      scale: 1 - t * 0.15,
                      child: Container(
                        width: tile,
                        height: tile,
                        decoration: BoxDecoration(
                          color: c.accentTile,
                          borderRadius: BorderRadius.circular(tile * 0.28),
                        ),
                        child: Icon(page.icon, size: tile * 0.46, color: c.accent),
                      ),
                    ),
                  ),
                  SizedBox(height: tile * 0.3),
                  Opacity(
                    opacity: 1 - t * 0.8,
                    child: Column(
                      children: [
                        Text.rich(
                          TextSpan(
                            style: base,
                            children: [
                              TextSpan(text: '${page.lead} '),
                              TextSpan(
                                text: page.accent,
                                style: const TextStyle(fontStyle: FontStyle.italic),
                              ),
                              TextSpan(text: ' ${page.tail}'),
                            ],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 14),
                        Text(
                          page.body,
                          textAlign: TextAlign.center,
                          style: context.text.bodyLarge?.copyWith(color: c.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.page});

  final int count;
  final double page;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          Builder(builder: (context) {
            final t = (1 - (page - i).abs()).clamp(0.0, 1.0);
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: 8 + 18 * t,
              height: 8,
              decoration: BoxDecoration(
                color: Color.lerp(c.textSecondary.withValues(alpha: 0.4), c.accent, t),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
      ],
    );
  }
}
