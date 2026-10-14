"use client";
import { useId, useMemo, useRef, useState } from "react";
import type { PanelUser } from "@/types/panel";
import { IconSearch, IconServer, IconShield, IconX } from "./icons";

export interface SearchProps {
  users: PanelUser[];
  roomOf: (id: number) => number;
  onPick: (id: number) => void;
  placeholder?: string;
}

/** Cari username di SEMUA ruangan. Memilih hasil membuka ruangannya. */
export function Search({ users, roomOf, onPick, placeholder = "Cari username…" }: SearchProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const starts: PanelUser[] = [];
    const contains: PanelUser[] = [];
    for (const u of users) {
      const name = u.username.toLowerCase();
      if (name.startsWith(term) || String(u.id) === term) starts.push(u);
      else if (name.includes(term)) contains.push(u);
    }
    return [...starts, ...contains];
  }, [q, users]);
  const shown = results.slice(0, 8);

  const pick = (u: PanelUser) => {
    onPick(u.id);
    setOpen(false);
    setQ(u.username);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full">
      <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!shown.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % shown.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + shown.length) % shown.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        aria-label="Cari username"
        role="combobox"
        aria-expanded={open && shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${shown[active].id}` : undefined}
        className="h-10 w-full rounded-lg border border-line bg-bg/60 pl-9 pr-9 text-sm text-ink placeholder:text-ink-mute focus:border-accent/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-mute hover:text-ink"
          aria-label="Hapus pencarian"
        >
          <IconX size={14} />
        </button>
      )}
      {open && q.trim() && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
          {shown.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink-mute">Tidak ada user dengan nama itu.</div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Hasil pencarian" className="max-h-80 overflow-auto py-1">
              {shown.map((u, i) => (
                <li
                  key={u.id}
                  id={`${listId}-${u.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(u)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${i === active ? "bg-accent/15" : ""}`}
                >
                  {u.rootAdmin && <IconShield size={14} className="shrink-0 text-violet-300" />}
                  <span className="truncate font-semibold">{u.username}</span>
                  <span className="text-xs text-ink-mute">#{u.id}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                    <span className="flex items-center gap-1">
                      <IconServer size={12} />
                      {u.serverCount}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5">Ruang {roomOf(u.id) + 1}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {results.length > shown.length && (
            <div className="border-t border-line px-3 py-2 text-xs text-ink-mute">
              {results.length - shown.length} hasil lain — perjelas pencarian.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
