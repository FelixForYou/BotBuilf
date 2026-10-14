import { afterEach, describe, expect, it } from "vitest";
import { applyCors, assertNotCrossSite, assertSameOrigin, preflight } from "@/lib/security";

const req = (headers: Record<string, string>, method = "POST") => new Request("http://api.test/api/connect", { method, headers });

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
});

describe("origin allowlist (mode GitHub Pages)", () => {
  it("tanpa ALLOWED_ORIGINS hanya origin sendiri yang diterima", () => {
    expect(() => assertSameOrigin(req({ origin: "http://api.test", host: "api.test" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://user.github.io", host: "api.test", "sec-fetch-site": "cross-site" }))).toThrow();
    const res = applyCors(req({ origin: "https://user.github.io" }), new Response("{}"));
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("origin di ALLOWED_ORIGINS diterima dan mendapat header CORS", () => {
    process.env.ALLOWED_ORIGINS = "https://user.github.io, https://lain.example";
    const r = req({ origin: "https://user.github.io", host: "api.test", "sec-fetch-site": "cross-site" });
    expect(() => assertSameOrigin(r)).not.toThrow();
    expect(() => assertNotCrossSite(r)).not.toThrow();
    const res = applyCors(r, new Response("{}"));
    expect(res.headers.get("access-control-allow-origin")).toBe("https://user.github.io");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
    expect(preflight(req({ origin: "https://user.github.io" }, "OPTIONS")).headers.get("access-control-allow-headers")).toContain("Authorization");
  });
  it("origin lain tetap ditolak walau ALLOWED_ORIGINS diisi", () => {
    process.env.ALLOWED_ORIGINS = "https://user.github.io";
    const r = req({ origin: "https://evil.example", host: "api.test", "sec-fetch-site": "cross-site" });
    expect(() => assertSameOrigin(r)).toThrow();
    expect(() => assertNotCrossSite(r)).toThrow();
    expect(applyCors(r, new Response("{}")).headers.get("access-control-allow-origin")).toBeNull();
    // github.io lain (subdomain berbeda) juga ditolak
    expect(() => assertSameOrigin(req({ origin: "https://attacker.github.io", host: "api.test" }))).toThrow();
  });
  it("cookie lintas situs: SameSite=None, Secure, Partitioned", async () => {
    process.env.ALLOWED_ORIGINS = "https://user.github.io";
    const { cookieOptions, sessionCookieName } = await import("@/lib/session");
    expect(cookieOptions(60)).toMatchObject({ sameSite: "none", secure: true, partitioned: true, httpOnly: true });
    expect(sessionCookieName()).toBe("__Host-felix_session");
    delete process.env.ALLOWED_ORIGINS;
    expect(cookieOptions(60).sameSite).toBe("lax");
  });
});
