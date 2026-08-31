// タップ・ドラッグ・ボタン・シート類。

import { BIOMES, BIOME_KEYS, DECOR, SPECIES, UNLOCKS, homeBiome, inBiome } from "../catalogue.js";
import { drawPreview } from "../draw/scene.js";
import { needsCare, rateOf, unlockHint, unlockProgress } from "../economy.js";
import { freeEelX, makeDecor, makePet } from "../entities.js";
import { bubbles, feed, fx, sparks, sprinkle } from "../sim.js";
import { denormTank, makeTank, normTank, save, selection, state, tank } from "../state.js";
import { el, syncHud } from "./chrome.js";
import { CAPACITY, DECOR_CAP, SAVE_KEY, clamp, hideHint, rnd, showHint, toast } from "../util.js";
import { DECOR_MAX, DECOR_MIN, H, W, canvas, decorPx, petPx, sandTop } from "../view.js";

export function canvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
}

export function hitPet(x, y) {
  let best = null, bd = Infinity;
  for (const p of tank.pets) {
    const L = petPx(p);
    if (SPECIES[p.key].kind === "eel") {
      const top = p.y - L * p.ext - L * 0.1;
      if (y < top || y > p.y + L * 0.1) continue;
      const d = Math.abs(x - p.x);
      if (d < L * 0.3 && d < bd) { bd = d; best = p; }
      continue;
    }
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < L * 0.8 && d < bd) { bd = d; best = p; }
  }
  return best;
}

export function hitDecor(x, y) {
  const st = sandTop();
  let best = null, bd = Infinity;
  for (const d of tank.decor) {
    const s = decorPx(d);
    if (y < st - s * 1.1 || y > st + s * 0.4) continue;
    const dx = Math.abs(x - d.x);
    if (dx < s * 0.6 && dx < bd) { bd = dx; best = d; }
  }
  return best;
}

export let drag = null;

canvas.addEventListener("pointerdown", ev => {
  canvas.setPointerCapture(ev.pointerId);
  const p = canvasPos(ev);
  drag = { startX: p.x, startY: p.y, moved: false, decor: null };
  if (feed.on) {
    moveShaker(ev.clientX, ev.clientY);
    showShaker(true);
  }
  if (!feed.on && !hitPet(p.x, p.y)) {
    const d = hitDecor(p.x, p.y);
    if (d) drag.decor = d;
  }
});

canvas.addEventListener("pointermove", ev => {
  if (!drag) return;
  const p = canvasPos(ev);
  if (Math.hypot(p.x - drag.startX, p.y - drag.startY) > 6) drag.moved = true;
  if (drag.decor && drag.moved) {
    const s = decorPx(drag.decor);
    drag.decor.x = clamp(p.x, s * 0.5, W - s * 0.5);
  }
});

canvas.addEventListener("pointerup", ev => {
  if (!drag) return;
  const p = canvasPos(ev);
  if (drag.decor && drag.moved) {
    save();
  } else if (!drag.moved) {
    if (feed.on) {
      sprinkle(p.x, p.y);
      feed.timer = 12;
      moveShaker(ev.clientX, ev.clientY);
      showShaker(true);
      pour();
      // a finger has no hover, so let the tub go once it has poured
      if (ev.pointerType !== "mouse") {
        clearTimeout(showShaker.t);
        showShaker.t = setTimeout(() => showShaker(false), 800);
      }
    } else {
      const pet = hitPet(p.x, p.y);
      if (pet) {
        if (SPECIES[pet.key].kind === "eel") pet.shy = rnd(2.6, 4.5);
        openCard("pet", pet.id);
      }
      else {
        const d = hitDecor(p.x, p.y);
        if (d) openCard("decor", d.id);
        else closeCard();
      }
    }
  }
  drag = null;
});

canvas.addEventListener("pointercancel", () => { drag = null; });

export let pointerInTank = false;

export let lastPointer = null;

canvas.addEventListener("pointermove", ev => {
  pointerInTank = true;
  lastPointer = { x: ev.clientX, y: ev.clientY };
  if (!feed.on) return;
  moveShaker(ev.clientX, ev.clientY);
  showShaker(true);
});

canvas.addEventListener("pointerleave", () => {
  pointerInTank = false;
  showShaker(false);
});

/* ---- feed ---- */

export const shaker = document.getElementById("shaker");

export const tankBox = document.getElementById("tankBox");

