import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/api_client.dart';
import '../../core/api_exception.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../theme/motion.dart';
import '../../widgets/code.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/page.dart';
import 'result_links.dart';
import 'video_task_card.dart';

/// Petunjuk error gateway (components/runner.tsx → HINTS) + error lokal aplikasi.
const runnerHints = <String, (String, String, String)>{
  'API_KEY_REQUIRED': ('API key dibutuhkan', 'Request dari luar situs wajib memakai API key.', 'Buat key gratis di Akun › API Key.'),
  'INVALID_API_KEY': ('API key tidak dikenali', 'Key salah ketik, sudah dibuat ulang, atau milik akun lain.', 'Salin ulang key dari dashboard lalu coba lagi.'),
  'KEY_REVOKED': ('API key dicabut', 'Key ini sudah tidak aktif.', 'Buat key baru di dashboard.'),
  'PREMIUM_REQUIRED': ('Khusus premium', 'Endpoint ini hanya untuk API key premium.', 'Upgrade key di halaman Paket.'),
  'RATE_LIMITED': ('Limit tercapai', 'Kuota request untuk key ini sudah habis sementara.', 'Tunggu sebentar, lalu tap Coba lagi.'),
  'INVALID_PARAMS': ('Parameter belum benar', 'Ada parameter yang kosong atau formatnya salah.', 'Periksa kolom yang ditandai lalu kirim ulang.'),
  'PROVIDER_UNAVAILABLE': (
    'Layanan belum tersedia',
    'Penyedia untuk endpoint ini belum dikonfigurasi atau kuotanya habis.',
    'Coba endpoint lain atau hubungi admin.',
  ),
  'MAINTENANCE': ('Sedang perbaikan', 'Endpoint ini dinonaktifkan sementara oleh admin.', 'Coba lagi nanti.'),
  'PROVIDER_ERROR': (
    'Penyedia bermasalah',
    'Server penyedia mengembalikan error. Permintaanmu kemungkinan sudah benar.',
    'Tunggu sekitar satu menit, lalu tap Coba lagi.',
  ),
  'PROVIDER_TIMEOUT': ('Proses terlalu lama', 'Penyedia tidak merespons tepat waktu.', 'Tunggu sekitar satu menit, lalu tap Coba lagi.'),
  'NOT_FOUND': ('Data tidak ditemukan', 'Konten tidak ada, privat, atau sudah dihapus.', 'Periksa kembali link/kata kunci.'),
  'SESSION_NOT_FOUND': (
    'Sesi Qwerty berakhir',
    'Sesi percakapan tidak ditemukan atau sudah kedaluwarsa (7 hari).',
    'Tap "Sesi baru" lalu kirim ulang pesanmu.',
  ),
  'TASK_NOT_FOUND': ('Task tidak ditemukan', 'Task video tidak ada, sudah lewat 24 jam, atau milik akun lain.', 'Buat task baru lewat video/generate.'),
  'POLL_TOO_FAST': ('Terlalu cepat', 'Status task hanya boleh dicek sekali tiap 5 detik.', 'Tunggu beberapa detik lalu cek lagi.'),
  'NETWORK': ('Tidak ada koneksi', 'Request tidak sampai ke server.', 'Periksa internet lalu tap Coba lagi.'),
  'TIMEOUT': ('Waktu habis', 'Server tidak merespons dalam 75 detik.', 'Tunggu sebentar, lalu coba lagi.'),
  'BACKEND_UNAVAILABLE': (
    'Backend belum dapat diakses',
    'Reverse proxy/panel membalas tanpa respons dari aplikasi FxB. Server Pterodactyl kemungkinan mati atau sedang restart.',
    'Tunggu sekitar satu menit, lalu tap Coba lagi.',
  ),
};

const _validationCodes = {
  'API_KEY_REQUIRED', 'INVALID_API_KEY', 'KEY_REVOKED', 'PREMIUM_REQUIRED', 'RATE_LIMITED', 'ACCOUNT_SUSPENDED', //
  'INVALID_PARAMS', 'METHOD_NOT_ALLOWED', 'MAINTENANCE',
};

