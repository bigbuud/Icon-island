// Theme "Medieval village": a side view. Every group of icons becomes a building that rises from the street:
// a timber-framed house with a tiled roof or a crenellated stone tower, icons sitting in the wall between the windows.
// Villagers, knights, a horse and cart, chickens and a dog use the street; a windmill turns on the hill and the sky
// changes between day, dusk and night (windows light up).
IconIsland.theme({
  params: { villagers: 1, time: 0 },
  PALS: [
    { sky: ['#5aaee8', '#a9dcf7', '#f2f9ff'], far: '#a7bdd8', far2: '#94afcf', hill1: '#86b56e', hill2: '#66a053', grass: '#6aae4a', street: '#b7ab96', tint: null, sunglow: 'rgba(255,245,200,0.55)' },
    { sky: ['#34417f', '#d96f72', '#ffc37e'], far: '#85799f', far2: '#6e6a92', hill1: '#587a5c', hill2: '#44654a', grass: '#4f7a44', street: '#8e8394', tint: 'rgba(70,36,96,0.26)', sunglow: 'rgba(255,170,100,0.6)' },
    { sky: ['#040a22', '#10245a', '#2a4784'], far: '#1c2c58', far2: '#16244a', hill1: '#16384a', hill2: '#10303c', grass: '#1a4a38', street: '#555a6e', tint: 'rgba(6,14,52,0.5)', sunglow: 'rgba(160,190,255,0.35)' },
  ],
  _bg: null, _bld: null, _tiles: null, _sig: '', _last: -9, _seed: 1, _key: '', _GY: 0, _wins: [], _smokes: [], _flags: [], _walkers: [], _clouds: [], _birds: [], _events: [], _evT: 8, _birdT: 3, _parts: [], _fg: null, _wv: null, _hillY: null, _wmx: 0, _smokeT: 0, _wheelRot: 0, _chickens: [], _doors: [],

  init(env, seed) { this._seed = seed; this._sig = ''; this._walkers = []; this._events = []; this._evT = 20; },

  rebuild(env) {
    const { W, H, S, P } = env, mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    const cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 131), tm = P.time | 0, pal = this.PALS[tm] || this.PALS[0], GY = this._GY = Math.round(H * 0.84);
    this._key = String(tm); this._bld = mk(cw, ch);
    // ---------- background
    const bg = mk(cw, ch), b = bg.getContext('2d'); b.scale(S, S);
    const sk = b.createLinearGradient(0, 0, 0, GY); sk.addColorStop(0, pal.sky[0]); sk.addColorStop(0.6, pal.sky[1]); sk.addColorStop(1, pal.sky[2]); b.fillStyle = sk; b.fillRect(0, 0, W, H);
    if (tm === 2) { for (let i = 0; i < 160; i++) { b.globalAlpha = 0.3 + r() * 0.7; b.fillStyle = '#fff'; b.beginPath(); b.arc(r() * W, r() * GY * 0.7, 0.4 + r() * 1.1, 0, 7); b.fill(); } b.globalAlpha = 1;
      const mx = W * 0.82, my = H * 0.17, g = b.createRadialGradient(mx, my, 6, mx, my, 120); g.addColorStop(0, 'rgba(210,225,255,0.5)'); g.addColorStop(1, 'rgba(210,225,255,0)'); b.fillStyle = g; b.fillRect(mx - 120, my - 120, 240, 240);
      b.fillStyle = '#f3f1e2'; b.beginPath(); b.arc(mx, my, 30, 0, 7); b.fill(); b.fillStyle = 'rgba(160,160,170,0.35)'; for (const [dx, dy, rr] of [[-8, -6, 7], [9, 8, 5], [4, -12, 4]]) { b.beginPath(); b.arc(mx + dx, my + dy, rr, 0, 7); b.fill(); } }
    else { const sx = W * (tm === 1 ? 0.2 : 0.78), sy = tm === 1 ? GY * 0.72 : H * 0.15, g = b.createRadialGradient(sx, sy, 10, sx, sy, 260); g.addColorStop(0, pal.sunglow); g.addColorStop(1, 'rgba(255,240,200,0)'); b.fillStyle = g; b.fillRect(sx - 260, sy - 260, 520, 520); b.fillStyle = tm === 1 ? '#ffd9a0' : '#fff7d0'; b.beginPath(); b.arc(sx, sy, 28, 0, 7); b.fill(); }
    const ridge = (base, amp, sc, col, off, step) => { b.fillStyle = col; b.beginPath(); b.moveTo(0, GY + 4); for (let x = 0; x <= W + step; x += step) b.lineTo(x, base - amp * env.fbm(x / sc + off, off, seed + 5, 4)); b.lineTo(W + step, GY + 4); b.closePath(); b.fill(); };
    ridge(GY - 150, 150, 260, pal.far, 3, 12); ridge(GY - 105, 110, 200, pal.far2, 9, 12);
    // distant castle on the far hill
    { const cx = W * 0.7, cy = GY - 190 + 40, col = tm === 2 ? '#101c3c' : tm === 1 ? '#5c5478' : '#8aa0bc'; b.fillStyle = col;
      b.fillRect(cx - 60, cy - 36, 120, 42); for (let i = 0; i < 7; i++) b.fillRect(cx - 60 + i * 18, cy - 44, 10, 8);
      for (const dx of [-70, 56]) { b.fillRect(cx + dx, cy - 70, 22, 76); for (let i = 0; i < 3; i++) b.fillRect(cx + dx + i * 8 - 1, cy - 78, 6, 8); }
      b.beginPath(); b.moveTo(cx - 14, cy - 36); b.lineTo(cx, cy - 86); b.lineTo(cx + 14, cy - 36); b.fill(); b.fillRect(cx - 14, cy - 60, 28, 26); }
    ridge(GY - 52, 90, 150, pal.hill1, 21, 10);
    // hills with field stripes and small trees
    b.fillStyle = pal.hill2; b.beginPath(); b.moveTo(0, GY + 4); const hy = x => GY - 22 - 54 * env.fbm(x / 120 + 40, 7, seed + 6, 3); for (let x = 0; x <= W + 8; x += 8) b.lineTo(x, hy(x)); b.lineTo(W + 8, GY + 4); b.closePath(); b.fill();
    this._hillY = hy;
    for (let i = 0; i < W / 14; i++) { const x = r() * W, y = hy(x) + 5 + r() * 14, z = 4 + r() * 5; b.fillStyle = 'rgba(10,30,10,0.3)'; b.beginPath(); b.ellipse(x + 2, y + 2, z, z * 0.5, 0, 0, 7); b.fill(); b.fillStyle = tm === 2 ? '#14402c' : tm === 1 ? '#3c6642' : '#4c8f3e'; b.beginPath(); b.arc(x, y - z * 0.6, z, 0, 7); b.fill(); }
    // ground: grass strip + cobbled street
    b.fillStyle = pal.grass; b.fillRect(0, GY - 2, W, 26);
    b.fillStyle = 'rgba(255,255,255,0.1)'; b.fillRect(0, GY - 2, W, 3);
    // tile patterns
    const T = {}, tile = (w, h, fn) => { const c = mk(w * S, h * S), g = c.getContext('2d'); g.scale(S, S); fn(g, w, h); return c; };
    T.plaster = [['#efe4c8', '#d9c9a0'], ['#e9d8b4', '#cdb88a'], ['#f2ead6', '#ddd0b0'], ['#e6cfa8', '#c9ad7c']].map(c => tile(64, 64, (g, w, h) => { g.fillStyle = c[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.globalAlpha = 0.06 + r() * 0.1; g.fillStyle = r() < 0.5 ? c[1] : '#fff'; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 4, 0, 7); g.fill(); } g.globalAlpha = 0.18; g.strokeStyle = c[1]; g.lineWidth = 0.8; g.beginPath(); g.moveTo(10, 6); g.lineTo(22, 20); g.lineTo(20, 34); g.stroke(); }));
    T.stone = [['#9a9a96', '#6d6d6a'], ['#a39a8a', '#756d60']].map(c => tile(96, 72, (g, w, h) => { g.fillStyle = c[1]; g.fillRect(0, 0, w, h); for (let row = 0; row < 3; row++) { let x = -(row % 2) * 20 - r() * 10; while (x < w) { const bw = 30 + r() * 20, l = 0.9 + r() * 0.2; g.fillStyle = `hsl(${40 + r() * 10},${6 + r() * 6}%,${(c === 0 ? 62 : 58) * l}%)`; g.beginPath(); g.roundRect(x + 1, row * 24 + 1, bw - 2, 22, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 3, row * 24 + 2, bw - 6, 2); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 3, row * 24 + 20, bw - 6, 2); x += bw; } } }));
    T.roof = [['#b4573a', '#7e3422'], ['#8d6a54', '#5a4034'], ['#5a6878', '#36404c']].map(c => tile(40, 28, (g, w, h) => { g.fillStyle = c[1]; g.fillRect(0, 0, w, h); for (let row = 0; row < 2; row++) for (let i = -1; i < 3; i++) { const x = i * 20 + (row % 2) * 10, y = row * 14; const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.lineTo(x + 20, y + 8); g.arc(x + 10, y + 8, 10, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.8; g.stroke(); } }));
    T.cobble = tile(64, 40, (g, w, h) => { g.fillStyle = '#6f6759'; g.fillRect(0, 0, w, h); for (let row = 0; row < 4; row++) { let x = -(row % 2) * 9; while (x < w) { const bw = 14 + r() * 8, l = 0.85 + r() * 0.3; g.fillStyle = `hsl(${32 + r() * 12},${8 + r() * 8}%,${58 * l}%)`; g.beginPath(); g.roundRect(x + 1, row * 10 + 1, bw - 2, 8, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x + 3, row * 10 + 1.5, bw - 6, 1.4); x += bw; } } });
    this._tiles = T;
    const fillTile = (g, t, x, y, w, h, tintAlpha) => { const p = g.createPattern(t, 'repeat'); p.setTransform(new DOMMatrix().scale(1 / S)); g.fillStyle = p; g.fillRect(x, y, w, h); };
    this._fillTile = fillTile;
    b.save(); b.beginPath(); b.rect(0, GY + 20, W, H - GY - 20); b.clip(); fillTile(b, T.cobble, 0, GY + 20, W, H - GY - 20); b.restore();
    const kerb = b.createLinearGradient(0, GY + 18, 0, GY + 28); kerb.addColorStop(0, '#8a8174'); kerb.addColorStop(1, '#a89e8c'); b.fillStyle = kerb; b.fillRect(0, GY + 18, W, 7); b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(0, GY + 25, W, 2);
    // street props: trees, haystacks, barrels, market stalls, a well, signposts along the grass strip
    const props = [];
    for (let x = 30; x < W - 30; x += 130 + r() * 190) props.push({ k: ['tree', 'tree', 'pine', 'hay', 'barrels', 'stall', 'well', 'sign', 'bush'][Math.floor(r() * 9)], x, s: 0.85 + r() * 0.5, v: r() });
    props.sort((p, q) => (p.k === 'tree') - (q.k === 'tree'));
    for (const p of props) this._prop(b, p, GY + 8, tm);
    if (pal.tint) { b.fillStyle = pal.tint; b.fillRect(0, 0, W, H); }
    this._bg = bg;
    this._clouds = Array.from({ length: 6 }, () => ({ x: r() * W, y: 30 + r() * GY * 0.35, s: 0.8 + r() * 1.1, v: 4 + r() * 6 }));
    this._chickens = Array.from({ length: 4 }, () => ({ x: r() * W, lane: 0.3 + r() * 0.6, dir: r() < 0.5 ? 1 : -1, t: r() * 3, st: 0, ph: r() * 6, v: 14 }));
    this._makeWalkers(env, r);
    this._sig = ''; this._last = -9;
  },

  _prop(c, p, y, tm) {
    const s = p.s, dark = tm === 2 ? 0.55 : tm === 1 ? 0.8 : 1, col = (r, g, b2) => `rgb(${r * dark | 0},${g * dark | 0},${b2 * dark | 0})`;
    c.save(); c.translate(p.x, y); c.scale(s, s);
    c.fillStyle = 'rgba(10,25,5,0.25)'; c.beginPath(); c.ellipse(8, 2, 34, 6, 0, 0, 7); c.fill();
    if (p.k === 'tree') { c.fillStyle = col(98, 70, 44); c.fillRect(-5, -52, 10, 54); c.fillStyle = col(70, 50, 30); c.fillRect(1, -52, 4, 54); for (const [dx, dy, r0, cc] of [[-18, -78, 26, [58, 132, 58]], [16, -80, 26, [66, 142, 62]], [0, -104, 30, [78, 156, 68]], [-8, -66, 24, [50, 120, 52]], [16, -62, 22, [60, 134, 58]]]) { const g = c.createRadialGradient(dx - r0 * 0.3, dy - r0 * 0.3, 2, dx, dy, r0); g.addColorStop(0, col(cc[0] + 50, cc[1] + 50, cc[2] + 30)); g.addColorStop(1, col(cc[0], cc[1], cc[2])); c.fillStyle = g; c.beginPath(); c.arc(dx, dy, r0, 0, 7); c.fill(); } }
    else if (p.k === 'pine') { c.fillStyle = col(80, 56, 36); c.fillRect(-4, -20, 8, 22); for (let i = 0; i < 5; i++) { const w = 38 - i * 6, y0 = -18 - i * 24; c.fillStyle = col(30 + i * 8, 92 + i * 10, 56 + i * 4); c.beginPath(); c.moveTo(-w, y0); c.lineTo(0, y0 - 38); c.lineTo(w, y0); c.closePath(); c.fill(); } }
    else if (p.k === 'bush') { for (const dx of [-14, 0, 14]) { c.fillStyle = col(60 + dx, 130, 56); c.beginPath(); c.arc(dx, -12, 15, 0, 7); c.fill(); } c.fillStyle = col(40, 100, 44); c.beginPath(); c.arc(-4, -14, 7, 0, 7); c.fill(); }
    else if (p.k === 'hay') { for (const dx of [-20, 18]) { const g = c.createLinearGradient(0, -34, 0, 0); g.addColorStop(0, col(235, 200, 100)); g.addColorStop(1, col(190, 150, 60)); c.fillStyle = g; c.beginPath(); c.moveTo(dx - 20, 0); c.quadraticCurveTo(dx - 22, -30, dx, -40); c.quadraticCurveTo(dx + 22, -30, dx + 20, 0); c.fill(); c.strokeStyle = 'rgba(120,80,20,0.4)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(dx - 14 + i * 7, -2); c.lineTo(dx - 10 + i * 5, -34); c.stroke(); } } }
    else if (p.k === 'barrels') { for (const [dx, dy] of [[-16, 0], [6, 0], [-5, -22]]) { c.fillStyle = col(150, 104, 62); c.beginPath(); c.ellipse(dx, dy - 14, 12, 15, 0, 0, 7); c.fill(); c.fillStyle = col(110, 74, 42); for (const yy of [-24, -14, -4]) c.fillRect(dx - 12, dy + yy, 24, 2); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(dx - 8, dy - 26, 3, 24); } }
    else if (p.k === 'well') { c.fillStyle = col(130, 126, 118); c.beginPath(); c.roundRect(-18, -26, 36, 28, 3); c.fill(); c.fillStyle = col(98, 94, 88); for (let i = 0; i < 4; i++) c.fillRect(-18, -22 + i * 7, 36, 1); c.fillStyle = col(100, 70, 44); c.fillRect(-18, -62, 4, 38); c.fillRect(14, -62, 4, 38); c.fillStyle = col(160, 70, 50); c.beginPath(); c.moveTo(-26, -58); c.lineTo(0, -78); c.lineTo(26, -58); c.closePath(); c.fill(); c.strokeStyle = col(70, 50, 30); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -40); c.stroke(); c.fillStyle = col(120, 84, 50); c.fillRect(-4, -40, 8, 8); }
    else if (p.k === 'stall') { c.fillStyle = col(112, 78, 46); c.fillRect(-32, -52, 4, 54); c.fillRect(28, -52, 4, 54); c.fillRect(-30, -20, 62, 6); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? col(236, 230, 214) : col(190, 60, 50); c.beginPath(); c.moveTo(-36 + i * 12, -52); c.lineTo(-24 + i * 12, -52); c.lineTo(-26 + i * 12, -42); c.quadraticCurveTo(-30 + i * 12, -36, -34 + i * 12, -42); c.closePath(); c.fill(); } c.fillStyle = col(236, 230, 214); c.fillRect(-36, -62, 72, 10); c.fillStyle = col(190, 60, 50); for (let i = 0; i < 6; i += 2) c.fillRect(-36 + i * 12, -62, 12, 10); for (let i = 0; i < 5; i++) { c.fillStyle = ['#d94a3a', '#e8b030', '#6aa84f'][i % 3]; c.beginPath(); c.arc(-20 + i * 10, -24, 4.4, 0, 7); c.fill(); } }
    else { c.fillStyle = col(100, 70, 44); c.fillRect(-3, -64, 6, 66); c.fillStyle = col(150, 108, 66); for (const [y0, dir] of [[-60, 1], [-48, -1]]) { c.beginPath(); c.moveTo(-dir * 6, y0); c.lineTo(dir * 28, y0); c.lineTo(dir * 36, y0 + 6); c.lineTo(dir * 28, y0 + 12); c.lineTo(-dir * 6, y0 + 12); c.closePath(); c.fill(); } }
    c.restore();
  },

  // ---------- villagers on the street
  _makeWalkers(env, r) {
    const { W, H, P } = env, n = Math.round((+P.villagers || 0) * (8 + W / 400));
    this._wv = P.villagers; this._walkers = [];
    const kinds = ['peasant', 'peasant', 'woman', 'woman', 'monk', 'knight', 'child', 'merchant', 'guard', 'peasant', 'woman', 'child'];
    const pick = a => a[Math.floor(r() * a.length)];
    for (let i = 0; i < n; i++) {
      const dog = i % 7 === 6, kind = dog ? 'dog' : kinds[i % kinds.length];
      this._walkers.push({
        kind, i, x: r() * W, lane: r(), dir: r() < 0.5 ? -1 : 1, speed: 20 + r() * 16, state: r() < 0.3 ? 'stand' : 'walk', t: 1 + r() * 5, ph: r() * 6, s: 1,
        a: { tunic: pick(['#8b6b4a', '#6a8f5a', '#a8553a', '#5f7fa8', '#b89048', '#7a5a8a']), legs: pick(['#4a3a2a', '#5a4a3a', '#3a4a5a', '#6a5a46']), skin: pick(['#ebc29b', '#dcae86', '#f0cfae']), hair: pick(['#3b2a1c', '#6b4a2a', '#c9a24a', '#222']), hat: pick(['#e8dcc0', '#b04a3a', '#4a6a9a', '#d8c070']), dog: pick(['#8a5a34', '#d8ccb4', '#4a3a2c']) },
      });
    }
    this._chickens = Array.from({ length: P.villagers > 0 ? 4 : 0 }, () => ({ x: r() * W, lane: 0.15 + r() * 0.8, dir: r() < 0.5 ? 1 : -1, t: r() * 3, st: 0, ph: r() * 6, c: r() < 0.5 ? '#f4efe6' : '#a8552e' }));
  },
  _laneY(env, lane) { const { H } = env, y0 = this._GY + 36, y1 = H - 14; return y0 + lane * Math.max(8, y1 - y0); },
  _scaleAt(env, lane) { return (1.05 + lane * 0.55) * env.clamp(env.H / 900, 0.85, 1.5); },

  _person(c, w) {
    const k = w.kind, sc = w.s * (k === 'child' ? 0.66 : 1), walk = w.state === 'walk', sw = walk ? Math.sin(w.ph) : 0, bob = walk ? Math.abs(Math.cos(w.ph)) * 1.2 : 0, A = w.a, long = k === 'woman' || k === 'monk';
    const tunic = k === 'monk' ? '#6b4c34' : k === 'knight' ? '#aab2bb' : k === 'merchant' ? '#9a2f3a' : k === 'guard' ? '#2f5d9a' : k === 'child' ? A.hat : A.tunic;
    c.save(); c.translate(w.x, w.y); c.scale(w.dir * sc, sc);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 0.5, 11, 2.8, 0, 0, 7); c.fill();
    const legc = k === 'knight' ? '#7c858f' : k === 'merchant' ? '#3a2a22' : A.legs;
    const leg = a => { c.save(); c.translate(0, -15 - bob); c.rotate(a * 0.6); c.fillStyle = legc; c.beginPath(); c.roundRect(-2.4, 0, 4.8, 15 + bob, 2); c.fill(); c.fillStyle = '#2e2218'; c.beginPath(); c.roundRect(-2.4, 12 + bob, 8, 3.6, 1.8); c.fill(); c.restore(); };
    const arm = (a, col) => { c.save(); c.translate(0, -28 - bob); c.rotate(a); c.fillStyle = col; c.beginPath(); c.roundRect(-2.2, -1, 4.4, 12, 2.2); c.fill(); c.fillStyle = A.skin; c.beginPath(); c.arc(0, 11.5, 2.4, 0, 7); c.fill(); c.restore(); };
    // back side: shield / bundle
    if (k === 'knight') { c.save(); c.translate(-5, -22 - bob); c.fillStyle = '#9a2a2a'; c.beginPath(); c.moveTo(-5, -9); c.lineTo(5, -9); c.lineTo(5, 2); c.quadraticCurveTo(5, 9, 0, 12); c.quadraticCurveTo(-5, 9, -5, 2); c.closePath(); c.fill(); c.fillStyle = '#eee'; c.fillRect(-1, -8, 2, 17); c.fillRect(-4, -3, 8, 2); c.restore(); }
    if (k === 'merchant') { c.fillStyle = '#b89a62'; c.beginPath(); c.ellipse(-7, -26 - bob, 7, 8, 0.3, 0, 7); c.fill(); c.strokeStyle = '#6a4e2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(-9, -32 - bob); c.lineTo(-5, -20 - bob); c.stroke(); }
    if (!long) leg(-sw);
    arm(sw * 0.7, tunic);
    // body
    c.fillStyle = tunic; c.beginPath();
    if (long) { const sh = sw * 2.2; c.moveTo(-4.6, -29 - bob); c.lineTo(4.8, -29 - bob); c.lineTo(7.5 + sh, -2); c.lineTo(-7.5 + sh, -2); }
    else { c.moveTo(-5, -15 - bob); c.lineTo(5.5, -15 - bob); c.lineTo(4.6, -29 - bob); c.lineTo(-4.6, -29 - bob); }
    c.closePath(); c.fill();
    if (long) { c.fillStyle = '#2e2218'; c.beginPath(); c.ellipse(-5 + sw * 2.2, -1, 3.2, 1.6, 0, 0, 7); c.ellipse(5 + sw * 2.2, -1, 3.2, 1.6, 0, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(-5, -20 - bob, 10.6, 2);               // belt
    if (k === 'monk') { c.strokeStyle = '#e8dcc0'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-5, -21 - bob); c.lineTo(5, -21 - bob); c.lineTo(4, -8); c.stroke(); }
    if (k === 'guard' || k === 'merchant') { c.fillStyle = k === 'guard' ? '#e8c050' : '#d8c070'; c.fillRect(-1, -29 - bob, 2.4, 14); }
    if (k === 'woman') { c.fillStyle = '#efe6d2'; c.beginPath(); c.moveTo(-3, -20 - bob); c.lineTo(6, -20 - bob); c.lineTo(8, -9); c.lineTo(-5, -9); c.closePath(); c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1; }
    if (!long) leg(sw);
    // head
    const hy = -34.5 - bob;
    if (k === 'monk') { c.fillStyle = '#6b4c34'; c.beginPath(); c.arc(-2, hy + 1, 6.6, 0, 7); c.fill(); }
    if (k === 'woman') { c.fillStyle = A.hair; c.beginPath(); c.ellipse(-2.6, hy + 2, 4.6, 6.4, 0, 0, 7); c.fill(); }
    c.fillStyle = A.skin; c.beginPath(); c.arc(1.2, hy, 5, 0, 7); c.fill();
    c.fillStyle = '#2a1c12'; c.beginPath(); c.arc(3.4, hy - 0.4, 0.8, 0, 7); c.fill();
    if (k === 'peasant') { c.fillStyle = '#d8b862'; c.beginPath(); c.ellipse(1, hy - 4.2, 9.5, 2, 0, 0, 7); c.fill(); c.beginPath(); c.arc(1, hy - 4.6, 5, Math.PI, 0); c.fill(); c.fillStyle = '#b08a3a'; c.fillRect(-4, hy - 6.2, 10, 1.4); }
    else if (k === 'woman') { c.fillStyle = A.hat; c.beginPath(); c.arc(0, hy - 0.6, 5.6, Math.PI * 0.75, Math.PI * 2.0); c.lineTo(-3.8, hy + 4); c.closePath(); c.fill(); }
    else if (k === 'monk') { c.fillStyle = A.skin; c.beginPath(); c.arc(0, hy - 3.4, 2.2, 0, 7); c.fill(); c.fillStyle = '#6b4c34'; c.beginPath(); c.arc(-1, hy - 2, 5.4, Math.PI * 1.1, Math.PI * 1.95); c.fill(); }
    else if (k === 'knight') { c.fillStyle = '#c3cad2'; c.beginPath(); c.arc(1, hy - 0.6, 6, Math.PI, 0); c.lineTo(7, hy + 4.5); c.lineTo(-5, hy + 4.5); c.closePath(); c.fill(); c.fillStyle = '#2a2d33'; c.fillRect(1.4, hy - 1.4, 6, 1.6); c.fillStyle = '#b02a2a'; c.beginPath(); c.moveTo(-3, hy - 5); c.quadraticCurveTo(-10, hy - 12, -9, hy - 2); c.lineTo(-4, hy - 4); c.fill(); }
    else if (k === 'merchant') { c.fillStyle = '#9a2f3a'; c.beginPath(); c.ellipse(0.6, hy - 4.2, 6.6, 3.6, 0, Math.PI, 0); c.fill(); c.fillRect(-5.6, hy - 4.4, 12.4, 1.8); c.strokeStyle = '#eee'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, hy - 6); c.quadraticCurveTo(-9, hy - 11, -11, hy - 5); c.stroke(); }
    else if (k === 'guard') { c.fillStyle = '#9aa2ab'; c.beginPath(); c.arc(1, hy - 1, 5.6, Math.PI, 0); c.fill(); c.fillRect(-5.4, hy - 1.6, 13.4, 1.8); }
    else { c.fillStyle = A.hair; c.beginPath(); c.arc(0.6, hy - 1.2, 5.2, Math.PI * 0.85, Math.PI * 1.9); c.fill(); }
    // front arm and tools
    if (k === 'guard') { c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(6, -4); c.lineTo(6, -58); c.stroke(); c.fillStyle = '#c8d0d8'; c.beginPath(); c.moveTo(4.4, -57); c.lineTo(6, -66); c.lineTo(7.6, -57); c.fill(); arm(-0.5, tunic); }
    else arm(-sw * 0.7, tunic);
    if (k === 'knight') { c.save(); c.translate(-4, -18 - bob); c.rotate(1.9 + sw * 0.1); c.fillStyle = '#d4dae0'; c.fillRect(-1, 0, 2, 17); c.fillStyle = '#6a4a2a'; c.fillRect(-3, 0, 6, 2); c.restore(); }
    if (k === 'peasant' && w.i % 2) { c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(7, -10); c.lineTo(5, -52); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(1.5, -52); c.lineTo(8.5, -52); for (const x of [1.5, 5, 8.5]) { c.moveTo(x, -52); c.lineTo(x, -58); } c.stroke(); }
    c.restore();
  },
  _dog(c, w) {
    const walk = w.state === 'walk', sw = walk ? Math.sin(w.ph * 1.3) : 0, col = w.a.dog, s = w.s * 1.05;
    c.save(); c.translate(w.x, w.y); c.scale(w.dir * s, s);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 0.5, 11, 2.4, 0, 0, 7); c.fill();
    const leg = (x, a) => { c.save(); c.translate(x, -7); c.rotate(a * 0.6); c.fillStyle = col; c.fillRect(-1.5, 0, 3, 7.2); c.restore(); };
    leg(-6, sw); leg(5, -sw);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -10, 9.5, 4.6, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(10, -14, 4.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(14, -12.6, 3.6, 2.2, 0.2, 0, 7); c.fill();
    c.fillStyle = '#1c1410'; c.beginPath(); c.arc(16.4, -13, 1, 0, 7); c.arc(10.6, -15, 0.8, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(7.6, -15.6, 1.8, 3.2, -0.3, 0, 7); c.fill();
    c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -12); c.quadraticCurveTo(-14, -17 + Math.sin(w.ph * 3) * 2, -14, -20 + Math.sin(w.ph * 3) * 3); c.stroke();
    leg(-4, -sw); leg(7, sw);
    c.restore();
  },
  _chicken(c, ch, u) {
    c.save(); c.translate(ch.x, ch.y); c.scale(ch.dir * 1.25 * u, 1.25 * u);
    const peck = ch.st === 1 ? Math.max(0, Math.sin(ch.ph * 3)) * 4 : 0;
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 0.5, 6, 1.6, 0, 0, 7); c.fill();
    c.strokeStyle = '#d99a3a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-1, -4); c.lineTo(-1, 0); c.moveTo(2, -4); c.lineTo(2, 0); c.stroke();
    c.fillStyle = ch.c; c.beginPath(); c.ellipse(0, -6.4, 6, 4.4, 0.12, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-10, -13, -8, -5); c.fill();
    c.beginPath(); c.arc(5.4 + peck * 0.3, -10.4 + peck, 2.5, 0, 7); c.fill();
    c.fillStyle = '#d33a2c'; c.beginPath(); c.arc(5.2 + peck * 0.3, -13 + peck, 1.2, 0, 7); c.fill();
    c.fillStyle = '#e8a030'; c.beginPath(); c.moveTo(7.7 + peck * 0.3, -10.6 + peck); c.lineTo(10 + peck * 0.3, -10 + peck); c.lineTo(7.7 + peck * 0.3, -9.4 + peck); c.fill();
    c.fillStyle = '#111'; c.fillRect(6 + peck * 0.3, -11 + peck, 0.9, 0.9);
    c.restore();
  },
  _horse(c, x, y, s, dir, ph, o) {
    c.save(); c.translate(x, y); c.scale(dir * s, s);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 1, 36, 4.4, 0, 0, 7); c.fill();
    const col = o.col, dk = o.dk, leg = (hx, a, c1) => { const kx = hx + Math.sin(a) * 11, ky = -25 + Math.cos(a) * 11, b = a * 0.5 - (a < 0 ? -a * 0.7 : 0), fx = kx + Math.sin(b) * 12, fy = ky + Math.cos(b) * 12; c.strokeStyle = c1; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 4.2; c.beginPath(); c.moveTo(hx, -25); c.lineTo(kx, ky); c.lineTo(fx, fy - 1.5); c.stroke(); c.lineWidth = 3.2; c.strokeStyle = '#2a2018'; c.beginPath(); c.moveTo(fx, fy - 3); c.lineTo(fx, fy); c.stroke(); };
    const A1 = Math.sin(ph) * 0.55, A2 = Math.sin(ph + Math.PI) * 0.55;
    leg(15, A2, dk); leg(-15, A1, dk);
    // tail
    c.strokeStyle = o.mane; c.lineWidth = 4.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-23, -35); c.bezierCurveTo(-34, -32 + Math.sin(ph) * 2, -34, -18, -30 + Math.sin(ph + 1) * 3, -8); c.stroke();
    // body
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -31, 25, 11.5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0, -26, 22, 6, 0, 0, Math.PI); c.fill();
    // neck + head
    c.fillStyle = col; c.beginPath(); c.moveTo(12, -40); c.lineTo(21, -42); c.lineTo(33, -60); c.lineTo(24, -62); c.closePath(); c.fill();
    c.strokeStyle = o.mane; c.lineWidth = 3; c.beginPath(); c.moveTo(14, -42); c.lineTo(25, -62); c.stroke();
    c.save(); c.translate(30, -61); c.rotate(0.75); c.fillStyle = col; c.beginPath(); c.ellipse(6, 0, 10.5, 4.8, 0, 0, 7); c.fill(); c.fillStyle = dk; c.beginPath(); c.ellipse(13, 0.6, 4.2, 3.6, 0, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(4, -1.2, 1, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(-1, -3); c.lineTo(-3, -9); c.lineTo(2, -4); c.fill(); c.restore();
    if (o.cloth) { c.fillStyle = o.cloth[0]; c.beginPath(); c.moveTo(-14, -42); c.lineTo(14, -42); c.lineTo(15, -22); c.lineTo(-15, -22); c.closePath(); c.fill(); c.fillStyle = o.cloth[1]; c.beginPath(); c.moveTo(0, -42); c.lineTo(14, -42); c.lineTo(15, -22); c.lineTo(0, -22); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.stroke(); }
    leg(13, A1, col); leg(-17, A2, col);
    if (o.cart) this._cart(c, ph, x, s);
    if (o.rider) { const R = { kind: 'knight', x: -2, y: -34, dir: 1, s: 0.95, state: 'stand', ph: 0, a: o.rider };
      c.save(); c.translate(0, 0); this._person(c, R); c.restore();
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-18, -44); c.lineTo(60, -58); c.stroke();
      c.fillStyle = '#c8d0d8'; c.beginPath(); c.moveTo(60, -59.4); c.lineTo(72, -60.4); c.lineTo(60, -56.6); c.fill();
      c.fillStyle = '#b02a2a'; c.beginPath(); c.moveTo(50, -57); c.lineTo(34, -61 + Math.sin(ph * 2) * 2); c.lineTo(34, -49); c.closePath(); c.fill(); }
    c.restore();
  },
  _cart(c, ph, x, s) {
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-14, -28); c.lineTo(-58, -24); c.stroke();
    c.fillStyle = '#c8a252'; c.beginPath(); c.moveTo(-100, -38); c.quadraticCurveTo(-82, -58, -62, -38); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,80,20,0.5)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-94 + i * 6, -39); c.lineTo(-90 + i * 5, -52); c.stroke(); }
    const p = { kind: 'peasant', x: -80, y: -30, dir: 1, s: 0.8, state: 'stand', ph: 0, i: 0, a: { tunic: '#6a8f5a', legs: '#4a3a2a', skin: '#ebc29b', hair: '#3b2a1c', hat: '#e8dcc0' } };
    this._person(c, p);
    c.fillStyle = '#8a5a34'; c.fillRect(-104, -34, 46, 14); c.fillStyle = '#6a4224'; c.fillRect(-104, -34, 46, 3); c.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 4; i++) c.fillRect(-102 + i * 12, -30, 10, 1.5);
    const rot = x / 14 * (s ? 1 : 1);
    for (const wx of [-88]) { c.save(); c.translate(wx, -14); c.rotate(this._wheelRot || 0); c.strokeStyle = '#5a3c20'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 13.5, 0, 7); c.stroke(); c.lineWidth = 1.6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(13.5 * Math.cos(i * 1.0472), 13.5 * Math.sin(i * 1.0472)); c.stroke(); } c.fillStyle = '#3a2814'; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill(); c.restore(); }
  },

  // ---------- buildings around the icon groups
  _clusters(env) {
    const R = env.icons.filter(i => i.a > 0.05).map(i => ({ x0: i.x, y0: i.y, x1: i.x + i.w, y1: i.y + i.h })), n = R.length, par = R.map((_, i) => i);
    const find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }, G = 36;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (R[i].x0 - G < R[j].x1 && R[j].x0 - G < R[i].x1 && R[i].y0 - G < R[j].y1 && R[j].y0 - G < R[i].y1) par[find(i)] = find(j);
    const m = new Map();
    for (let i = 0; i < n; i++) { const k = find(i); let c = m.get(k); if (!c) m.set(k, c = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, r: [] }); c.x0 = Math.min(c.x0, R[i].x0); c.y0 = Math.min(c.y0, R[i].y0); c.x1 = Math.max(c.x1, R[i].x1); c.y1 = Math.max(c.y1, R[i].y1); c.r.push(R[i]); }
    return [...m.values()];
  },
  _iconSig(env) { return env.icons.filter(i => i.a > 0.05).map(i => (i.x >> 2) + ',' + (i.y >> 2) + ',' + (i.w >> 2) + ',' + (i.h >> 2)).join(';'); },

  _compose(env) {
    const { W, H, S, P } = env, tm = P.time | 0, pal = this.PALS[tm] || this.PALS[0], GY = this._GY, T = this._tiles, g = this._bld.getContext('2d'), r = env.rng(this._seed + 77);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this._bld.width, this._bld.height); g.setTransform(S, 0, 0, S, 0, 0);
    this._wins = []; this._smokes = []; this._flags = [];
    const cl = this._clusters(env).sort((a, b) => a.y1 - b.y1), BEAM = '#4b3424', BEAM_L = '#6b4a32', wins = [];
    const hit = (cluster, x, y, w, h, pad) => cluster.r.some(q => x - pad < q.x1 && x + w + pad > q.x0 && y - pad < q.y1 && y + h + pad > q.y0);
    const fill = (t, x, y, w, h) => this._fillTile(g, t, x, y, w, h);
    for (let ci = 0; ci < cl.length; ci++) {
      const c = cl[ci], pad = 26; let x0 = Math.max(-8, c.x0 - pad), x1 = Math.min(W + 8, c.x1 + pad); if (x1 - x0 < 150) { const mid = (x0 + x1) / 2; x0 = mid - 75; x1 = mid + 75; }
      const w = x1 - x0, base = Math.min(H - 6, Math.max(GY + 12, c.y1 + 16)); let top = Math.min(c.y0 - 26, base - 130);
      const roofH = env.clamp(w * 0.2, 54, 110), tower = (w <= 200 && base - top >= 220) || top - roofH < 6;
      if (tower) top = Math.max(top, 40);
      const hv = (c.x0 * 7 + c.y0 * 3) | 0, pl = T.plaster[Math.abs(hv) % 4], st = T.stone[Math.abs(hv >> 2) % 2];
      // ground shadow + wall
      const sg = g.createLinearGradient(0, base, 0, base + 10); sg.addColorStop(0, 'rgba(0,0,0,0.32)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x0 - 8, base, w + 16, 10);
      g.save(); g.beginPath(); g.rect(x0, top, w, base - top); g.clip(); fill(tower ? st : pl, x0, top, w, base - top);
      const shade = g.createLinearGradient(x0, 0, x1, 0); shade.addColorStop(0, 'rgba(0,0,0,0.22)'); shade.addColorStop(0.1, 'rgba(0,0,0,0)'); shade.addColorStop(0.9, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.26)'); g.fillStyle = shade; g.fillRect(x0, top, w, base - top);
      const eave = g.createLinearGradient(0, top, 0, top + 26); eave.addColorStop(0, 'rgba(0,0,0,0.34)'); eave.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = eave; g.fillRect(x0, top, w, 26);
      const nf = Math.max(1, Math.round((base - top) / 120)), fh = (base - top) / nf, posts = [x0];
      if (!tower) {
        // timber frame
        for (let x = x0 + 70; x < x1 - 40; x += 62 + (((x * 13) | 0) % 24)) posts.push(x); posts.push(x1 - 7);
        g.fillStyle = BEAM;
        for (let k = 0; k <= nf; k++) g.fillRect(x0, base - k * fh - (k === nf ? 0 : 3), w, 7);
        for (const px of posts) { g.fillRect(px, top, 7, base - top); g.fillStyle = BEAM_L; g.fillRect(px, top, 2, base - top); g.fillStyle = BEAM; }
        for (let k = 0; k < nf; k++) for (let pi = 0; pi < posts.length - 1; pi++) {
          const a = posts[pi] + 7, b2 = posts[pi + 1], y1 = base - k * fh - 7, y0 = base - (k + 1) * fh + 4;
          if (b2 - a < 30 || ((pi + k) % 3) === 1) continue; g.strokeStyle = BEAM; g.lineWidth = 5; g.beginPath(); if ((pi + k) % 2) { g.moveTo(a, y1); g.lineTo(b2, y0); } else { g.moveTo(a, y0); g.lineTo(b2, y1); } g.stroke();
        }
      } else {
        g.fillStyle = 'rgba(0,0,0,0.2)'; const bg2 = g.createLinearGradient(0, base - 60, 0, base); bg2.addColorStop(0, 'rgba(0,0,0,0)'); bg2.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = bg2; g.fillRect(x0, base - 60, w, 60);
      }
      // icon niches: calm plaster behind every icon so labels stay readable
      for (const q of c.r) { g.save(); g.beginPath(); g.roundRect(q.x0 - 7, q.y0 - 7, q.x1 - q.x0 + 14, q.y1 - q.y0 + 14, 11); g.clip(); fill(tower ? st : pl, q.x0 - 8, q.y0 - 8, q.x1 - q.x0 + 16, q.y1 - q.y0 + 16); g.fillStyle = tower ? 'rgba(255,255,255,0.1)' : 'rgba(255,248,230,0.35)'; g.fillRect(q.x0 - 8, q.y0 - 8, q.x1 - q.x0 + 16, q.y1 - q.y0 + 16); g.restore(); g.strokeStyle = 'rgba(40,24,10,0.45)'; g.lineWidth = 2; g.beginPath(); g.roundRect(q.x0 - 7, q.y0 - 7, q.x1 - q.x0 + 14, q.y1 - q.y0 + 14, 11); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.beginPath(); g.roundRect(q.x0 - 5.5, q.y0 - 5.5, q.x1 - q.x0 + 11, q.y1 - q.y0 + 11, 9.5); g.stroke(); }
      // foundation
      g.save(); g.beginPath(); g.rect(x0, base - 12, w, 12); g.clip(); fill(T.stone[0], x0, base - 12, w, 12); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, base - 12, w, 2); g.restore();
      g.restore();
      // doors, windows, slits
      const shut = ['#3f6a4a', '#7a3a34', '#3a5a82', '#6a5a2a'][Math.abs(hv >> 1) % 4];
      let doorDone = false;
      if (!tower) {
        for (let pi = 0; pi < posts.length - 1; pi++) {
          const a = posts[pi] + 7, b2 = posts[pi + 1], cx = (a + b2) / 2; if (b2 - a < 44) continue;
          for (let k = 0; k < nf; k++) {
            const rowBase = base - k * fh - 7, rowTop = base - (k + 1) * fh + 7;
            if (k === 0 && !doorDone && !hit(c, cx - 22, base - 62, 44, 62, 6) && b2 - a >= 50) { doorDone = true; this._door(g, cx, base - 12, tm, shut); wins.push({ x: cx - 5, y: base - 40, w: 10, h: 8, lit: false, door: true }); continue; }
            const ww = 20, wh = 30, wy = rowTop + (rowBase - rowTop) * 0.22; if (rowBase - rowTop < 62 || hit(c, cx - 22, wy - 4, 44, wh + 12, 9) || r() < 0.16) continue;
            this._windowFrame(g, cx, wy, ww, wh, shut, BEAM, r() < 0.4); wins.push({ x: cx - ww / 2, y: wy, w: ww, h: wh, lit: tm === 0 ? false : r() < 0.75, ph: r() * 6 });
          }
        }
        // roof: a row of trapezoids, one per ~330 px
        const ns = Math.max(1, Math.ceil(w / 330)), sw2 = w / ns, rc = Math.abs(hv >> 3) % 3, chim = Math.floor(r() * ns);
        for (let si = 0; si < ns; si++) {
          const sx = x0 + si * sw2, rh = roofH * (0.85 + r() * 0.3), rw = sw2 + 22, inset = rw * 0.2 + 6;
          if (si === chim) { const cxk = sx + sw2 * (0.55 + r() * 0.25); fill(T.stone[1], cxk - 8, top - rh - 18, 16, rh + 12); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(cxk + 2, top - rh - 18, 6, rh + 12); g.fillStyle = '#4a4440'; g.fillRect(cxk - 10, top - rh - 22, 20, 6); this._smokes.push({ x: cxk, y: top - rh - 24 }); }
          g.save(); g.beginPath(); g.moveTo(sx - 11, top + 3); g.lineTo(sx - 11 + inset, top - rh); g.lineTo(sx - 11 + rw - inset, top - rh); g.lineTo(sx - 11 + rw, top + 3); g.closePath(); g.clip();
          fill(T.roof[rc], sx - 12, top - rh, rw + 2, rh + 4);
          const rg = g.createLinearGradient(0, top - rh, 0, top + 3); rg.addColorStop(0, 'rgba(255,255,255,0.14)'); rg.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = rg; g.fillRect(sx - 12, top - rh, rw + 2, rh + 4); g.restore();
          g.strokeStyle = 'rgba(30,14,6,0.65)'; g.lineWidth = 2.2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(sx - 11, top + 3); g.lineTo(sx - 11 + inset, top - rh); g.lineTo(sx - 11 + rw - inset, top - rh); g.lineTo(sx - 11 + rw, top + 3); g.closePath(); g.stroke();
          g.fillStyle = '#3a2618'; g.fillRect(sx - 11 + inset - 2, top - rh - 3, rw - inset * 2 + 4, 5); g.fillStyle = BEAM; g.fillRect(sx - 12, top + 1, rw + 2, 5);
          if (r() < 0.55 && rh > 60) { const dx = sx + sw2 * 0.5; g.fillStyle = BEAM; g.fillRect(dx - 15, top - rh * 0.62, 30, 28); fill(pl, dx - 12, top - rh * 0.62 + 3, 24, 25); wins.push({ x: dx - 7, y: top - rh * 0.62 + 7, w: 14, h: 17, lit: tm > 0 && r() < 0.8, ph: r() * 6 }); this._windowFrame(g, dx, top - rh * 0.62 + 6, 14, 17, shut, BEAM, false); g.fillStyle = T.roof[rc] && '#7e3422'; g.beginPath(); g.moveTo(dx - 19, top - rh * 0.62 + 1); g.lineTo(dx, top - rh * 0.62 - 15); g.lineTo(dx + 19, top - rh * 0.62 + 1); g.closePath(); g.fill(); }
        }
      } else {
        // crenellated stone tower
        fill(st, x0 - 7, top - 14, w + 14, 14); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 - 7, top - 3, w + 14, 3); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x0 - 7, top - 14, w + 14, 2);
        const nm = Math.max(3, Math.round((w + 14) / 26)), mw = (w + 14) / nm;
        for (let i = 0; i < nm; i += 1) { if (i % 2) continue; fill(st, x0 - 7 + i * mw, top - 28, mw, 14); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x0 - 7 + i * mw, top - 28, mw, 2); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0 - 7 + (i + 1) * mw - 3, top - 28, 3, 14); }
        for (let y = top + 36; y < base - 70; y += 70) for (let px = x0 + 26; px < x1 - 20; px += 54) {
          if (hit(c, px - 10, y - 4, 20, 36, 8) || r() < 0.3) continue; g.fillStyle = '#17120e'; g.beginPath(); g.roundRect(px - 3, y, 6, 26, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(px + 3, y, 1.5, 26); wins.push({ x: px - 2, y: y + 3, w: 4, h: 20, lit: tm > 0 && r() < 0.7, ph: r() * 6, slit: true });
        }
        const gx = (x0 + x1) / 2; if (!hit(c, gx - 24, base - 66, 48, 66, 4)) this._gate(g, gx, base - 12, tm);
        const px = x0 + w * (r() < 0.5 ? 0.25 : 0.75); this._flags.push({ x: px, y: top - 28 - 54, col: ['#b02a2a', '#2f5d9a', '#d8a82a'][Math.abs(hv) % 3] }); g.fillStyle = '#4a3220'; g.fillRect(px - 1.2, top - 28 - 54, 2.4, 56);
      }
    }
    // light: dusk/night tint on the buildings, windows light up afterwards
    if (pal.tint) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = pal.tint; g.fillRect(0, 0, this._bld.width, this._bld.height); g.restore(); }
    for (const q of wins) {
      if (q.door) continue;
      const gr = g.createLinearGradient(0, q.y, 0, q.y + q.h);
      if (q.lit) { gr.addColorStop(0, '#ffe39a'); gr.addColorStop(1, '#ffb04a'); } else if (tm === 0) { gr.addColorStop(0, '#bfe0f2'); gr.addColorStop(1, '#6f98b8'); } else { gr.addColorStop(0, '#2a3a5a'); gr.addColorStop(1, '#141c30'); }
      g.fillStyle = gr; g.fillRect(q.x, q.y, q.w, q.h);
      if (!q.slit) { g.strokeStyle = 'rgba(40,26,14,0.9)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(q.x + q.w / 2, q.y); g.lineTo(q.x + q.w / 2, q.y + q.h); g.moveTo(q.x, q.y + q.h * 0.42); g.lineTo(q.x + q.w, q.y + q.h * 0.42); g.stroke(); if (tm === 0) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(q.x + 2, q.y + q.h - 2); g.lineTo(q.x + q.w * 0.5, q.y + 2); g.lineTo(q.x + q.w * 0.5 + 4, q.y + 2); g.lineTo(q.x + 6, q.y + q.h - 2); g.fill(); } }
    }
    this._wins = wins.filter(q => q.lit);
  },
  _windowFrame(g, cx, y, ww, wh, shut, beam, box) {
    g.fillStyle = beam; g.fillRect(cx - ww / 2 - 3, y - 3, ww + 6, wh + 6);
    for (const s of [-1, 1]) { g.fillStyle = shut; g.fillRect(s < 0 ? cx - ww / 2 - 12 : cx + ww / 2 + 3, y - 2, 9, wh + 4); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 1; i < 6; i++) g.fillRect(s < 0 ? cx - ww / 2 - 12 : cx + ww / 2 + 3, y - 2 + i * (wh + 4) / 6, 9, 1); }
    g.fillStyle = '#6b4a32'; g.fillRect(cx - ww / 2 - 5, y + wh + 3, ww + 10, 3);
    if (box) { g.fillStyle = '#6a4224'; g.fillRect(cx - ww / 2 - 3, y + wh + 6, ww + 6, 6); for (let i = 0; i < 6; i++) { g.fillStyle = ['#e84a5a', '#f4d03a', '#fff', '#5ab84a'][i % 4]; g.beginPath(); g.arc(cx - ww / 2 + i * (ww / 5), y + wh + 4, 2.6, 0, 7); g.fill(); } g.fillStyle = '#3f8a3a'; g.fillRect(cx - ww / 2 - 3, y + wh + 6, ww + 6, 2); }
  },
  _door(g, cx, by, tm, shut) {
    const w = 34, h = 52; g.fillStyle = '#3a2618'; g.beginPath(); g.moveTo(cx - w / 2 - 3, by); g.lineTo(cx - w / 2 - 3, by - h + 16); g.arc(cx, by - h + 16, w / 2 + 3, Math.PI, 0); g.lineTo(cx + w / 2 + 3, by); g.fill();
    const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); gr.addColorStop(0, '#7a5434'); gr.addColorStop(1, '#5a3a22'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, by - h + 16); g.arc(cx, by - h + 16, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, by); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx - w / 2 + i * w / 4, by); g.lineTo(cx - w / 2 + i * w / 4, by - h + 8); g.stroke(); }
    g.fillStyle = '#222'; for (const yy of [by - 38, by - 12]) g.fillRect(cx - w / 2, yy, w, 3); g.fillStyle = '#d8b050'; g.beginPath(); g.arc(cx + 8, by - 22, 2.2, 0, 7); g.fill();
    g.fillStyle = '#9a9690'; g.fillRect(cx - w / 2 - 6, by, w + 12, 5); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(cx - w / 2 - 6, by, w + 12, 1.5);
  },
  _gate(g, cx, by, tm) {
    const w = 38, h = 58; g.fillStyle = '#14100c'; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, by - h + w / 2); g.arc(cx, by - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, by); g.fill();
    g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, by - h + w / 2); g.arc(cx, by - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, by); g.stroke();
    g.strokeStyle = '#6a625a'; g.lineWidth = 2; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(cx - w / 2 + i * w / 5, by); g.lineTo(cx - w / 2 + i * w / 5, by - h + 12); g.stroke(); } for (const yy of [by - 14, by - 34]) { g.beginPath(); g.moveTo(cx - w / 2, yy); g.lineTo(cx + w / 2, yy); g.stroke(); }
  },

  _glowSprite: null,
  _drawWindmill(c, x, y, ang, tm) {
    const dk = tm === 2 ? 0.5 : tm === 1 ? 0.78 : 1, col = (r, g2, b) => `rgb(${r * dk | 0},${g2 * dk | 0},${b * dk | 0})`;
    c.save(); c.translate(x, y);
    c.fillStyle = col(232, 224, 204); c.beginPath(); c.moveTo(-22, 0); c.lineTo(-14, -78); c.lineTo(14, -78); c.lineTo(22, 0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.moveTo(6, -78); c.lineTo(14, -78); c.lineTo(22, 0); c.lineTo(10, 0); c.closePath(); c.fill();
    c.fillStyle = col(110, 78, 50); c.beginPath(); c.roundRect(-5, -22, 10, 22, [5, 5, 0, 0]); c.fill();
    c.fillStyle = col(150, 70, 48); c.beginPath(); c.moveTo(-19, -76); c.lineTo(0, -102); c.lineTo(19, -76); c.closePath(); c.fill();
    c.translate(0, -84); c.rotate(ang);
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); c.fillStyle = col(96, 66, 40); c.fillRect(-1.8, -64, 3.6, 64); c.fillStyle = col(240, 236, 224); c.globalAlpha = 0.95; c.fillRect(1.8, -62, 13, 38); c.globalAlpha = 1; c.strokeStyle = col(110, 80, 50); c.lineWidth = 0.9; for (let j = 0; j < 6; j++) { c.beginPath(); c.moveTo(1.8, -62 + j * 6.4); c.lineTo(14.8, -62 + j * 6.4); c.stroke(); } c.restore(); }
    c.fillStyle = col(70, 48, 30); c.beginPath(); c.arc(0, 0, 4.4, 0, 7); c.fill();
    c.restore();
  },
  _drawCloud(c, x, y, s, tm) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = tm === 2 ? 0.16 : 0.92; c.fillStyle = tm === 2 ? '#8aa0d0' : tm === 1 ? '#ffd7c4' : '#fff';
    for (const [dx, dy, r] of [[0, 0, 16], [18, -8, 20], [40, -2, 17], [58, 4, 12], [-16, 5, 11]]) { c.beginPath(); c.arc(dx, dy, r, 0, 7); c.fill(); }
    c.fillRect(-16, 4, 74, 12); c.restore();
  },
  _drawBird(c, b, t, tm) {
    const f = Math.sin(t * 9 + b.ph) * 5; c.save(); c.translate(b.x, b.y); c.scale(b.dir * b.s, b.s); c.strokeStyle = tm === 2 ? '#0a0c18' : '#1c1a22'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-9, -f); c.quadraticCurveTo(-4, -f * 0.4 - 3, 0, 0); c.quadraticCurveTo(4, -f * 0.4 - 3, 9, -f); c.stroke(); c.fillStyle = c.strokeStyle; c.beginPath(); c.ellipse(0, 0.5, 3.6, 1.8, 0, 0, 7); c.fill(); c.restore();
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, tm = P.time | 0, pal = this.PALS[tm] || this.PALS[0], GY = this._GY, u = env.clamp(H / 900, 0.85, 1.5);
    if (this._key !== String(tm) || !this._bg) this.rebuild(env);
    if (this._wv !== P.villagers) this._makeWalkers(env, env.rng(this._seed + 9));
    const sig = this._iconSig(env);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._bg, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    // sky life
    for (const c of this._clouds) { c.x += c.v * dt; if (c.x > W + 100) c.x = -140; this._drawCloud(ctx, c.x, c.y, c.s, tm); }
    if (!this._wmx) this._wmx = W * (0.1 + 0.16 * env.rng(this._seed + 3)());
    this._drawWindmill(ctx, this._wmx, this._hillY(this._wmx) + 12, t * 0.55, tm);
    this._birdT -= dt;
    if (this._birdT <= 0) { this._birdT = 14 + Math.random() * 22; const dir = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 4), y0 = 40 + Math.random() * GY * 0.35; for (let i = 0; i < n; i++) this._birds.push({ x: dir > 0 ? -30 - i * 24 : W + 30 + i * 24, y: y0 + i * 6 + Math.random() * 12, dir, s: 0.9 + Math.random() * 0.4, ph: Math.random() * 6, v: 70 + Math.random() * 10 }); }
    for (const b of this._birds) { b.x += b.dir * b.v * dt; b.y += Math.sin(t + b.ph) * 4 * dt; this._drawBird(ctx, b, t, tm); }
    this._birds = this._birds.filter(b => b.x > -80 && b.x < W + 80);
    // buildings
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this._bld, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0);
    // flags
    for (const f of this._flags) { ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(f.x, f.y); for (let i = 1; i <= 6; i++) ctx.lineTo(f.x + i * 4.6, f.y + Math.sin(t * 4 - i * 0.7) * 2.4 * (i / 6)); for (let i = 6; i >= 1; i--) ctx.lineTo(f.x + i * 4.6 * (1 - 0.1 * (i / 6)), f.y + 13 - (7 - i) * 0.9 + Math.sin(t * 4 - i * 0.7) * 2.4 * (i / 6)); ctx.closePath(); ctx.fill(); }
    // chimney smoke
    this._smokeT = (this._smokeT || 0) - dt; if (this._smokeT <= 0) { this._smokeT = 0.45; for (const s of this._smokes) if (this._parts.length < 120) this._parts.push({ x: s.x + (Math.random() - 0.5) * 3, y: s.y, age: 0, life: 4 + Math.random() * 2, r: 4 + Math.random() * 2 }); }
    for (const p of this._parts) { p.age += dt; p.y -= (14 + p.age * 3) * dt; p.x += (5 + p.age * 2) * dt + Math.sin(p.age * 2 + p.y) * 0.1; const k = p.age / p.life; ctx.globalAlpha = Math.max(0, 0.45 * (1 - k)) * (tm === 2 ? 0.6 : 1); ctx.fillStyle = tm === 0 ? '#eee' : '#bbb'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + k * 11, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; this._parts = this._parts.filter(p => p.age < p.life);
    // warm window glow
    if (tm > 0 && this._wins.length) {
      if (!this._glowSprite) { const g = document.createElement('canvas'); g.width = g.height = 64; const x = g.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,200,110,0.65)'); gr.addColorStop(1, 'rgba(255,170,70,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); this._glowSprite = g; }
      ctx.globalCompositeOperation = 'lighter';
      for (const q of this._wins) { const fl = 0.8 + 0.2 * Math.sin(t * 7 + q.ph) * Math.sin(t * 3.1 + q.ph * 2), sz = q.slit ? 28 : 62; ctx.globalAlpha = (tm === 2 ? 0.8 : 0.5) * fl; ctx.drawImage(this._glowSprite, q.x + q.w / 2 - sz / 2, q.y + q.h / 2 - sz / 2, sz, sz); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // street life (sorted by depth). dusk/night go through a band layer that gets the colour tint.
    const items = [];
    for (const w of this._walkers) { this._stepWalker(w, dt, env); items.push(w); }
    for (const ch of this._chickens) { this._stepChicken(ch, dt, env); items.push(ch); }
    this._evT -= dt;
    if (this._evT <= 0 && P.villagers > 0) { this._evT = 40 + Math.random() * 40; const dir = Math.random() < 0.5 ? 1 : -1, knight = Math.random() < 0.35, lane = 0.3 + Math.random() * 0.5; this._events.push({ kind: knight ? 'knight' : 'cart', x: dir > 0 ? -170 : W + 170, dir, lane, v: (knight ? 105 : 72) * u, ph: 0, rot: 0 }); }
    for (const e of this._events) { e.x += e.dir * e.v * dt; e.ph += dt * e.v * 0.085; e.y = this._laneY(env, e.lane); e.s = this._scaleAt(env, e.lane) * 0.95; items.push(e); }
    this._events = this._events.filter(e => e.x > -260 && e.x < W + 260);
    items.sort((a, b) => a.y - b.y);
    let tgt = ctx, band = null;
    if (pal.tint) {
      const by = Math.max(0, Math.floor(GY - 120)), bh = H - by; band = this._fg;
      if (!band || band.width !== this._bld.width || band._by !== by) { band = this._fg = document.createElement('canvas'); band.width = this._bld.width; band.height = Math.max(1, Math.ceil(bh * S)); band._by = by; }
      tgt = band.getContext('2d'); tgt.setTransform(1, 0, 0, 1, 0, 0); tgt.clearRect(0, 0, band.width, band.height); tgt.setTransform(S, 0, 0, S, 0, -by * S);
    }
    for (const it of items) {
      if (it.kind === 'cart' || it.kind === 'knight') { const kn = it.kind === 'knight'; this._wheelRot = it.x / 14 * it.dir; this._horse(tgt, it.x, it.y, it.s, it.dir, it.ph, kn ? { col: '#e9e4da', dk: '#bfb8aa', mane: '#8a8478', cloth: ['#2f5d9a', '#e8e0d0'], rider: { tunic: '#aab2bb', legs: '#7c858f', skin: '#ebc29b', hair: '#222', hat: '#fff' } } : { col: '#8a5a38', dk: '#6a4026', mane: '#2a1c14', cart: true }); }
      else if (it.kind === 'dog') this._dog2(tgt, it, u);
      else if (it.c) this._chicken(tgt, it, u);
      else this._person(tgt, it);
    }
    if (band) { tgt.setTransform(1, 0, 0, 1, 0, 0); tgt.globalCompositeOperation = 'source-atop'; tgt.fillStyle = pal.tint; tgt.fillRect(0, 0, band.width, band.height); tgt.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(band, 0, Math.round(band._by * S)); ctx.setTransform(S, 0, 0, S, 0, 0); }
  },
  _dog2(c, w, u) { this._dog(c, w); },
  _stepWalker(w, dt, env) {
    const { W } = env, u = env.clamp(env.H / 900, 0.85, 1.5);
    w.y = this._laneY(env, w.lane); w.s = this._scaleAt(env, w.lane); w.t -= dt;
    if (w.t <= 0) { if (w.state === 'walk' && Math.random() < 0.45) { w.state = 'stand'; w.t = 2 + Math.random() * 5; } else { w.state = 'walk'; w.t = 4 + Math.random() * 10; if (Math.random() < 0.3) w.dir *= -1; } }
    if (w.state === 'walk') { w.x += w.dir * w.speed * u * dt; w.ph += dt * w.speed * 0.3 / (w.kind === 'dog' ? 1.1 : 1); }
    if (w.x > W + 40) { w.x = -30; w.lane = Math.random(); } else if (w.x < -40) { w.x = W + 30; w.lane = Math.random(); }
  },
  _stepChicken(ch, dt, env) {
    const { W } = env; ch.y = this._laneY(env, ch.lane); ch.t -= dt; ch.ph += dt * 2;
    if (ch.t <= 0) { ch.st = Math.random() < 0.65 ? 1 : 0; ch.t = 1 + Math.random() * 3; if (ch.st === 0 && Math.random() < 0.5) ch.dir *= -1; }
    if (ch.st === 0) ch.x += ch.dir * 16 * dt; if (ch.x > W + 20) ch.x = -10; if (ch.x < -20) ch.x = W + 10;
  },
});
