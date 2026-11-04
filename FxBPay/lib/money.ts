/**
 * Uang = bigint rupiah. IDR tidak memakai sen di FxB Pay; ke DANA dikirim sebagai "10000.00".
 * Tidak ada floating point dalam perhitungan saldo/biaya.
 */
export type Rupiah = bigint;

export const MAX_AMOUNT = 1_000_000_000n; // Rp1 miliar per transaksi (batas keras sistem)

export function parseRupiah(input: unknown): Rupiah {
  if (typeof input === "bigint") return input;
  if (typeof input === "number") {
    if (!Number.isSafeInteger(input)) throw new Error("Nominal harus bilangan bulat rupiah");
    return BigInt(input);
  }
  if (typeof input === "string") {
    const s = input.trim().replace(/[.\s]/g, "").replace(/^Rp/i, "");
    if (!/^-?\d+$/.test(s)) throw new Error("Nominal harus bilangan bulat rupiah");
    return BigInt(s);
  }
  throw new Error("Nominal tidak valid");
}

/** Format "10000.00" untuk field Money DANA. */
export function toDanaValue(v: Rupiah): string {
  return `${v.toString()}.00`;
}

/** Parse Money.value DANA ("10000.00") → bigint, menolak nilai berpecahan sen non-nol. */
export function fromDanaValue(value: string): Rupiah {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) throw new Error(`Format nominal DANA tidak valid: ${value}`);
  if (m[2] && Number(m[2]) !== 0) throw new Error(`Nominal berpecahan tidak didukung: ${value}`);
  return BigInt(m[1]);
}

export function formatRupiah(v: Rupiah | number | string, opts: { sign?: boolean } = {}): string {
  const n = typeof v === "bigint" ? v : BigInt(v);
  const neg = n < 0n;
  const abs = (neg ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = neg ? "−" : opts.sign && n > 0n ? "+" : "";
  return `${sign}Rp${abs}`;
}

/** Biaya = flat + persen (basis poin), dibulatkan ke atas ke rupiah penuh. */
export function computeFee(amount: Rupiah, rule: { flat: Rupiah; bps: number; min?: Rupiah; max?: Rupiah }): Rupiah {
  const pct = (amount * BigInt(rule.bps) + 9999n) / 10000n;
  let fee = rule.flat + pct;
  if (rule.min !== undefined && fee < rule.min) fee = rule.min;
  if (rule.max !== undefined && rule.max > 0n && fee > rule.max) fee = rule.max;
  return fee;
}
