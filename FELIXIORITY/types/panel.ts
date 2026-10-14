// Tipe data yang dikirim backend aplikasi ke frontend.
// API key (PTLA) tidak pernah menjadi bagian dari tipe ini.

export interface PanelUser {
  id: number;
  username: string;
  rootAdmin: boolean;
  createdAt: string | null;
  /** Jumlah server yang atribut `user`-nya sama dengan `id` user ini. */
  serverCount: number;
}

export interface ServerLimits {
  /** MB, 0 = tanpa batas */
  memory: number | null;
  /** MB, 0 = tanpa batas */
  disk: number | null;
  /** persen (100 = 1 core), 0 = tanpa batas */
  cpu: number | null;
  swap: number | null;
}

export interface PanelServer {
  id: number;
  identifier: string;
  name: string;
  /** ID user pemilik (atribut `user` dari Application API). */
  ownerId: number;
  /** Status administratif dari panel (bukan status daya). */
  suspended: boolean;
  limits: ServerLimits;
  nodeId: number | null;
  createdAt: string | null;
}

export interface SnapshotTotals {
  users: number;
  servers: number;
  admins: number;
  usersWithoutServer: number;
  /** Server yang ID pemiliknya tidak ada di daftar user pada snapshot ini. */
  serversWithUnknownOwner: number;
}

export interface Snapshot {
  syncedAt: string;
  panelHost: string;
  users: PanelUser[];
  servers: PanelServer[];
  totals: SnapshotTotals;
  /** Jeda polling yang disarankan backend (ms), menyesuaikan jumlah halaman. */
  recommendedIntervalMs: number;
  /** Jumlah permintaan ke panel untuk snapshot ini. */
  requests: number;
}

export interface ApiError {
  error: string;
  code: string;
  retryAfterMs?: number;
}

export interface SessionInfo {
  panelHost: string;
  panelOrigin: string;
  connectedAt: number;
  expiresAt: number;
}
