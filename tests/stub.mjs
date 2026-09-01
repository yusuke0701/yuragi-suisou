// Node から src/ を import するための足場。
//
// ブラウザに配るコードは1バイトも変えない。src/ は読み込みの時点で
// window / document / canvas を触るので、そのぶんだけをここで用意する。
//
// **知らないプロパティは undefined を返す。** 何でも返す Proxy にすると、
// 例えば cv.clientWidth が関数になって計算が静かに NaN になる。
// 足りないものは「関数ではない」で落ちるほうがいい。

/* ------------------------------------------------------------------ *
 * canvas 2d context — save/restore の収支を数える
 * ------------------------------------------------------------------ */

export const ctxLog = { save: 0, restore: 0, depth: 0, minDepth: 0 };

export function resetCtxLog() {
  ctxLog.save = 0; ctxLog.restore = 0; ctxLog.depth = 0; ctxLog.minDepth = 0;
}

const NOOP = () => {};

function makeGradient() {
  return { addColorStop: NOOP };
}

function makeCtx() {
  return {
    // 状態。読み書きされるので素のフィールドで持つ
    fillStyle: "#000", strokeStyle: "#000", lineWidth: 1,
    lineCap: "butt", lineJoin: "miter", lineDashOffset: 0,
    globalAlpha: 1, globalCompositeOperation: "source-over",
    shadowBlur: 0, shadowColor: "transparent", shadowOffsetY: 0,
    font: "10px sans-serif", textAlign: "start",

    save() { ctxLog.save++; ctxLog.depth++; },
    restore() {
      ctxLog.restore++; ctxLog.depth--;
      if (ctxLog.depth < ctxLog.minDepth) ctxLog.minDepth = ctxLog.depth;
    },

    createLinearGradient: makeGradient,
    createRadialGradient: makeGradient,
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: [] }),

    beginPath: NOOP, closePath: NOOP, moveTo: NOOP, lineTo: NOOP,
    bezierCurveTo: NOOP, quadraticCurveTo: NOOP, arc: NOOP, arcTo: NOOP,
    ellipse: NOOP, rect: NOOP, roundRect: NOOP,
    fill: NOOP, stroke: NOOP, clip: NOOP,
    fillRect: NOOP, strokeRect: NOOP, clearRect: NOOP,
    fillText: NOOP, strokeText: NOOP, drawImage: NOOP, putImageData: NOOP,
    translate: NOOP, rotate: NOOP, scale: NOOP, transform: NOOP,
    setTransform: NOOP, resetTransform: NOOP, setLineDash: NOOP
  };
}

export const ctx = makeCtx();

/* ------------------------------------------------------------------ *
 * element
 * ------------------------------------------------------------------ */

function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    contains: c => set.has(c),
    toggle(c, on) {
      const want = on === undefined ? !set.has(c) : !!on;
      want ? set.add(c) : set.delete(c);
      return want;
    }
  };
}

export function makeElement(tag = "div") {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: "", className: "", textContent: "", innerHTML: "", value: "",
    disabled: false, hidden: false, checked: false,
    // clientWidth/Height は drawPreview が読む。0 にして width/height に落とす
    clientWidth: 0, clientHeight: 0,
    width: 800, height: 420,
    style: {}, dataset: {},
    classList: makeClassList(),
    children: [],

    get firstElementChild() {
      if (!this._fec) this._fec = makeElement();
      return this._fec;
    },

    getContext: () => ctx,
    getBoundingClientRect: () => ({
      left: 0, top: 0, right: 800, bottom: 420, width: 800, height: 420, x: 0, y: 0
    }),

    appendChild(c) { this.children.push(c); return c; },
    append(...cs) { for (const c of cs) this.children.push(c); },
    insertBefore(c) { this.children.push(c); return c; },
    replaceChildren() { this.children.length = 0; },
    remove: NOOP,
    addEventListener: NOOP, removeEventListener: NOOP,
    setAttribute: NOOP, removeAttribute: NOOP, getAttribute: () => null,
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    closest: () => null,
    contains: () => false,
    focus: NOOP, blur: NOOP, select: NOOP, scrollIntoView: NOOP,
    setPointerCapture: NOOP, releasePointerCapture: NOOP
  };
  return el;
}

/* ------------------------------------------------------------------ *
 * globals
 * ------------------------------------------------------------------ */

const byId = new Map();

const documentStub = {
  hidden: false,
  documentElement: makeElement("html"),
  body: makeElement("body"),
  getElementById(id) {
    if (!byId.has(id)) {
      const el = makeElement();
      el.id = id;
      byId.set(id, el);
    }
    return byId.get(id);
  },
  createElement: tag => makeElement(tag),
  createElementNS: (ns, tag) => makeElement(tag),
  querySelector: () => makeElement(),
  querySelectorAll: () => [],
  addEventListener: NOOP,
  removeEventListener: NOOP
};

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    clear: () => map.clear()
  };
}

const windowStub = {
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  matchMedia: () => ({ matches: false, addEventListener: NOOP, removeEventListener: NOOP }),
  addEventListener: NOOP,
  removeEventListener: NOOP,
  requestAnimationFrame: NOOP,
  getComputedStyle: () => ({})
};

// タイマーは unref する。main.js の setInterval がプロセスを掴んだままだと
// テストが終わらない
for (const name of ["setTimeout", "setInterval"]) {
  const real = globalThis[name];
  globalThis[name] = (...args) => {
    const t = real(...args);
    if (t && typeof t.unref === "function") t.unref();
    return t;
  };
}

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = makeStorage();
globalThis.location = { reload: NOOP, href: "http://localhost/" };
globalThis.confirm = () => false;
globalThis.alert = NOOP;
globalThis.devicePixelRatio = 1;
globalThis.requestAnimationFrame = NOOP;
globalThis.cancelAnimationFrame = NOOP;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

// 石・流木・魚の体は Path2D を組み立てて g.fill(path) に渡す
globalThis.Path2D = class {
  moveTo() {} lineTo() {} closePath() {} addPath() {}
  bezierCurveTo() {} quadraticCurveTo() {} arc() {} arcTo() {}
  ellipse() {} rect() {} roundRect() {}
};
