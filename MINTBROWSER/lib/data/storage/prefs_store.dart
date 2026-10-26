import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Non-sensitive app state (settings, tabs, bookmarks) as JSON in
/// SharedPreferences.
class PrefsStore {
  PrefsStore(this._prefs);

  final SharedPreferences _prefs;

  static const settingsKey = 'settings.v1';
  static const tabsKey = 'tabs.v1';
  static const activeTabKey = 'tabs.active.v1';
  static const bookmarksKey = 'bookmarks.v1';
  static const bookmarksSeededKey = 'bookmarks.seeded.v1';
  static const downloadsKey = 'downloads.v1';
  static const sitePermissionsKey = 'site_permissions.v1';

  Map<String, Object?>? readMap(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      return (jsonDecode(raw) as Map).cast<String, Object?>();
    } catch (_) {
      return null;
    }
  }

  List<Map<String, Object?>> readList(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List)
          .whereType<Map>()
          .map((m) => m.cast<String, Object?>())
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> write(String key, Object? json) => _prefs.setString(key, jsonEncode(json));

  String? readString(String key) => _prefs.getString(key);
  Future<void> writeString(String key, String value) => _prefs.setString(key, value);

  bool readBool(String key) => _prefs.getBool(key) ?? false;
  Future<void> writeBool(String key, bool value) => _prefs.setBool(key, value);

  Future<void> remove(String key) => _prefs.remove(key);
}
