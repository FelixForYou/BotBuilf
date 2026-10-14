import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import type { PanelResponse, PanelTransport } from "@/lib/http";
import { fetchAll, verifyAccess } from "@/lib/pterodactyl";
import { buildSnapshot } from "@/lib/sync";
import type { PanelTarget } from "@/lib/validation";

const target: PanelTarget = { origin: "https://p.test", protocol: "https:", hostname: "p.test", port: 443, host: "p.test" };
const KEY = "ptla_" + "k".repeat(43);

function fakePanel(nUsers: number, nServers: number, opts: { failPage?: number; status?: number } = {}) {
  const users = Array.from({ length: nUsers }, (_, i) => ({ id: i + 1, username: `u${i + 1}`, root_admin: i < 3, created_at: "2024-01-01T00:00:00Z" }));
  // user kelipatan 4 tanpa server; kepemilikan via ID
  const owners = users.filter((u) => u.id % 4 !== 0).map((u) => u.id);
  const servers = Array.from({ length: nServers }, (_, i) => ({
    id: i + 1,
    identifier: `id${i}`,
    name: `s${i}`,
    user: owners[i % owners.length],
    limits: { memory: 1024, disk: 2048, cpu: 100, swap: 0 },
    node: 1,
  }));
  const calls: string[] = [];
  const transport: PanelTransport = async (_t, path, key) => {
    calls.push(path);
    if (key !== KEY) return { status: 401, headers: {}, body: "{}" };
    if (opts.status) return { status: opts.status, headers: { "retry-after": "7" }, body: "{}" };
    const url = new URL(path, "https://p.test");
    const page = Number(url.searchParams.get("page"));
    const per = Number(url.searchParams.get("per_page"));
    if (opts.failPage && page === opts.failPage) return { status: 502, headers: {}, body: "bad" };
    const items = url.pathname.endsWith("/users") ? users : servers;
    const body = {
      object: "list",
      data: items.slice((page - 1) * per, page * per).map((a) => ({ object: "x", attributes: a })),
      meta: { pagination: { total: items.length, count: 0, per_page: per, current_page: page, total_pages: Math.max(1, Math.ceil(items.length / per)) } },
    };
    return { status: 200, headers: {}, body: JSON.stringify(body) } satisfies PanelResponse;
  };
  return { transport, calls, users, servers };
}

describe("fetchAll", () => {
  it("membaca seluruh halaman (>100 data)", async () => {
    const p = fakePanel(437, 0);
    const all = await fetchAll({ target, apiKey: KEY, transport: p.transport }, "users");
    expect(all).toHaveLength(437);
    expect(p.calls.filter((c) => c.includes("/users"))).toHaveLength(5);
    expect(new Set(all.map((a) => a.id)).size).toBe(437);
  });
  it("gagal total jika satu halaman gagal (tanpa hasil parsial)", async () => {
    const p = fakePanel(350, 0, { failPage: 3 });
    await expect(fetchAll({ target, apiKey: KEY, transport: p.transport }, "users")).rejects.toBeInstanceOf(AppError);
  });
  it("memetakan 401/403/429", async () => {
    const p = fakePanel(1, 1);
    await expect(fetchAll({ target, apiKey: "ptla_" + "x".repeat(43), transport: p.transport }, "users")).rejects.toMatchObject({ code: "KEY_REJECTED" });
    const f = fakePanel(1, 1, { status: 403 });
    await expect(fetchAll({ target, apiKey: KEY, transport: f.transport }, "servers")).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    const r = fakePanel(1, 1, { status: 429 });
    await expect(fetchAll({ target, apiKey: KEY, transport: r.transport }, "users")).rejects.toMatchObject({ code: "RATE_LIMITED", retryAfterMs: 7000 });
  });
  it("pesan error tidak memuat API key", async () => {
    const p = fakePanel(1, 1, { status: 500 });
    try {
      await fetchAll({ target, apiKey: KEY, transport: p.transport }, "users");
    } catch (e) {
      expect(String((e as Error).message)).not.toContain(KEY);
    }
  });
});

describe("verifyAccess", () => {
  it("memeriksa users dan servers", async () => {
    const p = fakePanel(120, 250);
    expect(await verifyAccess({ target, apiKey: KEY, transport: p.transport })).toEqual({ users: 120, servers: 250 });
  });
});

describe("buildSnapshot", () => {
  it("menghitung kepemilikan via ID user, admin, dan user tanpa server", async () => {
    const p = fakePanel(237, 512);
    const snap = await buildSnapshot({ target, apiKey: KEY, transport: p.transport });
    expect(snap.totals.users).toBe(237);
    expect(snap.totals.servers).toBe(512);
    expect(snap.totals.admins).toBe(3);
    const expectedCounts = new Map<number, number>();
    for (const s of p.servers) expectedCounts.set(s.user, (expectedCounts.get(s.user) ?? 0) + 1);
    for (const u of snap.users) expect(u.serverCount).toBe(expectedCounts.get(u.id) ?? 0);
    expect(snap.totals.usersWithoutServer).toBe(snap.users.filter((u) => u.id % 4 === 0).length);
    expect(snap.users.find((u) => u.id === 4)?.serverCount).toBe(0);
    expect(JSON.stringify(snap)).not.toContain(KEY);
    // 3 halaman users + 6 halaman servers
    expect(snap.requests).toBe(9);
  });
});
