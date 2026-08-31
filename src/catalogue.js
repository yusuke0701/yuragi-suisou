// 生きもの・かざり・地域・解放条件。データはすべてここに集める。

import { moodOf } from "./util.js";

export const SPECIES = {
  medaka: {
    kind: "fish", name: "メダカ", price: 20, rate: 0.6, size: 20, ratio: 0.44,
    c1: "#c9832f", c2: "#ffe6b4", fin: "#ffd58a", tail: "fork", mark: "none",
    note: "小さくて丈夫。はじめの一匹に。"
  },
  neon: {
    kind: "fish", name: "ネオンテトラ", price: 30, rate: 0.9, size: 24, ratio: 0.42,
    c1: "#1d5d80", c2: "#a9e6fb", fin: "#bfe9f7", tail: "fork", mark: "neon",
    note: "青い光の帯。群れると映える。"
  },
  guppy: {
    kind: "fish", name: "グッピー", price: 45, rate: 1.2, size: 23, ratio: 0.44,
    c1: "#d9622a", c2: "#ffd58f", fin: "#ff9f5f", tail: "veil", mark: "spots",
    note: "ひらひらの尾びれが自慢。"
  },
  cory: {
    kind: "fish", name: "コリドラス", price: 80, rate: 1.7, size: 27, ratio: 0.5,
    c1: "#7d7259", c2: "#e8dcc0", fin: "#d6c9a6", tail: "fork", mark: "spots",
    bottom: true, clean: 0.15,
    note: "砂の上をつつく底ぐらし。少し掃除もする。"
  },
  eel: {
    kind: "eel", name: "チンアナゴ", price: 95, rate: 1.9, size: 56,
    c1: "#cfc6b2", c2: "#fbf8f0",
    note: "砂から生えてゆらゆら。おどろくと引っこむ。"
  },
  goldfish: {
    kind: "fish", name: "金魚", price: 130, rate: 2.3, size: 33, ratio: 0.66,
    c1: "#e3521f", c2: "#ffcf7a", fin: "#ff9b57", tail: "veil", mark: "none",
    note: "中国生まれ、日本で育った定番。"
  },
  betta: {
    kind: "fish", name: "ベタ", price: 190, rate: 3.1, size: 28, ratio: 0.62,
    c1: "#33269c", c2: "#8f6bff", fin: "#ff5c9e", tail: "flow", mark: "none",
    note: "布のようなひれ。ひとりが好き。"
  },
  angel: {
    kind: "fish", name: "エンゼルフィッシュ", price: 280, rate: 4.2, size: 30, ratio: 0.9,
    c1: "#a49b88", c2: "#fdfaf0", fin: "#efe6d0", tail: "flow", mark: "tiger",
    tall: true,
    note: "縦に長い体。水槽の主役。"
  },
  yoshinobori: {
    kind: "fish", name: "ヨシノボリ", price: 90, rate: 1.4, size: 25, ratio: 0.46,
    c1: "#7a6a52", c2: "#ded0b3", fin: "#c3b18d", tail: "fan", mark: "spots",
    bottom: true, clean: 0.12,
    note: "石の上にちょこんと乗る。縄張り意識は強め。"
  },
  dojo: {
    kind: "fish", name: "ドジョウ", price: 110, rate: 1.6, size: 36, ratio: 0.21,
    c1: "#6b5c43", c2: "#c8b795", fin: "#a89473", tail: "fan", mark: "spots",
    bottom: true, whisker: true, clean: 0.1,
    note: "砂にもぐって休む。ひげが自慢。"
  },
  tanago: {
    kind: "fish", name: "タナゴ", price: 140, rate: 1.8, size: 25, ratio: 0.54,
    c1: "#7f939b", c2: "#f3f8f7", fin: "#eaa88e", tail: "fork", mark: "tanago",
    note: "婚姻色の出た雄は驚くほど鮮やか。"
  },
  oikawa: {
    kind: "fish", name: "オイカワ", price: 200, rate: 2.4, size: 30, ratio: 0.42,
    c1: "#7d8f96", c2: "#f5f9f9", fin: "#e77fa8", tail: "fork", mark: "oikawa",
    note: "清流の代表。雄は桃と緑の婚姻色をまとう。"
  },
  minami: {
    kind: "shrimp", name: "ミナミヌマエビ", price: 40, rate: 0.9, size: 15,
    c1: "#8fb59a", c2: "#dff0e2", clean: 0.35,
    note: "コケを食べて水をきれいに保つ。餌がなくてもやっていける。"
  },
  redbee: {
    kind: "shrimp", name: "レッドビーシュリンプ", price: 160, rate: 2.5, size: 15,
    c1: "#c92c34", c2: "#fff4f0", clean: 0.3, banded: true,
    note: "紅白の縞。小さな宝石。"
  },
  sujiebi: {
    kind: "shrimp", name: "スジエビ", price: 70, rate: 1.2, size: 17,
    c1: "#a6b3ab", c2: "#eff4f0", clean: 0.25, striped: true,
    note: "透明な体に走る黒い筋。やや気が荒い。"
  },
  snail: {
    kind: "snail", name: "石巻貝", price: 25, rate: 0.3, size: 13,
    c1: "#3d3126", c2: "#c7a878", clean: 0.6,
    note: "ガラスのコケ取り担当。コケが主食なので餌いらず。"
  },
  ramshorn: {
    kind: "snail", name: "ラムズホーン", price: 40, rate: 0.4, size: 14,
    c1: "#a32a12", c2: "#f28a4c", clean: 0.55,
    note: "赤い巻貝。よく増える働き者。"
  },

  /* ---- 日本の海水魚 ---- */
  deba: {
    kind: "fish", name: "デバスズメダイ", price: 80, rate: 1.5, size: 21, ratio: 0.52,
    c1: "#3f8f8a", c2: "#c2f2e4", fin: "#84dcc9", tail: "fork", mark: "sheen",
    note: "群れると水色の霞のよう。"
  },
  ruri: {
    kind: "fish", name: "ルリスズメダイ", price: 130, rate: 2.0, size: 22, ratio: 0.56,
    c1: "#12379e", c2: "#63b0ff", fin: "#2f6fe0", tail: "fork", mark: "sheen",
    note: "光の当たり方で青が変わる。"
  },
  clownfish: {
    kind: "fish", name: "カクレクマノミ", price: 170, rate: 2.3, size: 26, ratio: 0.6,
    c1: "#d9581a", c2: "#ff9d52", fin: "#c04a17", tail: "fan", mark: "clown", finK: 0.86,
    note: "イソギンチャクの間から顔を出す。"
  },
  hakofugu: {
    kind: "fish", name: "ミナミハコフグ", price: 280, rate: 3.0, size: 22, ratio: 0.9,
    c1: "#d6a30c", c2: "#ffe469", fin: "#f0c93f", tail: "fan", mark: "spots", boxy: true,
    finK: 0.44, spotColor: "rgba(38,28,12,.8)",
    note: "幼魚は黄色い箱。ふわふわ泳ぐ。"
  },
  yadokari: {
    kind: "snail", name: "ヤドカリ", price: 95, rate: 0.6, size: 21,
    c1: "#7a5a3a", c2: "#dcc198", clean: 0.5, hermit: true,
    note: "貝がらを背負って砂を掃除する。"
  }
};

