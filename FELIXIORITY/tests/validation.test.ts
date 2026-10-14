import { describe, expect, it } from "vitest";
import { isBlockedAddress, normalizePanelDomain, validateApiKey } from "@/lib/validation";

describe("normalizePanelDomain", () => {
  it("menambahkan https dan membuang path", () => {
    const t = normalizePanelDomain(" Panel.Contoh.com/admin ");
    expect(t.origin).toBe("https://panel.contoh.com");
    expect(t.port).toBe(443);
  });
  it("mempertahankan port non-standar", () => {
    expect(normalizePanelDomain("https://panel.contoh.com:8443").host).toBe("panel.contoh.com:8443");
  });
  it.each(["", "   ", "bukan domain", "https://", "ftp://panel.com", "https://user:pw@panel.com", "panel", "https://1234"])(
    "menolak %j",
    (v) => {
      expect(() => normalizePanelDomain(v)).toThrow();
    },
  );
  it.each(["localhost", "http://127.0.0.1", "https://10.0.0.5", "https://[::1]", "https://169.254.169.254", "panel.local", "x.internal"])(
    "memblokir tujuan lokal %s",
    (v) => {
      expect(() => normalizePanelDomain(v)).toThrow();
    },
  );
});

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::a9fe:a9fe",
    "2002:7f00:1::1",
    "fd00:ec2::254",
  ])("blokir %s", (ip) => expect(isBlockedAddress(ip)).toBe(true));
  it.each(["1.1.1.1", "8.8.8.8", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])("izinkan %s", (ip) =>
    expect(isBlockedAddress(ip)).toBe(false),
  );
  it("bukan IP → blokir", () => expect(isBlockedAddress("example.com")).toBe(true));
});

describe("validateApiKey", () => {
  it("menerima ptla_", () => {
    expect(validateApiKey("ptla_" + "a".repeat(43))).toMatch(/^ptla_/);
  });
  it("menolak client key dengan pesan khusus", () => {
    expect(() => validateApiKey("ptlc_" + "a".repeat(43))).toThrow(/Client API key/);
  });
  it.each(["", "abc", "ptla_", "ptla_short", "PTLA_" + "a".repeat(43), "ptla_" + "a".repeat(40) + "!@#"])("menolak %j", (k) =>
    expect(() => validateApiKey(k)).toThrow(),
  );
});
