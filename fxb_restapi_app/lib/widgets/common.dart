import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';
import '../theme/motion.dart';

/// Efek tekan: mengecil sedikit dengan pegas, lalu kembali.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.onTap, this.onLongPress, this.scale = 0.965, this.haptic = false, this.enabled = true});

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;
  final bool haptic;
  final bool enabled;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v && mounted) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.enabled && (widget.onTap != null || widget.onLongPress != null);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: active ? (_) => _set(true) : null,
      onTapUp: active ? (_) => _set(false) : null,
      onTapCancel: active ? () => _set(false) : null,
      onTap: active
          ? () {
              if (widget.haptic) HapticFeedback.selectionClick();
              widget.onTap?.call();
            }
          : null,
      onLongPress: active ? widget.onLongPress : null,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: Motion.of(context, _down ? 110 : 420),
        curve: _down ? Curves.easeOut : Springs.press,
        child: AnimatedOpacity(opacity: _down ? 0.86 : 1, duration: Motion.of(context, 120), child: widget.child),
      ),
    );
  }
}

class FxCard extends StatelessWidget {
  const FxCard({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.color, this.radius = R.card, this.onTap, this.border});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final double radius;
  final VoidCallback? onTap;
  final Color? border;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? fx.card,
        borderRadius: BorderRadius.circular(radius),
        border: border != null ? Border.all(color: border!) : null,
      ),
      child: child,
    );
    return onTap == null ? box : Pressable(onTap: onTap, scale: 0.98, child: box);
  }
}

enum Tone { neutral, mint, warn, danger }

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.tone = Tone.neutral, this.icon});
  final String text;
  final Tone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final (bg, fg) = switch (tone) {
      Tone.mint => (fx.mintSoft, fx.mint),
      Tone.warn => (fx.warnSoft, fx.warn),
      Tone.danger => (fx.dangerSoft, fx.danger),
      Tone.neutral => (fx.card3, fx.muted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(R.pill)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 12, color: fg), const SizedBox(width: 4)],
          Text(
            text,
            style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600, height: 1.2),
          ),
        ],
      ),
    );
  }
}

class MethodPill extends StatelessWidget {
  const MethodPill(this.method, {super.key});
  final String method;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final get = method == 'GET';
    return Container(
      width: 46,
      padding: const EdgeInsets.symmetric(vertical: 4),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: get ? fx.mintSoft : fx.warnSoft, borderRadius: BorderRadius.circular(8)),
      child: Text(
        method,
        style: TextStyle(fontFamily: kMono, fontSize: 11.5, fontWeight: FontWeight.w700, color: get ? fx.mint : fx.warn),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.trailing, this.top = 28});
  final String text;
  final Widget? trailing;
  final double top;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(4, top, 4, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: TextStyle(fontSize: 13, letterSpacing: 1.0, fontWeight: FontWeight.w600, color: fx.muted),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class LinkText extends StatelessWidget {
  const LinkText(this.text, {super.key, required this.onTap, this.icon});
  final String text;
  final VoidCallback onTap;
  final IconData? icon;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Pressable(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600, fontSize: 14),
            ),
            if (icon != null) ...[const SizedBox(width: 3), Icon(icon, size: 16, color: fx.mint)],
          ],
        ),
      ),
    );
  }
}

class StatItem {
  const StatItem(this.value, this.label);
  final String value;
  final String label;
}

/// Kotak statistik bersekat (gaya "APK · 3/4 · 00:16" di layar build).
class StatGrid extends StatelessWidget {
  const StatGrid(this.items, {super.key, this.transparent = false});
  final List<StatItem> items;
  final bool transparent;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      if (i > 0) children.add(Container(width: 1, height: 34, color: fx.line));
      children.add(
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
            child: Column(
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(items[i].value, maxLines: 1, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 2),
                Text(
                  items[i].label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12.5, color: fx.muted),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(color: transparent ? Colors.transparent : fx.card, borderRadius: BorderRadius.circular(20)),
      child: Row(children: children),
    );
  }
}

