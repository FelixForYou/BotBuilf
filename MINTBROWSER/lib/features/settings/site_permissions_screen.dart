import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/app_settings.dart';
import '../../data/models/site_permission.dart';
import '../../state/settings_provider.dart';
import '../../state/site_permissions_provider.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/segmented_control.dart';
import '../../widgets/sheets.dart';
import '../../widgets/site_icon.dart';
import '../../widgets/status_view.dart';
import '../browser/widgets/permission_prompt.dart';

class SitePermissionsScreen extends ConsumerWidget {
  const SitePermissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.mint;
    final settings = ref.watch(settingsProvider);
    final sites = ref.watch(sitePermissionsProvider).values.toList()
      ..sort((a, b) => a.host.compareTo(b.host));
    final n = ref.read(settingsProvider.notifier);

    PermissionDefault current(SiteCapability cap) => switch (cap) {
          SiteCapability.camera => settings.cameraDefault,
          SiteCapability.microphone => settings.microphoneDefault,
          SiteCapability.location => settings.locationDefault,
        };
    void setDefault(SiteCapability cap, PermissionDefault v) => n.update((s) => switch (cap) {
          SiteCapability.camera => s.copyWith(cameraDefault: v),
          SiteCapability.microphone => s.copyWith(microphoneDefault: v),
          SiteCapability.location => s.copyWith(locationDefault: v),
        });

    return Scaffold(
      appBar: const MintTopBar(title: 'Site permissions'),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          ContentWidth(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionLabel('When a site asks'),
                GroupedCard(
                  children: [
                    for (final cap in SiteCapability.values)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                        child: Row(
                          children: [
                            TileIcon(capabilityIcon(cap)),
                            const SizedBox(width: 14),
                            Expanded(child: Text(cap.label, style: context.text.bodyLarge)),
                            SizedBox(
                              width: 150,
                              child: SegmentedControl<PermissionDefault>(
                                height: 40,
                                value: current(cap),
                                onChanged: (v) => setDefault(cap, v),
                                options: const [
                                  SegmentOption(PermissionDefault.ask, 'Ask'),
                                  SegmentOption(PermissionDefault.block, 'Block'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                SectionLabel(
                  'Sites',
                  trailing: sites.isEmpty
                      ? null
                      : GestureDetector(
                          onTap: () async {
                            final ok = await confirmDialog(
                              context,
                              title: 'Reset all sites?',
                              message: 'Every site will ask again next time.',
                              confirmLabel: 'Reset',
                              destructive: true,
                            );
                            if (ok) ref.read(sitePermissionsProvider.notifier).resetAll();
                          },
                          child: Text('Reset all', style: context.text.labelMedium?.copyWith(color: c.error)),
                        ),
                ),
                if (sites.isEmpty)
                  const SizedBox(
                    height: 340,
                    child: StatusView(
                      icon: LucideIcons.shieldCheck,
                      title: 'No site choices yet',
                      message: 'When you allow or block a site’s camera, microphone or location, it shows up here.',
                      scrollable: false,
                    ),
                  )
                else
                  GroupedCard(children: [
                    for (final p in sites)
                      GroupedTile(
                        leading: SiteIcon(url: 'https://${p.host}', size: 36, radius: 18),
                        title: p.host,
                        subtitle: p.decisions.entries
                            .map((e) => '${e.key.label}: ${e.value == SiteDecision.allow ? 'Allowed' : 'Blocked'}')
                            .join(' · '),
                        onTap: () => showMintSheet<void>(context, builder: (_) => _SiteSheet(host: p.host)),
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

enum _Choice { ask, allow, block }

class _SiteSheet extends ConsumerWidget {
  const _SiteSheet({required this.host});

  final String host;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final perms = ref.watch(sitePermissionsProvider)[host];
    final n = ref.read(sitePermissionsProvider.notifier);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SiteIcon(url: 'https://$host', size: 44),
              const SizedBox(width: 12),
              Expanded(child: Text(host, style: context.text.titleLarge, maxLines: 1, overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 18),
          for (final cap in SiteCapability.values) ...[
            Row(
              children: [
                TileIcon(capabilityIcon(cap)),
                const SizedBox(width: 12),
                Expanded(child: Text(cap.label, style: context.text.bodyLarge)),
              ],
            ),
            const SizedBox(height: 8),
            SegmentedControl<_Choice>(
              height: 44,
              value: switch (perms?.decisions[cap]) {
                SiteDecision.allow => _Choice.allow,
                SiteDecision.block => _Choice.block,
                null => _Choice.ask,
              },
              onChanged: (v) => n.decide(host, cap, switch (v) {
                _Choice.allow => SiteDecision.allow,
                _Choice.block => SiteDecision.block,
                _Choice.ask => null,
              }),
              options: const [
                SegmentOption(_Choice.ask, 'Ask'),
                SegmentOption(_Choice.allow, 'Allow'),
                SegmentOption(_Choice.block, 'Block'),
              ],
            ),
            const SizedBox(height: 16),
          ],
          MintButton(
            label: 'Reset this site',
            variant: MintButtonVariant.danger,
            onPressed: () {
              n.reset(host);
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }
}
