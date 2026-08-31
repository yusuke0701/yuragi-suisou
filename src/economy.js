// 満腹度・水質・コイン・図鑑の解放。

import { DECOR, SPECIES, UNLOCKS, homeBiome } from "./catalogue.js";
import { load, state, tank } from "./state.js";
import { clamp, moodOf, toast } from "./util.js";

// 解放されたことを UI に伝える口。economy が UI を直接知らないようにする
export let onUnlock = () => {};
function setUnlockHandler(fn) { onUnlock = fn; }

export function rateOf(t) {                        // coins per minute from one tank
  let sum = 0;
  for (const p of t.pets) sum += SPECIES[p.key].rate;
  return sum * moodOf(t);
}

export function cleanPowerOf(t) {
  let c = 0;
  for (const p of t.pets) c += SPECIES[p.key].clean || 0;
  for (const d of t.decor) c += DECOR[d.key].clean || 0;
  return c;
}

export function totalRate() {
  let r = 0;
  for (const key in state.tanks) r += rateOf(state.tanks[key]);
  return r;
}

export function needsCare(t) {
  return t.dirt > 0.55 || t.pets.some(p => p.full < 0.25);
}

export const happiness = () => moodOf(tank);

export const coinRate = () => rateOf(tank);

export function unlockSpecies(key) {
  if (state.dex.unlocked[key]) return;
  state.dex.unlocked[key] = true;
  toast(SPECIES[key].name + "が 解放された");
  onUnlock(key);
}

// 条件の文言。時間がかかるものは、かかることを明示する。
export function unlockHint(key) {
  const u = UNLOCKS[key];
  if (!u) return "";
  if (!u.need) return u.hint;
  return u.hint + "（あわせて" + Math.round(u.need / 3600) + "時間）";
}

export function unlockProgress(key) {
  const u = UNLOCKS[key];
  if (!u) return 1;
  if (state.dex.unlocked[key]) return 1;
  if (!u.need) {
    const t = state.tanks[homeBiome(key)];
    return t && u.holds(t) ? 1 : 0;
  }
  return clamp((state.dex.prog[key] || 0) / u.need, 0, 1);
}

export function tickUnlocks(dt) {
  for (const key in UNLOCKS) {
    if (state.dex.unlocked[key]) continue;
    const home = state.tanks[homeBiome(key)];
    if (!home) continue;
    const u = UNLOCKS[key];
    if (!u.holds(home)) continue;
    if (!u.need) { unlockSpecies(key); continue; }
    state.dex.prog[key] = (state.dex.prog[key] || 0) + dt;
    if (state.dex.prog[key] >= u.need) unlockSpecies(key);
  }
}

// 留守ぶんは細かく刻んで進める。まとめて1回で進めると、解放条件の判定が
// 「空腹になりきった最後の状態」しか見ず、留守中ずっと満たしていた時間が消える。
export function catchUp(elapsed) {
  const STEP = 300;                       // 5分刻み
  let left = elapsed, earnedBefore = state.coins;
  while (left > 0) {
    const dt = Math.min(STEP, left);
    tickEconomy(dt);
    left -= dt;
  }
  const got = Math.floor(state.coins - earnedBefore);
  if (got > 3) setTimeout(() => toast("るすばん中に " + got + " コインたまった"), 500);
}

export function tickEconomy(dt) {
  const hungerRate = 1 / (5 * 3600);
  let earned = 0;

  for (const key in state.tanks) {
    const t = state.tanks[key];
    for (const p of t.pets) {
      let full = p.full - hungerRate * dt;
      // Cleaners graze on algae and biofilm rather than waiting for pellets,
      // and they eat better the dirtier the tank is.
      const clean = SPECIES[p.key].clean;
      if (clean) full += clean * (0.55 + t.dirt * 1.1) / 3600 * dt;
      p.full = clamp(full, 0, 1);
    }
    const load = t.pets.length * 0.0000055 * (t.night ? 0.5 : 1);
    const scrub = cleanPowerOf(t) * 0.0000042;
    t.dirt = clamp(t.dirt + (load - scrub) * dt, 0, 1);
    earned += rateOf(t) / 60 * dt;
  }

  state.coins += earned;
  tickUnlocks(dt);

}
