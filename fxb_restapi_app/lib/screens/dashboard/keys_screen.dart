import 'package:flutter/cupertino.dart';

import '../../core/api_exception.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../theme/motion.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/key_reveal.dart';
import '../../widgets/page.dart';
import 'pricing_screen.dart';

/// Pengelola API key (app/dashboard/keys/page.tsx): buat, ganti nama, buat ulang, cabut.
class KeysScreen extends StatefulWidget {
  const KeysScreen({super.key, this.openCreate = false});
  final bool openCreate;
  @override
  State<KeysScreen> createState() => _KeysScreenState();
}

class _KeysScreenState extends State<KeysScreen> {
  late final AppState app = App.of(context);
  final _loader = GlobalKey<LoaderState<List<ApiKeyInfo>>>();
  bool _showRevoked = false;
  Set<String> _onDevice = {};

  @override
  void initState() {
    super.initState();
    if (widget.openCreate) WidgetsBinding.instance.addPostFrameCallback((_) => _create());
  }

  Future<List<ApiKeyInfo>> _fetch() async {
    final d = await app.api.get('/api/keys');
    final saved = await app.api.store.readSavedKeys();
    _onDevice = saved.keys.toSet();
    return (d as List).whereType<Map>().map(ApiKeyInfo.new).toList();
  }

  Future<void> _reload() async {
    await _loader.currentState?.reload();
    app.refreshMe().ignore();
  }

  Future<void> _create() async {
    final secret = await showFxSheet<String>(context, title: 'Create', builder: (ctx) => const _CreateKeySheet());
    if (secret != null) await _reload();
  }

