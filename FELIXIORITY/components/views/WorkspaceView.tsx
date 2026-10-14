"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "@/components/Search";
import { Stats } from "@/components/Stats";
import { UserDetail } from "@/components/UserDetail";
import type { Resident } from "@/components/workspace/Character";
import { CharacterPreview } from "@/components/workspace/CharacterPreview";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconInfo,
  IconList,
  IconServer,
  IconShield,
  IconUser,
} from "@/components/icons";
import { useStore } from "@/lib/client-store";
import { formatNumber } from "@/lib/format";
import { usePrefs, useReducedMotion } from "@/lib/prefs";
import { roomOfSlot, seatOfSlot } from "@/lib/rooms";
import { ROOM_CAPACITY } from "@/lib/workspace/layout";
import type { PanelUser } from "@/types/panel";

const Office = dynamic(() => import("@/components/workspace/Office"), { ssr: false });

type Filter = "all" | "admin" | "noserver";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "admin", label: "Admin" },
  { id: "noserver", label: "Tanpa server" },
];

function matchesFilter(u: PanelUser, f: Filter) {
  if (f === "admin") return u.rootAdmin;
  if (f === "noserver") return u.serverCount === 0;
  return true;
}

export function WorkspaceView({ initialUserId }: { initialUserId: number | null }) {
  const store = useStore();
  const snapshot = store.snapshot!;
  const { slots, rooms, usersById, serversByOwner } = store;
  const prefs = usePrefs();
  const reducedMotion = useReducedMotion();

  const [roomIndex, setRoomIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [focusRequest, setFocusRequest] = useState<{ id: number; nonce: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const nonce = useRef(0);

  const roomOf = useCallback((id: number) => roomOfSlot(slots.get(id) ?? 0), [slots]);

  const openUser = useCallback(
    (id: number, focus = true) => {
      if (!slots.has(id)) return;
      setRoomIndex(roomOf(id));
      setSelectedId(id);
      if (focus) setFocusRequest({ id, nonce: ++nonce.current });
    },
    [slots, roomOf],
  );

  // ?user=ID dari halaman Pengguna/Server
  const initialHandled = useRef(false);
  useEffect(() => {
    if (initialHandled.current || initialUserId === null) return;
    initialHandled.current = true;
    if (slots.has(initialUserId)) openUser(initialUserId);
  }, [initialUserId, slots, openUser]);

  // Jaga state tetap valid setelah sinkronisasi (user dihapus / ruangan berkurang).
  useEffect(() => {
    if (selectedId !== null && !usersById.has(selectedId)) setSelectedId(null);
    if (roomIndex > rooms - 1) setRoomIndex(rooms - 1);
  }, [usersById, rooms, roomIndex, selectedId]);

  const residents: Resident[] = useMemo(() => {
    const out: Resident[] = [];
    for (const u of snapshot.users) {
      const slot = slots.get(u.id);
      if (slot === undefined || roomOfSlot(slot) !== roomIndex) continue;
      out.push({
        id: u.id,
        username: u.username,
        serverCount: u.serverCount,
        isAdmin: u.rootAdmin,
        seatIndex: seatOfSlot(slot),
      });
    }
    return out.sort((a, b) => a.seatIndex - b.seatIndex);
  }, [snapshot, slots, roomIndex]);

  const matches = useMemo(() => {
    if (filter === "all") return null;
    return new Set(snapshot.users.filter((u) => matchesFilter(u, filter)).map((u) => u.id));
  }, [snapshot, filter]);

  const roomStats = useMemo(() => {
    const stats = Array.from({ length: rooms }, () => ({ total: 0, match: 0 }));
    for (const u of snapshot.users) {
      const slot = slots.get(u.id);
      if (slot === undefined) continue;
      const r = stats[roomOfSlot(slot)];
      if (!r) continue;
      r.total++;
      if (matchesFilter(u, filter)) r.match++;
    }
    return stats;
  }, [snapshot, slots, rooms, filter]);

  const selected = selectedId !== null ? usersById.get(selectedId) ?? null : null;
  const selectedServers = selected ? serversByOwner.get(selected.id) ?? [] : [];
  const here = roomStats[roomIndex] ?? { total: 0, match: 0 };
  const listUsers = residents
    .map((r) => usersById.get(r.id)!)
    .filter((u) => u && matchesFilter(u, filter));

  const go = (delta: number) => {
    setRoomIndex((r) => Math.min(rooms - 1, Math.max(0, r + delta)));
  };

  const onSelect = useCallback((id: number | null) => setSelectedId(id), []);

  return (
    <div className="space-y-3">
      <Stats totals={snapshot.totals} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card flex min-w-0 flex-col overflow-hidden" aria-label="Workspace pixel">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-2.5 sm:p-3">
            <div className="w-full sm:w-64">
              <Search users={snapshot.users} roomOf={roomOf} onPick={(id) => openUser(id)} />
            </div>
            <div className="flex h-10 w-full rounded-lg border border-line bg-bg/60 p-1 sm:w-auto" role="group" aria-label="Filter user">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 rounded-md px-2.5 text-xs font-semibold sm:flex-none sm:px-3 ${
                    filter === f.id ? "bg-accent text-white shadow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-1.5 sm:ml-auto sm:w-auto">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={roomIndex === 0}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-bg/60 text-ink-soft hover:text-ink disabled:opacity-40"
                aria-label="Ruangan sebelumnya"
              >
                <IconChevronLeft />
              </button>
              <label className="sr-only" htmlFor="room-select">
                Pilih ruangan
              </label>
              <select
                id="room-select"
                value={roomIndex}
                onChange={(e) => setRoomIndex(Number(e.target.value))}
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg/60 px-2 text-sm font-semibold text-ink sm:flex-none"
              >
                {roomStats.map((r, i) => (
                  <option key={i} value={i}>
                    Ruangan {i + 1} / {rooms}
                    {filter === "all" ? ` · ${r.total} user` : ` · ${r.match} cocok`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={roomIndex >= rooms - 1}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-bg/60 text-ink-soft hover:text-ink disabled:opacity-40"
                aria-label="Ruangan berikutnya"
              >
                <IconChevronRight />
              </button>
            </div>
          </div>

          {/* Ruangan */}
          <div className="relative h-[62dvh] min-h-[360px] bg-[#070b1c] lg:h-[calc(100dvh-280px)] lg:min-h-[480px]">
            <Office
              roomIndex={roomIndex}
              residents={residents}
              selectedId={selectedId}
              matches={matches}
              reducedMotion={reducedMotion}
              labelMode={prefs.labels}
              onSelect={onSelect}
              focusRequest={focusRequest}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
              <span className="rounded-lg border border-line bg-panel/90 px-2.5 py-1 text-xs font-bold backdrop-blur">
                Ruangan {roomIndex + 1}
                <span className="font-normal text-ink-mute"> / {rooms}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-line bg-panel/90 px-2.5 py-1 text-[11px] text-ink-soft backdrop-blur">
                <IconUser size={12} /> 1 karakter = 1 user
              </span>
            </div>
            {here.total === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-ink-soft">
                Ruangan ini kosong.
              </div>
            )}
          </div>

          {/* Keterangan */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-[11px] text-ink-mute">
            <span>
              Ruangan ini: <b className="text-ink-soft">{here.total}</b> dari {ROOM_CAPACITY} kursi
              {filter !== "all" && (
                <>
                  {" "}
                  · <b className="text-ink-soft">{here.match}</b> cocok filter
                </>
              )}
            </span>
            <span className="flex items-center gap-1">
              <IconInfo size={12} /> Gerakan karakter hanya animasi, bukan status online atau aktivitas server.
            </span>
            <button
              type="button"
              onClick={() => setListOpen((v) => !v)}
              aria-expanded={listOpen}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold text-ink-soft hover:bg-white/5 hover:text-ink"
            >
              <IconList size={14} /> Daftar user ruangan ini
              <IconChevronDown size={14} className={listOpen ? "rotate-180" : ""} />
            </button>
          </div>
          {listOpen && (
            <ul className="thin-scroll grid max-h-72 grid-cols-1 gap-1 overflow-y-auto border-t border-line p-2 sm:grid-cols-2 xl:grid-cols-3">
              {listUsers.length === 0 && <li className="p-2 text-sm text-ink-mute">Tidak ada user yang cocok di ruangan ini.</li>}
              {listUsers.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => openUser(u.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5 ${
                      selectedId === u.id ? "bg-accent/15 ring-1 ring-accent/40" : ""
                    }`}
                  >
                    <CharacterPreview id={u.id} scale={1.5} />
                    {u.rootAdmin && <IconShield size={13} className="shrink-0 text-violet-300" />}
                    <span className="truncate font-semibold">{u.username}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-ink-mute">
                      <IconServer size={12} /> {u.serverCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Detail (desktop) */}
        <aside className="card hidden min-h-0 overflow-hidden lg:block lg:h-[calc(100dvh-170px)]" aria-label="Detail user">
          {selected ? (
            <UserDetail user={selected} servers={selectedServers} room={roomOf(selected.id)} onClose={() => setSelectedId(null)} />
          ) : (
            <EmptyDetail totalUsers={snapshot.totals.users} />
          )}
        </aside>
      </div>

      {/* Detail (HP): bottom sheet */}
      {selected && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedId(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${selected.username}`}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col rounded-t-2xl border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />
            <UserDetail user={selected} servers={selectedServers} room={roomOf(selected.id)} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyDetail({ totalUsers }: { totalUsers: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-blue-300 ring-1 ring-accent/30">
        <IconUser size={26} />
      </div>
      <div>
        <h2 className="font-bold">Pilih karakter</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Klik karakter di ruangan atau cari username untuk melihat detail dan server miliknya.
        </p>
      </div>
      <p className="text-xs text-ink-mute">{formatNumber(totalUsers)} user tersebar di beberapa ruangan.</p>
    </div>
  );
}
