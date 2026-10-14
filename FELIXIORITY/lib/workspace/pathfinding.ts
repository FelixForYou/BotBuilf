import { COLS, ROWS, isWalkable } from "./layout";

export type Tile = [number, number];

/**
 * A* 4-arah pada grid ruangan (32×22, murah).
 * `blocked(tx, ty)` menambah penghalang dinamis (mis. karakter lain).
 * Goal tidak diperiksa terhadap `blocked` (mis. kursi milik sendiri).
 */
export function findPath(
  start: Tile,
  goal: Tile,
  blocked: (tx: number, ty: number) => boolean = () => false,
  maxNodes = 1500,
): Tile[] | null {
  const [sx, sy] = start;
  const [gx, gy] = goal;
  if (sx === gx && sy === gy) return [];
  const idx = (x: number, y: number) => y * COLS + x;
  const open: number[] = [idx(sx, sy)];
  const g = new Float64Array(COLS * ROWS).fill(Infinity);
  const f = new Float64Array(COLS * ROWS).fill(Infinity);
  const came = new Int32Array(COLS * ROWS).fill(-1);
  const closed = new Uint8Array(COLS * ROWS);
  g[idx(sx, sy)] = 0;
  f[idx(sx, sy)] = Math.abs(gx - sx) + Math.abs(gy - sy);
  let expanded = 0;
  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (open.length && expanded < maxNodes) {
    // ambil f terkecil (open list kecil → linear cukup)
    let best = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[best]]) best = i;
    const cur = open.splice(best, 1)[0];
    const cx = cur % COLS;
    const cy = (cur - cx) / COLS;
    if (cx === gx && cy === gy) {
      const path: Tile[] = [];
      let n = cur;
      while (n !== idx(sx, sy)) {
        const x = n % COLS;
        path.push([x, (n - x) / COLS]);
        n = came[n];
      }
      return path.reverse();
    }
    closed[cur] = 1;
    expanded++;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = idx(nx, ny);
      if (closed[ni]) continue;
      if (!isWalkable(nx, ny)) continue;
      if (!(nx === gx && ny === gy) && blocked(nx, ny)) continue;
      const tentative = g[cur] + 1;
      if (tentative < g[ni]) {
        came[ni] = cur;
        g[ni] = tentative;
        f[ni] = tentative + Math.abs(gx - nx) + Math.abs(gy - ny);
        if (!open.includes(ni)) open.push(ni);
      }
    }
  }
  return null;
}
