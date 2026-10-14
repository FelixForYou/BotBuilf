"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Drawer } from "@/components/Drawer";
import { IconGrid, IconSearch, IconServer, IconShield } from "@/components/icons";
import { Pagination } from "@/components/Pagination";
import { Stats } from "@/components/Stats";
import { UserDetail } from "@/components/UserDetail";
import { CharacterPreview } from "@/components/workspace/CharacterPreview";
import { useStore } from "@/lib/client-store";
import { formatDate } from "@/lib/format";
import { roomOfSlot } from "@/lib/rooms";

const PAGE_SIZE = 25;
type Filter = "all" | "admin" | "noserver";
type Sort = "id" | "username" | "servers";

export function UsersView() {
  const { snapshot, slots, usersById, serversByOwner } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("id");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = snapshot!.users.filter((u) => {
      if (filter === "admin" && !u.rootAdmin) return false;
      if (filter === "noserver" && u.serverCount !== 0) return false;
      if (!term) return true;
      return u.username.toLowerCase().includes(term) || String(u.id) === term;
    });
    if (sort === "username") list.sort((a, b) => a.username.localeCompare(b.username, "id"));
    else if (sort === "servers") list.sort((a, b) => b.serverCount - a.serverCount || a.id - b.id);
    return list;
  }, [snapshot, q, filter, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const open = openId !== null ? usersById.get(openId) : undefined;

  return (
    <div className="space-y-3">
      <Stats totals={snapshot!.totals} />
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <h1 className="mr-2 text-lg font-black">Pengguna</h1>
          <div className="relative w-full sm:w-72">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Cari username atau ID…"
              aria-label="Cari username atau ID"
              className="h-10 w-full rounded-lg border border-line bg-bg/60 pl-9 pr-3 text-sm placeholder:text-ink-mute focus:border-accent/70 focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as Filter);
              setPage(0);
            }}
            aria-label="Filter"
            className="h-10 rounded-lg border border-line bg-bg/60 px-2 text-sm"
          >
            <option value="all">Semua user</option>
            <option value="admin">Admin</option>
            <option value="noserver">Tanpa server</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Urutkan"
            className="h-10 rounded-lg border border-line bg-bg/60 px-2 text-sm"
          >
            <option value="id">Urut ID</option>
            <option value="username">Urut username</option>
            <option value="servers">Server terbanyak</option>
          </select>
        </div>

        {/* Tabel (desktop) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-mute">
              <tr className="border-b border-line">
                <th className="px-3 py-2.5 font-semibold">User</th>
                <th className="px-3 py-2.5 font-semibold">ID</th>
                <th className="px-3 py-2.5 font-semibold">Role</th>
                <th className="px-3 py-2.5 font-semibold">Bergabung</th>
                <th className="px-3 py-2.5 text-right font-semibold">Server</th>
                <th className="px-3 py-2.5 font-semibold">Ruangan</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer border-b border-line/50 hover:bg-white/[0.03]"
                  onClick={() => setOpenId(u.id)}
                >
                  <td className="px-3 py-2">
                    <button type="button" className="flex items-center gap-2 text-left font-semibold" onClick={() => setOpenId(u.id)}>
                      <CharacterPreview id={u.id} scale={1.25} />
                      <span className="max-w-[260px] truncate">{u.username}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2 font-mono text-ink-soft">#{u.id}</td>
                  <td className="px-3 py-2">
                    {u.rootAdmin ? (
                      <span className="inline-flex items-center gap-1 text-violet-200">
                        <IconShield size={13} /> Admin
                      </span>
                    ) : (
                      <span className="text-ink-soft">User</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{u.serverCount}</td>
                  <td className="px-3 py-2 text-ink-soft">{roomOfSlot(slots.get(u.id) ?? 0) + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kartu (HP) */}
        <ul className="divide-y divide-line/60 md:hidden">
          {pageRows.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => setOpenId(u.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <CharacterPreview id={u.id} scale={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {u.rootAdmin && <IconShield size={13} className="shrink-0 text-violet-300" />}
                    <span className="truncate font-semibold">{u.username}</span>
                  </div>
                  <div className="text-xs text-ink-mute">
                    #{u.id} · {formatDate(u.createdAt)}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <IconServer size={14} className="text-ink-mute" />
                  {u.serverCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-mute">Tidak ada user yang cocok.</div>}
        <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </section>

      {open && (
        <Drawer label={`Detail ${open.username}`} onClose={() => setOpenId(null)}>
          <UserDetail
            user={open}
            servers={serversByOwner.get(open.id) ?? []}
            room={roomOfSlot(slots.get(open.id) ?? 0)}
            onClose={() => setOpenId(null)}
            action={
              <Link
                href={`/workspace?user=${open.id}`}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-blue-500"
              >
                <IconGrid size={16} /> Lihat di Workspace
              </Link>
            }
          />
        </Drawer>
      )}
    </div>
  );
}