export function moveShaker(clientX, clientY) {
  const r = tankBox.getBoundingClientRect();
  shaker.style.transform =
    "translate3d(" + (clientX - r.left) + "px," + (clientY - r.top) + "px,0)";
}

export function showShaker(on, waiting) {
  shaker.classList.toggle("is-on", on);
  shaker.classList.toggle("is-waiting", !!(on && waiting));
  tankBox.classList.toggle("has-shaker", on);
}

export function pour() {
  shaker.classList.remove("is-pouring");
  void shaker.offsetWidth;            // restart the animation
  shaker.classList.add("is-pouring");
  clearTimeout(pour.t);
  pour.t = setTimeout(() => shaker.classList.remove("is-pouring"), 650);
}

export function setFeedMode(on) {
  feed.on = on;
  feed.timer = on ? 12 : 0;
  document.getElementById("feedBtn").classList.toggle("is-armed", on);
  tankBox.classList.toggle("is-feeding", on);
  if (!on) showShaker(false);
  if (on) {
    closeCard();
    showHint("水槽をタップして えさをまく");
  } else {
    hideHint();
  }
}

document.getElementById("feedBtn").addEventListener("click", () => {
  if (!tank.pets.length) { toast("まずはショップで魚をむかえよう"); return; }
  if (feed.on) { setFeedMode(false); return; }
  setFeedMode(true);
  // Take the tub out, but do not tip it: where the food goes is the player's call.
  if (pointerInTank && lastPointer) {
    moveShaker(lastPointer.x, lastPointer.y);
    showShaker(true);
  } else {
    const r = canvas.getBoundingClientRect();
    moveShaker(r.left + r.width * 0.5, r.top + Math.max(70, r.height * 0.16));
    showShaker(true, true);
  }
});

/* ---- clean ---- */

document.getElementById("cleanBtn").addEventListener("click", () => {
  if (tank.dirt < 0.02) { toast("水はもう澄んでいる"); return; }
  tank.dirt = 0;
  fx.clean = 0.9;
  toast("水がすっきりした");
  syncHud();
  save();
});

/* ---- light ---- */

document.getElementById("lightBtn").addEventListener("click", () => {
  tank.night = !tank.night;
  document.getElementById("room").classList.toggle("is-night", tank.night);
  toast(tank.night ? "おやすみモード" : "あかりをつけた");
  save();
});

/* ---- sheets ---- */

export const scrim = document.getElementById("scrim");

export const shopSheet = document.getElementById("shop");

export const menuSheet = document.getElementById("menu");

export function openSheet(sheet) {
  closeCard();
  setFeedMode(false);
  shopSheet.classList.remove("is-open");
  menuSheet.classList.remove("is-open");
  tanksSheet.classList.remove("is-open");
  dexSheet.classList.remove("is-open");
  sheet.classList.add("is-open");
  scrim.classList.add("is-open");
  syncHud();
}

export function closeSheets() {
  shopSheet.classList.remove("is-open");
  menuSheet.classList.remove("is-open");
  tanksSheet.classList.remove("is-open");
  dexSheet.classList.remove("is-open");
  scrim.classList.remove("is-open");
}

scrim.addEventListener("click", () => { closeSheets(); closeCard(); });
document.getElementById("shopBtn").addEventListener("click", () => { renderShop(); openSheet(shopSheet); });
document.getElementById("shopClose").addEventListener("click", closeSheets);
document.getElementById("menuBtn").addEventListener("click", () => openSheet(menuSheet));
document.getElementById("menuClose").addEventListener("click", closeSheets);

export const dexSheet = document.getElementById("dex");

