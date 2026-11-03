import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/charts.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'dashboard_screen.dart';

/// Statistik penggunaan (app/dashboard/usage/page.tsx) dari /api/usage?days=N.
class UsageScreen extends StatefulWidget {
  const UsageScreen({super.key});
  @override
  State<UsageScreen> createState() => _UsageScreenState();
}

class _UsageScreenState extends State<UsageScreen> {
  int _days = 7;
  // Satu Loader per periode: ganti periode = muat ulang dengan skeleton.
  final _loaders = <int, GlobalKey<LoaderState<Usage>>>{};
  GlobalKey<LoaderState<Usage>> get _loader => _loaders.putIfAbsent(_days, GlobalKey<LoaderState<Usage>>.new);

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return FxPage(
      title: 'Statistik',
      subtitle: 'Request dari semua API key milikmu.',
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        const SizedBox(height: 14),
        Segmented<int>(value: _days, options: const [(7, '7 hari'), (30, '30 hari'), (90, '90 hari')], onChanged: (v) => setState(() => _days = v)),
        const SizedBox(height: 16),
        Loader<Usage>(
          key: _loader,
          load: () async => Usage.fromJson(await app.api.get('/api/usage', query: {'days': '$_days'}) as Map),
          skeleton: const Column(children: [Skeleton(height: 70), SizedBox(height: 14), Skeleton(height: 200), SizedBox(height: 14), Skeleton(height: 220)]),
          builder: (context, u, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              StatGrid([
                StatItem(fmtNum(u.total), 'Request'),
                StatItem(fmtNum(u.success), 'Sukses'),
                StatItem(fmtNum(u.errors), 'Error'),
                StatItem(u.total > 0 ? '${u.avgLatency}ms' : '—', 'Latency'),
              ]),
              const SectionLabel('Per hari'),
              FxCard(child: SeriesChart(series: u.series)),
              const SectionLabel('Endpoint teratas'),
              if (u.top.isEmpty)
                FxCard(
                  child: Text('Belum ada data pada periode ini.', style: TextStyle(color: fx.muted)),
                )
              else
                ListGroup(
                  children: [
                    for (final t in u.top)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(t.id, style: const TextStyle(fontFamily: kMono, fontSize: 13.5)),
                                ),
                                Text('${fmtNum(t.count)} req', style: const TextStyle(fontWeight: FontWeight.w600)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ProgressBar(value: t.count / (u.top.first.count == 0 ? 1 : u.top.first.count) * 100, height: 6),
                            const SizedBox(height: 4),
                            Text('${t.errors} error · rata-rata ${t.latency}ms', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                          ],
                        ),
                      ),
                  ],
                ),
              const SectionLabel('Request terbaru'),
              if (u.recent.isEmpty)
                FxCard(
                  child: Text('Belum ada request.', style: TextStyle(color: fx.muted)),
                )
              else
                RecentList(items: u.recent),
            ],
          ),
        ),
      ],
    );
  }
}
