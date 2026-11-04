const TZ = "Asia/Jakarta";
export function fmtDate(d: Date | string | null | undefined, withTime = true): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
}
export function fmtTime(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(typeof d === "string" ? new Date(d) : d);
}
export function relTime(d: Date | string): string {
  const ms = Date.now() - (typeof d === "string" ? new Date(d) : d).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const day = Math.round(h / 24);
  return day < 30 ? `${day} hari lalu` : fmtDate(d, false);
}
export function jakartaDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
