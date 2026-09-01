// src/ 以下が全部 import できること。
// 分割やリネームで壊れた import は、遊ぶ前にここで落ちる。

import "./stub.mjs";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const root = fileURLToPath(new URL("../src/", import.meta.url));

function jsFiles(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...jsFiles(full));
    else if (ent.name.endsWith(".js")) out.push(full);
  }
  return out.sort();
}

const files = jsFiles(root);

test("src/ に .js が見つかる", () => {
  assert.ok(files.length >= 10, "モジュールが " + files.length + " 個しか見つからない");
});

describe("import", () => {
  for (const file of files) {
    const name = relative(root, file);
    // main.js は読み込んだ時点で起動する。最後に回す
    test(name + " が読める", { concurrency: false }, async () => {
      const mod = await import(file);
      assert.ok(mod, name + " が空");
    });
  }
});

// ES module の import は読み取り専用。import した束縛に代入すると TypeError。
// 「水槽を切り替えると壊れる」のはこれを踏んだもの。
describe("import した束縛への代入がない", () => {
  const owners = { tank: "state.js", W: "view.js", H: "view.js", time: "view.js" };

  for (const [binding, owner] of Object.entries(owners)) {
    test(binding + " を書き換えるのは " + owner + " だけ", () => {
      const re = new RegExp("^\\s*" + binding + "\\s*=[^=]", "m");
      const bad = files
        .filter(f => !f.endsWith(owner))
        .filter(f => re.test(readFileSync(f, "utf8")))
        .map(f => relative(root, f));
      assert.deepEqual(bad, [],
        binding + " に代入している: " + bad.join(", ") + "（" + owner + " の setter を通すこと）");
    });
  }
});
