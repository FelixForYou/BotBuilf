import { buildTerrain, buildProps, buildMapImage } from './chunkGen';

type Req = { id: number; kind: 'map'; size: number } | { id: number; kind: 'terrain'; cx: number; cz: number; segs: number } | { id: number; kind: 'props'; cx: number; cz: number; density: number };

self.onmessage = (ev: MessageEvent<Req>) => {
  const r = ev.data;
  if (r.kind === 'map') {
    const img = buildMapImage(r.size);
    (self as unknown as Worker).postMessage({ id: r.id, data: img }, [img.buffer]);
  } else if (r.kind === 'terrain') {
    const d = buildTerrain(r.cx, r.cz, r.segs);
    (self as unknown as Worker).postMessage({ id: r.id, data: d }, [d.positions.buffer, d.colors.buffer, d.index.buffer]);
  } else {
    const d = buildProps(r.cx, r.cz, r.density);
    const transfers: ArrayBuffer[] = [d.perches.buffer as ArrayBuffer, d.pickups.buffer as ArrayBuffer, d.colliders.buffer as ArrayBuffer];
    for (const k in d.mats) transfers.push(d.mats[k].buffer as ArrayBuffer, d.tints[k].buffer as ArrayBuffer);
    (self as unknown as Worker).postMessage({ id: r.id, data: d }, transfers);
  }
};
