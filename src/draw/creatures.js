// 生きものの描画。

import { SPECIES } from "../catalogue.js";
import { save, selection } from "../state.js";
import { clamp, mulberry32, shade } from "../util.js";
import { petPx, time } from "../view.js";

export function drawFishShape(g, s, L, phase, pale) {
  const Hh = L * s.ratio;
  const Hf = Hh * (s.finK || 1);          // fins scale separately from the body
  const wag = Math.sin(phase) * 0.34;
  const finWag = Math.sin(phase * 1.3) * 0.5;

  g.save();
  if (pale) g.globalAlpha *= 0.82;

  // ---- tail ----
  g.save();
  g.translate(-L * 0.40, 0);
  g.rotate(wag);
  g.fillStyle = s.fin;
  g.globalAlpha *= 0.92;
  g.beginPath();
  if (s.tail === "fork") {
    g.moveTo(0, 0);
    g.lineTo(-L * 0.30, -Hf * 0.72);
    g.quadraticCurveTo(-L * 0.16, 0, -L * 0.30, Hf * 0.72);
    g.closePath();
  } else if (s.tail === "fan") {
    g.moveTo(0, -Hf * 0.16);
    g.quadraticCurveTo(-L * 0.26, -Hf * 0.7, -L * 0.34, 0);
    g.quadraticCurveTo(-L * 0.26, Hf * 0.7, 0, Hf * 0.16);
    g.closePath();
  } else if (s.tail === "veil") {
    g.moveTo(0, 0);
    g.quadraticCurveTo(-L * 0.30, -Hf * 0.95, -L * 0.44, -Hf * 0.30);
    g.quadraticCurveTo(-L * 0.36, 0, -L * 0.44, Hf * 0.30);
    g.quadraticCurveTo(-L * 0.30, Hf * 0.95, 0, 0);
  } else {
    g.moveTo(0, -Hf * 0.18);
    g.quadraticCurveTo(-L * 0.30, -Hf * 0.85, -L * 0.56, -Hf * 0.52);
    g.quadraticCurveTo(-L * 0.50, -Hf * 0.05, -L * 0.60, Hf * 0.40);
    g.quadraticCurveTo(-L * 0.38, Hf * 0.30, -L * 0.22, Hf * 0.62);
    g.quadraticCurveTo(-L * 0.14, Hf * 0.28, 0, Hf * 0.18);
    g.closePath();
  }
  g.fill();
  g.restore();

  // ---- dorsal + anal fins ----
  g.fillStyle = s.fin;
  g.globalAlpha *= 0.85;
  g.beginPath();
  g.moveTo(L * 0.06, -Hf * 0.42);
  if (s.tall) {
    g.quadraticCurveTo(L * 0.02, -Hf * 1.5, -L * 0.28, -Hf * 0.9);
  } else {
    g.quadraticCurveTo(-L * 0.04, -Hf * 0.98, -L * 0.24, -Hf * 0.44);
  }
  g.closePath();
  g.fill();

  g.beginPath();
  g.moveTo(L * 0.02, Hf * 0.42);
  if (s.tall) g.quadraticCurveTo(-L * 0.06, Hf * 1.5, -L * 0.28, Hf * 0.85);
  else g.quadraticCurveTo(-L * 0.08, Hf * 0.86, -L * 0.24, Hf * 0.42);
  g.closePath();
  g.fill();
  g.globalAlpha /= 0.85;

  // ---- body ----
  const body = new Path2D();
  if (s.boxy) {
    // a boxfish is nearly a cube with rounded corners
    body.moveTo(L * 0.46, -Hh * 0.18);
    body.quadraticCurveTo(L * 0.5, -Hh * 0.5, L * 0.2, -Hh * 0.52);
    body.lineTo(-L * 0.16, -Hh * 0.5);
    body.quadraticCurveTo(-L * 0.42, -Hh * 0.46, -L * 0.4, -Hh * 0.12);
    body.lineTo(-L * 0.4, Hh * 0.12);
    body.quadraticCurveTo(-L * 0.42, Hh * 0.46, -L * 0.16, Hh * 0.5);
    body.lineTo(L * 0.2, Hh * 0.52);
    body.quadraticCurveTo(L * 0.5, Hh * 0.5, L * 0.46, Hh * 0.18);
    body.quadraticCurveTo(L * 0.52, 0, L * 0.46, -Hh * 0.18);
  } else {
    body.moveTo(L * 0.50, 0);
    body.quadraticCurveTo(L * 0.18, -Hh * 0.52, -L * 0.10, -Hh * 0.46);
    body.quadraticCurveTo(-L * 0.34, -Hh * 0.26, -L * 0.42, 0);
    body.quadraticCurveTo(-L * 0.34, Hh * 0.26, -L * 0.10, Hh * 0.46);
    body.quadraticCurveTo(L * 0.18, Hh * 0.52, L * 0.50, 0);
  }

  const grad = g.createLinearGradient(0, -Hh * 0.55, 0, Hh * 0.55);
  grad.addColorStop(0, s.c2);
  grad.addColorStop(0.55, s.c1);
  grad.addColorStop(1, shade(s.c1, -0.22));
  g.fillStyle = grad;
  g.fill(body);

  // ---- markings ----
  g.save();
  g.clip(body);
  if (s.mark === "neon") {
    g.fillStyle = "#3fe0ff";
    g.globalAlpha = 0.9;
    g.fillRect(-L * 0.45, -Hh * 0.20, L, Hh * 0.16);
    g.fillStyle = "#ff4d5e";
    g.fillRect(-L * 0.45, Hh * 0.02, L * 0.7, Hh * 0.18);
  } else if (s.mark === "tiger") {
    g.fillStyle = "rgba(46,38,30,.5)";
    for (let i = -1; i <= 1; i++) {
      g.save();
      g.translate(L * 0.14 + i * L * 0.28, 0);
      g.rotate(0.1);
      g.fillRect(-L * 0.06, -Hh * 0.62, L * 0.12, Hh * 1.24);
      g.restore();
    }
  } else if (s.mark === "tanago") {
    const belly = g.createLinearGradient(0, 0, 0, Hh * 0.6);
    belly.addColorStop(0, "rgba(233,140,96,0)");
    belly.addColorStop(1, "rgba(233,126,86,.62)");
    g.fillStyle = belly;
    g.fillRect(-L * 0.5, 0, L, Hh * 0.6);
    g.fillStyle = "rgba(64,206,190,.75)";
    g.fillRect(-L * 0.42, -Hh * 0.06, L * 0.5, Hh * 0.13);
    g.fillStyle = "rgba(255,255,255,.4)";
    g.fillRect(-L * 0.42, -Hh * 0.2, L * 0.5, Hh * 0.06);
  } else if (s.mark === "oikawa") {
    g.globalAlpha *= 0.62;
    for (let i = -2; i <= 2; i++) {
      g.fillStyle = i % 2 ? "#6fbf9a" : "#e8749f";
      g.save();
      g.translate(L * 0.04 + i * L * 0.15, 0);
      g.rotate(0.16);
      g.fillRect(-L * 0.035, -Hh * 0.6, L * 0.07, Hh * 1.2);
      g.restore();
    }
    g.globalAlpha /= 0.62;
    const sheen2 = g.createLinearGradient(0, -Hh * 0.5, 0, Hh * 0.5);
    sheen2.addColorStop(0, "rgba(255,255,255,.35)");
    sheen2.addColorStop(0.5, "rgba(255,255,255,0)");
    sheen2.addColorStop(1, "rgba(232,116,159,.3)");
    g.fillStyle = sheen2;
    g.fill(body);
  } else if (s.mark === "clown") {
    for (const b of [0.3, -0.02, -0.32]) {
      g.save();
      g.translate(L * b, 0);
      g.rotate(b > 0 ? -0.22 : 0.1);
      g.fillStyle = "rgba(22,16,12,.85)";
      g.fillRect(-L * 0.075, -Hh * 0.7, L * 0.15, Hh * 1.4);
      g.fillStyle = "#fdf6ec";
      g.fillRect(-L * 0.055, -Hh * 0.7, L * 0.11, Hh * 1.4);
      g.restore();
    }
  } else if (s.mark === "sheen") {
    const sh = g.createLinearGradient(0, -Hh * 0.55, 0, Hh * 0.55);
    sh.addColorStop(0, "rgba(255,255,255,.5)");
    sh.addColorStop(0.4, "rgba(255,255,255,.08)");
    sh.addColorStop(1, "rgba(0,20,60,.28)");
    g.fillStyle = sh;
    g.fill(body);
  } else if (s.mark === "spots") {
    const r = mulberry32(4242);
    g.fillStyle = s.spotColor || "rgba(60,40,20,.34)";
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(-L * 0.35 + r() * L * 0.75, (r() - 0.5) * Hh * 0.8, L * 0.035, 0, 7);
      g.fill();
    }
  }
  // belly sheen
  const sheen = g.createLinearGradient(0, -Hh * 0.5, 0, 0);
  sheen.addColorStop(0, "rgba(255,255,255,.30)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fill(body);
  g.restore();

  // ---- pectoral fin ----
  g.save();
  g.translate(L * 0.14, Hh * 0.16);
  g.rotate(finWag * 0.5);
  g.fillStyle = s.fin;
  g.globalAlpha *= 0.8;
  g.beginPath();
  g.ellipse(-L * 0.07, 0, L * 0.10, Hh * 0.14, 0.4, 0, 7);
  g.fill();
  g.restore();

  // ---- barbels ----
  if (s.whisker) {
    g.strokeStyle = "rgba(120,104,78,.85)";
    g.lineWidth = Math.max(0.6, L * 0.016);
    g.lineCap = "round";
    for (const k of [-1, -0.35, 0.35]) {
      g.beginPath();
      g.moveTo(L * 0.44, Hh * 0.1);
      g.quadraticCurveTo(L * 0.6, Hh * (0.2 + k * 0.35), L * 0.72, Hh * (0.5 + k * 0.6));
      g.stroke();
    }
  }

  // ---- eye ----
  g.fillStyle = "#f6fbfb";
  g.beginPath();
  g.arc(L * 0.30, -Hh * 0.10, Math.max(1.6, L * 0.055), 0, 7);
  g.fill();
  g.fillStyle = "#0d1416";
  g.beginPath();
  g.arc(L * 0.315, -Hh * 0.10, Math.max(0.9, L * 0.030), 0, 7);
  g.fill();

  g.restore();
}

