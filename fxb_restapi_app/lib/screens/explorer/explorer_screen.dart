import 'package:flutter/cupertino.dart';

import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import '../docs/docs_screen.dart';
import '../docs/endpoint_detail_screen.dart';
import 'runner_screen.dart';

/// API Explorer (app/explorer/page.tsx): pilih endpoint lalu kirim request nyata.
class ExplorerScreen extends StatefulWidget {
  const ExplorerScreen({super.key});
  @override
  State<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends State<ExplorerScreen> {
  late final AppState app = App.of(context);
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

  Endpoint? _current(Catalog c, String? id) {
    if (id != null) {
      final e = c.byId(id);
      if (e != null) return e;
    }
    return c.byId('tools/dns') ?? (c.endpoints.where((e) => e.online).firstOrNull ?? c.endpoints.firstOrNull);
  }

  Future<void> _pick(Catalog c) async {
    final id = await showFxSheet<String>(
      context,
      title: 'Pilih endpoint',
      subtitle: '${c.endpoints.length} endpoint tersedia',
      scrollable: false,
      builder: (ctx) => _EndpointPicker(catalog: c),
    );
    if (id != null) app.explorerEndpoint.value = id;
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return ValueListenableBuilder<Catalog?>(
      valueListenable: app.catalog,
      builder: (context, c, _) => ValueListenableBuilder<String?>(
        valueListenable: app.explorerEndpoint,
        builder: (context, id, _) {
          final ep = c == null ? null : _current(c, id);
          return FxPage(
            title: 'API Explorer',
            subtitle: 'Kirim request nyata ke ${ep?.path ?? '/api/v1'}',
            onRefresh: () => _load(force: true),
            children: [
              const SizedBox(height: 12),
              if (c == null && _error != null)
                ErrorView(error: _error!, onRetry: () => _load(force: true))
              else if (c == null || ep == null)
                const SkeletonList(count: 3, height: 90)
              else ...[
                FxCard(
                  onTap: () => _pick(c),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      MethodPill(ep.method),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(ep.name, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700)),
                            Text(
                              ep.path,
                              style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'Ganti',
                        style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600),
                      ),
                      Icon(CupertinoIcons.chevron_down, size: 15, color: fx.mint),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: LinkText(
                    'Lihat dokumentasi',
                    icon: CupertinoIcons.arrow_right,
                    onTap: () => push(context, EndpointDetailScreen(endpoint: ep)),
                  ),
                ),
                const SizedBox(height: 8),
                Runner(key: ValueKey(ep.id), endpoint: ep),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _EndpointPicker extends StatefulWidget {
  const _EndpointPicker({required this.catalog});
  final Catalog catalog;
  @override
  State<_EndpointPicker> createState() => _EndpointPickerState();
}

class _EndpointPickerState extends State<_EndpointPicker> {
  final _q = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final list = widget.catalog.endpoints.where((e) => e.matches(_query)).toList();
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.72,
      child: Column(
        children: [
          FxField(controller: _q, hint: 'Cari endpoint…', onChanged: (v) => setState(() => _query = v.trim())),
          const SizedBox(height: 12),
          Expanded(
            child: list.isEmpty
                ? const EmptyState(icon: CupertinoIcons.search, title: 'Tidak ditemukan')
                : ListView.builder(
                    itemCount: list.length,
                    itemBuilder: (context, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: EndpointRow(list[i], onTap: () => Navigator.pop(context, list[i].id)),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
