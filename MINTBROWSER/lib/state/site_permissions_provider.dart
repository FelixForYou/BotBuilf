import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/app_settings.dart';
import '../data/models/site_permission.dart';
import '../data/storage/prefs_store.dart';
import 'core_providers.dart';
import 'settings_provider.dart';

final sitePermissionsProvider =
    NotifierProvider<SitePermissionsNotifier, Map<String, SitePermissions>>(
  SitePermissionsNotifier.new,
);

enum PermissionVerdict { allow, block, ask }

class SitePermissionsNotifier extends Notifier<Map<String, SitePermissions>> {
  PrefsStore get _store => ref.read(prefsStoreProvider);

  @override
  Map<String, SitePermissions> build() {
    final list = ref.read(prefsStoreProvider).readList(PrefsStore.sitePermissionsKey);
    return {for (final p in list.map(SitePermissions.fromJson)) p.host: p};
  }

  /// What to do when [host] asks for [capability].
  PermissionVerdict verdict(String host, SiteCapability capability) {
    final saved = state[host]?.decisions[capability];
    if (saved == SiteDecision.allow) return PermissionVerdict.allow;
    if (saved == SiteDecision.block) return PermissionVerdict.block;
    final s = ref.read(settingsProvider);
    final def = switch (capability) {
      SiteCapability.camera => s.cameraDefault,
      SiteCapability.microphone => s.microphoneDefault,
      SiteCapability.location => s.locationDefault,
    };
    return def == PermissionDefault.block ? PermissionVerdict.block : PermissionVerdict.ask;
  }

  void decide(String host, SiteCapability capability, SiteDecision? decision) {
    if (host.isEmpty) return;
    final current = state[host] ?? SitePermissions(host: host);
    final updated = current.withDecision(capability, decision);
    final next = {...state};
    if (updated.decisions.isEmpty) {
      next.remove(host);
    } else {
      next[host] = updated;
    }
    _set(next);
  }

  void reset(String host) => _set({...state}..remove(host));

  void resetAll() => _set(const {});

  void _set(Map<String, SitePermissions> next) {
    state = next;
    _store.write(PrefsStore.sitePermissionsKey, next.values.map((p) => p.toJson()).toList());
  }
}
