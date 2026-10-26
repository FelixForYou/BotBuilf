import 'package:flutter/foundation.dart';

@immutable
class Bookmark {
  const Bookmark({
    required this.url,
    required this.title,
    required this.createdAt,
    this.favorite = false,
  });

  final String url;
  final String title;
  final DateTime createdAt;

  /// Favorites appear as quick-access tiles on the new-tab page.
  final bool favorite;

  Bookmark copyWith({String? title, bool? favorite}) => Bookmark(
        url: url,
        title: title ?? this.title,
        createdAt: createdAt,
        favorite: favorite ?? this.favorite,
      );

  Map<String, Object?> toJson() => {
        'url': url,
        'title': title,
        'createdAt': createdAt.millisecondsSinceEpoch,
        'favorite': favorite,
      };

  factory Bookmark.fromJson(Map<String, Object?> j) => Bookmark(
        url: j['url'] as String,
        title: j['title'] as String? ?? '',
        createdAt: DateTime.fromMillisecondsSinceEpoch((j['createdAt'] as num?)?.toInt() ?? 0),
        favorite: j['favorite'] as bool? ?? false,
      );
}
