import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'admin_screen.dart';

/// Admin › Endpoint: GET /api/admin/endpoints, PATCH /api/admin/endpoints/{id} {enabled, tier, note}.
class AdminEndpointsScreen extends StatefulWidget {
  const AdminEndpointsScreen({super.key});
  @override
  State<AdminEndpointsScreen> createState() => _AdminEndpointsScreenState();
}

class _AdminEndpointsScreenState extends State<AdminEndpointsScreen> {
  final _loader = GlobalKey<LoaderState<List<Map>>>();
  String _q = '';

  Future<void> _edit(Map e) async {
    final changed = await showFxSheet<bool>(
      context,
      title: '${e['name']}',
      subtitle: '/${e['id']}',
      builder: (ctx) => _EndpointEditor(e: e),
    );
    if (changed == true) {
      await _loader.currentState?.reload();
      if (mounted) App.of(context).loadCatalog(force: true).ignore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Endpoint',
        onRefresh: () async => _loader.currentState?.reload(),
        children: [
          const SizedBox(height: 12),
          AdminSearch(hint: 'Filter endpoint…', onSearch: (v) => setState(() => _q = v.toLowerCase())),
          const SizedBox(height: 14),
          Loader<List<Map>>(
            key: _loader,
            load: () async => ((await app.api.get('/api/admin/endpoints')) as List).whereType<Map>().toList(),
            builder: (context, all, _) {
              final list = all.where((e) => _q.isEmpty || '${e['id']} ${e['name']}'.toLowerCase().contains(_q)).toList();
              return Column(
                children: [
                  for (final e in list)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: FxCard(
                        padding: const EdgeInsets.all(14),
                        onTap: () => _edit(e),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                MethodPill('${e['method']}'),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text('${e['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Pill(switch ('${e['status']}') {
                                  'online' => 'online',
                                  'maintenance' => 'off',
                                  _ => 'belum aktif',
                                }, tone: e['status'] == 'online' ? Tone.mint : Tone.warn),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '/${e['id']} · tier ${e['tier']}${e['tier'] != e['default_tier'] ? ' (default ${e['default_tier']})' : ''}',
                              style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                            ),
                            Text(
                              '7 hari: ${fmtNum(asInt(e['requests_7d']))} request · ${fmtNum(asInt(e['errors_7d']))} error',
                              style: TextStyle(fontSize: 12.5, color: fx.subtle),
                            ),
                            if ((e['missing_env'] as List?)?.isNotEmpty == true)
                              Text('Env belum diatur: ${(e['missing_env'] as List).join(', ')}', style: TextStyle(fontSize: 12.5, color: fx.warn)),
                            if (e['note'] != null) Text('Catatan: ${e['note']}', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                          ],
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _EndpointEditor extends StatefulWidget {
  const _EndpointEditor({required this.e});
  final Map e;
  @override
  State<_EndpointEditor> createState() => _EndpointEditorState();
}

class _EndpointEditorState extends State<_EndpointEditor> {
  late bool _enabled = widget.e['status'] != 'maintenance';
  late String _tier = '${widget.e['tier']}';
  late final _note = TextEditingController(text: widget.e['note']?.toString() ?? '');
  bool _busy = false;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await App.of(context).api
          .patch('/api/admin/endpoints/${Uri.encodeComponent('${widget.e['id']}')}', {'enabled': _enabled, 'tier': _tier, 'note': _note.text.trim()});
      toast('Endpoint diperbarui.');
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListGroup(
          children: [
            ListRow(
              icon: CupertinoIcons.power,
              label: 'Endpoint aktif',
              sub: _enabled ? 'Melayani request' : 'Membalas 503 MAINTENANCE',
              chevron: false,
              trailing: Switch(value: _enabled, onChanged: (v) => setState(() => _enabled = v)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Tier (default ${widget.e['default_tier']})',
          style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
        ),
        const SizedBox(height: 8),
        Segmented<String>(value: _tier, options: const [('free', 'Free'), ('premium', 'Premium')], onChanged: (v) => setState(() => _tier = v)),
        const SizedBox(height: 16),
        FxField(controller: _note, label: 'Catatan maintenance', hint: 'Opsional, maks. 200 karakter', maxLength: 200),
        const SizedBox(height: 20),
        FxButton('Simpan', big: true, expand: true, loading: _busy, onTap: _save),
      ],
    );
  }
}