export function renderDex() {
  const box = document.getElementById("dexList");
  box.innerHTML = "";

  let have = 0, total = 0;
  const alive = {};
  for (const key in state.tanks) {
    for (const p of state.tanks[key].pets) alive[p.key] = (alive[p.key] || 0) + 1;
  }

  for (const biome of BIOME_KEYS) {
    const keys = Object.keys(SPECIES).filter(k => homeBiome(k) === biome);
    if (!keys.length) continue;

    const head = document.createElement("div");
    head.className = "dex-group";
    head.textContent = BIOMES[biome].name;
    box.appendChild(head);

    for (const key of keys) {
      const sp = SPECIES[key];
      const locked = isLocked(key);
      total++;
      if (!locked) have++;

      const row = document.createElement("div");
      row.className = "rrow dex-row" + (locked ? " is-locked" : "");
      const cv = document.createElement("canvas");
      const body = document.createElement("div");

      const top = document.createElement("div");
      top.className = "rrow-top";
      const n = alive[key] || 0;
      top.innerHTML = "<span>" + (locked ? "？？？" : sp.name) + "</span>"
        + (n ? '<span class="n">&times;' + n + "</span>" : "")
        + '<span class="rate">' + (locked ? "未解放" : n ? "飼育中" : "解放ずみ") + "</span>";

      const bot = document.createElement("div");
      bot.className = "rrow-bot";
      if (locked) {
        const u = UNLOCKS[key];
        const hint = document.createElement("span");
        hint.className = "hint";
        hint.textContent = unlockHint(key) + (u.need ? "  " + Math.round(unlockProgress(key) * 100) + "%" : "");
        bot.appendChild(hint);
      } else {
        const note = document.createElement("span");
        note.style.cssText = "white-space:normal;line-height:1.4";
        note.textContent = sp.note;
        bot.appendChild(note);
      }

      body.append(top, bot);
      row.append(cv, body);
      box.appendChild(row);
      if (!locked) requestAnimationFrame(() => drawPreview(cv, key));
      else requestAnimationFrame(() => drawPreview(cv, key));
    }
  }

  document.getElementById("dexCount").textContent = have + " / " + total + " 種";
}

document.getElementById("dexBtn").addEventListener("click", () => {
  renderDex();
  openSheet(dexSheet);
});
document.getElementById("dexClose").addEventListener("click", closeSheets);

document.getElementById("howBtn").addEventListener("click", () => {
  closeSheets();
  toast("魚をタップで名前づけ・かざりはドラッグで移動");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("水槽をリセットします。住人もかざりも全部いなくなります。よろしいですか？")) return;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  location.reload();
});

/* ---- tanks ---- */

export const tanksSheet = document.getElementById("tanks");

export const biomeLabel = document.getElementById("biomeLabel");

export const careDot = document.getElementById("careDot");

export function syncCareDot() {
  let alert = false;
  for (const key in state.tanks) {
    if (key !== state.current && needsCare(state.tanks[key])) alert = true;
  }
  careDot.classList.toggle("is-on", alert);
}

export function syncTankChrome() {
  el.tankName.value = tank.name;
  biomeLabel.textContent = BIOMES[tank.biome].short;
  document.getElementById("room").classList.toggle("is-night", tank.night);
  syncCareDot();
}

export function useTank(key) {
  if (!state.tanks[key] || key === state.current) return;
  normTank(tank);
  state.current = key;
  tank = state.tanks[key];
  denormTank(tank);
  state.food.length = 0;
  bubbles.length = 0;
  sparks.length = 0;
  closeCard();
  setFeedMode(false);
  syncTankChrome();
  syncHud();
  save();
}

export function buyTank(key) {
  const b = BIOMES[key];
  if (!b || state.tanks[key]) return;
  if (state.coins < b.price) { toast("コインが足りない"); return; }
  state.coins -= b.price;
  state.tanks[key] = makeTank(key);
  useTank(key);
  tank.decor.push(makeDecor("plant", W * rnd(0.15, 0.3), {}));
  toast(b.name + "を用意した");
  closeSheets();
  save();
}

export function renderTanks() {
  const box = document.getElementById("tankList");
  box.innerHTML = "";
  document.getElementById("tanksCoins").textContent = Math.floor(state.coins);

  for (const key of BIOME_KEYS) {
    const b = BIOMES[key];
    const t = state.tanks[key];
    const row = document.createElement("button");
    row.className = "tank-row";

    const body = document.createElement("div");
    const eyebrow = document.createElement("div");
    eyebrow.className = "tank-biome";
    eyebrow.textContent = b.name;
    const title = document.createElement("div");
    title.className = "tank-name";
    const meta = document.createElement("div");
    meta.className = "tank-meta";

    const tag = document.createElement("span");
    tag.className = "tank-tag";

    if (t) {
      title.textContent = t.name;
      const care = needsCare(t);
      meta.innerHTML = "住人 " + t.pets.length + "／水質 " + Math.round((1 - t.dirt) * 100)
        + "%／毎分 +" + rateOf(t).toFixed(1)
        + (care ? ' <span class="care">・世話が必要</span>' : "");
      if (key === state.current) {
        row.classList.add("is-current");
        tag.classList.add("is-now");
        tag.textContent = "表示中";
        row.disabled = true;
      } else {
        tag.textContent = "見る";
        row.addEventListener("click", () => { useTank(key); renderTanks(); });
      }
    } else {
      title.textContent = b.name;
      meta.textContent = b.note;
      tag.classList.add("is-buy");
      tag.textContent = b.price + " コイン";
      if (state.coins < b.price) row.disabled = true;
      else row.addEventListener("click", () => buyTank(key));
    }

    body.append(eyebrow, title, meta);
    row.append(body, tag);
    box.appendChild(row);
  }
}

