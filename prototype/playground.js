// Theme "Playground": a park seen from above. Every group of icons sits in its own wooden sandbox with toys;
// swings, a slide, a merry-go-round and more stand around on rubber mats. Kids play, parents walk, now and then a dog runs by.
IconIsland.theme({
  params: { kids: 1, equipment: 1 },
  R: 60,
  _Z: null, _bg: null, _sand: null, _comp: null, _tmp: null, _items: [], _herd: null, _bal: 0, _dogT: 25, _sig: '', _last: -9, _seed: 1, _key: '',

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._herd = new Fauna.Herd(); this._sig = ''; this._dogT = 20; },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 41), Z = this._Z;
    Z.resize(env); this._tmp = mk(cw, ch); this._comp = mk(cw, ch);
    const sc = 2, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2;
    const field = (fn) => { const c = mk(lw, lh), g = c.getContext('2d'), im = g.createImageData(lw, lh), u = new Uint32Array(im.data.buffer); for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { const q = fn(i * sc, j * sc); u[j * lw + i] = 255 << 24 | Math.min(255, q[2]) << 16 | Math.min(255, q[1]) << 8 | Math.min(255, q[0]); } g.putImageData(im, 0, 0); return c; };
    // ---- park lawn
    const lawn = field((x, y) => { const n = env.fbm(x / 120, y / 120, seed + 5, 3), m = env.noise(x / 14, y / 14, seed + 6), st = Math.sin((x * 0.8 + y * 0.6) / 26) * 0.03, t = n * 0.9 + m * 0.2 + st; return [96 + t * 50, 176 + t * 50, 84 + t * 34]; });
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(lawn, 0, 0, lw * sc, lh * sc);
    b.lineCap = 'round';
    for (let i = 0, n = W * H / 700; i < n; i++) { const x = r() * W, y = r() * H; b.globalAlpha = 0.25 + r() * 0.2; b.strokeStyle = r() < 0.5 ? '#3f8a3a' : '#b4e47a'; b.lineWidth = 1; b.beginPath(); b.moveTo(x, y); b.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); b.stroke(); }
    b.globalAlpha = 1;
    // ---- paved paths
    const paths = [];
    for (let q = 0; q < 3; q++) {
      const pts = [], ph = r() * 6, vert = q === 2, base = vert ? W * (0.35 + r() * 0.3) : H * (0.28 + q * 0.42) + r() * 40;
      for (let t = -20; t <= (vert ? H : W) + 20; t += 12) { const w = Math.sin(t / 300 + ph) * 70 + (env.noise(t / 120, q, seed + 9) - 0.5) * 40; pts.push(vert ? [base + w, t] : [t, base + w]); }
      paths.push(pts);
    }
    const dPath = (x, y) => { let m = 1e9; for (const pts of paths) for (const p of pts) { const d = Math.abs(p[0] - x) + Math.abs(p[1] - y); if (d < m * 1.5) { const e = Math.hypot(p[0] - x, p[1] - y); if (e < m) m = e; } } return m; };
    b.lineJoin = 'round';
    for (const pts of paths) {
      const tr = (dx, dy) => { b.beginPath(); pts.forEach((p, i) => i ? b.lineTo(p[0] + dx, p[1] + dy) : b.moveTo(p[0] + dx, p[1] + dy)); };
      tr(1.5, 2.5); b.strokeStyle = 'rgba(30,60,20,0.25)'; b.lineWidth = 26; b.stroke();
      tr(0, 0); b.strokeStyle = '#cfc8b8'; b.lineWidth = 24; b.stroke(); tr(0, 0); b.strokeStyle = '#ece6d8'; b.lineWidth = 20; b.stroke();
      tr(0, 0); b.strokeStyle = 'rgba(160,150,130,0.35)'; b.lineWidth = 20; b.setLineDash([1.2, 11]); b.stroke(); b.setLineDash([]);   // paving seams
    }
    // ---- equipment spots (kept clear of paths and each other)
    const types = ['swing', 'slide', 'merry', 'seesaw', 'climb', 'trampoline', 'springs'], items = [], want = Math.max(5, Math.round(W * H / 170000));
    for (let tries = 0; items.length < want && tries < 300; tries++) {
      const x = 90 + r() * (W - 180), y = 90 + r() * (H - 180), rad = 62;
      if (dPath(x, y) < rad + 18 || items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + rad + 40)) continue;
      items.push({ type: types[items.length % types.length], x, y, rad, ph: r() * 6, mat: ['#c4573f', '#3f8fc4', '#4fa66a', '#d9a23a'][Math.floor(r() * 4)] });
    }
    this._items = items;
    // ---- trees, flower beds, benches
    const SZ = 120, TS = 1.5, spr = [];
    const mkTree = (kind, v) => {
      const cs = mk(SZ * S * TS, SZ * S * TS), c = cs.getContext('2d'), rr = env.rng(seed * 31 + v * 7 + 1); c.scale(S * TS, S * TS);
      const cx = 56, cy = 54, R = 40, pals = { oak: [['#2d6a2c', '#43883a', '#69ad48', '#a4d867'], ['#2a6a38', '#3f8a4a', '#5fae5a', '#9ed67a']], light: [['#4d8f36', '#74b348', '#a2d460', '#d3ee8e']], blossom: [['#3f8a3a', '#6aaa4a', '#a4d068', '#fbd3e2']] };
      const pal = pals[kind][v % pals[kind].length], lobes = [], N = 8 + Math.floor(rr() * 3);
      c.fillStyle = 'rgba(15,40,10,0.3)'; c.beginPath(); c.ellipse(cx + 12, cy + 15, R * 0.98, R * 0.86, 0, 0, 7); c.fill();
      for (let i = 0; i < N; i++) lobes.push({ a: i / N * 6.283 + rr() * 0.5, d: 0.5 + rr() * 0.2, k: 0.36 + rr() * 0.14 });
      const blob = (ox, oy, sz, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx + ox, cy + oy, R * 0.66 * sz, 0, 7); for (const l of lobes) { const x = cx + ox + Math.cos(l.a) * R * l.d * sz, y = cy + oy + Math.sin(l.a) * R * l.d * sz; c.moveTo(x + R * l.k * sz, y); c.arc(x, y, R * l.k * sz, 0, 7); } c.fill(); };
      blob(0, 0, 1, pal[0]); blob(-3, -4, 0.88, pal[1]); blob(-7, -9, 0.64, pal[2]);
      for (let i = 0; i < 70; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * R * 0.85, x = cx - 6 + Math.cos(a) * d, y = cy - 8 + Math.sin(a) * d, lit = 1 - Math.min(1, Math.hypot(x - (cx - 14), y - (cy - 16)) / (R * 1.1)); c.globalAlpha = 0.45 + lit * 0.4; c.fillStyle = lit > 0.45 ? pal[3] : pal[2]; c.beginPath(); c.ellipse(x, y, 2.6 + rr() * 2.6, 1.8 + rr() * 1.8, rr() * 3, 0, 7); c.fill(); }
      c.globalAlpha = 1; if (kind === 'blossom') for (let i = 0; i < 40; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * R * 0.8; c.fillStyle = rr() < 0.6 ? '#fde3ee' : '#f6a9c6'; c.beginPath(); c.arc(cx - 4 + Math.cos(a) * d, cy - 5 + Math.sin(a) * d, 1.6 + rr() * 1.6, 0, 7); c.fill(); }
      return cs;
    };
    ['oak', 'oak', 'oak', 'light', 'blossom'].forEach((k, i) => spr.push(mkTree(k, i)));
    this._trees = [];
    for (let i = 0, n = W * H / 60000, tries = 0; i < n && tries < 200; tries++) {
      const x = r() * W, y = r() * H, z = 22 + r() * 14;
      if (dPath(x, y) < z + 16 || items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + z)) continue;
      this._trees.push([x, y, z, spr[Math.floor(r() * spr.length)]]); i++;
    }
    for (const pts of paths) for (let i = 10; i < pts.length - 10; i += 22 + Math.floor(r() * 20)) {          // benches facing the path
      const p = pts[i], q = pts[i + 1], tl = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / tl, ny = (q[0] - p[0]) / tl, side = r() < 0.5 ? 1 : -1, x = p[0] + nx * side * 22, y = p[1] + ny * side * 22;
      b.save(); b.translate(x, y); b.rotate(Math.atan2(q[1] - p[1], q[0] - p[0])); b.scale(1.5, 1.5);
      b.fillStyle = 'rgba(20,40,10,0.28)'; b.fillRect(-13, -4.5, 28, 11); b.fillStyle = '#7a5a36'; b.fillRect(-14, -5, 28, 10); b.fillStyle = '#b08a58'; for (let k = 0; k < 4; k++) b.fillRect(-13 + k * 7, -4, 5, 8); b.fillStyle = '#5a4026'; b.fillRect(-14, side > 0 ? 3 : -5, 28, 2); b.restore();
    }
    for (let i = 0; i < W * H / 160000; i++) {                                                                  // flower beds
      const x = r() * W, y = r() * H; if (dPath(x, y) < 40 || items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + 26)) continue;
      b.fillStyle = 'rgba(20,40,10,0.25)'; b.beginPath(); b.ellipse(x + 2, y + 3, 28, 17, 0, 0, 7); b.fill(); b.fillStyle = '#7a5a3a'; b.beginPath(); b.ellipse(x, y, 28, 17, 0, 0, 7); b.fill(); b.fillStyle = '#5f9a44'; b.beginPath(); b.ellipse(x, y, 24, 13, 0, 0, 7); b.fill();
      const cols = ['#ff6b6b', '#ffd23f', '#f78fb3', '#ffffff', '#b388ff']; for (let k = 0; k < 28; k++) { const a = r() * 6.283, d = Math.sqrt(r()); b.fillStyle = cols[Math.floor(r() * 5)]; b.beginPath(); b.arc(x + Math.cos(a) * d * 22, y + Math.sin(a) * d * 11, 1.6 + r(), 0, 7); b.fill(); }
    }
    this._bg = bg; this._paths = paths;
    // ---- sand texture
    const sandBase = field((x, y) => { const n = env.fbm(x / 70, y / 70, seed + 21, 3), g = env.noise(x / 3, y / 3, seed + 22) * 0.12, t = n * 0.6 + g; return [232 + t * 24, 204 + t * 30, 140 + t * 36]; });
    const sand = mk(cw, ch), sg = sand.getContext('2d'); sg.scale(S, S); sg.drawImage(sandBase, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 90; i < n; i++) { sg.globalAlpha = 0.18 + r() * 0.2; sg.fillStyle = r() < 0.5 ? '#c79a56' : '#fff1c4'; sg.fillRect(r() * W, r() * H, 1.2, 1.2); }
    sg.globalAlpha = 0.25; sg.strokeStyle = '#c9a15e'; sg.lineWidth = 1;
    for (let i = 0; i < W * H / 3500; i++) { const x = r() * W, y = r() * H; sg.beginPath(); sg.arc(x, y, 6 + r() * 14, 0.3, 1.9); sg.stroke(); }
    sg.globalAlpha = 1; this._sand = sand;
    this._sig = ''; this._last = -9;
  },

  _compose(env) {
    const { S } = env, Z = this._Z, o = this._comp.getContext('2d'), R = this.R;
    Z.update(env.icons);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._bg, 0, 0);
    for (const t of this._trees) { o.save(); o.setTransform(S, 0, 0, S, 0, 0); const sc2 = t[2] / 40; o.drawImage(t[3], t[0] - 56 * sc2, t[1] - 54 * sc2, 120 * sc2, 120 * sc2); o.restore(); }
    Z.paint(o, this._sand, this._tmp, S);
    o.setTransform(S, 0, 0, S, 0, 0); o.lineCap = 'round'; o.lineJoin = 'round';
    const lines = Z.lines(), trace = (line, dx, dy) => { o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0] + dx, p[1] + dy) : o.moveTo(p[0] + dx, p[1] + dy)); };
    for (const line of lines) {                                                         // wooden sandbox rim
      if (line.length < 3) continue;
      trace(line, 2.5, 3.5); o.strokeStyle = 'rgba(40,30,10,0.35)'; o.lineWidth = 9; o.stroke();
      trace(line, 0, 0); o.strokeStyle = '#7a5530'; o.lineWidth = 8.5; o.stroke();
      trace(line, 0, 0); o.strokeStyle = '#b98a54'; o.lineWidth = 6; o.stroke();
      trace(line, -0.5, -0.8); o.strokeStyle = '#dcb47c'; o.lineWidth = 1.6; o.stroke();
      let acc = 0, next = 8;
      for (let i = 1; i < line.length; i++) { const a = line[i - 1], bb = line[i]; acc += Math.hypot(bb[0] - a[0], bb[1] - a[1]); if (acc >= next) { next = acc + 18; o.fillStyle = 'rgba(70,45,20,0.8)'; o.beginPath(); o.arc(bb[0], bb[1], 0.9, 0, 7); o.fill(); o.fillStyle = 'rgba(70,45,20,0.45)'; o.fillRect(bb[0] - 3, bb[1] - 0.3, 6, 0.6); } }
    }
    // toys lying around in the sand (positions come from a hash of the grid cell, so they stay put)
    const gw = Z.gw, gh = Z.gh, c = Z.cell;
    for (let j = 1; j < gh - 1; j += 3) for (let i = 1; i < gw - 1; i += 3) {
      const k = j * gw + i; if (Z.Ds[k] > R - 24 || Z.Dm[k] < 30) continue;
      const h = env.hash(i, j, 91); if (h > 0.34) continue;
      const x = (i + 0.5) * c + (env.hash(i, j, 92) - 0.5) * 8, y = (j + 0.5) * c + (env.hash(i, j, 93) - 0.5) * 8, kind = Math.floor(h * 15) % 5, col = ['#e5484d', '#2f80ed', '#f2c94c', '#27ae60'][Math.floor(env.hash(i, j, 94) * 4)];
      o.save(); o.translate(x, y); o.scale(1.5, 1.5); o.translate(-x, -y);
      o.fillStyle = 'rgba(80,50,10,0.25)'; o.beginPath(); o.ellipse(x + 2, y + 3, 8, 6, 0, 0, 7); o.fill();
      if (kind === 0) { o.fillStyle = col; o.beginPath(); o.arc(x, y, 6.5, 0, 7); o.fill(); o.fillStyle = 'rgba(0,0,0,0.3)'; o.beginPath(); o.arc(x, y, 4.6, 0, 7); o.fill(); o.strokeStyle = col; o.lineWidth = 1.6; o.beginPath(); o.arc(x, y, 6.2, 0.2, 1.1); o.stroke(); }          // bucket
      else if (kind === 1) { o.fillStyle = col; o.beginPath(); o.ellipse(x, y - 3, 3.5, 4.5, 0, 0, 7); o.fill(); o.fillRect(x - 1, y, 2, 9); }                                                                                   // shovel
      else if (kind === 2) { o.fillStyle = '#e2bf78'; o.beginPath(); o.arc(x, y, 8, 0, 7); o.fill(); o.fillStyle = '#d3ab62'; o.beginPath(); o.arc(x - 1, y - 1, 5, 0, 7); o.fill(); for (let q = 0; q < 4; q++) { const a = q * 1.57 + 0.8; o.fillStyle = '#e8c887'; o.beginPath(); o.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 2.6, 0, 7); o.fill(); } o.fillStyle = col; o.fillRect(x - 0.4, y - 9, 0.9, 5); o.fillRect(x, y - 9, 3.4, 2.4); }  // sand castle
      else if (kind === 3) { const g = o.createRadialGradient(x - 2, y - 2, 1, x, y, 6); g.addColorStop(0, '#fff'); g.addColorStop(1, col); o.fillStyle = g; o.beginPath(); o.arc(x, y, 6, 0, 7); o.fill(); }                                                // ball
      else { o.fillStyle = col; o.beginPath(); o.moveTo(x - 6, y + 5); o.lineTo(x + 6, y + 5); o.lineTo(x + 2, y - 6); o.lineTo(x - 2, y - 6); o.closePath(); o.fill(); o.fillStyle = 'rgba(255,255,255,0.4)'; o.fillRect(x - 2, y - 6, 4, 2); }                    // toy truck
      o.restore();
    }
    o.setTransform(1, 0, 0, 1, 0, 0);
    // free area for walkers (also exposed to icons: Dm)
    this._comps = Z.components(k => Z.Dm[k] > 10);
  },

  // ---- equipment, drawn every frame (some parts move)
  _drawItem(c, it, t, al) {
    c.save(); c.translate(it.x, it.y); c.globalAlpha = al;
    const shadow = (w, h) => { c.fillStyle = 'rgba(20,40,10,0.25)'; c.beginPath(); c.ellipse(4, 6, w, h, 0, 0, 7); c.fill(); };
    const matRect = (w, h) => { c.fillStyle = 'rgba(20,40,10,0.22)'; c.beginPath(); c.roundRect(-w + 3, -h + 4, w * 2, h * 2, 14); c.fill(); c.fillStyle = it.mat; c.beginPath(); c.roundRect(-w, -h, w * 2, h * 2, 14); c.fill(); c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.roundRect(-w + 4, -h + 4, w * 2 - 8, h * 2 - 8, 11); c.fill(); };
    const line = (x1, y1, x2, y2, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    switch (it.type) {
      case 'merry': {
        c.fillStyle = 'rgba(20,40,10,0.22)'; c.beginPath(); c.arc(3, 4, 54, 0, 7); c.fill(); c.fillStyle = it.mat; c.beginPath(); c.arc(0, 0, 52, 0, 7); c.fill();
        c.rotate(t * 0.7 + it.ph); const cols = ['#e5484d', '#f2c94c', '#2f80ed', '#27ae60', '#e5484d', '#f2c94c', '#2f80ed', '#27ae60'];
        for (let i = 0; i < 8; i++) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 36, i * 0.785, (i + 1) * 0.785); c.closePath(); c.fill(); }
        c.strokeStyle = '#8a929c'; c.lineWidth = 2.4; for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.4; c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a + 1.571) * 30, Math.sin(a + 1.571) * 30); c.stroke(); }
        c.fillStyle = '#d9dee5'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill(); break;
      }
      case 'swing': {
        matRect(62, 44); line(-48, 0, 48, 0, '#5b6670', 5); line(-48, -2, 48, -2, '#9aa5b0', 1.6);
        for (const x of [-46, 46]) { c.fillStyle = '#4a545e'; c.beginPath(); c.arc(x, 0, 5, 0, 7); c.fill(); }
        [-22, 22].forEach((x, i) => { const sw = Math.sin(t * 1.7 + it.ph + i * 1.4) * 22; line(x - 7, 0, x - 7, sw, 'rgba(80,90,100,0.7)', 1); line(x + 7, 0, x + 7, sw, 'rgba(80,90,100,0.7)', 1); c.fillStyle = 'rgba(20,40,10,0.25)'; c.fillRect(x - 9 + 3, sw - 3 + 4, 18, 7); c.fillStyle = i ? '#e5484d' : '#2f80ed'; c.beginPath(); c.roundRect(x - 9, sw - 3, 18, 7, 2); c.fill(); });
        break;
      }
      case 'slide': {
        matRect(56, 58); shadow(18, 54);
        c.fillStyle = '#d7dce2'; c.fillRect(-12, -48, 24, 24); c.strokeStyle = '#8a929c'; c.lineWidth = 1.4; c.strokeRect(-12, -48, 24, 24);
        for (let i = 0; i < 4; i++) line(-8, -26 + i * 0, 8, -26, '#8a929c', 1);
        c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(-10, -24); c.lineTo(10, -24); c.lineTo(13, 44); c.lineTo(-13, 44); c.closePath(); c.fill();
        c.strokeStyle = '#e5484d'; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -24); c.lineTo(-13, 44); c.moveTo(10, -24); c.lineTo(13, 44); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-3, -20, 4, 60);
        for (let i = 0; i < 5; i++) line(-9, -45 + i * 4.6, 9, -45 + i * 4.6, '#6b7480', 1.2); break;
      }
      case 'seesaw': {
        matRect(62, 30); const tilt = Math.sin(t * 1.3 + it.ph), L = 50 * Math.cos(tilt * 0.35);
        c.fillStyle = 'rgba(20,40,10,0.25)'; c.fillRect(-L + 3, -4 + 4, L * 2, 8); line(-L, 0, L, 0, '#d9a23a', 8); line(-L, -1.5, L, -1.5, '#f3d27a', 2);
        for (const s of [-1, 1]) { c.fillStyle = s * tilt > 0 ? '#e5484d' : '#2f80ed'; c.beginPath(); c.arc(s * (L - 2), 0, 6 + s * tilt * 1.5, 0, 7); c.fill(); }
        c.fillStyle = '#5b6670'; c.beginPath(); c.arc(0, 0, 4.5, 0, 7); c.fill(); break;
      }
      case 'climb': {
        matRect(52, 52); c.fillStyle = 'rgba(20,40,10,0.25)'; c.fillRect(-36 + 5, -36 + 6, 72, 72);
        c.strokeStyle = 'rgba(190,60,50,0.9)'; c.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-36, i * 12); c.lineTo(36, i * 12); c.moveTo(i * 12, -36); c.lineTo(i * 12, 36); c.stroke(); }
        c.strokeStyle = '#4a7ab0'; c.lineWidth = 5; c.strokeRect(-36, -36, 72, 72);
        for (const [x, y] of [[-36, -36], [36, -36], [-36, 36], [36, 36]]) { c.fillStyle = '#e8edf2'; c.beginPath(); c.arc(x, y, 4.5, 0, 7); c.fill(); }
        c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); break;
      }
      case 'trampoline': {
        c.fillStyle = 'rgba(20,40,10,0.25)'; c.beginPath(); c.arc(4, 5, 40, 0, 7); c.fill();
        c.fillStyle = '#2f3a4a'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill(); c.fillStyle = it.mat; c.beginPath(); c.arc(0, 0, 33, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 33 - (Math.sin(t * 5 + it.ph) * 0.5 + 0.5) * 6, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 11, 0, 7); c.stroke();
        c.strokeStyle = '#8a929c'; c.lineWidth = 1; for (let i = 0; i < 16; i++) { const a = i * 0.3927; c.beginPath(); c.moveTo(Math.cos(a) * 33, Math.sin(a) * 33); c.lineTo(Math.cos(a) * 39, Math.sin(a) * 39); c.stroke(); } break;
      }
      default: {                                                      // spring riders
        matRect(56, 30);
        [-30, 0, 30].forEach((x, i) => { const rock = Math.sin(t * 2.2 + it.ph + i * 1.8) * 4; c.fillStyle = 'rgba(20,40,10,0.25)'; c.beginPath(); c.ellipse(x + 3 + rock * 0.5, 5, 9, 5.5, 0, 0, 7); c.fill();
          c.fillStyle = ['#e5484d', '#2f80ed', '#27ae60'][i]; c.beginPath(); c.ellipse(x + rock, 0, 10, 5.5, 0, 0, 7); c.fill(); c.fillStyle = '#fff3'; c.beginPath(); c.ellipse(x + rock, -1.5, 6, 2, 0, 0, 7); c.fill(); c.fillStyle = ['#e5484d', '#2f80ed', '#27ae60'][i]; c.beginPath(); c.arc(x + rock + 10, 0, 4, 0, 7); c.fill(); line(x + rock + 5, -5, x + rock + 5, 5, '#e8edf2', 1.6); });
      }
    }
    c.restore();
  },

  _open(env, x, y) {
    const Z = this._Z, W = env.W, H = env.H, cl = env.clamp;
    let a = cl((Z.dm(x, y) - 8) / 8, 0, 1) * cl((x + 10) / 20, 0, 1) * cl((W + 10 - x) / 20, 0, 1) * cl((y + 10) / 20, 0, 1) * cl((H + 10 - y) / 20, 0, 1);
    if (a > 0) for (const it of this._items) if (this._alpha(it) > 0.1) { const d = Math.hypot(x - it.x, y - it.y); if (d < it.rad + 10) a *= cl((d - it.rad + 6) / 16, 0, 1); }
    return a;
  },
  _alpha(it) { const Z = this._Z, R = this.R, m = Math.min(Z.ds(it.x, it.y), Z.ds(it.x + 40, it.y), Z.ds(it.x - 40, it.y), Z.ds(it.x, it.y + 40), Z.ds(it.x, it.y - 40)); return Math.max(0, Math.min(1, (m - R - 8) / 26)); },
  _pick(env, kind) {
    const icons = env.icons;
    for (let k = 0; k < 40; k++) {
      let x, y;
      if (kind === 'kid' && icons.length && Math.random() < 0.65) { const ic = icons[Math.floor(Math.random() * icons.length)], a = Math.random() * 6.283, d = 20 + Math.random() * 40; x = ic.x + ic.w / 2 + Math.cos(a) * (ic.w / 2 + d); y = ic.y + ic.h / 2 + Math.sin(a) * (ic.h / 2 + d); }
      else { x = Math.random() * env.W; y = Math.random() * env.H; }
      if (this._open(env, x, y) > 0.9) return { x, y };
    }
    return null;
  },
  _balance(env, dt) {
    const herd = this._herd, P = env.P, n = env.icons.length, kids = P.kids <= 0 ? 0 : Math.round(P.kids * Math.min(16, 3 + n * 0.5)), adults = P.kids <= 0 ? 0 : Math.round(kids * 0.3);
    for (const [kind, want] of [['kid', kids], ['adult', adults]]) {
      const live = herd.list.filter(a => a.kind === kind && !a.leaving);
      if (live.length < want) { const p = this._pick(env, kind); if (p) herd.add(kind, p.x, p.y, true); }
      else if (live.length > want) live[Math.floor(Math.random() * live.length)].leaving = true;
    }
    this._dogT -= 1.2;
    if (this._dogT <= 0 && P.kids > 0) {                                                // now and then a dog runs through, with its owner
      this._dogT = 30 + Math.random() * 40;
      const p = this._pick(env, 'adult'); if (p) { const d = herd.add('dog', p.x, p.y, true); d.ttl = 22; const o = herd.add('adult', p.x + 30, p.y + 10, true); o.ttl = 26; }
    }
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z, sig = Z.signature(env.icons);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); this._bal = 0; }
    this._bal -= dt; if (this._bal <= 0 && this._sig) { this._bal = 1.2; this._balance(env, dt); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    if (P.equipment > 0) for (const it of this._items) { const al = this._alpha(it); if (al > 0.02) this._drawItem(ctx, it, t, al); }
    const herd = this._herd;
    for (const a of herd.list) if (a.ttl !== undefined && (a.ttl -= dt) <= 0) a.leaving = true;
    herd.step(dt, t, (x, y) => this._open(env, x, y), () => this._pick(env, 'adult'));
    herd.draw(ctx, t);
  },
});
