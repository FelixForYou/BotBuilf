import { lookup as dnsLookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { AppError } from "./errors";
import { devAllowsPrivate, isBlockedAddress, type PanelTarget } from "./validation";

export const REQUEST_TIMEOUT_MS = 12_000;
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

export interface PanelResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

export type PanelTransport = (target: PanelTarget, path: string, apiKey: string) => Promise<PanelResponse>;

/** Resolusi DNS lalu periksa SEMUA alamat. Mengembalikan satu alamat yang aman untuk dipakai. */
export async function resolveSafeAddress(target: PanelTarget): Promise<{ address: string; family: 4 | 6 }> {
  const literal = isIP(target.hostname);
  if (literal) {
    if (isBlockedAddress(target.hostname) && !devAllowsPrivate()) {
      throw new AppError("BLOCKED_ADDRESS", "Alamat ini mengarah ke jaringan lokal atau privat dan tidak diizinkan.");
    }
    return { address: target.hostname, family: literal as 4 | 6 };
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dnsLookup(target.hostname, { all: true, verbatim: true });
  } catch {
    throw new AppError("DNS_FAILED", "Domain tidak ditemukan. Periksa ejaan domain panel.", 400);
  }
  if (!addrs.length) throw new AppError("DNS_FAILED", "Domain tidak ditemukan. Periksa ejaan domain panel.", 400);
  if (!devAllowsPrivate() && addrs.some((a) => isBlockedAddress(a.address))) {
    throw new AppError(
      "BLOCKED_ADDRESS",
      "Domain mengarah ke alamat jaringan lokal, privat, atau metadata yang tidak diizinkan.",
      400,
    );
  }
  const pick = addrs.find((a) => a.family === 4) ?? addrs[0];
  return { address: pick.address, family: pick.family as 4 | 6 };
}

/**
 * Transport HTTP bawaan: koneksi dipaku (pinned) ke alamat IP yang sudah divalidasi
 * sehingga DNS rebinding tidak bisa mengalihkan tujuan. Redirect tidak diikuti.
 */
export const defaultTransport: PanelTransport = async (target, path, apiKey) => {
  const { address, family } = await resolveSafeAddress(target);
  const lib = target.protocol === "https:" ? https : http;
  const pinnedLookup: LookupFunction = (_host, opts, cb) => {
    if (opts && (opts as { all?: boolean }).all) {
      (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address, family }]);
    } else {
      cb(null, address, family);
    }
  };

  return new Promise<PanelResponse>((resolve, reject) => {
    const req = lib.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path,
        method: "GET",
        lookup: pinnedLookup,
        servername: isIP(target.hostname) ? undefined : target.hostname,
        agent: false,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "FELIXIORITY/1.0 (+read-only dashboard)",
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          reject(
            new AppError(
              "REDIRECT",
              "Panel mengalihkan permintaan ke alamat lain. Masukkan domain akhir panel (tanpa pengalihan).",
              400,
            ),
          );
          return;
        }
        const declared = Number(res.headers["content-length"] ?? 0);
        if (declared > MAX_RESPONSE_BYTES) {
          res.destroy();
          reject(new AppError("RESPONSE_TOO_LARGE", "Respons panel terlalu besar.", 502));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_RESPONSE_BYTES) {
            res.destroy();
            reject(new AppError("RESPONSE_TOO_LARGE", "Respons panel terlalu besar.", 502));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", () => reject(new AppError("CONNECT_FAILED", "Koneksi ke panel terputus.", 502)));
      },
    );
    const deadline = setTimeout(() => req.destroy(new Error("deadline")), REQUEST_TIMEOUT_MS + 1000);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("close", () => clearTimeout(deadline));
    req.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(deadline);
      reject(mapNetworkError(err));
    });
    req.end();
  });
};

function mapNetworkError(err: NodeJS.ErrnoException): AppError {
  if (err instanceof AppError) return err;
  const code = err.code ?? "";
  const msg = err.message ?? "";
  if (msg === "timeout" || msg === "deadline" || code === "ETIMEDOUT") {
    return new AppError("TIMEOUT", "Panel tidak merespons tepat waktu. Coba lagi nanti.", 504);
  }
  if (code.startsWith("ERR_TLS") || code.includes("CERT") || code === "EPROTO" || code.startsWith("ERR_SSL")) {
    return new AppError("TLS_FAILED", "Sertifikat HTTPS panel tidak valid atau tidak dapat diverifikasi.", 502);
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return new AppError("DNS_FAILED", "Domain tidak ditemukan. Periksa ejaan domain panel.", 400);
  }
  return new AppError(
    "CONNECT_FAILED",
    "Tidak dapat terhubung ke panel. Pastikan domain benar dan panel dapat diakses dari internet.",
    502,
  );
}
