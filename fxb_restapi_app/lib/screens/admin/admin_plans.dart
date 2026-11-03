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

/// Admin › Paket: GET/POST /api/admin/plans, PATCH/DELETE /api/admin/plans/{id}.
class AdminPlansScreen extends StatefulWidget {
  const AdminPlansScreen({super.key});
  @override
  State<AdminPlansScreen> createState() => _AdminPlansScreenState();
}

class _AdminPlansScreenState extends State<AdminPlansScreen> {
  final _loader = GlobalKey<LoaderState<List<Plan>>>();

  Future<void> _edit([Plan? p]) async {
    final changed = await showFxSheet<bool>(
      context,
      title: p == null ? 'Paket baru' : 'Ubah ${p.name}',
      builder: (ctx) => _PlanEditor(plan: p),
    );
    if (changed == true) await _loader.currentState?.reload();
  }

  Future<void> _delete(Plan p) async {
    final ok = await confirmSheet(
      context,
      title: 'Hapus paket ${p.name}?',
      text: 'Jika paket sudah pernah dipesan, paket hanya diarsipkan (nonaktif) agar riwayat order tetap utuh.',
      confirm: 'Hapus',
      danger: true,
    );
    if (!ok || !mounted) return;
    try {
      final r = await App.of(context).api.delete('/api/admin/plans/${p.id}');
      toast((r is Map && r['archived'] == true) ? 'Paket diarsipkan (sudah pernah dipesan).' : 'Paket dihapus.', kind: ToastKind.info);
    } catch (e) {
      toastError(e);
    }
    await _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Paket',
        onRefresh: () async => _loader.currentState?.reload(),
        actions: [FxIconButton(CupertinoIcons.add, tooltip: 'Paket baru', onTap: () => _edit())],
        children: [
          const SizedBox(height: 12),
          Loader<List<Plan>>(
            key: _loader,
            load: () async => ((await app.api.get('/api/admin/plans')) as List).whereType<Map>().map(Plan.new).toList(),
            builder: (context, list, _) => list.isEmpty
                ? EmptyState(
                    icon: CupertinoIcons.tag,
                    title: 'Belum ada paket',
                    action: FxButton('Buat paket', onTap: () => _edit()),
                  )
                : Column(
                    children: [
                      for (final p in list)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: FxCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(p.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                                    ),
                                    if (!p.active) const Pill('nonaktif', tone: Tone.warn),
                                    const SizedBox(width: 6),
                                    Pill(fmtIDR(p.price), tone: Tone.mint),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'id: ${p.id} · ${p.durationDays} hari · ${fmtNum(p.dailyLimit)}/hari · ${p.rpmLimit}/mnt · level ${p.rank} · urutan ${p.sort}',
                                  style: TextStyle(color: fx.muted, fontSize: 13),
                                ),
                                Text('Terjual: ${p.sold}', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    FxButton('Ubah', small: true, icon: CupertinoIcons.pencil, variant: BtnVariant.secondary, onTap: () => _edit(p)),
                                    const SizedBox(width: 8),
                                    FxButton('Hapus', small: true, icon: CupertinoIcons.trash, variant: BtnVariant.danger, onTap: () => _delete(p)),
                                  ],
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

class _PlanEditor extends StatefulWidget {
  const _PlanEditor({this.plan});
  final Plan? plan;
  @override
  State<_PlanEditor> createState() => _PlanEditorState();
}

class _PlanEditorState extends State<_PlanEditor> {
  late final _id = TextEditingController(text: widget.plan?.id ?? '');
  late final _name = TextEditingController(text: widget.plan?.name ?? '');
  late final _desc = TextEditingController(text: widget.plan?.description ?? '');
  late final _price = TextEditingController(text: widget.plan == null ? '' : '${widget.plan!.price}');
  late final _days = TextEditingController(text: widget.plan == null ? '30' : '${widget.plan!.durationDays}');
  late final _daily = TextEditingController(text: widget.plan == null ? '' : '${widget.plan!.dailyLimit}');
  late final _rpm = TextEditingController(text: widget.plan == null ? '' : '${widget.plan!.rpmLimit}');
  late final _rank = TextEditingController(text: '${widget.plan?.rank ?? 1}');
  late final _sort = TextEditingController(text: '${widget.plan?.sort ?? 0}');
  late bool _active = widget.plan?.active ?? true;
  bool _busy = false;
  Map<String, String> _err = {};

  @override
  void dispose() {
    for (final c in [_id, _name, _desc, _price, _days, _daily, _rpm, _rank, _sort]) {
      c.dispose();
    }
    super.dispose();
  }

  int? _int(TextEditingController c, String key, String label, int min, int max, Map<String, String> err) {
    final n = int.tryParse(c.text.trim());
    if (n == null || n < min || n > max) {
      err[key] = '$label harus bilangan bulat $min–$max.';
      return null;
    }
    return n;
  }

  Future<void> _save() async {
    if (_busy) return;
    final err = <String, String>{};
    if (widget.plan == null && !RegExp(r'^[a-z0-9-]{2,30}$').hasMatch(_id.text.trim().toLowerCase())) {
      err['id'] = 'ID 2–30 karakter: huruf kecil, angka, dan -.';
    }
    if (_name.text.trim().length < 2) err['name'] = 'Nama minimal 2 karakter.';
    final body = <String, Object?>{
      if (widget.plan == null) 'id': _id.text.trim().toLowerCase(),
      'name': _name.text.trim(),
      'description': _desc.text.trim(),
      'price': _int(_price, 'price', 'Harga', 1000, 100000000, err),
      'duration_days': _int(_days, 'days', 'Masa aktif', 1, 3650, err),
      'daily_limit': _int(_daily, 'daily', 'Limit harian', 1, 10000000, err),
      'rpm_limit': _int(_rpm, 'rpm', 'Limit per menit', 1, 100000, err),
      'rank': _int(_rank, 'rank', 'Level', 1, 100, err),
      'sort': _int(_sort, 'sort', 'Urutan', 0, 1000, err),
      'active': _active,
    };
    setState(() => _err = err);
    if (err.isNotEmpty) return;
    setState(() => _busy = true);
    try {
      final api = App.of(context).api;
      if (widget.plan == null) {
        await api.post('/api/admin/plans', body);
      } else {
        await api.patch('/api/admin/plans/${widget.plan!.id}', body);
      }
      toast('Paket disimpan.');
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget num(TextEditingController c, String label, String key) => FxField(controller: c, label: label, keyboard: TextInputType.number, error: _err[key]);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.plan == null) ...[
          FxField(controller: _id, label: 'ID paket', hint: 'mis. pro-30', error: _err['id'], maxLength: 30),
          const SizedBox(height: 12),
        ],
        FxField(controller: _name, label: 'Nama', error: _err['name'], maxLength: 40),
        const SizedBox(height: 12),
        FxField(controller: _desc, label: 'Deskripsi', maxLength: 200),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: num(_price, 'Harga (IDR)', 'price')),
            const SizedBox(width: 10),
            Expanded(child: num(_days, 'Masa aktif (hari)', 'days')),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: num(_daily, 'Limit harian', 'daily')),
            const SizedBox(width: 10),
            Expanded(child: num(_rpm, 'Limit/menit', 'rpm')),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: num(_rank, 'Level', 'rank')),
            const SizedBox(width: 10),
            Expanded(child: num(_sort, 'Urutan', 'sort')),
          ],
        ),
        const SizedBox(height: 12),
        ListGroup(
          children: [
            ListRow(
              label: 'Aktif (tampil di Pricing)',
              chevron: false,
              trailing: Switch(value: _active, onChanged: (v) => setState(() => _active = v)),
            ),
          ],
        ),
        const SizedBox(height: 20),
        FxButton('Simpan', big: true, expand: true, loading: _busy, onTap: _save),
      ],
    );
  }
}
