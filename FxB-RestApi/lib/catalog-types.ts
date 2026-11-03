export interface ParamPublic {
  name: string;
  type: "string" | "number" | "boolean" | "enum" | "file" | "json";
  required?: boolean;
  description: string;
  example?: string;
  options?: string[];
  default?: string;
  max?: number;
}

export interface EndpointPublic {
  id: string;
  category: string;
  group: string;
  name: string;
  description: string;
  method: "GET" | "POST";
  path: string;
  tier: "free" | "premium";
  provider: string | null;
  response: "json" | "image" | "file";
  params: ParamPublic[];
  example: unknown;
  status: "online" | "maintenance" | "unconfigured";
  note: string | null;
}

export interface CategoryPublic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export function snippets(ep: EndpointPublic, origin: string, key = "YOUR_API_KEY") {
  const url = `${origin}${ep.path}`;
  const sample = Object.fromEntries(
    ep.params.filter((p) => p.type !== "file" && (p.required || p.example)).map((p) => [p.name, p.example || p.default || (p.options?.[0] ?? "")]),
  );
  const hasFile = ep.params.some((p) => p.type === "file" && p.required);
  if (ep.method === "GET") {
    const qs = new URLSearchParams({ ...sample, apikey: key }).toString();
    return {
      curl: `curl "${url}?${qs}"`,
      javascript: `const res = await fetch("${url}?" + new URLSearchParams(${JSON.stringify({ ...sample, apikey: key }, null, 2)}));\nconst data = await res.json();\nconsole.log(data.result);`,
      python: `import requests\n\nr = requests.get("${url}", params=${JSON.stringify({ ...sample, apikey: key }, null, 4)})\nprint(r.json()["result"])`,
      php: `<?php\n$q = http_build_query(${phpArr({ ...sample, apikey: key })});\n$data = json_decode(file_get_contents("${url}?$q"), true);\nprint_r($data["result"]);`,
    };
  }
  if (hasFile) {
    const f = ep.params.find((p) => p.type === "file")!.name;
    const extra = Object.entries(sample).map(([k, v]) => ` \\\n  -F "${k}=${v}"`).join("");
    return {
      curl: `curl -X POST "${url}" \\\n  -H "X-API-Key: ${key}" \\\n  -F "${f}=@./file.png"${extra}`,
      javascript: `const form = new FormData();\nform.append("${f}", fileInput.files[0]);\n${Object.entries(sample).map(([k, v]) => `form.append("${k}", ${JSON.stringify(v)});`).join("\n")}\nconst res = await fetch("${url}", { method: "POST", headers: { "X-API-Key": "${key}" }, body: form });`,
      python: `import requests\n\nr = requests.post("${url}", headers={"X-API-Key": "${key}"},\n    files={"${f}": open("file.png", "rb")}, data=${JSON.stringify(sample)})\nprint(r.status_code)`,
      php: `<?php\n$ch = curl_init("${url}");\ncurl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => ["X-API-Key: ${key}"],\n  CURLOPT_POSTFIELDS => ["${f}" => new CURLFile("file.png")]]);\necho curl_exec($ch);`,
    };
  }
  const body = JSON.stringify(sample, null, 2);
  return {
    curl: `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${key}" \\\n  -d '${JSON.stringify(sample)}'`,
    javascript: `const res = await fetch("${url}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-API-Key": "${key}" },\n  body: JSON.stringify(${body}),\n});\nconst data = await res.json();`,
    python: `import requests\n\nr = requests.post("${url}", headers={"X-API-Key": "${key}"}, json=${body})\nprint(r.json()["result"])`,
    php: `<?php\n$ch = curl_init("${url}");\ncurl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => ["Content-Type: application/json", "X-API-Key: ${key}"],\n  CURLOPT_POSTFIELDS => json_encode(${phpArr(sample)})]);\necho curl_exec($ch);`,
  };
}

function phpArr(o: Record<string, string>): string {
  return `[${Object.entries(o).map(([k, v]) => `"${k}" => ${JSON.stringify(v)}`).join(", ")}]`;
}
