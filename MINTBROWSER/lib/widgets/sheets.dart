import 'package:flutter/material.dart';

import '../core/motion/motion.dart';
import '../core/theme/app_colors.dart';

/// Rounded modal bottom sheet with a grab handle and safe-area padding.
Future<T?> showMintSheet<T>(
  BuildContext context, {
  required WidgetBuilder builder,
  bool scrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: scrollControlled,
    useSafeArea: true,
    backgroundColor: context.mint.card,
    barrierColor: context.mint.scrim,
    sheetAnimationStyle: const AnimationStyle(
      duration: Motion.sheet,
      reverseDuration: Duration(milliseconds: 300),
      curve: Motion.emphasized,
      reverseCurve: Motion.exit,
    ),
    constraints: const BoxConstraints(maxWidth: 640),
    builder: (context) => SheetScaffold(child: builder(context)),
  );
}

class SheetScaffold extends StatelessWidget {
  const SheetScaffold({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewPaddingOf(context).bottom;
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: keyboard),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(
            width: 38,
            height: 5,
            decoration: BoxDecoration(
              color: context.mint.textSecondary.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          Flexible(
            child: Padding(
              padding: EdgeInsets.only(bottom: bottom + 12),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}
