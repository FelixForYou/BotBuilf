const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const numFmt = new Intl.NumberFormat("id-ID");

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Tidak diketahui";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Tidak diketahui" : dateFmt.format(d);
}

export function formatTime(ms: number | string | null | undefined): string {
  if (ms == null) return "-";
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "-" : timeFmt.format(d);
}

export function formatNumber(n: number): string {
  return numFmt.format(n);
}

/** Batas alokasi dalam MB dari Application API. 0 = tanpa batas. */
export function formatMB(mb: number | null): string {
  if (mb == null) return "Tidak tersedia";
  if (mb === 0) return "Tanpa batas";
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

/** Batas CPU dalam persen (100% = 1 core). 0 = tanpa batas. */
export function formatCpu(cpu: number | null): string {
  if (cpu == null) return "Tidak tersedia";
  if (cpu === 0) return "Tanpa batas";
  return `${cpu}%`;
}

export function plural(n: number, word: string): string {
  return `${formatNumber(n)} ${word}`;
}
