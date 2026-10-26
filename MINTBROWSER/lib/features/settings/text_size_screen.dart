import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/app_settings.dart';
import '../../state/settings_provider.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';

class TextSizeScreen extends ConsumerWidget {
  const TextSizeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final zoom = ref.watch(settingsProvider.select((s) => s.textZoom));
    final n = ref.read(settingsProvider.notifier);
    return Scaffold(
      appBar: const MintTopBar(title: 'Text size'),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          ContentWidth(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionLabel('Preview'),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(24)),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 160),
                    style: context.text.bodyLarge!.copyWith(fontSize: 16 * zoom / 100),
                    child: const Text(
                      'Web pages use this size for their text. Pinch to zoom still works on any page.',
                    ),
                  ),
                ),
                const SectionLabel('Scale'),
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 10),
                  decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Text('A', style: context.text.bodySmall?.copyWith(fontSize: 13)),
                          Expanded(
                            child: SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 4,
                                activeTrackColor: c.accent,
                                inactiveTrackColor: c.divider,
                                thumbColor: Colors.white,
                                overlayColor: c.accent.withValues(alpha: 0.12),
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12, elevation: 2),
                                tickMarkShape: SliderTickMarkShape.noTickMark,
                                showValueIndicator: ShowValueIndicator.never,
                              ),
                              child: Slider(
                                min: AppSettings.minZoom.toDouble(),
                                max: AppSettings.maxZoom.toDouble(),
                                divisions: (AppSettings.maxZoom - AppSettings.minZoom) ~/ 10,
                                value: zoom.toDouble(),
                                onChanged: (v) {
                                  if (v.round() != zoom) HapticFeedback.selectionClick();
                                  n.update((s) => s.copyWith(textZoom: v.round()));
                                },
                              ),
                            ),
                          ),
                          Text('A', style: context.text.titleLarge?.copyWith(fontSize: 24)),
                        ],
                      ),
                      Text(
                        '$zoom%',
                        style: context.text.titleMedium?.copyWith(
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                MintButton(
                  label: 'Reset to 100%',
                  variant: MintButtonVariant.secondary,
                  onPressed: zoom == 100 ? null : () => n.update((s) => s.copyWith(textZoom: 100)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
