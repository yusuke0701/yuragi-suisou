// 時間を進めたときの満腹度・水質・コイン。
// 数字は tests/harness.mjs で測った実測値。幅を持たせてあるので、
// 落ちたときは「壊れた」か「意図して変えた」のどちらか。

import "./stub.mjs";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { after, buildTank, hoursToZeroWater, setWorld } from "./harness.mjs";
import { rateOf, totalRate } from "../src/economy.js";
import { state } from "../src/state.js";

describe("満腹度", () => {
  // 「石巻貝が永久に空腹」を踏んだところ。貝の更新が tryEat に届いていなかった
  test("石巻貝は餌をやらなくても12時間で空腹にならない", () => {
    const a = after({ pets: { snail: 1 } }, 12);
    assert.ok(a.avgFull >= 0.99, "12時間後の満腹が " + a.avgFull.toFixed(3));
  });

  test("エビ・ヤドカリも自活できる", () => {
    // ミナミヌマエビは自活できるが、きれいな水では少しずつ減る（12h で 0.91）
    const shrimp = after({ pets: { minami: 1 } }, 12);
    assert.ok(shrimp.avgFull > 0.8 && shrimp.avgFull <= 1, "エビ " + shrimp.avgFull.toFixed(3));
    assert.ok(after({ pets: { minami: 1 } }, 24).avgFull > 0.5, "24時間で飢えている");

    const hermit = after({ pets: { yadokari: 1 }, biome: "marine" }, 12);
    assert.ok(hermit.avgFull >= 0.99, "ヤドカリ " + hermit.avgFull.toFixed(3));
  });

  test("コケを食べない魚は、餌をやらないと空になる", () => {
    const a = after({ pets: { neon: 1 }, biome: "tropical" }, 12);
    assert.equal(a.avgFull, 0);
  });

  test("満腹度は0で止まり、負にならない", () => {
    const a = after({ pets: { neon: 3, medaka: 3 } }, 240);
    assert.ok(a.minFull >= 0, "満腹が負になっている: " + a.minFull);
  });

  test("満腹度が1を超えない", () => {
    const a = after({ pets: { snail: 4 } }, 240);
    assert.ok(a.tank.pets.every(p => p.full <= 1), "満腹が1を超えている");
  });
});

describe("水質", () => {
  // #10。コケ取り役を入れるほど汚れる状態になっていた
  test("コケ取り役を入れると、水の持ちが延びる", () => {
    const bare = hoursToZeroWater({ pets: { medaka: 3 } });            // 42.2h
    const withSnail = hoursToZeroWater({ pets: { medaka: 3, snail: 1 } }); // 63.0h
    assert.ok(withSnail > bare * 1.3,
      "貝を入れて " + bare.toFixed(1) + "h -> " + withSnail.toFixed(1) + "h");
  });

  test("石巻貝1匹だけなら、水は汚れない", () => {
    assert.equal(hoursToZeroWater({ pets: { snail: 1 } }), Infinity);
  });

  test("大きくよく食べる魚ほど、早く汚す", () => {
    const medaka = hoursToZeroWater({ pets: { medaka: 3 } });      // 42.2h
    const goldfish = hoursToZeroWater({ pets: { goldfish: 3 } });  // 10.6h
    const angel = hoursToZeroWater({ pets: { angel: 3 }, biome: "tropical" }); // 12.1h
    assert.ok(goldfish < medaka * 0.5, "金魚がメダカと同じくらいしか汚さない");
    assert.ok(angel < medaka * 0.5, "エンゼルがメダカと同じくらいしか汚さない");
  });

  // 「満室の水槽を単独で維持できる強さにはしない」— そうじボタンが要る状態を保つ
  test("満室の水槽は、放っておくと12時間以内に汚れきる", () => {
    const h = hoursToZeroWater({ pets: { medaka: 16 } });          // 7.9h
    assert.ok(h < 12, "満室で " + h.toFixed(1) + "h もつ");
  });

  test("夜は汚れがゆっくりになる", () => {
    const day = hoursToZeroWater({ pets: { medaka: 3 } });
    const night = hoursToZeroWater({ pets: { medaka: 3 }, night: true });
    assert.ok(night > day * 1.5, "昼 " + day.toFixed(1) + "h / 夜 " + night.toFixed(1) + "h");
  });

  test("水質は0を下回らない", () => {
    const a = after({ pets: { goldfish: 8 } }, 500);
    assert.equal(a.tank.dirt, 1);
  });
});

describe("コイン", () => {
  test("全部の水槽から合算される", () => {
    const a = buildTank({ pets: { medaka: 3 } });
    const b = buildTank({ pets: { neon: 3 }, biome: "tropical" });
    setWorld(a);
    state.tanks[b.biome] = b;

    const sum = rateOf(a) + rateOf(b);
    assert.ok(sum > 0);
    assert.ok(Math.abs(totalRate() - sum) < 1e-9,
      "合算 " + totalRate().toFixed(3) + " / 個別の和 " + sum.toFixed(3));
  });

  test("留守にしているあいだも増える", () => {
    const a = after({ pets: { medaka: 3 } }, 6);
    assert.ok(a.coins > 0, "6時間で1コインも増えていない");
  });

  test("空の水槽は稼がない", () => {
    const a = after({ pets: {} }, 24);
    assert.equal(a.coins, 0);
  });
});
