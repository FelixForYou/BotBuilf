import { AppError } from "./errors";
import { defaultTransport, type PanelResponse, type PanelTransport } from "./http";
import type { PanelTarget } from "./validation";
import type { PanelServer, PanelUser } from "@/types/panel";

export const PER_PAGE = 100;
/** Batas pengaman: 1000 halaman × 100 = 100.000 data per endpoint. Melebihi ini → error eksplisit, bukan dipotong diam-diam. */
export const MAX_PAGES = 1000;
const PAGE_CONCURRENCY = 3;

export type Resource = "users" | "servers";

export interface PanelClient {
  target: PanelTarget;
  apiKey: string;
  transport?: PanelTransport;
  /** Dipanggil setiap satu permintaan ke panel (untuk statistik). */
  onRequest?: () => void;
}

interface ListResponse {
  object: "list";
  data: { object: string; attributes: Record<string, unknown> }[];
  meta?: { pagination?: { total: number; count: number; per_page: number; current_page: number; total_pages: number } };
}

const LABEL: Record<Resource, string> = { users: "Users", servers: "Servers" };

function parseRetryAfter(res: PanelResponse): number {
  const ra = res.headers["retry-after"];
  const v = Array.isArray(ra) ? ra[0] : ra;
  const n = v ? Number(v) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.min(n * 1000, 5 * 60_000);
  return 30_000;
}

function checkResponse(res: PanelResponse, resource: Resource): ListResponse {
  if (res.status === 401) {
    throw new AppError("KEY_REJECTED", "API key ditolak panel. Pastikan Application API key (ptla_) benar dan masih aktif.", 422);
  }
  if (res.status === 403) {
    throw new AppError(
      "PERMISSION_DENIED",
      `Izin API key kurang. Aktifkan izin baca (Read) untuk ${LABEL[resource]} pada Application API key.`,
      422,
    );
  }
  if (res.status === 429) {
    const retryAfterMs = parseRetryAfter(res);
    throw new AppError("RATE_LIMITED", "Panel membatasi jumlah permintaan. Sinkronisasi dicoba lagi otomatis.", 429, retryAfterMs);
  }
  if (res.status === 404 || res.status === 405) {
    throw new AppError("NOT_PTERODACTYL", "Alamat ini tidak terlihat seperti panel Pterodactyl (endpoint Application API tidak ditemukan).", 422);
  }
  if (res.status >= 500) {
    throw new AppError("PANEL_ERROR", `Panel mengalami gangguan (HTTP ${res.status}). Coba lagi nanti.`, 502);
  }
  if (res.status !== 200) {
    throw new AppError("PANEL_ERROR", `Panel memberi respons tak terduga (HTTP ${res.status}).`, 502);
  }
  let json: unknown;
  try {
    json = JSON.parse(res.body);
  } catch {
    throw new AppError("NOT_PTERODACTYL", "Respons bukan JSON Pterodactyl. Periksa domain panel.", 422);
  }
  const list = json as ListResponse;
  if (!list || list.object !== "list" || !Array.isArray(list.data)) {
    throw new AppError("NOT_PTERODACTYL", "Format respons tidak sesuai Application API Pterodactyl.", 422);
  }
  return list;
}

async function getPage(client: PanelClient, resource: Resource, page: number, perPage = PER_PAGE): Promise<ListResponse> {
  const transport = client.transport ?? defaultTransport;
  const path = `/api/application/${resource}?page=${page}&per_page=${perPage}`;
  client.onRequest?.();
  const res = await transport(client.target, path, client.apiKey);
  return checkResponse(res, resource);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  let failed: unknown = null;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length && !failed) {
      const idx = i++;
      try {
        out[idx] = await fn(items[idx]);
      } catch (e) {
        failed = failed ?? e;
      }
    }
  });
  await Promise.all(workers);
  if (failed) throw failed;
  return out;
}

/**
 * Ambil SEMUA halaman. Jika satu halaman gagal, seluruh pemanggilan gagal
 * (tidak ada hasil parsial yang dikembalikan).
 */
export async function fetchAll(client: PanelClient, resource: Resource): Promise<Record<string, unknown>[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const first = await getPage(client, resource, 1);
    const pg = first.meta?.pagination;
    const totalPages = pg ? Math.max(1, Number(pg.total_pages) || 1) : 1;
    const expected = pg ? Number(pg.total) : first.data.length;
    if (totalPages > MAX_PAGES) {
      throw new AppError(
        "TOO_MANY_PAGES",
        `Panel memiliki lebih dari ${MAX_PAGES * PER_PAGE} ${resource === "users" ? "user" : "server"}; melebihi batas aplikasi.`,
        422,
      );
    }
    const rest = await mapLimit(
      Array.from({ length: totalPages - 1 }, (_, k) => k + 2),
      PAGE_CONCURRENCY,
      (p) => getPage(client, resource, p),
    );
    const byId = new Map<number, Record<string, unknown>>();
    for (const page of [first, ...rest]) {
      for (const item of page.data) {
        const a = item?.attributes;
        if (a && typeof a.id === "number") byId.set(a.id, a);
      }
    }
    // Data bisa berubah saat halaman dibaca (bergeser antar halaman). Ulangi sekali.
    if (byId.size === expected || attempt === 1) return [...byId.values()];
  }
  return [];
}

/** Uji koneksi + izin kedua resource dengan permintaan kecil. */
export async function verifyAccess(client: PanelClient): Promise<{ users: number; servers: number }> {
  const u = await getPage(client, "users", 1, 1);
  const s = await getPage(client, "servers", 1, 1);
  return {
    users: Number(u.meta?.pagination?.total ?? u.data.length),
    servers: Number(s.meta?.pagination?.total ?? s.data.length),
  };
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export function mapUser(a: Record<string, unknown>): Omit<PanelUser, "serverCount"> {
  return {
    id: a.id as number,
    username: str(a.username) ?? `user-${a.id}`,
    rootAdmin: a.root_admin === true,
    createdAt: str(a.created_at),
  };
}

export function mapServer(a: Record<string, unknown>): PanelServer {
  // Pemilik tidak diketahui → -1 (tetap dihitung dalam total, tidak dibuang)
  const owner = num(a.user) ?? -1;
  const limits = (a.limits ?? {}) as Record<string, unknown>;
  return {
    id: a.id as number,
    identifier: str(a.identifier) ?? "",
    name: str(a.name) ?? `Server ${a.id}`,
    ownerId: owner,
    suspended: a.suspended === true || a.status === "suspended",
    limits: {
      memory: num(limits.memory),
      disk: num(limits.disk),
      cpu: num(limits.cpu),
      swap: num(limits.swap),
    },
    nodeId: num(a.node),
    createdAt: str(a.created_at),
  };
}
