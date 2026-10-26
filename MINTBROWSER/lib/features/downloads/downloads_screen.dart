import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/url_utils.dart';
import '../../data/models/download_entry.dart';
import '../../router.dart';
import '../../state/downloads_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/sheets.dart';
import '../../widgets/status_view.dart';
import '../../widgets/toast.dart';

IconData _iconFor(DownloadEntry d) {
  final m = d.mimeType.toLowerCase();
  final name = d.fileName.toLowerCase();
  if (m.startsWith('image/')) return LucideIcons.image;
  if (m.startsWith('video/')) return LucideIcons.video;
  if (m.startsWith('audio/')) return LucideIcons.music;
  if (name.endsWith('.apk') || m == 'application/vnd.android.package-archive') return LucideIcons.package;
  if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z') || m.contains('zip')) {
    return LucideIcons.fileArchive;
  }
  return LucideIcons.fileText;
}

class DownloadsScreen extends ConsumerStatefulWidget {
  const DownloadsScreen({super.key});

  @override
  ConsumerState<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends ConsumerState<DownloadsScreen> {
  @override
  void initState() {
    super.initState();
    // Pick up anything that finished while the app was closed.
    Future.microtask(() => ref.read(downloadsProvider.notifier).refresh());
  }

  Future<void> _open(DownloadEntry d) async {
    if (d.status != DownloadStatus.success) return;
    final ok = await ref.read(downloadsProvider.notifier).open(d);
    if (!ok && mounted) {
      MintToast.show(
        context,
        title: 'No app can open this file',
        message: d.fileName,
        kind: ToastKind.warning,
      );
    }
  }

  Future<void> _actions(DownloadEntry d) {
    final n = ref.read(downloadsProvider.notifier);
    return showMintSheet<void>(
      context,
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                TileIcon(_iconFor(d), size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(d.fileName, maxLines: 2, overflow: TextOverflow.ellipsis, style: sheet.text.titleMedium),
                      Text(UrlUtils.display(d.url), maxLines: 1, style: sheet.text.labelMedium),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GroupedCard(children: [
              if (d.status == DownloadStatus.success)
                GroupedTile(
                  icon: LucideIcons.externalLink,
                  title: 'Open',
                  onTap: () {
                    Navigator.of(sheet).pop();
                    _open(d);
                  },
                ),
              GroupedTile(
                icon: LucideIcons.copy,
                title: 'Copy download link',
                chevron: false,
                onTap: () {
                  Navigator.of(sheet).pop();
                  Clipboard.setData(ClipboardData(text: d.url));
                  MintToast.show(context, title: 'Link copied', kind: ToastKind.success);
                },
              ),
              GroupedTile(
                icon: d.isActive ? LucideIcons.ban : LucideIcons.listChecks,
                title: d.isActive ? 'Cancel download' : 'Remove from list',
                chevron: false,
                onTap: () {
                  Navigator.of(sheet).pop();
                  n.remove(d, deleteFile: d.isActive);
                },
              ),
              if (d.status == DownloadStatus.success)
                GroupedTile(
                  icon: LucideIcons.trash2,
                  title: 'Delete file',
                  destructive: true,
                  chevron: false,
                  onTap: () async {
                    Navigator.of(sheet).pop();
                    final ok = await confirmDialog(
                      context,
                      title: 'Delete file?',
                      message: '${d.fileName} will be removed from your Downloads folder.',
                      confirmLabel: 'Delete',
                      destructive: true,
                      icon: LucideIcons.trash2,
                    );
                    if (ok) await n.remove(d, deleteFile: true);
                  },
                ),
            ]),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = ref.watch(downloadsProvider);
    final finished = list.where((d) => !d.isActive).length;
    return Scaffold(
      appBar: MintTopBar(
        title: 'Downloads',
        actions: [
          if (finished > 0)
            MintIconButton(
              icon: LucideIcons.listChecks,
              tooltip: 'Clear finished',
              onPressed: () => ref.read(downloadsProvider.notifier).clearList(),
            ),
        ],
      ),
      body: list.isEmpty
          ? StatusView(
              icon: LucideIcons.download,
              title: 'No downloads',
              message: 'Files you download are saved to your phone’s Downloads folder and listed here.',
              actionLabel: 'Start browsing',
              onAction: () => context.go(Routes.browser),
            )
          : RefreshIndicator(
              color: context.mint.accent,
              backgroundColor: context.mint.card,
              onRefresh: () => ref.read(downloadsProvider.notifier).refresh(),
              child: ListView(
                padding: EdgeInsets.only(bottom: 32 + MediaQuery.paddingOf(context).bottom),
                children: [
                  ContentWidth(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('Saved to Downloads'),
                        GroupedCard(children: [
                          for (final d in list)
                            _DownloadTile(
                              key: ValueKey(d.id),
                              entry: d,
                              onTap: () => d.status == DownloadStatus.success ? _open(d) : _actions(d),
                              onMore: () => _actions(d),
                            ),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _DownloadTile extends StatelessWidget {
  const _DownloadTile({super.key, required this.entry, required this.onTap, required this.onMore});

  final DownloadEntry entry;
  final VoidCallback onTap;
  final VoidCallback onMore;

  String _status() {
    final d = entry;
    return switch (d.status) {
      DownloadStatus.pending => 'Waiting…',
      DownloadStatus.running => d.totalBytes > 0
          ? '${Formatters.bytes(d.downloadedBytes)} of ${Formatters.bytes(d.totalBytes)}'
          : '${Formatters.bytes(d.downloadedBytes)} downloaded',
      DownloadStatus.paused => 'Paused · waiting for network',
      DownloadStatus.success =>
        '${d.totalBytes > 0 ? '${Formatters.bytes(d.totalBytes)} · ' : ''}${Formatters.shortDate(d.createdAt)}',
      DownloadStatus.failed => 'Failed · tap for options',
      DownloadStatus.missing => 'Removed from device',
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final failed = entry.status == DownloadStatus.failed || entry.status == DownloadStatus.missing;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 6, 12),
        child: Row(
          children: [
            TileIcon(_iconFor(entry), color: failed ? c.error : null),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.fileName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _status(),
                    style: context.text.labelMedium?.copyWith(color: failed ? c.error : null),
                  ),
                  AnimatedSize(
                    duration: Motion.quick,
                    child: entry.isActive
                        ? Padding(
                            padding: const EdgeInsets.only(top: 8, right: 8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(3),
                              child: TweenAnimationBuilder<double>(
                                tween: Tween(end: entry.fraction ?? 0),
                                duration: const Duration(milliseconds: 600),
                                curve: Curves.easeOut,
                                builder: (context, v, _) => LinearProgressIndicator(
                                  minHeight: 4,
                                  value: entry.fraction == null ? null : v,
                                  color: c.accent,
                                  backgroundColor: c.elevated,
                                ),
                              ),
                            ),
                          )
                        : const SizedBox(width: double.infinity),
                  ),
                ],
              ),
            ),
            MintIconButton(
              icon: LucideIcons.ellipsis,
              tooltip: 'More',
              size: 40,
              color: c.textSecondary,
              onPressed: onMore,
            ),
          ],
        ),
      ),
    );
  }
}
