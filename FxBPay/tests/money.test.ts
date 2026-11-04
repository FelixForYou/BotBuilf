import { describe, expect, it } from "vitest";
import { computeFee, formatRupiah, fromDanaValue, parseRupiah, toDanaValue } from "@/lib/money";

describe("money", () => {
  it("memakai bigint & format DANA", () => {
    expect(toDanaValue(10000n)).toBe("10000.00");
    expect(fromDanaValue("10000.00")).toBe(10000n);
    expect(() => fromDanaValue("10000.50")).toThrow();
    expect(parseRupiah("Rp 1.250.000")).toBe(1250000n);
    expect(() => parseRupiah(1.5)).toThrow();
    expect(formatRupiah(1250000n)).toBe("Rp1.250.000");
  });
  it("biaya dibulatkan ke atas tanpa float", () => {
    expect(computeFee(100_000n, { flat: 0n, bps: 70 })).toBe(700n);
    expect(computeFee(100_001n, { flat: 0n, bps: 70 })).toBe(701n);
    expect(computeFee(10_000n, { flat: 0n, bps: 70, min: 500n })).toBe(500n);
  });
});
