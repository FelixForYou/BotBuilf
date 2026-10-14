import { ROOM_CAPACITY } from "./workspace/layout";

/**
 * Penempatan slot yang lengket: user yang sudah punya slot tetap di slot itu
 * selama sesi halaman. User baru mengisi slot kosong terendah (urut ID).
 * Slot → ruangan = floor(slot / kapasitas), kursi = slot % kapasitas.
 */
export function assignSlots(prev: ReadonlyMap<number, number>, ids: readonly number[]): Map<number, number> {
  const present = new Set(ids);
  const next = new Map<number, number>();
  const used = new Set<number>();
  for (const [id, slot] of prev) {
    if (present.has(id)) {
      next.set(id, slot);
      used.add(slot);
    }
  }
  const newcomers = ids.filter((id) => !next.has(id)).sort((a, b) => a - b);
  let cursor = 0;
  for (const id of newcomers) {
    while (used.has(cursor)) cursor++;
    next.set(id, cursor);
    used.add(cursor);
  }
  return next;
}

export function roomOfSlot(slot: number): number {
  return Math.floor(slot / ROOM_CAPACITY);
}

export function seatOfSlot(slot: number): number {
  return slot % ROOM_CAPACITY;
}

export function roomCount(slots: ReadonlyMap<number, number>): number {
  let max = -1;
  for (const s of slots.values()) if (s > max) max = s;
  return Math.max(1, Math.floor(max / ROOM_CAPACITY) + 1);
}
