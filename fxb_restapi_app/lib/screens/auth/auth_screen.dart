import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api_exception.dart';
import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../theme/motion.dart';
import '../../widgets/brand.dart';
import '../../widgets/common.dart';
import '../../widgets/feedback.dart';
import '../../widgets/key_reveal.dart';
import '../../widgets/page.dart';
import '../legal_screen.dart';

/// Login & daftar (components/auth-form.tsx) memakai /api/auth/login & /register.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.register = false, this.embedded = false});
  final bool register;

  /// true bila ditampilkan di dalam tab Akun (bukan rute terpisah).
  final bool embedded;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late bool _register = widget.register;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _show = false;
  Map<String, String> _errors = {};
  String? _formError;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  bool _validate() {
    final e = <String, String>{};
    final email = _email.text.trim();
    if (_register && _name.text.trim().length < 2) e['name'] = 'Nama minimal 2 karakter.';
    if (email.isEmpty) {
      e['email'] = 'Email wajib diisi.';
    } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(email)) {
      e['email'] = 'Format email tidak valid.';
    }
    if (_password.text.isEmpty) {
      e['password'] = 'Password wajib diisi.';
    } else if (_register && _password.text.length < 8) {
      e['password'] = 'Password minimal 8 karakter.';
    }
    setState(() {
      _errors = e;
      _formError = null;
    });
    return e.isEmpty;
  }

  Future<void> _submit() async {
    if (_busy) return; // cegah kirim ganda
    FocusScope.of(context).unfocus();
    if (!_validate()) return;
    setState(() => _busy = true);
    final app = App.of(context);
    try {
      if (_register) {
        final key = await app.register(_name.text.trim(), _email.text.trim(), _password.text);
        if (key != null) await _rememberKey(app, key);
        if (!mounted) return;
        if (key != null) {
          await showFxSheet<void>(
            context,
            title: 'Akun dibuat 🎉',
            subtitle: 'Ini API key gratis pertamamu',
            builder: (ctx) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                KeyReveal(secret: key),
                const SizedBox(height: 12),
                FxButton('Sudah disimpan', big: true, expand: true, onTap: () => Navigator.pop(ctx)),
              ],
            ),
          );
        }
      } else {
        await app.login(_email.text.trim(), _password.text);
      }
      if (!mounted) return;
      toast(_register ? 'Selamat datang di FxB RestApi!' : 'Berhasil masuk.');
      if (!widget.embedded && Navigator.of(context).canPop()) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _formError = e.message);
      if (e.code == 'EMAIL_TAKEN') setState(() => _errors = {'email': e.message});
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _rememberKey(AppState app, String secret) async {
    try {
      final list = await app.api.get('/api/keys');
      if (list is List && list.length == 1 && list.first is Map) {
        await app.api.store.saveKey(ApiKeyInfo(list.first as Map).id, secret);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    return FxPage(
      title: _register ? 'Daftar' : 'Masuk',
      largeTitle: false,
      showBack: !widget.embedded,
      children: [
        const SizedBox(height: 18),
        const Center(child: Mascot(size: 72)),
        const SizedBox(height: 14),
        AnimatedSwitcher(
          duration: Motion.of(context, 220),
          child: Text(
            _register ? 'Buat akun gratis' : 'Selamat datang kembali',
            key: ValueKey(_register),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _register ? 'Dapatkan API key free langsung setelah mendaftar.' : 'Masuk untuk mengelola API key dan melihat statistik.',
          textAlign: TextAlign.center,
          style: TextStyle(color: fx.muted, fontSize: 15),
        ),
        const SizedBox(height: 22),
        Segmented<bool>(
          value: _register,
          options: const [(false, 'Masuk'), (true, 'Daftar')],
          onChanged: (v) => setState(() {
            _register = v;
            _errors = {};
            _formError = null;
          }),
        ),
        const SizedBox(height: 18),
        AutofillGroup(
          child: Column(
            children: [
              AnimatedSize(
                duration: Motion.of(context, 320),
                curve: Springs.smooth,
                child: _register
                    ? Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: FxField(
                          controller: _name,
                          label: 'Nama',
                          hint: 'Nama kamu',
                          error: _errors['name'],
                          autofill: const [AutofillHints.name],
                          textInputAction: TextInputAction.next,
                          maxLength: 60,
                        ),
                      )
                    : const SizedBox(width: double.infinity),
              ),
              FxField(
                controller: _email,
                label: 'Email',
                hint: 'kamu@email.com',
                keyboard: TextInputType.emailAddress,
                error: _errors['email'],
                autofill: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                maxLength: 120,
              ),
              const SizedBox(height: 14),
              FxField(
                controller: _password,
                label: 'Password',
                hint: _register ? 'Minimal 8 karakter' : 'Password',
                obscure: !_show,
                error: _errors['password'],
                autofill: [_register ? AutofillHints.newPassword : AutofillHints.password],
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
                maxLength: 128,
                suffix: IconButton(
                  tooltip: _show ? 'Sembunyikan' : 'Tampilkan',
                  icon: Icon(_show ? CupertinoIcons.eye_slash : CupertinoIcons.eye, color: fx.muted, size: 20),
                  onPressed: () => setState(() => _show = !_show),
                ),
              ),
            ],
          ),
        ),
        AnimatedSize(
          duration: Motion.of(context, 240),
          child: _formError == null
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.only(top: 14),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: fx.dangerSoft, borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      children: [
                        Icon(CupertinoIcons.exclamationmark_circle, color: fx.danger, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(_formError!, style: TextStyle(color: fx.dangerInk, fontSize: 14)),
                        ),
                      ],
                    ),
                  ),
                ),
        ),
        const SizedBox(height: 22),
        FxButton(_register ? 'Buat akun' : 'Masuk', big: true, expand: true, loading: _busy, onTap: _submit),
        const SizedBox(height: 16),
        if (_register)
          Wrap(
            alignment: WrapAlignment.center,
            children: [
              Text('Dengan mendaftar kamu menyetujui ', style: TextStyle(color: fx.muted, fontSize: 13)),
              LinkText('Syarat Layanan', onTap: () => push(context, const LegalScreen(terms: true))),
              Text(' dan ', style: TextStyle(color: fx.muted, fontSize: 13)),
              LinkText('Kebijakan Privasi', onTap: () => push(context, const LegalScreen(terms: false))),
            ],
          ),
      ],
    );
  }
}
