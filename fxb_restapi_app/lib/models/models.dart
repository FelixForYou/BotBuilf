import '../core/format.dart';

/// Model data mengikuti bentuk JSON backend apa adanya.

class Quota {
  Quota({required this.keyName, required this.tier, required this.used, required this.limit, required this.reset});
  factory Quota.fromJson(Map j) =>
      Quota(keyName: asStr(j['keyName'], '—'), tier: asStr(j['tier'], 'free'), used: asInt(j['used']), limit: asInt(j['limit']), reset: asInt(j['reset']));
  final String keyName;
  final String tier;
  final int used;
  final int limit;
  final int reset;
}

class User {
  User({required this.id, required this.email, required this.name, required this.role, required this.status, required this.createdAt, this.quota});
  factory User.fromJson(Map j) => User(
    id: asStr(j['id']),
    email: asStr(j['email']),
    name: asStr(j['name']),
    role: asStr(j['role'], 'user'),
    status: asStr(j['status'], 'active'),
    createdAt: asInt(j['created_at']),
    quota: j['quota'] is Map ? Quota.fromJson(j['quota'] as Map) : null,
  );
  final String id;
  final String email;
  final String name;
  final String role;
  final String status;
  final int createdAt;
  final Quota? quota;
  bool get isAdmin => role == 'admin';
  String get firstName => name.trim().split(RegExp(r'\s+')).first;
}

class Category {
  Category({required this.id, required this.name, required this.description, required this.icon});
  factory Category.fromJson(Map j) => Category(id: asStr(j['id']), name: asStr(j['name']), description: asStr(j['description']), icon: asStr(j['icon']));
  final String id;
  final String name;
  final String description;
  final String icon;
}

class Param {
  Param({required this.name, required this.type, required this.required, required this.description, this.example, this.options, this.defaultValue, this.max});
  factory Param.fromJson(Map j) => Param(
    name: asStr(j['name']),
    type: asStr(j['type'], 'string'),
    required: j['required'] == true,
    description: asStr(j['description']),
    example: j['example']?.toString(),
    options: (j['options'] as List?)?.map((e) => '$e').toList(),
    defaultValue: j['default']?.toString(),
    max: asIntOrNull(j['max']),
  );
  final String name;
  final String type;
  final bool required;
  final String description;
  final String? example;
  final List<String>? options;
  final String? defaultValue;
  final int? max;
  bool get isFile => type == 'file';
  bool get multiline => type == 'json' || (max ?? 0) > 600;
}

class Endpoint {
  Endpoint({
    required this.id,
    required this.category,
    required this.group,
    required this.name,
    required this.description,
    required this.method,
    required this.path,
    required this.tier,
    required this.provider,
    required this.response,
    required this.params,
    required this.example,
    required this.status,
    required this.note,
  });
  factory Endpoint.fromJson(Map j) => Endpoint(
    id: asStr(j['id']),
    category: asStr(j['category']),
    group: asStr(j['group']),
    name: asStr(j['name']),
    description: asStr(j['description']),
    method: asStr(j['method'], 'GET'),
    path: asStr(j['path'], '/api/v1/${j['id']}'),
    tier: asStr(j['tier'], 'free'),
    provider: j['provider']?.toString(),
    response: asStr(j['response'], 'json'),
    params: ((j['params'] as List?) ?? const []).whereType<Map>().map(Param.fromJson).toList(),
    example: j['example'],
    status: asStr(j['status'], 'online'),
    note: j['note']?.toString(),
  );
  final String id;
  final String category;
  final String group;
  final String name;
  final String description;
  final String method;
  final String path;
  final String tier;
  final String? provider;
  final String response;
  final List<Param> params;
  final Object? example;
  final String status;
  final String? note;

  bool get online => status == 'online';
  bool get premium => tier == 'premium';
  bool get hasFile => params.any((p) => p.isFile);

  bool matches(String q) {
    if (q.isEmpty) return true;
    final s = q.toLowerCase();
    return id.toLowerCase().contains(s) || name.toLowerCase().contains(s) || description.toLowerCase().contains(s) || group.toLowerCase().contains(s);
  }
}

class Catalog {
  Catalog({required this.categories, required this.endpoints});
  factory Catalog.fromJson(Map j) => Catalog(
    categories: ((j['categories'] as List?) ?? const []).whereType<Map>().map(Category.fromJson).toList(),
    endpoints: ((j['endpoints'] as List?) ?? const []).whereType<Map>().map(Endpoint.fromJson).toList(),
  );
  final List<Category> categories;
  final List<Endpoint> endpoints;

  Endpoint? byId(String id) {
    for (final e in endpoints) {
      if (e.id == id) return e;
    }
    return null;
  }

  int countIn(String cat) => endpoints.where((e) => e.category == cat).length;
}

class ApiKeyInfo {
  ApiKeyInfo(this.raw);
  final Map raw;
  String get id => asStr(raw['id']);
  String get name => asStr(raw['name']);
  String get prefix => asStr(raw['prefix']);
  String get status => asStr(raw['status'], 'active');
  bool get active => status == 'active';
  String get effectiveTier => asStr(raw['effective_tier'], asStr(raw['tier'], 'free'));
  bool get premium => effectiveTier == 'premium';
  bool get premiumExpired => raw['premium_expired'] == true;
  String? get planName => raw['plan_name']?.toString();
  int? get expiresAt => asIntOrNull(raw['expires_at']);
  int get createdAt => asInt(raw['created_at']);
  int? get lastUsedAt => asIntOrNull(raw['last_used_at']);
  int get usedToday => asInt(raw['used_today']);
  int get daily => asInt(raw['daily'], 1);
  int get rpm => asInt(raw['rpm']);
}

