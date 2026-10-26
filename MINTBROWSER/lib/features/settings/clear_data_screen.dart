import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../state/core_providers.dart';
import '../../state/downloads_provider.dart';
import '../../state/history_provider.dart';
import '../../state/site_permissions_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/toast.dart';
import 'search_engine_screen.dart';

enum _Item { history, cookies, cache, downloads, permissions }

class ClearDataScreen extends ConsumerStatefulWidget {
  const ClearDataScreen({super.key});

  @override
  ConsumerState<ClearDataScreen> createState() => _ClearDataScreenState();
}

class _ClearDataScreenState extends ConsumerState<ClearDataScreen> {
  final _selected = {_Item.history, _Item.cache};
  bool _busy = false;

  Future<void> _clear() async {
    final ok = await confirmDialog(
      context,
      title: 'Clear selected data?',
      message: _selected.contains(_Item.cookies)
          ? 'You’ll be signed out of most sites. This can’t be undone.'
          : 'This can’t be undone.',
      confirmLabel: 'Clear',
      destructive: true,
      icon: LucideIcons.eraser,
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    try {
      if (_selected.contains(_Item.history)) await ref.read(historyProvider.notifier).clear();
      if (_selected.contains(_Item.downloads)) ref.read(downloadsProvider.notifier).clearList();
      if (_selected.contains(_Item.permissions)) ref.read(sitePermissionsProvider.notifier).resetAll();
      final cookies = _selected.contains(_Item.cookies);
      final cache = _selected.contains(_Item.cache);
      if (cookies || cache) {
        await ref.read(nativeBridgeProvider).clearBrowsingData(
              cookies: cookies,
              cache: cache,
              storage: cookies,
            );
      }
      if (!mounted) return;
      MintToast.show(context, title: 'Browsing data cleared', kind: ToastKind.success);
      context.pop();
    } catch (e) {
      if (mounted) {
        MintToast.show(context, title: 'Couldn’t clear everything', message: '$e', kind: ToastKind.error);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final historyCount = ref.watch(historyProvider.select((h) => h.length));
    final downloadCount = ref.watch(downloadsProvider.select((d) => d.length));
    final siteCount = ref.watch(sitePermissionsProvider.select((p) => p.length));

    Widget item(_Item i, IconData icon, String title, String subtitle) => GroupedTile(
          icon: icon,
          title: title,
          subtitle: subtitle,
          trailing: SelectionCheck(selected: _selected.contains(i)),
          onTap: () => setState(() => _selected.contains(i) ? _selected.remove(i) : _selected.add(i)),
        );

    return Scaffold(
      appBar: const MintTopBar(title: 'Clear browsing data'),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: [
                ContentWidth(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('All time'),
                      GroupedCard(children: [
                        item(_Item.history, LucideIcons.history, 'Browsing history', '$historyCount pages'),
                        item(_Item.cookies, LucideIcons.cookie, 'Cookies and site data', 'Signs you out of most sites'),
                        item(_Item.cache, LucideIcons.image, 'Cached images and files', 'Pages may load slower next time'),
                        item(_Item.downloads, LucideIcons.download, 'Download list', '$downloadCount items · files stay on the device'),
                        item(_Item.permissions, LucideIcons.shieldCheck, 'Site permissions', '$siteCount sites'),
                      ]),
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(LucideIcons.info, size: 15, color: c.textSecondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Bookmarks and settings are kept. Private tabs erase their own data when closed.',
                              style: context.text.labelMedium,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: ContentWidth(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: MintButton(
                  label: 'Clear data',
                  loading: _busy,
                  onPressed: _selected.isEmpty ? null : _clear,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
