import 'package:flutter/foundation.dart';

@immutable
class HistoryEntry {
  const HistoryEntry({required this.url, required this.title, required this.visitedAt});

  final String url;
  final String title;
  final DateTime visitedAt;

  HistoryEntry copyWith({String? title, DateTime? visitedAt}) => HistoryEntry(
        url: url,
        title: title ?? this.title,
        visitedAt: visitedAt ?? this.visitedAt,
      );

  Map<String, Object?> toJson() => {
        'u': url,
        't': title,
        'v': visitedAt.millisecondsSinceEpoch,
      };

  factory HistoryEntry.fromJson(Map<String, Object?> j) => HistoryEntry(
        url: j['u'] as String,
        title: j['t'] as String? ?? '',
        visitedAt: DateTime.fromMillisecondsSinceEpoch((j['v'] as num?)?.toInt() ?? 0),
      );
}