/// Grup baris ala pengaturan iOS (Menu website).
class ListGroup extends StatelessWidget {
  const ListGroup({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final out = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) {
        out.add(
          Padding(
            padding: const EdgeInsets.only(left: 62),
            child: Container(height: 1, color: fx.line),
          ),
        );
      }
      out.add(children[i]);
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(R.card),
      child: ColoredBox(
        color: fx.card,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: out),
      ),
    );
  }
}

class ListRow extends StatelessWidget {
  const ListRow({super.key, required this.label, this.icon, this.sub, this.value, this.onTap, this.danger = false, this.trailing, this.chevron = true});

  final String label;
  final IconData? icon;
  final String? sub;
  final String? value;
  final VoidCallback? onTap;
  final bool danger;
  final Widget? trailing;
  final bool chevron;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final color = danger ? fx.danger : fx.fg;
    return Pressable(
      onTap: onTap,
      scale: 0.985,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: danger ? fx.dangerSoft : fx.mintSoft, shape: BoxShape.circle),
                child: Icon(icon, size: 19, color: danger ? fx.danger : fx.mint),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: color),
                  ),
                  if (sub != null && sub!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        sub!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: fx.muted),
                      ),
                    ),
                ],
              ),
            ),
            if (value != null) ...[const SizedBox(width: 8), Text(value!, style: TextStyle(fontSize: 14.5, color: fx.muted))],
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
            if (onTap != null && chevron) ...[const SizedBox(width: 6), Icon(CupertinoIcons.chevron_right, size: 16, color: fx.subtle)],
          ],
        ),
      ),
    );
  }
}

enum BtnVariant { primary, secondary, danger, ghost }

class FxButton extends StatelessWidget {
  const FxButton(
    this.label, {
    super.key,
    this.onTap,
    this.icon,
    this.variant = BtnVariant.primary,
    this.loading = false,
    this.big = false,
    this.small = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final BtnVariant variant;
  final bool loading;
  final bool big;
  final bool small;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final disabled = onTap == null || loading;
    final (bg, fg) = switch (variant) {
      BtnVariant.primary => (fx.mint, fx.mintInk),
      BtnVariant.secondary => (fx.card2, fx.fg),
      BtnVariant.danger => (fx.dangerSoft, fx.danger),
      BtnVariant.ghost => (Colors.transparent, fx.mint),
    };
    final h = big ? 56.0 : (small ? 38.0 : 48.0);
    final content = AnimatedSwitcher(
      duration: Motion.of(context, 220),
      switchInCurve: Curves.easeOut,
      transitionBuilder: (c, a) => FadeTransition(
        opacity: a,
        child: ScaleTransition(scale: Tween(begin: 0.85, end: 1.0).animate(a), child: c),
      ),
      child: loading
          ? SizedBox(
              key: const ValueKey('l'),
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.4, color: fg),
            )
          : Row(
              key: const ValueKey('c'),
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[Icon(icon, size: small ? 16 : 19, color: fg), SizedBox(width: small ? 6 : 8)],
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: big ? 17 : (small ? 14 : 15.5)),
                  ),
                ),
              ],
            ),
    );
    final box = AnimatedOpacity(
      duration: Motion.of(context, 180),
      opacity: (onTap == null && !loading) ? 0.45 : 1,
      child: Container(
        height: h,
        width: expand ? double.infinity : null,
        padding: EdgeInsets.symmetric(horizontal: small ? 14 : 20),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(R.pill)),
        // widthFactor 1: lebar mengikuti isi (penting di dalam Wrap/Row).
        child: Center(widthFactor: 1, child: content),
      ),
    );
    return Semantics(
      button: true,
      enabled: !disabled,
      label: label,
      excludeSemantics: true,
      child: Pressable(onTap: disabled ? null : onTap, haptic: true, child: box),
    );
  }
}

class FxIconButton extends StatelessWidget {
  const FxIconButton(this.icon, {super.key, required this.onTap, this.tooltip, this.size = 40, this.filled = false});
  final IconData icon;
  final VoidCallback? onTap;
  final String? tooltip;
  final double size;
  final bool filled;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final w = Pressable(
      onTap: onTap,
      scale: 0.9,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: filled ? fx.card2 : Colors.transparent, shape: BoxShape.circle),
        child: Icon(icon, size: size * 0.55, color: fx.fg),
      ),
    );
    return tooltip == null ? w : Semantics(label: tooltip, button: true, child: w);
  }
}

