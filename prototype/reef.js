// Theme "Reef": looking straight down on the sea floor. Every group of icons sits on a sandy lagoon ringed by coral;
// shoals of fish, turtles, jellyfish, a manta ray and now and then a shark swim by while sunlight ripples across the bottom.
IconIsland.theme({
  params: { fish: 1, light: 1 },
  R: 62,
  _Z: null, _bg: null, _sand: null, _comp: null, _tmp: null, _caus: null, _schools: [], _turtles: [], _jelly: [], _bubbles: [], _ray: null, _shark: null, _rayT: 20, _sharkT: 45, _spots: [], _sig: '', _last: -9, _seed: 1, _fk: '',

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._sig = ''; this._rayT = 15; this._sharkT = 40; this._ray = null; this._shark = null; },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 101), Z = this._Z;
    Z.resize(env); this._tmp = mk(cw, ch); this._comp = mk(cw, ch);
    const sc = 2, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2;
    const field = fn => { const c = mk(lw, lh), g = c.getContext('2d'), im = g.createImageData(lw, lh), u = new Uint32Array(im.data.buffer); for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { const q = fn(i * sc, j * sc); u[j * lw + i] = 255 << 24 | Math.max(0, Math.min(255, q[2])) << 16 | Math.max(0, Math.min(255, q[1])) << 8 | Math.max(0, Math.min(255, q[0])); } g.putImageData(im, 0, 0); return c; };
    // ---- open water: deep teal with paler sandy patches and a bright upper-left
    const sea = field((x, y) => { const n = env.fbm(x / 180, y / 140, seed + 4, 3), m = env.fbm(x / 40, y / 40, seed + 5, 2), lit = 1 - (x / W * 0.4 + y / H * 0.5), t = n * 0.8 + m * 0.2; return [12 + t * 34 + lit * 14, 96 + t * 62 + lit * 30, 128 + t * 52 + lit * 26]; });
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(sea, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 9000; i < n; i++) {                                   // rocks and seagrass tufts on the bottom
      const x = r() * W, y = r() * H;
      if (r() < 0.5) { const z = 4 + r() * 9; b.fillStyle = 'rgba(0,25,45,0.35)'; b.beginPath(); b.ellipse(x + z * 0.5, y + z * 0.6, z * 1.1, z * 0.85, 0, 0, 7); b.fill(); const g = b.createRadialGradient(x - z * 0.3, y - z * 0.3, 0.5, x, y, z); g.addColorStop(0, '#6f9aa6'); g.addColorStop(1, '#2f5f70'); b.fillStyle = g; b.beginPath(); b.ellipse(x, y, z, z * 0.85, 0.4, 0, 7); b.fill(); }
      else { b.strokeStyle = r() < 0.5 ? 'rgba(80,190,120,0.55)' : 'rgba(50,150,110,0.55)'; b.lineWidth = 1.4; b.lineCap = 'round'; for (let k = 0; k < 7; k++) { const a = -1.1 + k * 0.37 + (r() - 0.5) * 0.3, l = 8 + r() * 10; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); b.stroke(); } }
    }
    b.globalAlpha = 1; this._bg = bg;
    // ---- lagoon sand
    const sandBase = field((x, y) => { const n = env.fbm(x / 70, y / 70, seed + 21, 3), rip = Math.sin((x * 0.6 + y * 0.8 + n * 60) / 4.2) * 0.04, t = n * 0.6 + rip; return [196 + t * 36, 200 + t * 30, 150 + t * 34]; });
    const sand = mk(cw, ch), sg = sand.getContext('2d'); sg.scale(S, S); sg.drawImage(sandBase, 0, 0, lw * sc, lh * sc);
    for (let i = 0, n = W * H / 120; i < n; i++) { sg.globalAlpha = 0.2 + r() * 0.2; sg.fillStyle = r() < 0.5 ? '#9a8a5a' : '#fffbe0'; sg.fillRect(r() * W, r() * H, 1.2, 1.2); }
    for (let i = 0, n = W * H / 12000; i < n; i++) { const x = r() * W, y = r() * H; sg.globalAlpha = 0.85; sg.fillStyle = ['#f4d9c8', '#f2b8a0', '#ffffff'][Math.floor(r() * 3)]; sg.beginPath(); sg.ellipse(x, y, 2.4, 1.7, r() * 3, 0, 7); sg.fill(); }   // shells
    sg.globalAlpha = 1; this._sand = sand;
    // ---- corals (top view), cached as sprites
    const SZ = 72, TS = 1.6, cols = ['#ff7a7a', '#ff9f43', '#d96bd0', '#f5d142', '#58d0b8', '#9b7bff', '#ff6fa5'], sp = [];
    const mkCoral = (kind, v) => {
      const cs = mk(SZ * S * TS, SZ * S * TS), c = cs.getContext('2d'), rr = env.rng(seed * 19 + v * 11 + 3), cx = 34, cy = 33, col = cols[v % cols.length]; c.scale(S * TS, S * TS); c.lineCap = 'round';
      c.fillStyle = 'rgba(0,30,50,0.32)'; c.beginPath(); c.ellipse(cx + 5, cy + 7, 22, 18, 0, 0, 7); c.fill();
      if (kind === 'branch') {
        const grow = (x, y, a, len, w, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = w * 0.4; c.beginPath(); c.moveTo(x - 0.5, y - 0.5); c.lineTo(x2 - 0.5, y2 - 0.5); c.stroke(); if (d > 0) { grow(x2, y2, a - 0.5 + rr() * 0.2, len * 0.7, w * 0.78, d - 1); grow(x2, y2, a + 0.5 + rr() * 0.2, len * 0.7, w * 0.78, d - 1); } else { c.fillStyle = '#fff6'; c.beginPath(); c.arc(x2, y2, w * 0.7, 0, 7); c.fill(); } };
        const n = 6 + Math.floor(rr() * 3); for (let i = 0; i < n; i++) grow(cx, cy, i / n * 6.283 + rr() * 0.4, 8 + rr() * 3, 4.4, 2);
      } else if (kind === 'brain') {
        const g = c.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 22); g.addColorStop(0, '#e8c27a'); g.addColorStop(1, '#a07a3c'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 21, 0, 7); c.fill();
        c.strokeStyle = 'rgba(90,60,20,0.55)'; c.lineWidth = 1.2; for (let i = 0; i < 40; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * 17; let x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, an = rr() * 6.283; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { an += (rr() - 0.5) * 2.2; x += Math.cos(an) * 3; y += Math.sin(an) * 3; if (Math.hypot(x - cx, y - cy) > 20) break; c.lineTo(x, y); } c.stroke(); }
      } else if (kind === 'plate') {
        for (let k = 3; k >= 0; k--) { c.fillStyle = k % 2 ? col : 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx - k, cy - k, 22 - k * 5, 17 - k * 4, 0.3, 0, 7); c.fill(); if (k % 2 === 0) { c.fillStyle = col; c.beginPath(); c.ellipse(cx - k, cy - k, 21 - k * 5, 16 - k * 4, 0.3, 0, 7); c.fill(); } }
      } else if (kind === 'fan') {
        c.strokeStyle = col; c.lineWidth = 1.1; for (let i = 0; i < 22; i++) { const a = -2.4 + i * 0.22; c.beginPath(); c.moveTo(cx, cy + 12); c.lineTo(cx + Math.cos(a) * 24, cy + 12 + Math.sin(a) * 24); c.stroke(); }
        c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.arc(cx, cy + 12, k * 5, -2.4, 2.4 - 3.1 + 2.4 * 0 + 0.7); c.stroke(); }
      } else if (kind === 'anemone') {
        c.fillStyle = '#8a3f5f'; c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill();
        for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, l = 17 + rr() * 5; c.strokeStyle = col; c.lineWidth = 2.1; c.beginPath(); c.moveTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7); c.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(a) * l, cy + Math.sin(a) * l, 1.5, 0, 7); c.fill(); }
        c.fillStyle = '#ffcf6a'; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
      } else {                                                      // tube sponges
        for (let i = 0; i < 6; i++) { const a = rr() * 6.283, d = rr() * 11, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, z = 5 + rr() * 4; c.fillStyle = 'rgba(0,30,50,0.3)'; c.beginPath(); c.arc(x + 2, y + 3, z, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, z, 0, 7); c.fill(); c.fillStyle = 'rgba(40,10,40,0.75)'; c.beginPath(); c.arc(x, y, z * 0.55, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, z * 0.9, 3.5, 5); c.stroke(); }
      }
      return cs;
    };
    ['branch', 'branch', 'branch', 'brain', 'plate', 'plate', 'fan', 'anemone', 'anemone', 'sponge'].forEach((k, i) => sp.push(mkCoral(k, i + Math.floor(r() * 7))));
    this._sprites = sp;
    // ---- sunlight network (tileable cellular pattern), animated in frame()
    const T = 128, ct = mk(T, T), cg = ct.getContext('2d'), ci = cg.createImageData(T, T), cu = new Uint32Array(ci.data.buffer), cells = 8, cs2 = T / cells, pts = [];
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push([(i + r()) * cs2, (j + r()) * cs2]);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const ci0 = Math.floor(x / cs2), cj0 = Math.floor(y / cs2); let f1 = 1e9, f2 = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = (ci0 + di + cells) % cells, jj = (cj0 + dj + cells) % cells, p = pts[jj * cells + ii], px = p[0] + (ci0 + di - ii) * cs2 * 0 + ((ci0 + di < 0) ? -T : (ci0 + di >= cells) ? T : 0), py = p[1] + ((cj0 + dj < 0) ? -T : (cj0 + dj >= cells) ? T : 0), d = Math.hypot(px - x, py - y); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
      const v = Math.pow(Math.max(0, 1 - (f2 - f1) / 7), 2.2); cu[y * T + x] = Math.round(v * 255) << 24 | 0xf0ffff;
    }
    cg.putImageData(ci, 0, 0); this._caus = ct;
    this._fk = String(P.fish); this._sig = ''; this._last = -9;
    this._makeLife(env, r);
  },

  _makeLife(env, r) {
    const { W, H, P } = env, F = P.fish;
    const species = [
      { body: '#ff8a2b', belly: '#ffd0a0', fin: '#ff6a10', stripe: '#ffffff', n: 7, len: 15, v: 55 },
      { body: '#2f7de0', belly: '#9ad0ff', fin: '#ffd23f', stripe: '#1c4fa0', n: 8, len: 16, v: 60 },
      { body: '#ffd23f', belly: '#fff3b0', fin: '#f2a41c', stripe: '#2a2a2a', n: 9, len: 14, v: 58 },
      { body: '#b8d8e8', belly: '#f4fbff', fin: '#8fb8cc', stripe: null, n: 16, len: 10, v: 70 },
      { body: '#7fd6c2', belly: '#d8fff4', fin: '#3fae98', stripe: '#2f7a6a', n: 10, len: 13, v: 62 },
      { body: '#e86fa0', belly: '#ffd0e4', fin: '#c4457c', stripe: null, n: 6, len: 17, v: 50 },
    ];
    this._schools = [];
    const ns = F <= 0 ? 0 : Math.max(2, Math.round(3 + F * 2));
    for (let i = 0; i < ns; i++) { const sp = species[i % species.length], x = r() * W, y = r() * H, f = []; for (let k = 0; k < Math.round(sp.n * Math.min(1.3, 0.7 + F * 0.4)); k++) { const a = r() * 6.283; f.push({ x: x + (r() - 0.5) * 60, y: y + (r() - 0.5) * 60, vx: Math.cos(a) * sp.v, vy: Math.sin(a) * sp.v, ph: r() * 6 }); } this._schools.push({ sp, f, gx: r() * W, gy: r() * H, gt: 4 + r() * 6 }); }
    this._turtles = F <= 0 ? [] : Array.from({ length: F > 1.2 ? 3 : 2 }, () => ({ x: r() * W, y: r() * H, a: r() * 6.283, v: 16 + r() * 6, ph: r() * 6, seed: r() * 100, s: 1 + r() * 0.3 }));
    this._jelly = F <= 0 ? [] : Array.from({ length: 3 + Math.round(F * 2) }, () => ({ x: r() * W, y: r() * H, vx: (r() - 0.3) * 8, vy: -5 - r() * 6, ph: r() * 6, s: 0.8 + r() * 0.7, hue: r() < 0.5 ? [255, 160, 220] : [180, 160, 255] }));
    this._bubbles = [];
  },

  _compose(env) {
    const { S } = env, Z = this._Z, o = this._comp.getContext('2d'), R = this.R;
    Z.update(env.icons);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._bg, 0, 0);
    const lines = Z.lines();
    o.setTransform(S, 0, 0, S, 0, 0); o.lineCap = 'round'; o.lineJoin = 'round';
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(0,30,50,0.18)'; o.lineWidth = 56; o.stroke(); o.strokeStyle = 'rgba(0,30,50,0.2)'; o.lineWidth = 34; o.stroke(); }
    Z.paint(o, this._sand, this._tmp, S);
    o.setTransform(S, 0, 0, S, 0, 0);
    // coral ring: sprites every ~20 px along the lagoon edge, smaller ones filling the gaps
    const items = [], spots = [];
    for (const line of lines) {
      if (line.length < 3) continue; let acc = 0, next = 0;
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1], bb = line[i]; acc += Math.hypot(bb[0] - a[0], bb[1] - a[1]);
        if (acc >= next) { const kx = Math.round(bb[0] / 6), ky = Math.round(bb[1] / 6), h = env.hash(kx, ky, 51), h2 = env.hash(kx, ky, 52); items.push([bb[0] + (h - 0.5) * 8, bb[1] + (h2 - 0.5) * 8, 13 + h * 13, Math.floor(h2 * this._sprites.length)]); next = acc + 13 + h * 8; if (h2 < 0.15) spots.push([bb[0], bb[1]]); }
      }
    }
    items.sort((p, q) => p[1] - q[1]);
    for (const it of items) { const sc2 = it[2] / 22; o.drawImage(this._sprites[it[3]], it[0] - 34 * sc2, it[1] - 33 * sc2, 72 * sc2, 72 * sc2); }
    this._spots = spots;
    o.setTransform(1, 0, 0, 1, 0, 0);
    const g = o.createRadialGradient(this._comp.width / 2, this._comp.height / 2, this._comp.height * 0.35, this._comp.width / 2, this._comp.height / 2, this._comp.width * 0.72); g.addColorStop(0, 'rgba(0,20,40,0)'); g.addColorStop(1, 'rgba(0,20,40,0.35)'); o.fillStyle = g; o.fillRect(0, 0, this._comp.width, this._comp.height);
  },

  // ---- drawing helpers
  _fish(c, f, sp, ang, len, t) {
    c.save(); c.translate(f.x, f.y); c.rotate(ang);
    const wag = Math.sin(t * 9 + f.ph) * 0.4;
    c.fillStyle = 'rgba(0,25,45,0.25)'; c.beginPath(); c.ellipse(len * 0.1 + 2, 5, len * 0.5, len * 0.2, 0, 0, 7); c.fill();
    c.fillStyle = sp.fin; c.beginPath(); c.moveTo(-len * 0.38, 0); c.lineTo(-len * 0.78, -len * 0.3 + wag * len * 0.3); c.lineTo(-len * 0.7, wag * len * 0.3); c.lineTo(-len * 0.78, len * 0.3 + wag * len * 0.3); c.closePath(); c.fill();
    c.fillStyle = sp.body; c.beginPath(); c.ellipse(0, 0, len * 0.55, len * 0.22, wag * 0.12, 0, 7); c.fill();
    c.fillStyle = sp.belly; c.beginPath(); c.ellipse(len * 0.05, len * 0.06, len * 0.4, len * 0.1, 0, 0, 7); c.fill();
    if (sp.stripe) { c.fillStyle = sp.stripe; c.globalAlpha = 0.8; c.fillRect(len * 0.05, -len * 0.2, len * 0.07, len * 0.4); c.fillRect(-len * 0.22, -len * 0.16, len * 0.06, len * 0.32); c.globalAlpha = 1; }
    c.strokeStyle = sp.fin; c.lineWidth = len * 0.07; c.beginPath(); c.moveTo(-len * 0.3, 0); c.lineTo(len * 0.3, 0); c.stroke();
    c.fillStyle = sp.fin; c.beginPath(); c.ellipse(len * 0.12, -len * 0.24, len * 0.14, len * 0.06, -0.6 + wag * 0.3, 0, 7); c.ellipse(len * 0.12, len * 0.24, len * 0.14, len * 0.06, 0.6 - wag * 0.3, 0, 7); c.fill();
    c.fillStyle = '#10202a'; c.beginPath(); c.arc(len * 0.38, -len * 0.09, len * 0.045, 0, 7); c.arc(len * 0.38, len * 0.09, len * 0.045, 0, 7); c.fill();
    c.restore();
  },
  _turtle(c, u, t) {
    c.save(); c.translate(u.x, u.y); c.rotate(u.a); c.scale(u.s, u.s);
    const sw = Math.sin(t * 1.6 + u.ph);
    c.fillStyle = 'rgba(0,25,45,0.28)'; c.beginPath(); c.ellipse(7, 9, 26, 20, 0, 0, 7); c.fill();
    c.fillStyle = '#6f9a4a';
    for (const [sx, sy, ph, L, rot] of [[10, -1, 0, 20, -0.9], [10, 1, Math.PI, 20, 0.9], [-12, -1, Math.PI, 12, -2.3], [-12, 1, 0, 12, 2.3]]) { c.save(); c.translate(sx, sy * 12); c.rotate(rot + Math.sin(t * 1.6 + u.ph + ph) * 0.35 * Math.sign(sy)); c.beginPath(); c.ellipse(L / 2, 0, L / 2, 4.2, 0, 0, 7); c.fill(); c.restore(); }
    c.beginPath(); c.ellipse(-26, 0, 8, 2.6, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(25, sw * 1.2, 7, 5.4, 0, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(28, sw * 1.2 - 3, 0.9, 0, 7); c.arc(28, sw * 1.2 + 3, 0.9, 0, 7); c.fill();
    const g = c.createRadialGradient(-4, -4, 2, 0, 0, 22); g.addColorStop(0, '#b3883a'); g.addColorStop(1, '#6a4a22'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 21, 17, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(50,30,10,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, 13, 10, 0, 0, 7); c.moveTo(-21, 0); c.lineTo(-13, 0); c.moveTo(21, 0); c.lineTo(13, 0); c.moveTo(0, -17); c.lineTo(0, -10); c.moveTo(0, 17); c.lineTo(0, 10); c.moveTo(-6, -8); c.lineTo(-13, -10); c.stroke();
    c.restore();
  },
  _spine(c, x, y, ang, len, w, col, fin, t, amp) {
    const N = 14, pts = [];
    for (let i = 0; i < N; i++) { const f = i / (N - 1), lat = Math.sin(t * 2.4 - f * 3.2) * amp * (0.2 + f * f); pts.push([x - Math.cos(ang) * f * len - Math.sin(ang) * lat, y - Math.sin(ang) * f * len + Math.cos(ang) * lat, ang]); }
    const prof = f => w * (f < 0.25 ? 0.45 + f * 2.2 : 1 - (f - 0.25) * 1.15) * 0.5, side = s => pts.map((p, i) => { const f = i / (N - 1), nx = -Math.sin(p[2]), ny = Math.cos(p[2]); return [p[0] + nx * prof(f) * s, p[1] + ny * prof(f) * s]; });
    const a = side(1), b2 = side(-1);
    c.fillStyle = 'rgba(0,25,45,0.22)'; c.beginPath(); a.forEach((p, i) => i ? c.lineTo(p[0] + 8, p[1] + 12) : c.moveTo(p[0] + 8, p[1] + 12)); b2.slice().reverse().forEach(p => c.lineTo(p[0] + 8, p[1] + 12)); c.fill();
    const tail = pts[N - 1]; c.fillStyle = fin; c.beginPath(); c.moveTo(tail[0], tail[1]); c.lineTo(tail[0] - Math.cos(ang) * w * 0.9 - Math.sin(ang) * w * 0.7, tail[1] - Math.sin(ang) * w * 0.9 + Math.cos(ang) * w * 0.7); c.lineTo(tail[0] - Math.cos(ang) * w * 0.7, tail[1] - Math.sin(ang) * w * 0.7); c.lineTo(tail[0] - Math.cos(ang) * w * 0.9 + Math.sin(ang) * w * 0.7, tail[1] - Math.sin(ang) * w * 0.9 - Math.cos(ang) * w * 0.7); c.closePath(); c.fill();
    const p3 = pts[3]; c.fillStyle = fin; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(p3[0] + -Math.sin(p3[2]) * s * prof(0.2), p3[1] + Math.cos(p3[2]) * s * prof(0.2)); c.lineTo(p3[0] - Math.cos(ang) * w * 0.5 - Math.sin(ang) * s * w * 0.95, p3[1] - Math.sin(ang) * w * 0.5 + Math.cos(ang) * s * w * 0.95); c.lineTo(p3[0] - Math.cos(ang) * w * 0.9, p3[1] - Math.sin(ang) * w * 0.9); c.closePath(); c.fill(); }
    c.fillStyle = col; c.beginPath(); a.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); b2.slice().reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = w * 0.18; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
  },
  _rayShape(c, u, t) {
    c.save(); c.translate(u.x, u.y); c.rotate(u.a);
    const fl = Math.sin(t * 1.5 + u.ph), L = 78;
    c.fillStyle = 'rgba(0,25,45,0.22)'; c.beginPath(); c.moveTo(L * 0.55 + 6, 10); c.quadraticCurveTo(0, -L + 10, -L * 0.3 + 6, 10); c.quadraticCurveTo(0, L + 10, L * 0.55 + 6, 10); c.fill();
    c.strokeStyle = '#2a3f52'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-L * 0.3, 0); c.quadraticCurveTo(-L * 0.8, Math.sin(t * 2 + u.ph) * 8, -L * 1.5, Math.sin(t * 2 + u.ph + 1) * 14); c.stroke();
    const g = c.createLinearGradient(L * 0.5, 0, -L * 0.3, 0); g.addColorStop(0, '#506f86'); g.addColorStop(1, '#2f4a60'); c.fillStyle = g;
    for (const s of [-1, 1]) { const tip = s * (L * (0.95 + fl * 0.08)), tipx = -L * 0.12 - fl * 8; c.beginPath(); c.moveTo(L * 0.5, 0); c.quadraticCurveTo(L * 0.3, tip * 0.55, tipx, tip); c.quadraticCurveTo(-L * 0.12, tip * 0.4, -L * 0.34, 0); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(210,235,255,0.55)'; c.beginPath(); c.ellipse(L * 0.1, 0, L * 0.3, L * 0.12, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(L * 0.35, -10, 3, 0, 7); c.arc(L * 0.35, 10, 3, 0, 7); c.fill();
    c.restore();
  },
  _jellyfish(c, j, t) {
    const p = Math.sin(t * 1.8 + j.ph), rad = (13 + p * 3) * j.s, [r0, g0, b0] = j.hue;
    c.save(); c.translate(j.x, j.y);
    c.strokeStyle = `rgba(${r0},${g0},${b0},0.5)`; c.lineWidth = 1.2; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; c.beginPath(); c.moveTo(Math.cos(a) * rad * 0.7, Math.sin(a) * rad * 0.7); c.quadraticCurveTo(Math.cos(a) * rad * 1.5 + Math.sin(t * 2 + i + j.ph) * 6, Math.sin(a) * rad * 1.5 + 10, Math.cos(a) * rad * 1.9 + Math.sin(t * 1.6 + i) * 8, Math.sin(a) * rad * 1.9 + 22 * j.s); c.stroke(); }
    c.fillStyle = 'rgba(0,25,45,0.18)'; c.beginPath(); c.arc(6, 9, rad, 0, 7); c.fill();
    const g = c.createRadialGradient(-rad * 0.3, -rad * 0.3, 1, 0, 0, rad); g.addColorStop(0, `rgba(255,255,255,0.8)`); g.addColorStop(0.5, `rgba(${r0},${g0},${b0},0.55)`); g.addColorStop(1, `rgba(${r0},${g0},${b0},0.35)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rad, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, rad * 0.55, 0, 7); c.stroke();
    c.restore();
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z, sig = Z.signature(env.icons), R = Math.random;
    if (this._fk !== String(P.fish)) this.rebuild(env);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0);
    // sunlight network moving across the floor (two layers)
    if (P.light > 0 && typeof DOMMatrix !== 'undefined') {
      const pat = this._pat || (this._pat = ctx.createPattern(this._caus, 'repeat'));
      ctx.globalCompositeOperation = 'lighter';
      for (const [sc2, sx, sy, al] of [[2.6, 9, 5, 0.11], [1.7, -7, 10, 0.08]]) { pat.setTransform(new DOMMatrix().scale(sc2 * S).translate(t * sx / sc2 / S * 0.6 * 1, t * sy / sc2 / S * 0.6)); ctx.globalAlpha = al * P.light; ctx.fillStyle = pat; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    // turtles
    for (const u of this._turtles) {
      u.a += (env.noise(t * 0.05, u.seed, 7) - 0.5) * 0.9 * dt; u.x += Math.cos(u.a) * u.v * dt; u.y += Math.sin(u.a) * u.v * dt;
      if (u.x < -80 || u.x > W + 80 || u.y < -80 || u.y > H + 80) { u.a = Math.atan2(H / 2 - u.y, W / 2 - u.x) + (R() - 0.5) * 0.8; }
      this._turtle(ctx, u, t);
    }
    // manta ray and shark now and then
    this._rayT -= dt; this._sharkT -= dt;
    if (!this._ray && this._rayT <= 0 && P.fish > 0) { const left = R() < 0.5; this._ray = { x: left ? -120 : W + 120, y: H * (0.15 + R() * 0.7), a: left ? 0.15 : Math.PI - 0.15, v: 34, ph: R() * 6, turn: (R() - 0.5) * 0.06 }; }
    if (this._ray) { const u = this._ray; u.a += u.turn * dt; u.x += Math.cos(u.a) * u.v * dt; u.y += Math.sin(u.a) * u.v * dt; this._rayShape(ctx, u, t); if (u.x < -220 || u.x > W + 220 || u.y < -220 || u.y > H + 220) { this._ray = null; this._rayT = 35 + R() * 40; } }
    if (!this._shark && this._sharkT <= 0 && P.fish > 0) { const left = R() < 0.5; this._shark = { x: left ? -260 : W + 260, y: H * (0.2 + R() * 0.6), a: left ? 0.1 : Math.PI - 0.1, v: 44, turn: (R() - 0.5) * 0.04 }; }
    if (this._shark) { const u = this._shark; u.a += u.turn * dt; u.x += Math.cos(u.a) * u.v * dt; u.y += Math.sin(u.a) * u.v * dt; this._spine(ctx, u.x, u.y, u.a, 210, 46, '#5d7f93', '#4a6a7e', t, 14); if (u.x < -400 || u.x > W + 400 || u.y < -300 || u.y > H + 300) { this._shark = null; this._sharkT = 70 + R() * 60; } }
    // fish schools (simple boids)
    for (const sc of this._schools) {
      sc.gt -= dt; const cx = sc.f.reduce((s, f) => s + f.x, 0) / sc.f.length, cy = sc.f.reduce((s, f) => s + f.y, 0) / sc.f.length;
      if (sc.gt <= 0 || Math.hypot(sc.gx - cx, sc.gy - cy) < 80) { sc.gx = 60 + R() * (W - 120); sc.gy = 60 + R() * (H - 120); sc.gt = 5 + R() * 8; }
      const avx = sc.f.reduce((s, f) => s + f.vx, 0) / sc.f.length, avy = sc.f.reduce((s, f) => s + f.vy, 0) / sc.f.length, sp = sc.sp;
      for (const f of sc.f) {
        let ax = (cx - f.x) * 0.5 + (avx - f.vx) * 1.2, ay = (cy - f.y) * 0.5 + (avy - f.vy) * 1.2;
        const gd = Math.hypot(sc.gx - f.x, sc.gy - f.y) || 1; ax += (sc.gx - f.x) / gd * 40; ay += (sc.gy - f.y) / gd * 40;
        for (const o2 of sc.f) { if (o2 === f) continue; const dx = f.x - o2.x, dy = f.y - o2.y, d = Math.hypot(dx, dy); if (d < sp.len * 1.8 && d > 0.01) { ax += dx / d * 90; ay += dy / d * 90; } }
        if (f.x < 40) ax += 120; if (f.x > W - 40) ax -= 120; if (f.y < 40) ay += 120; if (f.y > H - 40) ay -= 120;
        f.vx += ax * dt; f.vy += ay * dt; const sp2 = Math.hypot(f.vx, f.vy) || 1, vv = Math.max(sp.v * 0.6, Math.min(sp.v * 1.2, sp2)); f.vx = f.vx / sp2 * vv; f.vy = f.vy / sp2 * vv; f.x += f.vx * dt; f.y += f.vy * dt;
      }
      for (const f of sc.f) this._fish(ctx, f, sp, Math.atan2(f.vy, f.vx), sp.len * 1.8, t);
    }
    // jellyfish
    for (const j of this._jelly) { j.x += j.vx * dt + Math.sin(t * 0.4 + j.ph) * 3 * dt; j.y += j.vy * dt; if (j.y < -50) { j.y = H + 50; j.x = R() * W; } if (j.x < -50) j.x = W + 50; if (j.x > W + 50) j.x = -50; this._jellyfish(ctx, j, t); }
    // bubbles rising from the coral
    if (R() < dt * 5 && this._bubbles.length < 40) { const sp0 = this._spots.length && R() < 0.7 ? this._spots[Math.floor(R() * this._spots.length)] : [R() * W, H * (0.4 + R() * 0.6)]; this._bubbles.push({ x: sp0[0], y: sp0[1], r: 1.5 + R() * 3, v: 16 + R() * 20, ph: R() * 6, life: 0 }); }
    for (let i = this._bubbles.length - 1; i >= 0; i--) { const b = this._bubbles[i]; b.y -= b.v * dt; b.x += Math.sin(t * 2 + b.ph) * 6 * dt; b.life += dt; if (b.y < -10 || b.life > 9) { this._bubbles.splice(i, 1); continue; } ctx.strokeStyle = 'rgba(220,250,255,0.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, 7); ctx.fill(); }
  },
});
