import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Penyimpanan rahasia di perangkat (Android Keystore lewat flutter_secure_storage).
///
/// - Token cookie sesi `fxb_session` (sama seperti cookie httpOnly di website).
/// - API key milik pengguna yang dibuat/dibuat ulang di aplikasi ini atau ditempel
///   manual. Server hanya menyimpan hash, jadi key asli hanya ada di perangkat.
class SessionStore {
  SessionStore([FlutterSecureStorage? storage]) : _s = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _s;
  static const _kSession = 'fxb_session';
  static const _kKeys = 'fxb_saved_keys';

  String? _cache;
  bool _loaded = false;

  Future<String?> readSession() async {
    if (_loaded) return _cache;
    try {
      _cache = await _s.read(key: _kSession);
    } catch (_) {
      _cache = null;
    }
    _loaded = true;
    return _cache;
  }

  String? get cachedSession => _cache;

  Future<void> writeSession(String? token) async {
    _cache = (token == null || token.isEmpty) ? null : token;
    _loaded = true;
    try {
      if (_cache == null) {
        await _s.delete(key: _kSession);
      } else {
        await _s.write(key: _kSession, value: _cache);
      }
    } catch (_) {
      // Penyimpanan aman gagal (mis. keystore rusak): sesi tetap berlaku di memori.
    }
  }

  /// keyId → secret (fxb_...).
  Future<Map<String, String>> readSavedKeys() async {
    try {
      final raw = await _s.read(key: _kKeys);
      if (raw == null) return {};
      final m = jsonDecode(raw);
      if (m is Map) return m.map((k, v) => MapEntry('$k', '$v'));
    } catch (_) {}
    return {};
  }

  Future<void> saveKey(String keyId, String secret) async {
    final m = await readSavedKeys();
    m[keyId] = secret;
    await _s.write(key: _kKeys, value: jsonEncode(m));
  }

  Future<void> removeKey(String keyId) async {
    final m = await readSavedKeys();
    if (m.remove(keyId) != null) await _s.write(key: _kKeys, value: jsonEncode(m));
  }

  Future<void> clearKeys() async {
    try {
      await _s.delete(key: _kKeys);
    } catch (_) {}
  }
}
