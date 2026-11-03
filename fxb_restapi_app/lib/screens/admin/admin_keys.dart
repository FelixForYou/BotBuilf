import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api_exception.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'admin_screen.dart';

/// Admin › API key: GET /api/admin/keys?q=&tier=, PATCH /api/admin/keys/{id}.
class AdminKeysScreen extends StatefulWidget {
  const AdminKeysScreen({super.key});
  @override
  State<AdminKeysScreen> createState() => _AdminKeysScreenState();
}

class _AdminKeysScreenState extends State<AdminKeysScreen> {
  final _loader = GlobalKey<LoaderState<List<Map>>>();
  String _q = '';
  String _tier = '';

  Future<void> _edit(Map k) async {
    final changed = await showFxSheet<bool>(
      context,
      title: '${k['name']}',
      subtitle: '${k['prefix']}… · ${k['email']}',
      builder: (ctx) => _KeyEditor(k: k),
    );
    if (changed == true) await _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final app = App.of(context);
    final fx = Fx.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'API key',
        onRefresh: () async => _loader.currentState?.reload(),
        children: [
          const SizedBox(height: 12),
          AdminSearch(
            hint: 'Cari email, prefix, atau nama key…',
            onSearch: (v) {
              setState(() => _q = v);
              _loader.currentState?.reload();
            },
          ),
          const SizedBox(height: 12),
          Segmented<String>(
            value: _tier,
            options: const [('', 'Semua'), ('free', 'Free'), ('premium', 'Premium')],
            onChanged: (v) {
              setState(() => _tier = v);
              _loader.currentState?.reload();
            },
          ),
          const SizedBox(height: 14),
          Loader<List<Map>>(
            key: _loader,
            load: () async => ((await app.api.get('/api/admin/keys', query: {if (_q.isNotEmpty) 'q': _q, if (_tier.isNotEmpty) 'tier': _tier})) as List)
                .whereType<Map>()
                .toList(),
            builder: (context, list, _) => list.isEmpty
                ? const EmptyState(icon: CupertinoIcons.lock_shield, title: 'Tidak ada key')
                : Column(
                    children: [
                      for (final k in list)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: FxCard(
                            padding: const EdgeInsets.all(16),
                            onTap: () => _edit(k),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text('${k['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    ),
                                    Pill('${k['tier']}', tone: k['tier'] == 'premium' ? Tone.mint : Tone.neutral),
                                    if (k['status'] != 'active') ...[const SizedBox(width: 4), const Pill('revoked', tone: Tone.danger)],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${k['prefix']}… · ${k['email']}',
                                  style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Hari ini ${fmtNum(asInt(k['used_today']))}'
                                  '${k['daily_limit'] != null ? ' / ${fmtNum(asInt(k['daily_limit']))}' : ''}'
                                  '${k['expires_at'] != null ? ' · s/d ${fmtDate(k['expires_at'])}' : ''}'
                                  ' · dipakai ${fmtRel(k['last_used_at'])}',
                                  style: TextStyle(fontSize: 12.5, color: fx.subtle),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _KeyEditor extends StatefulWidget {
  const _KeyEditor({required this.k});
  final Map k;
  @override
  State<_KeyEditor> createState() => _KeyEditorState();
}

class _KeyEditorState extends State<_KeyEditor> {
  late String _status = '${widget.k['status']}';
  late String _tier = '${widget.k['tier']}';
  late String? _plan = widget.k['plan_id']?.toString();
  late final _daily = TextEditingController(text: widget.k['daily_limit']?.toString() ?? '');
  late final _rpm = TextEditingController(text: widget.k['rpm_limit']?.toString() ?? '');
  late int? _expires = asIntOrNull(widget.k['expires_at']);
  List<Plan>? _plans;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        final d = await App.of(context).api.get('/api/admin/plans');
        if (mounted) setState(() => _plans = (d as List).whereType<Map>().map(Plan.new).toList());
      } catch (e) {
        toastError(e);
        if (mounted) setState(() => _plans = const []);
      }
    });
  }

  @override
  void dispose() {
    _daily.dispose();
    _rpm.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final init = _expires != null ? DateTime.fromMillisecondsSinceEpoch(_expires!) : now.add(const Duration(days: 30));
    final d = await showDatePicker(
      context: context,
      initialDate: init.isBefore(now) ? now : init,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 3650)),
    );
    if (d != null) setState(() => _expires = DateTime(d.year, d.month, d.day, 23, 59).millisecondsSinceEpoch);
  }

  Future<void> _save() async {
    if (_busy) return;
    int? numOrNull(String s, String field) {
      if (s.trim().isEmpty) return null;
      final n = int.tryParse(s.trim());
      if (n == null || n < 0) throw ApiException('BAD_REQUEST', '$field harus bilangan bulat ≥ 0.');
      return n;
    }

    setState(() => _busy = true);
    try {
      final body = <String, Object?>{
        'status': _status,
        'tier': _tier,
        'plan_id': _tier == 'premium' ? _plan : null,
        'daily_limit': numOrNull(_daily.text, 'Limit harian'),
        'rpm_limit': numOrNull(_rpm.text, 'Limit per menit'),
        'expires_at': _tier == 'premium' ? _expires : null,
      };
      await App.of(context).api.patch('/api/admin/keys/${widget.k['id']}', body);
      toast('Key diperbarui.');
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
        Text(
          'Status',
          style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
        ),
        const SizedBox(height: 8),
        Segmented<String>(value: _status, options: const [('active', 'Aktif'), ('revoked', 'Dicabut')], onChanged: (v) => setState(() => _status = v)),
        const SizedBox(height: 16),
        Text(
          'Tier',
          style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
        ),
        const SizedBox(height: 8),
        Segmented<String>(value: _tier, options: const [('free', 'Free'), ('premium', 'Premium')], onChanged: (v) => setState(() => _tier = v)),
        if (_tier == 'premium') ...[
          const SizedBox(height: 16),
          Text(
            'Paket',
            style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
          ),
          const SizedBox(height: 8),
          if (_plans == null)
            const Skeleton(height: 54)
          else
            ListGroup(
              children: [
                ListRow(
                  label: 'Tanpa paket',
                  chevron: false,
                  trailing: Icon(_plan == null ? CupertinoIcons.largecircle_fill_circle : CupertinoIcons.circle, color: fx.mint),
                  onTap: () => setState(() => _plan = null),
                ),
                for (final p in _plans!)
                  ListRow(
                    label: p.name,
                    sub: '${fmtNum(p.dailyLimit)}/hari · ${p.rpmLimit}/mnt${p.active ? '' : ' · nonaktif'}',
                    chevron: false,
                    trailing: Icon(_plan == p.id ? CupertinoIcons.largecircle_fill_circle : CupertinoIcons.circle, color: fx.mint),
                    onTap: () => setState(() => _plan = p.id),
                  ),
              ],
            ),
          const SizedBox(height: 16),
          Pressable(
            onTap: _pickDate,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(R.field)),
              child: Row(
                children: [
                  Icon(CupertinoIcons.calendar, color: fx.mint),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_expires == null ? 'Tanpa kedaluwarsa' : 'Berlaku s/d ${fmtDate(_expires, withTime: true)}')),
                  if (_expires != null) FxIconButton(Icons.close_rounded, size: 30, tooltip: 'Hapus tanggal', onTap: () => setState(() => _expires = null)),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FxField(controller: _daily, label: 'Limit harian', hint: 'default', keyboard: TextInputType.number),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FxField(controller: _rpm, label: 'Limit/menit', hint: 'default', keyboard: TextInputType.number),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text('Kosongkan limit untuk memakai limit paket (premium) atau limit free global.', style: TextStyle(color: fx.muted, fontSize: 12.5)),
        const SizedBox(height: 20),
        FxButton('Simpan', big: true, expand: true, loading: _busy, onTap: _save),
      ],
    );
  }
}
