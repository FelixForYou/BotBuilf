import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/site_permission.dart';
import '../../../widgets/mint_button.dart';
import '../../../widgets/sheets.dart';

IconData capabilityIcon(SiteCapability c) => switch (c) {
      SiteCapability.camera => LucideIcons.camera,
      SiteCapability.microphone => LucideIcons.mic,
      SiteCapability.location => LucideIcons.mapPin,
    };

/// Asks whether [host] may use [capabilities]. Null when dismissed.
Future<bool?> showPermissionPrompt(
  BuildContext context, {
  required String host,
  required Set<SiteCapability> capabilities,
}) {
  final names = capabilities.map((c) => c.label.toLowerCase()).toList();
  final what = names.length == 1 ? names.first : '${names.first} and ${names.last}';
  return showMintSheet<bool>(
    context,
    builder: (context) {
      final c = context.mint;
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (final cap in capabilities)
                  Container(
                    width: 56,
                    height: 56,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    decoration: BoxDecoration(color: c.accentTile, shape: BoxShape.circle),
                    child: Icon(capabilityIcon(cap), color: c.accent, size: 26),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '$host wants to use your $what',
              textAlign: TextAlign.center,
              style: context.text.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Your choice is remembered for this site. Change it anytime in Settings › Site permissions.',
              textAlign: TextAlign.center,
              style: context.text.bodyMedium?.copyWith(color: c.textSecondary),
            ),
            const SizedBox(height: 22),
            MintButton(label: 'Allow', onPressed: () => Navigator.of(context).pop(true)),
            const SizedBox(height: 10),
            MintButton(
              label: 'Block',
              variant: MintButtonVariant.secondary,
              onPressed: () => Navigator.of(context).pop(false),
            ),
          ],
        ),
      );
    },
  );
}