export function drawShrimpShape(g, s, L, phase, pale) {
  g.save();
  if (pale) g.globalAlpha *= 0.85;
  const legs = Math.sin(phase) * 0.4;

  // legs
  g.strokeStyle = shade(s.c1, -0.15);
  g.lineWidth = Math.max(0.7, L * 0.045);
  g.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const bx = -L * 0.18 + i * L * 0.14;
    g.beginPath();
    g.moveTo(bx, L * 0.12);
    g.lineTo(bx - L * 0.05, L * 0.28 + Math.sin(phase + i) * L * 0.04);
    g.stroke();
  }

  // body arc
  const grad = g.createLinearGradient(0, -L * 0.3, 0, L * 0.2);
  grad.addColorStop(0, s.c2);
  grad.addColorStop(1, s.c1);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(L * 0.44, 0);
  g.quadraticCurveTo(L * 0.10, -L * 0.34, -L * 0.26, -L * 0.16);
  g.quadraticCurveTo(-L * 0.44, -L * 0.06, -L * 0.40, L * 0.14);
  g.quadraticCurveTo(-L * 0.16, L * 0.20, L * 0.14, L * 0.12);
  g.quadraticCurveTo(L * 0.34, L * 0.06, L * 0.44, 0);
  g.fill();

  g.strokeStyle = "rgba(40,60,52,.28)";
  g.lineWidth = Math.max(0.6, L * 0.028);
  for (let i = 0; i < 4; i++) {
    const bx = L * 0.18 - i * L * 0.15;
    g.beginPath();
    g.moveTo(bx, -L * 0.24 + i * L * 0.02);
    g.quadraticCurveTo(bx - L * 0.04, 0, bx - L * 0.02, L * 0.14);
    g.stroke();
  }

  if (s.striped) {
    g.strokeStyle = "rgba(46,54,48,.42)";
    g.lineWidth = Math.max(0.5, L * 0.026);
    for (let i = 0; i < 4; i++) {
      const bx = L * 0.24 - i * L * 0.14;
      g.beginPath();
      g.moveTo(bx + L * 0.04, -L * 0.2);
      g.lineTo(bx - L * 0.05, L * 0.12);
      g.stroke();
    }
  }

  if (s.banded) {
    g.fillStyle = "rgba(255,252,250,.85)";
    for (let i = 0; i < 3; i++) {
      g.save();
      g.translate(L * 0.16 - i * L * 0.20, -L * 0.06);
      g.rotate(-0.25);
      g.fillRect(-L * 0.04, -L * 0.16, L * 0.075, L * 0.32);
      g.restore();
    }
  }

  // tail fan
  g.fillStyle = shade(s.c1, 0.12);
  g.beginPath();
  g.moveTo(-L * 0.36, -L * 0.04);
  g.lineTo(-L * 0.56, -L * 0.20 + legs * L * 0.05);
  g.lineTo(-L * 0.54, L * 0.20 + legs * L * 0.05);
  g.closePath();
  g.fill();

  // antennae
  g.strokeStyle = "rgba(230,246,244,.55)";
  g.lineWidth = Math.max(0.6, L * 0.035);
  g.beginPath();
  g.moveTo(L * 0.4, -L * 0.04);
  g.quadraticCurveTo(L * 0.72, -L * 0.22 + legs * L * 0.08, L * 0.92, -L * 0.10);
  g.moveTo(L * 0.4, 0);
  g.quadraticCurveTo(L * 0.70, L * 0.16 - legs * L * 0.08, L * 0.90, L * 0.20);
  g.stroke();

  // eye
  g.fillStyle = "#101a1c";
  g.beginPath();
  g.arc(L * 0.30, -L * 0.11, Math.max(1, L * 0.055), 0, 7);
  g.fill();
  g.restore();
}

