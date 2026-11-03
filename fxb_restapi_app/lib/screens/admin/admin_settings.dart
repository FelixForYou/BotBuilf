import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'admin_screen.dart';

/// Admin › Pengaturan: GET/PATCH /api/admin/settings (SiteSettings) + status provider.
class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});
  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends State<AdminSettingsScreen> {
  final _loader = GlobalKey<LoaderState<Map>>();

  static const _numFields = [
    ('free_daily_limit', 'Limit harian key free', 'Request per hari untuk key free.'),
    ('free_rpm', 'Limit per menit key free', 'Request per menit untuk key free.'),
    ('max_free_keys', 'Maks. key free per akun', ''),
    ('max_keys_total', 'Maks. key aktif per akun', ''),
    ('playground_daily_ip', 'Kuota uji coba per IP/hari', 'Untuk Explorer tanpa login.'),
    ('order_ttl_hours', 'Masa berlaku order (jam)', 'Order pending kedaluwarsa setelah ini.'),
  ];

  @override
  Widget build(BuildContext context) {
    final app = App.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Pengaturan admin',
        onRefresh: () async => _loader.currentState?.reload(),
        children: [
          const SizedBox(height: 12),
          Loader<Map>(
            key: _loader,
            load: () async => (await app.api.get('/api/admin/settings')) as Map,
            builder: (context, d, reload) => _SettingsForm(data: d, onSaved: reload),
          ),
        ],
      ),
    );
  }
}

class _SettingsForm extends StatefulWidget {
  const _SettingsForm({required this.data, required this.onSaved});
  final Map data;
  final Future<void> Function() onSaved;
  @override
  State<_SettingsForm> createState() => _SettingsFormState();
}

class _SettingsFormState extends State<_SettingsForm> {
  late Map s = Map.of((widget.data['settings'] as Map?) ?? const {});
  late final _ctrls = {for (final f in _AdminSettingsScreenState._numFields) f.$1: TextEditingController(text: '${s[f.$1] ?? ''}')};
  late final _manual = TextEditingController(text: '${s['manual_payment_info'] ?? ''}');
  late bool _reg = s['registration_open'] != false;
  bool _busy = false;
  Map<String, String> _err = {};

  @override
  void dispose() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    _manual.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy) return;
    final err = <String, String>{};
    final body = <String, Object?>{'registration_open': _reg, 'manual_payment_info': _manual.text.trim()};
    for (final f in _AdminSettingsScreenState._numFields) {
      final n = int.tryParse(_ctrls[f.$1]!.text.trim());
      if (n == null || n < 0 || n > 10000000) {
        err[f.$1] = 'Harus angka 0–10.000.000.';
      } else {
        body[f.$1] = n;
      }
    }
    setState(() => _err = err);
    if (err.isNotEmpty) return;
    setState(() => _busy = true);
    try {
      await App.of(context).api.patch('/api/admin/settings', body);
      toast('Pengaturan disimpan.');
      await widget.onSaved();
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final providers = ((widget.data['providers'] as List?) ?? const []).whereType<Map>().toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('${asInt(widget.data['endpoints'])} endpoint terdaftar', style: TextStyle(color: fx.muted)),
        const SectionLabel('Limit & akun', top: 16),
        FxCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final f in _AdminSettingsScreenState._numFields) ...[
                FxField(controller: _ctrls[f.$1], label: f.$2, help: f.$3.isEmpty ? null : f.$3, keyboard: TextInputType.number, error: _err[f.$1]),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  const Expanded(
                    child: Text('Pendaftaran dibuka', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  Switch(value: _reg, onChanged: (v) => setState(() => _reg = v)),
                ],
              ),
            ],
          ),
        ),
        const SectionLabel('Transfer manual'),
        FxCard(
          child: FxField(
            controller: _manual,
            label: 'Instruksi pembayaran',
            help: 'Kosongkan untuk menonaktifkan metode transfer manual. Maks. 2000 karakter.',
            maxLines: 5,
            minLines: 3,
            maxLength: 2000,
          ),
        ),
        const SizedBox(height: 16),
        FxButton('Simpan pengaturan', big: true, expand: true, loading: _busy, onTap: _save),
        const SectionLabel('Status provider'),
        ListGroup(
          children: [
            for (final p in providers)
              ListRow(
                icon: p['ok'] == true ? CupertinoIcons.checkmark_circle : CupertinoIcons.exclamationmark_circle,
                label: '${p['name']}',
                sub: '${p['detail'] ?? ''}',
                trailing: Pill(p['ok'] == true ? 'OK' : 'Belum', tone: p['ok'] == true ? Tone.mint : Tone.warn),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text('Kredensial provider diatur di file .env.local server, tidak pernah dikirim ke aplikasi.', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
      ],
    );
  }
}
