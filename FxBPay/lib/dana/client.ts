/**
 * Klien HTTP Payment Gateway DANA (SNAP B2B). Header & signature mengikuti
 * `DanaHeaderUtil.populateSnapB2BScenarioHeader` pada SDK resmi dana-node.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { toDanaValue } from "../money";
import { redact, redactHeaders } from "../redact";
import { DANA_BASE_URL, DANA_PATHS, PG_SERVICE_CODE } from "./constants";
import type { DanaConfig } from "./config";
import { jakartaTimestamp, signB2B } from "./signature";

export type DanaCallResult<T = Record<string, unknown>> = {
  ok: boolean; // HTTP 2xx dan body JSON terbaca
  outcome: "response" | "timeout" | "network_error";
  httpStatus: number | null;
  body: T | null;
  responseCode: string | null;
  durationMs: number;
  externalId: string;
  request: { method: string; url: string; headers: Record<string, string>; body: unknown };
  response: { headers: Record<string, string>; body: unknown } | null;
  error?: string;
};

export type Fetcher = typeof fetch;

export class DanaClient {
  constructor(
    private cfg: DanaConfig,
    private opts: { fetcher?: Fetcher; timeoutMs?: number; baseUrl?: string; privateKeyOverride?: string } = {},
  ) {}

  get baseUrl() {
    return this.opts.baseUrl ?? DANA_BASE_URL[this.cfg.env];
  }

  async call<T = Record<string, unknown>>(path: string, payload: object): Promise<DanaCallResult<T>> {
    const body = JSON.stringify(payload);
    const timestamp = jakartaTimestamp();
    const externalId = randomUUID().replace(/-/g, "").slice(0, 32);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-TIMESTAMP": timestamp,
      "X-SIGNATURE": signB2B("POST", path, body, timestamp, this.opts.privateKeyOverride ?? this.cfg.privateKey),
      ORIGIN: this.cfg.origin,
      "X-PARTNER-ID": this.cfg.partnerId,
      "X-EXTERNAL-ID": externalId,
      "CHANNEL-ID": `${this.cfg.partnerId}-SERVER`,
    };
    const url = this.baseUrl + path;
    const started = Date.now();
    const reqInfo = { method: "POST", url, headers: redactHeaders(headers), body: redact(payload) };
    try {
      const res = await (this.opts.fetcher ?? fetch)(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 15_000),
        redirect: "error",
      });
      const text = await res.text();
      let json: T | null = null;
      try {
        json = text ? (JSON.parse(text) as T) : null;
      } catch {
        json = null;
      }
      const code = (json as { responseCode?: string } | null)?.responseCode ?? null;
      return {
        ok: res.ok && json !== null,
        outcome: "response",
        httpStatus: res.status,
        body: json,
        responseCode: code,
        durationMs: Date.now() - started,
        externalId,
        request: reqInfo,
        response: { headers: redactHeaders(res.headers), body: json ? redact(json) : text.slice(0, 2000) },
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (e) {
      const err = e as Error;
      const timeout = err.name === "TimeoutError" || err.name === "AbortError";
      return {
        ok: false,
        outcome: timeout ? "timeout" : "network_error",
        httpStatus: null,
        body: null,
        responseCode: null,
        durationMs: Date.now() - started,
        externalId,
        request: reqInfo,
        response: null,
        error: timeout ? "Timeout menunggu respons DANA" : `Gagal terhubung ke DANA: ${err.message}`,
      };
    }
  }

  baseOrder(p: { partnerReferenceNo: string; amount: bigint; validUpTo: Date; title: string; returnUrl: string; notifyUrl: string }) {
    return {
      partnerReferenceNo: p.partnerReferenceNo,
      merchantId: this.cfg.merchantId,
      ...(this.cfg.subMerchantId ? { subMerchantId: this.cfg.subMerchantId } : {}),
      ...(this.cfg.externalStoreId ? { externalStoreId: this.cfg.externalStoreId } : {}),
      amount: { value: toDanaValue(p.amount), currency: "IDR" },
      validUpTo: jakartaTimestamp(p.validUpTo),
      urlParams: [
        { url: p.returnUrl, type: "PAY_RETURN", isDeeplink: "N" },
        { url: p.notifyUrl, type: "NOTIFICATION", isDeeplink: "N" },
      ],
    };
  }

  /** Create Order — skenario REDIRECT (hosted checkout DANA, respons berisi webRedirectUrl). */
  createOrderRedirect(p: Parameters<DanaClient["baseOrder"]>[0]) {
    return this.call<{ responseCode: string; responseMessage: string; referenceNo?: string; webRedirectUrl?: string }>(DANA_PATHS.createOrder, {
      ...this.baseOrder(p),
      additionalInfo: {
        mcc: this.cfg.mcc,
        envInfo: { sourcePlatform: "IPG", terminalType: "SYSTEM" },
        order: { orderTitle: p.title.slice(0, 64), scenario: "REDIRECT" },
      },
    });
  }

  /** Create Order — skenario API dengan payOption QRIS (hanya jika akses QRIS aktif di akun merchant). */
  createOrderQris(p: Parameters<DanaClient["baseOrder"]>[0]) {
    return this.call<{ responseCode: string; responseMessage: string; referenceNo?: string; additionalInfo?: { paymentCode?: string } }>(DANA_PATHS.createOrder, {
      ...this.baseOrder(p),
      payOptionDetails: [{ payMethod: "NETWORK_PAY", payOption: "NETWORK_PAY_PG_QRIS", transAmount: { value: toDanaValue(p.amount), currency: "IDR" } }],
      additionalInfo: {
        mcc: this.cfg.mcc,
        envInfo: { sourcePlatform: "IPG", terminalType: "SYSTEM" },
        order: { orderTitle: p.title.slice(0, 64), scenario: "API" },
      },
    });
  }

  queryPayment(p: { partnerReferenceNo: string; referenceNo?: string | null }) {
    return this.call<{
      responseCode: string;
      responseMessage: string;
      latestTransactionStatus?: string;
      transactionStatusDesc?: string;
      amount?: { value: string; currency: string };
      paidTime?: string;
      originalReferenceNo?: string;
    }>(DANA_PATHS.queryPayment, {
      originalPartnerReferenceNo: p.partnerReferenceNo,
      ...(p.referenceNo ? { originalReferenceNo: p.referenceNo } : {}),
      serviceCode: PG_SERVICE_CODE,
      merchantId: this.cfg.merchantId,
      ...(this.cfg.subMerchantId ? { subMerchantId: this.cfg.subMerchantId } : {}),
    });
  }

  cancelOrder(p: { partnerReferenceNo: string; reason: string }) {
    return this.call<{ responseCode: string; responseMessage: string }>(DANA_PATHS.cancelOrder, {
      originalPartnerReferenceNo: p.partnerReferenceNo,
      merchantId: this.cfg.merchantId,
      ...(this.cfg.subMerchantId ? { subMerchantId: this.cfg.subMerchantId } : {}),
      reason: p.reason.slice(0, 100),
    });
  }

  refundOrder(p: { partnerReferenceNo: string; referenceNo?: string | null; partnerRefundNo: string; amount: bigint; reason: string }) {
    return this.call<{ responseCode: string; responseMessage: string; refundNo?: string }>(DANA_PATHS.refundOrder, {
      merchantId: this.cfg.merchantId,
      ...(this.cfg.subMerchantId ? { subMerchantId: this.cfg.subMerchantId } : {}),
      originalPartnerReferenceNo: p.partnerReferenceNo,
      ...(p.referenceNo ? { originalReferenceNo: p.referenceNo } : {}),
      partnerRefundNo: p.partnerRefundNo,
      refundAmount: { value: toDanaValue(p.amount), currency: "IDR" },
      reason: p.reason.slice(0, 100),
    });
  }
}
