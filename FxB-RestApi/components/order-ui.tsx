import { Badge } from "./ui";

export const ORDER_STATUS: Record<string, { label: string; tone: "mint" | "warn" | "danger" | "neutral" }> = {
  pending: { label: "Menunggu bayar", tone: "warn" },
  paid: { label: "Lunas", tone: "mint" },
  expired: { label: "Kedaluwarsa", tone: "neutral" },
  cancelled: { label: "Dibatalkan", tone: "neutral" },
  failed: { label: "Gagal", tone: "danger" },
};

export function OrderBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
