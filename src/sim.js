// 毎フレームの挙動。餌・泡・生きものの動き。

import { SPECIES } from "./catalogue.js";
import { state, tank } from "./state.js";
import { setFeedMode } from "./ui/interact.js";
import { REDUCED, clamp, lerp, rnd } from "./util.js";
import { H, W, decorPx, petPx, sandBase, sandTop, time, waterTop } from "./view.js";

export const sparks = [];

export const bubbles = [];

export const BUBBLE_MAX = 260;

// えさモードは sim と ui の両方が触るので、束縛ではなく器に入れる
export const feed = { on: false, timer: 0 };

export const fx = { clean: 0 };

export function nearestFood(p, reach) {
  let best = null, bd = reach * reach;
  for (const f of state.food) {
    const dx = f.x - p.x, dy = f.y - p.y;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

export function nearestFoodAt(x, y, reach) {
  let best = null, bd = reach * reach;
  for (const f of state.food) {
    const dx = f.x - x, dy = f.y - y;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

export function updatePet(p, dt) {
  const s = SPECIES[p.key];
  const px = petPx(p);
  const top = waterTop() + px * 0.6;
  const floor = sandTop() - px * 0.18;
  const slow = tank.night ? 0.45 : 1;

  if (s.kind === "snail") {
    p.steerT -= dt;
    const morsel = p.full < 0.95 ? nearestFood(p, px * 5) : null;
    if (morsel) {
      // creeping toward it, in the only way a snail knows
      p.vx = lerp(p.vx, Math.sign(morsel.x - p.x) * 6, 1 - Math.pow(0.2, dt));
      p.steerT = rnd(2, 5);
    } else if (p.steerT <= 0) {
      p.steerT = rnd(3, 8);
      p.vx = rnd(-4, 4) || 3;
    }
    p.x += p.vx * dt * slow;
    if (p.x < px * 0.6 || p.x > W - px * 0.6) { p.vx *= -1; p.x = clamp(p.x, px * 0.6, W - px * 0.6); }
    p.y = sandTop() - px * 0.18;
    p.phase += dt * 2;
    tryEat(p, px * 0.8);
    return;
  }

  if (s.kind === "eel") {
    updateEel(p, dt, px);
    return;
  }

  const hungry = p.full < 0.9;
  const food = hungry ? nearestFood(p, s.kind === "shrimp" ? W * 0.35 : W * 0.9) : null;

  if (s.kind === "shrimp") {
    p.phase += dt * 6;
    p.steerT -= dt;
    let targetX = null;
    if (food) targetX = food.x;
    else if (p.steerT <= 0) { p.steerT = rnd(1.4, 4); p.vx = rnd(-16, 16) || 10; }
    if (targetX != null) {
      const dir = Math.sign(targetX - p.x) || 1;
      p.vx = lerp(p.vx, dir * 26, 1 - Math.pow(0.001, dt));
    }
    p.x += p.vx * dt * slow;
    if (p.x < px * 0.7) { p.x = px * 0.7; p.vx = Math.abs(p.vx); }
    if (p.x > W - px * 0.7) { p.x = W - px * 0.7; p.vx = -Math.abs(p.vx); }
    p.y = lerp(p.y, sandTop() - px * 0.2, 1 - Math.pow(0.01, dt));
    tryEat(p, px * 0.8);
    return;
  }

  // fish steering
  let dax, day;
  if (food) {
    dax = food.x - p.x;
    day = food.y - p.y;
  } else {
    p.steerT -= dt;
    if (p.steerT <= 0) {
      p.steerT = rnd(1.2, 3.4);
      p.wander = rnd(0, Math.PI * 2);
    }
    dax = Math.cos(p.wander);
    day = Math.sin(p.wander) * 0.35 + Math.sin(time * 0.6 + p.id) * 0.12;
    if (s.bottom) day += (floor - 6 - p.y) * 0.02;
  }

  // walls push inward
  const margin = px * 1.1;
  if (p.x < margin) dax += (margin - p.x) * 0.12;
  if (p.x > W - margin) dax -= (p.x - (W - margin)) * 0.12;
  if (p.y < top + 8) day += (top + 8 - p.y) * 0.16;
  if (p.y > floor - 6) day -= (p.y - (floor - 6)) * 0.16;

  const len = Math.hypot(dax, day) || 1;
  const base = (s.bottom ? 20 : 27) * (food ? 2.1 : 1) * slow * lerp(0.55, 1, p.full * 0.6 + 0.4);
  const wantX = dax / len * base;
  const wantY = day / len * base * 0.8;
  const k = 1 - Math.pow(0.02, dt);
  p.vx = lerp(p.vx, wantX, k);
  p.vy = lerp(p.vy, wantY, k);

  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = clamp(p.x, px * 0.55, W - px * 0.55);
  p.y = clamp(p.y, top, floor);

  const speed = Math.hypot(p.vx, p.vy);
  p.phase += dt * (3 + speed * 0.16);

  tryEat(p, px * 0.6);
}

// garden eels stay in their burrow: they sway, lean after drifting food,
// and duck back into the sand when something startles them.

export function updateEel(p, dt, px) {
  p.x = clamp(p.x, px * 0.3, W - px * 0.3);
  p.y = sandBase(p.x);
  p.phase += dt * (tank.night ? 0.5 : 1.05);
  if (p.shy > 0) p.shy -= dt;

  let target = 1;
  if (tank.night) target = 0.1;
  if (p.shy > 0) target = Math.min(target, 0.14);

  // a fish swimming right past makes them shrink back a little
  for (const o of tank.pets) {
    if (o === p || SPECIES[o.key].kind !== "fish") continue;
    const oL = petPx(o);
    if (oL < px * 0.5) continue;
    if (Math.hypot(o.x - p.x, o.y - (p.y - px * p.ext * 0.7)) < px * 0.6) {
      target = Math.min(target, 0.4);
      break;
    }
  }

  p.ext = lerp(p.ext, target, 1 - Math.pow(p.ext > target ? 0.0004 : 0.35, dt));

  const headY = p.y - px * p.ext;
  const food = p.full < 0.95 ? nearestFoodAt(p.x, headY, px * 1.7) : null;
  const want = food ? clamp((food.x - p.x) / (px * 0.5), -1, 1) : 0;
  p.lean = lerp(p.lean, want, 1 - Math.pow(0.06, dt));

  if (p.ext > 0.5) tryEat(p, px * 0.42, eelHeadX(p, px), headY);
}

export function eelHeadX(p, px) {
  return p.x + (Math.sin(p.phase + 2.3) * px * 0.13 * (1 - Math.abs(p.lean) * 0.6)
                + p.lean * px * 0.42) * p.ext;
}

export function tryEat(p, reach, hx, hy) {
  if (p.full >= 1) return;
  const ax = hx != null ? hx : p.x;
  const ay = hy != null ? hy : p.y;
  for (let i = state.food.length - 1; i >= 0; i--) {
    const f = state.food[i];
    if (Math.hypot(f.x - ax, f.y - ay) < reach) {
      state.food.splice(i, 1);
      p.full = clamp(p.full + 0.3, 0, 1);
      for (let j = 0; j < 4; j++) {
        sparks.push({ x: f.x, y: f.y, vx: rnd(-22, 22), vy: rnd(-22, 6), life: 0.6, max: 0.6 });
      }
      return;
    }
  }
}

export function updateFood(dt) {
  const floor = sandTop();
  for (let i = state.food.length - 1; i >= 0; i--) {
    const f = state.food[i];
    f.age += dt;
    if (f.y < floor - 2) {
      f.y += 26 * dt;
      f.x += Math.sin(time * 1.6 + f.seed) * 5 * dt;
    } else {
      f.rest += dt;
      if (f.rest > 26) {
        state.food.splice(i, 1);
        tank.dirt = clamp(tank.dirt + 0.012, 0, 1);
      }
    }
  }
}

export function sprinkle(x, y) {
  if (state.food.length > 44) return;
  const n = 5;
  for (let i = 0; i < n; i++) {
    state.food.push({
      x: clamp(x + rnd(-16, 16), 8, W - 8),
      y: Math.max(waterTop() + 3, (y != null ? y - rnd(0, 20) : waterTop() + 6)),
      age: 0, rest: 0, seed: rnd(0, 10)
    });
  }
}

export function updateAmbient(dt) {
  // spark particles
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt;
    s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 14 * dt;
    if (s.life <= 0) sparks.splice(i, 1);
  }

  // Bubbles: every airstone gets its own budget. A single shared cap would let
  // whichever stone comes first in the list grab each freed slot.
  const stones = tank.decor.filter(d => d.key === "airstone");
  updateAmbient.acc = (updateAmbient.acc || 0) + dt;
  if (updateAmbient.acc > 0.09) {
    updateAmbient.acc = 0;

    if (stones.length) {
      const perStone = clamp(Math.floor(BUBBLE_MAX / stones.length), 26, 130);
      const mine = new Map();
      for (const b of bubbles) {
        if (b.src != null) mine.set(b.src, (mine.get(b.src) || 0) + 1);
      }
      for (const st of stones) {
        if ((mine.get(st.id) || 0) >= perStone) continue;
        const w = decorPx(st);
        bubbles.push({
          src: st.id,
          x: st.x + rnd(-w * 0.3, w * 0.3),
          y: sandBase(st.x) - w * 0.34,
          r: rnd(1.6, 3.6) * clamp(st.scale || 1, 0.75, 1.4),
          sp: rnd(28, 52),
          seed: rnd(0, 10)
        });
      }
    }

    const ambient = bubbles.reduce((n, b) => n + (b.src == null ? 1 : 0), 0);
    if (!REDUCED && ambient < 12 && Math.random() < 0.06) {
      bubbles.push({ x: rnd(10, W - 10), y: sandTop() - rnd(0, H * 0.3), r: rnd(1, 2.2), sp: rnd(16, 30), seed: rnd(0, 10) });
    }
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.sp * dt;
    b.x += Math.sin(time * 2.2 + b.seed) * 7 * dt;
    if (b.y < waterTop() + 2) bubbles.splice(i, 1);
  }

  if (fx.clean > 0) fx.clean = Math.max(0, fx.clean - dt);
  if (feed.on) {
    feed.timer -= dt;
    if (feed.timer <= 0) setFeedMode(false);
  }
}
