import 'dart:ui' as ui;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';
import 'common.dart';

bool get _reduceMotion => WidgetsBinding.instance.platformDispatcher.accessibilityFeatures.disableAnimations;

/// Rute gaya iOS: slide + parallax + geser dari tepi kiri untuk kembali.
class FxRoute<T> extends CupertinoPageRoute<T> {
  FxRoute({required super.builder, super.settings, super.fullscreenDialog});

  @override
  Duration get transitionDuration => _reduceMotion ? Duration.zero : const Duration(milliseconds: 420);

  @override
  Duration get reverseTransitionDuration => _reduceMotion ? Duration.zero : const Duration(milliseconds: 360);
}

Future<T?> push<T>(BuildContext context, Widget page) => Navigator.of(context, rootNavigator: true).push<T>(FxRoute<T>(builder: (_) => page));

/// Jarak bawah konten agar tidak tertutup bottom navigation (hanya di dalam tab).
class NavInset extends InheritedWidget {
  const NavInset({super.key, required this.bottom, required super.child});
  final double bottom;
  static double of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<NavInset>()?.bottom ?? 0;
  @override
  bool updateShouldNotify(NavInset old) => old.bottom != bottom;
}

/// Lapisan "liquid glass" tipis: blur terkontrol + warna semi transparan.
/// Bila efek kaca dimatikan (pengaturan) → latar solid (lebih hemat GPU).
class Glass extends StatelessWidget {
  const Glass({super.key, required this.child, this.radius = BorderRadius.zero, this.sigma = 18, this.border = false, this.opacity});
  final Widget child;
  final BorderRadius radius;
  final double sigma;
  final bool border;
  final double? opacity;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return ValueListenableBuilder<bool>(
      valueListenable: App.of(context).glass,
      builder: (context, on, _) {
        // Lapisan warna dasar + kilau tipis di atas (highlight kaca).
        final content = DecoratedBox(
          decoration: BoxDecoration(
            color: on ? fx.bar.withValues(alpha: opacity ?? (fx.dark ? 0.72 : 0.8)) : (radius == BorderRadius.zero ? fx.bg : fx.card),
            borderRadius: radius,
          ),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: radius,
              border: border ? Border.all(color: fx.dark ? const Color(0x22FFFFFF) : const Color(0x14000000), width: 0.8) : null,
              gradient: on
                  ? LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: fx.dark ? const [Color(0x12FFFFFF), Color(0x03FFFFFF)] : const [Color(0x55FFFFFF), Color(0x11FFFFFF)],
                    )
                  : null,
            ),
            child: child,
          ),
        );
        if (!on) return ClipRRect(borderRadius: radius, child: content);
        return ClipRRect(
          borderRadius: radius,
          child: BackdropFilter(
            filter: ui.ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
            child: content,
          ),
        );
      },
    );
  }
}

/// Kerangka halaman: top bar kaca + judul besar + pull-to-refresh iOS.
class FxPage extends StatefulWidget {
  const FxPage({
    super.key,
    required this.title,
    this.subtitle,
    this.children,
    this.slivers,
    this.actions = const [],
    this.onRefresh,
    this.leading,
    this.showBack,
    this.bottom,
    this.largeTitle = true,
    this.padding = const EdgeInsets.fromLTRB(16, 0, 16, 0),
    this.controller,
  });

  final String title;
  final String? subtitle;
  final List<Widget>? children;
  final List<Widget>? slivers;
  final List<Widget> actions;
  final Future<void> Function()? onRefresh;
  final Widget? leading;
  final bool? showBack;
  final Widget? bottom;
  final bool largeTitle;
  final EdgeInsets padding;
  final ScrollController? controller;

  @override
  State<FxPage> createState() => _FxPageState();
}

class _FxPageState extends State<FxPage> {
  /// Judul kecil di bar muncul halus setelah judul besar tergulir (gaya iOS).
  final _collapsed = ValueNotifier<bool>(false);

  @override
  void dispose() {
    _collapsed.dispose();
    super.dispose();
  }

  bool _onScroll(ScrollNotification n) {
    if (n.depth == 0 && n.metrics.axis == Axis.vertical) _collapsed.value = n.metrics.pixels > 40;
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final top = MediaQuery.paddingOf(context).top;
    final navBottom = NavInset.of(context);
    final canPop = widget.showBack ?? Navigator.of(context).canPop();
    const barH = 56.0;
    final scroll = CustomScrollView(
      controller: widget.controller,
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        SliverToBoxAdapter(child: SizedBox(height: top + barH)),
        if (widget.onRefresh != null)
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              await widget.onRefresh!();
            },
            builder: (context, mode, pulled, trigger, indicator) => Center(
              child: Opacity(
                opacity: (pulled / trigger).clamp(0.0, 1.0),
                child: mode == RefreshIndicatorMode.drag
                    ? Icon(CupertinoIcons.arrow_down, color: fx.mint, size: 22)
                    : CupertinoActivityIndicator(color: fx.mint, radius: 11),
              ),
            ),
          ),
        if (widget.largeTitle)
          SliverPadding(
            padding: EdgeInsets.fromLTRB(widget.padding.left + 4, 6, widget.padding.right, 6),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800, letterSpacing: -0.5, height: 1.15)),
                  if (widget.subtitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(widget.subtitle!, style: TextStyle(fontSize: 14.5, color: fx.muted)),
                    ),
                ],
              ),
            ),
          ),
        if (widget.children != null)
          SliverPadding(
            padding: widget.padding,
            sliver: SliverList(delegate: SliverChildListDelegate(widget.children!)),
          ),
        ...?widget.slivers,
        SliverToBoxAdapter(child: SizedBox(height: 32 + navBottom + MediaQuery.paddingOf(context).bottom)),
      ],
    );

    return Scaffold(
      backgroundColor: fx.bg,
      resizeToAvoidBottomInset: true,
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: fx.dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        child: Stack(
          children: [
            Positioned.fill(
              child: NotificationListener<ScrollNotification>(onNotification: _onScroll, child: scroll),
            ),
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              child: Glass(
                child: Container(
                  height: top + barH,
                  padding: EdgeInsets.only(top: top, left: 6, right: 6),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: fx.line.withValues(alpha: 0.6), width: 0.6)),
                  ),
                  child: NavigationToolbar(
                    leading:
                        widget.leading ??
                        (canPop ? FxIconButton(CupertinoIcons.chevron_back, tooltip: 'Kembali', onTap: () => Navigator.of(context).maybePop()) : null),
                    middle: ValueListenableBuilder<bool>(
                      valueListenable: _collapsed,
                      builder: (context, collapsed, child) =>
                          AnimatedOpacity(opacity: !widget.largeTitle || collapsed ? 1 : 0, duration: Motion.of(context, 180), child: child),
                      child: Text(
                        widget.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                      ),
                    ),
                    trailing: Row(mainAxisSize: MainAxisSize.min, children: widget.actions),
                    centerMiddle: true,
                  ),
                ),
              ),
            ),
            if (widget.bottom != null) Positioned(left: 0, right: 0, bottom: 0, child: widget.bottom!),
          ],
        ),
      ),
    );
  }
}
