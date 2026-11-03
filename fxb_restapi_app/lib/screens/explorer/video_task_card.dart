import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api_exception.dart';
import '../../core/format.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import 'result_links.dart';

/// Pengecekan task video sesuai kontrak `video/status`:
/// GET /api/v1/video/status?taskId=… — paling sering sekali tiap 5 detik,
/// task milik akun/key yang sama, berlaku 24 jam.
/// Hanya GET (aman diulang); task baru TIDAK pernah dibuat ulang otomatis.
class VideoTaskCard extends StatefulWidget {
  const VideoTaskCard({super.key, required this.initial, this.apiKey});
  final Object? initial;
  final String? apiKey;
  @override
  State<VideoTaskCard> createState() => _VideoTaskCardState();
}

class _VideoTaskCardState extends State<VideoTaskCard> {
  String? _taskId;
  String _status = 'pending';
  String? _videoUrl;
  String? _message;
  int _pollAfter = 5;
  int _cooldown = 0;
  bool _busy = false;
  bool _auto = false;
  int _checks = 0;
  Timer? _cd;
  Timer? _autoTimer;

  static const _maxAutoChecks = 120; // ±10 menit

  @override
  void initState() {
    super.initState();
    final m = widget.initial;
    if (m is Map) {
      _taskId = m['taskId']?.toString();
      _status = m['status']?.toString() ?? 'pending';
      _pollAfter = asInt(m['pollAfterSeconds'], 5).clamp(5, 60);
    }
    _startCooldown(_pollAfter);
  }

  @override
  void dispose() {
    _cd?.cancel();
    _autoTimer?.cancel();
    super.dispose();
  }

  bool get _finished => _status == 'success' || _status == 'failed' || _status == 'error';

  void _startCooldown(int s) {
    _cd?.cancel();
    setState(() => _cooldown = s);
    _cd = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _cooldown = (_cooldown - 1).clamp(0, 999));
      if (_cooldown == 0) {
        t.cancel();
        if (_auto && !_finished && !_busy) _check();
      }
    });
  }

  Future<void> _check() async {
    if (_taskId == null || _busy || _cooldown > 0) return;
    setState(() => _busy = true);
    try {
      final r = await App.of(context).api.gateway(method: 'GET', path: '/api/v1/video/status', params: {'taskId': _taskId!}, apiKey: widget.apiKey);
      _checks++;
      if (!mounted) return;
      final j = r.json is Map ? r.json as Map : const {};
      if (r.ok && j['result'] is Map) {
        final res = j['result'] as Map;
        setState(() {
          _status = '${res['status'] ?? _status}';
          _videoUrl = res['videoUrl']?.toString() ?? _videoUrl;
          _message = res['message']?.toString();
          _pollAfter = asInt(res['pollAfterSeconds'], _pollAfter).clamp(5, 60);
        });
      } else {
        final e = j['error'] is Map ? j['error'] as Map : null;
        final code = e?['code']?.toString() ?? 'HTTP_${r.status}';
        setState(() => _message = '${e?['message'] ?? 'Cek status gagal (HTTP ${r.status}).'} [$code]');
        if (code == 'TASK_NOT_FOUND') _auto = false;
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        if (_finished || _checks >= _maxAutoChecks) _auto = false;
        if (!_finished) _startCooldown(_pollAfter);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    if (_taskId == null) {
      return const SizedBox.shrink();
    }
    final tone = _status == 'success' ? Tone.mint : (_finished ? Tone.danger : Tone.warn);
    return FxCard(
      radius: R.big,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.film, color: fx.mint),
              const SizedBox(width: 10),
              const Expanded(
                child: Text('Task video', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              ),
              Pill(_status, tone: tone),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  'taskId: $_taskId',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontFamily: kMono, fontSize: 12.5, color: fx.muted),
                ),
              ),
              FxIconButton(
                Icons.copy_rounded,
                size: 34,
                tooltip: 'Salin taskId',
                onTap: () => copyText(_taskId!, done: 'taskId disalin.'),
              ),
            ],
          ),
          if (!_finished) ...[
            const SizedBox(height: 8),
            const ProgressBar(value: 60),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FxButton(
                    _cooldown > 0 ? 'Cek lagi dalam ${_cooldown}s' : 'Cek status',
                    icon: CupertinoIcons.arrow_clockwise,
                    loading: _busy,
                    onTap: _cooldown > 0 ? null : _check,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text('Cek otomatis tiap $_pollAfter detik', style: TextStyle(color: fx.muted, fontSize: 14)),
                ),
                Switch(
                  value: _auto,
                  onChanged: (v) {
                    setState(() => _auto = v);
                    if (v && _cooldown == 0) _check();
                  },
                ),
              ],
            ),
          ],
          if (_message != null) ...[
            const SizedBox(height: 8),
            Text(_message!, style: TextStyle(color: _status == 'success' ? fx.muted : fx.warn, fontSize: 13.5)),
          ],
          if (_videoUrl != null) ...[
            const SizedBox(height: 12),
            FxButton('Buka video', icon: CupertinoIcons.play_rectangle, expand: true, onTap: () => openExternal(_videoUrl!)),
            const SizedBox(height: 8),
            FxButton('Salin URL video', icon: Icons.copy_rounded, expand: true, variant: BtnVariant.secondary, onTap: () => copyText(_videoUrl!)),
          ],
        ],
      ),
    );
  }
}
