import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/app_settings.dart';
import '../../state/settings_provider.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_switch.dart';
import '../../widgets/pressable.dart';

class AppearanceScreen extends ConsumerWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(settingsProvider);
    final n = ref.read(settingsProvider.notifier);
    return Scaffold(
      appBar: const MintTopBar(title: 'Appearance'),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          ContentWidth(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionLabel('Theme'),
                Row(
                  children: [
                    for (final (i, mode) in AppearanceMode.values.indexed) ...[
                      if (i > 0) const SizedBox(width: 12),
                      Expanded(
                        child: _ThemeTile(
                          mode: mode,
                          selected: s.appearance == mode,
                          onTap: () => n.update((x) => x.copyWith(appearance: mode)),
                        ),
                      ),
                    ],
                  ],
                ),
                const SectionLabel('Web pages'),
                GroupedCard(children: [
                  GroupedTile(
                    icon: LucideIcons.sunMoon,
                    title: 'Darken web pages',
                    subtitle: 'For sites without a dark theme',
                    trailing: MintSwitch(
                      value: s.darkenPages,
                      onChanged: (v) => n.update((x) => x.copyWith(darkenPages: v)),
                    ),
                    onTap: () => n.update((x) => x.copyWith(darkenPages: !x.darkenPages)),
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  const _ThemeTile({required this.mode, required this.selected, required this.onTap});

  final AppearanceMode mode;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    Widget mock(Color bg, Color card, Color line) => Container(
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(height: 8, width: 36, decoration: BoxDecoration(color: line, borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 6),
              Expanded(child: Container(decoration: BoxDecoration(color: card, borderRadius: BorderRadius.circular(8)))),
              const SizedBox(height: 6),
              Container(
                height: 10,
                decoration: BoxDecoration(color: const Color(0xFF55DDC0), borderRadius: BorderRadius.circular(5)),
              ),
            ],
          ),
        );
    const dark = (Color(0xFF101010), Color(0xFF1D1D1F), Color(0xFF303033));
    const light = (Color(0xFFF5F5F7), Color(0xFFFFFFFF), Color(0xFFE2E2E6));
    final preview = switch (mode) {
      AppearanceMode.dark => mock(dark.$1, dark.$2, dark.$3),
      AppearanceMode.light => mock(light.$1, light.$2, light.$3),
      AppearanceMode.system => ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Row(
            children: [
              Expanded(child: mock(light.$1, light.$2, light.$3)),
              Expanded(child: mock(dark.$1, dark.$2, dark.$3)),
            ],
          ),
        ),
    };
    return Pressable(
      onTap: onTap,
      scale: 0.95,
      semanticLabel: mode.label,
      child: AnimatedContainer(
        duration: Motion.quick,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: c.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? c.accent : Colors.transparent, width: 2),
        ),
        child: Column(
          children: [
            AspectRatio(aspectRatio: 0.78, child: preview),
            const SizedBox(height: 10),
            Text(
              mode.label,
              style: context.text.titleSmall?.copyWith(color: selected ? c.accentInk : c.textPrimary),
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}
