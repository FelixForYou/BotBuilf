import 'package:flutter/cupertino.dart';

import '../../core/format.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'admin_screen.dart';

/// Admin › Pengguna: GET /api/admin/users?q=, PATCH/DELETE /api/admin/users/{id}.
class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final _loader = GlobalKey<LoaderState<List<Map>>>();
  String _q = '';

  Future<void> _actions(Map u) async {
    final app = App.of(context);
    final id = '${u['id']}';
    final isAdmin = u['role'] == 'admin';
    final banned = u['status'] == 'banned';
    final self = app.me.value?.id == id;
    final action = await showFxSheet<String>(
      context,
      title: '${u['name']}',
      subtitle: '${u['email']}',
      builder: (ctx) => ListGroup(
        children: [
          if (!self)
            ListRow(icon: CupertinoIcons.checkmark_shield, label: isAdmin ? 'Jadikan user biasa' : 'Jadikan admin', onTap: () => Navigator.pop(ctx, 'role')),
          if (!self)
            ListRow(
              icon: banned ? CupertinoIcons.play_circle : CupertinoIcons.pause_circle,
              label: banned ? 'Aktifkan kembali' : 'Tangguhkan akun',
              sub: banned ? null : 'Semua sesi pengguna ini ikut keluar',
              onTap: () => Navigator.pop(ctx, 'status'),
            ),
          if (!self) ListRow(icon: CupertinoIcons.trash, label: 'Hapus pengguna', danger: true, onTap: () => Navigator.pop(ctx, 'delete')),
          if (self) const ListRow(icon: CupertinoIcons.info, label: 'Ini akunmu sendiri', sub: 'Ubah akun sendiri lewat Pengaturan.'),
        ],
      ),
    );
    if (action == null || !mounted) return;
    if (action == 'delete') {
      final ok = await confirmSheet(
        context,
        title: 'Hapus pengguna?',
        text: 'Akun ${u['email']} beserta API key, sesi, sesi chat, dan task video akan dihapus permanen.',
        confirm: 'Hapus',
        danger: true,
      );
      if (!ok) return;
      await runAdmin(() => app.api.delete('/api/admin/users/$id'), done: 'Pengguna dihapus.');
    } else if (action == 'role') {
      await runAdmin(() => app.api.patch('/api/admin/users/$id', {'role': isAdmin ? 'user' : 'admin'}), done: 'Role diperbarui.');
    } else {
      await runAdmin(
        () => app.api.patch('/api/admin/users/$id', {'status': banned ? 'active' : 'banned'}),
        done: banned ? 'Akun diaktifkan.' : 'Akun ditangguhkan.',
      );
    }
    await _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Pengguna',
        onRefresh: () async => _loader.currentState?.reload(),
        children: [
          const SizedBox(height: 12),
          AdminSearch(
            hint: 'Cari email atau nama…',
            onSearch: (v) {
              setState(() => _q = v);
              _loader.currentState?.reload();
            },
          ),
          const SizedBox(height: 14),
          Loader<List<Map>>(
            key: _loader,
            load: () async => ((await app.api.get('/api/admin/users', query: _q.isEmpty ? null : {'q': _q})) as List).whereType<Map>().toList(),
            builder: (context, list, _) => list.isEmpty
                ? const EmptyState(icon: CupertinoIcons.person_2, title: 'Tidak ada pengguna')
                : ListGroup(
                    children: [
                      for (final u in list)
                        ListRow(
                          label: '${u['name']}',
                          sub:
                              '${u['email']} · ${asInt(u['keys'])} key${asInt(u['premium']) > 0 ? ' · ${asInt(u['premium'])} premium' : ''} · ${fmtDate(u['created_at'])}',
                          trailing: Wrap(
                            spacing: 4,
                            children: [
                              if (u['role'] == 'admin') const Pill('admin', tone: Tone.mint),
                              if (u['status'] == 'banned') const Pill('ditangguhkan', tone: Tone.danger),
                            ],
                          ),
                          onTap: () => _actions(u),
                        ),
                    ],
                  ),
          ),
          const SizedBox(height: 8),
          Text('Menampilkan maksimal 200 pengguna terbaru.', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
        ],
      ),
    );
  }
}
