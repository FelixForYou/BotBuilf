import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/app_theme.dart';
import '../../widgets/code.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';

Future<void> openExternal(String url) async {
  final u = Uri.tryParse(url);
  if (u == null || !(u.scheme == 'https' || u.scheme == 'http')) {
    toast('Tautan tidak valid.', kind: ToastKind.warn);
    return;
  }
  final ok = await launchUrl(u, mode: LaunchMode.externalApplication);
  if (!ok) toast('Tidak ada aplikasi untuk membuka tautan ini.', kind: ToastKind.warn);
}

/// Tautan hasil (file upload, short link, media downloader, video) + pratinjau gambar.
class ResultLinks extends StatelessWidget {
  const ResultLinks({super.key, required this.urls});
  final List<String> urls;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final images = urls.where(looksLikeImage).take(3).toList();
    return FxCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.link, color: fx.mint, size: 18),
              const SizedBox(width: 8),
              Text('Tautan hasil (${urls.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          if (images.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 150,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: GestureDetector(
                    onTap: () => openExternal(images[i]),
                    child: Image.network(
                      images[i],
                      height: 150,
                      cacheHeight: 300,
                      fit: BoxFit.cover,
                      loadingBuilder: (c, w, p) => p == null
                          ? w
                          : Container(
                              width: 150,
                              color: fx.card2,
                              child: const Center(child: CupertinoActivityIndicator()),
                            ),
                      errorBuilder: (_, _, _) => Container(
                        width: 150,
                        color: fx.card2,
                        alignment: Alignment.center,
                        child: Icon(CupertinoIcons.photo, color: fx.subtle),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 6),
          for (final u in urls)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      u,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                    ),
                  ),
                  FxIconButton(CupertinoIcons.arrow_up_right_square, size: 36, tooltip: 'Buka', onTap: () => openExternal(u)),
                  FxIconButton(
                    Icons.copy_rounded,
                    size: 36,
                    tooltip: 'Salin',
                    onTap: () => copyText(u, done: 'Tautan disalin.'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
