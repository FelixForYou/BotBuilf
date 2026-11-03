import 'package:flutter/cupertino.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import '../dashboard/orders_screen.dart';
import 'admin_screen.dart';

/// Admin › Pembayaran: GET /api/admin/orders?status=, POST /api/admin/orders/{id} {action}.
class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});
  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  final _loader = GlobalKey<LoaderState<List<Order>>>();
  String _status = '';

  Future<void> _act(Order o) async {
    final app = App.of(context);
    final action = await showFxSheet<String>(
      context,
      title: o.invoiceNo,
      subtitle: '${o.email ?? '-'} · ${fmtIDR(o.amount)} · ${o.gateway}',
      builder: (ctx) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListGroup(
            children: [
              ListRow(label: 'Paket', value: o.planName ?? '-', chevron: false),
              ListRow(label: 'Key', value: '${o.keyPrefix ?? '-'}…', chevron: false),
              ListRow(label: 'Status', value: orderLabel(o.status), chevron: false),
              ListRow(label: 'Dibuat', value: fmtDate(o.createdAt, withTime: true), chevron: false),
              if (o.note != null) ListRow(label: 'Catatan', sub: o.note, chevron: false),
            ],
          ),
          const SizedBox(height: 16),
          if (o.status == 'pending' || o.status == 'expired')
            FxButton(
              'Tandai lunas (verifikasi manual)',
              icon: CupertinoIcons.checkmark_alt,
              big: true,
              expand: true,
              onTap: () => Navigator.pop(ctx, 'mark_paid'),
            ),
          if (o.pending) ...[
            const SizedBox(height: 10),
            FxButton('Batalkan order', big: true, expand: true, variant: BtnVariant.danger, onTap: () => Navigator.pop(ctx, 'cancel')),
          ],
        ],
      ),
    );
    if (action == null || !mounted) return;
    if (action == 'mark_paid') {
      final ok = await confirmSheet(
        context,
        title: 'Tandai lunas?',
        text: 'Premium pada key ${o.keyPrefix}… akan aktif/diperpanjang sesuai paket. Pastikan dana sudah diterima.',
        confirm: 'Tandai lunas',
      );
      if (!ok) return;
    }
    await runAdmin(
      () => app.api.post('/api/admin/orders/${o.id}', {'action': action}),
      done: action == 'mark_paid' ? 'Order ditandai lunas.' : 'Order dibatalkan.',
    );
    await _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final app = App.of(context);
    final fx = Fx.of(context);
    return AdminGuard(
      child: FxPage(
        title: 'Pembayaran',
        onRefresh: () async => _loader.currentState?.reload(),
        padding: EdgeInsets.zero,
        children: [
          const SizedBox(height: 12),
          ChipBar(
            items: const [
              ('', 'Semua'),
              ('pending', 'Menunggu'),
              ('paid', 'Lunas'),
              ('expired', 'Kedaluwarsa'),
              ('cancelled', 'Dibatalkan'),
              ('failed', 'Gagal'),
            ],
            selected: _status,
            onSelect: (v) {
              setState(() => _status = v);
              _loader.currentState?.reload();
            },
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Loader<List<Order>>(
              key: _loader,
              load: () async => ((await app.api.get('/api/admin/orders', query: _status.isEmpty ? null : {'status': _status})) as List)
                  .whereType<Map>()
                  .map(Order.new)
                  .toList(),
              builder: (context, list, _) => list.isEmpty
                  ? const EmptyState(icon: CupertinoIcons.creditcard, title: 'Tidak ada order')
                  : Column(
                      children: [
                        for (final o in list)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: FxCard(
                              padding: const EdgeInsets.all(16),
                              onTap: () => _act(o),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          o.invoiceNo,
                                          style: const TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, fontSize: 13),
                                        ),
                                        Text(
                                          '${o.email ?? '-'} · ${o.planName ?? '-'}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(color: fx.muted, fontSize: 13),
                                        ),
                                        Text('${o.gateway} · ${fmtDate(o.createdAt, withTime: true)}', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(fmtIDR(o.amount), style: const TextStyle(fontWeight: FontWeight.w700)),
                                      const SizedBox(height: 4),
                                      Pill(orderLabel(o.status), tone: orderTone(o.status)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
