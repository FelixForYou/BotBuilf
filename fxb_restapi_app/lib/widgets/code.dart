import 'dart:convert';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'common.dart';
import 'feedback.dart';

/// Blok kode dengan label bahasa, tombol salin, dan scroll horizontal.
class CodeBlock extends StatelessWidget {
  const CodeBlock({super.key, required this.code, this.lang = 'code', this.json = false, this.maxHeight});
  final String code;
  final String lang;
  final bool json;
  final double? maxHeight;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    // Batasi teks yang dirender agar respons besar tidak membuat UI patah-patah.
    final shown = code.length > 60000 ? '${code.substring(0, 60000)}\n… (dipotong, ${code.length} karakter — salin untuk versi lengkap)' : code;
    final text = SelectableText.rich(
      json ? highlightJson(shown, fx) : TextSpan(text: shown),
      style: TextStyle(fontFamily: kMono, fontSize: 12.8, height: 1.5, color: fx.fg),
    );
    final body = SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.fromLTRB(16, 4, 16, 16), child: text);
    return Container(
      decoration: BoxDecoration(
        color: fx.dark ? const Color(0xFF151517) : const Color(0xFFF7F8F9),
        borderRadius: BorderRadius.circular(R.card),
        border: Border.all(color: fx.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 6, 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    lang,
                    style: TextStyle(fontFamily: kMono, fontSize: 12, color: fx.muted),
                  ),
                ),
                Pressable(
                  onTap: () => copyText(code),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.copy_rounded, size: 16, color: fx.mint),
                        const SizedBox(width: 5),
                        Text(
                          'Salin',
                          style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (maxHeight != null)
            ConstrainedBox(
              constraints: BoxConstraints(maxHeight: maxHeight!),
              child: SingleChildScrollView(child: body),
            )
          else
            body,
        ],
      ),
    );
  }
}

String prettyJson(Object? v) {
  try {
    return const JsonEncoder.withIndent('  ').convert(v);
  } catch (_) {
    return '$v';
  }
}

/// Pewarnaan JSON sederhana: key, string, angka, boolean/null.
TextSpan highlightJson(String src, Fx fx) {
  final keyC = fx.mint;
  final strC = fx.dark ? const Color(0xFFE6C07B) : const Color(0xFFB45309);
  final numC = fx.dark ? const Color(0xFF8AB4F8) : const Color(0xFF1D4ED8);
  final litC = fx.dark ? const Color(0xFFF28B82) : const Color(0xFFB91C1C);
  final re = RegExp(r'("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)');
  final spans = <TextSpan>[];
  var last = 0;
  for (final m in re.allMatches(src)) {
    if (m.start > last) spans.add(TextSpan(text: src.substring(last, m.start)));
    if (m.group(1) != null) {
      final isKey = m.group(2) != null;
      spans.add(
        TextSpan(
          text: m.group(1),
          style: TextStyle(color: isKey ? keyC : strC),
        ),
      );
      if (isKey) spans.add(TextSpan(text: m.group(2)));
    } else if (m.group(3) != null) {
      spans.add(
        TextSpan(
          text: m.group(3),
          style: TextStyle(color: litC),
        ),
      );
    } else {
      spans.add(
        TextSpan(
          text: m.group(4),
          style: TextStyle(color: numC),
        ),
      );
    }
    last = m.end;
  }
  if (last < src.length) spans.add(TextSpan(text: src.substring(last)));
  return TextSpan(children: spans);
}

/// Kumpulkan semua URL http(s) di dalam JSON hasil (untuk tombol buka/salin).
List<String> collectUrls(Object? v, {int limit = 12}) {
  final out = <String>{};
  void walk(Object? x) {
    if (out.length >= limit) return;
    if (x is String) {
      if ((x.startsWith('http://') || x.startsWith('https://')) && x.length < 2048 && !x.contains(' ')) out.add(x);
    } else if (x is Map) {
      for (final e in x.values) {
        walk(e);
      }
    } else if (x is List) {
      for (final e in x) {
        walk(e);
      }
    }
  }

  walk(v);
  return out.toList();
}

bool looksLikeImage(String url) => RegExp(r'\.(png|jpe?g|webp|gif)(\?|$)', caseSensitive: false).hasMatch(url);
bool looksLikeSvg(String url) => RegExp(r'\.svg(\?|$)', caseSensitive: false).hasMatch(url);
