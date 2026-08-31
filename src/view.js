// 画面の寸法と、水槽内の座標系。

import { DECOR, SPECIES } from "./catalogue.js";
import { tank } from "./state.js";
import { clamp } from "./util.js";

export const canvas = document.getElementById("tank");

export const ctx = canvas.getContext("2d");

export let W = 800, H = 420;

export let time = 0;

export function setSize(w, h) { W = w; H = h; }

export function advanceTime(dt) { time += dt; }

export function waterTop() { return H * 0.05; }

export function sandTop()  { return H * 0.80; }

export function sandBase(x) { return sandTop() + 4 + Math.sin(x * 0.006) * 3; }

export function tankScale() {
  return clamp(Math.min(W / 820, H / 460), 0.68, 1.5);
}

export function petPx(p) {
  return SPECIES[p.key].size * p.scale * tankScale();
}

export function decorPx(d) {
  return DECOR[d.key].size * tankScale() * 1.05 * (d.scale || 1);
}

export const DECOR_MIN = 0.5, DECOR_MAX = 2;
