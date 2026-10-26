import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/platform/native_bridge.dart';
import '../data/storage/prefs_store.dart';
import '../data/storage/vault.dart';

/// Overridden in main() with the instance loaded before runApp.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden'),
);

final prefsStoreProvider = Provider<PrefsStore>(
  (ref) => PrefsStore(ref.watch(sharedPreferencesProvider)),
);

final vaultProvider = Provider<Vault>((ref) => const SecureVault());

final nativeBridgeProvider = Provider<NativeBridge>((ref) => NativeBridge());
