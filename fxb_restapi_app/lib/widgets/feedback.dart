import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/api_exception.dart';
import '../theme/app_theme.dart';
import '../theme/motion.dart';
import 'common.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

enum ToastKind { ok, info, warn, error }

OverlayEntry? _toastEntry;
Timer? _toastTimer;

/// Toast kecil di atas layar (gaya kartu notifikasi "Flutter builds have known bugs").
void toast(String message, {ToastKind kind = ToastKind.ok, String? title}) {
  final overlay = rootNavigatorKey.currentState?.overlay;
  if (overlay == null) return;
  _toastTimer?.cancel();
  _toastEntry?.remove();
  final key = GlobalKey<_ToastViewState>();
  final entry = OverlayEntry(
    builder: (_) => _ToastView(key: key, message: message, kind: kind, title: title),
  );
  _toastEntry = entry;
  overlay.insert(entry);
  _toastTimer = Timer(Duration(milliseconds: 2600 + message.length * 25), () async {
    await key.currentState?.hide();
    if (_toastEntry == entry) {
      entry.remove();
      _toastEntry = null;
    }
  });
}

void toastError(Object e) {
  if (e is ApiException) {
    toast(e.message, kind: ToastKind.error, title: e.title);
  } else {
    toast('$e', kind: ToastKind.error);
  }
}

class _ToastView extends StatefulWidget {
  const _ToastView({super.key, required this.message, required this.kind, this.title});
  final String message;
  final ToastKind kind;
  final String? title;
  @override
  State<_ToastView> createState() => _ToastViewState();
}

class _ToastViewState extends State<_ToastView> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 520),
    reverseDuration: const Duration(milliseconds: 220),
  );

  @override
  void initState() {
    super.initState();
    _c.forward();
  }

  Future<void> hide() async {
    if (mounted) await _c.reverse();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final (icon, color) = switch (widget.kind) {
      ToastKind.ok => (Icons.check_rounded, fx.mint),
      ToastKind.info => (Icons.info_outline_rounded, fx.mint),
      ToastKind.warn => (Icons.priority_high_rounded, fx.warn),
      ToastKind.error => (Icons.priority_high_rounded, fx.danger),
    };
    final anim = CurvedAnimation(parent: _c, curve: Springs.smooth, reverseCurve: Curves.easeIn);
    return Positioned(
      left: 12,
      right: 12,
      top: MediaQuery.paddingOf(context).top + 8,
      child: FadeTransition(
        opacity: _c,
        child: SlideTransition(
          position: Tween(begin: const Offset(0, -0.6), end: Offset.zero).animate(anim),
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: hide,
              onVerticalDragEnd: (_) => hide(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: fx.dark ? const Color(0xFF2A2A2D) : Colors.white,
                  borderRadius: BorderRadius.circular(R.big),
                  border: Border.all(color: fx.line),
                  boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 24, offset: Offset(0, 8))],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                      child: Icon(icon, size: 19, color: widget.kind == ToastKind.error ? Colors.white : fx.mintInk),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (widget.title != null)
                            Text(
                              widget.title!,
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15.5, color: fx.fg),
                            ),
                          Text(
                            widget.message,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 14, color: widget.title != null ? fx.muted : fx.fg),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> copyText(String text, {String done = 'Disalin.'}) async {
  await Clipboard.setData(ClipboardData(text: text));
  HapticFeedback.lightImpact();
  toast(done);
}

/// Bottom sheet gaya iOS: drag handle, sudut besar, animasi lembut,
/// otomatis naik saat keyboard muncul.
Future<T?> showFxSheet<T>(BuildContext context, {required Widget Function(BuildContext) builder, String? title, String? subtitle, bool scrollable = true}) {
  final fx = Fx.of(context);
  final reduced = Motion.reduced(context);
  return showModalBottomSheet<T>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: fx.dark ? const Color(0xFF232325) : fx.card,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    elevation: 0,
    sheetAnimationStyle: AnimationStyle(
      duration: reduced ? Duration.zero : const Duration(milliseconds: 460),
      reverseDuration: reduced ? Duration.zero : const Duration(milliseconds: 260),
      curve: Springs.smooth,
      reverseCurve: Curves.easeInCubic,
    ),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
    clipBehavior: Clip.antiAlias,
    showDragHandle: false,
    builder: (ctx) {
      final inset = MediaQuery.viewInsetsOf(ctx).bottom;
      final body = Padding(padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.paddingOf(ctx).bottom), child: builder(ctx));
      return AnimatedPadding(
        duration: Motion.of(ctx, 180),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(bottom: inset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 40,
                height: 5,
                decoration: BoxDecoration(color: fx.subtle.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(3)),
              ),
            ),
            if (title != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 4, 16, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FxIconButton(Icons.close_rounded, tooltip: 'Tutup', onTap: () => Navigator.of(ctx).maybePop()),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                          if (subtitle != null) Text(subtitle, style: TextStyle(fontSize: 14, color: fx.muted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            Flexible(child: scrollable ? SingleChildScrollView(child: body) : body),
          ],
        ),
      );
    },
  );
}

