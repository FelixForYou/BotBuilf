import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../config/app_config.dart';
import '../../core/api_exception.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../theme/motion.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';

/// Pengaturan (app/dashboard/settings/page.tsx): profil, password, preferensi, hapus akun.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final AppState app = App.of(context);
  late final _name = TextEditingController(text: app.me.value?.name ?? '');
  late final _email = TextEditingController(text: app.me.value?.email ?? '');
  final _cur = TextEditingController();
  final _next = TextEditingController();
  String? _busy;
  String? _nameErr;
  String? _pwErr;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _cur.dispose();
    _next.dispose();
    super.dispose();
  }

  Future<void> _wrap(String k, Future<void> Function() fn) async {
    if (_busy != null) return;
    setState(() => _busy = k);
    try {
      await fn();
    } on ApiException catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _saveName() async {
    final n = _name.text.trim();
    if (n.length < 2) return setState(() => _nameErr = 'Nama minimal 2 karakter.');
    setState(() => _nameErr = null);
    await _wrap('name', () async {
      await app.api.patch('/api/account', {'name': n});
      await app.refreshMe();
      toast('Profil disimpan.');
    });
  }

  Future<void> _changePw() async {
    if (_cur.text.isEmpty) return setState(() => _pwErr = 'Isi password lama.');
    if (_next.text.length < 8) return setState(() => _pwErr = 'Password baru minimal 8 karakter.');
    setState(() => _pwErr = null);
    await _wrap('pw', () async {
      // Server mengganti sesi: cookie baru otomatis disimpan oleh ApiClient.
      await app.api.post('/api/account/password', {'current': _cur.text, 'next': _next.text});
      _cur.clear();
      _next.clear();
      toast('Password diganti. Sesi di perangkat lain telah keluar.');
    });
  }

  Future<void> _logout() async {
    final ok = await confirmSheet(
      context,
      title: 'Keluar?',
      text: 'Sesi di perangkat ini akan diakhiri dan salinan API key di perangkat dihapus.',
      confirm: 'Keluar',
    );
    if (!ok) return;
    await app.logout();
    if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
    toast('Kamu sudah keluar.', kind: ToastKind.info);
  }

  Future<void> _delete() async {
    final pw = TextEditingController();
    final done = await showFxSheet<bool>(
      context,
      title: 'Hapus akun?',
      subtitle: 'Tindakan ini tidak bisa dibatalkan.',
      builder: (ctx) => BusyForm(
        builder: (busy, run) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FxField(controller: pw, label: 'Konfirmasi dengan password', obscure: true),
            const SizedBox(height: 18),
            FxButton(
              'Hapus akun permanen',
              big: true,
              expand: true,
              variant: BtnVariant.danger,
              loading: busy,
              onTap: () => run(() async {
                if (pw.text.isEmpty) throw ApiException('BAD_REQUEST', 'Password wajib diisi.');
                await app.api.delete('/api/account', {'password': pw.text});
                if (ctx.mounted) Navigator.pop(ctx, true);
              }),
            ),
          ],
        ),
      ),
    );
    pw.dispose();
    if (done == true) {
      await app.api.store.writeSession(null);
      await app.api.store.clearKeys();
      app.me.value = null;
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
      toast('Akun dihapus.', kind: ToastKind.info);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return ValueListenableBuilder<User?>(
      valueListenable: app.me,
      builder: (context, me, _) => FxPage(
        title: 'Pengaturan',
        subtitle: me == null ? null : 'Akun dibuat ${fmtDate(me.createdAt)} · ${me.isAdmin ? 'Admin' : 'User'}',
        children: [
          if (me != null) ...[
            const SectionLabel('Profil'),
            FxCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FxField(controller: _name, label: 'Nama', maxLength: 60, error: _nameErr),
                  const SizedBox(height: 14),
                  FxField(controller: _email, label: 'Email', help: 'Email tidak dapat diubah.', enabled: false),
                  const SizedBox(height: 16),
                  FxButton('Simpan profil', loading: _busy == 'name', onTap: _saveName),
                ],
              ),
            ),
            const SectionLabel('Keamanan'),
            FxCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FxField(controller: _cur, label: 'Password lama', obscure: true, autofill: const [AutofillHints.password]),
                  const SizedBox(height: 14),
                  FxField(
                    controller: _next,
                    label: 'Password baru',
                    obscure: true,
                    help: 'Minimal 8 karakter. Semua sesi lain akan keluar.',
                    error: _pwErr,
                    autofill: const [AutofillHints.newPassword],
                  ),
                  const SizedBox(height: 16),
                  FxButton('Ganti password', loading: _busy == 'pw', onTap: _changePw),
                ],
              ),
            ),
          ],
          const SectionLabel('Preferensi'),
          ListGroup(
            children: [
              ValueListenableBuilder<ThemeMode>(
                valueListenable: app.themeMode,
                builder: (context, m, _) => ListRow(
                  icon: m == ThemeMode.dark ? CupertinoIcons.moon : CupertinoIcons.sun_max,
                  label: 'Tampilan',
                  value: m == ThemeMode.dark ? 'Gelap' : 'Terang',
                  onTap: () => app.setTheme(m == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark),
                ),
              ),
              ValueListenableBuilder<bool>(
                valueListenable: app.glass,
                builder: (context, on, _) => ListRow(
                  icon: CupertinoIcons.drop,
                  label: 'Efek kaca (blur)',
                  sub: 'Matikan bila perangkat terasa berat.',
                  chevron: false,
                  trailing: Switch(value: on, onChanged: app.setGlass),
                ),
              ),
              ListRow(
                icon: CupertinoIcons.wand_stars,
                label: 'Kurangi gerakan',
                sub: Motion.reduced(context) ? 'Aktif (mengikuti pengaturan sistem)' : 'Ikuti Pengaturan › Aksesibilitas › Hapus animasi',
                chevron: false,
              ),
            ],
          ),
          const SectionLabel('Server'),
          ListGroup(
            children: [
              ListRow(icon: CupertinoIcons.globe, label: 'Backend', value: Uri.parse(AppConfig.baseUrl).host, chevron: false),
              const ListRow(icon: CupertinoIcons.info, label: 'Versi aplikasi', value: AppConfig.version, chevron: false),
            ],
          ),
          if (me != null) ...[
            const SectionLabel('Zona berbahaya'),
            ListGroup(
              children: [
                ListRow(icon: CupertinoIcons.square_arrow_right, label: 'Keluar dari perangkat ini', onTap: _logout),
                ListRow(icon: CupertinoIcons.trash, label: 'Hapus akun', sub: 'Semua API key ikut dihapus permanen', danger: true, onTap: _delete),
              ],
            ),
          ],
          const SizedBox(height: 8),
          Center(
            child: Text('${AppConfig.appName} · ${AppConfig.brand}', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
          ),
        ],
      ),
    );
  }
}
