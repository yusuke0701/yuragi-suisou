// 起動、リサイズ、毎フレームのループ。

import { drawScene } from "./draw/scene.js";
import { catchUp, tickEconomy } from "./economy.js";
import { makeDecor, makePet } from "./entities.js";
import { bubbles, updateAmbient, updateFood, updatePet } from "./sim.js";
import { load, save, state, tank } from "./state.js";
import { syncHud } from "./ui/chrome.js";
import { syncTankChrome, tankBox, wireInteractions } from "./ui/interact.js";
import { showHint } from "./util.js";
import { H, W, advanceTime, canvas, ctx, setSize } from "./view.js";

function resize() {
  const box = document.getElementById("tankBox");
  const rect = box.getBoundingClientRect();
  const nw = Math.max(240, rect.width);
  const nh = Math.max(160, rect.height);
  const sx = W ? nw / W : 1, sy = H ? nh / H : 1;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(nw * dpr);
  canvas.height = Math.round(nh * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  for (const p of tank.pets) { p.x *= sx; p.y *= sy; }
  for (const d of tank.decor) d.x *= sx;
  for (const f of state.food) { f.x *= sx; f.y *= sy; }
  for (const b of bubbles) { b.x *= sx; b.y *= sy; }

  setSize(nw, nh);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  advanceTime(dt);

  tickEconomy(dt);
  for (const p of tank.pets) updatePet(p, dt);
  updateFood(dt);
  updateAmbient(dt);
  drawScene();
  requestAnimationFrame(frame);
}

/* ---- boot ---- */

resize();
try { localStorage.removeItem("yuragi.aquarium.v1"); } catch (e) { /* private mode */ }

const elapsed = load();                       // -1 なら新規、そうでなければ留守の秒数
if (elapsed < 0) {
  tank.pets.push(makePet("medaka", {}, tank.pets));
  tank.decor.push(makeDecor("plant", W * 0.24, {}));
  setTimeout(() => showHint("魚をタップすると名前をつけられる", 5200), 900);
} else if (elapsed > 20) {
  catchUp(elapsed);
}

wireInteractions();
syncTankChrome();

new ResizeObserver(() => resize()).observe(document.getElementById("tankBox"));
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

syncHud();
setInterval(syncHud, 500);
setInterval(save, 15000);
requestAnimationFrame(frame);