export function drawHermitShape(g, s, L, phase) {
  g.save();

  // legs and claws first, so the shell sits over them
  g.strokeStyle = "#c07846";
  g.lineWidth = Math.max(0.8, L * 0.075);
  g.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const bx = L * (0.16 - i * 0.17);
    const k = Math.sin(phase + i * 1.7) * L * 0.07;
    g.beginPath();
    g.moveTo(bx, L * 0.08);
    g.quadraticCurveTo(bx + L * 0.16, L * 0.24 + k, bx + L * 0.08, L * 0.42);
    g.stroke();
  }

  g.fillStyle = "#d3874f";
  for (const c of [[0.46, 0.12, 0.15], [0.36, 0.28, 0.1]]) {
    g.beginPath();
    g.ellipse(L * c[0], L * c[1], L * c[2], L * c[2] * 0.72, -0.3, 0, 7);
    g.fill();
    g.strokeStyle = "rgba(120,64,32,.6)";
    g.lineWidth = Math.max(0.5, L * 0.03);
    g.beginPath();
    g.moveTo(L * (c[0] + c[2] * 0.5), L * (c[1] - c[2] * 0.3));
    g.lineTo(L * (c[0] + c[2] * 0.95), L * (c[1] + c[2] * 0.1));
    g.stroke();
  }

  // eye stalks
  g.strokeStyle = "#c07846";
  g.lineWidth = Math.max(0.6, L * 0.045);
  for (const k of [-1, 1]) {
    g.beginPath();
    g.moveTo(L * 0.3, L * 0.02);
    g.lineTo(L * 0.44, L * (-0.16 + k * 0.05));
    g.stroke();
  }
  g.fillStyle = "#221a12";
  for (const k of [-1, 1]) {
    g.beginPath();
    g.arc(L * 0.45, L * (-0.16 + k * 0.05), Math.max(0.8, L * 0.055), 0, 7);
    g.fill();
  }

  // borrowed shell
  g.save();
  g.translate(-L * 0.2, -L * 0.06);
  g.rotate(-0.22);
  const sg = g.createLinearGradient(0, -L * 0.42, 0, L * 0.3);
  sg.addColorStop(0, s.c2);
  sg.addColorStop(1, s.c1);
  g.fillStyle = sg;
  g.beginPath();
  g.ellipse(0, 0, L * 0.4, L * 0.34, 0, 0, 7);
  g.fill();
  g.strokeStyle = "rgba(58,38,20,.45)";
  g.lineWidth = Math.max(0.7, L * 0.05);
  g.beginPath();
  for (let a = 0; a < 11; a += 0.2) {
    const rr = L * 0.42 * (1 - a / 12);
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.86;
    a === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
  g.fillStyle = "rgba(255,255,255,.22)";
  g.beginPath();
  g.ellipse(-L * 0.14, -L * 0.16, L * 0.16, L * 0.1, -0.5, 0, 7);
  g.fill();
  g.restore();

  g.restore();
}