  Future<void> _rename(ApiKeyInfo k) async {
    final ctrl = TextEditingController(text: k.name);
    await showFxSheet<void>(
      context,
      title: 'Ganti nama key',
      builder: (ctx) => BusyForm(
        builder: (busy, run) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FxField(controller: ctrl, label: 'Nama', maxLength: 40, autofocus: true),
            const SizedBox(height: 18),
            FxButton(
              'Simpan',
              big: true,
              expand: true,
              loading: busy,
              onTap: () => run(() async {
                final name = ctrl.text.trim();
                if (name.isEmpty) throw ApiException('BAD_REQUEST', 'Nama key wajib diisi.');
                await app.api.patch('/api/keys/${k.id}', {'name': name});
                toast('Nama key diperbarui.');
                if (ctx.mounted) Navigator.pop(ctx);
              }),
            ),
          ],
        ),
      ),
    );
    ctrl.dispose();
    await _reload();
  }

  Future<void> _regenerate(ApiKeyInfo k) async {
    final ok = await confirmSheet(
      context,
      title: 'Buat ulang key?',
      text: 'Key lama ${k.prefix}… langsung tidak berlaku. Tier, paket, dan masa aktif tetap sama.',
      confirm: 'Buat ulang',
    );
    if (!ok || !mounted) return;
    try {
      final r = await app.api.patch('/api/keys/${k.id}', {'action': 'regenerate'});
      final secret = (r as Map)['key'] as String;
      await app.api.store.saveKey(k.id, secret);
      if (!mounted) return;
      await showFxSheet<void>(
        context,
        title: 'Key baru',
        builder: (ctx) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            KeyReveal(secret: secret),
            const SizedBox(height: 12),
            FxButton('Sudah disimpan', big: true, expand: true, onTap: () => Navigator.pop(ctx)),
          ],
        ),
      );
    } catch (e) {
      toastError(e);
    }
    await _reload();
  }

  Future<void> _revoke(ApiKeyInfo k) async {
    final ok = await confirmSheet(
      context,
      title: 'Cabut API key?',
      text: 'Key ${k.name} akan berhenti bekerja permanen. Status premium pada key ini juga ikut berhenti.',
      confirm: 'Cabut',
      danger: true,
    );
    if (!ok) return;
    try {
      await app.api.delete('/api/keys/${k.id}');
      await app.api.store.removeKey(k.id);
      toast('Key dicabut.', kind: ToastKind.info);
    } catch (e) {
      toastError(e);
    }
    await _reload();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return FxPage(
      title: 'API Key',
      subtitle: 'Buat, ganti, cabut, dan upgrade key.',
      onRefresh: _reload,
      actions: [FxIconButton(CupertinoIcons.add, tooltip: 'Buat key', onTap: _create)],
      children: [
        const SizedBox(height: 14),
        Loader<List<ApiKeyInfo>>(
          key: _loader,
          load: _fetch,
          skeleton: const SkeletonList(count: 2, height: 200),
          builder: (context, keys, reload) {
            final list = keys.where((k) => _showRevoked || k.active).toList();
            final revoked = keys.where((k) => !k.active).length;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (list.isEmpty)
                  EmptyState(
                    icon: CupertinoIcons.lock_shield,
                    title: 'Belum ada API key aktif',
                    text: 'Buat key gratis untuk mulai memanggil endpoint.',
                    action: FxButton('Buat API key', icon: CupertinoIcons.add, onTap: _create),
                  ),
                for (var i = 0; i < list.length; i++)
                  FadeIn(
                    key: ValueKey(list[i].id),
                    delay: i * 40,
                    child: Padding(padding: const EdgeInsets.only(bottom: 14), child: _keyCard(list[i], fx)),
                  ),
                if (revoked > 0)
                  Center(
                    child: LinkText(
                      '${_showRevoked ? 'Sembunyikan' : 'Tampilkan'} $revoked key yang dicabut',
                      onTap: () => setState(() => _showRevoked = !_showRevoked),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        FxCard(
          child: Text(
            'Cara pakai: tambahkan ?apikey=KEY pada URL, atau header X-API-Key: KEY. Server menyimpan key dalam bentuk hash — tidak bisa ditampilkan lagi. '
            'Key yang dibuat atau dibuat ulang di aplikasi ini juga disimpan terenkripsi di perangkat untuk API Explorer. Jika hilang, gunakan Buat ulang.',
            style: TextStyle(color: fx.muted, fontSize: 14, height: 1.4),
          ),
        ),
      ],
    );
  }

  Widget _keyCard(ApiKeyInfo k, Fx fx) {
    return AnimatedOpacity(
      duration: Motion.of(context, 200),
      opacity: k.active ? 1 : 0.55,
      child: FxCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(color: k.premium ? fx.mint : fx.mintSoft, borderRadius: BorderRadius.circular(16)),
                  child: Icon(k.premium ? CupertinoIcons.star_fill : CupertinoIcons.lock_shield, color: k.premium ? fx.mintInk : fx.mint),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        k.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (!k.active)
                            const Pill('revoked', tone: Tone.danger)
                          else
                            Pill(k.premium ? 'Premium · ${k.planName ?? ''}' : 'Free', tone: k.premium ? Tone.mint : Tone.neutral),
                          if (k.premiumExpired) const Pill('premium berakhir', tone: Tone.warn),
                          if (_onDevice.contains(k.id) && k.active) const Pill('tersimpan di perangkat', icon: CupertinoIcons.device_phone_portrait),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${k.prefix}••••••••••••••••',
                        style: TextStyle(fontFamily: kMono, fontSize: 13, color: fx.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (k.active) ...[
              const SizedBox(height: 16),
              ProgressBar(value: k.usedToday / (k.daily <= 0 ? 1 : k.daily) * 100),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text('${fmtNum(k.usedToday)} / ${fmtNum(k.daily)} hari ini', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                  ),
                  Text('${k.rpm}/menit', style: TextStyle(fontSize: 12.5, color: fx.muted)),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(18)),
                child: StatGrid(transparent: true, [
                  StatItem(fmtDate(k.createdAt), 'Dibuat'),
                  StatItem(fmtRel(k.lastUsedAt), 'Terakhir dipakai'),
                  StatItem(k.premium ? fmtDate(k.expiresAt) : '—', 'Berlaku s/d'),
                ]),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FxButton('Ganti nama', small: true, icon: CupertinoIcons.pencil, variant: BtnVariant.secondary, onTap: () => _rename(k)),
                  FxButton('Buat ulang', small: true, icon: CupertinoIcons.arrow_2_circlepath, variant: BtnVariant.secondary, onTap: () => _regenerate(k)),
                  FxButton(
                    k.premium ? 'Perpanjang' : 'Upgrade',
                    small: true,
                    icon: CupertinoIcons.sparkles,
                    onTap: () => push(context, PricingScreen(keyId: k.id)),
                  ),
                  FxButton('Cabut', small: true, icon: CupertinoIcons.nosign, variant: BtnVariant.danger, onTap: () => _revoke(k)),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Sheet "Create · Step 1 of 2" → "Step 2 of 2 · Simpan key kamu".
class _CreateKeySheet extends StatefulWidget {
  const _CreateKeySheet();
  @override
  State<_CreateKeySheet> createState() => _CreateKeySheetState();
}

class _CreateKeySheetState extends State<_CreateKeySheet> {
  final _name = TextEditingController();
  String _kind = 'free';
  bool _busy = false;
  String? _secret;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _go() async {
    if (_kind == 'premium') {
      Navigator.pop(context);
      push(context, const PricingScreen());
      return;
    }
    if (_busy) return;
    setState(() => _busy = true);
    final app = App.of(context);
    try {
      final r = await app.api.post('/api/keys', {'name': _name.text.trim().isEmpty ? 'My key' : _name.text.trim()}) as Map;
      final secret = r['key'] as String;
      await app.api.store.saveKey('${r['id']}', secret);
      if (mounted) setState(() => _secret = secret);
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final step2 = _secret != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(step2 ? 'Step 2 of 2 · Simpan key kamu' : 'Step 1 of 2 · Atur API key', style: TextStyle(color: fx.muted, fontSize: 14)),
        const SizedBox(height: 16),
        AnimatedSwitcher(
          duration: Motion.of(context, 320),
          transitionBuilder: (c, a) => FadeTransition(
            opacity: a,
            child: SlideTransition(
              position: Tween(begin: const Offset(0.08, 0), end: Offset.zero).animate(a),
              child: c,
            ),
          ),
          child: step2
              ? Column(
                  key: const ValueKey(2),
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    KeyReveal(secret: _secret!),
                    const SizedBox(height: 14),
                    FxButton('Selesai', big: true, expand: true, onTap: () => Navigator.pop(context, _secret)),
                  ],
                )
              : Column(
                  key: const ValueKey(1),
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Segmented<String>(value: _kind, options: const [('free', 'Free'), ('premium', 'Premium')], onChanged: (v) => setState(() => _kind = v)),
                    const SizedBox(height: 14),
                    FxField(controller: _name, hint: 'Nama key (mis. Bot WhatsApp)', maxLength: 40),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: fx.mint, borderRadius: BorderRadius.circular(14)),
                      child: Row(
                        children: [
                          Icon(_kind == 'free' ? CupertinoIcons.lock_shield : CupertinoIcons.star_fill, size: 30, color: fx.mintInk),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _kind == 'free' ? 'FREE KEY' : 'PREMIUM KEY',
                                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: fx.mintInk),
                                ),
                                Text(
                                  _kind == 'free' ? 'Aktif langsung · limit harian free' : 'Pilih paket & bayar · aktif otomatis',
                                  style: TextStyle(fontSize: 13.5, color: fx.mintInk.withValues(alpha: 0.8)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    Text(
                      _kind == 'free' ? 'Key baru langsung bisa dipakai.' : 'Kamu akan diarahkan ke halaman paket.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: fx.muted),
                    ),
                    const SizedBox(height: 14),
                    FxButton('Continue', big: true, expand: true, loading: _busy, onTap: _go),
                  ],
                ),
        ),
      ],
    );
  }
}
