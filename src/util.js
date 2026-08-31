// 純粋なユーティリティ。ここは何にも依存しない。

export const SAVE_KEY = "yuragi.aquarium.v2";

export const CAPACITY = 16;

export const DECOR_CAP = 10;

export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

export const lerp = (a, b, t) => a + (b - a) * t;

export const rnd = (a, b) => a + Math.random() * (b - a);

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round(lerp(r, f, p));
  g = Math.round(lerp(g, f, p));
  b = Math.round(lerp(b, f, p));
  return "rgb(" + r + "," + g + "," + b + ")";
}

export function moodOf(t) {
  if (!t.pets.length) return 0;
  let avg = 0;
  for (const p of t.pets) avg += p.full;
  avg /= t.pets.length;
  return clamp(avg * 0.72 + (1 - t.dirt) * 0.28, 0, 1);
}

export function toast(msg) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

export function showHint(msg, ms) {
  const el = document.getElementById("hint");
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(showHint.t);
  if (ms) showHint.t = setTimeout(() => el.classList.remove("is-on"), ms);
}

export function hideHint() {
  document.getElementById("hint").classList.remove("is-on");
}
