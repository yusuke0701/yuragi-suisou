// g.save() と g.restore() の収支。
//
// 1つでも戻し漏れると毎フレーム状態スタックが伸び、他の描画が壊れる
// （チンアナゴの頭で踏んだ）。数えるだけの偽の context に全部描かせて確かめる。

import { ctx, ctxLog, resetCtxLog } from "./stub.mjs";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DECOR, SPECIES } from "../src/catalogue.js";
import {
  drawEelShape, drawFishShape, drawHermitShape, drawPet, drawShrimpShape, drawSnailShape
} from "../src/draw/creatures.js";
import { drawDecor } from "../src/draw/decor.js";
import { drawPreview, drawScene } from "../src/draw/scene.js";
import { makeDecor, makePet } from "../src/entities.js";
import { selection, state, tank } from "../src/state.js";
import { makeElement } from "./stub.mjs";

// 1回描かせて、save/restore の収支を返す
function balance(label, fn) {
  resetCtxLog();
  fn();
  assert.ok(ctxLog.save > 0, label + " が g.save() を1回も呼んでいない");
  assert.equal(ctxLog.depth, 0,
    label + ": save " + ctxLog.save + " 回に対して restore " + ctxLog.restore + " 回");
  assert.ok(ctxLog.minDepth >= 0, label + ": save より先に restore を呼んでいる");
}

describe("生きもの", () => {
  for (const key of Object.keys(SPECIES)) {
    test(SPECIES[key].name + " を描いても収支が合う", () => {
      const p = makePet(key, { x: 200, y: 150 }, []);
      balance(key, () => drawPet(ctx, p));

      // 空腹で色が薄くなる経路も通す
      p.full = 0.1;
      balance(key + "（空腹）", () => drawPet(ctx, p));

      // 選択中の枠が出る経路
      selection.type = "pet";
      selection.id = p.id;
      balance(key + "（選択中）", () => drawPet(ctx, p));
      selection.type = null;
      selection.id = null;
    });
  }

  test("形だけを直接呼んでも収支が合う", () => {
    for (const key of Object.keys(SPECIES)) {
      const s = SPECIES[key];
      if (s.kind === "fish") balance(key, () => drawFishShape(ctx, s, 30, 0.5, false));
      else if (s.kind === "shrimp") balance(key, () => drawShrimpShape(ctx, s, 30, 0.5, false));
      else if (s.kind === "eel") balance(key, () => drawEelShape(ctx, s, 40, 0.5, 1, 0, 42, false, 0.5));
      else if (s.hermit) balance(key, () => drawHermitShape(ctx, s, 30, 0.5));
      else balance(key, () => drawSnailShape(ctx, s, 30, 0.5));
    }
  });
});

describe("かざり", () => {
  for (const key of Object.keys(DECOR)) {
    test(DECOR[key].name + " を描いても収支が合う", () => {
      const d = makeDecor(key, 200, { seed: 4242, flip: 1 });
      balance(key, () => drawDecor(ctx, d, 330));

      selection.type = "decor";
      selection.id = d.id;
      balance(key + "（選択中）", () => drawDecor(ctx, d, 330));
      selection.type = null;
      selection.id = null;
    });
  }
});

describe("水槽まるごと", () => {
  function fill() {
    tank.pets.length = 0;
    tank.decor.length = 0;
    for (const key of Object.keys(SPECIES)) tank.pets.push(makePet(key, {}, tank.pets));
    let x = 40;
    for (const key of Object.keys(DECOR)) { tank.decor.push(makeDecor(key, x, {})); x += 40; }
  }

  test("全種類を入れて描いても収支が合う（昼）", () => {
    fill();
    tank.night = false;
    tank.dirt = 0.4;
    balance("drawScene（昼）", () => drawScene());
  });

  test("全種類を入れて描いても収支が合う（夜）", () => {
    fill();
    tank.night = true;
    balance("drawScene（夜）", () => drawScene());
    tank.night = false;
  });

  test("空の水槽を描いても収支が合う", () => {
    tank.pets.length = 0;
    tank.decor.length = 0;
    tank.dirt = 0;
    balance("drawScene（空）", () => drawScene());
  });
});

describe("カード・ショップの小さな絵", () => {
  test("全種類のプレビューで収支が合う", () => {
    const cv = makeElement("canvas");
    cv.width = 156;
    cv.height = 116;
    for (const key of [...Object.keys(SPECIES), ...Object.keys(DECOR)]) {
      balance("drawPreview: " + key, () => drawPreview(cv, key));
    }
  });
});
