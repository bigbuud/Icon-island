// Theme "Winter": a snowy landscape from above. Every group of icons sits on its own frozen pond with skaters;
// reindeer, arctic foxes, rabbits, a dog and squirrels roam the snow, cabins puff smoke, a mix of firs, spruces, pines, bare oaks, birches and snowy bushes stands around and snow keeps falling.
IconIsland.theme({
  params: { snow: 1, critters: 1, time: 0 },
  R: 64,
  _Z: null, _bg: null, _ice: null, _comp: null, _tmp: null, _items: [], _trees: [], _flakes: [], _herdIn: null, _herdOut: null, _bal: 0, _sig: '', _last: -9, _seed: 1, _smoke: [],

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._herdIn = new Fauna.Herd(); this._herdOut = new Fauna.Herd(); this._herdIn.kindScale = { skater: 0.7 }; this._herdOut.kindScale = { reindeer: 0.75, arcticfox: 0.75, rabbit: 1.0, dog: 1.1, squirrel: 1.1 }; this._sig = ''; },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 81), Z = this._Z;
    Z.resize(env); this._tmp = mk(cw, ch); this._comp = mk(cw, ch);
    const sc = 2, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2;
    const field = fn => { const c = mk(lw, lh), g = c.getContext('2d'), im = g.createImageData(lw, lh), u = new Uint32Array(im.data.buffer); for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { const q = fn(i * sc, j * sc); u[j * lw + i] = 255 << 24 | Math.max(0, Math.min(255, q[2])) << 16 | Math.max(0, Math.min(255, q[1])) << 8 | Math.max(0, Math.min(255, q[0])); } g.putImageData(im, 0, 0); return c; };
    // ---- snow: soft drifts lit from the upper left, blue shadows
    const hh = (x, y) => env.fbm(x / 190, y / 150, seed + 4, 3) + env.fbm(x / 40, y / 40, seed + 5, 2) * 0.12;
    const snow = field((x, y) => { const e = 3, gx = hh(x + e, y) - hh(x - e, y), gy = hh(x, y + e) - hh(x, y - e), t = Math.max(0, Math.min(1, 0.62 - (gx + gy) * 3.2 + (env.noise(x / 6, y / 6, seed + 6) - 0.5) * 0.05)); return [200 + t * 52, 218 + t * 36, 240 + t * 15]; });
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(snow, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 220; i < n; i++) { b.globalAlpha = 0.25 + r() * 0.5; b.fillStyle = r() < 0.7 ? '#ffffff' : '#a9c6e6'; b.fillRect(r() * W, r() * H, 1.2, 1.2); }
    b.globalAlpha = 1;
    // ---- items: cabins and snowmen (drawn every frame, fading when a pond grows over them)
    const items = [], put = (type, rad, n) => { for (let i = 0, tries = 0; i < n && tries < 80; tries++) { const x = 90 + r() * (W - 180), y = 90 + r() * (H - 180); if (items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + rad + 30)) continue; items.push({ type, x, y, rad, rot: (r() - 0.5) * 0.6, ph: r() * 6 }); i++; } };
    put('cabin', 82, Math.max(1, Math.round(W * H / 900000)) + 1);
    this._items = items;
    // ---- trees: firs, slim spruces, round pines, bare oaks, birches and snowy bushes
    const SZ = 120, TS = 1.5, spr = { fir: [], spruce: [], pine: [], bare: [], birch: [], bush: [] };
    const mkSprite = (kind, v, draw) => { const cs = mk(SZ * S * TS, SZ * S * TS), c = cs.getContext('2d'), rr = env.rng(seed * 13 + v * 7 + kind.length * 31); c.scale(S * TS, S * TS); draw(c, rr, 56, 54); spr[kind].push(cs); };
    const shadow = (c, cx, cy, R0) => { c.fillStyle = 'rgba(40,70,120,0.3)'; c.beginPath(); c.ellipse(cx + 12, cy + 14, R0, R0 * 0.85, 0, 0, 7); c.fill(); };
    const tiers = (c, rr, cx, cy, R0, pts, cols, ratio, k) => {
      [[R0, pts], [R0 * 0.76, pts - 1], [R0 * 0.52, pts - 3], [R0 * 0.3, pts - 5]].forEach((t, ti) => {
        const star = (rad, col, ox, oy, rot, kk) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < t[1] * 2; i++) { const a = i / (t[1] * 2) * 6.283 + rot, q = i % 2 ? rad * ratio : rad * (0.95 + kk * 0.08); c[i ? 'lineTo' : 'moveTo'](cx + ox + Math.cos(a) * q, cy + oy + Math.sin(a) * q); } c.closePath(); c.fill(); };
        const rot = ti * 0.3 + rr() * 0.2; star(t[0], cols[ti], -ti * 1.5, -ti * 1.5, rot, rr()); star(t[0] * 0.8, 'rgba(250,253,255,' + k + ')', -ti * 1.5 - 3, -ti * 1.5 - 3, rot + 0.05, 0.3);
      });
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx - 6, cy - 6, 3.4, 0, 7); c.fill();
    };
    for (let v = 0; v < 4; v++) mkSprite('fir', v, (c, rr, cx, cy) => { const R0 = 38 + (v % 2) * 3; shadow(c, cx, cy, R0); tiers(c, rr, cx, cy, R0, 12, ['#173f33', '#235a44', '#36765a', '#559a78'], 0.56, 0.9); });
    for (let v = 0; v < 3; v++) mkSprite('spruce', v, (c, rr, cx, cy) => { const R0 = 33; shadow(c, cx, cy, R0); tiers(c, rr, cx, cy, R0, 9, ['#0e2c2e', '#17463f', '#256052', '#3f8470'], 0.42, 0.72); });
    for (let v = 0; v < 3; v++) mkSprite('pine', v, (c, rr, cx, cy) => {
      shadow(c, cx, cy, 36);
      for (let i = 0; i < 9; i++) { const a = rr() * 6.283, d = rr() * 22, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, q = 12 + rr() * 8; const g = c.createRadialGradient(x - 3, y - 3, 1, x, y, q); g.addColorStop(0, '#4a8a6a'); g.addColorStop(1, '#1d4a3a'); c.fillStyle = g; c.beginPath(); c.arc(x, y, q, 0, 7); c.fill(); c.fillStyle = 'rgba(250,253,255,0.88)'; c.beginPath(); c.ellipse(x - 3, y - 4, q * 0.7, q * 0.5, -0.4, 0, 7); c.fill(); }
    });
    const branches = (c, rr, cx, cy, len, col, snow, wid, spread) => {
      const go = (x, y, a, l, d, w) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = snow; c.globalAlpha = 0.85; c.lineWidth = Math.max(0.6, w * 0.45); c.beginPath(); c.moveTo(x - 0.8, y - 0.9); c.lineTo(x2 - 0.8, y2 - 0.9); c.stroke(); c.globalAlpha = 1; if (d > 0) { const n = 2 + (rr() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) go(x2, y2, a + (i - (n - 1) / 2) * spread + (rr() - 0.5) * 0.35, l * (0.66 + rr() * 0.12), d - 1, w * 0.68); } else { c.fillStyle = '#fff'; c.beginPath(); c.arc(x2, y2, 1.1, 0, 7); c.fill(); } };
      const n = 6 + ((rr() * 3) | 0); for (let i = 0; i < n; i++) go(cx, cy, i / n * 6.283 + rr() * 0.4, len * (0.8 + rr() * 0.3), 3, wid);
    };
    for (let v = 0; v < 3; v++) mkSprite('bare', v, (c, rr, cx, cy) => { shadow(c, cx, cy, 30); branches(c, rr, cx, cy, 15, '#4a382c', '#ffffff', 3.4, 0.6); c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(cx, cy, 4.2, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(cx - 1, cy - 1, 2.6, 0, 7); c.fill(); });
    for (let v = 0; v < 3; v++) mkSprite('birch', v, (c, rr, cx, cy) => { shadow(c, cx, cy, 26); branches(c, rr, cx, cy, 12, '#9a968c', '#ffffff', 2.4, 0.7); c.fillStyle = '#d8d4cc'; c.beginPath(); c.arc(cx, cy, 3, 0, 7); c.fill(); c.fillStyle = '#2a2824'; c.fillRect(cx - 2, cy - 0.6, 1.6, 1); });
    for (let v = 0; v < 3; v++) mkSprite('bush', v, (c, rr, cx, cy) => {
      shadow(c, cx, cy, 30);
      for (let i = 0; i < 6; i++) { const a = rr() * 6.283, d = rr() * 17, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, q = 11 + rr() * 8, g = c.createRadialGradient(x - 3, y - 3, 1, x, y, q); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#bcd2ec'); c.fillStyle = g; c.beginPath(); c.arc(x, y, q, 0, 7); c.fill(); }
      c.fillStyle = '#2f6a4a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(cx + (rr() - 0.5) * 36, cy + (rr() - 0.5) * 30, 3.2, 1.6, rr() * 3, 0, 7); c.fill(); }
      if (v !== 1) { c.fillStyle = '#c8323a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx + (rr() - 0.5) * 30, cy + (rr() - 0.5) * 26, 1.7, 0, 7); c.fill(); } }
    });
    this._trees = [];
    const pickKind = (x, y) => { const f = env.fbm(x / 260, y / 260, seed + 30, 3) > 0.55, q = r(); if (f) return q < 0.5 ? 'fir' : q < 0.75 ? 'spruce' : q < 0.88 ? 'pine' : 'bare'; return q < 0.28 ? 'bare' : q < 0.52 ? 'birch' : q < 0.67 ? 'fir' : q < 0.8 ? 'pine' : q < 0.9 ? 'spruce' : 'bush'; };
    const zr = { fir: [28, 48], spruce: [24, 42], pine: [26, 44], bare: [28, 44], birch: [20, 32], bush: [14, 24] };
    for (let i = 0, n = W * H / 32000, tries = 0; i < n && tries < 600; tries++) {
      const x = r() * W, y = r() * H, kind = pickKind(x, y), z = zr[kind][0] + r() * (zr[kind][1] - zr[kind][0]);
      if (items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + z)) continue;
      const set = spr[kind]; this._trees.push([x, y, z, set[Math.floor(r() * set.length)]]); i++;
    }
    for (let i = 0, n = W * H / 60000, tries = 0; i < n && tries < 300; tries++) {                       // small bushes and saplings in between
      const x = r() * W, y = r() * H, kind = r() < 0.7 ? 'bush' : 'birch', z = kind === 'bush' ? 10 + r() * 8 : 14 + r() * 6;
      if (items.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + z)) continue;
      const set = spr[kind]; this._trees.push([x, y, z, set[Math.floor(r() * set.length)]]); i++;
    }
    this._trees.sort((p, q) => p[1] - q[1]);
    this._bg = bg;
    // ---- ice: pale blue, scratched by skates, a few cracks
    const iceBase = field((x, y) => { const n = env.fbm(x / 90, y / 90, seed + 21, 3), g = env.noise(x / 4, y / 4, seed + 22) * 0.05, t = n * 0.8 + g; return [178 + t * 40, 224 + t * 26, 244 + t * 10]; });
    const ice = mk(cw, ch), ig = ice.getContext('2d'); ig.scale(S, S); ig.drawImage(iceBase, 0, 0, lw * sc, lh * sc);
    ig.lineCap = 'round';
    for (let i = 0, n = W * H / 4500; i < n; i++) { const x = r() * W, y = r() * H, a = r() * 6.283, l = 40 + r() * 140; ig.globalAlpha = 0.18 + r() * 0.25; ig.strokeStyle = r() < 0.8 ? '#ffffff' : '#7fb0d8'; ig.lineWidth = 0.8 + r() * 0.7; ig.beginPath(); ig.moveTo(x, y); ig.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 40, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 40, x + Math.cos(a) * l, y + Math.sin(a) * l); ig.stroke(); }
    for (let i = 0, n = W * H / 60000; i < n; i++) { let x = r() * W, y = r() * H, a = r() * 6.283; ig.globalAlpha = 0.5; ig.strokeStyle = '#8cb8de'; ig.lineWidth = 0.8; ig.beginPath(); ig.moveTo(x, y); for (let k = 0; k < 6; k++) { a += (r() - 0.5) * 1.4; x += Math.cos(a) * 12; y += Math.sin(a) * 12; ig.lineTo(x, y); } ig.stroke(); }
    ig.globalAlpha = 0.3; const gl = ig.createLinearGradient(0, 0, W, H); gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, '#ffffff'); ig.fillStyle = gl; ig.fillRect(0, 0, W, H); ig.globalAlpha = 1;
    this._ice = ice;
    this._flakes = Array.from({ length: Math.round(W * H / 6500 * Math.max(0.5, P.snow)) + 30 }, () => ({ x: r() * W, y: r() * H, r: 0.8 + r() * 2, v: 14 + r() * 26, ph: r() * 6, l: r() < 0.3 ? 1 : 0 }));
    this._fk = String(P.snow); this._sig = ''; this._last = -9;
  },

  _compose(env) {
    const { S } = env, Z = this._Z, o = this._comp.getContext('2d'), R = this.R;
    Z.update(env.icons);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._bg, 0, 0);
    o.setTransform(S, 0, 0, S, 0, 0);
    for (const t of this._trees) { const sc2 = t[2] / 40; o.drawImage(t[3], t[0] - 56 * sc2, t[1] - 54 * sc2, 120 * sc2, 120 * sc2); }
    const lines = Z.lines();
    o.lineCap = 'round'; o.lineJoin = 'round';
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(70,110,170,0.22)'; o.lineWidth = 34; o.stroke(); }
    Z.paint(o, this._ice, this._tmp, S);
    o.setTransform(S, 0, 0, S, 0, 0);
    // snow bank around the pond: overlapping white lumps with blue shadows
    const lumps = [];
    for (const line of lines) {
      if (line.length < 3) continue; let acc = 0, next = 0;
      for (let i = 1; i < line.length; i++) { const a = line[i - 1], bb = line[i]; acc += Math.hypot(bb[0] - a[0], bb[1] - a[1]); if (acc >= next) { const h = env.hash(Math.round(bb[0] / 5), Math.round(bb[1] / 5), 61); lumps.push([bb[0] + (h - 0.5) * 3, bb[1] + (env.hash(Math.round(bb[0] / 5), Math.round(bb[1] / 5), 62) - 0.5) * 3, 5.5 + h * 4.5]); next = acc + 5 + h * 3; } }
    }
    for (const l of lumps) { o.fillStyle = 'rgba(60,100,160,0.3)'; o.beginPath(); o.ellipse(l[0] + l[2] * 0.3, l[1] + l[2] * 0.5, l[2], l[2] * 0.85, 0, 0, 7); o.fill(); }
    for (const l of lumps) { const g = o.createRadialGradient(l[0] - l[2] * 0.3, l[1] - l[2] * 0.3, 0.5, l[0], l[1], l[2]); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d6e6f7'); o.fillStyle = g; o.beginPath(); o.arc(l[0], l[1], l[2], 0, 7); o.fill(); }
    o.setTransform(1, 0, 0, 1, 0, 0);
    this._comps = Z.components(k => Z.Ds[k] < R - 16 && Z.Dm[k] > 16);
  },

  _alpha(x, y, rad) { const Z = this._Z, m = Math.min(Z.ds(x, y), Z.ds(x + rad, y), Z.ds(x - rad, y), Z.ds(x, y + rad), Z.ds(x, y - rad)); return Math.max(0, Math.min(1, (m - this.R - 14) / 26)); },

  _drawItem(c, it, t, al, night) {
    c.save(); c.translate(it.x, it.y); c.globalAlpha = al;
    if (it.type === 'cabin') {
      c.rotate(it.rot); c.scale(1.4, 1.4);
      c.fillStyle = 'rgba(40,70,130,0.3)'; c.fillRect(-34 + 7, -24 + 9, 68, 48);
      c.fillStyle = '#7a4a2a'; c.fillRect(-34, -24, 68, 48);                                        // roof edge showing below the snow
      c.fillStyle = '#f6fbff'; c.beginPath(); c.roundRect(-35, -26, 66, 42, 6); c.fill();
      c.fillStyle = '#dbe9f7'; c.fillRect(-35, -2, 66, 2); c.fillStyle = '#c4d8ee'; c.beginPath(); c.roundRect(-35, 6, 66, 8, 4); c.fill();
      c.fillStyle = '#8a5a36'; c.fillRect(14, -24, 10, 12); c.fillStyle = '#f6fbff'; c.fillRect(15, -23, 8, 6);                      // chimney
      c.fillStyle = night ? '#ffd27a' : '#c9a36a'; c.fillRect(-26, 15, 9, 4); c.fillRect(2, 15, 9, 4);                          // windows along the front
    } else {
      c.scale(1.3, 1.3);
      c.fillStyle = 'rgba(40,70,130,0.28)'; c.beginPath(); c.ellipse(9, 11, 14, 11, 0, 0, 7); c.fill();
      const ball = (x, y, r0) => { const g = c.createRadialGradient(x - r0 * 0.35, y - r0 * 0.35, 0.5, x, y, r0); g.addColorStop(0, '#fff'); g.addColorStop(1, '#c6daf0'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r0, 0, 7); c.fill(); };
      ball(0, 5, 11); ball(-1, -4, 8.5); ball(-2, -11.5, 6.2);
      c.fillStyle = '#222'; c.beginPath(); c.arc(-4.2, -13.4, 0.9, 0, 7); c.arc(-0.3, -13.6, 0.9, 0, 7); c.fill();
      c.fillStyle = '#f08a24'; c.beginPath(); c.moveTo(-2.3, -12); c.lineTo(3.8, -10.8); c.lineTo(-2.3, -10); c.closePath(); c.fill();
      c.strokeStyle = '#d6423a'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(-1.8, -6.8, 6, 3, 0, 0.1, 3); c.stroke();
      c.fillStyle = '#2a2f3a'; c.beginPath(); c.ellipse(-2, -16.5, 5.5, 2.4, 0, 0, 7); c.fill(); c.fillRect(-4.5, -21, 5, 5);
    }
    c.restore();
  },

  _openIn(env, x, y) { const Z = this._Z, cl = env.clamp; return cl((this.R - 14 - Z.ds(x, y)) / 8, 0, 1) * cl((Z.dm(x, y) - 12) / 8, 0, 1); },
  _openOut(env, x, y) {
    const Z = this._Z, cl = env.clamp, ds = Z.ds(x, y), W = env.W, H = env.H;
    let a = ds > 1e3 ? 1 : cl((ds - this.R - 14) / 14, 0, 1) * cl((this.R + 260 - ds) / 60, 0, 1);
    if (a <= 0) return 0;
    a *= cl((x + 10) / 20, 0, 1) * cl((W + 10 - x) / 20, 0, 1) * cl((y + 10) / 20, 0, 1) * cl((H + 10 - y) / 20, 0, 1);
    for (const it of this._items) { const d = Math.hypot(x - it.x, y - it.y); if (d < it.rad + 14) a *= cl((d - it.rad + 4) / 14, 0, 1); }
    for (const tr of this._trees) { const d = Math.hypot(x - tr[0], y - tr[1]); if (d < tr[2] + 16) a *= cl((d - tr[2] * 0.7) / 16, 0, 1); }
    return a;
  },
  _pickIn(env) { const cs = this._comps || []; let tot = 0; for (const q of cs) tot += q.cells.length; if (!tot) return null; let k = Math.random() * tot; for (const q of cs) { if (k < q.cells.length) return this._Z.cellPoint(q.cells[Math.floor(k)]); k -= q.cells.length; } return null; },
  _pickOut(env) { for (let k = 0; k < 60; k++) { const x = Math.random() * env.W, y = Math.random() * env.H; if (this._openOut(env, x, y) > 0.9) return { x, y }; } return null; },
  _balance(env) {
    const P = env.P, n = env.icons.length, c = P.critters;
    const keep = (herd, kind, want, pick) => { const live = herd.list.filter(a => a.kind === kind && !a.leaving); if (live.length < want) { const p = pick(); if (p) herd.add(kind, p.x, p.y, true); } else if (live.length > want) live[Math.floor(Math.random() * live.length)].leaving = true; };
    keep(this._herdIn, 'skater', n && c > 0 ? Math.round(c * Math.min(12, 2 + n * 0.5)) : 0, () => this._pickIn(env));
    const k = n ? 1 : 2;
    keep(this._herdOut, 'reindeer', c > 0 ? Math.round(c * Math.min(5, 1 + n * 0.12) * k) : 0, () => this._pickOut(env));
    keep(this._herdOut, 'rabbit', c > 0 ? Math.round(c * Math.min(7, 2 + n * 0.25) * k) : 0, () => this._pickOut(env));
    keep(this._herdOut, 'dog', c > 0 ? Math.round(c * Math.min(2, 1 + n * 0.05) * k) : 0, () => this._pickOut(env));
    keep(this._herdOut, 'squirrel', c > 0 && this._trees.length ? Math.round(c * Math.min(5, 2 + n * 0.15) * k) : 0, () => { const t = this._trees[Math.floor(Math.random() * this._trees.length)], x = t[0] + (Math.random() - 0.5) * 60, y = t[1] + (Math.random() - 0.5) * 60; return this._openOut(env, x, y) > 0.9 ? { x, y } : this._pickOut(env); });
    keep(this._herdOut, 'arcticfox', c > 0 ? Math.round(c * Math.min(3, 1 + n * 0.08) * k) : 0, () => this._pickOut(env));
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z, sig = Z.signature(env.icons), night = (P.time | 0) === 1;
    if (this._fk !== String(P.snow)) this.rebuild(env);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); this._bal = 0; }
    this._bal -= dt; if (this._bal <= 0 && this._sig) { this._bal = 1.5; this._balance(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    this._herdIn.step(dt, t, (x, y) => this._openIn(env, x, y), () => this._pickIn(env)); this._herdIn.draw(ctx, t);
    for (const it of this._items) { const al = this._alpha(it.x, it.y, it.rad * 0.6); if (al > 0.02) this._drawItem(ctx, it, t, al, night); }
    this._herdOut.step(dt, t, (x, y) => this._openOut(env, x, y), () => this._pickOut(env)); this._herdOut.draw(ctx, t);
    // smoke from the chimneys
    for (const it of this._items) {
      if (it.type !== 'cabin') continue; const al = this._alpha(it.x, it.y, it.rad * 0.6); if (al < 0.05) continue;
      for (let k = 0; k < 5; k++) { const f = ((t * 0.18 + k / 5 + it.ph) % 1), x = it.x + 19 + f * 34 + Math.sin(f * 6 + it.ph) * 4, y = it.y - 20 - f * 30; ctx.globalAlpha = al * (1 - f) * 0.55; ctx.fillStyle = night ? '#9aa8c0' : '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 3 + f * 9, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (night) {
      ctx.fillStyle = 'rgba(10,24,70,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const it of this._items) { if (it.type !== 'cabin') continue; const al = this._alpha(it.x, it.y, it.rad * 0.6); if (al < 0.05) continue; const g = ctx.createRadialGradient(it.x, it.y + 30, 2, it.x, it.y + 30, 90); g.addColorStop(0, `rgba(255,190,90,${0.5 * al})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.fillRect(it.x - 90, it.y - 60, 180, 190); }
      ctx.globalCompositeOperation = 'source-over';
    }
    // falling snow
    ctx.fillStyle = night ? 'rgba(235,242,255,0.8)' : 'rgba(255,255,255,0.9)';
    if (P.snow > 0) for (const f of this._flakes) { f.y += f.v * dt * (f.l ? 1.4 : 1); f.x += Math.sin(t * 0.7 + f.ph) * 9 * dt + 6 * dt; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } if (f.x > W + 4) f.x = -4; ctx.globalAlpha = f.l ? 0.95 : 0.6; ctx.beginPath(); ctx.arc(f.x, f.y, f.l ? f.r * 1.3 : f.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  },
});
