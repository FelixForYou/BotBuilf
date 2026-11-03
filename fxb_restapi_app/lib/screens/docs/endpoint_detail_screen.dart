import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../config/app_config.dart';
import '../../core/snippets.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/category_icon.dart';
import '../../widgets/code.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import '../explorer/runner_screen.dart';

/// Detail endpoint: parameter, contoh kode, contoh respons, Try API (app/docs/[...slug]).
class EndpointDetailScreen extends StatefulWidget {
  const EndpointDetailScreen({super.key, required this.endpoint});
  final Endpoint endpoint;
  @override
  State<EndpointDetailScreen> createState() => _EndpointDetailScreenState();
}

class _EndpointDetailScreenState extends State<EndpointDetailScreen> {
  String _lang = 'cURL';

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final e = widget.endpoint;
    final code = snippets(e, AppConfig.baseUrl);
    final url = '${AppConfig.baseUrl}${e.path}';
    return FxPage(
      title: e.name,
      subtitle: e.group,
      bottom: Glass(
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
          child: FxButton(
            e.online ? 'Try API' : (e.status == 'maintenance' ? 'Sedang perbaikan' : 'Belum dikonfigurasi'),
            icon: CupertinoIcons.play_fill,
            big: true,
            expand: true,
            onTap: e.online ? () => push(context, RunnerScreen(endpoint: e)) : null,
          ),
        ),
      ),
      children: [
        const SizedBox(height: 14),
        FxCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  MethodPill(e.method),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      e.path,
                      style: const TextStyle(fontFamily: kMono, fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ),
                  FxIconButton(
                    Icons.copy_rounded,
                    tooltip: 'Salin URL',
                    size: 36,
                    onTap: () => copyText(url, done: 'URL endpoint disalin.'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  Pill(e.tier, tone: e.premium ? Tone.mint : Tone.neutral, icon: e.premium ? CupertinoIcons.star_fill : null),
                  Pill(switch (e.status) {
                    'online' => 'online',
                    'maintenance' => 'perbaikan',
                    _ => 'belum aktif',
                  }, tone: e.online ? Tone.mint : Tone.warn),
                  Pill('respons: ${e.response}'),
                  Pill(e.category, icon: categoryIcon(e.category)),
                  if (e.provider != null) Pill(e.provider!),
                ],
              ),
              const SizedBox(height: 14),
              Text(e.description, style: TextStyle(fontSize: 15, color: fx.muted, height: 1.45)),
              if (e.note != null && e.note!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: fx.warnSoft, borderRadius: BorderRadius.circular(14)),
                  child: Row(
                    children: [
                      Icon(CupertinoIcons.wrench, size: 18, color: fx.warn),
                      const SizedBox(width: 8),
                      Expanded(child: Text(e.note!, style: const TextStyle(fontSize: 14))),
                    ],
                  ),
                ),
              ],
              if (!e.online) ...[
                const SizedBox(height: 12),
                Text(
                  e.status == 'maintenance'
                      ? 'Endpoint ini dinonaktifkan sementara oleh admin (HTTP 503 MAINTENANCE).'
                      : 'Penyedia untuk endpoint ini belum dikonfigurasi di server, sehingga request akan dibalas 503 PROVIDER_UNAVAILABLE.',
                  style: TextStyle(color: fx.warn, fontSize: 13.5),
                ),
              ],
            ],
          ),
        ),
        SectionLabel('Parameter (${e.params.length})'),
        if (e.params.isEmpty)
          FxCard(
            child: Text('Tidak ada parameter. Cukup sertakan API key.', style: TextStyle(color: fx.muted)),
          )
        else
          ListGroup(
            children: [
              for (final p in e.params)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 13, 16, 13),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            p.name,
                            style: const TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, fontSize: 14.5),
                          ),
                          Pill(p.type),
                          if (p.required) const Pill('wajib', tone: Tone.warn) else Text('opsional', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(p.description, style: TextStyle(color: fx.muted, fontSize: 14)),
                      if (p.options != null && p.options!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Pilihan: ${p.options!.join(', ')}',
                            style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                          ),
                        ),
                      if ((p.example ?? '').isNotEmpty || (p.defaultValue ?? '').isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            [
                              if ((p.example ?? '').isNotEmpty) 'Contoh: ${p.example}',
                              if ((p.defaultValue ?? '').isNotEmpty) 'Default: ${p.defaultValue}',
                            ].join(' · '),
                            style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.subtle),
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        const SectionLabel('Autentikasi'),
        FxCard(
          child: Text(
            'Tambahkan ?apikey=KEY_ANDA pada URL, atau header X-API-Key: KEY_ANDA, atau Authorization: Bearer KEY_ANDA.',
            style: TextStyle(color: fx.muted, fontSize: 14.5, height: 1.4),
          ),
        ),
        const SectionLabel('Contoh kode'),
        Segmented<String>(value: _lang, options: [for (final k in code.keys) (k, k == 'JavaScript' ? 'JS' : k)], onChanged: (v) => setState(() => _lang = v)),
        const SizedBox(height: 10),
        Swap(
          child: CodeBlock(key: ValueKey(_lang), code: code[_lang]!, lang: _lang.toLowerCase()),
        ),
        const SectionLabel('Contoh respons'),
        CodeBlock(
          json: true,
          lang: 'json · 200',
          code: e.response == 'json' ? prettyJson({'status': true, 'creator': AppConfig.brand, 'endpoint': e.id, 'result': e.example}) : prettyJson(e.example),
        ),
        const SizedBox(height: 90),
      ],
    );
  }
}