export const DECOR = {
  plant:     { name: "水草",     price: 20,  size: 62, note: "ゆらゆら。魚のかくれ家に。" },
  shell:     { name: "貝がら",   price: 15,  size: 26, note: "白い砂の上のささやかな一点。" },
  rock:      { name: "岩",       price: 35,  size: 44, note: "レイアウトの土台になる。" },
  marimo:    { name: "マリモ",   price: 55,  size: 30, note: "まるい。ただただ、まるい。" },
  driftwood: { name: "流木",     price: 60,  size: 78, note: "水槽が一気に自然っぽくなる。" },
  coral:     { name: "サンゴ",   price: 90,  size: 58, note: "枝ぶりが華やか。サンゴ礁の主役。" },
  leaves:    { name: "落ち葉",   price: 30,  size: 50, note: "沈めておくと隠れ家になる。和の一景。" },
  bamboo:    { name: "竹筒",     price: 75,  size: 76, note: "ドジョウが好んで入る。日本の水辺らしさ。" },
  airstone:  { name: "エアストーン", price: 110, size: 22, note: "泡がのぼる。水がすこし澄む。", clean: 0.4 },
  castle:    { name: "お城",     price: 220, size: 80, note: "水槽の中の小さな城下町。" },
  liverock:  { name: "ライブロック", price: 70, size: 46, note: "石灰藻のついた岩。海水の景色の土台。" },
  anemone:   { name: "イソギンチャク", price: 130, size: 44, note: "ゆらゆら揺れる。クマノミが住みつく。" }
};

