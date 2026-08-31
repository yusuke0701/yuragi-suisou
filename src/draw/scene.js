// 水槽まるごとの描画と、カード用の小さな絵。

import { BIOMES, DECOR, SPECIES } from "../catalogue.js";
import { drawEelShape, drawFishShape, drawPet, drawShrimpShape, drawSnailShape } from "./creatures.js";
import { drawDecor } from "./decor.js";
import { bubbles, fx, sparks } from "../sim.js";
import { save, state, tank } from "../state.js";
import { card } from "../ui/interact.js";
import { clamp, mulberry32 } from "../util.js";
import { H, W, ctx, sandBase, sandTop, time, waterTop } from "../view.js";

export function drawScene() {
  const g = ctx;
  const wt = waterTop(), st = sandTop();
  const night = tank.night;

  g.clearRect(0, 0, W, H);

  // water
  const water = g.createLinearGradient(0, 0, 0, H);
  const bio = BIOMES[tank.biome];
  const wc = night ? bio.waterNight : bio.water;
  water.addColorStop(0, wc[0]);
  water.addColorStop(night ? 0.5 : 0.45, wc[1]);
  water.addColorStop(1, wc[2]);
  g.fillStyle = water;
  g.fillRect(0, 0, W, H);

  // algae tint
  if (tank.dirt > 0.05) {
    g.fillStyle = "rgba(96,140,64," + (tank.dirt * 0.24).toFixed(3) + ")";
    g.fillRect(0, 0, W, H);
  }

  // light rays
  if (!night) {
    g.save();
    g.globalCompositeOperation = "lighter";
    const rayW = [0.030, 0.052, 0.022, 0.044, 0.026];
    for (let i = 0; i < 5; i++) {
      const x = W * (0.10 + i * 0.20) + Math.sin(time * 0.13 + i * 1.7) * W * 0.025;
      const w = W * rayW[i];
      const a = 0.055 + rayW[i] * 1.1;
      const grd = g.createLinearGradient(0, wt, 0, st * 0.96);
      grd.addColorStop(0, "rgba(" + bio.ray + "," + a.toFixed(3) + ")");
      grd.addColorStop(0.55, "rgba(" + bio.ray + "," + (a * 0.4).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(" + bio.ray + ",0)");
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x - w * 0.3, wt);
      g.lineTo(x + w * 0.3, wt);
      g.lineTo(x + w * 1.9, st * 0.98);
      g.lineTo(x - w * 1.4, st * 0.98);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  // sand
  const sand = g.createLinearGradient(0, st - 6, 0, H);
  const sc = night ? bio.sandNight : bio.sand;
  sand.addColorStop(0, sc[0]);
  sand.addColorStop(1, sc[1]);
  g.fillStyle = sand;
  g.beginPath();
  g.moveTo(0, st + 6);
  g.quadraticCurveTo(W * 0.28, st - 8, W * 0.55, st + 2);
  g.quadraticCurveTo(W * 0.82, st + 9, W, st - 3);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.closePath();
  g.fill();

  // pebbles
  const pr = mulberry32(tank.seed);
  g.globalAlpha = night ? 0.3 : 0.45;
  for (let i = 0; i < 42; i++) {
    const x = pr() * W;
    const y = st + 6 + pr() * (H - st - 8);
    const rr = 1 + pr() * 2.6;
    g.fillStyle = pr() > 0.5 ? bio.pebble[0] : bio.pebble[1];
    g.beginPath();
    g.ellipse(x, y, rr, rr * 0.72, 0, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;

  // caustics on the sand
  if (!night) {
    g.save();
    g.globalCompositeOperation = "lighter";
    const cr = mulberry32(tank.seed + 31);
    g.lineCap = "round";
    for (let i = 0; i < 22; i++) {
      const cx = cr() * W;
      const cy = st + 10 + cr() * (H - st - 12);
      const len = 14 + cr() * 46;
      const ph = cr() * 7;
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.9 + ph);
      g.strokeStyle = "rgba(206,244,255," + (0.022 + pulse * 0.042).toFixed(3) + ")";
      g.lineWidth = 1.6 + pulse * 2.2;
      g.beginPath();
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const x = cx - len / 2 + len * t + Math.sin(time * 0.6 + ph) * 4;
        const y = cy + Math.sin(t * 4 + time * 0.8 + ph) * 3.4;
        k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
  }

  // decor sits on the sand line
  for (const d of tank.decor) drawDecor(g, d, sandBase(d.x));

  // food
  g.fillStyle = night ? "#b08a4e" : "#e0a94f";
  for (const f of state.food) {
    g.beginPath();
    g.arc(f.x, f.y, 2.1, 0, 7);
    g.fill();
  }

  // creatures: bottom dwellers first so fish pass in front
  for (const p of tank.pets) if (SPECIES[p.key].kind === "eel") drawPet(g, p);
  for (const p of tank.pets) {
    const k = SPECIES[p.key].kind;
    if (k !== "fish" && k !== "eel") drawPet(g, p);
  }
  for (const p of tank.pets) if (SPECIES[p.key].kind === "fish") drawPet(g, p);

  // sparks
  for (const s of sparks) {
    g.globalAlpha = clamp(s.life / s.max, 0, 1) * 0.8;
    g.fillStyle = "#dff7ff";
    g.beginPath();
    g.arc(s.x, s.y, 1.6, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;

  // bubbles
  g.strokeStyle = "rgba(216,246,255,.42)";
  g.lineWidth = 1;
  for (const b of bubbles) {
    g.beginPath();
    g.arc(b.x, b.y, b.r, 0, 7);
    g.stroke();
  }

  // floating grime
  if (tank.dirt > 0.25) {
    const dr = mulberry32(tank.seed + 7);
    const n = Math.floor(tank.dirt * 40);
    g.fillStyle = "rgba(150,175,110,.42)";
    for (let i = 0; i < n; i++) {
      const bx = dr() * W;
      const by = wt + dr() * (st - wt);
      const drift = Math.sin(time * 0.25 + i) * 8;
      g.beginPath();
      g.arc((bx + drift + W) % W, by + Math.cos(time * 0.2 + i) * 5, 1 + dr() * 1.4, 0, 7);
      g.fill();
    }
  }

  // cleaning sweep
  if (fx.clean > 0) {
    const t = 1 - fx.clean / 0.9;
    const x = t * (W + 160) - 80;
    const grd = g.createLinearGradient(x - 90, 0, x + 90, 0);
    grd.addColorStop(0, "rgba(180,255,240,0)");
    grd.addColorStop(0.5, "rgba(200,255,246,.34)");
    grd.addColorStop(1, "rgba(180,255,240,0)");
    g.fillStyle = grd;
    g.fillRect(x - 90, 0, 180, H);
  }

  // water surface
  g.save();
  const surf = g.createLinearGradient(0, 0, 0, wt + 14);
  surf.addColorStop(0, night ? "rgba(120,180,200,.30)" : "rgba(190,245,255,.42)");
  surf.addColorStop(1, "rgba(190,245,255,0)");
  g.fillStyle = surf;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(W, 0);
  for (let x = W; x >= 0; x -= 10) {
    g.lineTo(x, wt + Math.sin(x * 0.03 + time * 1.3) * 2.2 + Math.sin(x * 0.011 - time * 0.8) * 1.6);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = night ? "rgba(160,215,230,.35)" : "rgba(225,255,255,.55)";
  g.lineWidth = 1.2;
  g.beginPath();
  for (let x = 0; x <= W; x += 10) {
    const y = wt + Math.sin(x * 0.03 + time * 1.3) * 2.2 + Math.sin(x * 0.011 - time * 0.8) * 1.6;
    x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();
  g.restore();

  // night dim
  if (night) {
    g.fillStyle = "rgba(4,12,18,.36)";
    g.fillRect(0, 0, W, H);
  }

  // vignette
  const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.28, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,10,16,.42)");
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
}

/* ------------------------------------------------------------------ *
 * previews (shop cards / inspect card)
 * ------------------------------------------------------------------ */

export function drawPreview(cv, key) {
  const g = cv.getContext("2d");
  const r = window.devicePixelRatio || 1;
  const cw = cv.clientWidth || cv.width, ch = cv.clientHeight || cv.height;
  cv.width = Math.round(cw * r);
  cv.height = Math.round(ch * r);
  g.setTransform(r, 0, 0, r, 0, 0);
  g.clearRect(0, 0, cw, ch);

  if (SPECIES[key]) {
    const s = SPECIES[key];
    let L;
    if (s.kind === "eel") {
      L = Math.min(cw * 0.85, ch * 0.86);
      g.save();
      g.shadowColor = "rgba(0,0,0,.45)";
      g.shadowBlur = 8;
      g.shadowOffsetY = 3;
      g.translate(cw / 2, ch * 0.94);
      drawEelShape(g, s, L, 0.7, 1, 0, 4242, false, 0.5);
      g.restore();
      return;
    }
    if (s.kind === "fish") {
      const hf = s.ratio * (s.tall ? 1.9 : 1.6);
      L = Math.min(cw * 0.62, ch * 0.9 / hf);
    } else if (s.kind === "shrimp") {
      L = Math.min(cw * 0.52, ch * 0.86);
    } else {
      L = Math.min(cw * 0.42, ch * 0.7);
    }
    g.save();
    g.shadowColor = "rgba(0,0,0,.45)";
    g.shadowBlur = 8;
    g.shadowOffsetY = 3;
    g.translate(cw / 2 + L * 0.06, ch / 2 + (s.kind === "fish" ? 0 : ch * 0.08));
    if (s.kind === "fish") drawFishShape(g, s, L, 0.5, false);
    else if (s.kind === "shrimp") drawShrimpShape(g, s, L, 0.6, false);
    else drawSnailShape(g, s, L, 0.5);
    g.restore();
  } else if (DECOR[key]) {
    const fake = { key, x: cw / 2, flip: 1, seed: 12345 };
    const s = Math.min(cw * 0.58, ch * 0.92);
    g.save();
    g.shadowColor = "rgba(0,0,0,.4)";
    g.shadowBlur = 7;
    g.shadowOffsetY = 2;
    drawDecor(g, fake, ch * 0.9, s);
    g.restore();
  }
}
