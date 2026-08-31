// 形をつくる汎用ヘルパ。石・流木・サンゴが使う。

import { lerp } from "../util.js";

export function blobPath(cx, cy, rx, ry, rand, n, rough) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - rough * 0.5 + rand() * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const path = new Path2D();
  let m = mid(pts[n - 1], pts[0]);
  path.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const mm = mid(p, q);
    path.quadraticCurveTo(p[0], p[1], mm[0], mm[1]);
  }
  path.closePath();
  return path;
}

// sample a quadratic bezier into a polyline

export function curvePts(x0, y0, cx, cy, x1, y1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * x0 + 2 * u * t * cx + t * t * x1,
              u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  return out;
}

// a line running parallel to a polyline, at `f` of its half width (-1..1);
// `wob` lets the width breathe so limbs are not perfect cones

export function limbEdge(pts, w0, w1, f, wob) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const w = lerp(w0, w1, t) * (wob ? wob(t) : 1) / 2;
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    out.push([p[0] - dy * w * f, p[1] + dx * w * f]);
  }
  return out;
}

export function limbPath(pts, w0, w1, wob) {
  const left = limbEdge(pts, w0, w1, 1, wob);
  const right = limbEdge(pts, w0, w1, -1, wob);
  const path = new Path2D();
  path.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) path.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) path.lineTo(right[i][0], right[i][1]);
  path.closePath();
  return path;
}

export function strokePolyline(g, pts) {
  g.beginPath();
  pts.forEach((pt, i) => (i === 0 ? g.moveTo(pt[0], pt[1]) : g.lineTo(pt[0], pt[1])));
  g.stroke();
}
