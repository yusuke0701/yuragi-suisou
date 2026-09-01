// かざりの描画。

import { BIOMES, SOLID_DECOR } from "../catalogue.js";
import { blobPath, curvePts, limbEdge, limbPath, strokePolyline } from "./shapes.js";
import { save, selection, tank } from "../state.js";
import { mulberry32 } from "../util.js";
import { decorPx, time } from "../view.js";

export function drawDecor(g, d, baseY, sizeOverride) {
  const s = sizeOverride || decorPx(d);
  const r = mulberry32(d.seed);
  g.save();
  g.translate(d.x, baseY);

  // where a solid object meets the sand
  if (SOLID_DECOR[d.key] && !sizeOverride) {
    const sg = g.createRadialGradient(0, 0, s * 0.04, 0, 0, s * 0.62);
    sg.addColorStop(0, "rgba(58,44,26,.34)");
    sg.addColorStop(1, "rgba(58,44,26,0)");
    g.fillStyle = sg;
    g.beginPath();
    g.ellipse(0, s * 0.02, s * 0.62, s * 0.1, 0, 0, 7);
    g.fill();
  }

  g.scale(d.flip, 1);

  switch (d.key) {
    case "plant": {
      const stems = 7;
      for (let i = 0; i < stems; i++) {
        const off = (i - (stems - 1) / 2) * s * 0.10 + (r() - 0.5) * s * 0.05;
        const h = s * (0.6 + r() * 0.55);
        const dark = i % 2 === 0;
        const sway = Math.sin(time * 0.8 + i * 0.8 + d.seed * 0.31) * s * 0.16;
        const stemX = t => off + sway * t * t;
        const stemY = t => -h * t;

        g.strokeStyle = dark ? "#2f7a49" : "#43955a";
        g.lineWidth = Math.max(1.4, s * 0.042);
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(off, 0);
        for (let k = 1; k <= 8; k++) { const t = k / 8; g.lineTo(stemX(t), stemY(t)); }
        g.stroke();

        const leaves = 5;
        for (let k = 1; k <= leaves; k++) {
          const t = k / (leaves + 0.6);
          const side = k % 2 ? 1 : -1;
          const grow = 1 - t * 0.45;
          g.save();
          g.translate(stemX(t), stemY(t));
          g.rotate(side * (0.95 - t * 0.35) - sway / s * 0.9);
          const lg = g.createLinearGradient(0, 0, s * 0.16 * grow, 0);
          lg.addColorStop(0, dark ? "#2f7a49" : "#43955a");
          lg.addColorStop(1, dark ? "#5fb573" : "#7ccb87");
          g.fillStyle = lg;
          g.beginPath();
          g.moveTo(0, 0);
          g.quadraticCurveTo(s * 0.09 * grow, -s * 0.055 * grow, s * 0.19 * grow, 0);
          g.quadraticCurveTo(s * 0.09 * grow, s * 0.055 * grow, 0, 0);
          g.fill();
          g.restore();
        }
      }
      break;
    }
    case "shell": {
      g.fillStyle = "#f0e3cc";
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, s * 0.5, Math.PI, 0);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(150,120,86,.5)";
      g.lineWidth = Math.max(0.7, s * 0.035);
      for (let i = 1; i < 5; i++) {
        const a = Math.PI + (Math.PI / 5) * i;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.48);
        g.stroke();
      }
      break;
    }
    case "liverock":
    case "rock": {
      const live = d.key === "liverock";
      const tones = live ? [
        ["#c9a2ac", "#8e6a7c", "#4b3843"],
        ["#b9a3a0", "#836f72", "#453a3c"],
        ["#c2aab6", "#8a7387", "#483c47"]
      ] : [
        ["#a2a6a1", "#6d726f", "#3e4444"],
        ["#a8a08c", "#77705f", "#443f34"],
        ["#98a1a6", "#6a7377", "#3b4245"]
      ];
      // back to front, so the smaller stones tuck in behind the main one
      const stones = [
        { x: -s * 0.30, w: s * 0.30, h: s * 0.24, t: 1 },
        { x:  s * 0.31, w: s * 0.26, h: s * 0.20, t: 2 },
        { x: -s * 0.02, w: s * 0.42, h: s * 0.36, t: 0 }
      ];
      for (const st of stones) {
        const tone = tones[st.t];
        const cy = -st.h * 0.82;
        const path = blobPath(st.x, cy, st.w, st.h, r, 8, 0.5);

        const grad = g.createLinearGradient(st.x, cy - st.h, st.x, cy + st.h);
        grad.addColorStop(0, tone[0]);
        grad.addColorStop(0.52, tone[1]);
        grad.addColorStop(1, tone[2]);
        g.fillStyle = grad;
        g.fill(path);

        g.save();
        g.clip(path);

        // sunlit top face
        g.fillStyle = "rgba(255,255,255,.16)";
        g.fill(blobPath(st.x - st.w * 0.12, cy - st.h * 0.52, st.w * 0.72, st.h * 0.44, r, 9, 0.4));

        // grain
        g.fillStyle = "rgba(30,32,30,.16)";
        for (let i = 0; i < 22; i++) {
          g.beginPath();
          g.arc(st.x + (r() - 0.5) * st.w * 2, cy + (r() - 0.5) * st.h * 2,
                s * (0.006 + r() * 0.012), 0, 7);
          g.fill();
        }

        // a crack or two
        g.strokeStyle = "rgba(28,30,29,.22)";
        g.lineWidth = Math.max(0.6, s * 0.011);
        g.lineJoin = "round";
        let cxp = st.x + (r() - 0.5) * st.w * 0.8;
        let cyp = cy - st.h * 0.7;
        g.beginPath();
        g.moveTo(cxp, cyp);
        for (let k = 0; k < 3; k++) {
          cxp += (r() - 0.4) * st.w * 0.4;
          cyp += st.h * (0.3 + r() * 0.25);
          g.lineTo(cxp, cyp);
        }
        g.stroke();

        // algae settling on the upper surface
        g.fillStyle = live ? "rgba(224,110,162,.5)" : "rgba(58,96,52,.34)";
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.ellipse(st.x + (r() - 0.5) * st.w * 1.5, cy - st.h * (0.35 + r() * 0.5),
                    st.w * (0.1 + r() * 0.18), st.h * 0.12, (r() - 0.5), 0, 7);
          g.fill();
        }
        g.restore();

        // shaded underside, drawn as a rim so the stone sits in the sand
        g.strokeStyle = "rgba(24,26,25,.22)";
        g.lineWidth = Math.max(0.7, s * 0.016);
        g.stroke(path);
      }
      break;
    }
    case "marimo": {
      const rr = s * 0.5;
      const cy = -rr;

      // irregular outline rather than a perfect ball
      const shape = blobPath(0, cy, rr, rr * 0.96, r, 14, 0.14);
      const grad = g.createRadialGradient(-rr * 0.34, cy - rr * 0.4, rr * 0.08, 0, cy, rr * 1.15);
      grad.addColorStop(0, "#8fd27a");
      grad.addColorStop(0.55, "#4f9a52");
      grad.addColorStop(1, "#255c33");
      g.fillStyle = grad;
      g.fill(shape);

      // fuzz: short tufts, denser and shorter than before
      g.lineCap = "round";
      for (let i = 0; i < 90; i++) {
        const a = r() * Math.PI * 2;
        const rad = rr * (0.86 + r() * 0.16);
        const len = rr * (0.05 + r() * 0.09);
        const lift = 1 - Math.max(0, Math.sin(a)) * 0.5;
        g.strokeStyle = "rgba(" + (r() > 0.5 ? "126,196,110" : "62,124,64") + ",.75)";
        g.lineWidth = Math.max(0.5, rr * 0.028);
        g.beginPath();
        g.moveTo(Math.cos(a) * rad * 0.94, cy + Math.sin(a) * rad * 0.94);
        g.lineTo(Math.cos(a) * (rad + len) * lift, cy + Math.sin(a) * (rad + len));
        g.stroke();
      }

      // highlight
      g.fillStyle = "rgba(190,240,170,.2)";
      g.beginPath();
      g.ellipse(-rr * 0.3, cy - rr * 0.42, rr * 0.4, rr * 0.24, -0.4, 0, 7);
      g.fill();
      break;
    }
    case "driftwood": {
      const limbs = [
        // trunk: buried at the left, thick, gently S-curved
        { pts: curvePts(-s * 0.50, -s * 0.03, -s * 0.14, -s * 0.26, s * 0.16, -s * 0.19, 16)
                 .concat(curvePts(s * 0.16, -s * 0.19, s * 0.34, -s * 0.16, s * 0.49, -s * 0.10, 8).slice(1)),
          w0: s * 0.21, w1: s * 0.055,
          wob: t => (0.3 + 0.7 * Math.min(1, t * 7)) * (1 + Math.sin(t * 11) * 0.12) },
        // main branch, rising and forking
        { pts: curvePts(-s * 0.20, -s * 0.16, -s * 0.16, -s * 0.44, s * 0.02, -s * 0.62, 13),
          w0: s * 0.115, w1: s * 0.022, wob: t => 1 + Math.sin(t * 8 + 1.7) * 0.16 },
        { pts: curvePts(-s * 0.10, -s * 0.42, s * 0.06, -s * 0.50, s * 0.22, -s * 0.47, 9),
          w0: s * 0.05, w1: s * 0.016, wob: t => 1 + Math.sin(t * 7 + 3) * 0.14 },
        // stubby broken limb
        { pts: curvePts(-s * 0.34, -s * 0.12, -s * 0.44, -s * 0.22, -s * 0.37, -s * 0.31, 8),
          w0: s * 0.075, w1: s * 0.03,
          wob: t => (0.5 + 0.5 * Math.min(1, t * 5)) * (1 + Math.sin(t * 9 + 2) * 0.12) }
      ];

      for (const limb of limbs) {
        const path = limbPath(limb.pts, limb.w0, limb.w1, limb.wob);
        const grad = g.createLinearGradient(0, -s * 0.62, 0, s * 0.02);
        grad.addColorStop(0, "#8b7351");
        grad.addColorStop(0.4, "#5c4630");
        grad.addColorStop(1, "#31251a");
        g.fillStyle = grad;
        g.fill(path);

        g.save();
        g.clip(path);

        // grain, running with the limb
        g.strokeStyle = "rgba(36,26,16,.3)";
        g.lineWidth = Math.max(0.5, s * 0.008);
        for (const f of [-0.62, -0.24, 0.18, 0.58]) {
          strokePolyline(g, limbEdge(limb.pts, limb.w0, limb.w1, f, limb.wob));
        }

        // light along the upper edge
        g.strokeStyle = "rgba(226,196,150,.42)";
        g.lineWidth = Math.max(0.8, s * 0.014);
        strokePolyline(g, limbEdge(limb.pts, limb.w0, limb.w1, -0.78, limb.wob));

        // dark underside
        g.strokeStyle = "rgba(20,14,9,.34)";
        g.lineWidth = Math.max(0.8, s * 0.018);
        strokePolyline(g, limbEdge(limb.pts, limb.w0, limb.w1, 0.82, limb.wob));

        // knots
        g.fillStyle = "rgba(30,21,13,.55)";
        for (let i = 0; i < 2; i++) {
          const pt = limb.pts[Math.floor(r() * limb.pts.length)];
          g.beginPath();
          g.ellipse(pt[0], pt[1], s * 0.024, s * 0.015, r() * 2, 0, 7);
          g.fill();
        }
        g.restore();
      }

      // sand heaped where the trunk goes under
      const sandTone = BIOMES[tank.biome].mound[tank.night ? 1 : 0];
      const mound = g.createRadialGradient(-s * 0.44, s * 0.01, s * 0.02, -s * 0.44, s * 0.01, s * 0.2);
      mound.addColorStop(0, "rgba(" + sandTone + ",.92)");
      mound.addColorStop(0.55, "rgba(" + sandTone + ",.8)");
      mound.addColorStop(1, "rgba(" + sandTone + ",0)");
      g.fillStyle = mound;
      g.beginPath();
      g.ellipse(-s * 0.44, s * 0.012, s * 0.2, s * 0.055, 0, 0, 7);
      g.fill();

      // moss matted along the buried end
      g.fillStyle = "rgba(72,118,64,.42)";
      for (let i = 0; i < 8; i++) {
        const bx = -s * 0.46 + r() * s * 0.42;
        g.beginPath();
        g.ellipse(bx, -s * 0.02 - r() * s * 0.045, s * (0.045 + r() * 0.04), s * 0.016,
                  (r() - 0.5) * 0.5, 0, 7);
        g.fill();
      }
      break;
    }
    case "coral": {
      const tipDots = [];
      const branch = (x, y, ang, len, w, depth) => {
        const sway = Math.sin(time * 0.6 + depth * 1.3 + d.seed * 0.21) * 0.07;
        const ex = x + Math.cos(ang + sway) * len;
        const ey = y + Math.sin(ang + sway) * len;
        const cx = x + Math.cos(ang - 0.2) * len * 0.6;
        const cy = y + Math.sin(ang - 0.2) * len * 0.6;
        const pts = curvePts(x, y, cx, cy, ex, ey, 8);
        const path = limbPath(pts, w, w * 0.6);

        const grad = g.createLinearGradient(x - w, y, x + w, y - len);
        grad.addColorStop(0, depth > 1 ? "#b8446a" : "#d4638b");
        grad.addColorStop(0.55, depth > 1 ? "#dd6f95" : "#f091b0");
        grad.addColorStop(1, "#ffc3d4");
        g.fillStyle = grad;
        g.fill(path);

        // rounded joint so the branches read as one organism
        g.beginPath();
        g.arc(x, y, w * 0.5, 0, 7);
        g.fill();

        // polyps
        g.save();
        g.clip(path);
        g.fillStyle = "rgba(255,225,235,.5)";
        for (let k = 0; k < 7; k++) {
          const t = k / 7;
          const pt = pts[Math.floor(t * (pts.length - 1))];
          g.beginPath();
          g.arc(pt[0] + (r() - 0.5) * w * 0.5, pt[1] + (r() - 0.5) * w * 0.5, w * 0.12, 0, 7);
          g.fill();
        }
        g.restore();

        if (depth <= 0) { tipDots.push([ex, ey, w * 0.6]); return; }
        branch(ex, ey, ang - 0.46 - r() * 0.16, len * 0.7, w * 0.62, depth - 1);
        branch(ex, ey, ang + 0.42 + r() * 0.16, len * 0.68, w * 0.6, depth - 1);
        if (depth === 3 && r() > 0.4) {
          branch(ex, ey, ang + (r() - 0.5) * 0.3, len * 0.55, w * 0.45, depth - 2);
        }
      };
      branch(0, 0, -Math.PI / 2, s * 0.3, s * 0.185, 3);

      // soft tips
      g.fillStyle = "rgba(255,198,216,.9)";
      for (const t of tipDots) {
        g.beginPath();
        g.arc(t[0], t[1], t[2] * 0.78, 0, 7);
        g.fill();
      }
      break;
    }
    case "leaves": {
      const tones = ["#9d6a33", "#b5813c", "#7d5228", "#a97c46", "#8b5f2c"];
      const leaf = (lx, ly, ang, len, wid, col) => {
        g.save();
        g.translate(lx, ly);
        g.rotate(ang);
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(-len / 2, 0);
        g.quadraticCurveTo(0, -wid, len / 2, 0);
        g.quadraticCurveTo(0, wid, -len / 2, 0);
        g.fill();
        g.strokeStyle = "rgba(66,44,22,.4)";
        g.lineWidth = Math.max(0.5, len * 0.035);
        g.beginPath();
        g.moveTo(-len / 2, 0);
        g.quadraticCurveTo(0, -wid * 0.15, len / 2, 0);
        g.stroke();
        g.restore();
      };
      for (let i = 0; i < 9; i++) {
        const lx = (r() - 0.5) * s * 0.9;
        const ly = -r() * s * 0.11;
        leaf(lx, ly, (r() - 0.5) * 1.3, s * (0.24 + r() * 0.14), s * (0.09 + r() * 0.06),
             tones[Math.floor(r() * tones.length)]);
      }
      break;
    }
    case "bamboo": {
      const len = s * 0.92, rad = s * 0.17;
      g.save();
      g.rotate(-0.06);
      const grad = g.createLinearGradient(0, -rad * 2, 0, 0);
      grad.addColorStop(0, "#d3cb8f");
      grad.addColorStop(0.5, "#a9a45f");
      grad.addColorStop(1, "#6e6b39");
      g.fillStyle = grad;
      g.beginPath();
      if (g.roundRect) g.roundRect(-len / 2, -rad * 2, len, rad * 2, rad * 0.35);
      else g.rect(-len / 2, -rad * 2, len, rad * 2);
      g.fill();

      // node rings
      g.strokeStyle = "rgba(84,80,40,.75)";
      g.lineWidth = Math.max(1, s * 0.022);
      for (const f of [-0.16, 0.3]) {
        g.beginPath();
        g.moveTo(len * f, -rad * 2);
        g.lineTo(len * f, 0);
        g.stroke();
        g.strokeStyle = "rgba(226,220,168,.5)";
        g.beginPath();
        g.moveTo(len * f + s * 0.022, -rad * 2);
        g.lineTo(len * f + s * 0.022, 0);
        g.stroke();
        g.strokeStyle = "rgba(84,80,40,.75)";
      }

      // hollow end, the part fish actually use
      g.fillStyle = "#3b3a22";
      g.beginPath();
      g.ellipse(-len / 2, -rad, rad * 0.42, rad, 0, 0, 7);
      g.fill();
      g.strokeStyle = "#cfc88b";
      g.lineWidth = Math.max(0.8, s * 0.018);
      g.stroke();

      // weathering
      g.fillStyle = "rgba(96,132,74,.28)";
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.ellipse(-len / 2 + r() * len, -rad * 2 + r() * rad * 1.9,
                  s * (0.03 + r() * 0.04), s * 0.018, (r() - 0.5), 0, 7);
        g.fill();
      }
      g.restore();
      break;
    }
    case "anemone": {
      const foot = s * 0.2, top = -s * 0.34;

      // column
      const cg = g.createLinearGradient(0, top, 0, 0);
      cg.addColorStop(0, "#d8b19c");
      cg.addColorStop(1, "#9c6f5f");
      g.fillStyle = cg;
      g.beginPath();
      g.moveTo(-foot, 0);
      g.quadraticCurveTo(-foot * 0.55, top * 0.6, -foot * 0.62, top);
      g.lineTo(foot * 0.62, top);
      g.quadraticCurveTo(foot * 0.55, top * 0.6, foot, 0);
      g.closePath();
      g.fill();

      // tentacles
      g.lineCap = "round";
      for (let i = 0; i < 24; i++) {
        const t = i / 23;
        const a = -Math.PI * 0.92 + t * Math.PI * 0.84;
        const len = s * (0.3 + ((i * 7) % 5) * 0.035);
        const sway = Math.sin(time * 1.1 + i * 0.9 + d.seed * 0.13) * 0.28;
        const bx = Math.cos(a) * foot * 0.66;
        const by = top + Math.sin(a) * s * 0.05;
        const ex = bx + Math.cos(a + sway) * len;
        const ey = by + Math.sin(a + sway) * len;
        g.strokeStyle = "rgba(216,150,168,.85)";
        g.lineWidth = Math.max(1, s * 0.032);
        g.beginPath();
        g.moveTo(bx, by);
        g.quadraticCurveTo(bx + Math.cos(a) * len * 0.5, by + Math.sin(a) * len * 0.5, ex, ey);
        g.stroke();
        g.fillStyle = "rgba(150,74,124,.85)";
        g.beginPath();
        g.arc(ex, ey, Math.max(0.9, s * 0.028), 0, 7);
        g.fill();
      }

      // oral disc
      g.fillStyle = "#c9857f";
      g.beginPath();
      g.ellipse(0, top, foot * 0.66, s * 0.05, 0, 0, 7);
      g.fill();
      g.fillStyle = "rgba(90,44,54,.7)";
      g.beginPath();
      g.ellipse(0, top, foot * 0.2, s * 0.018, 0, 0, 7);
      g.fill();
      break;
    }
    case "anubias": {
      // 太い根茎から、厚く丸い葉を低く広げる。水草とは形が別物になるように
      const leaves = 7;
      g.fillStyle = "#4a3a26";
      g.beginPath();
      g.ellipse(0, -s * 0.03, s * 0.2, s * 0.05, 0, 0, 7);
      g.fill();
      for (let i = 0; i < leaves; i++) {
        const a = -Math.PI * 0.92 + (i / (leaves - 1)) * Math.PI * 0.84;
        const len = s * (0.3 + ((i * 5) % 3) * 0.06);
        const sway = Math.sin(time * 0.5 + i * 1.1 + d.seed * 0.19) * 0.06;
        const ex = Math.cos(a + sway) * len, ey = -s * 0.04 + Math.sin(a + sway) * len * 0.8;

        g.strokeStyle = "#3b6f3a";
        g.lineWidth = Math.max(1, s * 0.022);
        g.beginPath();
        g.moveTo(0, -s * 0.04);
        g.lineTo(ex * 0.45, ey * 0.55);
        g.stroke();

        g.save();
        g.translate(ex * 0.45, ey * 0.55);
        g.rotate(Math.atan2(ey * 0.45, ex * 0.55));
        const lg = g.createLinearGradient(0, -s * 0.08, 0, s * 0.08);
        lg.addColorStop(0, "#3f8248");
        lg.addColorStop(1, "#1f4f2c");
        g.fillStyle = lg;
        g.beginPath();
        g.ellipse(len * 0.38, 0, len * 0.42, s * 0.085, 0, 0, 7);
        g.fill();
        g.strokeStyle = "rgba(120,190,130,.35)";
        g.lineWidth = Math.max(0.5, s * 0.008);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(len * 0.78, 0);
        g.stroke();
        g.restore();
      }
      break;
    }
    case "rotala": {
      // 細い茎の束。上ほど赤く色づく
      const stems = 9;
      for (let i = 0; i < stems; i++) {
        const off = (i - (stems - 1) / 2) * s * 0.075 + (r() - 0.5) * s * 0.04;
        const h = s * (0.55 + r() * 0.5);
        const sway = Math.sin(time * 0.7 + i * 0.7 + d.seed * 0.27) * s * 0.13;
        const sx = t => off + sway * t * t;
        const sy = t => -h * t;

        g.strokeStyle = "#5d7a3c";
        g.lineWidth = Math.max(1, s * 0.026);
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(off, 0);
        for (let k = 1; k <= 8; k++) g.lineTo(sx(k / 8), sy(k / 8));
        g.stroke();

        for (let k = 1; k <= 7; k++) {
          const t = k / 7.4;
          const warm = t * t;                       // 上へ行くほど赤い
          g.fillStyle = "rgb(" + Math.round(96 + warm * 130) + ","
                               + Math.round(132 - warm * 62) + ","
                               + Math.round(62 + warm * 46) + ")";
          for (const side of [-1, 1]) {
            g.save();
            g.translate(sx(t), sy(t));
            g.rotate(side * (1.1 - t * 0.3));
            g.beginPath();
            g.ellipse(s * 0.05, 0, s * 0.055, s * 0.018, 0, 0, 7);
            g.fill();
            g.restore();
          }
        }
      }
      break;
    }
    case "pipe": {
      const len = s * 0.86, rad = s * 0.19;
      g.save();
      g.rotate(0.05);
      const grad = g.createLinearGradient(0, -rad * 2, 0, 0);
      grad.addColorStop(0, "#d9855c");
      grad.addColorStop(0.5, "#b3603a");
      grad.addColorStop(1, "#6f3a22");
      g.fillStyle = grad;
      g.beginPath();
      if (g.roundRect) g.roundRect(-len / 2, -rad * 2, len, rad * 2, rad * 0.3);
      else g.rect(-len / 2, -rad * 2, len, rad * 2);
      g.fill();

      // 口の縁を一段太くする
      for (const side of [-1, 1]) {
        g.fillStyle = side < 0 ? "#c4703f" : "rgba(90,46,26,.5)";
        g.beginPath();
        if (g.roundRect) g.roundRect(side * (len / 2) - side * rad * 0.34, -rad * 2.12, rad * 0.34, rad * 2.24, rad * 0.18);
        else g.rect(side * (len / 2) - side * rad * 0.34, -rad * 2.12, rad * 0.34, rad * 2.24);
        g.fill();
      }

      g.fillStyle = "#3c2113";
      g.beginPath();
      g.ellipse(-len / 2 + rad * 0.1, -rad, rad * 0.4, rad * 0.95, 0, 0, 7);
      g.fill();
      g.strokeStyle = "#e0a077";
      g.lineWidth = Math.max(0.8, s * 0.018);
      g.stroke();

      g.fillStyle = "rgba(92,132,72,.26)";
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.ellipse(-len / 2 + r() * len, -rad * 2 + r() * rad * 1.9,
                  s * (0.03 + r() * 0.04), s * 0.016, (r() - 0.5), 0, 7);
        g.fill();
      }
      g.restore();
      break;
    }
    case "lantern": {
      const w = s * 0.34;
      const stone = (y, hw, hh, tone) => {
        const lg = g.createLinearGradient(-hw, 0, hw, 0);
        lg.addColorStop(0, tone[0]);
        lg.addColorStop(0.45, tone[1]);
        lg.addColorStop(1, tone[2]);
        g.fillStyle = lg;
        g.beginPath();
        if (g.roundRect) g.roundRect(-hw, y - hh, hw * 2, hh, hw * 0.12);
        else g.rect(-hw, y - hh, hw * 2, hh);
        g.fill();
      };
      const light = ["#b9b4a6", "#8f8a7c", "#5f5b50"];
      const dark = ["#a29d90", "#7b766a", "#514e45"];

      stone(0, w * 0.9, s * 0.07, dark);              // 基礎
      stone(-s * 0.06, w * 0.34, s * 0.22, light);    // 竿
      stone(-s * 0.27, w * 0.72, s * 0.07, dark);     // 中台
      stone(-s * 0.33, w * 0.62, s * 0.2, light);     // 火袋

      // 火袋の窓
      g.fillStyle = "rgba(38,34,26,.75)";
      g.beginPath();
      g.ellipse(0, -s * 0.43, w * 0.22, s * 0.07, 0, 0, 7);
      g.fill();

      // 笠（反りのある屋根）
      const rg = g.createLinearGradient(0, -s * 0.66, 0, -s * 0.46);
      rg.addColorStop(0, "#b4aea0");
      rg.addColorStop(1, "#6f6a5e");
      g.fillStyle = rg;
      g.beginPath();
      g.moveTo(0, -s * 0.66);                                   // てっぺん
      g.quadraticCurveTo(w * 0.55, -s * 0.58, w * 1.2, -s * 0.56);
      g.quadraticCurveTo(w * 1.3, -s * 0.5, w * 1.05, -s * 0.5);  // 反り上がった軒先
      g.quadraticCurveTo(w * 0.5, -s * 0.47, 0, -s * 0.47);
      g.quadraticCurveTo(-w * 0.5, -s * 0.47, -w * 1.05, -s * 0.5);
      g.quadraticCurveTo(-w * 1.3, -s * 0.5, -w * 1.2, -s * 0.56);
      g.quadraticCurveTo(-w * 0.55, -s * 0.58, 0, -s * 0.66);
      g.fill();
      g.strokeStyle = "rgba(60,56,48,.3)";
      g.lineWidth = Math.max(0.5, s * 0.009);
      g.beginPath();
      g.moveTo(0, -s * 0.66);
      g.lineTo(0, -s * 0.47);
      g.stroke();
      g.fillStyle = "#a8a294";
      g.beginPath();
      g.ellipse(0, -s * 0.66, w * 0.13, s * 0.045, 0, 0, 7);   // 宝珠
      g.fill();

      // 苔
      g.fillStyle = "rgba(88,124,66,.34)";
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.ellipse((r() - 0.5) * w * 1.8, -r() * s * 0.5,
                  s * (0.025 + r() * 0.035), s * 0.016, (r() - 0.5), 0, 7);
        g.fill();
      }
      break;
    }
    case "clam": {
      const w = s * 0.46, h = s * 0.24;
      // 下の殻・外套膜・上の殻の3段に分ける。重ねると玉に見えてしまう
      const shell = (yTop, yBase, tilt, flip) => {
        g.save();
        g.translate(0, yBase);
        g.rotate(tilt);
        const lg = g.createLinearGradient(0, yTop - yBase, 0, 0);
        lg.addColorStop(0, "#f7f0de");
        lg.addColorStop(1, "#bfad8e");
        g.fillStyle = lg;
        const dome = yTop - yBase;
        g.beginPath();
        g.moveTo(-w, 0);
        g.quadraticCurveTo(-w * 0.72, dome * 1.3, 0, dome);
        g.quadraticCurveTo(w * 0.72, dome * 1.3, w, 0);
        for (let k = 9; k >= 0; k--) {          // 合わせ目のぎざぎざ
          const x = -w + (k / 9) * w * 2;
          g.lineTo(x, k % 2 ? -flip * h * 0.14 : 0);
        }
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(126,108,82,.42)";
        g.lineWidth = Math.max(0.5, s * 0.011);
        for (let k = 1; k <= 6; k++) {
          const x = -w + (k / 7) * w * 2;
          g.beginPath();
          g.moveTo(x, 0);
          g.quadraticCurveTo(x * 0.66, dome * 0.72, x * 0.2, dome * 0.95);
          g.stroke();
        }
        g.restore();
      };

      shell(-h * 0.85, 0, 0.05, 1);            // 下の殻（砂に座る）

      const mg = g.createLinearGradient(-w, 0, w, 0);
      mg.addColorStop(0, "#146c98");
      mg.addColorStop(0.36, "#33cdb6");
      mg.addColorStop(0.7, "#7f5ad6");
      mg.addColorStop(1, "#146c98");
      g.fillStyle = mg;
      g.beginPath();
      g.moveTo(-w * 0.74, -h * 0.72);
      for (let k = 0; k <= 14; k++) {
        const t = k / 14;
        g.lineTo(-w * 0.74 + t * w * 1.48, -h * 1.2 - Math.sin(t * Math.PI * 3.5) * h * 0.14);
      }
      for (let k = 14; k >= 0; k--) {
        const t = k / 14;
        g.lineTo(-w * 0.74 + t * w * 1.48, -h * 0.68 + Math.sin(t * Math.PI * 2.5) * h * 0.09);
      }
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(240,255,252,.5)";
      for (let k = 0; k < 9; k++) {
        g.beginPath();
        g.arc(-w * 0.6 + k * w * 0.15, -h * 0.95 + Math.sin(k * 1.4) * h * 0.12, s * 0.017, 0, 7);
        g.fill();
      }

      shell(-h * 2.1, -h * 1.15, -0.11, -1);   // 上の殻を持ち上げて開いて見せる
      break;
    }
    case "airstone": {
      g.fillStyle = "#3c4a4e";
      g.beginPath();
      if (g.roundRect) g.roundRect(-s * 0.5, -s * 0.42, s, s * 0.42, s * 0.14);
      else g.rect(-s * 0.5, -s * 0.42, s, s * 0.42);
      g.fill();
      g.fillStyle = "#5c6d71";
      g.fillRect(-s * 0.42, -s * 0.36, s * 0.84, s * 0.08);
      if (sizeOverride) {
        g.strokeStyle = "rgba(216,246,255,.6)";
        g.lineWidth = Math.max(1, s * 0.05);
        for (let i = 0; i < 5; i++) {
          g.beginPath();
          g.arc((i - 2) * s * 0.22, -s * (0.7 + (i % 3) * 0.42), s * 0.1, 0, 7);
          g.stroke();
        }
      }
      break;
    }
    case "castle": {
      const bodyGrad = g.createLinearGradient(0, -s * 0.9, 0, 0);
      bodyGrad.addColorStop(0, "#9aa0a3");
      bodyGrad.addColorStop(1, "#5b6366");
      g.fillStyle = bodyGrad;
      g.fillRect(-s * 0.34, -s * 0.62, s * 0.68, s * 0.62);
      g.fillRect(-s * 0.52, -s * 0.82, s * 0.22, s * 0.82);
      g.fillRect(s * 0.30, -s * 0.74, s * 0.22, s * 0.74);
      // battlements
      g.fillStyle = "#7d8487";
      for (let i = 0; i < 3; i++) g.fillRect(-s * 0.52 + i * s * 0.085, -s * 0.9, s * 0.055, s * 0.09);
      for (let i = 0; i < 3; i++) g.fillRect(s * 0.30 + i * s * 0.085, -s * 0.82, s * 0.055, s * 0.09);
      for (let i = 0; i < 5; i++) g.fillRect(-s * 0.34 + i * s * 0.15, -s * 0.70, s * 0.09, s * 0.09);
      // door + windows
      g.fillStyle = "#20282a";
      g.beginPath();
      g.moveTo(-s * 0.09, 0);
      g.lineTo(-s * 0.09, -s * 0.22);
      g.arc(0, -s * 0.22, s * 0.09, Math.PI, 0);
      g.lineTo(s * 0.09, 0);
      g.closePath();
      g.fill();
      g.fillRect(-s * 0.46, -s * 0.62, s * 0.09, s * 0.13);
      g.fillRect(s * 0.36, -s * 0.56, s * 0.09, s * 0.13);
      // moss
      g.fillStyle = "rgba(80,140,80,.35)";
      g.fillRect(-s * 0.34, -s * 0.62, s * 0.68, s * 0.07);
      break;
    }
  }

  g.restore();

  if (selection.type === "decor" && selection.id === d.id) {
    g.save();
    g.strokeStyle = "rgba(127,227,205,.8)";
    g.lineWidth = 1.4;
    g.setLineDash([4, 4]);
    g.lineDashOffset = -time * 14;
    g.beginPath();
    g.ellipse(d.x, baseY - s * 0.28, s * 0.62, s * 0.5, 0, 0, 7);
    g.stroke();
    g.restore();
  }
}
