import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/app_settings.dart';
import '../data/storage/prefs_store.dart';
import 'core_providers.dart';

final settingsProvider = NotifierProvider<SettingsNotifier, AppSettings>(SettingsNotifier.new);

class SettingsNotifier extends Notifier<AppSettings> {
  PrefsStore get _store => ref.read(prefsStoreProvider);

  @override
  AppSettings build() {
    final json = ref.read(prefsStoreProvider).readMap(PrefsStore.settingsKey);
    return json == null ? const AppSettings() : AppSettings.fromJson(json);
  }

  void update(AppSettings Function(AppSettings s) change) {
    state = change(state);
    _store.write(PrefsStore.settingsKey, state.toJson());
  }
}
