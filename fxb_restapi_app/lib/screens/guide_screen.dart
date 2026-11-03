import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';
import '../widgets/code.dart';
import '../widgets/common.dart';
import '../widgets/page.dart';

/// Panduan: fitur, cara kerja, FAQ, tips (app/guide/page.tsx).
class GuideScreen extends StatefulWidget {
  const GuideScreen({super.key, this.section});
  final String? section;
  @override
  State<GuideScreen> createState() => _GuideScreenState();
}

class _GuideScreenState extends State<GuideScreen> {
  final _keys = {'features': GlobalKey(), 'how': GlobalKey(), 'faq': GlobalKey(), 'tips': GlobalKey()};

  @override
  void initState() {
    super.initState();
    final s = widget.section;
    if (s != null && _keys[s] != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 380));
        final c = _keys[s]!.currentContext;
        if (c != null && c.mounted) {
          await Scrollable.ensureVisible(c, duration: Motion.of(c, 500), curve: Springs.smooth, alignment: 0.08);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    const features = [
      (CupertinoIcons.cloud_download, 'Downloader', 'TikTok (video/foto/audio), Instagram, YouTube, Facebook, Pinterest, X, SoundCloud, AIO.'),
      (CupertinoIcons.sparkles, 'AI', 'Chat, coding, asisten multi-turn, translate, summarize, text generator, multi-model.'),
      (CupertinoIcons.photo, 'AI Image', 'Text to image, style generator, img2img, remove background, upscale, enhance.'),
      (CupertinoIcons.smiley, 'Entertainment', 'Joke, fakta, truth/dare, trivia, tebak-tebakan, quote card, TTP, meme, anime, komik, musik, lirik.'),
      (
        CupertinoIcons.wrench,
        'Stalker & Tools',
        'Profil GitHub/TikTok/npm, metadata web, DNS, WHOIS, IP, shortener, QR, screenshot, encoder, hash, JSON, upload, cuaca, kurs.',
      ),
      (CupertinoIcons.checkmark_shield, 'Keamanan', 'Key di-hash SHA-256, rate limit per menit & harian, proteksi SSRF, webhook terverifikasi.'),
    ];
    const faq = [
      ('Apakah gratis?', 'Ya. Key free punya limit harian dan hanya bisa memakai endpoint free. Premium membuka semua endpoint dan limit lebih besar.'),
      (
        "Kenapa sebuah endpoint berstatus 'Belum aktif'?",
        'Endpoint itu butuh penyedia eksternal (mis. AI, remove.bg, Cobalt) yang kredensialnya belum diatur admin. Kami tidak berpura-pura endpoint berfungsi.',
      ),
      ('Di mana key saya disimpan?', "Hanya hash SHA-256 yang disimpan di server. Key asli ditampilkan sekali saat dibuat; jika hilang, gunakan 'Buat ulang'."),
      ('Bisa dipakai dari browser (frontend)?', 'Bisa (CORS aktif), tapi jangan taruh key premium di kode frontend publik. Panggil dari server/bot.'),
      ('Kapan limit reset?', 'Setiap 00:00 WIB. Cek header X-RateLimit-Remaining dan X-RateLimit-Reset.'),
    ];
    const tips = [
      ('401', 'Tambahkan ?apikey= atau header X-API-Key. Pastikan key tidak dicabut / sudah dibuat ulang.'),
      ('403', 'Endpoint premium atau akun ditangguhkan. Upgrade key di Pricing.'),
      ('429', 'Limit tercapai. Hormati header Retry-After, beri jeda antar request di bot.'),
      ('400', 'Lihat error.details untuk parameter yang salah.'),
      ('502/504', 'Penyedia eksternal lambat/gagal. Coba lagi beberapa saat; tidak dihitung sebagai kesalahanmu.'),
      ('503', 'Endpoint maintenance atau belum dikonfigurasi admin.'),
    ];
    return FxPage(
      title: 'Panduan',
      subtitle: 'Fitur, cara kerja, FAQ, dan troubleshooting FxB RestApi.',
      children: [
        SectionLabel('Fitur', key: _keys['features']),
        for (final f in features)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: FxCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: fx.mintSoft, shape: BoxShape.circle),
                    child: Icon(f.$1, color: fx.mint, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f.$2, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                        const SizedBox(height: 2),
                        Text(f.$3, style: TextStyle(color: fx.muted, fontSize: 14)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        SectionLabel('Cara kerja', key: _keys['how']),
        const FxCard(
          child: Steps([
            StepData('Daftar & dapatkan key', FxStep.done, sub: 'Key free dibuat otomatis saat daftar.'),
            StepData('Kirim request', FxStep.done, sub: 'GET/POST /api/v1/{kategori}/{endpoint}'),
            StepData('Server memvalidasi', FxStep.done, sub: 'Key, tier, limit, lalu parameter.'),
            StepData('Terima JSON', FxStep.done, sub: '{ "status": true, "creator": "FELIXIORITY", "result": … }'),
          ]),
        ),
        const SizedBox(height: 12),
        CodeBlock(
          lang: 'javascript',
          code:
              '// Node.js / bot WhatsApp & Telegram\nconst API = "${AppConfig.baseUrl}/api/v1";\nconst KEY = process.env.FXB_API_KEY;\n\n'
              'async function fxb(path, params = {}) {\n  const res = await fetch(`\${API}/\${path}?` + new URLSearchParams(params), {\n    headers: { "X-API-Key": KEY },\n  });\n'
              '  const data = await res.json();\n  if (!data.status) throw new Error(data.error.message);\n  return data.result;\n}\n\n'
              'const video = await fxb("downloader/tiktok", { url: "https://vt.tiktok.com/..." });\nconsole.log(video);',
        ),
        SectionLabel('FAQ', key: _keys['faq']),
        for (final q in faq)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _FaqTile(q: q.$1, a: q.$2),
          ),
        SectionLabel('Tips & troubleshooting', key: _keys['tips']),
        ListGroup(
          children: [
            for (final t in tips)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 70,
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.bolt_fill, size: 13, color: fx.danger),
                          const SizedBox(width: 3),
                          Text(
                            t.$1,
                            style: TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, color: fx.danger),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Text(t.$2, style: TextStyle(color: fx.muted, fontSize: 14.5)),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        FxCard(
          child: Row(
            children: [
              Icon(CupertinoIcons.lock, color: fx.mint),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Simpan key di variabel lingkungan (.env), bukan di repository publik.', style: TextStyle(color: fx.muted)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FaqTile extends StatefulWidget {
  const _FaqTile({required this.q, required this.a});
  final String q;
  final String a;
  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _open = false;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return FxCard(
      onTap: () => setState(() => _open = !_open),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(widget.q, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15.5)),
              ),
              AnimatedRotation(
                turns: _open ? 0.125 : 0,
                duration: Motion.of(context, 300),
                curve: Springs.snappy,
                child: Icon(Icons.add_rounded, color: fx.muted),
              ),
            ],
          ),
          AnimatedSize(
            duration: Motion.of(context, 320),
            curve: Springs.smooth,
            alignment: Alignment.topCenter,
            child: _open
                ? Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(widget.a, style: TextStyle(color: fx.muted, fontSize: 14.5, height: 1.4)),
                  )
                : const SizedBox(width: double.infinity),
          ),
        ],
      ),
    );
  }
}
