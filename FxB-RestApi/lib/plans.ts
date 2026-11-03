import { int, str } from "./http";

export function parsePlan(b: Record<string, unknown>) {
  return {
    name: str(b.name, "Nama paket", { min: 2, max: 40 }),
    description: str(b.description, "Deskripsi", { max: 200, required: false }),
    price: int(b.price, "Harga", 1000, 100_000_000),
    duration_days: int(b.duration_days, "Masa aktif", 1, 3650),
    daily_limit: int(b.daily_limit, "Limit harian", 1, 10_000_000),
    rpm_limit: int(b.rpm_limit, "Limit per menit", 1, 100_000),
    rank: int(b.rank ?? 1, "Level", 1, 100),
    sort: int(b.sort ?? 0, "Urutan", 0, 1000),
    active: b.active === false ? 0 : 1,
  };
}
