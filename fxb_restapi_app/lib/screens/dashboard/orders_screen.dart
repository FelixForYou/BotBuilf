import 'package:flutter/cupertino.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'order_detail_screen.dart';
import 'pricing_screen.dart';

Tone orderTone(String s) => switch (s) {
  'paid' => Tone.mint,
  'pending' => Tone.warn,
  'failed' => Tone.danger,
  _ => Tone.neutral,
};

String orderLabel(String s) => switch (s) {
  'paid' => 'lunas',
  'pending' => 'menunggu',
  'expired' => 'kedaluwarsa',
  'cancelled' => 'dibatalkan',
  'failed' => 'gagal',
  _ => s,
};

/// Riwayat order (app/dashboard/orders/page.tsx).
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final loader = GlobalKey<LoaderState<List<Order>>>();

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return FxPage(
      title: 'Riwayat order',
      subtitle: 'Invoice & status pembayaran premium.',
      onRefresh: () async => loader.currentState?.reload(),
      children: [
        const SizedBox(height: 14),
        Loader<List<Order>>(
          key: loader,
          load: () async => ((await app.api.get('/api/orders')) as List).whereType<Map>().map(Order.new).toList(),
          builder: (context, orders, reload) => orders.isEmpty
              ? EmptyState(
                  icon: CupertinoIcons.doc_plaintext,
                  title: 'Belum ada order',
                  text: 'Upgrade key ke premium untuk limit lebih besar.',
                  action: FxButton('Lihat paket', onTap: () => push(context, const PricingScreen())),
                )
              : Column(
                  children: [
                    for (final o in orders)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: FxCard(
                          padding: const EdgeInsets.all(16),
                          onTap: () => push(context, OrderDetailScreen(orderId: o.id)).then((_) => reload()),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      o.invoiceNo,
                                      style: const TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, fontSize: 13.5),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${o.planName ?? o.raw['plan_id']} · ${o.keyName ?? o.keyPrefix ?? '-'}',
                                      style: TextStyle(color: fx.muted, fontSize: 13.5),
                                    ),
                                    Text(fmtDate(o.createdAt, withTime: true), style: TextStyle(color: fx.subtle, fontSize: 12.5)),
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
      ],
    );
  }
}
