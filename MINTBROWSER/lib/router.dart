import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/motion/motion.dart';
import 'core/theme/app_theme.dart';
import 'features/bookmarks/bookmarks_screen.dart';
import 'features/browser/browser_screen.dart';
import 'features/browser/search_screen.dart';
import 'features/downloads/downloads_screen.dart';
import 'features/history/history_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/settings/appearance_screen.dart';
import 'features/settings/clear_data_screen.dart';
import 'features/settings/search_engine_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/settings/site_permissions_screen.dart';
import 'features/settings/text_size_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/tabs/tabs_screen.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

abstract final class Routes {
  static const splash = '/';
  static const onboarding = '/onboarding';
  static const browser = '/browser';
  static const search = '/browser/search';
  static const tabs = '/browser/tabs';
  static const settings = '/browser/settings';
  static const searchEngine = '/browser/settings/search-engine';
  static const appearance = '/browser/settings/appearance';
  static const textSize = '/browser/settings/text-size';
  static const clearData = '/browser/settings/clear-data';
  static const permissions = '/browser/settings/permissions';
  static const history = '/browser/history';
  static const bookmarks = '/browser/bookmarks';
  static const downloads = '/browser/downloads';
}

CustomTransitionPage<T> _fade<T>(GoRouterState state, Widget child, {Duration? duration}) =>
    CustomTransitionPage<T>(
      key: state.pageKey,
      child: child,
      transitionDuration: duration ?? Motion.screen,
      reverseTransitionDuration: duration ?? Motion.screen,
      transitionsBuilder: (context, a, _, child) =>
          FadeTransition(opacity: CurvedAnimation(parent: a, curve: Motion.standard), child: child),
    );

CustomTransitionPage<T> _slide<T>(GoRouterState state, Widget child) => CustomTransitionPage<T>(
      key: state.pageKey,
      child: child,
      transitionDuration: Motion.screen,
      reverseTransitionDuration: Motion.screen,
      transitionsBuilder: (context, a, s, child) =>
          MintSlideTransition(animation: a, secondaryAnimation: s, child: child),
    );

/// Full-screen modal that rises from the bottom (Settings, like "Menu").
CustomTransitionPage<T> _rise<T>(GoRouterState state, Widget child) => CustomTransitionPage<T>(
      key: state.pageKey,
      child: child,
      transitionDuration: Motion.drawer,
      reverseTransitionDuration: const Duration(milliseconds: 300),
      transitionsBuilder: (context, a, s, child) {
        final curved = CurvedAnimation(parent: a, curve: Motion.emphasized, reverseCurve: Motion.exit);
        return SlideTransition(
          position: Tween(begin: const Offset(0, 1), end: Offset.zero).animate(curved),
          child: MintSlideTransition(
            animation: const AlwaysStoppedAnimation(1),
            secondaryAnimation: s,
            child: child,
          ),
        );
      },
    );

/// Tabs overview: the page fades and settles from slightly larger while the
/// tab heroes fly into their cards.
CustomTransitionPage<T> _zoom<T>(GoRouterState state, Widget child) => CustomTransitionPage<T>(
      key: state.pageKey,
      child: child,
      transitionDuration: Motion.screen,
      reverseTransitionDuration: Motion.screen,
      transitionsBuilder: (context, a, _, child) {
        final curved = CurvedAnimation(parent: a, curve: Motion.emphasized, reverseCurve: Motion.exit);
        return FadeTransition(
          opacity: curved,
          child: ScaleTransition(scale: Tween(begin: 1.04, end: 1.0).animate(curved), child: child),
        );
      },
    );

final router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: Routes.splash,
  routes: [
    GoRoute(
      path: Routes.splash,
      pageBuilder: (context, state) => NoTransitionPage(key: state.pageKey, child: const SplashScreen()),
    ),
    GoRoute(
      path: Routes.onboarding,
      pageBuilder: (context, state) => _fade(
        state,
        OnboardingScreen(replay: state.uri.queryParameters['replay'] == '1'),
        duration: const Duration(milliseconds: 450),
      ),
    ),
    GoRoute(
      path: Routes.browser,
      pageBuilder: (context, state) =>
          _fade(state, const BrowserScreen(), duration: const Duration(milliseconds: 450)),
      routes: [
        GoRoute(
          path: 'search',
          pageBuilder: (context, state) => _fade<String>(
            state,
            SearchScreen(initial: state.extra as String? ?? ''),
            duration: const Duration(milliseconds: 220),
          ),
        ),
        GoRoute(path: 'tabs', pageBuilder: (context, state) => _zoom(state, const TabsScreen())),
        GoRoute(
          path: 'settings',
          pageBuilder: (context, state) => _rise(state, const SettingsScreen()),
          routes: [
            GoRoute(
              path: 'search-engine',
              pageBuilder: (context, state) => _slide(state, const SearchEngineScreen()),
            ),
            GoRoute(
              path: 'appearance',
              pageBuilder: (context, state) => _slide(state, const AppearanceScreen()),
            ),
            GoRoute(
              path: 'text-size',
              pageBuilder: (context, state) => _slide(state, const TextSizeScreen()),
            ),
            GoRoute(
              path: 'clear-data',
              pageBuilder: (context, state) => _slide(state, const ClearDataScreen()),
            ),
            GoRoute(
              path: 'permissions',
              pageBuilder: (context, state) => _slide(state, const SitePermissionsScreen()),
            ),
          ],
        ),
        GoRoute(path: 'history', pageBuilder: (context, state) => _slide(state, const HistoryScreen())),
        GoRoute(
          path: 'bookmarks',
          pageBuilder: (context, state) => _slide(state, const BookmarksScreen()),
        ),
        GoRoute(
          path: 'downloads',
          pageBuilder: (context, state) => _slide(state, const DownloadsScreen()),
        ),
      ],
    ),
  ],
);
