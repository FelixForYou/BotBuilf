import { describe, expect, it } from "vitest";
import { isApiKeyFormat, newApiKey, hashPassword, verifyPassword, sha256 } from "@/lib/crypto";
import { dayKey, nextResetMs } from "@/lib/limits";
import { isBlockedAddress, parsePublicUrl } from "@/lib/net";
import { midtransSignature } from "@/lib/payments";
import { validate } from "@/lib/gateway";
import { ENDPOINTS } from "@/lib/endpoints/registry";
import { snippets } from "@/lib/catalog-types";

describe("API key", () => {
  it("format fxb_ + 32 karakter, disimpan sebagai sha256", () => {
    const k = newApiKey();
    expect(isApiKeyFormat(k.key)).toBe(true);
    expect(k.hash).toBe(sha256(k.key));
    expect(k.prefix).toBe(k.key.slice(0, 10));
    expect(isApiKeyFormat("fxb_short")).toBe(false);
    expect(newApiKey().key).not.toBe(k.key);
  });
  it("password scrypt", async () => {
    const h = await hashPassword("rahasia123");
    expect(await verifyPassword("rahasia123", h)).toBe(true);
    expect(await verifyPassword("salah", h)).toBe(false);
    expect(await verifyPassword("x", "rusak")).toBe(false);
  });
});

describe("limit harian WIB", () => {
  it("reset di 00:00 WIB (17:00 UTC)", () => {
    const t = Date.UTC(2026, 10, 3, 16, 59); // 23:59 WIB
    expect(dayKey(t)).toBe("2026-11-03");
    expect(dayKey(t + 120_000)).toBe("2026-11-04");
    expect(new Date(nextResetMs(t)).toISOString()).toBe("2026-11-03T17:00:00.000Z");
  });
});

describe("SSRF", () => {
  it("blokir alamat privat/metadata", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.1", "169.254.169.254", "::1", "::ffff:127.0.0.1", "fd00::1"]) expect(isBlockedAddress(ip)).toBe(true);
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(() => parsePublicUrl("http://localhost/")).toThrow();
    expect(() => parsePublicUrl("file:///etc/passwd")).toThrow();
    expect(() => parsePublicUrl("http://user:pw@example.com")).toThrow();
    expect(parsePublicUrl("https://example.com/a").hostname).toBe("example.com");
  });
});

describe("Midtrans signature", () => {
  it("sha512(order_id+status_code+gross_amount+server_key)", () => {
    expect(midtransSignature("FXB-1", "200", "35000.00", "SB-Mid-server-x")).toMatch(/^[0-9a-f]{128}$/);
    expect(midtransSignature("FXB-1", "200", "35000.00", "a")).not.toBe(midtransSignature("FXB-1", "200", "35000.00", "b"));
  });
});

describe("validasi parameter", () => {
  const defs = [
    { name: "url", type: "string" as const, required: true, description: "", max: 10 },
    { name: "type", type: "enum" as const, options: ["video", "audio"], description: "" },
    { name: "n", type: "number" as const, description: "" },
    { name: "hd", type: "boolean" as const, description: "" },
  ];
  it("menormalkan nilai valid", () => {
    expect(validate(defs, { url: "abc", type: "AUDIO", n: "3", hd: "1" })).toEqual({ url: "abc", type: "audio", n: "3", hd: "true" });
  });
  it("menolak nilai salah dengan detail", () => {
    try {
      validate(defs, { type: "x", n: "a", url: "x".repeat(20) });
      throw new Error("tidak melempar");
    } catch (e) {
      const d = (e as { details: { param: string }[] }).details.map((x) => x.param);
      expect(d).toEqual(["url", "type", "n"]);
    }
  });
});

describe("registry", () => {
  it("ID unik, lengkap, dan punya contoh", () => {
    const ids = ENDPOINTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ENDPOINTS.length).toBeGreaterThan(50);
    for (const e of ENDPOINTS) {
      expect(e.id).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/);
      expect(e.example).toBeDefined();
      expect(e.description.length).toBeGreaterThan(5);
      const s = snippets({ ...e, path: `/api/v1/${e.id}`, status: "online", note: null, provider: e.provider ?? null } as never, "https://x.test");
      expect(s.curl).toContain(`/api/v1/${e.id}`);
    }
    for (const c of ["downloader", "ai", "ai-image", "entertainment", "tools"]) expect(ENDPOINTS.some((e) => e.category === c)).toBe(true);
  });
});
