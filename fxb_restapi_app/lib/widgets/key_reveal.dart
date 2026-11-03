import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'common.dart';
import 'feedback.dart';

/// Menampilkan API key sekali (components/key-reveal.tsx).
class KeyReveal extends StatelessWidget {
  const KeyReveal({super.key, required this.secret, this.savedOnDevice = true});
  final String secret;
  final bool savedOnDevice;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: fx.warnSoft, borderRadius: BorderRadius.circular(18)),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(CupertinoIcons.exclamationmark_triangle, color: fx.warn, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Salin dan simpan key ini sekarang. Server hanya menyimpan hash-nya, jadi key tidak bisa ditampilkan lagi dari website.'
                  '${savedOnDevice ? ' Salinan juga disimpan terenkripsi di perangkat ini untuk API Explorer.' : ''}',
                  style: TextStyle(fontSize: 14, color: fx.fg, height: 1.35),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(18)),
          child: SelectableText(
            secret,
            style: const TextStyle(fontFamily: kMono, fontSize: 15, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 12),
        FxButton(
          'Salin key',
          icon: Icons.copy_rounded,
          big: true,
          expand: true,
          variant: BtnVariant.secondary,
          onTap: () => copyText(secret, done: 'API key disalin.'),
        ),
      ],
    );
  }
}
