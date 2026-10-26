import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/platform/native_bridge.dart';
import '../core/utils/url_utils.dart';
import '../data/models/download_entry.dart';
import '../data/storage/prefs_store.dart';
import 'core_providers.dart';

final downloadsProvider =
    NotifierProvider<DownloadsNotifier, List<DownloadEntry>>(DownloadsNotifier.new);

class DownloadException implements Exception {
  const DownloadException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Mirrors Android DownloadManager jobs started from the browser.
class DownloadsNotifier extends Notifier<List<DownloadEntry>> {
  Timer? _poll;

  NativeBridge get _bridge => ref.read(nativeBridgeProvider);
  PrefsStore get _store => ref.read(prefsStoreProvider);

  @override
  List<DownloadEntry> build() {
    ref.onDispose(() => _poll?.cancel());
    final saved = ref.read(prefsStoreProvider).readList(PrefsStore.downloadsKey);
    final list = saved.map(DownloadEntry.fromJson).toList();
    if (list.any((d) => d.isActive)) Future.microtask(_ensurePolling);
    return list;
  }

  Future<DownloadEntry> start(NativeDownloadRequest request, {required String profile}) async {
    final url = request.url;
    if (url.startsWith('blob:')) {
      throw const DownloadException('This site builds the file in the page, which can’t be saved.');
    }
    if (!UrlUtils.isWeb(url)) {
      throw const DownloadException('Only web links can be downloaded.');
    }
    final r = await _bridge.enqueueDownload(
      url: url,
      userAgent: request.userAgent,
      contentDisposition: request.contentDisposition,
      mimeType: request.mimeType,
      profile: profile,
    );
    if (r == null) throw const DownloadException('The download service is unavailable.');
    final entry = DownloadEntry(
      id: r.id,
      url: url,
      fileName: r.fileName.isEmpty ? UrlUtils.fileNameFromUrl(url) : r.fileName,
      mimeType: request.mimeType,
      createdAt: DateTime.now(),
      totalBytes: request.contentLength,
    );
    _set([entry, ...state]);
    _ensurePolling();
    return entry;
  }

  Future<void> refresh() async {
    if (state.isEmpty) return;
    final statuses = await _bridge.queryDownloads(state.map((d) => d.id).toList());
    final byId = {for (final s in statuses) s.id: s};
    var changed = false;
    final next = [
      for (final d in state)
        () {
          final s = byId[d.id];
          // Entry removed from the system (cleared by the user elsewhere).
          if (s == null) {
            if (d.status == DownloadStatus.missing) return d;
            changed = true;
            return d.copyWith(status: DownloadStatus.missing);
          }
          if (s.status == d.status &&
              s.downloaded == d.downloadedBytes &&
              s.total == d.totalBytes &&
              (s.fileName.isEmpty || s.fileName == d.fileName)) {
            return d;
          }
          changed = true;
          return d.copyWith(
            status: s.status,
            downloadedBytes: s.downloaded,
            totalBytes: s.total,
            fileName: s.fileName.isEmpty ? null : s.fileName,
            mimeType: s.mimeType.isEmpty ? null : s.mimeType,
          );
        }(),
    ];
    if (changed) _set(next);
    if (!next.any((d) => d.isActive)) {
      _poll?.cancel();
      _poll = null;
    }
  }

  void _ensurePolling() {
    _poll ??= Timer.periodic(const Duration(milliseconds: 800), (_) => refresh());
  }

  Future<bool> open(DownloadEntry d) => _bridge.openDownload(d.id);

  Future<void> remove(DownloadEntry d, {bool deleteFile = false}) async {
    await _bridge.removeDownload(d.id, deleteFile: deleteFile);
    _set(state.where((e) => e.id != d.id).toList());
  }

  /// Forgets finished entries; files stay in the Downloads folder.
  void clearList() => _set(state.where((d) => d.isActive).toList());

  void _set(List<DownloadEntry> next) {
    state = next;
    _store.write(PrefsStore.downloadsKey, next.map((d) => d.toJson()).toList());
  }
}