/// Field input gaya website: abu gelap, sudut 18, tombol hapus bulat.
class FxField extends StatelessWidget {
  const FxField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.help,
    this.error,
    this.obscure = false,
    this.keyboard,
    this.maxLines = 1,
    this.minLines,
    this.mono = false,
    this.enabled = true,
    this.onChanged,
    this.onSubmitted,
    this.autofill,
    this.textInputAction,
    this.maxLength,
    this.clearable = true,
    this.autofocus = false,
    this.suffix,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? help;
  final String? error;
  final bool obscure;
  final TextInputType? keyboard;
  final int maxLines;
  final int? minLines;
  final bool mono;
  final bool enabled;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofill;
  final TextInputAction? textInputAction;
  final int? maxLength;
  final bool clearable;
  final bool autofocus;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final field = TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      maxLines: obscure ? 1 : maxLines,
      minLines: minLines,
      enabled: enabled,
      autofocus: autofocus,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      autofillHints: autofill,
      textInputAction: textInputAction,
      maxLength: maxLength,
      scrollPadding: const EdgeInsets.only(bottom: 140),
      style: TextStyle(fontSize: mono ? 14 : 16, fontFamily: mono ? kMono : null, color: enabled ? fx.fg : fx.muted),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: fx.subtle, fontFamily: mono ? kMono : null),
        counterText: '',
        filled: true,
        fillColor: fx.card2,
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines > 1 ? 14 : 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(R.field), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(R.field),
          borderSide: error != null ? BorderSide(color: fx.danger.withValues(alpha: 0.7)) : BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(R.field),
          borderSide: BorderSide(color: error != null ? fx.danger : fx.mint.withValues(alpha: 0.8), width: 1.4),
        ),
        suffixIcon:
            suffix ??
            (clearable && controller != null && enabled && !obscure && maxLines == 1
                ? ListenableBuilder(
                    listenable: controller!,
                    builder: (context, _) => controller!.text.isEmpty
                        ? const SizedBox.shrink()
                        : IconButton(
                            tooltip: 'Hapus',
                            icon: Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(color: fx.card3, shape: BoxShape.circle),
                              child: Icon(Icons.close_rounded, size: 14, color: fx.muted),
                            ),
                            onPressed: () {
                              controller!.clear();
                              onChanged?.call('');
                            },
                          ),
                  )
                : null),
      ),
    );
    if (label == null && help == null && error == null) return field;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              label!,
              style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: fx.fg),
            ),
          ),
        field,
        AnimatedSize(
          duration: Motion.of(context, 200),
          curve: Curves.easeOut,
          child: (error != null || help != null)
              ? Padding(
                  padding: const EdgeInsets.only(left: 4, top: 6),
                  child: Text(error ?? help!, style: TextStyle(fontSize: 13, color: error != null ? fx.danger : fx.muted)),
                )
              : const SizedBox(width: double.infinity),
        ),
      ],
    );
  }
}