export function drawSnailShape(g, s, L, phase) {
  if (s.hermit) { drawHermitShape(g, s, L, phase); return; }
  g.save();
  // foot
  g.fillStyle = "#e5d7bd";
  g.beginPath();
  g.ellipse(0, L * 0.30, L * 0.52, L * 0.14, 0, 0, 7);
  g.fill();
  // shell spiral
  g.save();
  g.translate(-L * 0.04, -L * 0.02);
  const grad = g.createLinearGradient(0, -L * 0.4, 0, L * 0.3);
  grad.addColorStop(0, s.c2);
  grad.addColorStop(1, s.c1);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, L * 0.44, 0, 7);
  g.fill();
  g.strokeStyle = "rgba(30,22,14,.55)";
  g.lineWidth = Math.max(0.8, L * 0.06);
  g.beginPath();
  for (let a = 0; a < 12; a += 0.2) {
    const r = L * 0.44 * (1 - a / 13);
    const px = Math.cos(a + phase * 0.02) * r, py = Math.sin(a + phase * 0.02) * r;
    a === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
  // head
  g.fillStyle = "#e5d7bd";
  g.beginPath();
  g.ellipse(L * 0.46, L * 0.20, L * 0.16, L * 0.11, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#e5d7bd";
  g.lineWidth = Math.max(0.7, L * 0.05);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(L * 0.52, L * 0.14);
  g.lineTo(L * 0.66, L * 0.02 + Math.sin(phase) * L * 0.03);
  g.moveTo(L * 0.46, L * 0.12);
  g.lineTo(L * 0.56, -L * 0.04 + Math.cos(phase) * L * 0.03);
  g.stroke();
  g.restore();
}

export function drawEelShape(g, s, L, phase, ext, lean, seed, pale, current) {
  const e = clamp(ext, 0, 1);

  // the burrow itself, always visible
  g.fillStyle = "rgba(122,104,73,.5)";
  g.beginPath();
  g.ellipse(0, 0, L * 0.11, L * 0.032, 0, 0, 7);
  g.fill();
  if (e < 0.05) return;

  g.save();
  if (pale) g.globalAlpha *= 0.85;

  const N = 18;
  const swayAmp = L * 0.16 * (1 - Math.abs(lean) * 0.55);
  // a slow shared current makes a colony lean together, plus each eel's own wave
  const nx = t => (Math.sin(phase + t * 2.6) * swayAmp
                   + Math.sin(current) * L * 0.13 * t
                   + lean * L * 0.42) * Math.pow(t, 1.25) * e;
  const ny = t => -L * e * t;
  const hw = t => L * 0.084 * (1 - t * 0.17) + L * 0.012 * Math.max(0, 1 - t * 9);
  const headR = L * 0.098;

  const body = new Path2D();
  body.moveTo(nx(0) - hw(0), ny(0));
  for (let i = 1; i <= N; i++) { const t = i / N; body.lineTo(nx(t) - hw(t), ny(t)); }
  body.arc(nx(1), ny(1), hw(1), Math.PI, 0, true);
  for (let i = N; i >= 0; i--) { const t = i / N; body.lineTo(nx(t) + hw(t), ny(t)); }
  body.closePath();

  const grad = g.createLinearGradient(-L * 0.1, 0, L * 0.1, 0);
  grad.addColorStop(0, s.c1);
  grad.addColorStop(0.45, s.c2);
  grad.addColorStop(1, shade(s.c1, -0.14));
  g.fillStyle = grad;
  g.fill(body);

  // spotting: fine speckles plus the three big blotches
  g.save();
  g.clip(body);
  const r = mulberry32(seed);
  g.fillStyle = "rgba(66,62,54,.5)";
  for (let i = 0; i < 30; i++) {
    const t = r() * 0.88;
    g.beginPath();
    g.arc(nx(t) + (r() - 0.5) * hw(t) * 1.7, ny(t), L * 0.011, 0, 7);
    g.fill();
  }
  // two soft blotches, each pushed off-centre so they do not read as bands
  g.fillStyle = "rgba(54,50,44,.58)";
  for (const t of [0.26 + r() * 0.1, 0.58 + r() * 0.1]) {
    g.beginPath();
    g.ellipse(nx(t) + (r() - 0.5) * hw(t), ny(t), hw(t) * 0.95, L * 0.05, 0, 0, 7);
    g.fill();
  }
  // shaded side, so the body reads as round
  const shading = g.createLinearGradient(-hw(0.5) * 1.2, 0, hw(0.5) * 1.2, 0);
  shading.addColorStop(0, "rgba(70,62,48,.22)");
  shading.addColorStop(0.42, "rgba(70,62,48,0)");
  shading.addColorStop(0.78, "rgba(255,255,255,.11)");
  shading.addColorStop(1, "rgba(60,52,40,.18)");
  g.fillStyle = shading;
  g.fill(body);
  g.restore();

  // head
  const hx = nx(1), hy = ny(1);
  const tiltH = Math.atan2(nx(1) - nx(0.86), -(ny(1) - ny(0.86)));
  g.save();
  g.translate(hx, hy);
  g.rotate(tiltH);

  // The head silhouette is a cranium plus two bulging eyes and a snout.
  // Garden eels really do have eyes that stick out sideways, and the bumps
  // are what keeps this from reading as a smooth skull.
  const eyeDX = headR * 0.66;
  const eyeDY = -headR * 0.06;
  const bulge = headR * 0.46;
  const TAU = Math.PI * 2;

  const headPath = new Path2D();
  headPath.moveTo(headR * 0.8, -headR * 0.1);
  headPath.ellipse(0, -headR * 0.1, headR * 0.8, headR * 0.92, 0, 0, TAU);
  headPath.moveTo(-eyeDX + bulge, eyeDY);
  headPath.arc(-eyeDX, eyeDY, bulge, 0, TAU);
  headPath.moveTo(eyeDX + bulge, eyeDY);
  headPath.arc(eyeDX, eyeDY, bulge, 0, TAU);
  headPath.moveTo(headR * 0.44, headR * 0.6);
  headPath.ellipse(0, headR * 0.6, headR * 0.44, headR * 0.38, 0, 0, TAU);

  const hg = g.createRadialGradient(-headR * 0.3, -headR * 0.6, headR * 0.1,
                                    0, 0, headR * 1.5);
  hg.addColorStop(0, "#fffaec");
  hg.addColorStop(0.55, "#f2e9d5");
  hg.addColorStop(1, "#cfc2a6");
  g.fillStyle = hg;
  g.fill(headPath);

  // the body's speckling carries onto the head, so it reads as an animal
  g.save();
  g.clip(headPath);
  g.fillStyle = "rgba(96,86,66,.34)";
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.arc((r() - 0.5) * headR * 2.4, (r() - 0.5) * headR * 1.9, headR * 0.07, 0, 7);
    g.fill();
  }
  g.fillStyle = "rgba(226,138,122,.24)";
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * headR * 0.72, headR * 0.34, headR * 0.24, headR * 0.16, 0, 0, 7);
    g.fill();
  }
  g.restore();

  // eyes: beady, sitting in the bulges, with a warm rim rather than a hard edge
  const pr = Math.max(0.9, bulge * 0.66);
  for (const sx of [-1, 1]) {
    const ex = sx * eyeDX;
    g.fillStyle = "rgba(150,132,102,.35)";
    g.beginPath();
    g.arc(ex, eyeDY, pr * 1.22, 0, 7);
    g.fill();
    g.fillStyle = "#2b2318";
    g.beginPath();
    g.arc(ex, eyeDY, pr, 0, 7);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.95)";
    g.beginPath();
    g.arc(ex - pr * 0.3, eyeDY - pr * 0.34, Math.max(0.4, pr * 0.34), 0, 7);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.45)";
    g.beginPath();
    g.arc(ex + pr * 0.3, eyeDY + pr * 0.32, Math.max(0.25, pr * 0.16), 0, 7);
    g.fill();
  }

  // a small open mouth at the tip of the snout
  g.fillStyle = "rgba(94,66,52,.8)";
  g.beginPath();
  g.ellipse(0, headR * 0.78, headR * 0.17, headR * 0.13, 0, 0, 7);
  g.fill();
  g.restore();   // head transform
  g.restore();   // body
}

