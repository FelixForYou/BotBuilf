import 'package:flutter/cupertino.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import '../admin/admin_screen.dart';
import '../docs/endpoint_detail_screen.dart';
import '../shell.dart';
import 'keys_screen.dart';
import 'orders_screen.dart';
import 'pricing_screen.dart';
import 'settings_screen.dart';
import 'usage_screen.dart';

/// Dashboard pengguna (app/dashboard/page.tsx).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final AppState app = App.of(context);
  List<ApiKeyInfo>? _keys;
  Usage? _usage;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final r = await Future.wait([
        app.api.get('/api/keys'),
        app.api.get('/api/usage', query: {'days': '7'}),
        app.refreshMe(),
      ]);
      if (!mounted) return;
      setState(() {
        _keys = (r[0] as List).whereType<Map>().map(ApiKeyInfo.new).toList();
        _usage = Usage.fromJson(r[1] as Map);
      });
    } catch (e) {
      if (!mounted) return;
      if (_keys == null) {
        setState(() => _error = e);
      } else {
        toastError(e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final go = ShellScope.of(context);
    return ValueListenableBuilder<User?>(
      valueListenable: app.me,
      builder: (context, me, _) {
        if (me == null) return const SizedBox.shrink();
        final q = me.quota;
        final active = _keys?.where((k) => k.active).toList() ?? const <ApiKeyInfo>[];
        final now = DateTime.now().millisecondsSinceEpoch;
        final expiring = active.where((k) => k.premium && k.expiresAt != null && k.expiresAt! - now < 5 * 86400000).toList();
        final expired = active.where((k) => k.premiumExpired).toList();
        return FxPage(
          title: 'Halo, ${me.firstName} 👋',
          subtitle: me.email,
          onRefresh: _load,
          actions: [FxIconButton(CupertinoIcons.gear, tooltip: 'Pengaturan', onTap: () => push(context, const SettingsScreen()))],
          children: [
            const SizedBox(height: 14),
            FxCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'REQUEST HARI INI',
                          style: TextStyle(fontSize: 13, letterSpacing: 1, fontWeight: FontWeight.w600, color: fx.muted),
                        ),
                      ),
                      Text(
                        '${fmtNum(q?.used ?? 0)} dari ${fmtNum(q?.limit ?? 0)}',
                        style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SegmentBar(used: q?.used ?? 0, limit: q?.limit ?? 1),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              const TextSpan(text: 'Key utama: '),
                              TextSpan(
                                text: q?.keyName ?? '—',
                                style: TextStyle(color: fx.fg, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          style: TextStyle(fontSize: 13.5, color: fx.muted),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Pill(q?.tier ?? 'free', tone: q?.tier == 'premium' ? Tone.mint : Tone.neutral),
                      const SizedBox(width: 6),
                      Text('Reset ${q == null ? '00.00' : fmtTimeWib(q.reset)} WIB', style: TextStyle(fontSize: 13, color: fx.muted)),
                    ],
                  ),
                ],
              ),
            ),
            if (expiring.isNotEmpty || expired.isNotEmpty) ...[
              const SizedBox(height: 12),
              FxCard(
                color: fx.warnSoft,
                onTap: () => push(context, const PricingScreen()),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(CupertinoIcons.exclamationmark_triangle, color: fx.warn),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        expired.isNotEmpty
                            ? 'Premium pada ${expired.map((k) => k.name).join(', ')} sudah berakhir — key kembali ke limit free. Tap untuk perpanjang.'
                            : 'Premium ${expiring.first.name} berakhir ${fmtDate(expiring.first.expiresAt)}. Tap untuk perpanjang.',
                        style: const TextStyle(fontSize: 14.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SectionLabel('7 hari terakhir'),
            Swap(
              child: _usage != null
                  ? StatGrid(key: const ValueKey('u'), [
                      StatItem(fmtNum(_usage!.total), 'Request'),
                      StatItem(_usage!.total > 0 ? '${(_usage!.success / _usage!.total * 100).round()}%' : '—', 'Sukses'),
                      StatItem(_usage!.total > 0 ? '${_usage!.avgLatency}ms' : '—', 'Latency'),
                      StatItem('${active.length}', 'Key aktif'),
                    ])
                  : _error != null
                  ? ErrorView(key: const ValueKey('e'), error: _error!, onRetry: _load)
                  : const Skeleton(key: ValueKey('s'), height: 70, radius: 20),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                for (final a in [
                  (CupertinoIcons.add, 'Buat key', () => push(context, const KeysScreen(openCreate: true))),
                  (CupertinoIcons.chevron_left_slash_chevron_right, 'Explorer', () => go(Tabs.explorer)),
                  (CupertinoIcons.book, 'Docs', () => go(Tabs.docs)),
                  (CupertinoIcons.sparkles, 'Upgrade', () => push(context, const PricingScreen())),
                ])
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: FxCard(
                        onTap: a.$3,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Column(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(color: fx.mintSoft, shape: BoxShape.circle),
                              child: Icon(a.$1, color: fx.mint, size: 20),
                            ),
                            const SizedBox(height: 8),
                            Text(a.$2, maxLines: 1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SectionLabel('API key', trailing: LinkText('Kelola', onTap: () => push(context, const KeysScreen()).then((_) => _load()))),
            if (_keys == null && _error == null)
              const Skeleton(height: 110)
            else if (active.isEmpty)
              FxButton(
                'Buat API key',
                icon: CupertinoIcons.add,
                big: true,
                expand: true,
                onTap: () => push(context, const KeysScreen(openCreate: true)).then((_) => _load()),
              )
            else
              for (final k in active.take(3))
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: FxCard(
                    padding: const EdgeInsets.all(16),
                    onTap: () => push(context, const KeysScreen()).then((_) => _load()),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(color: fx.mintSoft, shape: BoxShape.circle),
                              child: Icon(CupertinoIcons.lock_shield, color: fx.mint, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    k.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    '${k.prefix}••••••••',
                                    style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                                  ),
                                ],
                              ),
                            ),
                            Pill(k.planName ?? k.effectiveTier, tone: k.premium ? Tone.mint : Tone.neutral),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ProgressBar(value: k.usedToday / (k.daily <= 0 ? 1 : k.daily) * 100),
                        const SizedBox(height: 6),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text('${fmtNum(k.usedToday)} / ${fmtNum(k.daily)} hari ini', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                        ),
                      ],
                    ),
                  ),
                ),
            SectionLabel('Request terbaru', trailing: LinkText('Detail', onTap: () => push(context, const UsageScreen()))),
            if (_usage == null && _error == null)
              const Skeleton(height: 160)
            else if (_usage != null && _usage!.recent.isEmpty)
              FxCard(
                onTap: () => go(Tabs.explorer),
                child: Text(
                  'Belum ada request. Coba di API Explorer.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: fx.muted),
                ),
              )
            else if (_usage != null)
              RecentList(items: _usage!.recent.take(8).toList()),
            const SectionLabel('Akun'),
            ListGroup(
              children: [
                ListRow(icon: CupertinoIcons.lock_shield, label: 'API Key', onTap: () => push(context, const KeysScreen()).then((_) => _load())),
                ListRow(icon: CupertinoIcons.chart_bar, label: 'Statistik', onTap: () => push(context, const UsageScreen())),
                ListRow(icon: CupertinoIcons.doc_plaintext, label: 'Riwayat order', onTap: () => push(context, const OrdersScreen())),
                ListRow(icon: CupertinoIcons.creditcard, label: 'Paket & harga', onTap: () => push(context, const PricingScreen())),
                ListRow(icon: CupertinoIcons.gear, label: 'Pengaturan', onTap: () => push(context, const SettingsScreen())),
                if (me.isAdmin)
                  ListRow(icon: CupertinoIcons.checkmark_shield, label: 'Panel admin', sub: 'Khusus admin', onTap: () => push(context, const AdminScreen())),
              ],
            ),
          ],
        );
      },
    );
  }
}

/// Daftar request terbaru (status, endpoint, latensi, waktu).
class RecentList extends StatelessWidget {
  const RecentList({super.key, required this.items});
  final List<RecentRequest> items;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return ListGroup(
      children: [
        for (final r in items)
          Pressable(
            scale: 0.985,
            onTap: () {
              final ep = app.catalog.value?.byId(r.endpoint);
              if (ep != null) push(context, EndpointDetailScreen(endpoint: ep));
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  SizedBox(
                    width: 44,
                    child: Text(
                      '${r.status}',
                      style: TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, color: r.status < 400 ? fx.mint : fx.danger),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      r.endpoint,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontFamily: kMono, fontSize: 13),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${r.latency}ms · ${fmtRel(r.at)}', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
