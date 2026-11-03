import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../core/format.dart';
import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/brand.dart';
import '../widgets/category_icon.dart';
import '../widgets/code.dart';
import '../widgets/common.dart';
import '../widgets/feedback.dart';
import '../widgets/page.dart';
import 'auth/auth_screen.dart';
import 'dashboard/keys_screen.dart';
import 'dashboard/pricing_screen.dart';
import 'guide_screen.dart';
import 'shell.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final AppState app = App.of(context);
  PublicStats? _stats;
  PlansInfo? _plans;
  Object? _statsError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load({bool force = false}) async {
    setState(() => _statsError = null);
    await Future.wait([
      app.api
          .get('/api/stats')
          .then((d) {
            if (mounted) setState(() => _stats = PublicStats.fromJson(d as Map));
          })
          .catchError((Object e) {
            if (mounted) setState(() => _statsError = e);
          }),
      app.api
          .get('/api/plans')
          .then((d) {
            if (mounted) setState(() => _plans = PlansInfo.fromJson(d as Map));
          })
          .catchError((Object _) {}),
      app.loadCatalog(force: force).then((_) {}).catchError((Object _) {}),
    ]);
  }

  void _createKey() {
    if (app.me.value != null) {
      push(context, const KeysScreen(openCreate: true));
    } else {
      push(context, const AuthScreen(register: true));
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final go = ShellScope.of(context);
    return Stack(
      children: [
        FxPage(
          title: AppConfig.appName,
          largeTitle: false,
          onRefresh: () => _load(force: true),
          leading: const Padding(padding: EdgeInsets.only(left: 8), child: Mascot(size: 30)),
          actions: [
            ValueListenableBuilder<ThemeMode>(
              valueListenable: app.themeMode,
              builder: (context, m, _) => FxIconButton(
                m == ThemeMode.dark ? CupertinoIcons.sun_max : CupertinoIcons.moon,
                tooltip: 'Tampilan',
                onTap: () => app.setTheme(m == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark),
              ),
            ),
          ],
          children: [
            const SizedBox(height: 12),
            FadeIn(
              child: Row(
                children: [
                  const Mascot(size: 76),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(AppConfig.appName, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.1)),
                        Text(
                          'by ${AppConfig.brand}',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: fx.mint),
                        ),
                        Text('REST API · JSON · v${AppConfig.version}', style: TextStyle(fontSize: 14, color: fx.muted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            FadeIn(
              delay: 60,
              child: Text(
                'Satu API key untuk downloader media, AI chat & gambar, tools developer, dan hiburan — siap dipakai di bot Telegram, WhatsApp, website, dan aplikasi.',
                style: TextStyle(fontSize: 16.5, color: fx.muted, height: 1.45),
              ),
            ),
            const SizedBox(height: 22),
            FadeIn(delay: 120, child: _DashedCreate(onTap: _createKey)),
            const SizedBox(height: 14),
            ValueListenableBuilder<User?>(
              valueListenable: app.me,
              builder: (context, me, _) => Row(
                children: [
                  Expanded(
                    child: FxButton(
                      me != null ? 'Dashboard' : 'Key gratis',
                      icon: CupertinoIcons.lock_open,
                      big: true,
                      onTap: () => me != null ? go(Tabs.account) : push(context, const AuthScreen(register: true)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FxButton('Docs', icon: CupertinoIcons.book, big: true, variant: BtnVariant.secondary, onTap: () => go(Tabs.docs)),
                  ),
                ],
              ),
            ),
            const SectionLabel('Status layanan · 24 jam'),
            Swap(
              child: _stats != null
                  ? StatGrid(key: const ValueKey('s'), [
                      StatItem('${_stats!.endpoints}', 'Endpoint'),
                      StatItem(fmtNum(_stats!.requests24h), 'Request'),
                      StatItem(_stats!.successRate == null ? '—' : '${_stats!.successRate}%', 'Sukses'),
                      StatItem(_stats!.avgLatency == null ? '—' : '${_stats!.avgLatency}ms', 'Latency'),
                    ])
                  : _statsError != null
                  ? ErrorView(key: const ValueKey('e'), error: _statsError!, onRetry: _load)
                  : const Skeleton(key: ValueKey('k'), height: 70, radius: 20),
            ),
            SectionLabel(
              'Request pertama',
              trailing: LinkText('Explorer', icon: CupertinoIcons.arrow_right, onTap: () => go(Tabs.explorer)),
            ),
            CodeBlock(
              lang: 'curl',
              code:
                  'curl "${AppConfig.baseUrl}/api/v1/tools/dns?domain=google.com&apikey=YOUR_API_KEY"\n\n'
                  '# {\n#   "status": true,\n#   "creator": "${AppConfig.brand}",\n#   "result": { "domain": "google.com", "records": [...] }\n# }',
            ),
            SectionLabel(
              'Kategori API',
              trailing: LinkText(
                'Semua',
                onTap: () {
                  app.docsCategory.value = 'all';
                  go(Tabs.docs);
                },
              ),
            ),
            ValueListenableBuilder<Catalog?>(
              valueListenable: app.catalog,
              builder: (context, c, _) => Swap(
                child: c == null
                    ? const Skeleton(key: ValueKey('k'), height: 330)
                    : ListGroup(
                        key: const ValueKey('c'),
                        children: [
                          for (final cat in c.categories)
                            ListRow(
                              icon: categoryIcon(cat.id),
                              label: cat.name,
                              sub: cat.description,
                              value: '${c.countIn(cat.id)}',
                              onTap: () {
                                app.docsCategory.value = cat.id;
                                go(Tabs.docs);
                              },
                            ),
                        ],
                      ),
              ),
            ),
            const SectionLabel('Cara kerja'),
            const FxCard(
              child: Steps([
                StepData('Daftar akun', FxStep.done, sub: 'Gratis, cukup email & password'),
                StepData('Buat API key', FxStep.done, sub: 'Key free langsung aktif'),
                StepData('Panggil endpoint', FxStep.done, sub: '?apikey=… / X-API-Key'),
                StepData('Upgrade premium', FxStep.active, sub: 'Aktif otomatis setelah bayar'),
              ]),
            ),
            SectionLabel('Paket', trailing: LinkText('Detail', onTap: () => push(context, const PricingScreen()))),
            Swap(
              child: _plans == null
                  ? const Skeleton(key: ValueKey('k'), height: 96)
                  : Column(
                      key: const ValueKey('p'),
                      children: [
                        _PlanTile(name: 'Free', sub: '${fmtNum(_plans!.freeDaily)} req/hari · ${_plans!.freeRpm} req/mnt', price: 'Rp0', mint: false),
                        for (final p in _plans!.plans.take(3))
                          _PlanTile(
                            name: p.name,
                            sub: '${fmtNum(p.dailyLimit)} req/hari · ${p.durationDays} hari',
                            price: fmtIDR(p.price),
                            mint: true,
                            onTap: () => push(context, const PricingScreen()),
                          ),
                      ],
                    ),
            ),
            const SizedBox(height: 18),
            FxCard(
              child: Column(
                children: [
                  Icon(CupertinoIcons.chevron_left_slash_chevron_right, color: fx.mint, size: 32),
                  const SizedBox(height: 10),
                  const Text('Siap membangun?', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Text(
                    'Semua endpoint punya dokumentasi lengkap, contoh kode, dan tombol Try API.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: fx.muted, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 14,
                    runSpacing: 6,
                    children: [
                      for (final x in const ['OpenAPI 3.1', 'Rate limit header', 'CORS', 'JSON envelope'])
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_rounded, size: 16, color: fx.mint),
                            const SizedBox(width: 4),
                            Text(x, style: TextStyle(color: fx.muted, fontSize: 13.5)),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  FxButton('Buka dokumentasi', big: true, expand: true, onTap: () => go(Tabs.docs)),
                ],
              ),
            ),
            const SizedBox(height: 26),
            Center(
              child: Text(
                '© ${DateTime.now().year} ${AppConfig.appName} · Developed by ${AppConfig.brand}',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: fx.subtle),
              ),
            ),
          ],
        ),
        Positioned(
          right: 18,
          bottom: NavInset.of(context) + 10,
          child: _HelpButton(onTap: () => showHelpSheet(context)),
        ),
      ],
    );
  }
}

class _DashedCreate extends StatelessWidget {
  const _DashedCreate({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Pressable(
      onTap: onTap,
      haptic: true,
      scale: 0.98,
      child: CustomPaint(
        painter: _DashPainter(fx.line),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
          decoration: BoxDecoration(color: fx.card.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(30)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(color: fx.mintSoft, shape: BoxShape.circle),
                child: Icon(Icons.add_rounded, size: 30, color: fx.mint),
              ),
              const SizedBox(width: 16),
              Flexible(
                child: Text(
                  'Buat API key',
                  style: TextStyle(fontSize: 23, fontWeight: FontWeight.w600, color: fx.muted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashPainter extends CustomPainter {
  _DashPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final rr = RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(30)).deflate(1);
    final path = Path()..addRRect(rr);
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (final m in path.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        canvas.drawPath(m.extractPath(d, d + 9), p);
        d += 15;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashPainter old) => old.color != color;
}

class _PlanTile extends StatelessWidget {
  const _PlanTile({required this.name, required this.sub, required this.price, required this.mint, this.onTap});
  final String name;
  final String sub;
  final String price;
  final bool mint;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: FxCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  Text(sub, style: TextStyle(color: fx.muted, fontSize: 13.5)),
                ],
              ),
            ),
            Pill(price, tone: mint ? Tone.mint : Tone.neutral),
          ],
        ),
      ),
    );
  }
}

class _HelpButton extends StatelessWidget {
  const _HelpButton({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Semantics(
      button: true,
      label: 'Bantuan',
      child: Pressable(
        onTap: onTap,
        scale: 0.9,
        haptic: true,
        child: Glass(
          radius: BorderRadius.circular(30),
          border: true,
          sigma: 12,
          child: SizedBox(
            width: 58,
            height: 58,
            child: Center(child: Smiley(size: 30, color: fx.mint)),
          ),
        ),
      ),
    );
  }
}

void showHelpSheet(BuildContext context) {
  showFxSheet<void>(
    context,
    title: 'Butuh bantuan?',
    subtitle: 'Pilih yang paling sesuai.',
    builder: (ctx) => ListGroup(
      children: [
        ListRow(
          icon: CupertinoIcons.rocket,
          label: 'Mulai cepat',
          sub: 'Buat key & request pertama',
          onTap: () {
            Navigator.pop(ctx);
            push(context, const GuideScreen(section: 'how'));
          },
        ),
        ListRow(
          icon: CupertinoIcons.book,
          label: 'Dokumentasi API',
          onTap: () {
            Navigator.pop(ctx);
            ShellScope.of(context)(Tabs.docs);
          },
        ),
        ListRow(
          icon: CupertinoIcons.bolt,
          label: 'Error & limit',
          sub: '401, 403, 429, 503',
          onTap: () {
            Navigator.pop(ctx);
            push(context, const GuideScreen(section: 'tips'));
          },
        ),
        ListRow(
          icon: CupertinoIcons.doc_text,
          label: 'OpenAPI JSON',
          sub: '/api/openapi.json',
          onTap: () {
            Navigator.pop(ctx);
            copyText('${AppConfig.baseUrl}/api/openapi.json', done: 'URL OpenAPI disalin.');
          },
        ),
      ],
    ),
  );
}
