// Theme "Pasture": a patchwork of fields seen from above. Every group of icons sits in its own fenced meadow
// where cows and horses graze. Neighbouring icons merge into one bigger pasture. Fence lines come from marching
// squares on a coarse distance grid; everything static is cached and only rebuilt when icons move.
IconIsland.theme({
  params: { animals: 1, mix: 0.35, flowers: 0.6 },

  R: 66,                                       // pasture margin around icons (px)
  _gw: 0, _gh: 0, _cell: 4, _Ds: null, _Dm: null, _comp: null, _comps: [], _sig: '', _lastCompose: -9, _bal: 0,
  _herd: null, _bg: null, _grass: null, _comp_c: null, _tmp: null, _mask: null, _clouds: [], _fk: '', _seed: 1,

  init(env, seed) {
    this._seed = seed; this._sig = ''; this._herd = new Fauna.Herd(); this._fk = '';
    const r = env.rng(seed + 5);
    this._clouds = Array.from({ length: 4 }, () => ({ x: r() * env.W, y: r() * env.H, s: 0.8 + r() * 0.9, v: 5 + r() * 6 }));
  },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1;
    const cell = Math.max(4, Math.sqrt(W * H / 60000));
    this._cell = cell; this._gw = Math.ceil(W / cell) + 1; this._gh = Math.ceil(H / cell) + 1;
    this._Ds = new Float32Array(this._gw * this._gh); this._Dm = new Float32Array(this._gw * this._gh); this._comp = new Int16Array(this._gw * this._gh);
    this._mask = mk(this._gw, this._gh); this._mimg = this._mask.getContext('2d').createImageData(this._gw, this._gh);
    this._tmp = mk(cw, ch); this._comp_c = mk(cw, ch);
    const r = env.rng(seed + 17);

    // ---- surrounding countryside: a patchwork of fields with hedges (low-res pixel pass, upscaled)
    const sc = 3, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2, small = mk(lw, lh), sg = small.getContext('2d'), img = sg.createImageData(lw, lh), u = new Uint32Array(img.data.buffer);
    const pal = [[159, 207, 90], [181, 214, 95], [216, 207, 104], [127, 184, 72], [201, 196, 87], [143, 191, 80], [230, 217, 122], [111, 174, 68], [170, 203, 98]];
    const ids = new Int32Array(lw * lh), st = new Uint8Array(lw * lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const x = i * sc, y = j * sc, wx = x + (env.noise(x / 200, y / 200, seed + 2) - 0.5) * 190, wy = y + (env.noise(x / 200 + 9, y / 200, seed + 3) - 0.5) * 190;
      const fx = Math.floor(wx / 280), fy = Math.floor(wy / 200);
      ids[j * lw + i] = (fx * 73856093) ^ (fy * 19349663);
    }
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const k = j * lw + i, id = ids[k], h = env.hash(id, id >> 3, seed), p = pal[Math.floor(h * pal.length)];
      const x = i * sc, y = j * sc, n = env.fbm(x / 60, y / 60, seed + 6, 3) - 0.5;
      let sh = 1 + n * 0.16;
      if (h > 0.45) { const ang = h * 6.28, s = Math.sin((x * Math.cos(ang) + y * Math.sin(ang)) / 6.5); sh += s * 0.035; }   // mown rows
      let R = p[0] * sh, G = p[1] * sh, B = p[2] * sh;
      const edge = (i + 1 < lw && ids[k + 1] !== id) || (j + 1 < lh && ids[k + lw] !== id);
      if (edge && (ids[k] & 7) < 5) { R *= 0.6; G *= 0.72; B *= 0.55; }
      u[k] = 255 << 24 | Math.min(255, B) << 16 | Math.min(255, G) << 8 | Math.min(255, R);
    }
    sg.putImageData(img, 0, 0);
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(small, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 52000; i < n; i++) {                                  // lone trees
      const x = r() * W, y = r() * H, z = 14 + r() * 12;
      b.fillStyle = 'rgba(20,40,10,0.25)'; b.beginPath(); b.ellipse(x + z * 0.5, y + z * 0.6, z, z * 0.85, 0, 0, 7); b.fill();
      const g = b.createRadialGradient(x - z * 0.3, y - z * 0.3, 1, x, y, z);
      g.addColorStop(0, '#79b84a'); g.addColorStop(1, '#2f6a2e'); b.fillStyle = g; b.beginPath(); b.arc(x, y, z, 0, 7); b.fill();
    }
    this._bg = bg;

    // ---- meadow grass texture: mottled green, soft stripes, tufts, flowers
    const gt = mk(cw, ch), g = gt.getContext('2d'); g.scale(S, S);
    const base = mk(lw, lh), bc = base.getContext('2d'), bi = bc.createImageData(lw, lh), bu = new Uint32Array(bi.data.buffer);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const x = i * sc, y = j * sc, n = env.fbm(x / 90, y / 90, seed + 12, 3), m = env.noise(x / 18, y / 18, seed + 13), s = Math.sin((x + y * 0.6) / 22) * 0.025;
      const t = n * 0.9 + m * 0.2 + s;
      bu[j * lw + i] = 255 << 24 | Math.round(58 + t * 50) << 16 | Math.round(158 + t * 56) << 8 | Math.round(88 + t * 44);
    }
    bc.putImageData(bi, 0, 0); g.drawImage(base, 0, 0, lw * sc, lh * sc);
    g.lineCap = 'round';
    for (let i = 0, n = W * H / 380; i < n; i++) {
      const x = r() * W, y = r() * H, l = 3 + r() * 5;
      g.globalAlpha = 0.25 + r() * 0.25; g.strokeStyle = r() < 0.5 ? '#3f8a3a' : '#a6dc6a'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke();
    }
    g.globalAlpha = 1;
    const fl = P.flowers, cols = ['#ffffff', '#fff1a8', '#ffd24a', '#f7a8c8', '#d9b8f5', '#ffffff'];
    for (let i = 0, n = W * H / 900 * fl; i < n; i++) {                              // flowers in clusters
      const cx = r() * W, cy = r() * H, m = 2 + Math.floor(r() * 5), col = cols[Math.floor(r() * cols.length)];
      for (let q = 0; q < m; q++) {
        const x = cx + (r() - 0.5) * 22, y = cy + (r() - 0.5) * 16;
        g.fillStyle = col; g.beginPath(); g.arc(x, y, 1.1 + r() * 0.9, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,200,40,0.9)'; g.fillRect(x - 0.3, y - 0.3, 0.7, 0.7);
      }
    }
    this._grass = gt;
    this._fk = String(P.flowers);

    // ---- cloud-shadow sprite
    const cs = mk(360, 200), c = cs.getContext('2d');
    for (let i = 0; i < 6; i++) {
      const x = 90 + r() * 180, y = 60 + r() * 80, rad = 50 + r() * 50, gr = c.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(10,40,20,0.5)'); gr.addColorStop(1, 'rgba(10,40,20,0)'); c.fillStyle = gr; c.fillRect(0, 0, 360, 200);
    }
    this._cloud = cs;
    this._sig = ''; this._lastCompose = -9;
  },

  _signature(icons) { let s = icons.length; for (const ic of icons) s += Math.round(ic.x) * 3 + Math.round(ic.y) * 7 + Math.round(ic.w) + Math.round(ic.a * 20) * 11; return s + ':' + icons.length; },

  _fields(env) {
    const icons = env.icons, n = icons.length, gw = this._gw, gh = this._gh, c = this._cell, Ds = this._Ds, Dm = this._Dm, K = 20, R = this.R, lim = R + K * 3;
    for (let j = 0; j < gh; j++) {
      const y = (j + 0.5) * c;
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * c; let sum = 0, mn = 1e4;
        for (let q = 0; q < n; q++) {
          const ic = icons[q], dx = Math.max(ic.x - x, 0, x - (ic.x + ic.w)), dy = Math.max(ic.y - y, 0, y - (ic.y + ic.h)), d = Math.hypot(dx, dy) + (1 - ic.a) * 90;
          if (d < mn) mn = d;
          if (d < lim) sum += Math.exp(-d / K);
        }
        const k = j * gw + i;
        Dm[k] = mn; Ds[k] = sum > 0 ? -K * Math.log(sum) : 1e4;
      }
    }
  },

  // connected free areas (where animals may walk), with a list of usable cells per area
  _components() {
    const gw = this._gw, gh = this._gh, c = this._cell, Ds = this._Ds, Dm = this._Dm, comp = this._comp, R = this.R;
    comp.fill(-1);
    const free = k => Ds[k] < R - 16 && Dm[k] > 12, list = [], stack = [];
    for (let s = 0; s < gw * gh; s++) {
      if (comp[s] !== -1 || !free(s)) continue;
      const id = list.length, cells = []; comp[s] = id; stack.push(s);
      while (stack.length) {
        const k = stack.pop(); cells.push(k);
        const i = k % gw, j = (k / gw) | 0;
        if (i > 0 && comp[k - 1] === -1 && free(k - 1)) { comp[k - 1] = id; stack.push(k - 1); }
        if (i < gw - 1 && comp[k + 1] === -1 && free(k + 1)) { comp[k + 1] = id; stack.push(k + 1); }
        if (j > 0 && comp[k - gw] === -1 && free(k - gw)) { comp[k - gw] = id; stack.push(k - gw); }
        if (j < gh - 1 && comp[k + gw] === -1 && free(k + gw)) { comp[k + gw] = id; stack.push(k + gw); }
      }
      list.push({ cells, area: cells.length * c * c });
    }
    this._comps = list;
  },

  // fence polylines: marching squares on (Ds - R), crossings chained into lines
  _fenceLines() {
    const gw = this._gw, gh = this._gh, c = this._cell, F = this._Ds, R = this.R, pts = new Map(), adj = new Map();
    const key = (t, i, j) => (j * gw + i) * 2 + t;                    // t=0 horizontal edge (i,j)-(i+1,j); t=1 vertical edge (i,j)-(i,j+1)
    const pt = (t, i, j) => {
      const k = key(t, i, j);
      if (!pts.has(k)) {
        const a = F[j * gw + i] - R, b = t ? F[(j + 1) * gw + i] - R : F[j * gw + i + 1] - R, f = a / (a - b);
        pts.set(k, t ? [(i + 0.5) * c, (j + 0.5 + f) * c] : [(i + 0.5 + f) * c, (j + 0.5) * c]);
      }
      return k;
    };
    const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
    for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
      const a = F[j * gw + i] < R, b = F[j * gw + i + 1] < R, cc = F[(j + 1) * gw + i + 1] < R, d = F[(j + 1) * gw + i] < R;
      const idx = (a ? 1 : 0) | (b ? 2 : 0) | (cc ? 4 : 0) | (d ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const T = () => pt(0, i, j), Rr = () => pt(1, i + 1, j), B = () => pt(0, i, j + 1), L = () => pt(1, i, j);
      switch (idx) {
        case 1: case 14: link(L(), T()); break;
        case 2: case 13: link(T(), Rr()); break;
        case 3: case 12: link(L(), Rr()); break;
        case 4: case 11: link(Rr(), B()); break;
        case 5: link(L(), T()); link(Rr(), B()); break;
        case 6: case 9: link(T(), B()); break;
        case 7: case 8: link(L(), B()); break;
        case 10: link(T(), Rr()); link(L(), B()); break;
      }
    }
    const seen = new Set(), lines = [];
    const walk = start => {
      const line = []; let prev = -1, cur = start;
      while (cur !== undefined && !seen.has(cur)) {
        seen.add(cur); line.push(pts.get(cur));
        const nx = (adj.get(cur) || []).filter(k => k !== prev && !seen.has(k));
        prev = cur; cur = nx[0];
      }
      return line;
    };
    for (const [k, nb] of adj) if (nb.length === 1 && !seen.has(k)) lines.push(walk(k));
    for (const [k] of adj) if (!seen.has(k)) { const l = walk(k); if (l.length > 2) { l.push(l[0]); lines.push(l); } }
    return lines;
  },

  _compose(env) {
    const { W, H, S } = env, cw = env.cv.width, ch = env.cv.height, c = this._cell;
    this._fields(env); this._components();
    // mask: inside the fence = 1, soft edge of about one cell
    const m = this._mask.getContext('2d'), u = new Uint32Array(this._mimg.data.buffer), n = this._gw * this._gh, Ds = this._Ds, R = this.R;
    for (let k = 0; k < n; k++) { const a = Math.max(0, Math.min(1, (R - Ds[k]) / (c * 1.1) + 0.5)); u[k] = Math.round(a * 255) << 24 | 0xffffff; }
    m.putImageData(this._mimg, 0, 0);
    const t = this._tmp.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, cw, ch);
    t.drawImage(this._grass, 0, 0);
    t.globalCompositeOperation = 'destination-in'; t.imageSmoothingEnabled = true; t.drawImage(this._mask, 0, 0, this._gw * c * S, this._gh * c * S);
    t.globalCompositeOperation = 'source-over';
    const o = this._comp_c.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._bg, 0, 0);
    // soft shade just outside the fence, then the meadow
    o.drawImage(this._tmp, 0, 0);
    o.setTransform(S, 0, 0, S, 0, 0);
    for (const ic of env.icons) {                                     // warm glow behind each icon
      const cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2, r = Math.max(ic.w, ic.h) * 1.15, gr = o.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(255,248,190,${0.3 * ic.a})`); gr.addColorStop(1, 'rgba(255,248,190,0)'); o.fillStyle = gr; o.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    const lines = this._fenceLines();
    o.lineCap = 'round'; o.lineJoin = 'round';
    const trace = (line, dx, dy) => { o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0] + dx, p[1] + dy) : o.moveTo(p[0] + dx, p[1] + dy)); };
    for (const line of lines) {
      if (line.length < 3) continue;
      trace(line, 2.2, 3); o.strokeStyle = 'rgba(15,35,10,0.28)'; o.lineWidth = 5; o.stroke();
      trace(line, 0, 0); o.strokeStyle = '#7a5530'; o.lineWidth = 3.6; o.stroke();
      o.strokeStyle = '#b98d58'; o.lineWidth = 1.5; trace(line, -0.4, -0.5); o.stroke();
      let acc = 0, nextPost = 6;                                        // posts every ~22 px
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1], b = line[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
        acc += seg;
        if (acc >= nextPost) {
          nextPost = acc + 22;
          o.fillStyle = 'rgba(15,35,10,0.3)'; o.beginPath(); o.arc(b[0] + 1.8, b[1] + 2.4, 3.2, 0, 7); o.fill();
          o.fillStyle = '#5a3e22'; o.beginPath(); o.arc(b[0], b[1], 3.1, 0, 7); o.fill();
          o.fillStyle = '#c9a06a'; o.beginPath(); o.arc(b[0] - 0.6, b[1] - 0.7, 1.5, 0, 7); o.fill();
        }
      }
    }
    o.setTransform(1, 0, 0, 1, 0, 0);
  },

  _open(x, y) {
    const c = this._cell, i = Math.floor(x / c), j = Math.floor(y / c);
    if (i < 0 || j < 0 || i >= this._gw || j >= this._gh) return 0;
    const k = j * this._gw + i, a = Math.max(0, Math.min(1, (this.R - 10 - this._Ds[k]) / 12)), b = Math.max(0, Math.min(1, (this._Dm[k] - 6) / 10));
    return a * b;
  },

  _pick(comp) {
    const cs = comp === undefined ? this._comps : [this._comps[comp]];
    let total = 0; for (const q of cs) if (q) total += q.cells.length;
    if (!total) return null;
    let r = Math.random() * total;
    for (const q of cs) { if (!q) continue; if (r < q.cells.length) { const k = q.cells[Math.floor(r)], c = this._cell; return { x: (k % this._gw + 0.5) * c, y: (Math.floor(k / this._gw) + 0.5) * c }; } r -= q.cells.length; }
    return null;
  },

  _balance(env) {
    const P = env.P, herd = this._herd, counts = this._comps.map(() => 0), c = this._cell;
    for (const a of herd.list) {
      if (a.leaving) continue;
      const i = Math.floor(a.x / c), j = Math.floor(a.y / c), id = i >= 0 && j >= 0 && i < this._gw && j < this._gh ? this._comp[j * this._gw + i] : -1;
      a.cid = id; if (id >= 0) counts[id]++;
    }
    let total = herd.list.length;
    this._comps.forEach((q, id) => {
      const want = P.animals <= 0 ? 0 : Math.min(14, Math.max(1, Math.round(q.area / 15000 * P.animals)));
      if (counts[id] < want && total < 70) {
        const p = this._pick(id); if (!p) return;
        herd.add(Math.random() < P.mix ? 'horse' : 'cow', p.x, p.y, true); total++;
      } else if (counts[id] > want) {
        const a = herd.list.find(z => z.cid === id && !z.leaving); if (a) a.leaving = true;
      }
    });
    for (const a of herd.list) if (!a.leaving && a.cid < 0 && (a.lostT = (a.lostT || 0) + 1) > 2) a.leaving = true;
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, icons = env.icons;
    if (String(P.flowers) !== this._fk) this.rebuild(env);
    const sig = this._signature(icons);
    if (sig !== this._sig && (frameN - this._lastCompose >= 2 || !this._sig)) { this._sig = sig; this._lastCompose = frameN; this._compose(env); this._bal = 0; }
    this._bal -= dt; if (this._bal <= 0 && this._sig) { this._bal = 1; this._balance(env); }

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp_c, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    this._herd.step(dt, t, (x, y) => this._open(x, y), () => this._pick());
    this._herd.draw(ctx, t);

    // slow cloud shadows drifting across the fields
    for (const cl of this._clouds) {
      cl.x += cl.v * dt; if (cl.x > W + 200) { cl.x = -200; cl.y = Math.random() * H; }
      ctx.globalAlpha = 0.16; ctx.drawImage(this._cloud, cl.x - 180 * cl.s, cl.y - 100 * cl.s, 360 * cl.s * 1.3, 200 * cl.s * 1.3);
    }
    ctx.globalAlpha = 1;
  },
});
