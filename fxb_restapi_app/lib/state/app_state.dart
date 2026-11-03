import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/api_exception.dart';
import '../models/models.dart';

/// State global ringan. Tiap bagian memakai ValueNotifier terpisah agar
/// perubahan (mis. user/tema) hanya membangun ulang widget yang memerlukannya.
class AppState {
  AppState({ApiClient? api}) : api = api ?? ApiClient() {
    this.api.onSessionExpired = _onExpired;
  }

  final ApiClient api;

  final me = ValueNotifier<User?>(null);
  final themeMode = ValueNotifier<ThemeMode>(ThemeMode.dark);
  final glass = ValueNotifier<bool>(true);
  final catalog = ValueNotifier<Catalog?>(null);
  final sessionExpired = ValueNotifier<int>(0);

  /// Kategori yang dipilih di tab Docs (bisa diatur dari Beranda).
  final docsCategory = ValueNotifier<String>('all');

  /// Endpoint yang dibuka di tab Explorer.
  final explorerEndpoint = ValueNotifier<String?>(null);

  bool onboarded = true;
  SharedPreferences? _prefs;
  Future<Catalog>? _catalogFuture;

  /// Dibaca saat start: preferensi & sesi tersimpan.
  Future<void> init() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      final t = _prefs!.getString('theme');
      themeMode.value = t == 'light' ? ThemeMode.light : ThemeMode.dark;
      glass.value = _prefs!.getBool('glass') ?? true;
      onboarded = _prefs!.getBool('onboarded') ?? false;
    } catch (_) {}
    await api.store.readSession();
  }

  bool get hasStoredSession => api.store.cachedSession != null;

  /// Cek sesi ke /api/auth/me. Bila backend tidak bisa dihubungi, sesi lokal
  /// TIDAK dihapus (pengguna tetap login saat koneksi kembali).
  Future<void> refreshMe() async {
    if (!hasStoredSession) {
      me.value = null;
      return;
    }
    final data = await api.get('/api/auth/me');
    if (data is Map) {
      me.value = User.fromJson(data);
    } else {
      me.value = null;
      await api.store.writeSession(null);
    }
  }

  Future<void> login(String email, String password) async {
    await api.post('/api/auth/login', {'email': email, 'password': password});
    await refreshMe();
  }

  /// Mengembalikan API key default yang dibuat backend saat registrasi.
  Future<String?> register(String name, String email, String password) async {
    final data = await api.post('/api/auth/register', {'name': name, 'email': email, 'password': password});
    await refreshMe();
    String? key;
    if (data is Map && data['apiKey'] is String) key = data['apiKey'] as String;
    return key;
  }

  Future<void> logout() async {
    try {
      await api.post('/api/auth/logout');
    } on ApiException {
      // Tetap keluar secara lokal walau server tak terjangkau.
    }
    await api.store.writeSession(null);
    await api.store.clearKeys();
    me.value = null;
  }

  void _onExpired() {
    if (me.value != null) {
      me.value = null;
      sessionExpired.value++;
    }
  }

  Future<Catalog> loadCatalog({bool force = false}) {
    if (!force && catalog.value != null) return Future.value(catalog.value);
    if (!force && _catalogFuture != null) return _catalogFuture!;
    final f = api.get('/api/catalog').then((d) {
      final c = Catalog.fromJson(d as Map);
      catalog.value = c;
      return c;
    });
    _catalogFuture = f;
    f.catchError((_) {
      _catalogFuture = null;
      return Catalog(categories: const [], endpoints: const []);
    });
    return f;
  }

  void setTheme(ThemeMode m) {
    themeMode.value = m;
    unawaited(_prefs?.setString('theme', m == ThemeMode.light ? 'light' : 'dark'));
  }

  void setGlass(bool v) {
    glass.value = v;
    unawaited(_prefs?.setBool('glass', v));
  }

  void markOnboarded() {
    onboarded = true;
    unawaited(_prefs?.setBool('onboarded', true));
  }
}

/// Menyediakan [AppState] ke seluruh pohon widget (tanpa memicu rebuild).
class App extends InheritedWidget {
  const App({super.key, required this.state, required super.child});
  final AppState state;

  static AppState of(BuildContext context) => context.getInheritedWidgetOfExactType<App>()!.state;

  @override
  bool updateShouldNotify(App oldWidget) => false;
}
