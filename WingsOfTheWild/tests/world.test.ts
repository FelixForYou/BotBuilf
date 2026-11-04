import { describe, it, expect } from 'vitest';
import { heightAt, biomeAt, waterHeightAt, LAKE, VILLAGE, PEAK, RIVER } from '../src/world/terrain';
import { buildTerrain, buildProps } from '../src/world/chunkGen';

describe('dunia prosedural', () => {
  it('deterministik: tinggi sama untuk koordinat sama', () => {
    for (const [x, z] of [[0, 0], [123.4, -567.8], [-1500, 900]]) expect(heightAt(x, z)).toBe(heightAt(x, z));
    const a = buildTerrain(7, 7, 16), b = buildTerrain(7, 7, 16);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it('memiliki semua wilayah utama', () => {
    expect(biomeAt(LAKE.x, LAKE.z)).toBe('lake');
    expect(biomeAt(VILLAGE.x, VILLAGE.z)).toBe('village');
    expect(['snow', 'mountain']).toContain(biomeAt(PEAK.x, PEAK.z));
    expect(heightAt(PEAK.x, PEAK.z)).toBeGreaterThan(300);
    expect(biomeAt(-1000, -200)).toBe('forest');
    expect(biomeAt(0, 1950)).toBe('sea');
    const seen = new Set<string>();
    for (let x = -2000; x < 2000; x += 40) for (let z = -2000; z < 2000; z += 40) seen.add(biomeAt(x, z));
    for (const b of ['sea', 'beach', 'mountain', 'snow', 'forest', 'meadow', 'flowers', 'lake', 'river', 'village', 'island']) expect(seen.has(b)).toBe(true);
  });

  it('air sungai selalu turun ke hilir dan berada di atas dasar sungai', () => {
    for (const path of RIVER) {
      for (let i = 1; i < path.length; i++) expect(path[i].h).toBeLessThanOrEqual(path[i - 1].h + 1e-6);
      for (let i = 0; i < path.length; i += 7) {
        const p = path[i];
        expect(heightAt(p.x, p.z)).toBeLessThan(p.h);
        expect(waterHeightAt(p.x, p.z)).toBeGreaterThan(-Infinity);
      }
    }
  });

  it('properti chunk berisi pohon, titik bertengger, dan makanan', () => {
    const d = buildProps(4, 8, 1); // hutan barat
    const trees = d.mats.tree.length / 16 + d.mats.pine.length / 16;
    expect(trees).toBeGreaterThan(20);
    expect(d.perches.length / 4).toBeGreaterThan(20);
    expect(d.pickups.length / 4).toBeGreaterThan(3);
  });
});
