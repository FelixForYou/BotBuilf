import { fetchAll, mapServer, mapUser, type PanelClient } from "./pterodactyl";
import type { PanelServer, PanelUser, Snapshot } from "@/types/panel";

export const MIN_INTERVAL_MS = 12_000;
/** Target maksimum permintaan ke panel per menit dari polling satu tab (default limit Pterodactyl 240/menit). */
const TARGET_REQ_PER_MIN = 60;

/**
 * Bangun snapshot lengkap. User dan server diambil berurutan; semua halaman
 * harus berhasil. Jika ada yang gagal, fungsi melempar error dan snapshot lama
 * tetap dipakai oleh pemanggil.
 *
 * Catatan: dua endpoint dibaca pada waktu yang sedikit berbeda, sehingga tidak
 * ada jaminan konsistensi transaksional antara daftar user dan server.
 */
export async function buildSnapshot(client: PanelClient): Promise<Snapshot> {
  let requests = 0;
  const counted: PanelClient = { ...client, onRequest: () => requests++ };
  const rawUsers = await fetchAll(counted, "users");
  const rawServers = await fetchAll(counted, "servers");
  return assembleSnapshot(
    rawUsers.map(mapUser),
    rawServers.map(mapServer),
    client.target.host,
    requests,
  );
}

export function assembleSnapshot(
  users: Omit<PanelUser, "serverCount">[],
  servers: PanelServer[],
  panelHost: string,
  requests: number,
  now = new Date(),
): Snapshot {
  // Kepemilikan dicocokkan via ID user (atribut `user` server), bukan username.
  const counts = new Map<number, number>();
  for (const s of servers) counts.set(s.ownerId, (counts.get(s.ownerId) ?? 0) + 1);
  const userIds = new Set(users.map((u) => u.id));

  const fullUsers: PanelUser[] = users
    .map((u) => ({ ...u, serverCount: counts.get(u.id) ?? 0 }))
    .sort((a, b) => a.id - b.id);
  const sortedServers = [...servers].sort((a, b) => a.id - b.id);

  const admins = fullUsers.filter((u) => u.rootAdmin).length;
  const usersWithoutServer = fullUsers.filter((u) => u.serverCount === 0).length;
  const serversWithUnknownOwner = sortedServers.filter((s) => !userIds.has(s.ownerId)).length;

  const recommendedIntervalMs = Math.max(MIN_INTERVAL_MS, Math.ceil((requests / TARGET_REQ_PER_MIN) * 60_000));

  return {
    syncedAt: now.toISOString(),
    panelHost,
    users: fullUsers,
    servers: sortedServers,
    totals: {
      users: fullUsers.length,
      servers: sortedServers.length,
      admins,
      usersWithoutServer,
      serversWithUnknownOwner,
    },
    recommendedIntervalMs,
    requests,
  };
}

// ---------------------------------------------------------------------------
// Dedupe per sesi: permintaan sinkronisasi bersamaan dari sesi yang sama
// memakai satu proses. Kunci = ID sesi acak, sehingga data antarsesi tidak tercampur.
// ---------------------------------------------------------------------------
const inflight = new Map<string, Promise<Snapshot>>();

export function syncOnce(sid: string, client: PanelClient): Promise<Snapshot> {
  const existing = inflight.get(sid);
  if (existing) return existing;
  const p = buildSnapshot(client).finally(() => inflight.delete(sid));
  inflight.set(sid, p);
  return p;
}