/// Konfirmasi tindakan (hapus, cabut, dsb.). Mengembalikan true bila disetujui.
Future<bool> confirmSheet(BuildContext context, {required String title, required String text, String confirm = 'Lanjutkan', bool danger = false}) async {
  final r = await showFxSheet<bool>(
    context,
    title: title,
    builder: (ctx) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(text, style: TextStyle(fontSize: 15.5, color: Fx.of(ctx).muted, height: 1.4)),
        const SizedBox(height: 22),
        FxButton(confirm, big: true, expand: true, variant: danger ? BtnVariant.danger : BtnVariant.primary, onTap: () => Navigator.pop(ctx, true)),
        const SizedBox(height: 10),
        FxButton('Batal', big: true, expand: true, variant: BtnVariant.secondary, onTap: () => Navigator.pop(ctx, false)),
      ],
    ),
  );
  return r == true;
}

/// Kartu kegagalan ala "The build didn't start": ikon power merah, statistik,
/// tips, dan detail yang bisa disalin.
class FailureCard extends StatefulWidget {
  const FailureCard({
    super.key,
    required this.title,
    required this.text,
    required this.tip,
    required this.details,
    this.stats = const [],
    this.onRetry,
    this.retryLabel = 'Coba lagi',
  });

  final String title;
  final String text;
  final String tip;
  final String details;
  final List<StatItem> stats;
  final VoidCallback? onRetry;
  final String retryLabel;

  @override
  State<FailureCard> createState() => _FailureCardState();
}

