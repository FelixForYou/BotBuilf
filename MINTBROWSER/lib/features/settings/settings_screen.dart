import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../router.dart';
import '../../state/bookmarks_provider.dart';
import '../../state/core_providers.dart';
import '../../state/downloads_provider.dart';
import '../../state/history_provider.dart';
import '../../state/settings_provider.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_switch.dart';
import '../../widgets/pressable.dart';

const appVersion = '1.0.0';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(settingsProvider);
    final n = ref.read(settingsProvider.notifier);

    Widget toggle(IconData icon, String title, bool value, ValueChanged<bool> set, {String? subtitle}) =>
        GroupedTile(
          icon: icon,
          title: title,
          subtitle: subtitle,
          trailing: MintSwitch(value: value, onChanged: set, label: title),
          onTap: () => set(!value),
        );

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            LargeTitleHeader(title: 'Settings', onClose: () => context.pop()),
            Expanded(
              child: ListView(
                padding: EdgeInsets.only(bottom: 32 + MediaQuery.paddingOf(context).bottom),
                children: [
                  ContentWidth(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('Your library'),
                        const _LibraryStats(),
                        const SectionLabel('General'),
                        GroupedCard(children: [
                          GroupedTile(
                            icon: LucideIcons.search,
                            title: 'Search engine',
                            value: s.searchEngine.label,
                            onTap: () => context.push(Routes.searchEngine),
                          ),
                          GroupedTile(
                            icon: LucideIcons.moon,
                            title: 'Appearance',
                            value: s.appearance.label,
                            onTap: () => context.push(Routes.appearance),
                          ),
                          GroupedTile(
                            icon: LucideIcons.aArrowUp,
                            title: 'Text size',
                            value: '${s.textZoom}%',
                            onTap: () => context.push(Routes.textSize),
                          ),
                        ]),
                        const SectionLabel('Browsing'),
                        GroupedCard(children: [
                          toggle(
                            LucideIcons.rotateCcw,
                            'Restore tabs on launch',
                            s.restoreTabs,
                            (v) => n.update((x) => x.copyWith(restoreTabs: v)),
                          ),
                          toggle(
                            LucideIcons.monitor,
                            'Desktop site',
                            s.desktopMode,
                            (v) => n.update((x) => x.copyWith(desktopMode: v)),
                            subtitle: 'Ask sites for their full layout',
                          ),
                          toggle(
                            LucideIcons.panelsTopLeft,
                            'JavaScript',
                            s.javaScript,
                            (v) => n.update((x) => x.copyWith(javaScript: v)),
                            subtitle: s.javaScript ? null : 'Many sites won’t work without it',
                          ),
                          toggle(
                            LucideIcons.sunMoon,
                            'Darken web pages',
                            s.darkenPages,
                            (v) => n.update((x) => x.copyWith(darkenPages: v)),
                            subtitle: 'For sites without a dark theme',
                          ),
                        ]),
                        const SectionLabel('Privacy'),
                        GroupedCard(children: [
                          toggle(
                            LucideIcons.history,
                            'Save history',
                            s.saveHistory,
                            (v) => n.update((x) => x.copyWith(saveHistory: v)),
                          ),
                          toggle(
                            LucideIcons.cookie,
                            'Block third-party cookies',
                            s.blockThirdPartyCookies,
                            (v) => n.update((x) => x.copyWith(blockThirdPartyCookies: v)),
                            subtitle: 'Always on in private tabs',
                          ),
                          GroupedTile(
                            icon: LucideIcons.shieldCheck,
                            title: 'Site permissions',
                            onTap: () => context.push(Routes.permissions),
                          ),
                          GroupedTile(
                            icon: LucideIcons.eraser,
                            title: 'Clear browsing data',
                            onTap: () => context.push(Routes.clearData),
                          ),
                        ]),
                        const SectionLabel('Guide'),
                        GroupedCard(children: [
                          GroupedTile(
                            icon: LucideIcons.circlePlay,
                            title: 'Take the tour',
                            onTap: () => context.go('${Routes.onboarding}?replay=1'),
                          ),
                          GroupedTile(
                            icon: LucideIcons.globe,
                            title: 'Set as default browser',
                            onTap: () => ref.read(nativeBridgeProvider).openDefaultBrowserSettings(),
                          ),
                        ]),
                        const SectionLabel('About'),
                        GroupedCard(children: [
                          GroupedTile(
                            leading: const AppLogo(size: 36),
                            title: 'Mint Browser',
                            value: 'Version $appVersion',
                            chevron: false,
                          ),
                          GroupedTile(
                            icon: LucideIcons.fileText,
                            title: 'Open-source licenses',
                            onTap: () => showLicensePage(
                              context: context,
                              applicationName: 'Mint Browser',
                              applicationVersion: appVersion,
                              applicationIcon: const Padding(
                                padding: EdgeInsets.all(12),
                                child: AppLogo(size: 64),
                              ),
                            ),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// History · Bookmarks · Downloads counts (the "Size · Uploaded ·
/// Downloads" stat card), each a shortcut to its page.
class _LibraryStats extends ConsumerWidget {
  const _LibraryStats();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final history = ref.watch(historyProvider.select((l) => l.length));
    final bookmarks = ref.watch(bookmarksProvider.select((l) => l.length));
    final downloads = ref.watch(downloadsProvider.select((l) => l.length));
    Widget stat(String label, int value, String route) => Expanded(
          child: Pressable(
            onTap: () => context.push(route),
            scale: 0.95,
            semanticLabel: '$label, $value',
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  Text(label, style: context.text.labelMedium),
                  const SizedBox(height: 4),
                  Text(
                    '$value',
                    style: context.text.titleMedium?.copyWith(fontSize: 19, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ),
        );
    return Container(
      decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(20)),
      child: IntrinsicHeight(
        child: Row(
          children: [
            stat('History', history, Routes.history),
            VerticalDivider(width: 1, thickness: 0.6, indent: 14, endIndent: 14, color: c.divider),
            stat('Bookmarks', bookmarks, Routes.bookmarks),
            VerticalDivider(width: 1, thickness: 0.6, indent: 14, endIndent: 14, color: c.divider),
            stat('Downloads', downloads, Routes.downloads),
          ],
        ),
      ),
    );
  }
}
