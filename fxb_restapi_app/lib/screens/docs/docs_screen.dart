import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/category_icon.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'endpoint_detail_screen.dart';

/// Dokumentasi: pencarian, kategori, filter tier/status (app/docs/page.tsx).
class DocsScreen extends StatefulWidget {
  const DocsScreen({super.key});
  @override
  State<DocsScreen> createState() => _DocsScreenState();
}

class _DocsScreenState extends State<DocsScreen> {
  late final AppState app = App.of(context);
  final _q = TextEditingController();
  String _query = '';
  String _tier = 'all';
  bool _onlineOnly = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load({bool force = false}) async {
    setState(() => _error = null);
    try {
      await app.loadCatalog(force: force);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return ValueListenableBuilder<String>(
      valueListenable: app.docsCategory,
      builder: (context, cat, _) => ValueListenableBuilder<Catalog?>(
        valueListenable: app.catalog,
        builder: (context, c, _) {
          final list = c == null
              ? const <Endpoint>[]
              : c.endpoints
                    .where((e) => (cat == 'all' || e.category == cat) && (_tier == 'all' || e.tier == _tier) && (!_onlineOnly || e.online) && e.matches(_query))
                    .toList();
          final header = <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: FxField(
                controller: _q,
                hint: 'Cari endpoint (mis. tiktok, qr, chat)…',
                onChanged: (v) => setState(() => _query = v.trim()),
                textInputAction: TextInputAction.search,
              ),
            ),
            if (c != null)
              ChipBar(items: [('all', 'Semua'), for (final k in c.categories) (k.id, k.name)], selected: cat, onSelect: (v) => app.docsCategory.value = v),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Segmented<String>(
                value: _tier,
                options: const [('all', 'Semua tier'), ('free', 'Free'), ('premium', 'Premium')],
                onChanged: (v) => setState(() => _tier = v),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 6, 12, 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Hanya yang online', style: TextStyle(color: fx.muted, fontSize: 14.5)),
                  ),
                  Switch(value: _onlineOnly, onChanged: (v) => setState(() => _onlineOnly = v)),
                ],
              ),
            ),
            if (_error != null && c == null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: ErrorView(error: _error!, onRetry: () => _load(force: true)),
              )
            else if (c == null)
              const Padding(padding: EdgeInsets.all(16), child: SkeletonList(count: 6))
            else if (list.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: EmptyState(icon: CupertinoIcons.search, title: 'Tidak ada endpoint', text: 'Coba kata kunci atau filter lain.'),
              ),
          ];
          return FxPage(
            title: 'Dokumentasi',
            subtitle: c == null ? 'Memuat katalog endpoint…' : '${c.endpoints.length} endpoint · format JSON · /api/v1',
            onRefresh: () => _load(force: true),
            padding: EdgeInsets.zero,
            slivers: [
              if (list.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                  sliver: SliverList.builder(
                    itemCount: list.length,
                    itemBuilder: (context, i) {
                      final e = list[i];
                      final showHeader = i == 0 || list[i - 1].category != e.category || list[i - 1].group != e.group;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (showHeader)
                            Padding(
                              padding: EdgeInsets.fromLTRB(4, i == 0 ? 8 : 20, 4, 8),
                              child: Row(
                                children: [
                                  Icon(categoryIcon(e.category), size: 16, color: fx.mint),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      e.group.toUpperCase(),
                                      style: TextStyle(fontSize: 12.5, letterSpacing: 1, fontWeight: FontWeight.w600, color: fx.muted),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Padding(padding: const EdgeInsets.only(bottom: 8), child: EndpointRow(e)),
                        ],
                      );
                    },
                  ),
                ),
            ],
            children: header,
          );
        },
      ),
    );
  }
}

/// Baris endpoint (components/endpoint-row.tsx).
class EndpointRow extends StatelessWidget {
  const EndpointRow(this.e, {super.key, this.onTap});
  final Endpoint e;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final statusColor = switch (e.status) {
      'online' => fx.mint,
      'maintenance' => fx.warn,
      _ => fx.subtle,
    };
    return FxCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      onTap: onTap ?? () => push(context, EndpointDetailScreen(endpoint: e)),
      child: Row(
        children: [
          MethodPill(e.method),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        e.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15.5),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '/${e.id}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (e.premium)
            const Pill('premium', tone: Tone.mint)
          else if (!e.online)
            Pill(e.status == 'maintenance' ? 'perbaikan' : 'belum aktif', tone: Tone.warn),
          const SizedBox(width: 4),
          Icon(CupertinoIcons.chevron_right, size: 15, color: fx.subtle),
        ],
      ),
    );
  }
}
