// 進行状況と、表示中の水槽。セーブもここ。

import { BIOMES, DECOR, SPECIES } from "./catalogue.js";
import { makeDecor, makePet } from "./entities.js";
import { SAVE_KEY, clamp } from "./util.js";
import { H, W } from "./view.js";

export function makeTank(biome, name) {
  return {
    biome,
    name: name || BIOMES[biome].name,
    dirt: 0,
    night: false,
    seed: Math.floor(Math.random() * 1e9),
    pets: [],
    decor: [],
    px: true            // are pets/decor in pixels (active) or normalised (stored)?
  };
}

export const state = {
  coins: 150,
  nextId: 1,
  savedAt: Date.now(),
  current: "japanFresh",
  tanks: { japanFresh: makeTank("japanFresh", "はじめての水槽") },
  dex: { unlocked: {}, prog: {} },
  food: []
};

// the tank on screen; everything else is kept in normalised coordinates

// 表示中の水槽。他は正規化座標のまま眠っている
export let tank = state.tanks.japanFresh;

// いま選ばれているもの。描画側が枠を出すのに読む
export const selection = { type: null, id: null };

export function denormTank(t) {
  if (t.px) return;
  for (const p of t.pets) { p.x *= W; p.y *= H; }
  for (const d of t.decor) d.x *= W;
  t.px = true;
}

export function normTank(t) {
  if (!t.px) return;
  for (const p of t.pets) { p.x /= W; p.y /= H; }
  for (const d of t.decor) d.x /= W;
  t.px = false;
}

// tank の再代入はこのモジュールだけが行う（ES module の live binding）
export function setTank(key) {
  if (!state.tanks[key]) return;
  normTank(tank);
  state.current = key;
  tank = state.tanks[key];
  denormTank(tank);
}

export function save() {
  state.savedAt = Date.now();
  const tanks = {};
  for (const key in state.tanks) {
    const t = state.tanks[key];
    const sx = t.px ? 1 / W : 1, sy = t.px ? 1 / H : 1;
    tanks[key] = {
      name: t.name, dirt: t.dirt, night: t.night, seed: t.seed,
      pets: t.pets.map(p => ({
        id: p.id, key: p.key, name: p.name, full: p.full,
        nx: p.x * sx, ny: p.y * sy
      })),
      decor: t.decor.map(d => ({
        id: d.id, key: d.key, nx: d.x * sx, flip: d.flip, seed: d.seed, sc: d.scale
      }))
    };
  }
  const data = {
    v: 2,
    coins: state.coins,
    nextId: state.nextId,
    savedAt: state.savedAt,
    current: state.current,
    tanks,
    dex: state.dex
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
}

export function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) { data = null; }
  if (!data || data.v !== 2 || !data.tanks) return -1;

  state.coins = Number(data.coins) || 0;
  state.nextId = Number(data.nextId) || 1;
  state.dex = {
    unlocked: (data.dex && data.dex.unlocked) || {},
    prog: (data.dex && data.dex.prog) || {}
  };

  state.tanks = {};
  for (const key in data.tanks) {
    if (!BIOMES[key]) continue;
    const td = data.tanks[key];
    const t = makeTank(key, typeof td.name === "string" ? td.name : null);
    t.dirt = clamp(Number(td.dirt) || 0, 0, 1);
    t.night = !!td.night;
    t.seed = Number(td.seed) || t.seed;
    t.px = false;

    (td.pets || []).forEach(pd => {
      if (!SPECIES[pd.key]) return;
      const p = makePet(pd.key, {
        id: pd.id, name: pd.name, full: clamp(Number(pd.full), 0, 1), x: 0, y: 0
      });
      p.x = clamp(Number(pd.nx) || 0.5, 0.04, 0.96);
      p.y = clamp(Number(pd.ny) || 0.5, 0.06, 0.94);
      t.pets.push(p);
    });
    (td.decor || []).forEach(dd => {
      if (!DECOR[dd.key]) return;
      const d = makeDecor(dd.key, 0, { id: dd.id, flip: dd.flip, seed: dd.seed, scale: dd.sc });
      d.x = clamp(Number(dd.nx) || 0.5, 0.04, 0.96);
      t.decor.push(d);
    });
    state.tanks[key] = t;
  }

  if (!state.tanks.japanFresh) state.tanks.japanFresh = makeTank("japanFresh", "はじめての水槽");
  state.current = state.tanks[data.current] ? data.current : "japanFresh";
  tank = state.tanks[state.current];
  denormTank(tank);

  // 追いつき計算は boot に任せる（economy への循環参照を避けるため）
  return clamp((Date.now() - (Number(data.savedAt) || Date.now())) / 1000, 0, 12 * 3600);
}
