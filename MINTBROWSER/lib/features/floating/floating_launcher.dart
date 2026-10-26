import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/utils/url_utils.dart';
import '../../data/models/browser_tab.dart';
import '../../core/platform/native_bridge.dart';
import '../../widgets/dialogs.dart';
import '../../widgets/toast.dart';

/// Opens [tab]'s page in the native floating window (FloatingWindowService),
/// asking for the "display over other apps" permission when needed.
Future<void> openInFloatingWindow(BuildContext context, NativeBridge bridge, BrowserTab tab) async {
  if (tab.isPrivate) {
    MintToast.show(
      context,
      title: 'Not available in private tabs',
      message: 'The floating window uses your normal session.',
      kind: ToastKind.warning,
    );
    return;
  }
  if (tab.showHome || !UrlUtils.isWeb(tab.url)) {
    MintToast.show(context, title: 'Open a page first', kind: ToastKind.info);
    return;
  }

  if (!await bridge.canDrawOverlays()) {
    if (!context.mounted) return;
    final go = await confirmDialog(
      context,
      icon: LucideIcons.pictureInPicture2,
      title: 'Allow floating window',
      message: 'Android needs your OK to show Mint on top of other apps. '
          'Turn on “Display over other apps” for Mint, then come back.',
      confirmLabel: 'Open settings',
    );
    if (!go) return;
    await bridge.requestOverlayPermission();
    await _waitForResume();
    if (!await bridge.canDrawOverlays()) {
      if (context.mounted) {
        MintToast.show(
          context,
          title: 'Permission not granted',
          message: 'The floating window stays off until it’s allowed.',
          kind: ToastKind.warning,
        );
      }
      return;
    }
  }

  final ok = await bridge.openFloatingWindow(tab.url, tab.displayTitle);
  if (!context.mounted) return;
  MintToast.show(
    context,
    title: ok ? 'Floating window opened' : 'Couldn’t open the floating window',
    message: ok ? 'Drag the top bar to move it, the corner to resize.' : null,
    kind: ok ? ToastKind.success : ToastKind.error,
  );
}

Future<void> _waitForResume() {
  final done = Completer<void>();
  late final AppLifecycleListener listener;
  listener = AppLifecycleListener(onResume: () {
    if (!done.isCompleted) done.complete();
  });
  return done.future
      .timeout(const Duration(minutes: 3), onTimeout: () {})
      .whenComplete(listener.dispose);
}
