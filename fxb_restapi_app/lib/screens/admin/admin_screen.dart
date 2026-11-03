import 'package:flutter/cupertino.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/charts.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'admin_endpoints.dart';
import 'admin_keys.dart';
import 'admin_orders.dart';
import 'admin_plans.dart';
import 'admin_settings.dart';
import 'admin_users.dart';

/// Pembatas halaman admin di sisi aplikasi. Backend tetap memeriksa
/// `requireAdmin()` pada setiap endpoint /api/admin/*.
class AdminGuard extends StatelessWidget {
  const AdminGuard({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<User?>(
      valueListenable: App.of(context).me,
      builder: (context, me, _) => me?.isAdmin == true
          ? child
          : const FxPage(
              title: 'Admin',
              children: [
                SizedBox(height: 20),
                EmptyState(icon: CupertinoIcons.lock, title: 'Khusus admin', text: 'Halaman ini hanya untuk akun dengan hak admin.'),
              ],
            ),
    );
  }
}

/// Ringkasan admin (app/admin/page.tsx) dari /api/admin/stats.
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _loader = GlobalKey<LoaderState<Map>>();

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Admin',
        subtitle: 'Ringkasan layanan FxB RestApi',
        onRefresh: () async => _loader.currentState?.reload(),
        children: [
          const SizedBox(height: 14),
          Loader<Map>(
            key: _loader,
            load: () async => (await app.api.get('/api/admin/stats')) as Map,
            skeleton: const Column(children: [Skeleton(height: 140), SizedBox(height: 14), Skeleton(height: 200)]),
            builder: (context, s, _) {
              final series = ((s['series'] as List?) ?? const []).whereType<Map>().map(SeriesPoint.fromJson).toList();
              final top = ((s['top'] as List?) ?? const []).whereType<Map>().map(TopEndpoint.fromJson).toList();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  StatGrid([
                    StatItem(fmtNum(asInt(s['users'])), 'Pengguna'),
                    StatItem(fmtNum(asInt(s['active_keys'])), 'Key aktif'),
                    StatItem(fmtNum(asInt(s['premium_keys'])), 'Premium'),
                  ]),
                  const SizedBox(height: 10),
                  StatGrid([StatItem(fmtIDR(asInt(s['revenue'])), 'Pendapatan'), StatItem(fmtNum(asInt(s['pending_orders'])), 'Order pending')]),
                  const SizedBox(height: 10),
                  StatGrid([StatItem(fmtNum(asInt(s['requests_24h'])), 'Request 24j'), StatItem(fmtNum(asInt(s['errors_24h'])), 'Error 24j')]),
                  const SectionLabel('Request 14 hari'),
                  FxCard(child: SeriesChart(series: series)),
                  const SectionLabel('Endpoint teratas (14 hari)'),
                  if (top.isEmpty)
                    FxCard(
                      child: Text('Belum ada request.', style: TextStyle(color: fx.muted)),
                    )
                  else
                    ListGroup(
                      children: [
                        for (final t in top)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(t.id, style: const TextStyle(fontFamily: kMono, fontSize: 13)),
                                ),
                                Text('${fmtNum(t.count)} · ${t.errors} err · ${t.latency}ms', style: TextStyle(color: fx.muted, fontSize: 12.5)),
                              ],
                            ),
                          ),
                      ],
                    ),
                ],
              );
            },
          ),
          const SectionLabel('Kelola'),
          ListGroup(
            children: [
              ListRow(icon: CupertinoIcons.person_2, label: 'Pengguna', sub: 'Role, tangguhkan, hapus', onTap: () => push(context, const AdminUsersScreen())),
              ListRow(
                icon: CupertinoIcons.lock_shield,
                label: 'API key',
                sub: 'Tier, paket, limit, kedaluwarsa, revoke',
                onTap: () => push(context, const AdminKeysScreen()),
              ),
              ListRow(
                icon: CupertinoIcons.square_stack_3d_up,
                label: 'Endpoint',
                sub: 'On/off, tier, catatan maintenance',
                onTap: () => push(context, const AdminEndpointsScreen()),
              ),
              ListRow(icon: CupertinoIcons.tag, label: 'Paket', sub: 'Harga, masa aktif, limit', onTap: () => push(context, const AdminPlansScreen())),
              ListRow(
                icon: CupertinoIcons.creditcard,
                label: 'Pembayaran',
                sub: 'Verifikasi manual & batalkan',
                onTap: () => push(context, const AdminOrdersScreen()),
              ),
              ListRow(
                icon: CupertinoIcons.slider_horizontal_3,
                label: 'Pengaturan',
                sub: 'Limit, pendaftaran, status provider',
                onTap: () => push(context, const AdminSettingsScreen()),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Field pencarian dengan debounce sederhana untuk halaman admin.
class AdminSearch extends StatefulWidget {
  const AdminSearch({super.key, required this.hint, required this.onSearch});
  final String hint;
  final ValueChanged<String> onSearch;
  @override
  State<AdminSearch> createState() => _AdminSearchState();
}

class _AdminSearchState extends State<AdminSearch> {
  final _c = TextEditingController();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FxField(
    controller: _c,
    hint: widget.hint,
    textInputAction: TextInputAction.search,
    onSubmitted: (v) => widget.onSearch(v.trim()),
    onChanged: (v) {
      if (v.isEmpty) widget.onSearch('');
    },
  );
}

Future<void> runAdmin(Future<void> Function() fn, {String? done}) async {
  try {
    await fn();
    if (done != null) toast(done);
  } catch (e) {
    toastError(e);
  }
}