export const BIOMES = {
  japanFresh: {
    name: "日本の淡水魚", short: "日本淡水", price: 0, order: 0,
    note: "小川や田んぼの水辺。はじめの水槽。",
    // 木陰の小川。光はやわらかく、緑が濃い
    water: ["#3f9b6e", "#14624a", "#052b24"],
    waterNight: ["#0e2f26", "#08251f", "#041714"],
    sand: ["#cabb92", "#776c4e"],
    sandNight: ["#877b5e", "#4a422f"],
    pebble: ["#a89a76", "#6d6448"],
    mound: ["202,187,146", "135,123,94"],
    ray: "212,255,206", rayCount: 3, rayPower: 0.62,
    starter: { pets: ["medaka"], decor: ["plant"] }
  },
  tropical: {
    name: "熱帯魚水槽", short: "熱帯魚", price: 1400, order: 1,
    note: "南米やアマゾンの魚たち。にぎやかで色が濃い。",
    // 照明の効いた水草水槽。明るく、青が澄んでいる
    water: ["#2ba7c8", "#116a90", "#062f46"],
    waterNight: ["#0a2c3a", "#072430", "#04171f"],
    sand: ["#f2e2b8", "#b09a6f"],
    sandNight: ["#9d906f", "#5c5340"],
    pebble: ["#cdb78d", "#948564"],
    mound: ["242,226,184", "158,145,116"],
    ray: "196,246,255", rayCount: 6, rayPower: 1.35,
    starter: { pets: ["neon", "neon"], decor: ["plant", "driftwood"] }
  },
  marine: {
    name: "日本の海水魚", short: "海水", price: 4200, order: 2,
    note: "南の海のサンゴ礁。白い砂と、明るい青。",
    water: ["#2fa8c6", "#0f7396", "#053f5c"],
    waterNight: ["#0b3042", "#082635", "#041823"],
    sand: ["#f7f0dd", "#c3b498"],
    sandNight: ["#a49c88", "#655f50"],
    pebble: ["#e2d6ba", "#b3a68c"],
    mound: ["246,239,220", "164,156,136"],
    ray: "190,246,255", rayCount: 5, rayPower: 1.6,
    starter: { pets: ["deba", "deba"], decor: ["liverock", "coral"] }
  }
};

export const BIOME_KEYS = Object.keys(BIOMES).sort((a, b) => BIOMES[a].order - BIOMES[b].order);

// Where each creature and ornament belongs. "any" shows up everywhere.

export const HOME = {
  medaka: ["japanFresh"], goldfish: ["japanFresh"], tanago: ["japanFresh"],
  oikawa: ["japanFresh"], dojo: ["japanFresh"], yoshinobori: ["japanFresh"],
  minami: ["japanFresh"], sujiebi: ["japanFresh"], snail: ["japanFresh"],

  neon: ["tropical"], guppy: ["tropical"], cory: ["tropical"], betta: ["tropical"],
  angel: ["tropical"], redbee: ["tropical"], ramshorn: ["tropical"],

  deba: ["marine"], ruri: ["marine"], clownfish: ["marine"],
  hakofugu: ["marine"], eel: ["marine"], yadokari: ["marine"],

  rock: "any", airstone: "any",
  plant: ["japanFresh", "tropical"], driftwood: ["japanFresh", "tropical"],
  marimo: ["japanFresh"], leaves: ["japanFresh"], bamboo: ["japanFresh"],
  castle: ["tropical"],
  liverock: ["marine"], coral: ["marine"], anemone: ["marine"], shell: ["marine"]
};

export const inBiome = (key, biome) => HOME[key] === "any" || HOME[key].indexOf(biome) >= 0;

export const homeBiome = key => (HOME[key] === "any" ? null : HOME[key][0]);

// species that have to be earned, and what earns them

export const UNLOCKS = {
  sujiebi: {
    need: 0, hint: "この水槽で3種類以上の生きものを飼う",
    holds: t => new Set(t.pets.map(p => p.key)).size >= 3
  },
  yoshinobori: {
    need: 0, hint: "岩と流木をあわせて3つ置く",
    holds: t => t.decor.filter(d => d.key === "rock" || d.key === "driftwood").length >= 3
  },
  tanago: {
    need: 6 * 3600, hint: "メダカを3匹、満腹50%以上でたもつ",
    holds: t => {
      const m = t.pets.filter(p => p.key === "medaka");
      return m.length >= 3 && m.every(p => p.full >= 0.5);
    }
  },
  dojo: {
    need: 8 * 3600, hint: "水質を85%以上にたもつ",
    holds: t => t.dirt <= 0.15
  },
  oikawa: {
    need: 12 * 3600, hint: "きげんを75%以上にたもつ",
    holds: t => moodOf(t) >= 0.75
  },

  betta: {
    need: 0, hint: "熱帯魚水槽の住人を8匹以上にする",
    holds: t => t.pets.length >= 8
  },
  angel: {
    need: 12 * 3600, hint: "熱帯魚水槽のきげんを80%以上にたもつ",
    holds: t => moodOf(t) >= 0.8
  },

  clownfish: {
    need: 0, hint: "海水水槽にイソギンチャクを置く",
    holds: t => t.decor.some(d => d.key === "anemone")
  },
  hakofugu: {
    need: 0, hint: "サンゴかイソギンチャクを3つ置く",
    holds: t => t.decor.filter(d => d.key === "coral" || d.key === "anemone").length >= 3
  },
  yadokari: {
    need: 8 * 3600, hint: "海水水槽の水質を90%以上にたもつ",
    holds: t => t.dirt <= 0.1
  }
};

export const SOLID_DECOR = { rock: 1, liverock: 1, driftwood: 1, castle: 1, marimo: 1, coral: 1, shell: 1, bamboo: 1, anemone: 1 };

export const NAME_POOL = ["ぷか", "あおば", "こむぎ", "しらす", "もなか", "きなこ", "つぶら",
                   "ゆらり", "まめ", "ぽん", "すい", "みずき", "あわ", "こはく",
                   "ちゃぷ", "なぎ", "しずく", "とと"];