/// Segmented control dengan thumb yang meluncur (pegas).
class Segmented<T> extends StatelessWidget {
  const Segmented({super.key, required this.value, required this.options, required this.onChanged});
  final T value;
  final List<(T, String)> options;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final idx = options.indexWhere((o) => o.$1 == value).clamp(0, options.length - 1);
    return Container(
      height: 50,
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(color: fx.card, borderRadius: BorderRadius.circular(18)),
      child: LayoutBuilder(
        builder: (context, c) {
          final w = c.maxWidth / options.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: Motion.of(context, 520),
                curve: Springs.snappy,
                left: idx * w,
                top: 0,
                bottom: 0,
                width: w,
                child: Container(
                  decoration: BoxDecoration(color: fx.card3, borderRadius: BorderRadius.circular(14)),
                ),
              ),
              Row(
                children: [
                  for (final o in options)
                    Expanded(
                      child: Pressable(
                        scale: 0.95,
                        haptic: true,
                        onTap: () => onChanged(o.$1),
                        child: Center(
                          child: AnimatedDefaultTextStyle(
                            duration: Motion.of(context, 200),
                            style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: o.$1 == value ? fx.mint : fx.fg),
                            child: Text(o.$2, maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Chip filter horizontal.
class ChipBar extends StatelessWidget {
  const ChipBar({super.key, required this.items, required this.selected, required this.onSelect});
  final List<(String, String)> items;
  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (id, label) = items[i];
          final on = id == selected;
          return Pressable(
            onTap: () => onSelect(id),
            haptic: true,
            child: AnimatedContainer(
              duration: Motion.of(context, 220),
              curve: Curves.easeOut,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: on ? fx.mint : fx.card, borderRadius: BorderRadius.circular(R.pill)),
              child: Text(
                label,
                style: TextStyle(color: on ? fx.mintInk : fx.fg, fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
          );
        },
      ),
    );
  }
}

class ProgressBar extends StatelessWidget {
  const ProgressBar({super.key, required this.value, this.danger = false, this.height = 8, this.warnHigh = true});
  final double value; // 0..100
  final bool danger;

  /// Warna peringatan saat > 90% (untuk kuota). Matikan untuk progres request.
  final bool warnHigh;
  final double height;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final v = (value.isNaN ? 0 : value).clamp(0, 100) / 100;
    return ClipRRect(
      borderRadius: BorderRadius.circular(R.pill),
      child: Container(
        height: height,
        color: fx.card3,
        alignment: Alignment.centerLeft,
        child: TweenAnimationBuilder<double>(
          tween: Tween(end: v.toDouble()),
          duration: Motion.of(context, 700),
          curve: Springs.smooth,
          builder: (context, t, _) => FractionallySizedBox(
            widthFactor: t.clamp(0, 1),
            child: Container(
              decoration: BoxDecoration(color: danger ? fx.danger : (warnHigh && v > 0.9 ? fx.warn : fx.mint), borderRadius: BorderRadius.circular(R.pill)),
            ),
          ),
        ),
      ),
    );
  }
}

/// Bar bersegmen (gaya "BUILDS TODAY 0 of 5").
class SegmentBar extends StatelessWidget {
  const SegmentBar({super.key, required this.used, required this.limit, this.segments = 10});
  final int used;
  final int limit;
  final int segments;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final ratio = limit <= 0 ? 0.0 : (used / limit).clamp(0.0, 1.0);
    final filled = (ratio * segments).ceil();
    return Row(
      children: [
        for (var i = 0; i < segments; i++) ...[
          if (i > 0) const SizedBox(width: 5),
          Expanded(
            child: AnimatedContainer(
              duration: Motion.of(context, 300 + i * 40),
              height: 9,
              decoration: BoxDecoration(color: i < filled ? (ratio > 0.9 ? fx.warn : fx.mint) : fx.card3, borderRadius: BorderRadius.circular(R.pill)),
            ),
          ),
        ],
      ],
    );
  }
}

enum FxStep { todo, active, done, error }

class StepData {
  const StepData(this.label, this.state, {this.sub, this.time});
  final String label;
  final FxStep state;
  final String? sub;
  final String? time;
}

/// Daftar langkah ala layar build (Upload → Prepare → Build → Ready).
class Steps extends StatelessWidget {
  const Steps(this.steps, {super.key});
  final List<StepData> steps;

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 30,
                  child: Column(
                    children: [
                      _StepDot(state: steps[i].state),
                      if (i < steps.length - 1)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(vertical: 3),
                            color: steps[i].state == FxStep.done ? fx.mint.withValues(alpha: 0.6) : fx.line,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 3, bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          steps[i].label,
                          style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w500, color: steps[i].state == FxStep.todo ? fx.muted : fx.fg),
                        ),
                        if (steps[i].sub != null) Text(steps[i].sub!, style: TextStyle(fontSize: 13.5, color: fx.muted)),
                      ],
                    ),
                  ),
                ),
                if (steps[i].time != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(steps[i].time!, style: TextStyle(color: fx.muted, fontSize: 14)),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class _StepDot extends StatefulWidget {
  const _StepDot({required this.state});
  final FxStep state;
  @override
  State<_StepDot> createState() => _StepDotState();
}

class _StepDotState extends State<_StepDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(covariant _StepDot old) {
    super.didUpdateWidget(old);
    _sync();
  }

  void _sync() {
    if (widget.state == FxStep.active && !Motion.reduced(context)) {
      if (!_c.isAnimating) _c.repeat();
    } else {
      _c.stop();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final Widget dot = switch (widget.state) {
      FxStep.done => Container(
        key: const ValueKey('d'),
        decoration: BoxDecoration(color: fx.mint, shape: BoxShape.circle),
        child: Icon(Icons.check_rounded, size: 17, color: fx.mintInk),
      ),
      FxStep.error => Container(
        key: const ValueKey('e'),
        decoration: BoxDecoration(color: fx.danger, shape: BoxShape.circle),
        child: const Icon(Icons.close_rounded, size: 17, color: Colors.white),
      ),
      FxStep.active => RotationTransition(
        key: const ValueKey('a'),
        turns: _c,
        child: CustomPaint(painter: _DashedRing(fx.mint)),
      ),
      FxStep.todo => Container(
        key: const ValueKey('t'),
        decoration: BoxDecoration(color: fx.card3, shape: BoxShape.circle),
      ),
    };
    return SizedBox(
      width: 28,
      height: 28,
      child: AnimatedSwitcher(
        duration: Motion.of(context, 260),
        transitionBuilder: (c, a) => ScaleTransition(
          scale: CurvedAnimation(parent: a, curve: Springs.snappy),
          child: c,
        ),
        child: dot,
      ),
    );
  }
}

class _DashedRing extends CustomPainter {
  _DashedRing(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round;
    final r = Rect.fromLTWH(1.5, 1.5, size.width - 3, size.height - 3);
    const n = 10;
    const sweep = 6.283185307 / n;
    for (var i = 0; i < n; i++) {
      canvas.drawArc(r, i * sweep, sweep * 0.55, false, p);
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRing old) => old.color != color;
}

/// Kotak skeleton dengan kilau (shimmer). Statis bila reduce motion aktif.
class Skeleton extends StatefulWidget {
  const Skeleton({super.key, this.height = 70, this.width, this.radius = R.card});
  final double height;
  final double? width;
  final double radius;
  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (Motion.reduced(context)) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final t = _c.value * 2 - 0.5;
          return Container(
            height: widget.height,
            width: widget.width ?? double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.radius),
              gradient: LinearGradient(begin: Alignment(-1 + t * 2 - 0.6, 0), end: Alignment(-1 + t * 2 + 0.6, 0), colors: [fx.card, fx.card2, fx.card]),
            ),
          );
        },
      ),
    );
  }
}

