"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IconInfo, IconSearch, IconServer } from "@/components/icons";
import { Pagination } from "@/components/Pagination";
import { useStore } from "@/lib/client-store";
import { formatCpu, formatMB, formatNumber } from "@/lib/format";

const PAGE_SIZE = 25;

export function ServersView({ initialOwner }: { initialOwner: number | null }) {
  const { snapshot, usernamesById } = useStore();
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState<string>(initialOwner !== null ? String(initialOwner) : "all");
  const [page, setPage] = useState(0);

  const owners = useMemo(() => {
    const ids = new Set(snapshot!.servers.map((s) => s.ownerId));
    return [...ids]
      .filter((id) => usernamesById.has(id))
      .map((id) => ({ id, name: usernamesById.get(id)! }))
      .sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, [snapshot, usernamesById]);
  const unknownOwners = snapshot!.totals.serversWithUnknownOwner;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return snapshot!.servers.filter((s) => {
      if (owner === "unknown" && usernamesById.has(s.ownerId)) return false;
      if (owner !== "all" && owner !== "unknown" && String(s.ownerId) !== owner) return false;
      if (!term) return true;
      const ownerName = usernamesById.get(s.ownerId)?.toLowerCase() ?? "";
      return (
        s.name.toLowerCase().includes(term) ||
        s.identifier.toLowerCase().includes(term) ||
        String(s.id) === term ||
        ownerName.includes(term)
      );
    });
  }, [snapshot, q, owner, usernamesById]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const ownerCell = (id: number) => {
    const name = usernamesById.get(id);
    if (!name) return <span className="text-amber-200/80">Tidak dikenal (#{id})</span>;
    return (
      <Link href={`/workspace?user=${id}`} className="font-semibold text-blue-200 hover:underline">
        {name}
      </Link>
    );
  };

  return (
    <div className="space-y-3">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <h1 className="mr-2 text-lg font-black">Server</h1>
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-ink-soft">
            Total {formatNumber(snapshot!.totals.servers)}
          </span>
          <div className="relative w-full sm:ml-auto sm:w-72">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Cari nama, identifier, ID, pemilik…"
              aria-label="Cari server"
              className="h-10 w-full rounded-lg border border-line bg-bg/60 pl-9 pr-3 text-sm placeholder:text-ink-mute focus:border-accent/70 focus:outline-none"
            />
          </div>
          <select
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              setPage(0);
            }}
            aria-label="Filter pemilik"
            className="h-10 w-full rounded-lg border border-line bg-bg/60 px-2 text-sm sm:w-56"
          >
            <option value="all">Semua pemilik</option>
            {unknownOwners > 0 && <option value="unknown">Pemilik tidak dikenal ({unknownOwners})</option>}
            {owners.map((o) => (
              <option key={o.id} value={String(o.id)}>
                {o.name} (#{o.id})
              </option>
            ))}
          </select>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-mute">
              <tr className="border-b border-line">
                <th className="px-3 py-2.5 font-semibold">Server</th>
                <th className="px-3 py-2.5 font-semibold">ID</th>
                <th className="px-3 py-2.5 font-semibold">Identifier</th>
                <th className="px-3 py-2.5 font-semibold">Pemilik</th>
                <th className="px-3 py-2.5 text-right font-semibold">Batas RAM</th>
                <th className="px-3 py-2.5 text-right font-semibold">Batas Disk</th>
                <th className="px-3 py-2.5 text-right font-semibold">Batas CPU</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr key={s.id} className="border-b border-line/50 hover:bg-white/[0.03]">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <IconServer size={15} className="shrink-0 text-blue-300" />
                      <span className="max-w-[280px] truncate font-semibold" title={s.name}>
                        {s.name}
                      </span>
                      {s.suspended && (
                        <span className="rounded bg-amber-400/15 px-1.5 text-[10px] font-semibold text-amber-200">Ditangguhkan</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-ink-soft">{s.id}</td>
                  <td className="px-3 py-2 font-mono text-ink-soft">{s.identifier || "-"}</td>
                  <td className="px-3 py-2">{ownerCell(s.ownerId)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMB(s.limits.memory)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMB(s.limits.disk)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCpu(s.limits.cpu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-line/60 md:hidden">
          {pageRows.map((s) => (
            <li key={s.id} className="px-3 py-3">
              <div className="flex items-center gap-2">
                <IconServer size={15} className="shrink-0 text-blue-300" />
                <span className="truncate font-semibold">{s.name}</span>
                {s.suspended && (
                  <span className="rounded bg-amber-400/15 px-1.5 text-[10px] font-semibold text-amber-200">Ditangguhkan</span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-mute">
                ID {s.id} · {s.identifier || "-"}
              </div>
              <div className="mt-1 text-sm">Pemilik: {ownerCell(s.ownerId)}</div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-xs">
                <span className="rounded bg-white/[0.04] px-2 py-1">RAM {formatMB(s.limits.memory)}</span>
                <span className="rounded bg-white/[0.04] px-2 py-1">Disk {formatMB(s.limits.disk)}</span>
                <span className="rounded bg-white/[0.04] px-2 py-1">CPU {formatCpu(s.limits.cpu)}</span>
              </div>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-mute">Tidak ada server yang cocok.</div>}
        <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </section>
      <p className="flex gap-1.5 px-1 text-xs text-ink-mute">
        <IconInfo size={14} className="mt-px shrink-0" />
        RAM, disk, dan CPU adalah batas alokasi dari Application API (0 = tanpa batas; CPU 100% = 1 core). Status daya dan
        pemakaian langsung tidak tersedia melalui PTLA.
      </p>
    </div>
  );
}