export function drawPet(g, p) {
  const s = SPECIES[p.key];
  const L = petPx(p);
  const pale = p.full < 0.25;

  g.save();
  g.translate(p.x, p.y);

  if (s.kind === "eel") {
    drawEelShape(g, s, L, p.phase, p.ext, p.lean, p.id * 977 + 13, pale, time * 0.33);
  } else if (s.kind === "fish") {
    const flip = p.vx < 0 ? -1 : 1;
    const tilt = clamp(Math.atan2(p.vy, Math.abs(p.vx) + 4), -0.55, 0.55);
    g.scale(flip, 1);
    g.rotate(tilt);
    drawFishShape(g, s, L, p.phase, pale);
  } else if (s.kind === "shrimp") {
    const flip = p.vx < 0 ? -1 : 1;
    g.scale(flip, 1);
    drawShrimpShape(g, s, L, p.phase, pale);
  } else {
    const flip = p.vx < 0 ? -1 : 1;
    g.scale(flip, 1);
    drawSnailShape(g, s, L, p.phase);
  }
  g.restore();

  const isEel = s.kind === "eel";
  const markY = isEel ? p.y - L * p.ext - L * 0.16 : p.y - L * 0.65;

  // hunger marker
  if (p.full < 0.22 && (!isEel || p.ext > 0.4)) {
    const a = 0.45 + Math.sin(time * 3 + p.id) * 0.25;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = "#ffb35c";
    g.beginPath();
    g.arc(p.x, markY, Math.max(1.8, L * 0.09), 0, 7);
    g.fill();
    g.restore();
  }

  // selection ring
  if (selection.type === "pet" && selection.id === p.id) {
    g.save();
    g.strokeStyle = "rgba(127,227,205,.85)";
    g.lineWidth = 1.6;
    g.setLineDash([4, 4]);
    g.lineDashOffset = -time * 14;
    g.beginPath();
    if (isEel) {
      g.ellipse(p.x, p.y - L * p.ext * 0.5, L * 0.3, L * p.ext * 0.62 + L * 0.12, 0, 0, 7);
    } else {
      g.ellipse(p.x, p.y, L * 0.78, L * 0.55, 0, 0, 7);
    }
    g.stroke();
    g.restore();
  }
}
