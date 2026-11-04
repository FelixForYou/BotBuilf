/**
 * Pencegahan SSRF untuk URL webhook merchant:
 * - hanya https (http hanya bila ALLOW_PRIVATE_WEBHOOK_URLS=1 di development),
 * - tanpa kredensial di URL, port standar/umum,
 * - semua alamat hasil DNS harus publik (blok loopback, privat, link-local, CGNAT, metadata cloud, multicast, IPv6 ULA),
 * - pengiriman tidak mengikuti redirect, dan IP dicek ulang tepat sebelum setiap pengiriman.
 */
import "server-only";
import { lookup } from "node:dns/promises";
import dns from "node:dns";
import { Agent } from "undici";
import { isIP } from "node:net";
import { config } from "./env";
import { AppError } from "./errors";

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
}
const V4_BLOCK: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const n = ipv4ToInt(ip);
    return V4_BLOCK.some(([base, bits]) => (n >>> (32 - bits)) === (ipv4ToInt(base) >>> (32 - bits)));
  }
  if (isIP(ip) === 6) {
    const l = ip.toLowerCase();
    if (l === "::" || l === "::1") return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l);
    if (mapped) return isPrivateIp(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff|2001:db8|64:ff9b)/.test(l);
  }
  return true;
}

export function validateWebhookUrlSyntax(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new AppError("invalid_url", "URL webhook tidak valid");
  }
  const allowHttp = config.allowPrivateWebhooks;
  if (u.protocol !== "https:" && !(allowHttp && u.protocol === "http:")) throw new AppError("invalid_url", "URL webhook wajib https://");
  if (u.username || u.password) throw new AppError("invalid_url", "URL tidak boleh memuat kredensial");
  if (u.port && !["443", "8443", ...(allowHttp ? ["80", "3000", "8080"] : [])].includes(u.port)) throw new AppError("invalid_url", "Port tidak diizinkan (gunakan 443 atau 8443)");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!allowHttp && (/^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(host) || (isIP(host) && isPrivateIp(host)))) {
    throw new AppError("invalid_url", "Alamat internal/privat tidak diizinkan");
  }
  return u;
}

export async function assertPublicDestination(u: URL): Promise<string> {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  if (!addrs.length) throw new AppError("invalid_url", "Host tidak dapat di-resolve");
  if (!config.allowPrivateWebhooks) {
    for (const a of addrs) if (isPrivateIp(a.address)) throw new AppError("invalid_url", `Host mengarah ke alamat privat (${a.address})`);
  }
  return addrs[0].address;
}

/**
 * Agent undici yang memvalidasi IP pada saat koneksi dibuat (menutup celah DNS rebinding
 * antara pengecekan dan koneksi sebenarnya).
 */
export const safeAgent = new Agent({
  connect: {
    timeout: 10_000,
    lookup(hostname, options, cb) {
      dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return cb(err, "", 4);
        const list = (Array.isArray(addresses) ? addresses : [addresses]) as dns.LookupAddress[];
        if (!config.allowPrivateWebhooks) {
          const bad = list.find((a) => isPrivateIp(a.address));
          if (bad) return cb(new Error(`Alamat privat diblokir (${bad.address})`), "", 4);
        }
        if ((options as { all?: boolean }).all) return (cb as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
        cb(null, list[0].address, list[0].family);
      });
    },
  },
});
