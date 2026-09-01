// 経済の測定台。時間を進めて、水質・満腹度・稼ぎを数える。
//
// テストから使うほか、`node tests/harness.mjs` で表を出せる。
// バランスをいじるときは、まずこれで測ってから数字を決める。

import "./stub.mjs";
import { tickEconomy } from "../src/economy.js";
import { makeDecor, makePet } from "../src/entities.js";
import { makeTank, state } from "../src/state.js";
import { W } from "../src/view.js";

const STEP = 300;                       // 5分刻み。catchUp() と同じ

// spec: { biome, pets: { medaka: 3 }, decor: { airstone: 1 }, dirt, night, full }
export function buildTank(spec = {}) {
  const t = makeTank(spec.biome || "japanFresh");
  t.dirt = spec.dirt ?? 0;
  t.night = !!spec.night;
  for (const [key, n] of Object.entries(spec.pets || {})) {
    for (let i = 0; i < n; i++) t.pets.push(makePet(key, { full: spec.full ?? 1 }, t.pets));
  }
  for (const [key, n] of Object.entries(spec.decor || {})) {
    for (let i = 0; i < n; i++) t.decor.push(makeDecor(key, W * 0.5, {}));
  }
  return t;
}

// tickEconomy は state.tanks 全部を回すので、測りたい水槽だけの世界にする
export function setWorld(t) {
  state.tanks = { [t.biome]: t };
  state.current = t.biome;
  state.coins = 0;
  state.dex = { unlocked: {}, prog: {} };
  state.food.length = 0;
  return t;
}

export function world(spec) {
  return setWorld(buildTank(spec));
}

export function advance(hours) {
  let left = hours * 3600;
  while (left > 0) {
    const dt = Math.min(STEP, left);
    tickEconomy(dt);
    left -= dt;
  }
}

// 水質が0%になるまでの時間。落ちきらなければ Infinity（＝維持できている）
export function hoursToZeroWater(spec, cap = 400) {
  const t = world(spec);
  let sec = 0;
  while (t.dirt < 1 && sec < cap * 3600) {
    tickEconomy(STEP);
    sec += STEP;
  }
  return t.dirt >= 1 ? sec / 3600 : Infinity;
}

// 指定時間ほうっておいたあとの状態
export function after(spec, hours) {
  const t = world(spec);
  advance(hours);
  return {
    tank: t,
    water: 1 - t.dirt,
    coins: state.coins,
    minFull: t.pets.length ? Math.min(...t.pets.map(p => p.full)) : 1,
    avgFull: t.pets.length ? t.pets.reduce((s, p) => s + p.full, 0) / t.pets.length : 1
  };
}

/* ------------------------------------------------------------------ *
 * node tests/harness.mjs で表を出す
 * ------------------------------------------------------------------ */

const CASES = [
  ["メダカ1匹", { pets: { medaka: 1 } }],
  ["メダカ3匹", { pets: { medaka: 3 } }],
  ["メダカ3 + 石巻貝1", { pets: { medaka: 3, snail: 1 } }],
  ["メダカ3 + 貝2 + エア1", { pets: { medaka: 3, snail: 2 }, decor: { airstone: 1 } }],
  ["石巻貝1匹だけ", { pets: { snail: 1 } }],
  ["金魚3匹", { pets: { goldfish: 3 } }],
  ["エンゼル3匹", { pets: { angel: 3 }, biome: "tropical" }],
  ["小型16匹（満室）", { pets: { medaka: 16 } }],
  ["メダカ3（夜）", { pets: { medaka: 3 }, night: true }]
];

function fmt(h) {
  return h === Infinity ? "維持" : h.toFixed(1) + "h";
}

if (import.meta.url === "file://" + process.argv[1]) {
  console.log("水質が0%になるまで / 24時間後の満腹・稼ぎ\n");
  console.log("  " + "水槽の中身".padEnd(24) + "0%まで   24h後の満腹  24h後のコイン");
  for (const [label, spec] of CASES) {
    const zero = hoursToZeroWater(spec);
    const a = after(spec, 24);
    console.log("  " + label.padEnd(24)
      + fmt(zero).padStart(6)
      + (Math.round(a.avgFull * 100) + "%").padStart(12)
      + Math.round(a.coins).toString().padStart(14));
  }
}
