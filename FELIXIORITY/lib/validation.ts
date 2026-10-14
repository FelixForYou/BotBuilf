import { BlockList, isIP } from "node:net";
import { AppError } from "./errors";

export interface PanelTarget {
  origin: string;
  protocol: "https:" | "http:";
  hostname: string;
  port: number;
  /** hostname[:port] untuk ditampilkan */
  host: string;
}

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Hanya untuk pengujian lokal dengan panel tiruan (scripts/mock-panel.mjs).
 * Diabaikan sepenuhnya pada build produksi.
 */
export function devAllowsPrivate(): boolean {
  return !IS_PRODUCTION && process.env.FELIX_DEV_ALLOW_PRIVATE === "1";
}

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home.arpa", ".localdomain"];
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function normalizePanelDomain(input: unknown): PanelTarget {
  if (typeof input !== "string" || !input.trim()) {
    throw new AppError("INVALID_DOMAIN", "Domain panel wajib diisi.");
  }
  let raw = input.trim();
  if (raw.length > 255) throw new AppError("INVALID_DOMAIN", "Domain panel terlalu panjang.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError("INVALID_DOMAIN", "Domain tidak valid. Contoh: panel.contoh.com");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AppError("INVALID_DOMAIN", "Domain harus memakai https://");
  }
  if (url.username || url.password) {
    throw new AppError("INVALID_DOMAIN", "Domain tidak boleh berisi nama pengguna atau kata sandi.");
  }
  if (IS_PRODUCTION && url.protocol !== "https:") {
    throw new AppError("HTTPS_REQUIRED", "Gunakan domain panel dengan HTTPS (https://).");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!hostname) throw new AppError("INVALID_DOMAIN", "Domain tidak valid. Contoh: panel.contoh.com");

  const ipKind = isIP(hostname);
  if (ipKind) {
    if (isBlockedAddress(hostname) && !devAllowsPrivate()) {
      throw new AppError("BLOCKED_ADDRESS", "Alamat ini mengarah ke jaringan lokal atau privat dan tidak diizinkan.");
    }
  } else {
    const labels = hostname.split(".");
    if (labels.length < 2 || !labels.every((l) => LABEL.test(l)) || /^\d+$/.test(labels[labels.length - 1])) {
      if (!(devAllowsPrivate() && hostname === "localhost")) {
        throw new AppError("INVALID_DOMAIN", "Domain tidak valid. Contoh: panel.contoh.com");
      }
    }
    if (
      (hostname === "localhost" || BLOCKED_SUFFIXES.some((s) => hostname.endsWith(s))) &&
      !devAllowsPrivate()
    ) {
      throw new AppError("BLOCKED_ADDRESS", "Domain lokal tidak diizinkan. Gunakan domain publik panel.");
    }
  }

  const protocol = url.protocol as "https:" | "http:";
  const port = url.port ? Number(url.port) : protocol === "https:" ? 443 : 80;
  const hostForUrl = ipKind === 6 ? `[${hostname}]` : hostname;
  const defaultPort = (protocol === "https:" && port === 443) || (protocol === "http:" && port === 80);
  const host = defaultPort ? hostForUrl : `${hostForUrl}:${port}`;
  return { origin: `${protocol}//${host}`, protocol, hostname, port, host };
}

/** Application API key Pterodactyl: awalan ptla_ */
const PTLA = /^ptla_[A-Za-z0-9]{16,128}$/;

export function validateApiKey(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new AppError("INVALID_KEY_FORMAT", "Application API key wajib diisi.");
  }
  const key = input.trim();
  if (key.startsWith("ptlc_")) {
    throw new AppError(
      "INVALID_KEY_FORMAT",
      "Ini Client API key (ptlc_). Gunakan Application API key berawalan ptla_ dari Admin › Application API.",
    );
  }
  if (!PTLA.test(key)) {
    throw new AppError("INVALID_KEY_FORMAT", "API key harus berupa Application API key berawalan ptla_.");
  }
  return key;
}

// ---------------------------------------------------------------------------
// Pemblokiran alamat (SSRF)
// ---------------------------------------------------------------------------
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
