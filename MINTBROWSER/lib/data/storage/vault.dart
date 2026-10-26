import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Encrypted key–value storage for data that reveals personal activity
/// (browsing history). Backed by the Android Keystore.
abstract interface class Vault {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureVault implements Vault {
  const SecureVault();

  static const _storage = FlutterSecureStorage();

  @override
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (_) {
      // Keystore entries can become unreadable after a device restore;
      // start clean rather than crash.
      await _storage.delete(key: key);
      return null;
    }
  }

  @override
  Future<void> write(String key, String value) => _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

/// In-memory vault for tests.
class MemoryVault implements Vault {
  final Map<String, String> data = {};

  @override
  Future<String?> read(String key) async => data[key];

  @override
  Future<void> write(String key, String value) async => data[key] = value;

  @override
  Future<void> delete(String key) async => data.remove(key);
}