enum _Phase { idle, running, success, error }

class _ChatTurn {
  _ChatTurn(this.user, this.reply);
  final String user;
  final String reply;
}

class RunnerScreen extends StatelessWidget {
  const RunnerScreen({super.key, required this.endpoint, this.initial});
  final Endpoint endpoint;
  final Map<String, String>? initial;

  @override
  Widget build(BuildContext context) => FxPage(
    title: 'Try API',
    subtitle: '${endpoint.method} ${endpoint.path}',
    children: [
      const SizedBox(height: 12),
      Runner(endpoint: endpoint, initial: initial),
    ],
  );
}

/// Form + eksekusi request gateway dengan tampilan status ala layar build.
class Runner extends StatefulWidget {
  const Runner({super.key, required this.endpoint, this.initial});
  final Endpoint endpoint;
  final Map<String, String>? initial;

  @override
  State<Runner> createState() => _RunnerState();
}

class _RunnerState extends State<Runner> {
  late final AppState app = App.of(context);
  final _ctrls = <String, TextEditingController>{};
  final _files = <String, GatewayFile?>{};
  final _manualKey = TextEditingController();
  final _elapsed = ValueNotifier<int>(0);
  Map<String, String> _fieldErrors = {};
  _Phase _phase = _Phase.idle;
  GatewayResult? _res;
  ApiException? _localError;
  GatewayCancel? _cancel;
  Timer? _ticker;
  DateTime _started = DateTime.now();

  // Mode autentikasi: 'session' (seperti Explorer website) atau 'key'.
  String _authMode = 'session';
  Map<String, String> _savedKeys = {};
  Map<String, String> _keyNames = {};
  String? _selectedKeyId;

  final _chat = <_ChatTurn>[];

  Endpoint get ep => widget.endpoint;

