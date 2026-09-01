// データの整合性。生きものやかざりを足したときの登録漏れを止める。

import "./stub.mjs";
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BIOMES, BIOME_KEYS, DECOR, HOME, NAME_POOL, SOLID_DECOR, SPECIES, UNLOCKS, homeBiome
} from "../src/catalogue.js";

const speciesKeys = Object.keys(SPECIES);
const decorKeys = Object.keys(DECOR);
const allKeys = [...speciesKeys, ...decorKeys];

describe("HOME への登録", () => {
  test("SPECIES と DECOR の全キーが HOME にある", () => {
    const missing = allKeys.filter(k => !(k in HOME));
    assert.deepEqual(missing, [], "HOME に無い: " + missing.join(", "));
  });

  test("HOME の値は \"any\" か、実在する biome の配列", () => {
    for (const [key, home] of Object.entries(HOME)) {
      if (home === "any") continue;
      assert.ok(Array.isArray(home), key + " の HOME が配列でも \"any\" でもない");
      assert.ok(home.length > 0, key + " の HOME が空");
      for (const b of home) assert.ok(BIOMES[b], key + " が知らない biome を指している: " + b);
    }
  });

  test("HOME に、実在しないキーが残っていない", () => {
    const ghosts = Object.keys(HOME).filter(k => !SPECIES[k] && !DECOR[k]);
    assert.deepEqual(ghosts, [], "SPECIES にも DECOR にも無い: " + ghosts.join(", "));
  });
});

describe("数値", () => {
  test("SPECIES の price / rate / size / bio が正の数", () => {
    for (const [key, s] of Object.entries(SPECIES)) {
      for (const field of ["price", "rate", "size"]) {
        assert.equal(typeof s[field], "number", key + "." + field + " が数値でない");
        assert.ok(s[field] > 0, key + "." + field + " が正でない");
      }
      // bio は省略すると 1.0 扱い。書くなら正の数であること
      if ("bio" in s) assert.ok(s.bio > 0, key + ".bio が正でない");
      if ("clean" in s) assert.ok(s.clean > 0, key + ".clean が正でない");
      assert.ok(s.name && s.note, key + " に name か note が無い");
      assert.ok(["fish", "shrimp", "snail", "eel"].includes(s.kind), key + ".kind が未知: " + s.kind);
    }
  });

  test("DECOR の price / size が正の数", () => {
    for (const [key, d] of Object.entries(DECOR)) {
      assert.ok(d.price > 0 && d.size > 0, key + " の price / size が正でない");
      assert.ok(d.name && d.note, key + " に name か note が無い");
    }
  });

  test("SOLID_DECOR のキーが実在する", () => {
    for (const key of Object.keys(SOLID_DECOR)) {
      assert.ok(DECOR[key], "SOLID_DECOR の " + key + " が DECOR に無い");
    }
  });
});

describe("解放条件", () => {
  test("UNLOCKS のキーが実在する種で、住処が決まっている", () => {
    for (const key of Object.keys(UNLOCKS)) {
      assert.ok(SPECIES[key], "UNLOCKS の " + key + " が SPECIES に無い");
      assert.ok(BIOMES[homeBiome(key)], key + " の住処が biome として存在しない");
    }
  });

  test("hint があり、need は 0 以上の数", () => {
    for (const [key, u] of Object.entries(UNLOCKS)) {
      assert.ok(u.hint && u.hint.length > 0, key + " に hint が無い");
      assert.equal(typeof u.need, "number", key + ".need が数値でない");
      assert.ok(u.need >= 0, key + ".need が負");
      assert.equal(typeof u.holds, "function", key + ".holds が関数でない");
    }
  });

  test("holds() が、空の水槽を渡しても落ちない", () => {
    const empty = { pets: [], decor: [], dirt: 0, night: false };
    for (const [key, u] of Object.entries(UNLOCKS)) {
      assert.doesNotThrow(() => u.holds(empty), key + ".holds が空の水槽で落ちる");
    }
  });
});

describe("水槽ごとの中身（AGENTS.md の決めごと）", () => {
  test("BIOME_KEYS が BIOMES を漏れなく並べる", () => {
    assert.deepEqual([...BIOME_KEYS].sort(), Object.keys(BIOMES).sort());
    const orders = BIOME_KEYS.map(k => BIOMES[k].order);
    assert.equal(new Set(orders).size, orders.length, "order が重複している");
  });

  test("色の一式がそろっている", () => {
    for (const key of BIOME_KEYS) {
      const b = BIOMES[key];
      for (const field of ["water", "waterNight", "sand", "sandNight", "pebble", "mound", "ray"]) {
        assert.ok(b[field], key + " に " + field + " が無い");
      }
      assert.ok(b.name && b.short && b.note, key + " に name / short / note が無い");
      assert.equal(typeof b.price, "number", key + ".price が数値でない");
    }
  });

  // 「コケ取り役を必ず1種入れる。水質が下がりっぱなしになる」
  test("どの水槽にもコケ取り役がいる", () => {
    for (const biome of BIOME_KEYS) {
      const cleaners = Object.keys(SPECIES)
        .filter(k => HOME[k] !== "any" && HOME[k].includes(biome) && SPECIES[k].clean);
      assert.ok(cleaners.length >= 1, biome + " にコケ取り役がいない");
    }
  });

  // 「その水槽だけのかざりを3種以上そろえる。置くものが同じだと同じ景色になる」
  test("どの水槽にも専用のかざりが3種以上ある", () => {
    for (const biome of BIOME_KEYS) {
      const only = decorKeys.filter(k =>
        HOME[k] !== "any" && HOME[k].length === 1 && HOME[k][0] === biome);
      assert.ok(only.length >= 3, biome + " の専用のかざりが " + only.length + " 種しかない");
    }
  });

  test("初回起動の starter が実在するキーを指している", () => {
    for (const key of BIOME_KEYS) {
      const st = BIOMES[key].starter;
      if (!st) continue;
      for (const k of st.pets) assert.ok(SPECIES[k], key + ".starter の " + k + " が SPECIES に無い");
      for (const k of st.decor) assert.ok(DECOR[k], key + ".starter の " + k + " が DECOR に無い");
    }
  });
});

test("名前の候補に重複がない", () => {
  assert.equal(new Set(NAME_POOL).size, NAME_POOL.length);
});
