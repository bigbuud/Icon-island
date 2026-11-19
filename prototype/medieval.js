// Theme "Medieval village": a bird's-eye view of a medieval countryside. Several villages (thatched and slate houses, a market
// square with a well and stalls, a church with its graveyard), a windmill, a river with a stone bridge and a watermill, dirt roads
// and crop fields. Every group of icons sits in its own fenced field (wheat, rapeseed, vegetables, plough land ...).
// Villagers walk the roads, carts with horses drive between the villages, cows, horses and pigs graze the meadows.
IconIsland.theme({
  params: { life: 1, villages: 1, season: 0 },
  R: 56,
  _Z: null, _herd: null, _terr: null, _comp: null, _tmp: null, _items: [], _roads: [], _river: [], _carts: [], _smk: [], _anim: [], _sig: '', _last: -9, _seed: 1, _key: '', _bal: 0, _ftex: null,
  _occ: null, _rd: null, _gw: 0, _gh: 0, _sp: {}, _vill: [],

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._herd = new Fauna.Herd(); this._sig = ''; this._key = ''; },

  _pal(season) {
    return [
      { g1: [92, 146, 60], g2: [122, 168, 70], wheat: ['#dcb64c', '#c89a34'], tree: [['#3b7a34', '#62a84a'], ['#4a8a3a', '#78b856'], ['#2f6a34', '#559a46']], tr2: [['#4c8a3c', '#7cc05a']] },
      { g1: [134, 142, 62], g2: [158, 150, 64], wheat: ['#c9a85a', '#b48e44'], tree: [['#a8531f', '#da8a2b'], ['#c9772a', '#ecb43c'], ['#6a7f2e', '#98a83c'], ['#8a3a1c', '#c8601f']], tr2: [['#b86a24', '#e8a030']] },
      { g1: [100, 160, 74], g2: [130, 180, 86], wheat: ['#9ab852', '#7ea040'], tree: [['#5fa04a', '#94c864'], ['#e0a8c0', '#f6d6e2'], ['#4d9440', '#82c05a'], ['#f2e4ea', '#fff4f6']], tr2: [['#e8b8cc', '#fbe2ec']] },
    ][season] || null;
  },

  // ---------- crop textures (used for background fields and for the fields around the icons)
  _crop(g, type, x, y, w, h, ang, r, pal, season) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x + w / 2, y + h / 2); g.rotate(ang);
    const D = Math.hypot(w, h) / 2 + 4;
    const rows = (sp, fn) => { for (let k = -D; k < D; k += sp) fn(k); };
    if (type === 'wheat') {
      g.fillStyle = pal.wheat[0]; g.fillRect(-D, -D, D * 2, D * 2);
      rows(6, k => { g.fillStyle = (Math.round(k / 6) % 2) ? pal.wheat[1] : pal.wheat[0]; g.globalAlpha = 0.55; g.fillRect(-D, k, D * 2, 3); });
      g.globalAlpha = 0.28; for (let i = 0; i < D * 5; i++) { g.fillStyle = r() < 0.5 ? '#fff3b0' : '#8a6a20'; g.fillRect((r() * 2 - 1) * D, (r() * 2 - 1) * D, 1.6, 1.6); } g.globalAlpha = 1;
      if (season === 1) { g.fillStyle = 'rgba(120,80,30,0.15)'; rows(26, k => g.fillRect(-D, k, D * 2, 1.5)); }
    } else if (type === 'rape') {
      g.fillStyle = '#e6cc2c'; g.fillRect(-D, -D, D * 2, D * 2);
      for (let i = 0; i < D * 7; i++) { g.fillStyle = r() < 0.5 ? '#f6e660' : '#c8a818'; g.globalAlpha = 0.55; g.beginPath(); g.arc((r() * 2 - 1) * D, (r() * 2 - 1) * D, 1 + r() * 2.2, 0, 7); g.fill(); } g.globalAlpha = 0.25; g.fillStyle = '#5a8a2a'; rows(34, k => g.fillRect(-D, k, D * 2, 3)); g.globalAlpha = 1;
    } else if (type === 'plow') {
      g.fillStyle = '#7a5634'; g.fillRect(-D, -D, D * 2, D * 2);
      rows(7, k => { g.fillStyle = '#a07a4a'; g.fillRect(-D, k, D * 2, 3); g.fillStyle = '#4e3420'; g.fillRect(-D, k + 3.5, D * 2, 2); });
      g.globalAlpha = 0.3; for (let i = 0; i < D * 3; i++) { g.fillStyle = '#c8a070'; g.fillRect((r() * 2 - 1) * D, (r() * 2 - 1) * D, 2, 1.4); } g.globalAlpha = 1;
    } else if (type === 'veg') {
      g.fillStyle = '#6a4a2c'; g.fillRect(-D, -D, D * 2, D * 2);
      rows(13, k => { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-D, k + 2, D * 2, 7); for (let q = -D; q < D; q += 8 + r() * 2) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(q + 1.5, k + 7, 4.4, 0, 7); g.fill(); const gr = g.createRadialGradient(q - 1, k + 4, 0.5, q, k + 5, 5); gr.addColorStop(0, ['#9ad45c', '#b8e070', '#8ac4a0'][(q * 7 | 0) & 1 ? 0 : 1]); gr.addColorStop(1, '#3f8a34'); g.fillStyle = gr; g.beginPath(); g.arc(q, k + 5, 4.6, 0, 7); g.fill(); } });
    } else {   // mown hay meadow
      g.fillStyle = `rgb(${pal.g2[0]},${pal.g2[1]},${pal.g2[2]})`; g.fillRect(-D, -D, D * 2, D * 2);
      rows(16, k => { g.fillStyle = (Math.round(k / 16) % 2) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; g.fillRect(-D, k, D * 2, 16); });
    }
    g.restore();
  },
  _fence(g, pts, closed) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(30,20,8,0.28)'; g.lineWidth = 3; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] + 1.6, p[1] + 2.2) : g.moveTo(p[0] + 1.6, p[1] + 2.2)); if (closed) g.closePath(); g.stroke();
    g.strokeStyle = '#6f4e2e'; g.lineWidth = 2; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (closed) g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(255,230,180,0.3)'; g.lineWidth = 0.8; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1] - 0.6) : g.moveTo(p[0], p[1] - 0.6)); if (closed) g.closePath(); g.stroke();
    let acc = 0; const n = pts.length + (closed ? 1 : 0);
    for (let i = 1; i < n; i++) { const a = pts[i - 1], b = pts[i % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let d = (14 - acc % 14) % 14; d < L; d += 14) { const x = a[0] + (b[0] - a[0]) * d / L, y = a[1] + (b[1] - a[1]) * d / L; g.fillStyle = 'rgba(30,20,8,0.3)'; g.beginPath(); g.arc(x + 1.6, y + 2, 2.4, 0, 7); g.fill(); g.fillStyle = '#5a3c20'; g.beginPath(); g.arc(x, y, 2.3, 0, 7); g.fill(); g.fillStyle = '#9a7448'; g.beginPath(); g.arc(x - 0.6, y - 0.6, 1, 0, 7); g.fill(); } acc += L; }
    g.restore();
  },

  // ---------- sprites
  _mkc(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; },
  _spr(w, h, Q, fn) { const c = this._mkc(w * Q, h * Q), g = c.getContext('2d'); g.scale(Q, Q); fn(g); return { img: c, w, h }; },
  _shadow(g, fn) { g.save(); g.filter = 'blur(3px)'; g.fillStyle = 'rgba(14,24,6,0.34)'; fn(g); g.restore(); },
  _roof(g, x, y, w, d, v, kind, r) {
    // top-down roof of w x d; ridge runs along the long side (v = ridge vertical)
    g.save(); g.beginPath(); g.roundRect(x - 3, y - 2, w + 6, d + 4, 3); g.clip();
    const base = { thatch: '#c6a258', slate: '#66727f', tile: '#b25a3c', dark: '#4a5870' }[kind];
    g.fillStyle = base; g.fillRect(x - 4, y - 3, w + 8, d + 6);
    const cols = { thatch: ['#b3883c', '#d6b668', '#9c7632', '#e2c67c'], slate: ['#5a6674', '#7a8795', '#4c5664', '#8794a2'], tile: ['#a04a30', '#c8704a', '#8e4028', '#d6845a'], dark: ['#3e4a60', '#566882', '#34405a', '#647694'] }[kind];
    if (kind === 'thatch') { for (let i = 0; i < w * d / 7; i++) { g.strokeStyle = cols[(r() * 4) | 0]; g.globalAlpha = 0.5; g.lineWidth = 1.1; const px = x + r() * w, py = y + r() * d; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (v ? 6 : 0.8), py + (v ? 0.8 : 6)); g.stroke(); } g.globalAlpha = 1; }
    else { const sp = 4.5; if (v) for (let px = x; px < x + w; px += sp) { for (let py = y; py < y + d; py += sp * 1.3) { g.fillStyle = cols[(r() * 4) | 0]; g.globalAlpha = 0.45; g.fillRect(px, py, sp - 0.6, sp * 1.3 - 0.6); } } else for (let py = y; py < y + d; py += sp) { for (let px = x - (Math.round(py / sp) % 2) * 3; px < x + w; px += sp * 1.3) { g.fillStyle = cols[(r() * 4) | 0]; g.globalAlpha = 0.45; g.fillRect(px, py, sp * 1.3 - 0.6, sp - 0.6); } } g.globalAlpha = 1; }
    const lg = v ? g.createLinearGradient(x, 0, x + w, 0) : g.createLinearGradient(0, y, 0, y + d);
    lg.addColorStop(0, 'rgba(255,255,255,0.2)'); lg.addColorStop(0.49, 'rgba(255,255,255,0.05)'); lg.addColorStop(0.51, 'rgba(0,0,0,0.12)'); lg.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = lg; g.fillRect(x - 4, y - 3, w + 8, d + 6);
    g.strokeStyle = 'rgba(40,26,12,0.8)'; g.lineWidth = 1.8; g.beginPath(); if (v) { g.moveTo(x + w / 2, y - 2); g.lineTo(x + w / 2, y + d + 2); } else { g.moveTo(x - 3, y + d / 2); g.lineTo(x + w + 3, y + d / 2); } g.stroke();
    g.restore(); g.strokeStyle = 'rgba(30,20,8,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(x - 3, y - 2, w + 6, d + 4, 3); g.stroke();
  },
  _walls(g, x, y, w, hgt, r, stone) {
    g.fillStyle = stone ? '#9a9890' : '#e4d6b2'; g.fillRect(x - 1, y, w + 2, hgt);
    if (!stone) { g.fillStyle = '#5a3e26'; for (let px = x; px <= x + w; px += 11 + r() * 5) g.fillRect(px, y, 2, hgt); g.fillRect(x - 1, y, w + 2, 1.5); }
    else { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.8; for (let px = x; px < x + w; px += 7) { g.beginPath(); g.moveTo(px, y); g.lineTo(px, y + hgt); g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x - 1, y + hgt - 2, w + 2, 2);
    g.fillStyle = '#4a3220'; g.fillRect(x + 6 + r() * (w - 20), y + 2, 6, hgt - 2); g.fillStyle = '#6a7a8a'; for (let k = 0; k < 2; k++) g.fillRect(x + 8 + r() * (w - 16), y + 2.5, 5, 4);
  },
  _house(w, d, v, kind, r, Q) {
    const pad = 16, hgt = 10, info = { ch: null }, sp = this._spr(w + pad * 2, d + hgt + pad * 2, Q, g => {
      this._shadow(g, g2 => { g2.beginPath(); g2.roundRect(pad + 8, pad + 8, w, d + hgt - 2, 4); g2.fill(); });
      this._walls(g, pad, pad + d, w, hgt, r, false); this._roof(g, pad, pad, w, d, v, kind, r);
      const cx = pad + w * (0.2 + r() * 0.6), cy = pad + d * (v ? 0.3 : 0.28); info.ch = { x: cx + 4, y: cy + 4 };
      if (r() < 0.8) { g.fillStyle = 'rgba(20,10,0,0.3)'; g.fillRect(cx + 1.5, cy + 1.5, 9, 9); g.fillStyle = '#8c8880'; g.fillRect(cx, cy, 9, 9); g.fillStyle = '#4a4440'; g.fillRect(cx + 2, cy + 2, 5, 5); } else info.ch = null;
    }); sp.ch = info.ch; sp.ax = pad + w / 2; sp.ay = pad + (d + hgt) / 2; sp.fw = w; sp.fh = d + hgt; return sp;
  },
  _church(Q, r) {
    const W0 = 200, H0 = 170, sp = this._spr(W0, H0, Q, g => {
      g.fillStyle = '#86b25c'; g.fillRect(10, 10, 180, 150); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(10, 10, 180, 150);
      g.strokeStyle = 'rgba(20,10,0,0.35)'; g.lineWidth = 8; g.strokeRect(10, 10, 180, 150); g.strokeStyle = '#b0aca2'; g.lineWidth = 5; g.strokeRect(10, 10, 180, 150); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; g.strokeRect(8, 8, 184, 154);
      g.fillStyle = '#8a6a42'; g.fillRect(92, 156, 26, 8);
      for (let i = 0; i < 16; i++) { const x = 24 + (i % 8) * 20 + r() * 4, y = 108 + Math.floor(i / 8) * 24 + r() * 4; g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 2, y + 2, 7, 10); g.fillStyle = '#a8a8a0'; g.beginPath(); g.roundRect(x, y, 7, 10, [3, 3, 0, 0]); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x + 1, y + 2, 2, 7); }
      this._shadow(g, g2 => { g2.fillRect(46 + 9, 40 + 10, 112, 40); g2.fillRect(88 + 9, 20 + 10, 34, 80); g2.fillRect(34 + 9, 24 + 10, 36, 40); });
      this._walls(g, 46, 80, 112, 12, r, true); this._roof(g, 46, 40, 112, 40, false, 'dark', r);
      this._walls(g, 88, 100, 34, 10, r, true); this._roof(g, 88, 20, 34, 80, true, 'dark', r);
      // tower
      this._walls(g, 32, 64, 40, 18, r, true); g.fillStyle = '#8c8c86'; g.fillRect(32, 24, 40, 40);
      const cx = 52, cy = 44, a = 24; for (const [p, q, col] of [[[-a / 2 * 1.6, -a * 0.8], [a / 2 * 1.6, -a * 0.8], 'rgba(255,255,255,0.22)'], [[a / 2 * 1.6, -a * 0.8], [a / 2 * 1.6, a * 0.8], 'rgba(0,0,0,0.12)'], [[a / 2 * 1.6, a * 0.8], [-a / 2 * 1.6, a * 0.8], 'rgba(0,0,0,0.3)'], [[-a / 2 * 1.6, a * 0.8], [-a / 2 * 1.6, -a * 0.8], 'rgba(255,255,255,0.08)']]) { g.fillStyle = '#5a6678'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + p[0], cy + p[1]); g.lineTo(cx + q[0], cy + q[1]); g.closePath(); g.fill(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(20,20,30,0.5)'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = '#d8b050'; g.beginPath(); g.arc(cx, cy - 1, 2, 0, 7); g.fill();
    }); sp.ax = 100; sp.ay = 85; sp.fw = 180; sp.fh = 150; return sp;
  },
  _stall(c1, Q, r) {
    return this._spr(60, 56, Q, g => {
      this._shadow(g, g2 => g2.fillRect(18, 18, 30, 28));
      g.fillStyle = '#6a4a2c'; g.fillRect(14, 14, 32, 26);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f0e8d6' : c1; g.fillRect(12 + i * 6, 10, 6, 28); }
      const lg = g.createLinearGradient(0, 10, 0, 38); lg.addColorStop(0, 'rgba(255,255,255,0.2)'); lg.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = lg; g.fillRect(12, 10, 36, 28);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f0e8d6' : c1; g.beginPath(); g.arc(15 + i * 6, 38, 3, 0, Math.PI); g.fill(); }
      g.strokeStyle = 'rgba(40,20,0,0.45)'; g.lineWidth = 1; g.strokeRect(12, 10, 36, 28);
      for (let i = 0; i < 5; i++) { g.fillStyle = ['#d94a3a', '#e8b030', '#6aa84f', '#c87a3a'][(r() * 4) | 0]; g.beginPath(); g.arc(18 + i * 6, 44, 2.6, 0, 7); g.fill(); }
    });
  },
  _tree(cols, Q, r, big) {
    const S0 = big ? 96 : 76, c = S0 / 2;
    return this._spr(S0, S0, Q, g => {
      this._shadow(g, g2 => { g2.beginPath(); g2.ellipse(c + 9, c + 11, S0 * 0.3, S0 * 0.26, 0, 0, 7); g2.fill(); });
      const R0 = S0 * 0.27, blobs = []; for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = R0 * (0.2 + r() * 0.6); blobs.push([c + Math.cos(a) * d, c + Math.sin(a) * d - 3, R0 * (0.55 + r() * 0.35)]); } blobs.push([c, c - 4, R0 * 0.8]);
      for (const [x, y, rr] of blobs) { const gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, 1, x, y, rr); gr.addColorStop(0, cols[1]); gr.addColorStop(1, cols[0]); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(c + (r() - 0.5) * R0 * 1.8, c + (r() - 0.3) * R0 * 1.8, 1.5 + r() * 2, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.14)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(c - R0 * 0.4 + (r() - 0.5) * R0, c - R0 * 0.5 + (r() - 0.5) * R0, 1 + r() * 1.8, 0, 7); g.fill(); }
    });
  },
  _misc(kind, Q, r) {
    if (kind === 'well') return this._spr(60, 60, Q, g => { this._shadow(g, g2 => { g2.beginPath(); g2.arc(36, 36, 15, 0, 7); g2.fill(); }); g.fillStyle = '#a8a49a'; g.beginPath(); g.arc(30, 30, 14, 0, 7); g.fill(); g.fillStyle = '#6a665e'; g.beginPath(); g.arc(30, 30, 9, 0, 7); g.fill(); g.fillStyle = '#1e3a5a'; g.beginPath(); g.arc(30, 30, 7, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; g.beginPath(); g.arc(30, 30, 13.4, 3.6, 5.2); g.stroke(); g.fillStyle = '#7a5434'; g.fillRect(14, 28, 32, 4); g.fillStyle = '#6a4224'; g.fillRect(14, 28, 32, 1.4); });
    if (kind === 'hay') return this._spr(44, 44, Q, g => { this._shadow(g, g2 => { g2.beginPath(); g2.arc(26, 26, 13, 0, 7); g2.fill(); }); const gr = g.createRadialGradient(19, 19, 1, 22, 22, 14); gr.addColorStop(0, '#f0d878'); gr.addColorStop(1, '#c0983c'); g.fillStyle = gr; g.beginPath(); g.arc(22, 22, 13, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,80,20,0.35)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.arc(22, 22, i * 3.4, 0, 7); g.stroke(); } });
    if (kind === 'barrel') return this._spr(30, 30, Q, g => { this._shadow(g, g2 => { g2.beginPath(); g2.arc(18, 18, 7, 0, 7); g2.fill(); }); g.fillStyle = '#8a5a34'; g.beginPath(); g.arc(14, 14, 7, 0, 7); g.fill(); g.strokeStyle = '#4a3018'; g.lineWidth = 1; g.beginPath(); g.arc(14, 14, 5, 0, 7); g.stroke(); g.fillStyle = '#a8784a'; g.beginPath(); g.arc(14, 14, 3, 0, 7); g.fill(); });
    if (kind === 'bush') return this._spr(36, 36, Q, g => { this._shadow(g, g2 => { g2.beginPath(); g2.ellipse(21, 21, 11, 9, 0, 0, 7); g2.fill(); }); for (const [x, y, rr] of [[14, 18, 8], [22, 16, 8], [18, 22, 8], [18, 14, 7]]) { const gr = g.createRadialGradient(x - 2, y - 2, 1, x, y, rr); gr.addColorStop(0, '#7cc05a'); gr.addColorStop(1, '#3f7a34'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); } });
    return null;
  },

  _wdist(x, y) { let m = 1e9; for (const p of this._river) { const d = Math.hypot(x - p[0], y - p[1]) - p[2] / 2; if (d < m) m = d; } return m; },

  rebuild(env) {
    const { W, H, S, P } = env, cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 211), Z = this._Z, season = P.season | 0, pal = this._pal(season), Q = S * 1.5, cl = env.clamp;
    Z.resize(env); this._tmp = this._mkc(cw, ch); this._comp = this._mkc(cw, ch); this._terr = this._mkc(cw, ch); this._key = season + ':' + P.villages; this._sig = '';
    const gc = 10, gw = this._gw = Math.ceil(W / gc) + 1, gh = this._gh = Math.ceil(H / gc) + 1, occ = this._occ = new Uint8Array(gw * gh), rd = this._rd = new Uint8Array(gw * gh);
    const markC = (arr, x, y, rad) => { for (let j = Math.max(0, Math.floor((y - rad) / gc)); j <= Math.min(gh - 1, Math.floor((y + rad) / gc)); j++) for (let i = Math.max(0, Math.floor((x - rad) / gc)); i <= Math.min(gw - 1, Math.floor((x + rad) / gc)); i++) if (Math.hypot((i + 0.5) * gc - x, (j + 0.5) * gc - y) <= rad) arr[j * gw + i] = 1; };
    const markR = (arr, x0, y0, x1, y1) => { for (let j = Math.max(0, Math.floor(y0 / gc)); j <= Math.min(gh - 1, Math.floor(y1 / gc)); j++) for (let i = Math.max(0, Math.floor(x0 / gc)); i <= Math.min(gw - 1, Math.floor(x1 / gc)); i++) arr[j * gw + i] = 1; };
    const isOcc = (x, y, rad) => { for (let j = Math.floor((y - rad) / gc); j <= Math.floor((y + rad) / gc); j++) for (let i = Math.floor((x - rad) / gc); i <= Math.floor((x + rad) / gc); i++) { if (i < 0 || j < 0 || i >= gw || j >= gh) return true; if (occ[j * gw + i] || rd[j * gw + i]) return true; } return false; };
    // ---------- sprites
    const sp = this._sp = { houses: [], trees: [], stall: [], well: this._misc('well', Q, r), hay: this._misc('hay', Q, r), barrel: this._misc('barrel', Q, r), bush: this._misc('bush', Q, r), church: this._church(Q, r) };
    sp.well.ax = 30; sp.well.ay = 30; sp.hay.ax = 22; sp.hay.ay = 22; sp.barrel.ax = 14; sp.barrel.ay = 14; sp.bush.ax = 18; sp.bush.ay = 18;
    const kinds = ['thatch', 'thatch', 'thatch', 'slate', 'slate', 'tile', 'dark'];
    for (let i = 0; i < 16; i++) { const v = r() < 0.3; sp.houses.push(this._house(v ? 40 + r() * 16 : 58 + r() * 48, v ? 58 + r() * 32 : 40 + r() * 20, v, kinds[(r() * kinds.length) | 0], r, Q)); }
    for (const cs of pal.tree) for (let k = 0; k < 3; k++) { const t = this._tree(cs, Q, r, false); t.ax = t.ay = 38; sp.trees.push(t); }
    for (const cs of pal.tr2) { const t = this._tree(cs, Q, r, true); t.ax = t.ay = 48; sp.big = sp.big || []; sp.big.push(t); }
    for (const c1 of ['#c8392e', '#2f6fb0', '#2f8a4a', '#d8a020']) { const s = this._stall(c1, Q, r); s.ax = 30; s.ay = 28; sp.stall.push(s); }
    // ---------- layout
    this._items = []; const items = this._items;
    // river
    const rx0 = W * (0.3 + 0.4 * r()), ph = r() * 6; this._river = [];
    for (let y = -40; y <= H + 40; y += 24) this._river.push([rx0 + Math.sin(y / 190 + ph) * W * 0.07 + (env.fbm(y / 120, 3, seed + 4, 3) - 0.5) * 90, y, 26 + 12 * env.fbm(y / 90, 8, seed + 5, 2)]);
    for (const p of this._river) markC(occ, p[0], p[1], p[2] / 2 + 12);
    // villages
    const nv = cl(Math.round(W * H / 480000 * (+P.villages || 1)), 1, 7), V = this._vill = [];
    for (let a = 0; a < 600 && V.length < nv; a++) { const x = 150 + r() * (W - 300), y = 150 + r() * (H - 300); if (this._wdist(x, y) < 140 || V.some(v => Math.hypot(v.x - x, v.y - y) < 380)) continue; V.push({ x, y, n: 9 + ((r() * 6) | 0) + (V.length === 0 ? 4 : 0) }); }
    if (!V.length) V.push({ x: W * 0.3, y: H * 0.5, n: 10 });
    // background crop fields
    const fields = [], types = ['wheat', 'wheat', 'wheat', 'rape', 'plow', 'plow', 'veg', 'hay', 'hay', 'pasture', 'orch'];
    for (let a = 0; a < 260 && fields.length < Math.floor(W * H / 62000); a++) {
      const w = 140 + r() * 200, h = 100 + r() * 140, x = -30 + r() * (W - 60), y = -30 + r() * (H - 60);
      if (V.some(v => { const dx = Math.max(x - v.x, 0, v.x - (x + w)), dy = Math.max(y - v.y, 0, v.y - (y + h)); return Math.hypot(dx, dy) < 235; })) continue;
      let bad = false; for (let i = 0; i <= 4 && !bad; i++) for (let j = 0; j <= 3; j++) if (this._wdist(x + w * i / 4, y + h * j / 3) < 52) { bad = true; break; }
      if (bad || fields.some(f => x < f.x + f.w + 14 && f.x < x + w + 14 && y < f.y + f.h + 14 && f.y < y + h + 14)) continue;
      fields.push({ x, y, w, h, type: types[(r() * types.length) | 0], ang: [0, Math.PI / 2, 0.22, -0.22, Math.PI / 2 + 0.2][(r() * 5) | 0], fence: r() < 0.65 });
    }
    // roads: minimum spanning tree between the villages plus a few roads that leave the screen
    const edges = [], inT = [0], rest = V.map((_, i) => i).slice(1);
    while (rest.length) { let best = null; for (const i of inT) for (const j of rest) { const d = Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y); if (!best || d < best.d) best = { i, j, d }; } edges.push([best.i, best.j]); inT.push(best.j); rest.splice(rest.indexOf(best.j), 1); }
    if (V.length > 3) edges.push([0, V.length - 1]);
    const mkRoad = (a, b, jit) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, j = (r() - 0.5) * L * jit, mx = (a.x + b.x) / 2 - dy / L * j, my = (a.y + b.y) / 2 + dx / L * j, pts = []; const n = Math.max(12, Math.round(L / 12)); for (let i = 0; i <= n; i++) { const u = i / n; pts.push([(1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * mx + u * u * b.x, (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * my + u * u * b.y]); } return pts; };
    const roads = this._roads = [];
    for (const [i, j] of edges) roads.push({ pts: mkRoad(V[i], V[j], 0.5) });
    for (const v of V) if (r() < 0.8) { const side = r(), tx = side < 0.25 ? -80 : side < 0.5 ? W + 80 : r() * W, ty = side < 0.25 || side < 0.5 ? r() * H : (r() < 0.5 ? -80 : H + 80); roads.push({ pts: mkRoad(v, { x: tx, y: ty }, 0.4) }); }
    for (const rd2 of roads) { let acc = 0; rd2.len = rd2.pts.map((p, i) => i ? (acc += Math.hypot(p[0] - rd2.pts[i - 1][0], p[1] - rd2.pts[i - 1][1])) : 0); rd2.total = acc; for (let i = 0; i < rd2.pts.length - 1; i++) { const a = rd2.pts[i], b2 = rd2.pts[i + 1], n = Math.ceil(Math.hypot(b2[0] - a[0], b2[1] - a[1]) / 5); for (let k = 0; k <= n; k++) markC(rd, a[0] + (b2[0] - a[0]) * k / n, a[1] + (b2[1] - a[1]) * k / n, 13); } }
    // village contents
    const overlaps = (x, y, w, h, m) => items.some(it => it.fw && Math.abs(x - it.x) < (w + it.fw) / 2 + m && Math.abs(y - it.y) < (h + it.fh) / 2 + m);
    const dirt = [];
    V.forEach((v, vi) => {
      markC(rd, v.x, v.y, 66); dirt.push([v.x, v.y]);
      items.push({ k: 'well', x: v.x, y: v.y, rad: 20, sp: sp.well });
      const ns = 5 + ((r() * 3) | 0); for (let i = 0; i < ns; i++) { const a = i / ns * 6.28 + r() * 0.3; items.push({ k: 'stall', x: v.x + Math.cos(a) * 38, y: v.y + Math.sin(a) * 36, rad: 24, sp: sp.stall[(r() * 4) | 0] }); }
      if (!items.some(i => i.k === 'church') && (vi === V.length - 1 || r() < 0.5)) for (let a = 0; a < 120; a++) { const ang = r() * 6.283, x = v.x + Math.cos(ang) * (210 + r() * 50), y = v.y + Math.sin(ang) * (180 + r() * 40); if (x < 130 || y < 120 || x > W - 130 || y > H - 110 || this._wdist(x, y) < 130 || overlaps(x, y, 235, 195, 20)) continue; items.push({ k: 'church', x, y, rad: 130, fw: 235, fh: 195, sp: sp.church, door: [x, y + 100] }); markR(occ, x - 118, y - 98, x + 118, y + 98); break; }
      let placed = 0;
      for (let a = 0; a < 500 && placed < v.n; a++) {
        const ang = r() * 6.283, rad = 90 + r() * (70 + v.n * 7), x = v.x + Math.cos(ang) * rad * 1.15, y = v.y + Math.sin(ang) * rad * 0.9, hs = sp.houses[(r() * sp.houses.length) | 0];
        if (x < 40 || y < 40 || x > W - 40 || y > H - 50 || this._wdist(x, y) < 40 + hs.fw / 2 || overlaps(x, y, hs.fw, hs.fh, 12) || Math.hypot(x - v.x, y - v.y) < 70 + Math.max(hs.fw, hs.fh) * 0.4) continue;
        let onRoad = false; for (let q = -1; q <= 1; q++) for (let w2 = -1; w2 <= 1; w2++) if (rd[Math.floor((y + q * hs.fh / 2) / gc) * gw + Math.floor((x + w2 * hs.fw / 2) / gc)] && Math.hypot(x - v.x, y - v.y) > 100) onRoad = true; if (onRoad) continue;
        items.push({ k: 'house', x, y, rad: Math.max(hs.fw, hs.fh) * 0.6, fw: hs.fw, fh: hs.fh, sp: hs, door: [x, y + hs.fh / 2 + 4], v }); placed++; markR(occ, x - hs.fw / 2 - 3, y - hs.fh / 2 - 3, x + hs.fw / 2 + 3, y + hs.fh / 2 + 10);
        if (r() < 0.45) { const gx = x + (r() < 0.5 ? -1 : 1) * (hs.fw / 2 + 32), gy = y + (r() - 0.3) * 10; if (gx > 40 && gx < W - 40 && !overlaps(gx, gy, 52, 40, 6) && this._wdist(gx, gy) > 40) { items.push({ k: 'garden', x: gx, y: gy, rad: 30, fw: 52, fh: 40 }); markR(occ, gx - 28, gy - 22, gx + 28, gy + 22); } }
        if (r() < 0.35) { const bx = x + (r() - 0.5) * hs.fw, by = y + hs.fh / 2 + 16; items.push({ k: 'barrel', x: bx, y: by, rad: 10, sp: sp.barrel }); }
      }
    });
    // windmill and watermill
    for (let a = 0; a < 200; a++) { const v = V[(r() * V.length) | 0], ang = r() * 6.283, x = v.x + Math.cos(ang) * (250 + r() * 70), y = v.y + Math.sin(ang) * (210 + r() * 60); if (x < 70 || y < 90 || x > W - 70 || y > H - 60 || this._wdist(x, y) < 80 || fields.some(f => x > f.x - 40 && x < f.x + f.w + 40 && y > f.y - 40 && y < f.y + f.h + 40) || overlaps(x, y, 70, 70, 10)) continue; items.push({ k: 'windmill', x, y, rad: 46, fw: 70, fh: 70 }); markC(occ, x, y, 42); break; }
    for (let a = 0; a < 80; a++) { const i = 3 + ((r() * (this._river.length - 6)) | 0), p = this._river[i], side = r() < 0.5 ? 1 : -1, hs = sp.houses.find(h => !h.ch === false && h.fw > 60) || sp.houses[0], x = p[0] + side * (p[2] / 2 + hs.fw / 2 + 16), y = p[1]; if (x < 60 || x > W - 60 || y < 70 || y > H - 70 || overlaps(x, y, hs.fw, hs.fh, 14) || isOcc(x + side * 20, y, 22) && false) continue; if (V.some(v => Math.hypot(v.x - x, v.y - y) < 120)) continue; items.push({ k: 'house', x, y, rad: hs.fw * 0.6, fw: hs.fw, fh: hs.fh, sp: hs, mill: side }); markR(occ, x - hs.fw / 2 - 4, y - hs.fh / 2 - 4, x + hs.fw / 2 + 4, y + hs.fh / 2 + 10); break; }
    // field extras: hay stacks, orchard trees, pasture fences block the animals leaving
    for (const f of fields) {
      if (f.type === 'orch') { for (let x = f.x + 20; x < f.x + f.w - 10; x += 36) for (let y = f.y + 20; y < f.y + f.h - 10; y += 36) { const t = sp.trees[(r() * sp.trees.length) | 0]; items.push({ k: 'tree', x: x + (r() - 0.5) * 6, y: y + (r() - 0.5) * 6, rad: 14, sp: t, s: 0.62 }); } markR(occ, f.x, f.y, f.x + f.w, f.y + f.h); }
      else if (f.type === 'pasture') { const m = (a, b, c2, d) => markR(occ, a, b, c2, d); m(f.x - 4, f.y - 4, f.x + f.w + 4, f.y + 6); m(f.x - 4, f.y + f.h - 6, f.x + f.w + 4, f.y + f.h + 4); m(f.x - 4, f.y - 4, f.x + 6, f.y + f.h + 4); m(f.x + f.w - 6, f.y - 4, f.x + f.w + 4, f.y + f.h + 4); }
      else markR(occ, f.x - 4, f.y - 4, f.x + f.w + 4, f.y + f.h + 4);
      if (f.type === 'hay') for (let i = 0; i < 2 + ((r() * 3) | 0); i++) items.push({ k: 'hay', x: f.x + 24 + r() * (f.w - 48), y: f.y + 24 + r() * (f.h - 48), rad: 16, sp: sp.hay });
    }
    // trees: groves, hedgerows along the river and single trees
    const addTree = (x, y, big) => { const t = big && sp.big ? sp.big[0] : sp.trees[(r() * sp.trees.length) | 0], s = big ? 0.8 + r() * 0.3 : 0.7 + r() * 0.55; items.push({ k: 'tree', x, y, rad: 18 * s, sp: t, s }); markC(occ, x, y, 9 * s); };
    for (let i = 0; i < this._river.length; i++) { const p = this._river[i]; for (const side of [-1, 1]) if (r() < 0.45) { const x = p[0] + side * (p[2] / 2 + 14 + r() * 12), y = p[1] + (r() - 0.5) * 20; if (!isOcc(x, y, 8)) addTree(x, y, r() < 0.4); } }
    for (let a = 0; a < W * H / 1700; a++) { const x = r() * W, y = r() * H, n = env.fbm(x / 210, y / 210, seed + 9, 3); if ((n < 0.52 && r() > 0.05) || isOcc(x, y, 10) || this._wdist(x, y) < 30) continue; addTree(x, y, r() < 0.3); }
    for (let a = 0; a < W * H / 9000; a++) { const x = r() * W, y = r() * H, ok = !isOcc(x, y, 18) && this._wdist(x, y) > 40; if (ok && V.some(v => Math.hypot(v.x - x, v.y - y) < 330)) { items.push({ k: 'bush', x, y, rad: 12, sp: sp.bush }); markC(occ, x, y, 7); } }
    items.sort((a, b) => (a.y + (a.fh || 0) / 2) - (b.y + (b.fh || 0) / 2));
    // ---------- terrain
    const b = this._terr.getContext('2d'); b.setTransform(S, 0, 0, S, 0, 0);
    { const sc = 3, lw = Math.ceil(W / sc) + 2, lh = Math.ceil(H / sc) + 2, c = this._mkc(lw, lh), g = c.getContext('2d'), im = g.createImageData(lw, lh), u = new Uint32Array(im.data.buffer);
      for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { const x = i * sc, y = j * sc, n = env.fbm(x / 150, y / 150, seed + 1, 4), m = env.fbm(x / 30, y / 30, seed + 2, 2), t = cl(n * 1.5 - 0.3 + (m - 0.5) * 0.45, 0, 1), sh = 0.94 + (env.hash(i, j, seed) - 0.5) * 0.08; u[j * lw + i] = 255 << 24 | Math.min(255, (pal.g1[2] + (pal.g2[2] - pal.g1[2]) * t) * sh) << 16 | Math.min(255, (pal.g1[1] + (pal.g2[1] - pal.g1[1]) * t) * sh) << 8 | Math.min(255, (pal.g1[0] + (pal.g2[0] - pal.g1[0]) * t) * sh); }
      g.putImageData(im, 0, 0); b.imageSmoothingEnabled = true; b.drawImage(c, 0, 0, lw * sc, lh * sc); }
    for (const f of fields) {
      if (f.type === 'orch') { b.fillStyle = 'rgba(40,90,30,0.18)'; b.fillRect(f.x, f.y, f.w, f.h); }
      else if (f.type === 'pasture') { b.fillStyle = 'rgba(255,255,255,0.06)'; b.fillRect(f.x, f.y, f.w, f.h); }
      else this._crop(b, f.type, f.x, f.y, f.w, f.h, f.ang, r, pal, season);
      if (f.fence || f.type === 'pasture') this._fence(b, [[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]], true);
    }
    const stroke = (pts, w, col, a) => { b.globalAlpha = a == null ? 1 : a; b.strokeStyle = col; b.lineWidth = w; b.beginPath(); pts.forEach((p, i) => i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1])); b.stroke(); b.globalAlpha = 1; };
    b.lineCap = 'round'; b.lineJoin = 'round';
    // door yards and paths to the village squares
    for (const it of items) { if (it.k !== 'house' || !it.v) continue; const v = it.v, d = Math.hypot(it.door[0] - v.x, it.door[1] - v.y); if (d < 150) { const tx = v.x + (it.door[0] - v.x) / d * 66, ty = v.y + (it.door[1] - v.y) / d * 66; stroke([it.door, [(it.door[0] + tx) / 2, (it.door[1] + ty) / 2 + 4], [tx, ty]], 6, '#b08a58', 0.7); } b.fillStyle = '#b79562'; b.beginPath(); b.ellipse(it.door[0], it.door[1] + 4, it.fw * 0.42, 9, 0, 0, 7); b.fill(); }
    for (const it of items) if (it.k === 'church') { stroke([it.door, [it.door[0], it.door[1] + 40]], 12, '#b08a58', 0.95); }
    for (const v of V) { const gr = b.createRadialGradient(v.x, v.y, 10, v.x, v.y, 70); gr.addColorStop(0, '#d2b27a'); gr.addColorStop(0.8, '#c4a068'); gr.addColorStop(1, 'rgba(176,138,88,0)'); b.fillStyle = gr; b.beginPath(); b.arc(v.x, v.y, 72, 0, 7); b.fill(); b.strokeStyle = 'rgba(120,86,44,0.3)'; b.lineWidth = 2; b.beginPath(); b.arc(v.x, v.y, 58, 0, 7); b.stroke(); for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = r() * 62; b.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.3)' : 'rgba(90,60,30,0.25)'; b.fillRect(v.x + Math.cos(a) * d, v.y + Math.sin(a) * d, 2, 1.6); } }
    for (const rr of roads) { stroke(rr.pts, 24, '#8e6e44', 0.38); stroke(rr.pts, 19, '#b9955f'); stroke(rr.pts, 11, '#c9a874', 0.8); b.setLineDash([2, 5]); stroke(rr.pts.map(p => [p[0], p[1] - 4]), 1.2, 'rgba(90,60,30,0.35)'); stroke(rr.pts.map(p => [p[0], p[1] + 4]), 1.2, 'rgba(90,60,30,0.35)'); b.setLineDash([]); }
    // river
    const R2 = this._river, rv = (w, col, a) => { b.globalAlpha = a == null ? 1 : a; b.fillStyle = col; b.beginPath(); R2.forEach(p => b.lineTo(p[0] - p[2] / 2 - w, p[1])); for (let i = R2.length - 1; i >= 0; i--) b.lineTo(R2[i][0] + R2[i][2] / 2 + w, R2[i][1]); b.closePath(); b.fill(); b.globalAlpha = 1; };
    rv(9, '#7c6a42', 0.5); rv(5, '#9a8a58'); rv(2, '#4a7ea8'); rv(-4, '#5f9bc8'); rv(-10, '#78b0d8', 0.6);
    b.globalAlpha = 0.5; for (let i = 0; i < R2.length; i++) for (let k = 0; k < 3; k++) { const p = R2[i]; if (r() < 0.5) continue; b.fillStyle = '#fff'; b.beginPath(); b.ellipse(p[0] + (r() - 0.5) * p[2] * 0.8, p[1] + (r() - 0.5) * 20, 5 + r() * 6, 1.1, 1.57, 0, 7); b.fill(); } b.globalAlpha = 1;
    for (let i = 0; i < R2.length; i++) for (const side of [-1, 1]) if (r() < 0.6) { const p = R2[i]; b.fillStyle = ['#8a8680', '#a09a90', '#76726a'][(r() * 3) | 0]; b.beginPath(); b.ellipse(p[0] + side * (p[2] / 2 + 2 + r() * 3), p[1] + (r() - 0.5) * 20, 2.5 + r() * 2.5, 2 + r() * 2, 0, 0, 7); b.fill(); }
    // bridges where a road crosses the water
    for (const rr of roads) {
      let run = null; for (let i = 0; i < rr.pts.length; i++) { const p = rr.pts[i], inW = this._wdist(p[0], p[1]) < 2; if (inW && !run) run = { a: i }; if (run && (!inW || i === rr.pts.length - 1)) { run.b = i; const pa = rr.pts[run.a], pb = rr.pts[run.b], cx = (pa[0] + pb[0]) / 2, cy = (pa[1] + pb[1]) / 2, ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) + 44;
        b.save(); b.translate(cx, cy); b.rotate(ang); b.fillStyle = 'rgba(10,20,30,0.3)'; b.fillRect(-L / 2 + 4, -13 + 6, L, 30); b.fillStyle = '#a9a496'; b.beginPath(); b.roundRect(-L / 2, -14, L, 28, 4); b.fill(); b.fillStyle = '#c4a874'; b.fillRect(-L / 2 + 6, -9, L - 12, 18); b.fillStyle = '#8c887c'; b.fillRect(-L / 2, -14, L, 5); b.fillRect(-L / 2, 9, L, 5); b.strokeStyle = 'rgba(0,0,0,0.3)'; b.lineWidth = 1; for (let q = -L / 2 + 8; q < L / 2; q += 9) { b.beginPath(); b.moveTo(q, -14); b.lineTo(q, -9); b.moveTo(q, 9); b.lineTo(q, 14); b.stroke(); } b.fillStyle = 'rgba(255,255,255,0.25)'; b.fillRect(-L / 2, -14, L, 1.4); b.restore(); run = null; } }
    }
    // ---------- patchwork of crops for the fields around the icons
    const ft = this._ftex = this._mkc(cw, ch), fg = ft.getContext('2d'); fg.scale(S, S);
    const ftypes = ['wheat', 'wheat', 'rape', 'plow', 'veg', 'hay', 'wheat', 'plow'], cs = 250;
    for (let y = 0; y < H + cs; y += cs) for (let x = 0; x < W + cs; x += cs) this._crop(fg, ftypes[(r() * ftypes.length) | 0], x - 1, y - 1, cs + 2, cs + 2, [0, Math.PI / 2, 0.25, -0.2][(r() * 4) | 0], r, pal, season);
    this._carts = []; this._herd = new Fauna.Herd();
    const nc = Math.round((+P.life || 0) * Math.min(7, 1 + roads.length * 0.8));
    for (let i = 0; i < nc; i++) { const ro = roads[i % roads.length]; this._carts.push({ road: ro, s: r() * ro.total, dir: r() < 0.5 ? 1 : -1, v: 24 + r() * 14, load: (r() * 4) | 0, h: Fauna.make('horse', 0, 0), a: 1 }); }
  },

  // ---------- composition (cached until the icons change)
  _compose(env) {
    const { S } = env, Z = this._Z, o = this._comp.getContext('2d'), R = this.R;
    Z.update(env.icons); this._smk = []; this._anim = [];
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(this._terr, 0, 0); o.setTransform(S, 0, 0, S, 0, 0);
    for (const it of this._items) {
      if (Z.ds(it.x, it.y) - it.rad < R + 10) continue;
      if (it.k === 'garden') { this._gardenDraw(o, it); continue; }
      const sp = it.sp || this._sp.church, s = it.s || 1;
      if (it.k === 'church') { o.drawImage(sp.img, it.x - sp.ax * 1.3, it.y - sp.ay * 1.3, sp.w * 1.3, sp.h * 1.3); continue; }
      if (it.k === 'windmill') { this._windDraw(o, it); this._anim.push(it); continue; }
      o.drawImage(sp.img, it.x - sp.ax * s, it.y - sp.ay * s, sp.w * s, sp.h * s);
      if (it.mill) { const wx = it.x - it.mill * (it.fw / 2 + 4); o.fillStyle = '#5a3c20'; o.fillRect(wx - 5, it.y - 16, 10, 32); o.fillStyle = '#8a6238'; for (let q = -14; q <= 14; q += 4) o.fillRect(wx - 6, it.y + q, 12, 2); }
      if (it.k === 'house' && sp.ch) this._smk.push({ x: it.x - sp.ax + sp.ch.x, y: it.y - sp.ay + sp.ch.y });
    }
    // fenced fields around the icons
    const lines = Z.lines(); o.lineCap = 'round'; o.lineJoin = 'round';
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(120,86,44,0.55)'; o.lineWidth = 30; o.stroke(); }
    Z.paint(o, this._ftex, this._tmp, S); o.setTransform(S, 0, 0, S, 0, 0);
    for (const line of lines) if (line.length > 2) this._fence(o, line, false);
    o.setTransform(1, 0, 0, 1, 0, 0);
    this._comps = Z.components(k => Z.Ds[k] < R - 16 && Z.Dm[k] > 16);
  },
  _gardenDraw(o, it) { o.save(); o.translate(it.x - 26, it.y - 20); this._crop(o, 'veg', 0, 0, 52, 40, 0, () => 0.5, this._pal(this._season || 0), 0); o.restore(); this._fence(o, [[it.x - 26, it.y - 20], [it.x + 26, it.y - 20], [it.x + 26, it.y + 20], [it.x - 26, it.y + 20]], true); },
  _windDraw(o, it) {
    const x = it.x, y = it.y; o.save(); o.translate(x, y); o.fillStyle = 'rgba(14,24,6,0.3)'; o.beginPath(); o.ellipse(14, 14, 24, 18, 0, 0, 7); o.fill();
    let g = o.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, '#d8d2c0'); g.addColorStop(1, '#8a8474'); o.fillStyle = g; o.beginPath(); o.moveTo(-18, 14); o.lineTo(-12, -22); o.lineTo(12, -22); o.lineTo(18, 14); o.closePath(); o.fill();
    o.fillStyle = '#4a3220'; o.fillRect(-4, 2, 8, 12); o.fillStyle = '#7a4a34'; o.beginPath(); o.ellipse(0, -22, 14, 8, 0, 0, 7); o.fill(); o.fillStyle = '#9a6244'; o.beginPath(); o.ellipse(0, -24, 11, 6, 0, 0, 7); o.fill(); o.restore();
  },
  _windBlades(c, it, t) {
    c.save(); c.translate(it.x, it.y - 24); c.rotate(t * 0.5);
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); c.fillStyle = 'rgba(14,24,6,0.2)'; c.fillRect(3, -62, 15, 62); c.fillStyle = '#6a4a2c'; c.fillRect(-1.8, -64, 3.6, 64); c.fillStyle = '#e8dcc0'; c.fillRect(1.8, -62, 14, 40); c.strokeStyle = '#8a6a40'; c.lineWidth = 0.9; for (let j = 0; j < 6; j++) { c.beginPath(); c.moveTo(1.8, -62 + j * 6.7); c.lineTo(15.8, -62 + j * 6.7); c.stroke(); } c.restore(); }
    c.fillStyle = '#3a2814'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill(); c.restore();
  },

  // ---------- where animals and people may go
  _cell(x, y) { const i = Math.floor(x / 10), j = Math.floor(y / 10); return i < 0 || j < 0 || i >= this._gw || j >= this._gh ? -1 : j * this._gw + i; },
  _edge(env, x, y) { const cl = env.clamp; return cl((x + 6) / 24, 0, 1) * cl((env.W + 6 - x) / 24, 0, 1) * cl((y + 6) / 24, 0, 1) * cl((env.H + 6 - y) / 24, 0, 1); },
  _openIn(env, x, y) { const Z = this._Z, cl = env.clamp; return cl((this.R - 14 - Z.ds(x, y)) / 8, 0, 1) * cl((Z.dm(x, y) - 12) / 8, 0, 1); },
  _openRoad(env, x, y) { const k = this._cell(x, y); if (k < 0 || !this._rd[k]) return 0; return env.clamp((this._Z.ds(x, y) - this.R - 8) / 12, 0, 1) * this._edge(env, x, y); },
  _openMeadow(env, x, y) { const k = this._cell(x, y); if (k < 0 || this._occ[k] || this._rd[k]) return 0; return env.clamp((this._Z.ds(x, y) - this.R - 14) / 14, 0, 1) * this._edge(env, x, y); },
  _pickWhere(fn) { for (let k = 0; k < 80; k++) { const x = Math.random() * this._W, y = Math.random() * this._H; if (fn(x, y) > 0.9) return { x, y }; } return null; },
  _pickIn(env) { const cs = this._comps || []; let tot = 0; for (const q of cs) tot += q.cells.length; if (!tot) return null; let k = Math.random() * tot; for (const q of cs) { if (k < q.cells.length) return this._Z.cellPoint(q.cells[Math.floor(k)]); k -= q.cells.length; } return null; },
  _balance(env) {
    const P = env.P, n = env.icons.length, life = +P.life || 0, h = this._herd, nv = this._vill.length, area = env.W * env.H / 500000;
    const keep = (grp, kind, want, pick) => { const live = h.list.filter(a => a.grp === grp && a.kind === kind && !a.leaving); if (live.length < want) { const p = pick(); if (p) { const a = h.add(kind, p.x, p.y, true); a.grp = grp; a.size *= 1.3; } } else if (live.length > want) live[Math.floor(Math.random() * live.length)].leaving = true; };
    keep('in', 'adult', n ? Math.round(life * Math.min(6, 1 + n * 0.35)) : 0, () => this._pickIn(env));
    keep('in', 'kid', n && life > 0.5 ? Math.round(life * Math.min(2, n * 0.15)) : 0, () => this._pickIn(env));
    const rp = () => this._pickWhere((x, y) => this._openRoad(env, x, y));
    keep('rd', 'adult', Math.round(life * nv * 3), rp); keep('rd', 'kid', Math.round(life * nv * 1), rp);
    const mp = () => this._pickWhere((x, y) => this._openMeadow(env, x, y));
    keep('md', 'cow', Math.round(life * area * 5), mp); keep('md', 'horse', Math.round(life * area * 2), mp); keep('md', 'boar', Math.round(life * area * 2), mp);
  },
  _cartAt(c) { const ro = c.road, s = Math.max(0, Math.min(ro.total, c.s)); let i = 1; while (i < ro.len.length - 1 && ro.len[i] < s) i++; const a = ro.pts[i - 1], b = ro.pts[i], u = (s - ro.len[i - 1]) / Math.max(1e-6, ro.len[i] - ro.len[i - 1]); return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; },
  _drawCart(c, cart, p, al) {
    const ang = p.ang + (cart.dir < 0 ? Math.PI : 0), h = cart.h; h.x = p.x; h.y = p.y; h.ang = ang; h.a = al; h.size = 36 * 1.55 * 1.25;
    c.save(); c.translate(p.x, p.y); c.rotate(ang); c.scale(1.25, 1.25); c.globalAlpha = al;
    c.fillStyle = 'rgba(14,24,6,0.3)'; c.beginPath(); c.roundRect(-86, -9, 52, 28, 4); c.fill();
    c.strokeStyle = '#6a4a2c'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-20, -6); c.lineTo(-52, -9); c.moveTo(-20, 6); c.lineTo(-52, 9); c.stroke();
    c.fillStyle = '#2a1c10'; c.fillRect(-78, -17, 20, 4); c.fillRect(-78, 13, 20, 4);
    c.fillStyle = '#8a5a34'; c.beginPath(); c.roundRect(-92, -12, 46, 24, 3); c.fill(); c.strokeStyle = 'rgba(40,20,0,0.4)'; c.lineWidth = 1; for (let i = -9; i < 12; i += 5) { c.beginPath(); c.moveTo(-92, i); c.lineTo(-46, i); c.stroke(); }
    c.strokeStyle = '#5a3c20'; c.lineWidth = 2.4; c.strokeRect(-92, -12, 46, 24);
    if (cart.load === 0) { c.fillStyle = '#e0c060'; for (const [x, y, rr] of [[-78, -3, 9], [-66, 3, 9], [-56, -3, 8], [-70, -5, 7]]) { c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); } c.fillStyle = 'rgba(120,80,20,0.3)'; c.fillRect(-84, -2, 30, 1.5); }
    else if (cart.load === 1) for (const [x, y] of [[-80, -5], [-68, -5], [-80, 6], [-68, 6], [-56, 0]]) { c.fillStyle = '#6a4224'; c.beginPath(); c.arc(x, y, 5.6, 0, 7); c.fill(); c.fillStyle = '#a8784a'; c.beginPath(); c.arc(x, y, 3.4, 0, 7); c.fill(); }
    else if (cart.load === 2) for (const [x, y] of [[-82, -5], [-70, -4], [-58, -5], [-76, 5], [-62, 5]]) { c.fillStyle = '#d8ccae'; c.beginPath(); c.ellipse(x, y, 7, 4.4, 0.2, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.8; c.stroke(); }
    c.restore(); Fauna.drawOne(c, h, performance.now() / 1000);
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z; this._W = W; this._H = H; this._season = P.season | 0;
    if (this._key !== (P.season | 0) + ':' + P.villages || !this._terr) this.rebuild(env);
    const sig = Z.signature(env.icons);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); this._bal = 0; }
    this._bal -= dt; if (this._bal <= 0 && this._sig) { this._bal = 1.5; this._balance(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0);
    // flowing water
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    for (let i = 3; i < this._river.length - 1; i += 2) { const p = this._river[i], f = (t * 0.25 + i * 0.37) % 1, y = p[1] - 24 + f * 48, off = Math.sin(i * 1.7) * p[2] * 0.25; ctx.globalAlpha = Math.sin(f * 3.14) * 0.7; ctx.beginPath(); ctx.moveTo(p[0] + off - 4, y); ctx.lineTo(p[0] + off + 4, y + 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // herds: farmers in the fields, villagers on the roads, animals in the meadows
    const h = this._herd, op = (a, x, y) => a.grp === 'in' ? this._openIn(env, x, y) : a.grp === 'rd' ? this._openRoad(env, x, y) : this._openMeadow(env, x, y);
    for (const a of h.list) { a.fn = a.fn || ((x, y) => op(a, x, y)); }
    // Herd.step takes one open() for all; call per group
    for (const grp of ['in', 'rd', 'md']) { const sub = new Fauna.Herd(); sub.list = h.list.filter(a => a.grp === grp); sub.step(dt, t, (x, y) => op({ grp }, x, y), () => grp === 'in' ? this._pickIn(env) : this._pickWhere((x, y) => op({ grp }, x, y))); }
    h.list = h.list.filter(a => !(a.leaving && a.a < 0.03));
    // carts
    for (const c of this._carts) {
      c.s += c.dir * c.v * dt; if (c.s > c.road.total + 90) c.dir = -1; else if (c.s < -90) c.dir = 1; const p = this._cartAt(c);
      c.h.v = c.v; c.h.ph += c.v * dt * 0.34; const al = env.clamp((Z.ds(p.x, p.y) - this.R - 4) / 24, 0, 1) * this._edge(env, p.x, p.y) * (c.s < 0 || c.s > c.road.total ? 0 : 1); c.a += (al - c.a) * Math.min(1, dt * 6);
      if (c.a > 0.03) this._drawCart(ctx, c, p, c.a);
    }
    h.draw(ctx, t);
    for (const it of this._anim) this._windBlades(ctx, it, t);
    // chimney smoke
    for (const s of this._smk) for (let k = 0; k < 3; k++) { const f = (t * 0.2 + k / 3 + s.x * 0.013) % 1; ctx.globalAlpha = (1 - f) * 0.4; ctx.fillStyle = '#f2efe8'; ctx.beginPath(); ctx.arc(s.x + f * 14 + Math.sin(f * 7 + s.y) * 2, s.y - f * 20, 2 + f * 6, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  },
});
