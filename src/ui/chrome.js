// 上のバーと住人パネル。

import { SPECIES } from "../catalogue.js";
import { drawPreview } from "../draw/scene.js";
import { coinRate, happiness, totalRate } from "../economy.js";
import { selection, state, tank } from "../state.js";
import { refreshCardMeter, syncCareDot } from "./interact.js";
import { CAPACITY } from "../util.js";
import { canvas } from "../view.js";

export const el = {
  coins: document.getElementById("coins"),
  rate: document.getElementById("rate"),
  pop: document.getElementById("pop"),
  waterGauge: document.getElementById("waterGauge"),
  shopCoins: document.getElementById("shopCoins"),
  tankName: document.getElementById("tankName")
};

export function syncHud() {
  el.coins.textContent = Math.floor(state.coins);
  el.shopCoins.textContent = Math.floor(state.coins);
  el.rate.textContent = "+" + totalRate().toFixed(1) + "/分";
  el.pop.textContent = tank.pets.length + "/" + CAPACITY;
  const q = Math.round((1 - tank.dirt) * 100);
  el.waterGauge.firstElementChild.style.width = q + "%";
  el.waterGauge.classList.toggle("is-low", q < 60);
  el.waterGauge.classList.toggle("is-bad", q < 30);
  syncCareDot();
  if (selection && selection.type === "pet") refreshCardMeter();
  if (roster.classList.contains("is-open")) {
    const key = census().map(gr => gr.key + gr.n).join(",");
    key === rosterKey ? refreshRoster() : buildRoster();
  }
}

/* ------------------------------------------------------------------ *
 * roster: who lives here, and how many
 * ------------------------------------------------------------------ */

export function census() {
  const groups = new Map();
  for (const p of tank.pets) {
    let gr = groups.get(p.key);
    if (!gr) { gr = { key: p.key, n: 0, full: 0, hungry: 0 }; groups.set(p.key, gr); }
    gr.n++;
    gr.full += p.full;
    if (p.full < 0.25) gr.hungry++;
  }
  return [...groups.values()].sort((a, b) =>
    b.n - a.n || SPECIES[b.key].price - SPECIES[a.key].price);
}

export function buildRoster() {
  const list = census();
  rosterKey = list.map(gr => gr.key + gr.n).join(",");
  rosterRows = [];
  roster.innerHTML = "";

  const head = document.createElement("div");
  head.className = "roster-head";
  head.innerHTML = '<span>住人</span><b id="rosterCount"></b>'
                 + '<span class="grow">毎分</span><b id="rosterRate"></b>';
  roster.appendChild(head);

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "roster-empty";
    empty.textContent = "まだ誰もいません。ショップから最初の一匹をむかえましょう。";
    roster.appendChild(empty);
  } else {
    const box = document.createElement("div");
    box.className = "roster-list";
    for (const gr of list) {
      const sp = SPECIES[gr.key];
      const row = document.createElement("div");
      row.className = "rrow";

      const cv = document.createElement("canvas");

      const body = document.createElement("div");
      const top = document.createElement("div");
      top.className = "rrow-top";
      top.innerHTML = '<span>' + sp.name + '</span><span class="n">&times;' + gr.n + '</span>'
                    + '<span class="rate">+' + (sp.rate * gr.n).toFixed(1) + '</span>';

      const bot = document.createElement("div");
      bot.className = "rrow-bot";
      const gauge = document.createElement("span");
      gauge.className = "gauge";
      gauge.innerHTML = "<span></span>";
      const note = document.createElement("span");
      note.className = "hungry";
      bot.append(document.createTextNode("満腹"), gauge, note);

      body.append(top, bot);
      row.append(cv, body);
      box.appendChild(row);
      rosterRows.push({ key: gr.key, gauge, note });
      requestAnimationFrame(() => drawPreview(cv, gr.key));
    }
    roster.appendChild(box);
  }

  const foot = document.createElement("div");
  foot.className = "roster-foot";
  foot.innerHTML = '<span>水質</span><b id="rosterWater"></b>'
                 + '<span class="grow">きげん</span><b id="rosterMood"></b>';
  roster.appendChild(foot);

  refreshRoster();
}

export function refreshRoster() {
  const list = census();
  const byKey = new Map(list.map(gr => [gr.key, gr]));

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  setText("rosterCount", tank.pets.length + " / " + CAPACITY);
  setText("rosterRate", "+" + coinRate().toFixed(1));
  setText("rosterWater", Math.round((1 - tank.dirt) * 100) + "%");
  setText("rosterMood", Math.round(happiness() * 100) + "%");

  for (const row of rosterRows) {
    const gr = byKey.get(row.key);
    if (!gr) continue;
    const avg = Math.round((gr.full / gr.n) * 100);
    row.gauge.firstElementChild.style.width = avg + "%";
    row.gauge.classList.toggle("is-low", avg < 55);
    row.gauge.classList.toggle("is-bad", avg < 25);
    row.note.textContent = gr.hungry ? gr.hungry + "匹 空腹" : "";
  }
}

export function showRoster() {
  buildRoster();
  roster.classList.add("is-open");
  popBtn.setAttribute("aria-expanded", "true");
}

export function hideRoster() {
  rosterPinned = false;
  roster.classList.remove("is-open");
  popBtn.setAttribute("aria-expanded", "false");
}

const popWrap = document.getElementById("popWrap");

const popBtn = document.getElementById("popBtn");

const roster = document.getElementById("roster");

let rosterPinned = false;

let rosterRows = [];

let rosterKey = "";

popWrap.addEventListener("pointerenter", ev => {
  if (ev.pointerType === "mouse") showRoster();
});
popWrap.addEventListener("pointerleave", ev => {
  if (ev.pointerType === "mouse" && !rosterPinned) hideRoster();
});
popBtn.addEventListener("click", () => {
  if (rosterPinned) { hideRoster(); return; }
  rosterPinned = true;
  showRoster();
});
document.addEventListener("pointerdown", ev => {
  if (roster.classList.contains("is-open") && !popWrap.contains(ev.target)) hideRoster();
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape") hideRoster();
});