  @override
  void initState() {
    super.initState();
    _resetFields();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadKeys());
  }

  @override
  void didUpdateWidget(covariant Runner old) {
    super.didUpdateWidget(old);
    if (old.endpoint.id != widget.endpoint.id) {
      _cancel?.cancel();
      _ticker?.cancel();
      setState(() {
        _resetFields();
        _phase = _Phase.idle;
        _res = null;
        _localError = null;
        _chat.clear();
      });
    }
  }

  void _resetFields() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    _ctrls.clear();
    _files.clear();
    _fieldErrors = {};
    for (final p in ep.params) {
      if (p.isFile) continue;
      _ctrls[p.name] = TextEditingController(text: widget.initial?[p.name] ?? p.example ?? p.defaultValue ?? '');
    }
    if (ep.id == 'ai/qwerty') _ctrls['sessionId']?.text = '';
  }

  Future<void> _loadKeys() async {
    final saved = await app.api.store.readSavedKeys();
    var names = <String, String>{};
    if (app.me.value != null && saved.isNotEmpty) {
      try {
        final list = await app.api.get('/api/keys');
        if (list is List) {
          final active = list.whereType<Map>().map(ApiKeyInfo.new).where((k) => k.active);
          names = {for (final k in active) k.id: '${k.name} · ${k.prefix}…'};
          // Buang salinan key yang sudah dicabut/dihapus di server.
          for (final id in saved.keys.toList()) {
            if (!names.containsKey(id)) {
              saved.remove(id);
              unawaited(app.api.store.removeKey(id));
            }
          }
        }
      } catch (_) {}
    }
    if (!mounted) return;
    setState(() {
      _savedKeys = saved;
      _keyNames = names;
      _selectedKeyId ??= saved.keys.isEmpty ? null : saved.keys.first;
    });
  }

  @override
  void dispose() {
    _cancel?.cancel();
    _ticker?.cancel();
    for (final c in _ctrls.values) {
      c.dispose();
    }
    _manualKey.dispose();
    _elapsed.dispose();
    super.dispose();
  }

  String? get _apiKey {
    if (_authMode != 'key') return null;
    if (_manualKey.text.trim().isNotEmpty) return _manualKey.text.trim();
    return _selectedKeyId == null ? null : _savedKeys[_selectedKeyId];
  }

  Future<void> _run() async {
    if (_phase == _Phase.running) return; // tidak ada kirim ganda
    FocusScope.of(context).unfocus();
    final missing = <String, String>{};
    for (final p in ep.params.where((p) => p.required)) {
      if (p.isFile ? _files[p.name] == null : (_ctrls[p.name]?.text.trim().isEmpty ?? true)) missing[p.name] = 'Wajib diisi';
    }
    if (missing.isNotEmpty) {
      setState(() => _fieldErrors = missing);
      toast('Lengkapi parameter wajib dulu.', kind: ToastKind.warn);
      return;
    }
    if (_authMode == 'key' && _apiKey == null) {
      toast('Pilih atau tempel API key dulu.', kind: ToastKind.warn);
      return;
    }
    final params = <String, String>{
      for (final e in _ctrls.entries)
        if (e.value.text.trim().isNotEmpty) e.key: e.value.text.trim(),
    };
    final files = <String, GatewayFile>{
      for (final e in _files.entries)
        if (e.value != null) e.key: e.value!,
    };
    final userText = params['text'];

    _cancel = GatewayCancel();
    _started = DateTime.now();
    _elapsed.value = 0;
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 100), (_) => _elapsed.value = DateTime.now().difference(_started).inMilliseconds);
    setState(() {
      _fieldErrors = {};
      _phase = _Phase.running;
      _res = null;
      _localError = null;
    });

    try {
      final r = await app.api.gateway(method: ep.method, path: ep.path, params: params, files: files, apiKey: _apiKey, cancel: _cancel);
      if (!mounted) return;
      final details = r.error?['details'];
      setState(() {
        _res = r;
        _phase = r.ok ? _Phase.success : _Phase.error;
        if (details is List) {
          _fieldErrors = {
            for (final d in details)
              if (d is Map && d['param'] != null) '${d['param']}': '${d['message'] ?? 'Tidak valid'}',
          };
        }
        if (r.ok && ep.id == 'ai/qwerty' && userText != null) {
          final result = (r.json as Map?)?['result'];
          if (result is Map) {
            _chat.add(_ChatTurn(userText, '${result['reply'] ?? result['text'] ?? ''}'));
            final sid = result['sessionId'];
            if (sid is String && sid.isNotEmpty) _ctrls['sessionId']?.text = sid;
            _ctrls['text']?.clear();
          }
        }
      });
      if (r.ok) unawaited(app.refreshMe().catchError((Object _) {}));
    } on GatewayCancelled {
      if (mounted) setState(() => _phase = _Phase.idle);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _localError = e;
          _phase = _Phase.error;
        });
      }
    } finally {
      _ticker?.cancel();
      _elapsed.value = DateTime.now().difference(_started).inMilliseconds;
    }
  }

  Future<void> _pickFile(String name) async {
    try {
      final f = await FilePicker.pickFile();
      if (f == null) return;
      final size = await f.length() ?? 0;
      if (size > 9 * 1024 * 1024) {
        toast('File terlalu besar (${fmtBytes(size)}). Batas body request server 9 MB; endpoint upload maksimal 5 MB.', kind: ToastKind.warn);
        return;
      }
      final bytes = await f.readAsBytes();
      if (!mounted) return;
      setState(() {
        _files[name] = GatewayFile(f.name, bytes);
        _fieldErrors.remove(name);
      });
    } catch (e) {
      toast('Tidak bisa membuka file: $e', kind: ToastKind.error);
    }
  }

  Future<void> _pickOption(Param p) async {
    final opts = <(String, String)>[
      if (!p.required || p.type == 'boolean') ('', '— default${(p.defaultValue ?? '').isNotEmpty ? ' (${p.defaultValue})' : ''} —'),
      if (p.type == 'boolean') ...[('true', 'true'), ('false', 'false')] else for (final o in p.options ?? const <String>[]) (o, o),
    ];
    final v = await showFxSheet<String>(
      context,
      title: p.name,
      subtitle: p.description,
      builder: (ctx) => ListGroup(
        children: [
          for (final o in opts)
            ListRow(
              label: o.$2,
              chevron: false,
              trailing: _ctrls[p.name]?.text == o.$1 ? Icon(Icons.check_rounded, color: Fx.of(ctx).mint) : null,
              onTap: () => Navigator.pop(ctx, o.$1),
            ),
        ],
      ),
    );
    if (v != null) setState(() => _ctrls[p.name]?.text = v);
  }

  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (ep.id == 'ai/qwerty' && _chat.isNotEmpty) _qwertyTranscript(fx),
        for (final p in ep.params) Padding(padding: const EdgeInsets.only(bottom: 16), child: _paramField(p, fx)),
        _authSection(fx),
        const SizedBox(height: 18),
        if (_phase == _Phase.running)
          FxButton('Batalkan', icon: Icons.close_rounded, big: true, expand: true, variant: BtnVariant.secondary, onTap: () => _cancel?.cancel())
        else
          FxButton(
            _phase == _Phase.error ? 'Coba lagi' : (ep.online ? 'Kirim request' : (ep.status == 'maintenance' ? 'Sedang perbaikan' : 'Belum dikonfigurasi')),
            icon: CupertinoIcons.play_fill,
            big: true,
            expand: true,
            onTap: ep.online ? _run : null,
          ),
        if (ep.method == 'POST' && _phase != _Phase.running)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Request POST tidak pernah dikirim ulang otomatis, agar tidak membuat upload/task ganda.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: fx.subtle),
            ),
          ),
        AnimatedSize(
          duration: Motion.of(context, 360),
          curve: Springs.smooth,
          alignment: Alignment.topCenter,
          child: _phase == _Phase.idle ? const SizedBox(width: double.infinity) : _statusArea(fx),
        ),
      ],
    );
  }

  Widget _qwertyTranscript(Fx fx) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: FxCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(CupertinoIcons.chat_bubble_2, color: fx.mint, size: 20),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Percakapan Qwerty', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                FxButton(
                  'Sesi baru',
                  small: true,
                  variant: BtnVariant.secondary,
                  onTap: () {
                    setState(() {
                      _chat.clear();
                      _ctrls['sessionId']?.text = '';
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 10),
            for (final t in _chat) ...[
              Align(
                alignment: Alignment.centerRight,
                child: Container(
                  margin: const EdgeInsets.only(left: 40, bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(color: fx.mint, borderRadius: BorderRadius.circular(18)),
                  child: Text(t.user, style: TextStyle(color: fx.mintInk)),
                ),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(right: 40, bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(18)),
                  child: SelectableText(t.reply),
                ),
              ),
            ],
            Text(
              (_ctrls['sessionId']?.text ?? '').isEmpty
                  ? 'Belum ada sessionId (sesi hanya disimpan untuk akun/API key yang login).'
                  : 'sessionId tersimpan otomatis — pesan berikutnya melanjutkan percakapan.',
              style: TextStyle(fontSize: 12.5, color: fx.muted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _paramField(Param p, Fx fx) {
    final label = Row(
      children: [
        Text(
          p.name,
          style: const TextStyle(fontFamily: kMono, fontWeight: FontWeight.w700, fontSize: 14),
        ),
        const SizedBox(width: 8),
        if (p.required) const Pill('wajib', tone: Tone.warn) else Text('opsional', style: TextStyle(color: fx.subtle, fontSize: 12.5)),
      ],
    );
    final err = _fieldErrors[p.name];
    Widget input;
    if (p.isFile) {
      final f = _files[p.name];
      input = Row(
        children: [
          Expanded(
            child: Pressable(
              onTap: () => _pickFile(p.name),
              child: Container(
                height: 54,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: fx.card2,
                  borderRadius: BorderRadius.circular(R.field),
                  border: err != null ? Border.all(color: fx.danger.withValues(alpha: 0.7)) : null,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        f == null ? 'Pilih file' : '${f.name} · ${fmtBytes(f.bytes.length)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 15.5),
                      ),
                    ),
                    Icon(f == null ? CupertinoIcons.arrow_up_doc : CupertinoIcons.doc_checkmark, color: f == null ? fx.fg : fx.mint),
                  ],
                ),
              ),
            ),
          ),
          if (f != null) ...[
            const SizedBox(width: 8),
            FxIconButton(Icons.close_rounded, filled: true, size: 54, tooltip: 'Hapus file', onTap: () => setState(() => _files[p.name] = null)),
          ],
        ],
      );
    } else if (p.type == 'enum' || p.type == 'boolean') {
      final c = _ctrls[p.name]!;
      input = Pressable(
        onTap: () => _pickOption(p),
        child: Container(
          height: 54,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: fx.card2, borderRadius: BorderRadius.circular(R.field)),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  c.text.isEmpty ? '— default${(p.defaultValue ?? '').isNotEmpty ? ' (${p.defaultValue})' : ''} —' : c.text,
                  style: TextStyle(fontSize: 15.5, color: c.text.isEmpty ? fx.muted : fx.fg),
                ),
              ),
              Icon(CupertinoIcons.chevron_down, size: 16, color: fx.muted),
            ],
          ),
        ),
      );
    } else {
      input = FxField(
        controller: _ctrls[p.name],
        hint: p.example ?? p.defaultValue,
        mono: p.type == 'json' || p.name == 'sessionId' || p.name == 'taskId',
        maxLines: p.multiline ? 6 : 1,
        minLines: p.multiline ? 3 : null,
        keyboard: p.type == 'number' ? const TextInputType.numberWithOptions(decimal: true) : (p.multiline ? TextInputType.multiline : TextInputType.text),
        maxLength: p.max,
        error: err,
        onChanged: (_) {
          if (_fieldErrors.containsKey(p.name)) setState(() => _fieldErrors.remove(p.name));
        },
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.only(left: 4, bottom: 8), child: label),
        input,
        Padding(
          padding: const EdgeInsets.only(left: 4, top: 6),
          child: Text(
            (p.isFile || p.type == 'enum' || p.type == 'boolean') && err != null ? err : p.description,
            style: TextStyle(fontSize: 13, color: err != null && (p.isFile || p.type == 'enum' || p.type == 'boolean') ? fx.danger : fx.muted),
          ),
        ),
      ],
    );
  }

  Widget _authSection(Fx fx) {
    return ValueListenableBuilder<User?>(
      valueListenable: app.me,
      builder: (context, me, _) => FxCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Autentikasi',
              style: TextStyle(fontWeight: FontWeight.w700, color: fx.fg, fontSize: 15),
            ),
            const SizedBox(height: 10),
            Segmented<String>(
              value: _authMode,
              options: [('session', me != null ? 'Sesi akun' : 'Uji coba'), ('key', 'API key')],
              onChanged: (v) => setState(() => _authMode = v),
            ),
            const SizedBox(height: 10),
            if (_authMode == 'session')
              Text(
                me != null
                    ? 'Seperti API Explorer website: kuota dihitung pada key terbaik akunmu (${me.quota?.keyName ?? 'tanpa key'}).'
                    : 'Belum login: memakai kuota uji coba terbatas per IP (sama seperti website). Login untuk kuota akun.',
                style: TextStyle(fontSize: 13, color: fx.muted),
              )
            else ...[
              if (_savedKeys.isNotEmpty) ...[
                for (final id in _savedKeys.keys)
                  Pressable(
                    onTap: () => setState(() {
                      _selectedKeyId = id;
                      _manualKey.clear();
                    }),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Icon(
                            _selectedKeyId == id && _manualKey.text.isEmpty ? CupertinoIcons.largecircle_fill_circle : CupertinoIcons.circle,
                            color: fx.mint,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _keyNames[id] ?? '${_savedKeys[id]!.substring(0, _savedKeys[id]!.length.clamp(0, 10))}… (tersimpan)',
                              style: const TextStyle(fontFamily: kMono, fontSize: 13.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
              ],
              FxField(controller: _manualKey, hint: 'fxb_xxxxxxxxxxxxxxxxxxxxxxxx', mono: true, onChanged: (_) => setState(() {})),
              const SizedBox(height: 6),
              Text(
                _savedKeys.isEmpty
                    ? 'Tempel API key milikmu. Key yang dibuat/dibuat ulang di aplikasi ini otomatis tersimpan terenkripsi di perangkat.'
                    : 'Pilih key tersimpan, atau tempel key lain di kolom ini.',
                style: TextStyle(fontSize: 13, color: fx.muted),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusArea(Fx fx) {
    final r = _res;
    final errCode = _localError?.code ?? r?.errorCode ?? (r != null && r.backendDown ? 'BACKEND_UNAVAILABLE' : null);
    final errMsg =
        _localError?.message ??
        r?.error?['message']?.toString() ??
        (r != null && r.backendDown ? ApiClient.statusError(r.status).message : (r != null && !r.ok ? 'HTTP ${r.status}' : null));
    final errStep = errCode != null && _validationCodes.contains(errCode) ? 1 : 2;
    final states = switch (_phase) {
      _Phase.running => [FxStep.done, FxStep.active, FxStep.todo, FxStep.todo],
      _Phase.success => [FxStep.done, FxStep.done, FxStep.done, FxStep.done],
      _Phase.error => errStep == 1 ? [FxStep.done, FxStep.error, FxStep.todo, FxStep.todo] : [FxStep.done, FxStep.done, FxStep.error, FxStep.todo],
      _Phase.idle => [FxStep.todo, FxStep.todo, FxStep.todo, FxStep.todo],
    };
    final hint = errCode == null ? null : (runnerHints[errCode] ?? ('Request tidak selesai', errMsg ?? '', 'Tunggu sekitar satu menit, lalu tap Coba lagi.'));

    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_phase == _Phase.error && hint != null) ...[
            FailureCard(
              title: hint.$1,
              text: errCode == 'BACKEND_UNAVAILABLE' || _localError != null ? (errMsg ?? hint.$2) : hint.$2,
              tip: errCode == 'RATE_LIMITED' && r?.headers['retry-after'] != null ? 'Coba lagi dalam ${r!.headers['retry-after']} detik.' : hint.$3,
              stats: [StatItem(r == null ? '—' : '${r.status}', 'HTTP'), StatItem(mmss(_elapsed.value), 'Waktu')],
              details:
                  'Endpoint: ${ep.path}\nStatus: ${r?.status ?? '— (tidak ada respons server)'}\nCode: $errCode\nMessage: $errMsg'
                  '${_localError != null ? '\nSumber: aplikasi (request tidak mendapat respons server)' : ''}',
            ),
            const SizedBox(height: 16),
          ],
          FxCard(
            radius: R.big,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ValueListenableBuilder<int>(
                  valueListenable: _elapsed,
                  builder: (context, ms, _) {
                    final progress = switch (_phase) {
                      _Phase.running => (25 + (ms / 15000) * 60).clamp(0, 85).toDouble(),
                      _Phase.idle => 0.0,
                      _ => 100.0,
                    };
                    final stepNo = _phase == _Phase.success ? 4 : (_phase == _Phase.running ? 2 : errStep + 1);
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(switch (_phase) {
                                _Phase.running => 'Memanggil endpoint',
                                _Phase.success => 'Respons diterima',
                                _ => 'Request gagal',
                              }, style: TextStyle(color: fx.muted, fontSize: 14.5)),
                            ),
                            Text('Step $stepNo of 4 · ${mmss(ms)}', style: TextStyle(color: fx.muted, fontSize: 14.5)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ProgressBar(value: progress, danger: _phase == _Phase.error, warnHigh: false),
                        const SizedBox(height: 14),
                        StatGrid(transparent: true, [
                          StatItem(ep.method, 'Method'),
                          StatItem(r == null ? '…' : '${r.status}', 'Status'),
                          StatItem(r == null ? mmss(ms) : '${r.ms} ms', 'Latency'),
                        ]),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                const Text('Langkah request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 14),
                Steps([
                  StepData('Kirim', states[0], time: '00:00'),
                  StepData('Validasi key & parameter', states[1], sub: states[1] == FxStep.active ? 'Memeriksa…' : null),
                  StepData(
                    'Proses',
                    states[2],
                    sub: states[2] == FxStep.active ? 'Menunggu penyedia' : null,
                    time: r != null && states[2] == FxStep.done ? '${(r.ms / 1000).toStringAsFixed(2)}s' : null,
                  ),
                  StepData('Selesai', states[3], time: r != null && _phase == _Phase.success ? '${(r.totalMs / 1000).toStringAsFixed(2)}s' : null),
                ]),
              ],
            ),
          ),
          if (r != null && _phase == _Phase.success) ...[
            const SizedBox(height: 14),
            FxCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(CupertinoIcons.checkmark_seal_fill, color: fx.mint, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Berhasil', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                        Text(
                          '${r.contentType.split(';').first} · ${fmtBytes(r.bytes.length)}'
                          '${r.headers['x-ratelimit-remaining'] != null ? ' · sisa ${r.headers['x-ratelimit-remaining']} request' : ''}',
                          style: TextStyle(fontSize: 13, color: fx.muted),
                        ),
                      ],
                    ),
                  ),
                  if (r.headers['x-tier'] != null) Pill(r.headers['x-tier']!, tone: r.headers['x-tier'] == 'premium' ? Tone.mint : Tone.neutral),
                ],
              ),
            ),
          ],
          if (r != null && _phase == _Phase.success && ep.id == 'video/generate') ...[
            const SizedBox(height: 14),
            VideoTaskCard(initial: (r.json as Map?)?['result'], apiKey: _apiKey),
          ],
          if (r != null) ...[const SizedBox(height: 14), _resultView(r, fx)],
        ],
      ),
    );
  }

  Widget _resultView(GatewayResult r, Fx fx) {
    if (r.isImage) {
      return _MediaCard(
        footer: '${r.contentType} · ${fmtBytes(r.bytes.length)}',
        child: Image.memory(r.bytes, fit: BoxFit.contain, gaplessPlayback: true, errorBuilder: (_, _, _) => const Text('Gambar tidak dapat ditampilkan.')),
      );
    }
    if (r.isSvg && r.text != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _MediaCard(
            footer: 'image/svg+xml · ${fmtBytes(r.bytes.length)}',
            child: SvgPicture.string(r.text!, fit: BoxFit.contain, errorBuilder: (_, _, _) => const Text('SVG tidak dapat ditampilkan.')),
          ),
          const SizedBox(height: 12),
          CodeBlock(code: r.text!, lang: 'svg', maxHeight: 260),
        ],
      );
    }
    if (r.isJson) {
      final result = (r.json is Map) ? (r.json as Map)['result'] : null;
      final urls = r.ok ? collectUrls(result ?? r.json) : const <String>[];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (urls.isNotEmpty) ...[ResultLinks(urls: urls), const SizedBox(height: 12)],
          CodeBlock(code: prettyJson(r.json), json: true, lang: 'response ${r.status}', maxHeight: 520),
        ],
      );
    }
    if (r.text != null && r.text!.isNotEmpty) {
      return CodeBlock(code: r.text!, lang: 'response ${r.status} · ${r.contentType.split(';').first}', maxHeight: 400);
    }
    return FxCard(
      child: Text(
        'File biner (${r.contentType.isEmpty ? 'tanpa content-type' : r.contentType}) · ${fmtBytes(r.bytes.length)}',
        style: TextStyle(color: fx.muted),
      ),
    );
  }
}

class _MediaCard extends StatelessWidget {
  const _MediaCard({required this.child, required this.footer});
  final Widget child;
  final String footer;
  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return Container(
      decoration: BoxDecoration(
        color: fx.card,
        borderRadius: BorderRadius.circular(R.card),
        border: Border.all(color: fx.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 460, minHeight: 120),
            child: Container(
              color: fx.dark ? const Color(0xFF111113) : const Color(0xFFF1F2F4),
              padding: const EdgeInsets.all(10),
              child: Center(child: child),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(footer, style: TextStyle(color: fx.muted, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
