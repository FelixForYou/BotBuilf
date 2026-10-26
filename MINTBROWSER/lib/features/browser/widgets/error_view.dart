import 'package:flutter/material.dart';

import '../../../core/utils/url_utils.dart';
import '../../../data/models/browser_tab.dart';
import '../../../widgets/status_view.dart';
import '../web/web_engine.dart';

/// Copy for each failure type: title, message, tip, short reason.
({String title, String message, String tip, String reason}) describeError(PageError e) {
  final host = UrlUtils.display(e.url).isEmpty ? 'this site' : UrlUtils.display(e.url);
  return switch (e.type) {
    'hostLookup' => (
        title: 'This site can’t be reached',
        message: 'We couldn’t find $host. The address may be mistyped, or you may be offline.',
        tip: 'Check the address and your connection, then tap Try again.',
        reason: 'Not found',
      ),
    'connect' => (
        title: 'Couldn’t connect',
        message: '$host refused the connection or isn’t responding right now.',
        tip: 'Wait about a minute, then tap Try again.',
        reason: 'Connection',
      ),
    'timeout' => (
        title: 'The page took too long',
        message: '$host didn’t answer in time. Your connection may be slow.',
        tip: 'Move to a stronger signal, then tap Try again.',
        reason: 'Timed out',
      ),
    'failedSslHandshake' => (
        title: 'Connection isn’t private',
        message: '$host sent a certificate this device doesn’t trust, so the page was blocked to protect you.',
        tip: 'Check your device’s date and time. Public Wi-Fi sign-in pages can also cause this.',
        reason: 'Certificate',
      ),
    'redirectLoop' => (
        title: 'Too many redirects',
        message: '$host keeps sending the page somewhere else.',
        tip: 'Clearing cookies for this site in Settings usually fixes it.',
        reason: 'Redirects',
      ),
    'badUrl' || 'unsupportedScheme' => (
        title: 'This address won’t open',
        message: 'The link isn’t a web address this browser can load.',
        tip: 'Check the link or search for the page instead.',
        reason: 'Bad address',
      ),
    _ => (
        title: 'This page didn’t load',
        message: 'Something went wrong while loading $host. Your connection is most likely fine.',
        tip: 'Wait about a minute, then tap Try again.',
        reason: 'Load error',
      ),
  };
}

class PageErrorView extends StatelessWidget {
  const PageErrorView({super.key, required this.error, required this.onRetry, required this.onHome});

  final PageError error;
  final VoidCallback onRetry;
  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    final d = describeError(error);
    final host = UrlUtils.display(error.url);
    return StatusView(
      icon: errorIcon(error.type),
      tone: StatusTone.error,
      title: d.title,
      message: d.message,
      stats: [(d.reason, 'Reason'), (host.isEmpty ? '—' : host, 'Site')],
      tip: d.tip,
      actionLabel: 'Try again',
      onAction: onRetry,
      secondaryLabel: 'Back to start page',
      onSecondary: onHome,
      details: [
        'Step: Load page',
        'URL: ${error.url}',
        if (error.code != null) 'Code: ${error.code}',
        'Type: ${error.type}',
        'Message: ${error.description}',
      ].join('\n'),
    );
  }
}
