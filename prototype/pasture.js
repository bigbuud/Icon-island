// Theme "Pasture": a patchwork of fields seen from above. Every group of icons sits in its own fenced meadow
// where cows and horses graze. Neighbouring icons merge into one bigger pasture. Fence lines come from marching
// squares on a coarse distance grid; everything static is cached and only rebuilt when icons move.
IconIsland.theme({
  params: { animals: 1, mix: 0.35, flowers: 0.6 },

  R: 66,                                       // pasture margin around icons (px)
  _gw: 0, _gh: 0, _cell: 4, _Ds: null, _Dm: null, _comp: null, _comps: [], _sig: '', _lastCompose: -9, _bal: 0,
  _herd: null, _bg: null, _grass: null, _comp_c: null, _tmp: null, _mask: null, _clouds: [], _fk: '', _seed: 1,

  init(env, seed) {
    this._seed = seed; this._sig = ''; this._herd = new Fauna.Herd(); this._herd.kindScale = { cow: 0.68, horse: 0.7 }; this._fk = '';
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

    // ---- surrounding countryside: big organic fields (meadow, wheat, crop rows) with bush hedges, paths, ponds, trees, farm buildings
    const sc = 2, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2, small = mk(lw, lh), sg = small.getContext('2d'), img = sg.createImageData(lw, lh), u = new Uint32Array(img.data.buffer);
    const meadow = [[140, 198, 90], [124, 189, 78], [148, 204, 98], [132, 194, 84]];
    const ids = new Int32Array(lw * lh), typ = new Uint8Array(lw * lh), fk = new Uint8Array(lw * lh), hedgePts = new Map(), obst = [];
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const x = i * sc, y = j * sc, wx = x + (env.noise(x / 230, y / 230, seed + 2) - 0.5) * 230, wy = y + (env.noise(x / 230 + 9, y / 230, seed + 3) - 0.5) * 230;
      ids[j * lw + i] = (Math.floor(wx / 330) * 73856093) ^ (Math.floor(wy / 240) * 19349663);
    }
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const k = j * lw + i, id = ids[k], h = env.hash(id, id >> 3, seed), x = i * sc, y = j * sc;
      let R, G, B, sh = 1 + (env.fbm(x / 110, y / 110, seed + 6, 3) - 0.5) * 0.14;
      typ[k] = (h < 0.5 || h > 0.9) ? 1 : 0; fk[k] = typ[k] ? 1 : h < 0.72 ? 2 : 3;
      const ang = h * 3.14 + 0.3, along = x * Math.cos(ang) + y * Math.sin(ang);
      if (h < 0.5 || h > 0.9) { const m = meadow[Math.floor(h * 977) % 4]; [R, G, B] = m; sh += Math.sin(along / 9) * 0.012; }
      else if (h < 0.72) { const st = Math.sin(along / 2.1) * 0.5 + 0.5; [R, G, B] = [232 - st * 20, 188 - st * 20, 76 - st * 12]; sh += (env.noise(x / 40, y / 40, seed + 8) - 0.5) * 0.1; }
      else { const st = Math.sin(along / 3.2) * 0.5 + 0.5; [R, G, B] = [118 + st * 30, 176 + st * 24, 62 + st * 14]; }
      u[k] = 255 << 24 | Math.min(255, B * sh) << 16 | Math.min(255, G * sh) << 8 | Math.min(255, R * sh);
      const edge = (i + 1 < lw && ids[k + 1] !== id) || (j + 1 < lh && ids[k + lw] !== id);
      if (edge && ((id >> 2) & 3) !== 0) { const key = Math.floor(x / 9) + ',' + Math.floor(y / 9); if (!hedgePts.has(key)) hedgePts.set(key, [x, y, (id >> 2) & 3]); }
    }
    sg.putImageData(img, 0, 0);
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(small, 0, 0, lw * sc, lh * sc);
    const bush = (x, y, z, dark) => {
      b.fillStyle = 'rgba(20,45,10,0.28)'; b.beginPath(); b.ellipse(x + z * 0.35, y + z * 0.5, z, z * 0.9, 0, 0, 7); b.fill();
      const g = b.createRadialGradient(x - z * 0.35, y - z * 0.35, 0.5, x, y, z);
      g.addColorStop(0, dark ? '#5aa03c' : '#8ccc58'); g.addColorStop(1, dark ? '#2d6a2c' : '#3f8a36'); b.fillStyle = g; b.beginPath(); b.arc(x, y, z, 0, 7); b.fill();
    };
    // --- winding dirt roads (two across, one down); everything else is placed relative to them
    const paths = [];
    for (let q = 0; q < 3; q++) {
      const pts = [], ph = r() * 6, vert = q === 2, base = vert ? W * (0.3 + r() * 0.4) : H * (0.25 + q * 0.42) + r() * 50;
      for (let t = -20; t <= (vert ? H : W) + 20; t += 12) { const w = Math.sin(t / 260 + ph) * 80 + (env.noise(t / 90, q, seed + 31) - 0.5) * 50; pts.push(vert ? [base + w, t] : [t, base + w]); }
      paths.push(pts);
    }
    const dPath = (x, y) => { let m = 1e9; for (const pts of paths) for (const p of pts) { const d = Math.abs(p[0] - x) + Math.abs(p[1] - y); if (d < m * 1.5) { const e = Math.hypot(p[0] - x, p[1] - y); if (e < m) m = e; } } return m; };
    const road = (pts, wdt) => {
      const tr = (dx, dy) => { b.beginPath(); pts.forEach((p, i) => i ? b.lineTo(p[0] + dx, p[1] + dy) : b.moveTo(p[0] + dx, p[1] + dy)); };
      b.lineCap = 'round'; b.lineJoin = 'round';
      tr(1.5, 2); b.strokeStyle = 'rgba(40,60,20,0.22)'; b.lineWidth = wdt + 1; b.stroke();
      tr(0, 0); b.strokeStyle = '#c9b383'; b.lineWidth = wdt; b.stroke(); tr(0, -0.5); b.strokeStyle = '#e6d6a8'; b.lineWidth = wdt * 0.62; b.stroke();
    };
    for (const pts of paths) road(pts, 10);
    for (const pts of paths) {                                                              // wheel ruts, pebbles and verge tufts
      b.lineWidth = 1.2; b.lineCap = 'butt';
      for (const off of [-2.6, 2.6]) {
        b.strokeStyle = 'rgba(140,112,70,0.38)'; b.beginPath();
        for (let i = 1; i < pts.length - 1; i++) { const dx = pts[i + 1][0] - pts[i - 1][0], dy = pts[i + 1][1] - pts[i - 1][1], l = Math.hypot(dx, dy) || 1, px = pts[i][0] - dy / l * off, py = pts[i][1] + dx / l * off; i === 1 ? b.moveTo(px, py) : b.lineTo(px, py); }
        b.stroke();
      }
      b.lineCap = 'round';
      for (let i = 1; i < pts.length - 1; i++) {
        const dx = pts[i + 1][0] - pts[i - 1][0], dy = pts[i + 1][1] - pts[i - 1][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        if (r() < 0.5) { const o = (r() - 0.5) * 8; b.fillStyle = r() < 0.5 ? 'rgba(255,248,225,0.6)' : 'rgba(120,98,62,0.5)'; b.fillRect(pts[i][0] + nx * o, pts[i][1] + ny * o, 1.3, 1.1); }
        if (r() < 0.35) { const sd = r() < 0.5 ? 1 : -1, o = sd * (6.5 + r() * 3); b.strokeStyle = r() < 0.5 ? '#4c8a3a' : '#7ab648'; b.lineWidth = 1; for (let q = -1; q <= 1; q++) { b.beginPath(); b.moveTo(pts[i][0] + nx * o + q * 1.4, pts[i][1] + ny * o); b.lineTo(pts[i][0] + nx * o + q * 2.4, pts[i][1] + ny * o - 3.6); b.stroke(); } }
      }
    }
    // --- farmsteads right next to a road: yard, farmhouse, big barn, silo, shed, vegetable garden, tractor, hay bales
    const farms = [], extraTrees = [];
    for (let i = 0, n = Math.round(W * H / 700000) + 1, tries = 0; i < n && tries < 60; tries++) {
      const pts = paths[Math.floor(r() * paths.length)], ix = 6 + Math.floor(r() * (pts.length - 12)), q = pts[ix], tg = [pts[ix + 2][0] - pts[ix - 2][0], pts[ix + 2][1] - pts[ix - 2][1]], tl = Math.hypot(tg[0], tg[1]);
      const tx = tg[0] / tl, ty = tg[1] / tl, side = r() < 0.5 ? 1 : -1, nx = -ty * side, ny = tx * side, d = 80 + r() * 10, hx = q[0] + nx * d, hy = q[1] + ny * d;
      const f = { x: hx, y: hy, tx, ty, nx, ny, q, d, side };
      f.w2 = (x, y) => [hx + tx * x + nx * y, hy + ty * x + ny * y];
      f.pts = [f.w2(0, 0), f.w2(118, 4), f.w2(186, -8)];
      if (f.pts.some(p => p[0] < 70 || p[1] < 70 || p[0] > W - 70 || p[1] > H - 70) || farms.some(o => Math.hypot(o.x - hx, o.y - hy) < 340) || dPath(f.w2(118, 4)[0], f.w2(118, 4)[1]) < 40 || dPath(f.w2(-60, 4)[0], f.w2(-60, 4)[1]) < 40) continue;
      farms.push(f); i++;
    }
    const roofTex = (w, h, dark) => {
      b.strokeStyle = dark ? 'rgba(40,8,4,0.3)' : 'rgba(60,15,8,0.26)'; b.lineWidth = 0.8;
      for (let y = -h / 2 + 4, row = 0; y < h / 2; y += 4, row++) {
        if (Math.abs(y) < 2) continue;
        b.beginPath(); b.moveTo(-w / 2, y); b.lineTo(w / 2, y); b.stroke();
        b.strokeStyle = 'rgba(60,15,8,0.12)'; b.beginPath(); for (let x = -w / 2 + (row % 2) * 3; x < w / 2; x += 6) { b.moveTo(x, y); b.lineTo(x, y + 4); } b.stroke();
        b.strokeStyle = dark ? 'rgba(40,8,4,0.3)' : 'rgba(60,15,8,0.26)';
      }
    };
    for (const f of farms) {
      const ang = Math.atan2(f.ty, f.tx);
      const L = fn => { b.save(); b.translate(f.x, f.y); b.rotate(ang); b.scale(1, f.side); fn(); b.restore(); };
      L(() => {                                                                                    // trampled yard
        const g = b.createRadialGradient(60, 8, 10, 60, 8, 190); g.addColorStop(0, 'rgba(204,182,124,0.85)'); g.addColorStop(0.65, 'rgba(198,176,118,0.55)'); g.addColorStop(1, 'rgba(196,174,116,0)');
        b.fillStyle = g; b.beginPath(); b.ellipse(60, 6, 200, 92, 0, 0, 7); b.fill();
        for (let i = 0; i < 260; i++) { const a = r() * 6.283, rd = Math.sqrt(r()), x = 60 + Math.cos(a) * rd * 170, y = 6 + Math.sin(a) * rd * 78; b.fillStyle = r() < 0.5 ? 'rgba(120,96,56,0.28)' : 'rgba(255,240,190,0.35)'; b.fillRect(x, y, 1.3 + r() * 1.4, 1 + r()); }
      });
      const dr = f.w2(-8, -36), dr2 = f.w2(112, -50);
      road([[f.q[0], f.q[1]], [f.q[0] + f.nx * f.d * 0.5, f.q[1] + f.ny * f.d * 0.5], dr], 4);        // footpath to the front door
      road([f.w2(118, -f.d - 2), f.w2(118, -f.d * 0.55), f.w2(118, -44)], 9);   // drive to the barn
      const gable = (cx, cy, w, h, c1, c2, ridge, dark) => L(() => {
        b.translate(cx, cy);
        b.fillStyle = 'rgba(20,40,10,0.34)'; b.fillRect(-w / 2 + 6, -h / 2 + 9, w + 3, h + 2);
        b.fillStyle = 'rgba(236,226,200,0.95)'; b.fillRect(-w / 2 - 1.8, -h / 2 - 1.8, w + 3.6, h + 3.6);                       // eaves
        let g = b.createLinearGradient(0, -h / 2, 0, 0); g.addColorStop(0, c1[0]); g.addColorStop(1, c1[1]); b.fillStyle = g; b.fillRect(-w / 2, -h / 2, w, h / 2);
        g = b.createLinearGradient(0, 0, 0, h / 2); g.addColorStop(0, c2[0]); g.addColorStop(1, c2[1]); b.fillStyle = g; b.fillRect(-w / 2, 0, w, h / 2);
        roofTex(w, h, dark);
        b.fillStyle = ridge; b.fillRect(-w / 2 - 1.5, -1.6, w + 3, 3.2); b.fillStyle = 'rgba(255,255,255,0.4)'; b.fillRect(-w / 2 - 1.5, -1.6, w + 3, 1);
        b.fillStyle = 'rgba(255,255,255,0.2)'; b.fillRect(-w / 2, -h / 2, w, 1.8);
      });
      // farmhouse
      gable(0, 0, 100, 58, ['#d8694a', '#c0523a'], ['#a8402c', '#8c3224'], '#7a2a1e', false);
      L(() => {
        b.fillStyle = 'rgba(20,40,10,0.3)'; b.fillRect(-36 + 3, -20 + 4, 10, 10);
        b.fillStyle = '#b86a50'; b.fillRect(-36, -20, 10, 10); b.fillStyle = '#e0a58a'; b.fillRect(-36, -20, 10, 2.5); b.fillStyle = '#2a1c18'; b.fillRect(-33, -17, 4, 4);   // chimney
        b.fillStyle = 'rgba(20,40,10,0.28)'; b.fillRect(14 + 3, -26 + 4, 20, 20);                                                                         // dormer
        b.fillStyle = '#e6dcc2'; b.fillRect(14, -26, 20, 20); b.fillStyle = '#d0644a'; b.fillRect(15.5, -24.5, 17, 8.5); b.fillStyle = '#9c3a28'; b.fillRect(15.5, -16, 17, 8.5);
        b.fillStyle = '#f4ead0'; b.fillRect(22, -17, 3, 3);
        b.fillStyle = '#d7cdb2'; b.fillRect(-14, -41, 26, 9); b.fillStyle = '#a8402c'; b.fillRect(-12, -41, 22, 3);                                        // porch with its own little roof
        b.fillStyle = 'rgba(20,40,10,0.25)'; b.fillRect(-14 + 3, -41 + 3, 26, 3);
      });
      // barn (+ solar panels on some, ventilation cupola)
      const solar = r() < 0.55;
      gable(118, 4, 96, 68, ['#b4493a', '#9e3c30'], ['#7a2c24', '#62211c'], '#52191a', true);
      L(() => {
        b.translate(118, 4);
        if (solar) { b.fillStyle = '#26385a'; b.fillRect(-30, 6, 60, 22); b.strokeStyle = 'rgba(170,200,240,0.5)'; b.lineWidth = 0.7; for (let x = -30; x <= 30; x += 7.5) { b.beginPath(); b.moveTo(x, 6); b.lineTo(x, 28); b.stroke(); } for (let y = 6; y <= 28; y += 7.3) { b.beginPath(); b.moveTo(-30, y); b.lineTo(30, y); b.stroke(); } b.fillStyle = 'rgba(255,255,255,0.12)'; b.fillRect(-30, 6, 60, 5); }
        b.fillStyle = 'rgba(20,40,10,0.3)'; b.fillRect(-24 + 3, -7 + 4, 10, 12); b.fillStyle = '#6a2a22'; b.fillRect(-24, -7, 10, 10); b.fillStyle = '#d2a68e'; b.fillRect(-24, -7, 10, 2.5); b.fillStyle = '#2a1c18'; b.fillRect(-21, -3, 4, 3);   // cupola
      });
      L(() => {                                                                                   // silo
        b.translate(188, -10);
        b.fillStyle = 'rgba(20,40,10,0.32)'; b.beginPath(); b.ellipse(8, 9, 14, 13, 0, 0, 7); b.fill();
        const g = b.createRadialGradient(-4, -4, 1, 0, 0, 14); g.addColorStop(0, '#f1f3f2'); g.addColorStop(0.7, '#b6bec2'); g.addColorStop(1, '#8a949a'); b.fillStyle = g; b.beginPath(); b.arc(0, 0, 14, 0, 7); b.fill();
        b.strokeStyle = 'rgba(80,95,105,0.5)'; b.lineWidth = 0.9; b.beginPath(); b.arc(0, 0, 9.5, 0, 7); b.stroke(); b.beginPath(); b.arc(0, 0, 4.5, 0, 7); b.stroke();
        b.fillStyle = '#5c666c'; b.beginPath(); b.arc(-1, -1, 1.8, 0, 7); b.fill();
      });
      gable(-70, 60, 40, 26, ['#a49a88', '#8e8474'], ['#756c5e', '#625a4e'], '#4a443c', true);                 // tool shed
      L(() => {
        b.translate(-122, 8);                                                                     // vegetable garden
        b.fillStyle = 'rgba(30,45,15,0.25)'; b.fillRect(2, 3, 60, 44); b.fillStyle = '#7a5836'; b.fillRect(0, 0, 60, 44);
        for (let k = 0; k < 6; k++) { const yy = 5 + k * 7; b.fillStyle = '#5a3f26'; b.fillRect(2, yy + 3.5, 56, 1.4); b.fillStyle = k % 2 ? '#6db042' : '#8ec850'; for (let x = 5; x < 56; x += 5) { b.beginPath(); b.arc(x, yy + 1.5, 2.1, 0, 7); b.fill(); } }
        b.strokeStyle = '#a9824f'; b.lineWidth = 1.4; b.strokeRect(-1, -1, 62, 46);
      });
      L(() => {                                                                                   // water trough, tractor, hay bales
        b.fillStyle = 'rgba(30,40,20,0.3)'; b.fillRect(52 + 2, 50 + 2, 20, 7); b.fillStyle = '#8a6a44'; b.fillRect(52, 50, 20, 7); b.fillStyle = '#7bb4c8'; b.fillRect(53.5, 51.5, 17, 4);
        b.save(); b.translate(100, 64); b.rotate((r() - 0.5) * 0.5);
        b.fillStyle = 'rgba(20,35,10,0.35)'; b.fillRect(-12 + 3, -7 + 4, 26, 15);
        b.fillStyle = '#26282a'; b.fillRect(-12, -10, 11, 4); b.fillRect(-12, 6, 11, 4); b.fillRect(7, -8, 6, 3); b.fillRect(7, 5, 6, 3);
        b.fillStyle = '#2f8f3f'; b.fillRect(-12, -6, 26, 12); b.fillStyle = '#4fb85a'; b.fillRect(-12, -6, 26, 3); b.fillStyle = '#d8e4d0'; b.fillRect(-9, -4, 9, 8); b.fillStyle = '#7ab0c0'; b.fillRect(-7, -2, 5, 4);
        b.restore();
        for (let k = 0; k < 3; k++) { const bx = 168 + (k % 2) * 15 + (k === 2 ? -7 : 0), by = 52 + (k > 1 ? 13 : 0) + (r() - 0.5) * 2; b.fillStyle = 'rgba(60,40,10,0.3)'; b.beginPath(); b.ellipse(bx + 3, by + 4, 8, 7, 0, 0, 7); b.fill(); const g = b.createRadialGradient(bx - 2, by - 2, 1, bx, by, 8); g.addColorStop(0, '#f3d27a'); g.addColorStop(1, '#c79a38'); b.fillStyle = g; b.beginPath(); b.arc(bx, by, 8, 0, 7); b.fill(); b.strokeStyle = 'rgba(140,100,20,0.6)'; b.lineWidth = 0.9; b.beginPath(); b.arc(bx, by, 5, 0.5, 5); b.stroke(); }
      });
      obst.push([f.pts[0][0], f.pts[0][1], 68], [f.pts[1][0], f.pts[1][1], 70], [f.pts[2][0], f.pts[2][1], 24]);
      for (const o of [[-70, 60, 28], [100, 64, 22], [-122, 30, 34], [168, 60, 24]]) { const p = f.w2(o[0], o[1]); obst.push([p[0], p[1], o[2]]); }
      for (let k = 0; k < 5; k++) { const p = f.w2(-90 + k * 55 + (r() - 0.5) * 20, 98 + r() * 22); extraTrees.push([p[0], p[1], 30 + r() * 10]); }
      for (let k = 0; k < 2; k++) { const p = f.w2(-30 + k * 150, -76 - r() * 10); extraTrees.push([p[0], p[1], 22 + r() * 8]); }
    }
    // --- ponds: clear of roads, farms and each other
    const ponds = [];
    for (let i = 0, n = Math.round(W * H / 700000) + 1, tries = 0; i < n && tries < 80; tries++) {
      const x = 80 + r() * (W - 160), y = 80 + r() * (H - 160), rx = 34 + r() * 26, ry = rx * (0.55 + r() * 0.2), rr2 = rx + 14;
      if (dPath(x, y) < rr2 + 6 || farms.some(f => f.pts.some(p => Math.hypot(p[0] - x, p[1] - y) < rr2 + 100)) || ponds.some(p => Math.hypot(p[0] - x, p[1] - y) < p[2] + rr2 + 30)) continue;
      ponds.push([x, y, rr2]); i++;
      obst.push([x, y, rx + 12]);
      b.fillStyle = '#7fae5a'; b.beginPath(); b.ellipse(x, y, rx + 5, ry + 5, 0, 0, 7); b.fill();
      const g = b.createLinearGradient(x - rx, y - ry, x + rx, y + ry); g.addColorStop(0, '#9ad0d6'); g.addColorStop(1, '#4f95a8'); b.fillStyle = g; b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, 7); b.fill();
      b.strokeStyle = 'rgba(255,255,255,0.35)'; b.lineWidth = 1.5; b.beginPath(); b.ellipse(x - 4, y - 3, rx * 0.55, ry * 0.4, 0, 3.6, 5.3); b.stroke();
      for (let q = 0; q < 5; q++) bush(x + (r() - 0.5) * rx * 2.1, y + ry * (r() < 0.5 ? 1 : -1) * 1.05, 3 + r() * 3, true);
      for (let q = 0, m = 3 + Math.floor(r() * 4); q < m; q++) {                       // lily pads (some in flower)
        const a = r() * 6.283, dd = Math.sqrt(r()) * 0.7, lx = x + Math.cos(a) * rx * dd, ly = y + Math.sin(a) * ry * dd, lr = 3 + r() * 2.2;
        b.fillStyle = '#4f9a48'; b.beginPath(); b.moveTo(lx, ly); b.arc(lx, ly, lr, 0.4, 5.9); b.closePath(); b.fill();
        b.strokeStyle = 'rgba(190,240,170,0.5)'; b.lineWidth = 0.6; b.beginPath(); b.arc(lx, ly, lr * 0.6, 0.6, 5.5); b.stroke();
        if (r() < 0.3) { b.fillStyle = '#f7c4dc'; b.beginPath(); b.arc(lx + 0.5, ly - 0.5, 1.6, 0, 7); b.fill(); b.fillStyle = '#ffe36a'; b.fillRect(lx, ly - 1, 1, 1); }
      }
      { const ea = r() * 6.283;                                                       // reeds and cattails on one shore
        for (let q = 0; q < 12; q++) {
          const a = ea + (r() - 0.5) * 1.1, rx2 = x + Math.cos(a) * (rx + 2 + r() * 3), ry2 = y + Math.sin(a) * (ry + 2 + r() * 3), hgt = 6 + r() * 6, lean = (r() - 0.5) * 3;
          b.strokeStyle = r() < 0.5 ? '#4c8a3a' : '#6aa646'; b.lineWidth = 1; b.beginPath(); b.moveTo(rx2, ry2); b.lineTo(rx2 + lean, ry2 - hgt); b.stroke();
          if (r() < 0.4) { b.strokeStyle = '#6a4a2a'; b.lineWidth = 1.8; b.beginPath(); b.moveTo(rx2 + lean * 0.9, ry2 - hgt * 0.9); b.lineTo(rx2 + lean, ry2 - hgt - 2.5); b.stroke(); }
        }
      }
      for (let q = 0; q < 3; q++) { const a = r() * 6.283; b.fillStyle = 'rgba(120,120,110,0.9)'; b.beginPath(); b.ellipse(x + Math.cos(a) * (rx + 3), y + Math.sin(a) * (ry + 3), 2.2 + r() * 1.5, 1.6 + r(), 0, 0, 7); b.fill(); }
    }
    // --- field borders: hedges or wooden fences (some none); never over roads, ponds or farms; gaps at roads
    const blocked = (x, y) => dPath(x, y) < 12 || ponds.some(p => Math.hypot(p[0] - x, p[1] - y) < p[2] - 2) || farms.some(f => f.pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 80) || Math.hypot(f.x - x, f.y - y) < 120);
    const fenceKeys = new Map();
    hedgePts.forEach((p, key) => {
      if (blocked(p[0], p[1])) return;
      if (p[2] === 1) { fenceKeys.set(key, p); return; }
      const z = 5 + r() * 4; bush(p[0] + (r() - 0.5) * 3, p[1] + (r() - 0.5) * 3, z, r() < 0.4); if (r() < 0.5) bush(p[0] + 4 + r() * 4, p[1] + 3 + r() * 4, 4 + r() * 3, r() < 0.4);
    });
    b.lineCap = 'round';
    fenceKeys.forEach((p, key) => {
      const [bx, by] = key.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const q = fenceKeys.get((bx + dx) + ',' + (by + dy)); if (!q) continue;
        b.strokeStyle = 'rgba(30,50,15,0.25)'; b.lineWidth = 2.6; b.beginPath(); b.moveTo(p[0] + 1.5, p[1] + 2); b.lineTo(q[0] + 1.5, q[1] + 2); b.stroke();
        b.strokeStyle = '#a9824f'; b.lineWidth = 1.8; b.beginPath(); b.moveTo(p[0], p[1]); b.lineTo(q[0], q[1]); b.stroke();
      }
    });
    fenceKeys.forEach((p, key) => { const [bx, by] = key.split(',').map(Number); if ((bx + by) % 2) return; b.fillStyle = '#6e4c2a'; b.beginPath(); b.arc(p[0], p[1], 2.3, 0, 7); b.fill(); b.fillStyle = '#c9a06a'; b.beginPath(); b.arc(p[0] - 0.5, p[1] - 0.5, 1, 0, 7); b.fill(); });
    // --- round hay bales in the wheat fields
    const atF = (x, y) => Math.min(lh - 1, Math.max(0, Math.round(y / sc))) * lw + Math.min(lw - 1, Math.max(0, Math.round(x / sc)));
    for (let i = 0, n = W * H / 120000, tries = 0; i < n && tries < 200; tries++) {
      const x = r() * W, y = r() * H, k0 = atF(x, y);
      if (fk[k0] !== 2 || dPath(x, y) < 20 || [[16, 0], [-16, 0], [0, 16], [0, -16]].some(o => ids[atF(x + o[0] * 2, y + o[1] * 2)] !== ids[k0])) continue;
      i++;
      const m = 2 + Math.floor(r() * 3), ang = r() * 3.14;
      for (let q = 0; q < m; q++) {
        const bx2 = x + Math.cos(ang) * q * 17, by2 = y + Math.sin(ang) * q * 17;
        b.fillStyle = 'rgba(60,40,10,0.3)'; b.beginPath(); b.ellipse(bx2 + 3, by2 + 4, 8, 7, 0, 0, 7); b.fill();
        const g = b.createRadialGradient(bx2 - 2, by2 - 2, 1, bx2, by2, 8); g.addColorStop(0, '#f3d27a'); g.addColorStop(1, '#c79a38'); b.fillStyle = g; b.beginPath(); b.arc(bx2, by2, 8, 0, 7); b.fill();
        b.strokeStyle = 'rgba(140,100,20,0.6)'; b.lineWidth = 0.9; b.beginPath(); b.arc(bx2, by2, 5, 0.5, 5); b.stroke(); b.beginPath(); b.arc(bx2, by2, 2.4, 1, 6); b.stroke();
      }
    }
    for (let i = 0, n = W * H / 70000, tries = 0; i < n && tries < 200; tries++) {            // small rocks and flowering weeds in the meadows
      const x = r() * W, y = r() * H;
      if (fk[atF(x, y)] !== 1 || dPath(x, y) < 18 || farms.some(f => f.pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 90))) continue;
      i++; const z = 2.2 + r() * 2.6;
      b.fillStyle = 'rgba(30,45,15,0.3)'; b.beginPath(); b.ellipse(x + 1.5, y + 1.8, z * 1.1, z * 0.8, 0, 0, 7); b.fill();
      const g = b.createRadialGradient(x - z * 0.3, y - z * 0.3, 0.3, x, y, z); g.addColorStop(0, '#d6d6cc'); g.addColorStop(1, '#8e8f86'); b.fillStyle = g; b.beginPath(); b.ellipse(x, y, z, z * 0.78, r() * 3, 0, 7); b.fill();
    }
    // trees: layered lobed crowns (oak, light, blossom) and spiky conifers, as single trees and small copses
    const TS = 1.5, SZ = 120, spr = [];
    const mkTree = (kind, v) => {
      const cs = mk(SZ * S * TS, SZ * S * TS), c = cs.getContext('2d'), rr = env.rng(seed * 31 + v * 7 + 1); c.scale(S * TS, S * TS);
      const cx = 56, cy = 54, R = 40;
      c.fillStyle = 'rgba(15,40,10,0.3)'; c.beginPath(); c.ellipse(cx + 12, cy + 15, R * 0.98, R * 0.86, 0, 0, 7); c.fill();
      if (kind === 'conifer') {
        const cols = ['#1d5a35', '#2b7a45', '#43a05a', '#78c47c'];
        [[R, 13], [R * 0.76, 11], [R * 0.52, 9], [R * 0.3, 7]].forEach((t, ti) => {
          c.fillStyle = cols[Math.min(3, ti)]; c.beginPath();
          for (let i = 0; i < t[1] * 2; i++) { const a = i / (t[1] * 2) * 6.283 + ti * 0.3 + rr() * 0.1, rad = i % 2 ? t[0] * 0.55 : t[0] * (0.95 + rr() * 0.1); c[i ? 'lineTo' : 'moveTo'](cx - ti * 1.5 + Math.cos(a) * rad, cy - ti * 1.5 + Math.sin(a) * rad); }
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(190,240,170,0.35)'; c.lineWidth = 1.2; for (let i = 0; i < t[1]; i++) { const a = i / t[1] * 6.283 + ti * 0.3 + 0.1; c.beginPath(); c.moveTo(cx - ti * 1.5, cy - ti * 1.5); c.lineTo(cx - ti * 1.5 + Math.cos(a) * t[0] * 0.85, cy - ti * 1.5 + Math.sin(a) * t[0] * 0.85); c.stroke(); }
        });
      } else {
        const pals = { oak: [['#2d6a2c', '#43883a', '#69ad48', '#a4d867'], ['#2a6a38', '#3f8a4a', '#5fae5a', '#9ed67a']], light: [['#4d8f36', '#74b348', '#a2d460', '#d3ee8e']], blossom: [['#3f8a3a', '#6aaa4a', '#a4d068', '#fbd3e2']] };
        const list = pals[kind], pal = list[v % list.length], lobes = [], N = 8 + Math.floor(rr() * 3);
        for (let i = 0; i < N; i++) lobes.push({ a: i / N * 6.283 + rr() * 0.5, d: 0.5 + rr() * 0.2, k: 0.36 + rr() * 0.14 });
        const blob = (ox, oy, sz, col) => {
          c.fillStyle = col; c.beginPath(); c.arc(cx + ox, cy + oy, R * 0.66 * sz, 0, 7);
          for (const l of lobes) { const x = cx + ox + Math.cos(l.a) * R * l.d * sz, y = cy + oy + Math.sin(l.a) * R * l.d * sz; c.moveTo(x + R * l.k * sz, y); c.arc(x, y, R * l.k * sz, 0, 7); }
          c.fill();
        };
        blob(0, 0, 1, pal[0]); blob(-3, -4, 0.88, pal[1]); blob(-7, -9, 0.64, pal[2]);
        for (let i = 0; i < 70; i++) {                                    // leaf clumps, lighter towards the sun (top-left)
          const a = rr() * 6.283, d = Math.sqrt(rr()) * R * 0.85, x = cx - 6 + Math.cos(a) * d, y = cy - 8 + Math.sin(a) * d, lit = 1 - Math.min(1, Math.hypot(x - (cx - 14), y - (cy - 16)) / (R * 1.1));
          c.globalAlpha = 0.45 + lit * 0.4; c.fillStyle = lit > 0.45 ? pal[3] : pal[2]; c.beginPath(); c.ellipse(x, y, 2.6 + rr() * 2.6, 1.8 + rr() * 1.8, rr() * 3, 0, 7); c.fill();
        }
        for (let i = 0; i < 34; i++) { const a = 0.3 + rr() * 2.6, d = R * (0.45 + rr() * 0.4); c.globalAlpha = 0.35; c.fillStyle = pal[0]; c.beginPath(); c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + rr() * 3, 2 + rr() * 2, rr() * 3, 0, 7); c.fill(); }
        c.globalAlpha = 1;
        if (kind === 'blossom') for (let i = 0; i < 40; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * R * 0.8; c.fillStyle = rr() < 0.6 ? '#fde3ee' : '#f6a9c6'; c.beginPath(); c.arc(cx - 4 + Math.cos(a) * d, cy - 5 + Math.sin(a) * d, 1.6 + rr() * 1.6, 0, 7); c.fill(); }
      }
      c.globalAlpha = 1; return cs;
    };
    const kinds = ['oak', 'oak', 'oak', 'oak', 'light', 'light', 'oak', 'blossom'];
    kinds.forEach((k, i) => spr.push(mkTree(k, i)));
    const stamp = (x, y, z) => {
      const sp = spr[Math.floor(r() * spr.length)], sc2 = z / 40;
      b.drawImage(sp, (x - 56 * sc2), (y - 54 * sc2), SZ * sc2, SZ * sc2);
    };
    let treeList = [];
    for (let i = 0, n = W * H / 52000; i < n; i++) { const x = r() * W, y = r() * H, z = 22 + r() * 18; treeList.push([x, y, z]); }
    for (let i = 0, n = Math.round(W * H / 400000) + 1; i < n; i++) {   // copses
      const cx0 = r() * W, cy0 = r() * H, m = 3 + Math.floor(r() * 4);
      for (let q = 0; q < m; q++) treeList.push([cx0 + (r() - 0.5) * 70, cy0 + (r() - 0.5) * 55, 18 + r() * 14]);
    }
    for (const t of extraTrees) treeList.push(t);
    { const pts = paths[Math.floor(r() * paths.length)], i0 = 8 + Math.floor(r() * (pts.length - 30)); for (let i = i0; i < i0 + 14; i += 2) { const q = pts[i], q2 = pts[i + 1], tl = Math.hypot(q2[0] - q[0], q2[1] - q[1]) || 1, nx = -(q2[1] - q[1]) / tl, ny = (q2[0] - q[0]) / tl; for (const sd of [-1, 1]) treeList.push([q[0] + nx * 19 * sd, q[1] + ny * 19 * sd, 13 + r() * 3, 1]); } }
    const fixed = obst.slice();
    treeList = treeList.filter(t => t[3] || (dPath(t[0], t[1]) > t[2] * 0.8 + 8 && !fixed.some(o => Math.hypot(t[0] - o[0], t[1] - o[1]) < o[2] + t[2] * 0.5)));
    treeList.sort((p1, p2) => p1[1] - p2[1]);
    for (const t of treeList) { stamp(t[0], t[1], t[2]); obst.push([t[0], t[1], t[2] * 0.9 + 10]); }
    this._bush = bush;
    this._bg = bg;
    // static clearance for roaming animals: only inside meadow fields, away from hedges, trees, ponds and buildings
    const gw = this._gw, gh = this._gh, St = new Float32Array(gw * gh), at = (x, y) => { const i = Math.min(lw - 1, Math.max(0, Math.round(x / sc))), j = Math.min(lh - 1, Math.max(0, Math.round(y / sc))); return j * lw + i; };
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell, k0 = at(x, y);
      if (!typ[k0]) continue;
      let cl = 34;
      for (let rad = 8; rad <= 32 && cl === 34; rad += 8) for (let q = 0; q < 8; q++) {
        const a = q * 0.785, k1 = at(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
        if (ids[k1] !== ids[k0] || !typ[k1]) { cl = rad; break; }
      }
      for (const o of obst) { const d = Math.hypot(x - o[0], y - o[1]) - o[2] + 10; if (d < cl) cl = d; if (cl <= 0) break; }
      St[j * gw + i] = Math.max(0, cl);
    }
    this._St = St;

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
    const St = this._St, free = k => St[k] >= 14 && Ds[k] > R + 16, list = [], stack = [];
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
    const bush = (x, y, z, dark) => {
      o.fillStyle = 'rgba(20,45,10,0.3)'; o.beginPath(); o.ellipse(x + z * 0.35, y + z * 0.55, z, z * 0.9, 0, 0, 7); o.fill();
      const g = o.createRadialGradient(x - z * 0.35, y - z * 0.35, 0.5, x, y, z);
      g.addColorStop(0, dark ? '#5aa03c' : '#8ccc58'); g.addColorStop(1, dark ? '#2d6a2c' : '#3f8a36'); o.fillStyle = g; o.beginPath(); o.arc(x, y, z, 0, 7); o.fill();
    };
    for (const line of lines) {
      if (line.length < 3) continue;
      let acc = 0, next = 0;                                           // a bush roughly every 6 px along the contour
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1], bb = line[i], seg = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
        acc += seg;
        if (acc >= next) {
          const hh = env.hash(Math.round(bb[0] / 5), Math.round(bb[1] / 5), 77), hh2 = env.hash(Math.round(bb[0] / 5), Math.round(bb[1] / 5), 78);
          bush(bb[0], bb[1], 5.5 + hh * 3.5, hh2 < 0.4); next = acc + 5 + hh2 * 3;
        }
      }
    }
    o.setTransform(1, 0, 0, 1, 0, 0);
  },

  _open(x, y) {
    const c = this._cell, i = Math.floor(x / c), j = Math.floor(y / c);
    if (i < 0 || j < 0 || i >= this._gw || j >= this._gh) return 0;
    const k = j * this._gw + i;
    return Math.max(0, Math.min(1, (this._St[k] - 8) / 10)) * Math.max(0, Math.min(1, (this._Ds[k] - this.R - 8) / 10));
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
      const want = P.animals <= 0 ? 0 : q.area < 6000 ? 0 : Math.min(4, Math.max(1, Math.round(q.area / 40000 * P.animals)));
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
