/// Format angka & tanggal gaya id-ID (tanpa paket intl agar APK tetap ringan).
library;

int asInt(Object? v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? double.tryParse(v)?.toInt() ?? fallback;
  if (v is bool) return v ? 1 : 0;
  return fallback;
}

int? asIntOrNull(Object? v) => v == null ? null : asInt(v);

double? asDoubleOrNull(Object? v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  return null;
}

String asStr(Object? v, [String fallback = '']) => v == null ? fallback : '$v';

String fmtNum(num n) {
  final neg = n < 0;
  final s = n.abs().round().toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write('.');
    b.write(s[i]);
  }
  return '${neg ? '-' : ''}$b';
}

String fmtIDR(num n) => 'Rp${fmtNum(n)}';

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/// Waktu WIB (UTC+7), sama seperti zona yang dipakai backend untuk reset limit.
DateTime _wib(int ms) => DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true).add(const Duration(hours: 7));

String two(int n) => n.toString().padLeft(2, '0');

String fmtDate(Object? ms, {bool withTime = false}) {
  final v = asIntOrNull(ms);
  if (v == null || v == 0) return '—';
  final d = _wib(v);
  final date = '${d.day} ${_months[d.month - 1]} ${d.year}';
  return withTime ? '$date ${two(d.hour)}.${two(d.minute)}' : date;
}

String fmtTimeWib(Object? ms) {
  final v = asIntOrNull(ms);
  if (v == null) return '00.00';
  final d = _wib(v);
  return '${two(d.hour)}.${two(d.minute)}';
}

String fmtRel(Object? ms, {DateTime? now}) {
  final v = asIntOrNull(ms);
  if (v == null || v == 0) return '—';
  final d = (now ?? DateTime.now()).millisecondsSinceEpoch - v;
  if (d < 60000) return 'baru saja';
  if (d < 3600000) return '${d ~/ 60000} mnt lalu';
  if (d < 86400000) return '${d ~/ 3600000} jam lalu';
  return '${d ~/ 86400000} hari lalu';
}

String mmss(int ms) {
  final s = ms ~/ 1000;
  return '${two(s ~/ 60)}:${two(s % 60)}';
}

String fmtBytes(int b) {
  if (b < 1024) return '$b B';
  if (b < 1024 * 1024) return '${(b / 1024).toStringAsFixed(1)} KB';
  return '${(b / 1024 / 1024).toStringAsFixed(2)} MB';
}
