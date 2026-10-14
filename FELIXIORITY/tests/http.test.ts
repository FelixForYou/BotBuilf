import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defaultTransport, MAX_RESPONSE_BYTES } from "@/lib/http";
import type { PanelTarget } from "@/lib/validation";

let server: http.Server;
let port = 0;
const seen: string[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    seen.push(req.headers.authorization ?? "");
    if (req.url?.startsWith("/redirect")) {
      res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data" });
      return res.end();
    }
    if (req.url?.startsWith("/big")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      const chunk = Buffer.alloc(1024 * 1024, 97);
      for (let i = 0; i < 10; i++) res.write(chunk);
      return res.end();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"object":"list","data":[]}');
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
});
afterAll(() => server.close());

const target = (): PanelTarget => ({ origin: `http://127.0.0.1:${port}`, protocol: "http:", hostname: "127.0.0.1", port, host: `127.0.0.1:${port}` });
const KEY = "ptla_" + "z".repeat(43);

describe("defaultTransport", () => {
  it("memblokir alamat loopback tanpa mode dev", async () => {
    delete process.env.FELIX_DEV_ALLOW_PRIVATE;
    await expect(defaultTransport(target(), "/api/application/users", KEY)).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
    expect(seen).toHaveLength(0);
  });
  it("memblokir hostname yang resolve ke loopback (DNS)", async () => {
    delete process.env.FELIX_DEV_ALLOW_PRIVATE;
    const t = { ...target(), hostname: "localhost", origin: `http://localhost:${port}`, host: `localhost:${port}` };
    await expect(defaultTransport(t, "/", KEY)).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
  });
  it("tidak mengikuti redirect", async () => {
    process.env.FELIX_DEV_ALLOW_PRIVATE = "1";
    await expect(defaultTransport(target(), "/redirect", KEY)).rejects.toMatchObject({ code: "REDIRECT" });
    delete process.env.FELIX_DEV_ALLOW_PRIVATE;
  });
  it("membatasi ukuran respons", async () => {
    process.env.FELIX_DEV_ALLOW_PRIVATE = "1";
    expect(MAX_RESPONSE_BYTES).toBeLessThan(10 * 1024 * 1024);
    await expect(defaultTransport(target(), "/big", KEY)).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
    delete process.env.FELIX_DEV_ALLOW_PRIVATE;
  });
  it("mengirim bearer key hanya ke panel dan membaca respons", async () => {
    process.env.FELIX_DEV_ALLOW_PRIVATE = "1";
    const r = await defaultTransport(target(), "/api/application/users", KEY);
    expect(r.status).toBe(200);
    expect(seen.at(-1)).toBe(`Bearer ${KEY}`);
    delete process.env.FELIX_DEV_ALLOW_PRIVATE;
  });
});
