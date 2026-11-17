// Shared helper for themes where every group of icons gets its own region (sandbox, oasis, ...).
// A coarse grid holds a smooth distance field Ds to the icons (smooth-min, so neighbouring icons merge) and the
// plain distance Dm. From it: a soft mask, contour polylines (marching squares) and connected free areas.
const Zones = (() => {
  class Zones {
    constructor(R, K) { this.R = R; this.K = K || 20; this.sig = ''; }
    resize(env) {
      const W = env.W, H = env.H, c = this.cell = Math.max(4, Math.sqrt(W * H / 60000));
      this.gw = Math.ceil(W / c) + 1; this.gh = Math.ceil(H / c) + 1;
      this.Ds = new Float32Array(this.gw * this.gh); this.Dm = new Float32Array(this.gw * this.gh); this.comp = new Int16Array(this.gw * this.gh);
      this.mask = document.createElement('canvas'); this.mask.width = this.gw; this.mask.height = this.gh; this.img = this.mask.getContext('2d').createImageData(this.gw, this.gh);
      this.sig = '';
    }
    signature(icons) { let s = icons.length; for (const ic of icons) s += Math.round(ic.x) * 3 + Math.round(ic.y) * 7 + Math.round(ic.w) + Math.round(ic.a * 20) * 11; return s + ':' + icons.length; }
    update(icons) {
      const n = icons.length, gw = this.gw, gh = this.gh, c = this.cell, Ds = this.Ds, Dm = this.Dm, K = this.K, lim = this.R + K * 3;
      for (let j = 0; j < gh; j++) {
        const y = (j + 0.5) * c;
        for (let i = 0; i < gw; i++) {
          const x = (i + 0.5) * c; let sum = 0, mn = 1e4;
          for (let q = 0; q < n; q++) {
            const ic = icons[q], dx = Math.max(ic.x - x, 0, x - (ic.x + ic.w)), dy = Math.max(ic.y - y, 0, y - (ic.y + ic.h)), d = Math.hypot(dx, dy) + (1 - ic.a) * 90;
            if (d < mn) mn = d;
            if (d < lim) sum += Math.exp(-d / K);
          }
          const k = j * gw + i; Dm[k] = mn; Ds[k] = sum > 0 ? -K * Math.log(sum) : 1e4;
        }
      }
    }
    at(x, y) { const i = Math.floor(x / this.cell), j = Math.floor(y / this.cell); if (i < 0 || j < 0 || i >= this.gw || j >= this.gh) return -1; return j * this.gw + i; }
    ds(x, y) { const k = this.at(x, y); return k < 0 ? 1e4 : this.Ds[k]; }
    dm(x, y) { const k = this.at(x, y); return k < 0 ? 1e4 : this.Dm[k]; }
    // draws `tex` (full-size canvas) into `out` (identity transform) clipped to the zones, edge softened by one cell
    paint(out, tex, tmp, S) {
      const c = this.cell, u = new Uint32Array(this.img.data.buffer), n = this.gw * this.gh, Ds = this.Ds, R = this.R;
      for (let k = 0; k < n; k++) { const a = Math.max(0, Math.min(1, (R - Ds[k]) / (c * 1.1) + 0.5)); u[k] = Math.round(a * 255) << 24 | 0xffffff; }
      this.mask.getContext('2d').putImageData(this.img, 0, 0);
      const t = tmp.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, tmp.width, tmp.height);
      t.drawImage(tex, 0, 0); t.globalCompositeOperation = 'destination-in'; t.imageSmoothingEnabled = true; t.drawImage(this.mask, 0, 0, this.gw * c * S, this.gh * c * S); t.globalCompositeOperation = 'source-over';
      out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(tmp, 0, 0);
    }
    // contour at Ds = R as polylines (CSS px)
    lines() {
      const gw = this.gw, gh = this.gh, c = this.cell, F = this.Ds, R = this.R, pts = new Map(), adj = new Map();
      const key = (t, i, j) => (j * gw + i) * 2 + t;
      const pt = (t, i, j) => { const k = key(t, i, j); if (!pts.has(k)) { const a = F[j * gw + i] - R, b = t ? F[(j + 1) * gw + i] - R : F[j * gw + i + 1] - R, f = a / (a - b); pts.set(k, t ? [(i + 0.5) * c, (j + 0.5 + f) * c] : [(i + 0.5 + f) * c, (j + 0.5) * c]); } return k; };
      const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
      for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
        const a = F[j * gw + i] < R, b = F[j * gw + i + 1] < R, cc = F[(j + 1) * gw + i + 1] < R, d = F[(j + 1) * gw + i] < R, idx = (a ? 1 : 0) | (b ? 2 : 0) | (cc ? 4 : 0) | (d ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const T = () => pt(0, i, j), Rr = () => pt(1, i + 1, j), B = () => pt(0, i, j + 1), L = () => pt(1, i, j);
        switch (idx) {
          case 1: case 14: link(L(), T()); break; case 2: case 13: link(T(), Rr()); break; case 3: case 12: link(L(), Rr()); break;
          case 4: case 11: link(Rr(), B()); break; case 5: link(L(), T()); link(Rr(), B()); break; case 6: case 9: link(T(), B()); break;
          case 7: case 8: link(L(), B()); break; case 10: link(T(), Rr()); link(L(), B()); break;
        }
      }
      const seen = new Set(), lines = [];
      const walk = start => { const line = []; let prev = -1, cur = start; while (cur !== undefined && !seen.has(cur)) { seen.add(cur); line.push(pts.get(cur)); const nx = (adj.get(cur) || []).filter(k => k !== prev && !seen.has(k)); prev = cur; cur = nx[0]; } return line; };
      for (const [k, nb] of adj) if (nb.length === 1 && !seen.has(k)) lines.push(walk(k));
      for (const [k] of adj) if (!seen.has(k)) { const l = walk(k); if (l.length > 2) { l.push(l[0]); lines.push(l); } }
      return lines;
    }
    // connected areas where free(k) is true; each {cells, area}
    components(free) {
      const gw = this.gw, gh = this.gh, comp = this.comp, c = this.cell, list = [], stack = [];
      comp.fill(-1);
      for (let s = 0; s < gw * gh; s++) {
        if (comp[s] !== -1 || !free(s)) continue;
        const id = list.length, cells = []; comp[s] = id; stack.push(s);
        while (stack.length) {
          const k = stack.pop(); cells.push(k); const i = k % gw, j = (k / gw) | 0;
          if (i > 0 && comp[k - 1] === -1 && free(k - 1)) { comp[k - 1] = id; stack.push(k - 1); }
          if (i < gw - 1 && comp[k + 1] === -1 && free(k + 1)) { comp[k + 1] = id; stack.push(k + 1); }
          if (j > 0 && comp[k - gw] === -1 && free(k - gw)) { comp[k - gw] = id; stack.push(k - gw); }
          if (j < gh - 1 && comp[k + gw] === -1 && free(k + gw)) { comp[k + gw] = id; stack.push(k + gw); }
        }
        list.push({ cells, area: cells.length * c * c });
      }
      return list;
    }
    cellPoint(k) { return { x: (k % this.gw + 0.5) * this.cell, y: (Math.floor(k / this.gw) + 0.5) * this.cell }; }
  }
  return Zones;
})();
