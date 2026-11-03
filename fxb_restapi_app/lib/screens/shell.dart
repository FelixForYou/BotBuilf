import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/api_exception.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';
import '../widgets/common.dart';
import '../widgets/feedback.dart';
import '../widgets/page.dart';
import 'account_tab.dart';
import 'docs/docs_screen.dart';
import 'explorer/explorer_screen.dart';
import 'home_screen.dart';
import 'menu_screen.dart';

/// Kontrol tab dari mana saja (mis. tombol "Docs" di beranda).
class ShellScope extends InheritedWidget {
  const ShellScope({super.key, required this.go, required super.child});
  final void Function(int index) go;
  static void Function(int) of(BuildContext context) => context.getInheritedWidgetOfExactType<ShellScope>()!.go;
  @override
  bool updateShouldNotify(ShellScope oldWidget) => false;
}

class Tabs {
  static const home = 0, docs = 1, explorer = 2, account = 3, menu = 4;
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;
  final _built = <int>{0};
  late final AppState _app = App.of(context);

  static const _items = [
    (CupertinoIcons.house, CupertinoIcons.house_fill, 'Beranda'),
    (CupertinoIcons.book, CupertinoIcons.book_fill, 'Docs'),
    (CupertinoIcons.chevron_left_slash_chevron_right, CupertinoIcons.chevron_left_slash_chevron_right, 'Explorer'),
    (CupertinoIcons.person_crop_circle, CupertinoIcons.person_crop_circle_fill, 'Akun'),
    (CupertinoIcons.line_horizontal_3, CupertinoIcons.line_horizontal_3, 'Menu'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _app.sessionExpired.addListener(_onExpired);
      _bootstrap();
    });
  }

  Future<void> _bootstrap() async {
    // Muat katalog di latar; error ditampilkan di tab yang memerlukannya.
    _app.loadCatalog().ignore();
    if (!_app.hasStoredSession) return;
    try {
      await _app.refreshMe();
    } on ApiException catch (e) {
      if (e.isBackendDown || e.code == 'NETWORK' || e.code == 'TIMEOUT') {
        toast(e.message, kind: ToastKind.warn, title: e.title);
      }
    }
  }

  void _onExpired() {
    toast('Silakan login kembali untuk melanjutkan.', kind: ToastKind.warn, title: 'Sesi berakhir');
  }

  @override
  void dispose() {
    _app.sessionExpired.removeListener(_onExpired);
    super.dispose();
  }

  void go(int i) {
    if (i == _index) return;
    HapticFeedback.selectionClick();
    setState(() {
      _index = i;
      _built.add(i);
    });
  }

  Widget _tab(int i) => switch (i) {
    Tabs.home => const HomeScreen(),
    Tabs.docs => const DocsScreen(),
    Tabs.explorer => const ExplorerScreen(),
    Tabs.account => const AccountTab(),
    _ => const MenuScreen(),
  };

  @override
  Widget build(BuildContext context) {
    final bottomSafe = MediaQuery.paddingOf(context).bottom;
    const barH = 66.0;
    final inset = barH + 14 + bottomSafe;
    return PopScope(
      canPop: _index == Tabs.home,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) go(Tabs.home);
      },
      child: ShellScope(
        go: go,
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          body: Stack(
            children: [
              // Tab aktif digambar paling atas; key menjaga state saat urutan berubah.
              for (final i in [..._built.where((t) => t != _index), _index])
                Positioned.fill(
                  key: ValueKey('tab$i'),
                  child: _TabLayer(
                    active: i == _index,
                    child: NavInset(bottom: inset, child: _tab(i)),
                  ),
                ),
              Positioned(
                left: 14,
                right: 14,
                bottom: bottomSafe + 10,
                child: _NavBar(index: _index, items: _items, onTap: go, height: barH),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabLayer extends StatelessWidget {
  const _TabLayer({required this.active, required this.child});
  final bool active;
  final Widget child;
  @override
  Widget build(BuildContext context) {
    // Animasi fade/scale berada DI LUAR TickerMode agar tab lama tetap bisa
    // memudar; animasi di dalam tab nonaktif dihentikan (hemat CPU/GPU).
    return IgnorePointer(
      ignoring: !active,
      child: AnimatedOpacity(
        opacity: active ? 1 : 0,
        duration: Motion.of(context, active ? 260 : 160),
        curve: Curves.easeOut,
        child: AnimatedScale(
          scale: active ? 1 : 0.985,
          duration: Motion.of(context, 420),
          curve: Springs.smooth,
          child: TickerMode(
            enabled: active,
            child: ExcludeSemantics(excluding: !active, child: child),
          ),
        ),
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  const _NavBar({required this.index, required this.items, required this.onTap, required this.height});
  final int index;
  final List<(IconData, IconData, String)> items;
  final ValueChanged<int> onTap;
  final double height;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Glass(
      radius: BorderRadius.circular(R.pill),
      border: true,
      sigma: 16,
      child: SizedBox(
        height: height,
        child: LayoutBuilder(
          builder: (context, c) {
            final w = (c.maxWidth - 12) / items.length;
            return Stack(
              children: [
                AnimatedPositioned(
                  duration: Motion.of(context, 560),
                  curve: Springs.snappy,
                  left: 6 + index * w,
                  top: 6,
                  bottom: 6,
                  width: w,
                  child: Container(
                    decoration: BoxDecoration(color: fx.mintSoft, borderRadius: BorderRadius.circular(R.pill)),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Row(
                    children: [
                      for (var i = 0; i < items.length; i++)
                        Expanded(
                          child: Semantics(
                            selected: i == index,
                            button: true,
                            label: items[i].$3,
                            child: Pressable(
                              scale: 0.9,
                              onTap: () => onTap(i),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  AnimatedSwitcher(
                                    duration: Motion.of(context, 200),
                                    child: Icon(
                                      i == index ? items[i].$2 : items[i].$1,
                                      key: ValueKey(i == index),
                                      size: 22,
                                      color: i == index ? fx.mint : fx.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    items[i].$3,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: i == index ? FontWeight.w700 : FontWeight.w500,
                                      color: i == index ? fx.mint : fx.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
