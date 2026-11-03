import 'dart:convert';

import '../models/models.dart';

/// Port dari `snippets()` di lib/catalog-types.ts agar contoh kode identik dengan website.
Map<String, String> snippets(Endpoint ep, String origin, [String key = 'YOUR_API_KEY']) {
  final url = '$origin${ep.path}';
  final sample = <String, String>{
    for (final p in ep.params.where((p) => p.type != 'file' && (p.required || (p.example ?? '').isNotEmpty)))
      p.name: _nonEmpty(p.example) ?? _nonEmpty(p.defaultValue) ?? (p.options?.isNotEmpty == true ? p.options!.first : ''),
  };
  final hasFile = ep.params.any((p) => p.type == 'file' && p.required);
  String js(Object o, [int indent = 2]) => JsonEncoder.withIndent(' ' * indent).convert(o);

  if (ep.method == 'GET') {
    final all = {...sample, 'apikey': key};
    final qs = Uri(queryParameters: all).query;
    return {
      'cURL': 'curl "$url?$qs"',
      'JavaScript': 'const res = await fetch("$url?" + new URLSearchParams(${js(all)}));\nconst data = await res.json();\nconsole.log(data.result);',
      'Python': 'import requests\n\nr = requests.get("$url", params=${js(all, 4)})\nprint(r.json()["result"])',
      'PHP': '<?php\n\$q = http_build_query(${_phpArr(all)});\n\$data = json_decode(file_get_contents("$url?\$q"), true);\nprint_r(\$data["result"]);',
    };
  }
  if (hasFile) {
    final f = ep.params.firstWhere((p) => p.type == 'file').name;
    final extra = sample.entries.map((e) => ' \\\n  -F "${e.key}=${e.value}"').join();
    return {
      'cURL': 'curl -X POST "$url" \\\n  -H "X-API-Key: $key" \\\n  -F "$f=@./file.png"$extra',
      'JavaScript':
          'const form = new FormData();\nform.append("$f", fileInput.files[0]);\n${sample.entries.map((e) => 'form.append("${e.key}", ${jsonEncode(e.value)});').join('\n')}\nconst res = await fetch("$url", { method: "POST", headers: { "X-API-Key": "$key" }, body: form });',
      'Python':
          'import requests\n\nr = requests.post("$url", headers={"X-API-Key": "$key"},\n    files={"$f": open("file.png", "rb")}, data=${jsonEncode(sample)})\nprint(r.status_code)',
      'PHP':
          '<?php\n\$ch = curl_init("$url");\ncurl_setopt_array(\$ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => ["X-API-Key: $key"],\n  CURLOPT_POSTFIELDS => ["$f" => new CURLFile("file.png")]]);\necho curl_exec(\$ch);',
    };
  }
  final body = js(sample);
  return {
    'cURL': 'curl -X POST "$url" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: $key" \\\n  -d \'${jsonEncode(sample)}\'',
    'JavaScript':
        'const res = await fetch("$url", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-API-Key": "$key" },\n  body: JSON.stringify($body),\n});\nconst data = await res.json();',
    'Python': 'import requests\n\nr = requests.post("$url", headers={"X-API-Key": "$key"}, json=$body)\nprint(r.json()["result"])',
    'PHP':
        '<?php\n\$ch = curl_init("$url");\ncurl_setopt_array(\$ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => ["Content-Type: application/json", "X-API-Key: $key"],\n  CURLOPT_POSTFIELDS => json_encode(${_phpArr(sample)})]);\necho curl_exec(\$ch);',
  };
}

String? _nonEmpty(String? s) => (s == null || s.isEmpty) ? null : s;

String _phpArr(Map<String, String> o) => '[${o.entries.map((e) => '"${e.key}" => ${jsonEncode(e.value)}').join(', ')}]';