class SeriesPoint {
  SeriesPoint(this.date, this.success, this.error);
  factory SeriesPoint.fromJson(Map j) => SeriesPoint(asStr(j['date']), asInt(j['success']), asInt(j['error']));
  final String date;
  final int success;
  final int error;
}

class TopEndpoint {
  TopEndpoint(this.id, this.count, this.errors, this.latency);
  factory TopEndpoint.fromJson(Map j) => TopEndpoint(asStr(j['id']), asInt(j['count']), asInt(j['errors']), asInt(j['latency']));
  final String id;
  final int count;
  final int errors;
  final int latency;
}

class RecentRequest {
  RecentRequest(this.endpoint, this.status, this.latency, this.at);
  factory RecentRequest.fromJson(Map j) => RecentRequest(asStr(j['endpoint']), asInt(j['status']), asInt(j['latency']), asInt(j['at']));
  final String endpoint;
  final int status;
  final int latency;
  final int at;
}

class Usage {
  Usage(this.days, this.total, this.success, this.errors, this.avgLatency, this.series, this.top, this.recent);
  factory Usage.fromJson(Map j) => Usage(
    asInt(j['days'], 7),
    asInt(j['total']),
    asInt(j['success']),
    asInt(j['errors']),
    asInt(j['avg_latency']),
    ((j['series'] as List?) ?? const []).whereType<Map>().map(SeriesPoint.fromJson).toList(),
    ((j['top'] as List?) ?? const []).whereType<Map>().map(TopEndpoint.fromJson).toList(),
    ((j['recent'] as List?) ?? const []).whereType<Map>().map(RecentRequest.fromJson).toList(),
  );
  final int days;
  final int total;
  final int success;
  final int errors;
  final int avgLatency;
  final List<SeriesPoint> series;
  final List<TopEndpoint> top;
  final List<RecentRequest> recent;
}

class PublicStats {
  PublicStats(this.endpoints, this.users, this.requests24h, this.successRate, this.avgLatency);
  factory PublicStats.fromJson(Map j) =>
      PublicStats(asInt(j['endpoints']), asInt(j['users']), asInt(j['requests_24h']), asDoubleOrNull(j['success_rate']), asIntOrNull(j['avg_latency']));
  final int endpoints;
  final int users;
  final int requests24h;
  final double? successRate;
  final int? avgLatency;
}

class Plan {
  Plan(this.raw);
  final Map raw;
  String get id => asStr(raw['id']);
  String get name => asStr(raw['name']);
  String get description => asStr(raw['description']);
  int get price => asInt(raw['price']);
  int get durationDays => asInt(raw['duration_days']);
  int get dailyLimit => asInt(raw['daily_limit']);
  int get rpmLimit => asInt(raw['rpm_limit']);
  int get rank => asInt(raw['rank'], 1);
  int get sort => asInt(raw['sort']);
  bool get active => asInt(raw['active'], 1) == 1;
  int get sold => asInt(raw['sold']);
}

class PayGateway {
  PayGateway(this.id, this.name, this.description);
  factory PayGateway.fromJson(Map j) => PayGateway(asStr(j['id']), asStr(j['name']), asStr(j['description']));
  final String id;
  final String name;
  final String description;
}

class PlansInfo {
  PlansInfo(this.freeDaily, this.freeRpm, this.maxFreeKeys, this.plans, this.gateways);
  factory PlansInfo.fromJson(Map j) {
    final f = (j['free'] as Map?) ?? const {};
    return PlansInfo(
      asInt(f['daily_limit']),
      asInt(f['rpm']),
      asInt(f['max_keys']),
      ((j['plans'] as List?) ?? const []).whereType<Map>().map(Plan.new).toList(),
      ((j['gateways'] as List?) ?? const []).whereType<Map>().map(PayGateway.fromJson).toList(),
    );
  }
  final int freeDaily;
  final int freeRpm;
  final int maxFreeKeys;
  final List<Plan> plans;
  final List<PayGateway> gateways;
}

class Order {
  Order(this.raw);
  final Map raw;
  String get id => asStr(raw['id']);
  String get invoiceNo => asStr(raw['invoice_no']);
  String get status => asStr(raw['status'], 'pending');
  String get gateway => asStr(raw['gateway']);
  String get action => asStr(raw['action'], 'upgrade');
  int get amount => asInt(raw['amount']);
  String? get paymentUrl => raw['payment_url']?.toString();
  String? get planName => raw['plan_name']?.toString();
  String? get keyName => raw['key_name']?.toString();
  String? get keyPrefix => raw['key_prefix']?.toString();
  String? get email => raw['email']?.toString();
  String? get note => raw['note']?.toString();
  String? get manualInfo => raw['manual_payment_info']?.toString();
  int get createdAt => asInt(raw['created_at']);
  int? get paidAt => asIntOrNull(raw['paid_at']);
  int get expiresAt => asInt(raw['expires_at']);
  bool get pending => status == 'pending';
}
