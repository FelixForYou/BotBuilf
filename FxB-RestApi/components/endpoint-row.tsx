"use client";

import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import type { EndpointPublic } from "@/lib/catalog-types";
import { cx } from "./ui";

export function MethodBadge({ m }: { m: string }) {
  return <span className={cx("inline-flex h-6 min-w-[46px] items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold", m === "GET" ? "bg-mint-soft text-mint" : "bg-warn-soft text-warn")}>{m}</span>;
}

export function StatusDot({ s }: { s: EndpointPublic["status"] }) {
  return <span title={s} className={cx("inline-block size-2 shrink-0 rounded-full", s === "online" ? "bg-mint" : s === "maintenance" ? "bg-warn" : "bg-subtle")} />;
}

export function EndpointRow({ ep }: { ep: EndpointPublic }) {
  return (
    <Link href={`/docs/${ep.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-card-2 active:bg-card-3">
      <MethodBadge m={ep.method} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15.5px] font-medium">{ep.name}</span>
          {ep.tier === "premium" && <Lock className="size-3.5 shrink-0 text-warn" />}
        </div>
        <div className="truncate font-mono text-[12.5px] text-muted">{ep.path}</div>
      </div>
      <StatusDot s={ep.status} />
      <ChevronRight className="size-[18px] shrink-0 text-subtle" />
    </Link>
  );
}
