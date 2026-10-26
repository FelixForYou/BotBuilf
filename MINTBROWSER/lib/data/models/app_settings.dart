import 'package:flutter/material.dart';

enum SearchEngine {
  google('Google', 'https://www.google.com/search?q=%s'),
  duckDuckGo('DuckDuckGo', 'https://duckduckgo.com/?q=%s'),
  bing('Bing', 'https://www.bing.com/search?q=%s'),
  brave('Brave Search', 'https://search.brave.com/search?q=%s'),
  startpage('Startpage', 'https://www.startpage.com/do/search?query=%s'),
  ecosia('Ecosia', 'https://www.ecosia.org/search?q=%s'),
  custom('Custom', '');

  const SearchEngine(this.label, this.template);
  final String label;
  final String template;
}

enum AppearanceMode {
  system('System', ThemeMode.system),
  dark('Dark', ThemeMode.dark),
  light('Light', ThemeMode.light);

  const AppearanceMode(this.label, this.themeMode);
  final String label;
  final ThemeMode themeMode;
}

/// Default behaviour for a site capability when a site has no saved choice.
enum PermissionDefault { ask, block }

@immutable
class AppSettings {
  const AppSettings({
    this.appearance = AppearanceMode.dark,
    this.searchEngine = SearchEngine.google,
    this.customSearchTemplate = '',
    this.textZoom = 100,
    this.desktopMode = false,
    this.javaScript = true,
    this.restoreTabs = true,
    this.saveHistory = true,
    this.blockThirdPartyCookies = false,
    this.darkenPages = false,
    this.onboardingDone = false,
    this.cameraDefault = PermissionDefault.ask,
    this.microphoneDefault = PermissionDefault.ask,
    this.locationDefault = PermissionDefault.ask,
  });

  final AppearanceMode appearance;
  final SearchEngine searchEngine;
  final String customSearchTemplate;

  /// Page text scale in percent (50–200).
  final int textZoom;
  final bool desktopMode;
  final bool javaScript;
  final bool restoreTabs;
  final bool saveHistory;
  final bool blockThirdPartyCookies;
  final bool darkenPages;
  final bool onboardingDone;
  final PermissionDefault cameraDefault;
  final PermissionDefault microphoneDefault;
  final PermissionDefault locationDefault;

  static const minZoom = 50;
  static const maxZoom = 200;

  AppSettings copyWith({
    AppearanceMode? appearance,
    SearchEngine? searchEngine,
    String? customSearchTemplate,
    int? textZoom,
    bool? desktopMode,
    bool? javaScript,
    bool? restoreTabs,
    bool? saveHistory,
    bool? blockThirdPartyCookies,
    bool? darkenPages,
    bool? onboardingDone,
    PermissionDefault? cameraDefault,
    PermissionDefault? microphoneDefault,
    PermissionDefault? locationDefault,
  }) {
    return AppSettings(
      appearance: appearance ?? this.appearance,
      searchEngine: searchEngine ?? this.searchEngine,
      customSearchTemplate: customSearchTemplate ?? this.customSearchTemplate,
      textZoom: (textZoom ?? this.textZoom).clamp(minZoom, maxZoom),
      desktopMode: desktopMode ?? this.desktopMode,
      javaScript: javaScript ?? this.javaScript,
      restoreTabs: restoreTabs ?? this.restoreTabs,
      saveHistory: saveHistory ?? this.saveHistory,
      blockThirdPartyCookies: blockThirdPartyCookies ?? this.blockThirdPartyCookies,
      darkenPages: darkenPages ?? this.darkenPages,
      onboardingDone: onboardingDone ?? this.onboardingDone,
      cameraDefault: cameraDefault ?? this.cameraDefault,
      microphoneDefault: microphoneDefault ?? this.microphoneDefault,
      locationDefault: locationDefault ?? this.locationDefault,
    );
  }

  Map<String, Object?> toJson() => {
        'appearance': appearance.name,
        'searchEngine': searchEngine.name,
        'customSearchTemplate': customSearchTemplate,
        'textZoom': textZoom,
        'desktopMode': desktopMode,
        'javaScript': javaScript,
        'restoreTabs': restoreTabs,
        'saveHistory': saveHistory,
        'blockThirdPartyCookies': blockThirdPartyCookies,
        'darkenPages': darkenPages,
        'onboardingDone': onboardingDone,
        'cameraDefault': cameraDefault.name,
        'microphoneDefault': microphoneDefault.name,
        'locationDefault': locationDefault.name,
      };

  factory AppSettings.fromJson(Map<String, Object?> j) {
    T pick<T extends Enum>(List<T> values, Object? name, T fallback) =>
        values.where((v) => v.name == name).firstOrNull ?? fallback;
    const d = AppSettings();
    return AppSettings(
      appearance: pick(AppearanceMode.values, j['appearance'], d.appearance),
      searchEngine: pick(SearchEngine.values, j['searchEngine'], d.searchEngine),
      customSearchTemplate: j['customSearchTemplate'] as String? ?? '',
      textZoom: ((j['textZoom'] as num?)?.toInt() ?? d.textZoom).clamp(minZoom, maxZoom),
      desktopMode: j['desktopMode'] as bool? ?? d.desktopMode,
      javaScript: j['javaScript'] as bool? ?? d.javaScript,
      restoreTabs: j['restoreTabs'] as bool? ?? d.restoreTabs,
      saveHistory: j['saveHistory'] as bool? ?? d.saveHistory,
      blockThirdPartyCookies: j['blockThirdPartyCookies'] as bool? ?? d.blockThirdPartyCookies,
      darkenPages: j['darkenPages'] as bool? ?? d.darkenPages,
      onboardingDone: j['onboardingDone'] as bool? ?? d.onboardingDone,
      cameraDefault: pick(PermissionDefault.values, j['cameraDefault'], d.cameraDefault),
      microphoneDefault: pick(PermissionDefault.values, j['microphoneDefault'], d.microphoneDefault),
      locationDefault: pick(PermissionDefault.values, j['locationDefault'], d.locationDefault),
    );
  }
}
