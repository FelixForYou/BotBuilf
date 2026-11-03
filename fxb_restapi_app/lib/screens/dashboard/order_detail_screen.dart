import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import '../explorer/result_links.dart';
import 'orders_screen.dart';

/// Invoice (app/dashboard/orders/[id]/page.tsx): status, instruksi manual, batalkan.
class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;
  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final _loader = GlobalKey<LoaderState<Order>>();
  bool _busy = false;

  Future<void> _cancel(Order o) async {
    final ok = await confirmSheet(context, title: 'Batalkan order?', text: 'Order ${o.invoiceNo} akan dibatalkan.', confirm: 'Batalkan order', danger: true);
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    try {
      await App.of(context).api.post('/api/orders/${o.id}', {'action': 'cancel'});
      toast('Order dibatalkan.', kind: ToastKind.info);
      await _loader.currentState?.reload();
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    return FxPage(
      title: 'Invoice',
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        const SizedBox(height: 14),
        Loader<Order>(
          key: _loader,
          load: () async => Order((await app.api.get('/api/orders/${widget.orderId}')) as Map),
          builder: (context, o, reload) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FxCard(
                radius: R.big,
                child: Column(
                  children: [
                    Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(color: o.status == 'paid' ? fx.mintSoft : (o.pending ? fx.warnSoft : fx.card2), shape: BoxShape.circle),
                      child: Icon(
                        o.status == 'paid' ? CupertinoIcons.checkmark_alt : (o.pending ? CupertinoIcons.clock : CupertinoIcons.xmark),
                        color: o.status == 'paid' ? fx.mint : (o.pending ? fx.warn : fx.muted),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(fmtIDR(o.amount), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Pill(orderLabel(o.status), tone: orderTone(o.status)),
                    const SizedBox(height: 10),
                    SelectableText(
                      o.invoiceNo,
                      style: TextStyle(fontFamily: kMono, color: fx.muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              ListGroup(
                children: [
                  _row('Paket', o.planName ?? '${o.raw['plan_id']}', fx),
                  _row('API key', '${o.keyName ?? '-'} (${o.keyPrefix ?? '-'}…)', fx),
                  _row('Aksi', o.action == 'renew' ? 'Perpanjang' : 'Upgrade', fx),
                  _row('Metode', o.gateway, fx),
                  _row('Dibuat', fmtDate(o.createdAt, withTime: true), fx),
                  if (o.paidAt != null) _row('Dibayar', fmtDate(o.paidAt, withTime: true), fx),
                  if (o.pending) _row('Bayar sebelum', fmtDate(o.expiresAt, withTime: true), fx),
                  if (o.raw['key_expires'] != null && o.status == 'paid') _row('Premium s/d', fmtDate(o.raw['key_expires']), fx),
                ],
              ),
              if (o.note != null && o.note!.isNotEmpty) ...[
                const SizedBox(height: 12),
                FxCard(
                  child: Text(o.note!, style: TextStyle(color: fx.muted)),
                ),
              ],
              if (o.pending && o.gateway == 'manual' && (o.manualInfo ?? '').isNotEmpty) ...[
                const SectionLabel('Instruksi pembayaran'),
                FxCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SelectableText(o.manualInfo!, style: const TextStyle(fontSize: 15, height: 1.45)),
                      const SizedBox(height: 10),
                      Text(
                        'Sertakan nomor invoice ${o.invoiceNo} saat konfirmasi. Admin akan memverifikasi pembayaran.',
                        style: TextStyle(color: fx.muted, fontSize: 13.5),
                      ),
                      const SizedBox(height: 8),
                      LinkText('Salin nomor invoice', onTap: () => copyText(o.invoiceNo)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),
              if (o.pending && (o.paymentUrl ?? '').isNotEmpty) ...[
                FxButton(
                  'Buka halaman pembayaran',
                  icon: CupertinoIcons.arrow_up_right_square,
                  big: true,
                  expand: true,
                  onTap: () => openExternal(o.paymentUrl!),
                ),
                const SizedBox(height: 10),
              ],
              if (o.pending) ...[
                FxButton('Cek status pembayaran', icon: CupertinoIcons.arrow_clockwise, big: true, expand: true, variant: BtnVariant.secondary, onTap: reload),
                const SizedBox(height: 10),
                FxButton('Batalkan order', big: true, expand: true, variant: BtnVariant.danger, loading: _busy, onTap: () => _cancel(o)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _row(String k, String v, Fx fx) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
    child: Row(
      children: [
        Text(k, style: TextStyle(color: fx.muted)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            v,
            textAlign: TextAlign.right,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
      ],
    ),
  );
}
