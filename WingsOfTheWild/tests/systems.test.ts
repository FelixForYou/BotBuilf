import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Player } from '../src/player/player';
import { SPECIES } from '../src/gameplay/species';
import { Progress, xpToNext } from '../src/gameplay/progress';
import { Skills } from '../src/gameplay/skills';
import { encodeBits, decodeBits, newSave } from '../src/save/save';
import type { Input } from '../src/core/input';
import type { World } from '../src/world/world';

// Dunia datar sederhana untuk menguji model terbang tanpa WebGL.
function flatWorld(ground = 0): World {
  return {
    sky: { windDir: new THREE.Vector2(1, 0), windStrength: 0 },
    height: () => ground,
    waterAt: () => -Infinity,
    surfaceAt: () => ground,
    updraftAt: () => 0,
    collide: () => ({ ground: false, hit: false, normal: new THREE.Vector3() }),
    outOfBounds: () => false,
  } as unknown as World;
}
function input(over: Partial<Input> = {}): Input {
  return { turn: 0, forward: 0, ascend: false, descend: false, glide: false, mouseYaw: 0, ...over } as Input;
}
function bird() {
  const p = new Player();
  p.setSpecies(SPECIES[0], { stamina: 0, glide: 0, agility: 0, vision: 0, carry: 0 });
  p.pos.set(0, 100, 0);
  return p;
}
const run = (p: Player, inp: Input, w: World, secs: number) => { for (let t = 0; t < secs; t += 1 / 60) p.update(1 / 60, inp, w); };

describe('model terbang', () => {
  const w = flatWorld();
  it('meluncur turun perlahan & menghemat stamina', () => {
    const p = bird(); p.stamina = 50;
    run(p, input({ glide: true }), w, 5);
    expect(p.pos.y).toBeGreaterThan(85);
    expect(p.pos.y).toBeLessThan(100);
    expect(p.stamina).toBeGreaterThan(50);
  });
  it('mengepak menambah ketinggian dan memakai stamina', () => {
    const p = bird(); p.relaxed = false;
    run(p, input({ ascend: true }), w, 3);
    expect(p.pos.y).toBeGreaterThan(110);
    expect(p.stamina).toBeLessThan(p.maxStamina);
  });
  it('menukik menambah kecepatan, lalu momentum bisa diubah jadi ketinggian', () => {
    const p = bird(); p.pos.y = 300;
    run(p, input({ descend: true }), w, 3);
    expect(p.speed).toBeGreaterThan(30);
    const y0 = p.pos.y;
    run(p, input({ ascend: true }), w, 1.2);
    expect(p.pos.y).toBeGreaterThan(y0 + 10);
  });
  it('mengerem lalu menyentuh tanah = mendarat', () => {
    const p = bird(); p.pos.y = 6;
    run(p, input({ forward: -1 }), w, 6);
    expect(p.mode).toBe('ground');
    run(p, input({ ascend: true }), w, 0.2);
    expect(p.mode).toBe('fly');
  });
  it('stamina habis = tidak bisa mengepak', () => {
    const p = bird(); p.relaxed = false; p.stamina = 1;
    run(p, input({ ascend: true }), w, 2);
    expect(p.exhausted).toBe(true);
    expect(p.flapping).toBe(false);
  });
  it('Wind Dash memberi lonjakan kecepatan', () => {
    const p = bird();
    const s0 = p.speed;
    p.dash();
    expect(p.speed).toBeGreaterThan(s0 + 15);
  });
});

describe('progres & skill', () => {
  it('XP menaikkan level & memberi poin skill', () => {
    const pr = new Progress();
    pr.addXp(xpToNext(1) + 5);
    expect(pr.level).toBe(2);
    expect(pr.skillPoints).toBe(1);
  });
  it('eksplorasi menandai sel & bisa disimpan/dimuat', () => {
    const pr = new Progress();
    expect(pr.explore(0, 0, 1)).toBe(9);
    expect(pr.explore(0, 0, 1)).toBe(0);
    const s = encodeBits(pr.explored);
    const back = decodeBits(s, pr.explored.length);
    expect(Array.from(back)).toEqual(Array.from(pr.explored));
  });
  it('cooldown skill berjalan & bergantung level', () => {
    const sk = new Skills();
    sk.trigger('dash');
    expect(sk.ready('dash')).toBe(false);
    sk.update(6.1);
    expect(sk.ready('dash')).toBe(true);
    sk.levels.dash = 3;
    expect(sk.maxCd('dash')).toBe(4);
  });
  it('save baru valid', () => {
    const s = newSave('petualangan', 'pipit', SPECIES[0].colors);
    expect(JSON.parse(JSON.stringify(s)).mode).toBe('petualangan');
  });
});
