import 'package:flutter/foundation.dart';

enum SiteCapability {
  camera('Camera'),
  microphone('Microphone'),
  location('Location');

  const SiteCapability(this.label);
  final String label;
}

enum SiteDecision { allow, block }

/// Saved choices for one host. Missing capability = ask (or global default).
@immutable
class SitePermissions {
  const SitePermissions({required this.host, this.decisions = const {}});

  final String host;
  final Map<SiteCapability, SiteDecision> decisions;

  SitePermissions withDecision(SiteCapability c, SiteDecision? d) {
    final next = Map<SiteCapability, SiteDecision>.from(decisions);
    if (d == null) {
      next.remove(c);
    } else {
      next[c] = d;
    }
    return SitePermissions(host: host, decisions: next);
  }

  Map<String, Object?> toJson() => {
        'host': host,
        'decisions': {for (final e in decisions.entries) e.key.name: e.value.name},
      };

  factory SitePermissions.fromJson(Map<String, Object?> j) {
    final raw = (j['decisions'] as Map?)?.cast<String, Object?>() ?? const {};
    final decisions = <SiteCapability, SiteDecision>{};
    for (final e in raw.entries) {
      final c = SiteCapability.values.where((v) => v.name == e.key).firstOrNull;
      final d = SiteDecision.values.where((v) => v.name == e.value).firstOrNull;
      if (c != null && d != null) decisions[c] = d;
    }
    return SitePermissions(host: j['host'] as String, decisions: decisions);
  }
}