document.getElementById("tankBtn").addEventListener("click", () => {
  renderTanks();
  openSheet(tanksSheet);
});
document.getElementById("tanksClose").addEventListener("click", closeSheets);

/* ---- shop ---- */

export let shopTab = "fish";

document.getElementById("shopTabs").addEventListener("click", ev => {
  const b = ev.target.closest(".tab");
  if (!b) return;
  shopTab = b.dataset.tab;
  for (const t of document.querySelectorAll(".tab")) t.classList.toggle("is-on", t === b);
  renderShop();
});

export function shopItems() {
  const biome = tank.biome;
  if (shopTab === "decor") {
    return Object.keys(DECOR)
      .filter(k => inBiome(k, biome))
      .map(k => ({ key: k, ...DECOR[k], group: "decor" }));
  }
  const wantFish = shopTab === "fish";
  const onFishTab = k => SPECIES[k].kind === "fish" || SPECIES[k].kind === "eel";
  return Object.keys(SPECIES)
    .filter(k => inBiome(k, biome) && onFishTab(k) === wantFish)
    .map(k => ({ key: k, ...SPECIES[k], group: "pet" }));
}

export const isLocked = key => !!UNLOCKS[key] && !state.dex.unlocked[key];

export function renderShop() {
  const box = document.getElementById("goods");
  box.innerHTML = "";
  for (const it of shopItems()) {
    const btn = document.createElement("button");
    btn.className = "good";
    const locked = it.group === "pet" && isLocked(it.key);
    const afford = state.coins >= it.price;
    const roomLeft = it.group === "pet" ? tank.pets.length < CAPACITY : tank.decor.length < DECOR_CAP;
    btn.disabled = locked || !afford || !roomLeft;

    const cv = document.createElement("canvas");
    const name = document.createElement("span");
    name.className = "good-name";
    name.textContent = locked ? "？？？" : it.name;

    btn.append(cv, name);

    if (locked) {
      btn.classList.add("is-locked");
      const u = UNLOCKS[it.key];
      const lock = document.createElement("span");
      lock.className = "good-lock";
      lock.textContent = unlockHint(it.key);
      btn.appendChild(lock);
      if (u.need) {
        const pct = Math.round(unlockProgress(it.key) * 100);
        const bar = document.createElement("span");
        bar.className = "lock-bar";
        const fill = document.createElement("span");
        fill.style.width = pct + "%";
        bar.appendChild(fill);
        const num = document.createElement("span");
        num.className = "lock-pct";
        num.textContent = pct + "%";
        btn.append(bar, num);
      }
    } else {
      const note = document.createElement("span");
      note.className = "good-note";
      note.textContent = it.note + (it.rate ? "  毎分+" + it.rate.toFixed(1) : "");
      const price = document.createElement("span");
      price.className = "good-price";
      const dot = document.createElement("span");
      dot.className = "coin-dot";
      price.appendChild(dot);
      price.appendChild(document.createTextNode(String(it.price)));
      btn.append(note, price);
      btn.addEventListener("click", () => buy(it));
    }

    box.appendChild(btn);
    requestAnimationFrame(() => drawPreview(cv, it.key));
  }
}

export function buy(it) {
  if (it.group === "pet" && isLocked(it.key)) { toast("まだ解放されていない"); return; }
  if (state.coins < it.price) { toast("コインが足りない"); return; }
  if (it.group === "pet") {
    if (tank.pets.length >= CAPACITY) { toast("水槽がいっぱい"); return; }
    state.coins -= it.price;
    const p = makePet(it.key, it.kind === "eel" ? { x: freeEelX() } : {});
    tank.pets.push(p);
    toast(it.name + "「" + p.name + "」をむかえた");
  } else {
    if (tank.decor.length >= DECOR_CAP) { toast("かざりはこれ以上おけない"); return; }
    state.coins -= it.price;
    tank.decor.push(makeDecor(it.key, rnd(W * 0.12, W * 0.88), {}));
    toast(it.name + "をかざった");
  }
  syncHud();
  renderShop();
  save();
}

