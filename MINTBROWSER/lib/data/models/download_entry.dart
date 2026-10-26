import 'package:flutter/foundation.dart';

enum DownloadStatus { pending, running, paused, success, failed, missing }

@immutable
class DownloadEntry {
  const DownloadEntry({
    required this.id,
    required this.url,
    required this.fileName,
    required this.createdAt,
    this.mimeType = '',
    this.status = DownloadStatus.pending,
    this.downloadedBytes = 0,
    this.totalBytes = -1,
  });

  /// Android DownloadManager id.
  final int id;
  final String url;
  final String fileName;
  final String mimeType;
  final DateTime createdAt;
  final DownloadStatus status;
  final int downloadedBytes;
  final int totalBytes;

  bool get isActive =>
      status == DownloadStatus.pending ||
      status == DownloadStatus.running ||
      status == DownloadStatus.paused;

  double? get fraction =>
      totalBytes > 0 ? (downloadedBytes / totalBytes).clamp(0.0, 1.0) : null;

  DownloadEntry copyWith({
    String? fileName,
    String? mimeType,
    DownloadStatus? status,
    int? downloadedBytes,
    int? totalBytes,
  }) =>
      DownloadEntry(
        id: id,
        url: url,
        fileName: fileName ?? this.fileName,
        mimeType: mimeType ?? this.mimeType,
        createdAt: createdAt,
        status: status ?? this.status,
        downloadedBytes: downloadedBytes ?? this.downloadedBytes,
        totalBytes: totalBytes ?? this.totalBytes,
      );

  Map<String, Object?> toJson() => {
        'id': id,
        'url': url,
        'fileName': fileName,
        'mimeType': mimeType,
        'createdAt': createdAt.millisecondsSinceEpoch,
        'status': status.name,
        'downloaded': downloadedBytes,
        'total': totalBytes,
      };

  factory DownloadEntry.fromJson(Map<String, Object?> j) => DownloadEntry(
        id: (j['id'] as num).toInt(),
        url: j['url'] as String? ?? '',
        fileName: j['fileName'] as String? ?? 'download',
        mimeType: j['mimeType'] as String? ?? '',
        createdAt: DateTime.fromMillisecondsSinceEpoch((j['createdAt'] as num?)?.toInt() ?? 0),
        status: DownloadStatus.values.where((s) => s.name == j['status']).firstOrNull ??
            DownloadStatus.pending,
        downloadedBytes: (j['downloaded'] as num?)?.toInt() ?? 0,
        totalBytes: (j['total'] as num?)?.toInt() ?? -1,
      );
}
