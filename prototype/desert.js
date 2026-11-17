// Theme "Desert": sand dunes seen from above, pyramids and a caravan of camels. Every group of icons sits in its own oasis
// (grass, palms, a small pool); camels graze and rest around the oases, now and then a caravan crosses the dunes.
IconIsland.theme({
  params: { camels: 1, time: 0 },
  R: 66,
  PAL: [
    { lo: [205, 150, 80], hi: [250, 224, 160], mid: [232, 190, 118], ridge: 0.5 },     // day
    { lo: [150, 84, 96], hi: [255, 190, 120], mid: [226, 140, 100], ridge: 0.55 },       // sunset
  ],
  _Z: null, _bg: null, _grass: null, _comp: null, _tmp: null, _pyr: [], _pools: [], _herd: null, _bal: 0, _sig: '', _last: -9, _seed: 1, _key: '', _caravan: null, _carT: 12, _palms: [], _streaks: [], _wind: [],

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._herd = new Fauna.Herd(); this._sig = ''; this._carT = 10; this._caravan = null; },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 61), Z = this._Z, pal = this.PAL[P.time | 0] || this.PAL[0];
    Z.resize(env); this._tmp = mk(cw, ch); this._comp = mk(cw, ch); this._key = String(P.time | 0);
    const sc = 2, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2;
    const field = fn => { const c = mk(lw, lh), g = c.getContext('2d'), im = g.createImageData(lw, lh), u = new Uint32Array(im.data.buffer); for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { const q = fn(i * sc, j * sc); u[j * lw + i] = 255 << 24 | Math.max(0, Math.min(255, q[2])) << 16 | Math.max(0, Math.min(255, q[1])) << 8 | Math.max(0, Math.min(255, q[0])); } g.putImageData(im, 0, 0); return c; };
    // ---- dunes: ridged noise stretched along the wind, lit from the upper left
    const hgt = (x, y) => { const wx = x + (env.noise(x / 300, y / 300, seed + 3) - 0.5) * 220, wy = y * 1.9 + wx * 0.45; const n = env.fbm(wx / 330, wy / 210, seed + 4, 3), ridge = 1 - Math.abs(n * 2 - 1); return Math.pow(ridge, 1.6) * 1.0 + env.fbm(x / 25, y / 25, seed + 9, 2) * 0.05; };
    const dunes = field((x, y) => {
      const e = 2.5, h0 = hgt(x, y), gx = hgt(x + e, y) - hgt(x - e, y), gy = hgt(x, y + e) - hgt(x, y - e), sh = Math.max(0, Math.min(1, 0.55 - (gx + gy) * 5.5 + (h0 - 0.5) * 0.4));
      const rip = Math.sin((x * 0.5 + y * 1.1 + h0 * 180) / 3.1) * 0.018;
      const t = Math.max(0, Math.min(1, sh + rip)), m = t < 0.5 ? t * 2 : 1, lo = pal.lo, mid = pal.mid, hi = pal.hi;
      if (t < 0.5) return [lo[0] + (mid[0] - lo[0]) * m, lo[1] + (mid[1] - lo[1]) * m, lo[2] + (mid[2] - lo[2]) * m];
      const u = (t - 0.5) * 2; return [mid[0] + (hi[0] - mid[0]) * u, mid[1] + (hi[1] - mid[1]) * u, mid[2] + (hi[2] - mid[2]) * u];
    });
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(dunes, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 250; i < n; i++) { b.globalAlpha = 0.15 + r() * 0.2; b.fillStyle = r() < 0.5 ? 'rgba(120,70,20,1)' : 'rgba(255,240,200,1)'; b.fillRect(r() * W, r() * H, 1.2, 1.2); }
    b.globalAlpha = 1;
    for (let i = 0; i < W * H / 60000; i++) {                                              // small rocks and dry tufts
      const x = r() * W, y = r() * H, z = 2 + r() * 3.5;
      b.fillStyle = 'rgba(90,50,15,0.3)'; b.beginPath(); b.ellipse(x + 2, y + 2, z * 1.3, z, 0, 0, 7); b.fill(); b.fillStyle = r() < 0.7 ? '#b5895a' : '#9a7a52'; b.beginPath(); b.ellipse(x, y, z, z * 0.8, 0.5, 0, 7); b.fill(); b.fillStyle = 'rgba(255,255,255,0.3)'; b.beginPath(); b.ellipse(x - z * 0.3, y - z * 0.3, z * 0.4, z * 0.25, 0, 0, 7); b.fill();
    }
    // ---- palm sprites (top view: radiating fronds, shadow to the lower right)
    const SZ = 110, TS = 1.5, palms = [];
    for (let v = 0; v < 4; v++) {
      const cs = mk(SZ * S * TS, SZ * S * TS), c = cs.getContext('2d'), rr = env.rng(seed * 17 + v * 5 + 3), cx = 50, cy = 48, N = 9 + (v % 2) * 2; c.scale(S * TS, S * TS);
      const fronds = (ox, oy, col1, col2, vein, al) => {
        for (let i = 0; i < N; i++) {
          const a = i / N * 6.283 + rr() * 0.25, len = 30 + rr() * 8, w = 7 + rr() * 2, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
          c.globalAlpha = al; const g = c.createLinearGradient(ox, oy, ox + ca * len, oy + sa * len); g.addColorStop(0, col1); g.addColorStop(1, col2); c.fillStyle = g;
          c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(ox + ca * len * 0.5 + px * w, oy + sa * len * 0.5 + py * w, ox + ca * len + px * 2 + ca * 2, oy + sa * len + py * 2 + sa * 2); c.quadraticCurveTo(ox + ca * len * 0.5 - px * w, oy + sa * len * 0.5 - py * w, ox, oy); c.fill();
          if (vein) { c.strokeStyle = vein; c.lineWidth = 0.9; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + ca * len * 0.95, oy + sa * len * 0.95); c.stroke(); }
        }
      };
      fronds(cx + 13, cy + 15, 'rgba(60,35,5,0.5)', 'rgba(60,35,5,0.0)', null, 0.5);
      fronds(cx, cy, '#2b6a30', '#5aa83c', 'rgba(210,245,150,0.55)', 1);
      for (let i = 0; i < N; i++) { const a = i / N * 6.283 + 0.3; c.fillStyle = 'rgba(160,230,110,0.22)'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14 - 1, 10, 3, a, 0, 7); c.fill(); }
      c.globalAlpha = 1; c.fillStyle = '#5a3a1c'; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill(); c.fillStyle = '#c98f3a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx + (rr() - 0.5) * 7, cy + (rr() - 0.5) * 7, 1.7, 0, 7); c.fill(); }
      palms.push(cs);
    }
    this._palms = palms;
    this._palm = (o, x, y, z) => { const sc2 = z / 40, sp = palms[Math.floor(Math.abs(Math.sin(x * 12.9 + y * 78.2) * 43758) % 4)]; o.drawImage(sp, x - 50 * sc2, y - 48 * sc2, SZ * sc2, SZ * sc2); };
    this._bush = (o, x, y, z, dark) => {
      o.fillStyle = 'rgba(70,50,10,0.3)'; o.beginPath(); o.ellipse(x + z * 0.4, y + z * 0.55, z, z * 0.85, 0, 0, 7); o.fill();
      const g = o.createRadialGradient(x - z * 0.35, y - z * 0.35, 0.5, x, y, z); g.addColorStop(0, dark ? '#5a9a3a' : '#8cc850'); g.addColorStop(1, dark ? '#2f6a2c' : '#4a8a36'); o.fillStyle = g; o.beginPath(); o.arc(x, y, z, 0, 7); o.fill();
    };
    // ---- natural oases (pools ringed with palms) and pyramids
    const pools = [], pyr = [], bush = this._bush;
    for (let i = 0, n = Math.round(W * H / 900000) + 1, tries = 0; i < n && tries < 60; tries++) {
      const x = 120 + r() * (W - 240), y = 120 + r() * (H - 240), rx = 40 + r() * 20, ry = rx * 0.62;
      if (pools.some(p => Math.hypot(p.x - x, p.y - y) < 330)) continue;
      pools.push({ x, y, rx, ry }); i++;
    }
    for (const p of pools) {
      b.fillStyle = 'rgba(110,150,50,0.35)'; b.beginPath(); b.ellipse(p.x, p.y, p.rx + 38, p.ry + 32, 0, 0, 7); b.fill();
      b.fillStyle = '#6faa42'; b.beginPath(); b.ellipse(p.x, p.y, p.rx + 24, p.ry + 20, 0, 0, 7); b.fill();
      b.fillStyle = '#8cc654'; b.beginPath(); b.ellipse(p.x - 3, p.y - 3, p.rx + 14, p.ry + 11, 0, 0, 7); b.fill();
      const g = b.createLinearGradient(p.x - p.rx, p.y - p.ry, p.x + p.rx, p.y + p.ry); g.addColorStop(0, '#8fd8dc'); g.addColorStop(1, '#2f8fae'); b.fillStyle = g; b.beginPath(); b.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); b.fill();
      b.strokeStyle = 'rgba(255,255,255,0.45)'; b.lineWidth = 1.5; b.beginPath(); b.ellipse(p.x - 5, p.y - 4, p.rx * 0.55, p.ry * 0.45, 0, 3.6, 5.3); b.stroke();
      const items = [];
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + r() * 0.6; items.push([p.x + Math.cos(a) * (p.rx + 22 + r() * 12), p.y + Math.sin(a) * (p.ry + 18 + r() * 10), 0]); }
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + r(); items.push([p.x + Math.cos(a) * (p.rx + 6 + r() * 6), p.y + Math.sin(a) * (p.ry + 5 + r() * 5), 1]); }
      items.sort((q1, q2) => q1[1] - q2[1]); for (const it of items) it[2] ? bush(b, it[0], it[1], 4 + r() * 3, r() < 0.4) : this._palm(b, it[0], it[1], 26 + r() * 8);
    }
    this._pools = pools; this._bg = bg;
    const cx0 = W * (0.62 + r() * 0.25), cy0 = H * (0.2 + r() * 0.4);
    [[0, 0, 150], [-135, 95, 105], [95, 118, 76]].forEach(q => pyr.push({ x: cx0 + q[0], y: cy0 + q[1], s: q[2] }));
    this._pyr = pyr;
    // ---- oasis ground
    const gt = field((x, y) => { const n = env.fbm(x / 80, y / 80, seed + 12, 3), m = env.noise(x / 12, y / 12, seed + 13), t = n * 0.9 + m * 0.2; return [96 + t * 42, 160 + t * 46, 70 + t * 30]; });
    const grass = mk(cw, ch), g2 = grass.getContext('2d'); g2.scale(S, S); g2.drawImage(gt, 0, 0, lw * sc, lh * sc);
    g2.lineCap = 'round'; for (let i = 0, n = W * H / 420; i < n; i++) { const x = r() * W, y = r() * H; g2.globalAlpha = 0.3 + r() * 0.2; g2.strokeStyle = r() < 0.5 ? '#3f7f33' : '#b5e07a'; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 3); g2.stroke(); }
    g2.globalAlpha = 1; this._grass = grass;
    this._streaks = Array.from({ length: 16 }, () => ({ x: r() * W, y: r() * H, l: 90 + r() * 160, v: 22 + r() * 30, a: 0.05 + r() * 0.08, ph: r() * 6 }));
    this._sig = ''; this._last = -9;
  },

  _compose(env) {
    const { S } = env, Z = this._Z, o = this._comp.getContext('2d'), R = this.R, bush = this._bush;
    Z.update(env.icons);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._bg, 0, 0);
    const lines = Z.lines();
    o.setTransform(S, 0, 0, S, 0, 0); o.lineCap = 'round'; o.lineJoin = 'round';
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(110,150,50,0.28)'; o.lineWidth = 46; o.stroke(); o.strokeStyle = 'rgba(100,140,45,0.35)'; o.lineWidth = 28; o.stroke(); }   // damp ring where the sand turns green
    Z.paint(o, this._grass, this._tmp, S);
    o.setTransform(S, 0, 0, S, 0, 0);
    // a pool in each oasis, at the spot furthest from the icons
    const comps = Z.components(k => Z.Ds[k] < R - 22 && Z.Dm[k] > 30);
    for (const cp of comps) {
      let best = -1, bd = 0; for (const k of cp.cells) if (Z.Dm[k] > bd) { bd = Z.Dm[k]; best = k; }
      if (best < 0 || bd < 36) continue;
      const p = Z.cellPoint(best), rx = Math.min(30, bd - 10), ry = rx * 0.66;
      o.fillStyle = 'rgba(70,50,10,0.25)'; o.beginPath(); o.ellipse(p.x + 2, p.y + 3, rx + 4, ry + 4, 0, 0, 7); o.fill(); o.fillStyle = '#9fcf68'; o.beginPath(); o.ellipse(p.x, p.y, rx + 4, ry + 4, 0, 0, 7); o.fill();
      const g = o.createLinearGradient(p.x - rx, p.y - ry, p.x + rx, p.y + ry); g.addColorStop(0, '#8fd8dc'); g.addColorStop(1, '#2f8fae'); o.fillStyle = g; o.beginPath(); o.ellipse(p.x, p.y, rx, ry, 0, 0, 7); o.fill();
      o.strokeStyle = 'rgba(255,255,255,0.45)'; o.lineWidth = 1.3; o.beginPath(); o.ellipse(p.x - 3, p.y - 3, rx * 0.55, ry * 0.45, 0, 3.6, 5.3); o.stroke();
    }
    // vegetation along the oasis edge: small bushes everywhere, palms in between
    const items = [];
    for (const line of lines) {
      if (line.length < 3) continue;
      let acc = 0, nb = 0, np = 12;
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1], bb = line[i]; acc += Math.hypot(bb[0] - a[0], bb[1] - a[1]);
        if (acc >= nb) { const h = env.hash(Math.round(bb[0] / 5), Math.round(bb[1] / 5), 71); items.push([bb[0], bb[1], 0, 5 + h * 3.5, h < 0.4]); nb = acc + 7 + h * 4; }
        if (acc >= np) { const h = env.hash(Math.round(bb[0] / 7), Math.round(bb[1] / 7), 72); items.push([bb[0] + (h - 0.5) * 8, bb[1] + (h - 0.5) * 8, 1, 24 + h * 12, 0]); np = acc + 34 + h * 26; }
      }
    }
    items.sort((q1, q2) => q1[2] - q2[2] || q1[1] - q2[1]);
    for (const it of items) it[2] ? this._palm(o, it[0], it[1], it[3]) : bush(o, it[0], it[1], it[3], it[4]);
    o.setTransform(1, 0, 0, 1, 0, 0);
  },

  _pyramid(c, p, al) {
    const s = p.s, h = s / 2, ax = -s * 0.06, ay = -s * 0.1;                      // apex slightly up-left for a bit of perspective
    c.save(); c.translate(p.x, p.y); c.globalAlpha = al;
    c.fillStyle = 'rgba(100,55,20,0.32)'; c.beginPath(); c.moveTo(-h, h); c.lineTo(h, h); c.lineTo(h, -h); c.lineTo(ax + s * 0.75, ay + s * 0.5); c.closePath(); c.fill();
    const face = (x1, y1, x2, y2, col, col2) => { const g = c.createLinearGradient(x1, y1, ax, ay); g.addColorStop(0, col); g.addColorStop(1, col2); c.fillStyle = g; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(ax, ay); c.closePath(); c.fill(); };
    face(-h, -h, h, -h, '#f1d595', '#fbe9b4'); face(-h, h, -h, -h, '#e2bb74', '#f1d28f'); face(h, -h, h, h, '#b98445', '#cf9a58'); face(h, h, -h, h, '#a8733a', '#c08a4c');
    c.strokeStyle = 'rgba(110,70,25,0.3)'; c.lineWidth = 1;
    for (let k = 1; k < 5; k++) { const f = k / 5, x0 = -h + (ax + h) * f, y0 = -h + (ay + h) * f, x1 = h + (ax - h) * f, y1 = h + (ay - h) * f; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath(); c.stroke(); }
    c.strokeStyle = 'rgba(90,55,20,0.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-h, -h); c.lineTo(ax, ay); c.lineTo(h, -h); c.moveTo(h, h); c.lineTo(ax, ay); c.lineTo(-h, h); c.stroke();
    c.restore();
  },
  _alpha(x, y, rad) { const Z = this._Z, R = this.R, m = Math.min(Z.ds(x, y), Z.ds(x + rad, y), Z.ds(x - rad, y), Z.ds(x, y + rad), Z.ds(x, y - rad)); return Math.max(0, Math.min(1, (m - R - 6) / 26)); },

  _open(env, x, y) {
    const Z = this._Z, cl = env.clamp, W = env.W, H = env.H, R = this.R, ds = Z.ds(x, y);
    let band = cl((ds - R - 14) / 14, 0, 1) * cl((R + 190 - ds) / 50, 0, 1);
    for (const p of this._pools) { const d = Math.hypot((x - p.x) / (p.rx + 40), (y - p.y) / (p.ry + 36)); band = Math.max(band, cl((d - 1.05) / 0.2, 0, 1) * cl((3.2 - d) / 0.8, 0, 1)); }
    if (band <= 0) return 0;
    let a = band * cl((Z.dm(x, y) - 10) / 10, 0, 1) * cl((x + 10) / 20, 0, 1) * cl((W + 10 - x) / 20, 0, 1) * cl((y + 10) / 20, 0, 1) * cl((H + 10 - y) / 20, 0, 1);
    for (const p of this._pyr) { if (this._alpha(p.x, p.y, p.s * 0.5) < 0.1) continue; const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y)); if (d < p.s * 0.7) a *= cl((d - p.s * 0.55) / 20, 0, 1); }
    for (const p of this._pools) { const d = Math.hypot((x - p.x) / (p.rx + 30), (y - p.y) / (p.ry + 26)); if (d < 1) a = 0; }
    return a;
  },
  _pick(env) { for (let k = 0; k < 60; k++) { const x = Math.random() * env.W, y = Math.random() * env.H; if (this._open(env, x, y) > 0.9) return { x, y }; } return null; },
  _balance(env) {
    const herd = this._herd, P = env.P, n = env.icons.length, want = P.camels <= 0 ? 0 : Math.round(P.camels * Math.min(8, 2 + n * 0.3)), live = herd.list.filter(a => !a.leaving);
    if (live.length < want) { const p = this._pick(env); if (p) herd.add('camel', p.x, p.y, true); } else if (live.length > want) live[Math.floor(Math.random() * live.length)].leaving = true;
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z, sig = Z.signature(env.icons);
    if (this._key !== String(P.time | 0)) this.rebuild(env);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); this._bal = 0; }
    this._bal -= dt; if (this._bal <= 0 && this._sig) { this._bal = 1.5; this._balance(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    // wind-blown sand
    ctx.lineCap = 'round';
    for (const s of this._streaks) { s.x += s.v * dt; if (s.x - s.l > W) { s.x = -20; s.y = Math.random() * H; } ctx.strokeStyle = (P.time | 0) === 1 ? `rgba(255,220,180,${s.a})` : `rgba(255,245,215,${s.a})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x - s.l, s.y + Math.sin(s.ph + t * 0.3) * 4); ctx.quadraticCurveTo(s.x - s.l / 2, s.y + Math.sin(s.ph + 2 + t * 0.3) * 10, s.x, s.y); ctx.stroke(); }
    for (const p of this._pyr) { const al = this._alpha(p.x, p.y, p.s * 0.5); if (al > 0.02) this._pyramid(ctx, p, al); }
    const herd = this._herd;
    herd.step(dt, t, (x, y) => this._open(env, x, y), () => this._pick(env));
    herd.draw(ctx, t);
    // caravan of camels crossing the dunes now and then
    this._carT -= dt;
    if (!this._caravan && this._carT <= 0 && P.camels > 0) {
      const dir = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 3);
      this._caravan = { s: dir > 0 ? -60 : W + 60, dir, y0: H * (0.15 + Math.random() * 0.7), ph: Math.random() * 6, amp: 40 + Math.random() * 50, v: 24, cs: Array.from({ length: n }, () => Fauna.make('camel', 0, 0)) };
    }
    const cv = this._caravan;
    if (cv) {
      cv.s += cv.v * cv.dir * dt;
      const pos = s => ({ x: s, y: cv.y0 + Math.sin(s / 220 + cv.ph) * cv.amp });
      cv.cs.forEach((a, i) => { const s = cv.s - cv.dir * i * 92, p = pos(s), q = pos(s + cv.dir * 4); a.x = p.x; a.y = p.y; a.ang = Math.atan2(q.y - p.y, q.x - p.x); a.v = cv.v; a.ph += cv.v * dt * 0.34 / 1.2; });
      const last = cv.s - cv.dir * (cv.cs.length - 1) * 92;
      for (const a of cv.cs) if (a.x > -120 && a.x < W + 120) Fauna.drawOne(ctx, a, t);
      if ((cv.dir > 0 && last > W + 120) || (cv.dir < 0 && last < -120)) { this._caravan = null; this._carT = 40 + Math.random() * 45; }
    }
    if ((P.time | 0) === 1) { ctx.globalAlpha = 1; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,150,70,0.12)'); g.addColorStop(1, 'rgba(120,40,90,0.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  },
});