/* ---- inspect card ---- */

export const card = document.getElementById("card");

export const cardName = document.getElementById("cardName");

export const cardMeta = document.getElementById("cardMeta");

export const cardGauge = document.getElementById("cardGauge");

export const cardMeterRow = document.getElementById("cardMeterRow");

export const cardSizeRow = document.getElementById("cardSizeRow");

export const cardSize = document.getElementById("cardSize");

export const cardSizeVal = document.getElementById("cardSizeVal");

export const cardRelease = document.getElementById("cardRelease");

export const cardPreview = document.getElementById("cardPreview");

export function openCard(type, id) {
  const item = type === "pet"
    ? tank.pets.find(p => p.id === id)
    : tank.decor.find(d => d.id === id);
  if (!item) return;
  selection.type = type; selection.id = id;
  closeSheets();

  if (type === "pet") {
    const s = SPECIES[item.key];
    cardName.value = item.name;
    cardName.disabled = false;
    cardMeta.textContent = s.name + " ・ 毎分+" + s.rate.toFixed(1) + (s.clean ? " ・ そうじ役" : "");
    cardMeterRow.style.display = "";
    cardSizeRow.style.display = "none";
    cardRelease.textContent = "にがす (+" + Math.floor(s.price / 2) + ")";
    card.classList.remove("is-top");
    drawPreview(cardPreview, item.key);
    refreshCardMeter();
  } else {
    const d = DECOR[item.key];
    cardName.value = d.name;
    cardName.disabled = true;
    cardMeta.textContent = "ドラッグで左右に動かせる";
    cardMeterRow.style.display = "none";
    cardSizeRow.style.display = "";
    cardSize.value = Math.round((item.scale || 1) * 100);
    cardSizeVal.textContent = "\u00d7" + (item.scale || 1).toFixed(1);
    cardRelease.textContent = "しまう (+" + Math.floor(d.price / 2) + ")";
    card.classList.add("is-top");
    drawPreview(cardPreview, item.key);
  }
  card.classList.add("is-open");
}

export function refreshCardMeter() {
  const p = tank.pets.find(x => x.id === selection.id);
  if (!p) return;
  const v = Math.round(p.full * 100);
  cardGauge.firstElementChild.style.width = v + "%";
  cardGauge.classList.toggle("is-low", v < 55);
  cardGauge.classList.toggle("is-bad", v < 25);
}

export function closeCard() {
  selection.type = null; selection.id = null;
  card.classList.remove("is-open");
}

document.getElementById("cardClose").addEventListener("click", closeCard);

cardSize.addEventListener("input", () => {
  if (!selection || selection.type !== "decor") return;
  const d = tank.decor.find(x => x.id === selection.id);
  if (!d) return;
  d.scale = clamp(Number(cardSize.value) / 100, DECOR_MIN, DECOR_MAX);
  cardSizeVal.textContent = "\u00d7" + d.scale.toFixed(1);
  const px = decorPx(d);
  d.x = clamp(d.x, px * 0.5, W - px * 0.5);
});

cardSize.addEventListener("change", save);

cardName.addEventListener("input", () => {
  if (!selection || selection.type !== "pet") return;
  const p = tank.pets.find(x => x.id === selection.id);
  if (p) { p.name = cardName.value.slice(0, 10); save(); }
});

cardRelease.addEventListener("click", () => {
  if (!selection) return;
  if (selection.type === "pet") {
    const i = tank.pets.findIndex(p => p.id === selection.id);
    if (i < 0) return;
    const p = tank.pets[i];
    state.coins += Math.floor(SPECIES[p.key].price / 2);
    tank.pets.splice(i, 1);
    toast("「" + p.name + "」を にがした");
  } else {
    const i = tank.decor.findIndex(d => d.id === selection.id);
    if (i < 0) return;
    const d = tank.decor[i];
    state.coins += Math.floor(DECOR[d.key].price / 2);
    tank.decor.splice(i, 1);
    toast(DECOR[d.key].name + "を しまった");
  }
  closeCard();
  syncHud();
  save();
});

/* ---- tank name ---- */

el.tankName.addEventListener("input", () => {
  tank.name = el.tankName.value.slice(0, 14);
  save();
});


// main.js から呼ばれる。読み込み時点でイベントは登録済みなので、
// ここは「このモジュールを確実に評価させる」ための入口。
export function wireInteractions() {}
