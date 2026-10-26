import 'package:flutter/foundation.dart';

/// Main-frame load failure shown with the error page.
@immutable
class PageError {
  const PageError({
    required this.url,
    required this.type,
    required this.description,
    this.code,
  });

  final String url;

  /// Name of the platform error type (e.g. `hostLookup`, `timeout`).
  final String type;
  final String description;
  final int? code;
}

@immutable
class BrowserTab {
  const BrowserTab({
    required this.id,
    this.url = '',
    this.title = '',
    this.isPrivate = false,
    this.showHome = true,
    this.progress = 0,
    this.isLoading = false,
    this.canGoBack = false,
    this.canGoForward = false,
    this.error,
    this.thumbnail,
    required this.lastActive,
  });

  final String id;

  /// Last committed URL; empty for a fresh new-tab page.
  final String url;
  final String title;
  final bool isPrivate;

  /// Whether the new-tab page is shown instead of the web content.
  final bool showHome;
  final double progress;
  final bool isLoading;
  final bool canGoBack;
  final bool canGoForward;
  final PageError? error;
  final Uint8List? thumbnail;
  final DateTime lastActive;

  bool get isBlank => url.isEmpty;

  String get displayTitle {
    if (showHome || url.isEmpty) return isPrivate ? 'Private tab' : 'New tab';
    if (title.isNotEmpty && title != url) return title;
    final uri = Uri.tryParse(url);
    return (uri?.host.isNotEmpty ?? false) ? uri!.host : url;
  }

  BrowserTab copyWith({
    String? url,
    String? title,
    bool? showHome,
    double? progress,
    bool? isLoading,
    bool? canGoBack,
    bool? canGoForward,
    PageError? error,
    bool clearError = false,
    Uint8List? thumbnail,
    DateTime? lastActive,
  }) {
    return BrowserTab(
      id: id,
      url: url ?? this.url,
      title: title ?? this.title,
      isPrivate: isPrivate,
      showHome: showHome ?? this.showHome,
      progress: progress ?? this.progress,
      isLoading: isLoading ?? this.isLoading,
      canGoBack: canGoBack ?? this.canGoBack,
      canGoForward: canGoForward ?? this.canGoForward,
      error: clearError ? null : (error ?? this.error),
      thumbnail: thumbnail ?? this.thumbnail,
      lastActive: lastActive ?? this.lastActive,
    );
  }

  /// Only what is needed to restore a normal tab after a restart.
  Map<String, Object?> toJson() => {
        'id': id,
        'url': url,
        'title': title,
        'lastActive': lastActive.millisecondsSinceEpoch,
      };

  factory BrowserTab.fromJson(Map<String, Object?> j) {
    final url = j['url'] as String? ?? '';
    return BrowserTab(
      id: j['id'] as String,
      url: url,
      title: j['title'] as String? ?? '',
      showHome: url.isEmpty,
      lastActive: DateTime.fromMillisecondsSinceEpoch((j['lastActive'] as num?)?.toInt() ?? 0),
    );
  }
}
