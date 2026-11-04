/** Sensor data sensitif sebelum disimpan ke log / ditampilkan di pusat pengujian. */
const SENSITIVE = /(signature|secret|password|private|token|authorization|cookie|pin|otp|key)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[…]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE.test(k) && !/^(x-partner-id|partnerid)$/i.test(k)) out[k] = typeof v === "string" && v.length > 0 ? mask(v) : "[disensor]";
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function mask(v: string): string {
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}

export function redactHeaders(h: Headers | Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = h instanceof Headers ? [...h.entries()] : Object.entries(h);
  for (const [k, v] of entries) {
    if (/^(cookie|authorization|x-signature)$/i.test(k)) out[k] = mask(v);
    else out[k] = v;
  }
  return out;
}
