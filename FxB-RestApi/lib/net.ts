import "server-only";
import { lookup as dnsLookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { AppError } from "./errors";

const blocked = new BlockList();
const V4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // privat
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local + metadata cloud (169.254.169.254)
  ["172.16.0.0", 12], // privat
  ["192.0.0.0", 24], // IETF
  ["192.0.2.0", 24], // dokumentasi
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // privat
  ["198.18.0.0", 15], // benchmark
  ["198.51.100.0", 24], // dokumentasi
  ["203.0.113.0", 24], // dokumentasi
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];
for (const [a, p] of V4) blocked.addSubnet(a, p, "ipv4");
const V6: [string, number][] = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b::", 96], // NAT64
  ["64:ff9b:1::", 48], // NAT64 lokal
  ["100::", 64], // discard
  ["2001::", 32], // Teredo
  ["2001:db8::", 32], // dokumentasi
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // site-local (lama)
  ["ff00::", 8], // multicast
  ["fd00:ec2::254", 128], // metadata AWS IPv6
];
for (const [a, p] of V6) blocked.addSubnet(a, p, "ipv6");

function embeddedV4(ip6: string): string | null {
  const lower = ip6.toLowerCase();
  // ::ffff:a.b.c.d atau ::a.b.c.d
  const dotted = lower.match(/^(?:::ffff:|::)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const groups = expandV6(lower);
  if (!groups) return null;
  // ::ffff:XXXX:XXXX (IPv4-mapped) dan ::XXXX:XXXX (IPv4-compatible)
  const zeros5 = groups.slice(0, 5).every((g) => g === 0);
  if (zeros5 && (groups[5] === 0xffff || groups[5] === 0)) {
    if (groups[5] === 0 && groups[6] === 0) return null;
    return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
  }
  // 6to4 2002:AABB:CCDD::
  if (groups[0] === 0x2002) return `${groups[1] >> 8}.${groups[1] & 255}.${groups[2] >> 8}.${groups[2] & 255}`;
  return null;
}

function expandV6(ip: string): number[] | null {
  let s = ip;
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const p = v4[1].split(".").map(Number);
    s = s.slice(0, -v4[1].length) + `${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  if (tail === undefined && h.length !== 8) return null;
  const fill = 8 - h.length - t.length;
  if (fill < 0) return null;
  const all = [...h, ...Array(tail !== undefined ? fill : 0).fill("0"), ...t];
  if (all.length !== 8) return null;
  return all.map((g) => parseInt(g || "0", 16));
}

export function isBlockedAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return blocked.check(ip, "ipv4");
  if (kind === 6) {
    const v4 = embeddedV4(ip);
    if (v4 && blocked.check(v4, "ipv4")) return true;
    return blocked.check(ip, "ipv6");
  }
  return true; // bukan IP valid → tolak
}

// ---------------------------------------------------------------------------
// Fetch aman untuk URL dari pengguna (anti-SSRF, DNS dipaku, redirect divalidasi ulang)
// ---------------------------------------------------------------------------
export const UA = "Mozilla/5.0 (compatible; FxB-RestApi/1.0; +https://github.com/felixforyou)";

export interface SafeResponse {
  status: number;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

export function parsePublicUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new AppError("BAD_REQUEST", "URL tidak valid.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new AppError("BAD_REQUEST", "URL harus http atau https.");
  if (u.username || u.password) throw new AppError("BAD_REQUEST", "URL tidak boleh berisi kredensial.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new AppError("BLOCKED_ADDRESS", "Alamat lokal tidak diizinkan.");
  }
  if (isIP(host) && isBlockedAddress(host)) throw new AppError("BLOCKED_ADDRESS", "Alamat privat tidak diizinkan.");
  return u;
}

async function resolveSafe(host: string): Promise<{ address: string; family: 4 | 6 }> {
  const literal = isIP(host);
  if (literal) return { address: host, family: literal as 4 | 6 };
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dnsLookup(host, { all: true, verbatim: true });
  } catch {
    throw new AppError("DNS_FAILED", "Domain tidak ditemukan.", 400);
  }
  if (!addrs.length) throw new AppError("DNS_FAILED", "Domain tidak ditemukan.", 400);
  if (addrs.some((a) => isBlockedAddress(a.address))) throw new AppError("BLOCKED_ADDRESS", "Domain mengarah ke jaringan privat.", 400);
  const pick = addrs.find((a) => a.family === 4) ?? addrs[0];
  return { address: pick.address, family: pick.family as 4 | 6 };
}

function requestOnce(u: URL, maxBytes: number, timeoutMs: number, headers: Record<string, string>): Promise<SafeResponse> {
  return resolveSafe(u.hostname.replace(/^\[|\]$/g, "")).then(
    ({ address, family }) =>
      new Promise<SafeResponse>((resolve, reject) => {
        const lib = u.protocol === "https:" ? https : http;
        const lookup: LookupFunction = (_h, opts, cb) => {
          if (opts && (opts as { all?: boolean }).all) {
            (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address, family }]);
          } else cb(null, address, family);
        };
        const req = lib.request(
          {
            protocol: u.protocol,
            hostname: u.hostname.replace(/^\[|\]$/g, ""),
            port: u.port || undefined,
            path: u.pathname + u.search,
            method: "GET",
            lookup,
            agent: false,
            timeout: timeoutMs,
            headers: { "User-Agent": UA, Accept: "*/*", ...headers },
          },
          (res) => {
            const status = res.statusCode ?? 0;
            if (Number(res.headers["content-length"] ?? 0) > maxBytes) {
              res.destroy();
              return reject(new AppError("TOO_LARGE", "Ukuran konten melebihi batas.", 413));
            }
            const chunks: Buffer[] = [];
            let size = 0;
            res.on("data", (c: Buffer) => {
              size += c.length;
              if (size > maxBytes) {
                res.destroy();
                reject(new AppError("TOO_LARGE", "Ukuran konten melebihi batas.", 413));
                return;
              }
              chunks.push(c);
            });
            res.on("end", () => resolve({ status, url: u.toString(), headers: res.headers, body: Buffer.concat(chunks) }));
            res.on("error", () => reject(new AppError("FETCH_FAILED", "Koneksi ke URL terputus.", 502)));
          },
        );
        const deadline = setTimeout(() => req.destroy(new Error("timeout")), timeoutMs + 1000);
        req.on("timeout", () => req.destroy(new Error("timeout")));
        req.on("close", () => clearTimeout(deadline));
        req.on("error", (e) => {
          clearTimeout(deadline);
          if (e instanceof AppError) return reject(e);
          reject(
            e.message === "timeout"
              ? new AppError("TIMEOUT", "URL tidak merespons tepat waktu.", 504)
              : new AppError("FETCH_FAILED", "Tidak dapat mengambil URL.", 502),
          );
        });
        req.end();
      }),
  );
}

export async function safeFetch(
  raw: string,
  { maxBytes = 5 * 1024 * 1024, timeoutMs = 10_000, headers = {} as Record<string, string> } = {},
): Promise<SafeResponse> {
  let u = parsePublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const r = await requestOnce(u, maxBytes, timeoutMs, headers);
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      u = parsePublicUrl(new URL(String(r.headers.location), u).toString());
      continue;
    }
    return r;
  }
  throw new AppError("TOO_MANY_REDIRECTS", "Terlalu banyak pengalihan.", 400);
}

// ---------------------------------------------------------------------------
// Fetch ke provider tepercaya (URL tetap dari kode/konfigurasi), dengan timeout.
// ---------------------------------------------------------------------------
export async function providerFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 20_000, ...rest } = init;
  try {
    return await fetch(url, {
      ...rest,
      headers: { "User-Agent": UA, ...(rest.headers as Record<string, string>) },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (e) {
    const name = (e as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new AppError("PROVIDER_TIMEOUT", "Penyedia layanan tidak merespons tepat waktu.", 504);
    throw new AppError("PROVIDER_ERROR", "Gagal menghubungi penyedia layanan.", 502);
  }
}

export async function providerJson<T = unknown>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const r = await providerFetch(url, { ...init, headers: { Accept: "application/json", ...(init.headers as Record<string, string>) } });
  const text = await r.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError("PROVIDER_ERROR", `Respons penyedia tidak valid (HTTP ${r.status}).`, 502);
  }
  if (r.status === 404) throw new AppError("NOT_FOUND", "Data tidak ditemukan di penyedia.", 404);
  if (r.status === 429) throw new AppError("PROVIDER_RATE_LIMITED", "Penyedia sedang membatasi permintaan. Coba lagi nanti.", 503);
  if (!r.ok) throw new AppError("PROVIDER_ERROR", `Penyedia mengembalikan HTTP ${r.status}.`, 502);
  return body as T;
}
