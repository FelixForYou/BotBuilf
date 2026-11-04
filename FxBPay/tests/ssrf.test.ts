import { describe, expect, it } from "vitest";
import { isPrivateIp, validateWebhookUrlSyntax } from "@/lib/ssrf";

describe("SSRF", () => {
  it("memblokir alamat privat/khusus", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) expect(isPrivateIp(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) expect(isPrivateIp(ip)).toBe(false);
  });
  it("validasi sintaks URL", () => {
    expect(() => validateWebhookUrlSyntax("http://example.com/h")).toThrow();
    expect(() => validateWebhookUrlSyntax("https://user:pw@example.com/h")).toThrow();
    expect(() => validateWebhookUrlSyntax("https://localhost/h")).toThrow();
    expect(() => validateWebhookUrlSyntax("https://10.0.0.1/h")).toThrow();
    expect(() => validateWebhookUrlSyntax("https://example.com:22/h")).toThrow();
    expect(validateWebhookUrlSyntax("https://example.com/hook").hostname).toBe("example.com");
  });
});