class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key, this.count = 4, this.height = 76});
  final int count;
  final double height;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (var i = 0; i < count; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Skeleton(height: height),
        ),
    ],
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.text, this.action});
  final IconData icon;
  final String title;
  final String? text;
  final Widget? action;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return FxCard(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 30),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: fx.mintSoft, shape: BoxShape.circle),
            child: Icon(icon, color: fx.mint, size: 28),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          if (text != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                text!,
                textAlign: TextAlign.center,
                style: TextStyle(color: fx.muted, fontSize: 14.5),
              ),
            ),
          if (action != null) ...[const SizedBox(height: 18), action!],
        ],
      ),
    );
  }
}

/// Muncul halus (fade + naik sedikit) saat pertama dibangun.
class FadeIn extends StatelessWidget {
  const FadeIn({super.key, required this.child, this.delay = 0, this.offset = 14});
  final Widget child;
  final int delay;
  final double offset;
  @override
  Widget build(BuildContext context) {
    if (Motion.reduced(context)) return child;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 420 + delay),
      curve: Interval(delay / (420 + delay), 1, curve: Curves.easeOutCubic),
      child: child,
      builder: (context, t, c) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, (1 - t) * offset), child: c),
      ),
    );
  }
}

/// Peralihan isi yang halus antara loading / sukses / error.
class Swap extends StatelessWidget {
  const Swap({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
    duration: Motion.of(context, 280),
    switchInCurve: Curves.easeOutCubic,
    switchOutCurve: Curves.easeIn,
    layoutBuilder: (cur, prev) => Stack(alignment: Alignment.topCenter, children: [...prev, ?cur]),
    transitionBuilder: (c, a) => FadeTransition(
      opacity: a,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.02), end: Offset.zero).animate(a),
        child: c,
      ),
    ),
    child: child,
  );
}
