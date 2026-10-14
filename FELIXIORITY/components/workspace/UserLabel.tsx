"use client";
// Label username di atas karakter. Dirender React hanya saat roster berubah;
// posisinya diatur langsung oleh engine (transform) setiap frame.
import type { Ref } from "react";
import { IconServer, IconShield } from "@/components/icons";

export function UserLabel({
  username,
  serverCount,
  isAdmin,
  ref,
}: {
  username: string;
  serverCount: number;
  isAdmin: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className="user-label pointer-events-none absolute left-0 top-0 flex items-center gap-1 rounded-md border border-white/10 bg-[#0d1330]/85 py-[2px] pl-1.5 pr-1 text-[10px] font-semibold leading-4 sm:text-[11px] text-ink shadow-md backdrop-blur-sm"
      style={{ visibility: "hidden" }}
    >
      {isAdmin && <IconShield size={11} className="shrink-0 text-violet-300" />}
      <span className="truncate">{username}</span>
      <span
        className="ml-0.5 flex shrink-0 items-center gap-0.5 rounded bg-accent/20 px-1 text-[10px] font-bold text-blue-200"
        title={`${serverCount} server`}
      >
        <IconServer size={10} />
        {serverCount}
      </span>
    </div>
  );
}
