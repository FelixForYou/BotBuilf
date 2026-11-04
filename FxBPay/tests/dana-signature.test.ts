import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { generateKeyPairSync } from "node:crypto";
import path from "node:path";
import { jakartaTimestamp, signB2B, verifyB2B } from "@/lib/dana/signature";
import { DANA_PATHS } from "@/lib/dana/constants";

const require = createRequire(import.meta.url);
const sdkRuntime = require(path.resolve("node_modules/dana-node/dist/runtime.js"));
const { WebhookParser } = require(path.resolve("node_modules/dana-node/dist/webhook/v1/webhook.js"));
const kp = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });

describe("signature SNAP B2B — kesetaraan dengan SDK resmi dana-node", () => {
  const body = JSON.stringify({ partnerReferenceNo: "FXB1", merchantId: "216620000000000000000", amount: { value: "10000.00", currency: "IDR" } });
  const ts = jakartaTimestamp(new Date("2026-01-02T03:04:05Z"));

  it("format timestamp Jakarta", () => expect(ts).toBe("2026-01-02T10:04:05+07:00"));

  it("signature identik dengan DanaSignatureUtil SDK", () => {
    const ours = signB2B("POST", DANA_PATHS.createOrder, body, ts, kp.privateKey);
    const sdk = sdkRuntime.DanaSignatureUtil.generateSnapB2BScenarioSignature("POST", DANA_PATHS.createOrder, body, kp.privateKey, ts);
    expect(ours).toBe(sdk);
  });

  it("notifikasi yang kita tandatangani lolos WebhookParser SDK, dan sebaliknya", () => {
    process.env.DANA_ENV = "production"; // agar SDK memakai kunci yang kita berikan
    const p = "/api/webhooks/dana/sandbox";
    const sig = signB2B("POST", p, body, ts, kp.privateKey);
    const parser = new WebhookParser(kp.publicKey);
    expect(() => parser.parseWebhook("POST", p, { "X-SIGNATURE": sig, "X-TIMESTAMP": ts }, body)).not.toThrow();
    expect(verifyB2B("POST", p, body, ts, sig, kp.publicKey)).toBe(true);
    expect(verifyB2B("POST", p, body.replace("10000", "10001"), ts, sig, kp.publicKey)).toBe(false);
    expect(verifyB2B("POST", "/lain", body, ts, sig, kp.publicKey)).toBe(false);
    delete process.env.DANA_ENV;
  });

  it("menerima body ber-spasi (pretty) yang ditandatangani dalam bentuk minified", () => {
    const p = "/api/webhooks/dana/sandbox";
    const sig = signB2B("POST", p, body, ts, kp.privateKey);
    const pretty = JSON.stringify(JSON.parse(body), null, 2);
    expect(verifyB2B("POST", p, pretty, ts, sig, kp.publicKey)).toBe(true);
  });
});
