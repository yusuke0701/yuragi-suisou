// 生きものとかざりの生成。

import { NAME_POOL, SPECIES } from "./catalogue.js";
import { state, tank } from "./state.js";
import { clamp, pick, rnd } from "./util.js";
import { DECOR_MAX, DECOR_MIN, W, sandBase, sandTop, waterTop } from "./view.js";

export function freshName(pets) {
  const used = new Set(pets.map(p => p.name));
  const free = NAME_POOL.filter(n => !used.has(n));
  return free.length ? pick(free) : pick(NAME_POOL) + Math.floor(rnd(2, 99));
}

export function makePet(key, opts, tankPets = []) {
  const s = SPECIES[key];
  const o = opts || {};
  const p = {
    id: o.id != null ? o.id : state.nextId++,
    key,
    name: o.name || freshName(tankPets),
    full: o.full != null ? o.full : 0.85,
    x: o.x != null ? o.x : rnd(W * 0.2, W * 0.8),
    y: o.y != null ? o.y : rnd(waterTop() + 30, sandTop() - 20),
    vx: rnd(-18, 18) || 12,
    vy: 0,
    phase: rnd(0, 7),
    wander: rnd(0, 7),
    steerT: rnd(0, 2),
    dartT: rnd(1, 5),
    scale: rnd(0.9, 1.12)
  };
  if (o.id != null && o.id >= state.nextId) state.nextId = o.id + 1;
  if (s.kind !== "fish" || s.bottom) p.y = sandTop() - rnd(2, 14);
  if (s.kind === "eel") {
    p.y = sandBase(p.x);
    p.vx = 0;
    p.ext = 0.15;          // how far out of the sand, 0..1
    p.lean = 0;            // head reaching sideways for food
    p.shy = 0;             // seconds left hiding after a scare
  }
  return p;
}

// garden eels look best spaced out, so a new one picks the emptiest patch of sand

export function freeEelX(pets) {
  const eels = tank.pets.filter(p => SPECIES[p.key].kind === "eel");
  if (!eels.length) return rnd(W * 0.15, W * 0.85);
  let bestX = W * 0.5, bestD = -1;
  for (let i = 0; i < 30; i++) {
    const x = rnd(W * 0.1, W * 0.9);
    let d = Infinity;
    for (const e of eels) d = Math.min(d, Math.abs(e.x - x));
    if (d > bestD) { bestD = d; bestX = x; }
  }
  return bestX;
}

export function makeDecor(key, x, opts) {
  const o = opts || {};
  return {
    id: o.id != null ? o.id : state.nextId++,
    key,
    x: clamp(x, W * 0.05, W * 0.95),
    flip: o.flip != null ? o.flip : (Math.random() < 0.5 ? -1 : 1),
    seed: o.seed != null ? o.seed : Math.floor(Math.random() * 1e6),
    scale: clamp(Number(o.scale) || 1, DECOR_MIN, DECOR_MAX)
  };
}

// one scale for the whole tank, so a narrow phone screen does not get giant fish
