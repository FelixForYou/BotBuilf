import { beforeAll, describe, expect, it } from "vitest";
import { assignSlots, roomCount, roomOfSlot } from "@/lib/rooms";
import { assembleSnapshot } from "@/lib/sync";
import { diffUsers } from "@/lib/client-store";
import { appearanceFor } from "@/lib/appearance";
import { ROOM_CAPACITY } from "@/lib/workspace/layout";

beforeAll(() => {
  process.env.SESSION_SECRET = "a".repeat(64);
});

describe("session", () => {
  it("enkripsi/dekripsi dan tolak cookie yang diubah atau kedaluwarsa", async () => {
    const { sealSession, openSession } = await import("@/lib/session");
    const payload = {
      sid: "s1",
      origin: "https://p.test",
      protocol: "https:" as const,
      hostname: "p.test",
      port: 443,
      host: "p.test",
      key: "ptla_" + "k".repeat(43),
      iat: Date.now(),
      exp: Date.now() + 60_000,
    };
    const token = sealSession(payload);
    expect(token).not.toContain("ptla_");
    expect(openSession(token)?.key).toBe(payload.key);
    const parts = token.split(".");
    const ct = Buffer.from(parts[2], "base64url");
    ct[0] ^= 1;
    parts[2] = ct.toString("base64url");
    expect(openSession(parts.join("."))).toBeNull();
    expect(openSession(token, Date.now() + 120_000)).toBeNull();
    expect(openSession("garbage")).toBeNull();
  });
  it("secret lain tidak bisa membuka", async () => {
    const { sealSession, openSession } = await import("@/lib/session");
    const token = sealSession({ sid: "x", origin: "o", protocol: "https:", hostname: "h", port: 1, host: "h", key: "k", iat: 0, exp: Date.now() + 1000 });
    process.env.SESSION_SECRET = "b".repeat(64);
    expect(openSession(token)).toBeNull();
    process.env.SESSION_SECRET = "a".repeat(64);
  });
});

describe("assignSlots", () => {
  it("stabil antar polling dan mengisi slot kosong", () => {
    const ids = Array.from({ length: 60 }, (_, i) => i + 1);
    const a = assignSlots(new Map(), ids);
    expect(roomCount(a)).toBe(Math.ceil(60 / ROOM_CAPACITY));
    const b = assignSlots(a, ids);
    expect([...b]).toEqual([...a]);
    // hapus user 5, tambah 61 → 61 mengisi slot user 5, yang lain tetap
    const c = assignSlots(b, [...ids.filter((i) => i !== 5), 61]);
    expect(c.get(61)).toBe(a.get(5));
    for (const id of ids) if (id !== 5) expect(c.get(id)).toBe(a.get(id));
    expect(roomOfSlot(c.get(60)!)).toBe(roomOfSlot(a.get(60)!));
  });
});

describe("diffUsers", () => {
  it("mendeteksi tambah, hapus, dan ubah", () => {
    const base = assembleSnapshot(
      [
        { id: 1, username: "a", rootAdmin: true, createdAt: null },
        { id: 2, username: "b", rootAdmin: false, createdAt: null },
      ],
      [],
      "p",
      2,
    );
    const next = assembleSnapshot(
      [
        { id: 1, username: "a2", rootAdmin: true, createdAt: null },
        { id: 3, username: "c", rootAdmin: false, createdAt: null },
      ],
      [{ id: 9, identifier: "x", name: "s", ownerId: 3, suspended: false, limits: { memory: 0, disk: 0, cpu: 0, swap: 0 }, nodeId: 1, createdAt: null }],
      "p",
      2,
    );
    expect(diffUsers(base, next)).toEqual({ added: 1, removed: 1, changed: 1 });
    expect(next.users.find((u) => u.id === 3)?.serverCount).toBe(1);
  });
});

describe("appearance", () => {
  it("deterministik per ID", () => {
    expect(appearanceFor(42)).toEqual(appearanceFor(42));
    const variants = new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(appearanceFor(i))));
    expect(variants.size).toBeGreaterThan(40);
  });
});