class _FailureCardState extends State<FailureCard> {
  bool _open = true;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FxCard(
          radius: R.big,
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: fx.dangerSoft, shape: BoxShape.circle),
                child: Icon(Icons.power_settings_new_rounded, color: fx.danger, size: 34),
              ),
              const SizedBox(height: 14),
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Text(
                widget.text,
                textAlign: TextAlign.center,
                style: TextStyle(color: fx.muted, fontSize: 15, height: 1.35),
              ),
              if (widget.stats.isNotEmpty) ...[
                const SizedBox(height: 18),
                Container(
                  decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(18)),
                  child: StatGrid(widget.stats, transparent: true),
                ),
              ],
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(18)),
                child: Row(
                  children: [
                    Icon(Icons.lightbulb_outline_rounded, color: fx.mint, size: 21),
                    const SizedBox(width: 10),
                    Expanded(child: Text(widget.tip, style: const TextStyle(fontSize: 14.5))),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (widget.onRetry != null) ...[const SizedBox(height: 16), FxButton(widget.retryLabel, big: true, expand: true, onTap: widget.onRetry)],
        const SizedBox(height: 10),
        Pressable(
          onTap: () => setState(() => _open = !_open),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_open ? 'Sembunyikan detail' : 'Lihat detail', style: TextStyle(color: fx.muted, fontSize: 15)),
                const SizedBox(width: 4),
                AnimatedRotation(
                  turns: _open ? 0 : 0.5,
                  duration: Motion.of(context, 260),
                  child: Icon(Icons.keyboard_arrow_up_rounded, color: fx.muted, size: 20),
                ),
              ],
            ),
          ),
        ),
        AnimatedSize(
          duration: Motion.of(context, 300),
          curve: Springs.smooth,
          alignment: Alignment.topCenter,
          child: !_open
              ? const SizedBox(width: double.infinity)
              : Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: fx.dangerSoft.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: fx.danger.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SelectableText(widget.details, style: TextStyle(color: fx.dangerInk, fontSize: 14, height: 1.4)),
                      const SizedBox(height: 10),
                      Pressable(
                        onTap: () => copyText(widget.details, done: 'Detail disalin.'),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.copy_rounded, size: 17, color: fx.mint),
                            const SizedBox(width: 6),
                            Text(
                              'Salin detail',
                              style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

/// Tampilan error untuk halaman yang gagal memuat data.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final e = error is ApiException ? error as ApiException : ApiException('ERROR', '$error');
    final tip = switch (e.code) {
      'NETWORK' => 'Nyalakan data seluler atau Wi-Fi, lalu tap Coba lagi.',
      'TIMEOUT' => 'Jaringan lambat atau server sibuk. Tunggu sebentar, lalu coba lagi.',
      'BACKEND_UNAVAILABLE' => 'Tunggu sekitar satu menit sampai server menyala, lalu tap Coba lagi.',
      'UNAUTHORIZED' => 'Silakan login kembali.',
      'FORBIDDEN' => 'Halaman ini memerlukan hak akses tambahan.',
      'RATE_LIMITED' => 'Tunggu ${e.retryAfter ?? 60} detik lalu coba lagi.',
      _ => 'Tunggu sebentar, lalu tap Coba lagi.',
    };
    return FailureCard(
      title: e.title,
      text: e.message,
      tip: tip,
      details: 'Code: ${e.code}\nHTTP: ${e.status == 0 ? '— (tidak ada respons server)' : e.status}\nMessage: ${e.message}',
      onRetry: onRetry,
    );
  }
}

/// Memuat data sekali dengan skeleton → konten/error yang beralih halus.
class Loader<T> extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder, this.skeleton});
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final Widget? skeleton;

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  T? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    reload();
  }

  Future<void> reload() async {
    setState(() {
      _loading = _data == null;
      _error = null;
    });
    try {
      final d = await widget.load();
      if (!mounted) return;
      setState(() {
        _data = d;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_data == null) {
          _error = e;
        } else {
          toastError(e);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget child;
    if (_loading && _data == null) {
      child = KeyedSubtree(key: const ValueKey('s'), child: widget.skeleton ?? const SkeletonList());
    } else if (_error != null) {
      child = KeyedSubtree(
        key: const ValueKey('e'),
        child: ErrorView(error: _error!, onRetry: reload),
      );
    } else {
      child = KeyedSubtree(key: const ValueKey('d'), child: widget.builder(context, _data as T, reload));
    }
    return Swap(child: child);
  }
}

/// Formulir sederhana dengan status sibuk + error toast; mencegah kirim ganda.
class BusyForm extends StatefulWidget {
  const BusyForm({super.key, required this.builder});
  final Widget Function(bool busy, Future<void> Function(Future<void> Function()) run) builder;
  @override
  State<BusyForm> createState() => BusyFormState();
}

class BusyFormState extends State<BusyForm> {
  bool _busy = false;
  Future<void> _run(Future<void> Function() fn) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await fn();
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => widget.builder(_busy, _run);
}
