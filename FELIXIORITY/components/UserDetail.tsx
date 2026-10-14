"use client";
import { CharacterPreview } from "./workspace/CharacterPreview";
import { formatCpu, formatDate, formatMB, formatNumber } from "@/lib/format";
import type { PanelServer, PanelUser } from "@/types/panel";
import {
  IconCalendar,
  IconCpu,
  IconDisk,
  IconHash,
  IconInfo,
  IconMap,
  IconMemory,
  IconServer,
  IconShield,
  IconUser,
  IconX,
} from "./icons";

export function UserDetail({
  user,
  servers,
  room,
  onClose,
  action,
}: {
  user: PanelUser;
  servers: PanelServer[];
  room?: number;
  onClose?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-4 border-b border-line p-4">
        <div className="relative grid h-[104px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-[linear-gradient(180deg,#1b2552,#141c45)]">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-[#c58b56]/80" />
          <div className="relative self-end pb-1">
            <CharacterPreview id={user.id} scale={3.5} />
          </div>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">User terpilih</div>
          <h2 className="truncate text-xl font-black" title={user.username}>
            {user.username}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {user.rootAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/40">
                <IconShield size={12} /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/30">
                <IconUser size={12} /> User
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-white/5 hover:text-ink"
            aria-label="Tutup detail"
          >
            <IconX />
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 p-4 text-sm">
        <Info icon={<IconHash size={14} />} label="ID user" value={`#${user.id}`} />
        <Info icon={<IconShield size={14} />} label="Role" value={user.rootAdmin ? "Admin" : "User"} />
        <Info icon={<IconCalendar size={14} />} label="Bergabung" value={formatDate(user.createdAt)} />
        <Info icon={<IconServer size={14} />} label="Total server" value={formatNumber(user.serverCount)} />
        {room !== undefined && <Info icon={<IconMap size={14} />} label="Ruangan" value={`Ruangan ${room + 1}`} />}
      </dl>
      {action && <div className="px-4 pb-3">{action}</div>}

      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-sm font-bold">Server milik user</h3>
        <span className="text-xs text-ink-mute">{formatNumber(servers.length)} server</span>
      </div>
      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-ink-soft">
            User ini belum memiliki server.
          </div>
        ) : (
          servers.map((s) => <ServerItem key={s.id} server={s} />)
        )}
        <p className="flex gap-1.5 pt-1 text-[11px] leading-4 text-ink-mute">
          <IconInfo size={13} className="mt-px shrink-0" />
          Angka di atas adalah batas alokasi dari Application API. Status daya dan pemakaian CPU/RAM langsung: tidak
          tersedia melalui PTLA.
        </p>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-bg/40 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[11px] text-ink-mute">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-semibold">{value}</dd>
    </div>
  );
}

export function ServerItem({ server }: { server: PanelServer }) {
  return (
    <div className="rounded-xl border border-line bg-bg/40 p-3">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-blue-300">
          <IconServer size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold" title={server.name}>
            {server.name}
          </div>
          <div className="truncate font-mono text-[11px] text-ink-mute">
            ID {server.id} · {server.identifier || "-"}
          </div>
        </div>
        {server.suspended && (
          <span className="shrink-0 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
            Ditangguhkan
          </span>
        )}
      </div>
      <div className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Batas alokasi</div>
      <div className="mt-1 grid grid-cols-3 gap-1.5 text-xs">
        <Limit icon={<IconMemory size={13} />} label="RAM" value={formatMB(server.limits.memory)} />
        <Limit icon={<IconDisk size={13} />} label="Disk" value={formatMB(server.limits.disk)} />
        <Limit icon={<IconCpu size={13} />} label="CPU" value={formatCpu(server.limits.cpu)} />
      </div>
    </div>
  );
}

function Limit({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.03] px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-ink-mute">
        {icon}
        {label}
      </div>
      <div className="truncate font-semibold tabular-nums">{value}</div>
    </div>
  );
}
