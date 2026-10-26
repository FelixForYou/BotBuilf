import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/url_utils.dart';

/// Site favicon with a lettered fallback tile.
class SiteIcon extends StatelessWidget {
  const SiteIcon({super.key, required this.url, this.size = 40, this.fetch = true, this.radius});

  final String url;
  final double size;

  /// Set to false in private tabs so no favicon request is made.
  final bool fetch;
  final double? radius;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final host = UrlUtils.host(url);
    final letter = host.isEmpty ? '?' : host[0].toUpperCase();
    final fallback = Center(
      child: Text(
        letter,
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w700,
          fontSize: size * 0.42,
          color: c.accentInk,
        ),
      ),
    );
    final uri = Uri.tryParse(url);
    final canFetch = fetch && uri != null && uri.host.isNotEmpty && UrlUtils.isWeb(url);
    final px = (size * MediaQuery.devicePixelRatioOf(context)).round();
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius ?? size * 0.3),
      child: Container(
        width: size,
        height: size,
        color: c.elevated,
        child: !canFetch
            ? fallback
            : Image.network(
                '${uri.scheme}://${uri.host}/favicon.ico',
                width: size,
                height: size,
                cacheWidth: px,
                fit: BoxFit.contain,
                filterQuality: FilterQuality.medium,
                errorBuilder: (_, _, _) => fallback,
                frameBuilder: (context, child, frame, sync) {
                  if (sync) return Padding(padding: EdgeInsets.all(size * 0.22), child: child);
                  return AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: frame == null
                        ? fallback
                        : Padding(padding: EdgeInsets.all(size * 0.22), child: child),
                  );
                },
              ),
      ),
    );
  }
}
