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
import '../auth/auth_screen.dart';
import '../explorer/result_links.dart';
import 'order_detail_screen.dart';

/// Paket & checkout (app/pricing/page.tsx): POST /api/orders lalu buka halaman pembayaran.
class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key, this.keyId});
  final String? keyId;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return FxPage(
      title: 'Paket',
      subtitle: 'Upgrade key ke premium. Aktif otomatis setelah pembayaran terverifikasi.',
      children: [
        const SizedBox(height: 14),
        Loader<PlansInfo>(
          load: () async => PlansInfo.fromJson(await app.api.get('/api/plans') as Map),
          skeleton: const SkeletonList(count: 3, height: 150),
          builder: (context, info, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FxCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text('Free', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                        ),
                        const Pill('Rp0'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _feature(fx, '${fmtNum(info.freeDaily)} request/hari'),
                    _feature(fx, '${info.freeRpm} request/menit'),
                    _feature(fx, 'Maks. ${info.maxFreeKeys} key free'),
                    _feature(fx, 'Endpoint tier free'),
                  ],
                ),
              ),
              for (final p in info.plans)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: FxCard(
                    border: fx.mint.withValues(alpha: 0.35),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                            ),
                            Pill(fmtIDR(p.price), tone: Tone.mint),
                          ],
                        ),
                        if (p.description.isNotEmpty) ...[const SizedBox(height: 4), Text(p.description, style: TextStyle(color: fx.muted, fontSize: 14))],
                        const SizedBox(height: 10),
                        _feature(fx, '${fmtNum(p.dailyLimit)} request/hari'),
                        _feature(fx, '${fmtNum(p.rpmLimit)} request/menit'),
                        _feature(fx, 'Masa aktif ${p.durationDays} hari (perpanjangan menambah sisa masa aktif)'),
                        _feature(fx, 'Semua endpoint, termasuk premium'),
                        const SizedBox(height: 14),
                        FxButton('Pilih ${p.name}', big: true, expand: true, onTap: () => _checkout(context, p, info)),
                      ],
                    ),
                  ),
                ),
              if (info.plans.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: FxCard(
                    child: Text('Belum ada paket premium yang aktif.', style: TextStyle(color: fx.muted)),
                  ),
                ),
              const SectionLabel('Metode pembayaran'),
              if (info.gateways.isEmpty)
                FxCard(
                  child: Text('Admin belum mengaktifkan metode pembayaran.', style: TextStyle(color: fx.muted)),
                )
              else
                ListGroup(
                  children: [for (final g in info.gateways) ListRow(icon: CupertinoIcons.creditcard, label: g.name, sub: g.description)],
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _feature(Fx fx, String t) => Padding(
    padding: const EdgeInsets.only(top: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.check_rounded, size: 18, color: fx.mint),
        const SizedBox(width: 8),
        Expanded(child: Text(t, style: const TextStyle(fontSize: 14.5))),
      ],
    ),
  );

  Future<void> _checkout(BuildContext context, Plan plan, PlansInfo info) async {
    final app = App.of(context);
    if (app.me.value == null) {
      toast('Login dulu untuk membeli paket.', kind: ToastKind.info);
      push(context, const AuthScreen());
      return;
    }
    if (info.gateways.isEmpty) {
      toast('Belum ada metode pembayaran yang aktif.', kind: ToastKind.warn);
      return;
    }
    final order = await showFxSheet<Order>(
      context,
      title: 'Checkout',
      subtitle: '${plan.name} · ${fmtIDR(plan.price)} · ${plan.durationDays} hari',
      builder: (ctx) => _CheckoutSheet(plan: plan, gateways: info.gateways, preferredKey: keyId),
    );
    if (order == null || !context.mounted) return;
    if (order.paymentUrl != null && order.paymentUrl!.isNotEmpty) await openExternal(order.paymentUrl!);
    if (context.mounted) push(context, OrderDetailScreen(orderId: order.id));
  }
}

class _CheckoutSheet extends StatefulWidget {
  const _CheckoutSheet({required this.plan, required this.gateways, this.preferredKey});
  final Plan plan;
  final List<PayGateway> gateways;
  final String? preferredKey;
  @override
  State<_CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<_CheckoutSheet> {
  List<ApiKeyInfo>? _keys;
  String? _key;
  late String _gateway = widget.gateways.first.id;
  bool _busy = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      final d = await App.of(context).api.get('/api/keys');
      final keys = (d as List).whereType<Map>().map(ApiKeyInfo.new).where((k) => k.active).toList();
      if (!mounted) return;
      setState(() {
        _keys = keys;
        _key = keys.any((k) => k.id == widget.preferredKey) ? widget.preferredKey : (keys.isEmpty ? null : keys.first.id);
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _pay() async {
    if (_busy || _key == null) return; // satu kali kirim, tanpa retry otomatis
    setState(() => _busy = true);
    try {
      final r = await App.of(context).api.post('/api/orders', {'planId': widget.plan.id, 'keyId': _key, 'gateway': _gateway});
      if (mounted) Navigator.pop(context, Order(r as Map));
    } on ApiException catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    if (_error != null) return ErrorView(error: _error!, onRetry: _load);
    if (_keys == null) return const SkeletonList(count: 3, height: 60);
    if (_keys!.isEmpty) {
      return const EmptyState(icon: CupertinoIcons.lock_shield, title: 'Belum ada API key aktif', text: 'Buat key dulu, lalu upgrade ke premium.');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'API key yang di-upgrade',
          style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
        ),
        const SizedBox(height: 8),
        ListGroup(
          children: [
            for (final k in _keys!)
              ListRow(
                label: k.name,
                sub: '${k.prefix}… · ${k.premium ? 'Premium ${k.planName ?? ''}' : 'Free'}',
                chevron: false,
                trailing: Icon(_key == k.id ? CupertinoIcons.largecircle_fill_circle : CupertinoIcons.circle, color: fx.mint),
                onTap: () => setState(() => _key = k.id),
              ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Metode pembayaran',
          style: TextStyle(fontWeight: FontWeight.w600, color: fx.fg),
        ),
        const SizedBox(height: 8),
        ListGroup(
          children: [
            for (final g in widget.gateways)
              ListRow(
                label: g.name,
                sub: g.description,
                chevron: false,
                trailing: Icon(_gateway == g.id ? CupertinoIcons.largecircle_fill_circle : CupertinoIcons.circle, color: fx.mint),
                onTap: () => setState(() => _gateway = g.id),
              ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          _gateway == 'manual'
              ? 'Order dibuat lalu instruksi transfer ditampilkan. Admin memverifikasi pembayaran secara manual.'
              : 'Halaman pembayaran ${widget.gateways.firstWhere((g) => g.id == _gateway).name} akan dibuka di browser. Premium aktif otomatis setelah pembayaran terverifikasi.',
          style: TextStyle(color: fx.muted, fontSize: 13.5),
        ),
        const SizedBox(height: 18),
        FxButton('Bayar ${fmtIDR(widget.plan.price)}', icon: CupertinoIcons.lock, big: true, expand: true, loading: _busy, onTap: _pay),
      ],
    );
  }
}
