// Thema "Lotus": bovenaanzicht van een donkergroene vijver.
// Iconen liggen op grote waterlelieblaadjes, koi zwemt eronder door, bloemen drijven in open water,
// en een verplaatst icoon laat een rimpel achter.
IconIsland.theme({
  params: { koi: 5, bloom: 0.5, ripples: 1 },

  _pads: [], _koi: [], _rip: [], _bg: null, _sprites: [], _flowers: [], _sheen: null,
  _seed: 1, _now: 0, _born: -1, _nextRip: 1,

  init(env, seed) {
    const { W, H } = env, r = env.rng(seed * 7 + 3), u = this._u = Math.max(0.8, Math.min(1.5, H / 1000));
    this._seed = seed; this._rip.length = 0; this._born = -1;
    // open bladeren (sommige met bloem; rank bepaalt bij welke 'bloom' ze verschijnen)
    const n = Math.round(W * H / 42000), pads = [];
    for (let tries = 0; pads.length < n && tries < n * 30; tries++) {
      const rad = (34 + r() * 34) * u, x = r() * W, y = r() * H;
      if (pads.some(p => Math.hypot(p.x - x, p.y - y) < (p.r + rad) * 0.85)) continue;
      pads.push({ x, y, r: rad, rot: r() * 6.28, v: Math.floor(r() * 6), ph: r() * 6.28,
        flower: r() < 0.6 ? Math.floor(r() * 2) : -1, rank: r(), frot: r() * 6.28 });
    }
    this._pads = pads;
    // koi: altijd 12 aanmaken, P.koi bepaalt hoeveel getekend worden
    const koi = [], PAL = ['#f4efe6', '#f07a2b', '#e04a22', '#f6b04a'];
    for (let i = 0; i < 12; i++) {
      const size = (0.85 + r() * 0.5) * u, ang = r() * 6.28, x = r() * W, y = r() * H, sp = 10 * size, seg = [];
      for (let s = 0; s < 10; s++) seg.push({ x: x - Math.cos(ang) * sp * s, y: y - Math.sin(ang) * sp * s });
      const kind = r(), cols = [];
      let cur = kind < 0.25 ? 1 : 0;
      for (let s = 0; s < 10; s++) {
        if (r() < 0.38) cur = kind < 0.25 ? (r() < 0.85 ? 1 : 0) : Math.floor(r() * PAL.length);
        cols.push(kind < 0.2 ? PAL[1 + (s % 3 === 0 ? 1 : 0)] : PAL[cur]);
      }
      if (kind >= 0.2) cols[0] = r() < 0.6 ? PAL[2] : PAL[1];   // hoofd vaak rood/oranje
      const ogon = kind < 0.2, base = ogon ? '#f2b640' : '#f7f1e6', patches = [], nP = ogon ? 0 : 3 + Math.floor(r() * 3), sanke = !ogon && r() < 0.3;
      for (let q = 0; q < nP; q++) patches.push({ f: 0.04 + (q + r() * 0.8) / nP * 0.82, lat: (r() - 0.5) * 1.1, rx: 0.07 + r() * 0.12, ry: 0.35 + r() * 0.4, col: r() < 0.75 ? '#e8501f' : '#f28a2a' });
      if (!ogon && r() < 0.6) patches.unshift({ f: 0.05, lat: 0, rx: 0.1, ry: 0.8, col: '#e8501f' });
      if (sanke) for (let q = 0; q < 3; q++) patches.push({ f: 0.25 + r() * 0.6, lat: (r() - 0.5) * 1.3, rx: 0.025 + r() * 0.03, ry: 0.15 + r() * 0.15, col: '#1d1a1a' });
      koi.push({ seg, ang, sp: 34 + r() * 22, size, cols, base, patches, ogon, seed: r() * 100, ph: r() * 6.28, spc: sp });
    }
    this._koi = koi;
  },

  // one lily pad (256px): irregular wavy outline, narrow slit, branching veins, curled rim, holes and dew. Returns {img, shadow}.
  _padSprite(k) {
    const mkc = () => { const c = document.createElement('canvas'); c.width = c.height = 256; return c; };
    const c = mkc(), g = c.getContext('2d'), sh = mkc(), sg = sh.getContext('2d'), R = 114, cx = 128, cy = 128;
    const rnd = (() => { let a = (k + 1) * 2654435761 >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
    const cols = [['#5fb35e', '#2f7f48', '#9bdc86', '#1f5e3a'], ['#6cb552', '#3a8040', '#aee08a', '#25693a'], ['#4aa879', '#27755a', '#86d6a6', '#1c5a48'], ['#5aa955', '#2f7240', '#a0d885', '#1f5a34'], ['#7bb94e', '#4a8a3a', '#bfe58a', '#2f6a30'], ['#55a06a', '#2c6e4c', '#8ccf9a', '#1d5a3c']][k % 6];
    const gap = 0.07 + rnd() * 0.05, a0 = rnd() * 0.3, p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28, ell = 0.93 + rnd() * 0.06;
    const rad = th => R * (1 + 0.035 * Math.sin(2 * th + p1) + 0.028 * Math.sin(5 * th + p2) + 0.012 * Math.sin(13 * th + p3));
    const outline = ctx => {
      ctx.beginPath(); ctx.moveTo(cx, cy);
      const steps = 120; for (let i = 0; i <= steps; i++) { const th = gap + (Math.PI * 2 - gap * 2) * i / steps, q = rad(th); ctx.lineTo(cx + Math.cos(th) * q, cy + Math.sin(th) * q * ell); }
      ctx.closePath();
    };
    outline(sg); sg.fillStyle = '#000'; sg.fill();
    outline(g);
    const gr = g.createRadialGradient(cx - 22, cy - 26, 6, cx, cy, R * 1.05); gr.addColorStop(0, cols[0]); gr.addColorStop(0.7, cols[1]); gr.addColorStop(1, cols[3]);
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // veins: from the stalk point to the rim, forking once
    for (let i = 0; i < 26; i++) {
      const th = gap + (Math.PI * 2 - gap * 2) * (i + 0.5) / 26, q = rad(th), bend = (rnd() - 0.5) * 0.25;
      const ex = cx + Math.cos(th) * q, ey = cy + Math.sin(th) * q * ell, mx = cx + Math.cos(th + bend) * q * 0.55, my = cy + Math.sin(th + bend) * q * 0.55 * ell;
      g.strokeStyle = 'rgba(20,70,40,0.35)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
      g.strokeStyle = cols[2]; g.globalAlpha = 0.32; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 1, cy - 1); g.quadraticCurveTo(mx + 1, my - 1, ex + 1, ey - 1); g.stroke(); g.globalAlpha = 1;
      if (i % 2 === 0) for (const sg2 of [-1, 1]) { const th2 = th + sg2 * 0.09, fx = cx + Math.cos(th + bend * 0.6) * q * 0.62, fy = cy + Math.sin(th + bend * 0.6) * q * 0.62 * ell; g.strokeStyle = 'rgba(20,70,40,0.25)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(fx, fy); g.lineTo(cx + Math.cos(th2) * q, cy + Math.sin(th2) * q * ell); g.stroke(); }
    }
    // concentric sheen rings and a soft highlight
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, R * 0.45, R * 0.45 * ell, 0, 0, 7); g.stroke();
    const hl = g.createRadialGradient(cx - 40, cy - 46, 4, cx - 40, cy - 46, 70); hl.addColorStop(0, 'rgba(235,255,225,0.28)'); hl.addColorStop(1, 'rgba(235,255,225,0)'); g.fillStyle = hl; g.fillRect(0, 0, 256, 256);
    // ageing: a yellowish-brown patch on the rim of some pads, bites and holes
    if (k % 3 !== 1) { const ba = rnd() * 6.28, bg = g.createRadialGradient(cx + Math.cos(ba) * R * 0.95, cy + Math.sin(ba) * R * 0.95, 4, cx + Math.cos(ba) * R * 0.95, cy + Math.sin(ba) * R * 0.95, 48); bg.addColorStop(0, 'rgba(176,138,60,0.7)'); bg.addColorStop(1, 'rgba(176,138,60,0)'); g.fillStyle = bg; g.fillRect(0, 0, 256, 256); }
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 1 + (k % 3); i++) { const th = rnd() * 6.28, d = R * (0.45 + rnd() * 0.4), x = cx + Math.cos(th) * d, y = cy + Math.sin(th) * d; g.beginPath(); for (let q = 0; q < 9; q++) { const aa = q / 9 * 6.28, rr = 3 + rnd() * 4; g[q ? 'lineTo' : 'moveTo'](x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.8); } g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // curled rim: light on the upper-left half, dark on the lower-right half
    g.lineWidth = 3.2; g.lineCap = 'round';
    for (const [col, from, to] of [['rgba(200,255,190,0.55)', 3.4, 5.2], ['rgba(10,50,30,0.5)', 0.35, 2.3]]) { g.strokeStyle = col; g.beginPath(); for (let i = 0; i <= 60; i++) { const th = from + (to - from) * i / 60, q = rad(th) - 1.5; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(th) * q, cy + Math.sin(th) * q * ell); } g.stroke(); }
    // dew drops
    for (let i = 0; i < 3; i++) { const th = rnd() * 6.28, d = R * (0.2 + rnd() * 0.5), x = cx + Math.cos(th) * d, y = cy + Math.sin(th) * d * ell, r0 = 2.2 + rnd() * 2.2; g.fillStyle = 'rgba(10,50,30,0.35)'; g.beginPath(); g.arc(x + 1, y + 1.4, r0, 0, 7); g.fill(); g.fillStyle = 'rgba(225,250,245,0.55)'; g.beginPath(); g.arc(x, y, r0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r0 * 0.3, y - r0 * 0.3, r0 * 0.35, 0, 7); g.fill(); }
    return { img: c, shadow: sh };
  },

  // lotus flower: pointed, veined petals in four layers, sepals, stamens and a seed pod
  _flowerSprite(v) {
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const g = c.getContext('2d'), cx = 90, cy = 90;
    const pal = v ? ['#fbf3f0', '#fffdf8', '#f6edd2'] : ['#e8588f', '#f6a5c4', '#fde3ec'];     // tip, middle, base
    let seed = v * 7 + 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.fillStyle = 'rgba(0,20,10,0.22)'; g.beginPath(); g.arc(cx + 3, cy + 5, 70, 0, 7); g.fill();
    const petal = (len, wid, rot, shade) => {
      g.save(); g.translate(cx, cy); g.rotate(rot);
      const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, pal[2]); gr.addColorStop(0.45, pal[1]); gr.addColorStop(1, pal[0]);
      g.beginPath(); g.moveTo(len * 0.06, 0); g.bezierCurveTo(len * 0.3, -wid * 1.55, len * 0.78, -wid * 1.15, len, 0); g.bezierCurveTo(len * 0.78, wid * 1.15, len * 0.3, wid * 1.55, len * 0.06, 0); g.closePath();
      g.fillStyle = gr; g.fill(); g.fillStyle = `rgba(60,10,40,${shade})`; g.fill();
      g.strokeStyle = 'rgba(150,50,90,0.35)'; g.lineWidth = 0.7; g.stroke();
      g.strokeStyle = 'rgba(160,60,100,0.3)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(len * 0.1, 0); g.lineTo(len * 0.9, 0); g.moveTo(len * 0.2, 0); g.quadraticCurveTo(len * 0.5, -wid * 0.7, len * 0.82, -wid * 0.28); g.moveTo(len * 0.2, 0); g.quadraticCurveTo(len * 0.5, wid * 0.7, len * 0.82, wid * 0.28); g.stroke();
      g.restore();
    };
    for (const [n, len, wid, rot, shade] of [[10, 80, 15, 0.1, 0.16], [9, 66, 14, 0.45, 0.1], [8, 52, 13, 0.2, 0.06], [6, 38, 11, 0.6, 0.02]]) for (let i = 0; i < n; i++) petal(len * (0.95 + rnd() * 0.1), wid, rot + i * Math.PI * 2 / n + (rnd() - 0.5) * 0.12, shade);
    for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283, d = 16 + (i % 2) * 3; g.strokeStyle = '#e8b830'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); g.stroke(); g.fillStyle = '#f7d24a'; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.7, 0, 7); g.fill(); }
    const pg = g.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 10); pg.addColorStop(0, '#d9e07a'); pg.addColorStop(1, '#9ab04a'); g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
    g.fillStyle = '#5f7a2a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(cx + Math.cos(i * 0.7) * 4.2, cy + Math.sin(i * 0.7) * 4.2, 1, 0, 7); g.fill(); }
    return c;
  },

  rebuild(env) {                                   // statische laag: vijverwater met diepte
    const { W, H, S } = env, c = document.createElement('canvas');
    c.width = env.cv.width; c.height = env.cv.height;
    const g = c.getContext('2d'); g.scale(S, S);
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#103c35'); bg.addColorStop(0.5, '#0d3a30'); bg.addColorStop(1, '#0a2a2a');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const seed = this._seed;
    for (let i = 0; i < 26; i++) {                  // diepe en ondiepe vlekken
      const x = env.hash(i, 1, seed) * W, y = env.hash(i, 2, seed) * H, r = 120 + env.hash(i, 3, seed) * 320, deep = env.hash(i, 4, seed) < 0.55;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, deep ? 'rgba(2,18,22,0.34)' : 'rgba(70,150,120,0.14)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,10,0.4)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    this._bg = c;
    // sprites
    this._sprites = [0, 1, 2, 3, 4, 5].map(k => this._padSprite(k));
    this._flowers = [this._flowerSprite(0), this._flowerSprite(1)];
    const s = document.createElement('canvas'); s.width = s.height = 256;
    const sg = s.getContext('2d'), rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
    rg.addColorStop(0, 'rgba(150,230,200,0.5)'); rg.addColorStop(1, 'rgba(150,230,200,0)');
    sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256); this._sheen = s;
  },

  setting() {},

  iconsChanged(env) {                              // rimpel waar een icoon naartoe verhuist
    if (this._born < 0 || this._now - this._born < 2) { for (const ic of env.icons) { ic._lx = ic.tx; ic._ly = ic.ty; } return; }
    for (const ic of env.icons) {
      if (ic.dying) continue;
      const moved = ic._lx === undefined || Math.hypot(ic.tx - ic._lx, ic.ty - ic._ly) > 8;
      if (moved && this._rip.length < 14) this._rip.push({ x: ic.tx + ic.tw / 2, y: ic.ty + ic.th / 2, t: this._now, R: 120 + Math.max(ic.tw, ic.th), big: 1 });
      ic._lx = ic.tx; ic._ly = ic.ty;
    }
  },

  _updateKoi(env, t, dt) {
    const { W, H } = env, n = Math.min(12, Math.max(0, Math.round(env.P.koi)));
    for (let i = 0; i < n; i++) {
      const k = this._koi[i], h = k.seg[0], u = this._u;
      let turn = (env.noise(k.seed + t * 0.12, i * 3.1, 5) - 0.5) * 2.4;
      for (const ic of env.icons) {                // ontwijk iconen-bladeren
        const cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2, R = Math.max(ic.w, ic.h) * 0.8 + 50 * u, d = Math.hypot(h.x - cx, h.y - cy);
        if (d < R) { const away = Math.atan2(h.y - cy, h.x - cx); turn += (Math.sin(away - k.ang) >= 0 ? 1 : -1) * (1 - d / R) * 3.2 * ic.a; }
      }
      const m = 90 * u;
      if (h.x < m || h.y < m || h.x > W - m || h.y > H - m) {
        const to = Math.atan2(H / 2 - h.y, W / 2 - h.x); turn += (Math.sin(to - k.ang) >= 0 ? 1 : -1) * 1.8;
      }
      k.ang += turn * dt;
      const sp = k.sp * u * (1 + 0.25 * Math.sin(t * 0.7 + k.ph));
      h.x += Math.cos(k.ang) * sp * dt; h.y += Math.sin(k.ang) * sp * dt;
      for (let s = 1; s < 10; s++) {               // volg-de-leider
        const a = k.seg[s - 1], b = k.seg[s], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        b.x = a.x + dx / d * k.spc; b.y = a.y + dy / d * k.spc;
      }
    }
  },

  // smooth centre line through the 10 body points (Catmull-Rom), with tangents and normals
  _spine(p, N) {
    const P = i => p[Math.max(0, Math.min(9, i))], out = [];
    for (let j = 0; j <= N; j++) {
      const f = j / N * 9, i = Math.min(8, Math.floor(f)), u = f - i, A = P(i - 1), B = P(i), C = P(i + 1), D = P(i + 2);
      const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      out.push({ x: cr(A.x, B.x, C.x, D.x), y: cr(A.y, B.y, C.y, D.y), f: j / N });
    }
    for (let j = 0; j <= N; j++) { const a = out[Math.max(0, j - 1)], b = out[Math.min(N, j + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; out[j].tx = dx / d; out[j].ty = dy / d; out[j].nx = -dy / d; out[j].ny = dx / d; }
    return out;
  },
  _drawKoi(ctx, t, env) {
    const n = Math.min(12, Math.max(0, Math.round(env.P.koi))), u = this._u, N = 34;
    const width = (f, sz) => sz * 11.5 * Math.pow(Math.sin(Math.PI * Math.min(1, f * 0.9 + 0.05)), 0.6) * (1 - 0.55 * f);
    const bodyPath = (sp, sz, ox, oy) => { ctx.beginPath(); for (let j = 0; j <= N; j++) { const q = sp[j], w = width(q.f, sz); ctx[j ? 'lineTo' : 'moveTo'](q.x + q.nx * w + ox, q.y + q.ny * w + oy); } for (let j = N; j >= 0; j--) { const q = sp[j], w = width(q.f, sz); ctx.lineTo(q.x - q.nx * w + ox, q.y - q.ny * w + oy); } ctx.closePath(); };
    const spines = [];
    for (let i = 0; i < n; i++) {
      const k = this._koi[i], p = [];
      for (let s = 0; s < 10; s++) {
        const a = k.seg[Math.max(0, s - 1)], b = k.seg[Math.min(9, s + 1)], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1;
        const off = Math.sin(t * 4.2 + k.ph - s * 0.75) * s * 0.55 * k.size * 0.9;
        p.push({ x: k.seg[s].x - dy / d * off, y: k.seg[s].y + dx / d * off });
      }
      spines.push(this._spine(p, N));
    }
    ctx.fillStyle = 'rgba(0,8,8,0.24)';                                    // shadow on the bottom
    for (let i = 0; i < n; i++) { bodyPath(spines[i], this._koi[i].size, 7 * u, 10 * u); ctx.fill(); }
    for (let i = 0; i < n; i++) {
      const k = this._koi[i], sp = spines[i], sz = k.size, tail = sp[N], pre = sp[N - 6], fa = k.ogon ? '#ffd27a' : '#fff1e0';
      const ta = Math.atan2(tail.y - pre.y, tail.x - pre.x), wag = Math.sin(t * 4.2 + k.ph - 8 * 0.75) * 0.32;
      // tail fin: a wide forked fan, flowing with the swimming motion
      { const L = 30 * sz, SPR = 0.75, m = 14, pts = [];
        for (let i = 0; i <= m; i++) { const u2 = i / m * 2 - 1, a = ta + wag * (0.6 + 0.6 * Math.abs(u2)) + u2 * SPR, r2 = L * (0.62 + 0.38 * Math.abs(Math.sin(u2 * 1.45))); pts.push([tail.x + Math.cos(a) * r2, tail.y + Math.sin(a) * r2, a]); }
        const gr = ctx.createLinearGradient(tail.x, tail.y, tail.x + Math.cos(ta + wag) * L, tail.y + Math.sin(ta + wag) * L); gr.addColorStop(0, k.ogon ? 'rgba(244,170,60,0.9)' : 'rgba(255,238,220,0.9)'); gr.addColorStop(1, k.ogon ? 'rgba(255,215,130,0.3)' : 'rgba(255,255,255,0.28)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(tail.x, tail.y); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.6; for (let i = 0; i < pts.length; i += 2) { ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); } }
      // pectoral fins
      const pj = sp[7], sw = Math.sin(t * 2 + k.ph) * 0.25;
      for (const sgn of [-1, 1]) {
        const bx = pj.x + pj.nx * sgn * width(pj.f, sz) * 0.9, by = pj.y + pj.ny * sgn * width(pj.f, sz) * 0.9, ang = Math.atan2(pj.ty, pj.tx) + Math.PI + sgn * (0.85 + sw), L = 13 * sz;
        ctx.fillStyle = k.ogon ? 'rgba(255,200,100,0.6)' : 'rgba(255,240,225,0.6)'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + Math.cos(ang - sgn * 0.5) * L * 0.9, by + Math.sin(ang - sgn * 0.5) * L * 0.9, bx + Math.cos(ang) * L, by + Math.sin(ang) * L); ctx.quadraticCurveTo(bx + Math.cos(ang + sgn * 0.7) * L * 0.5, by + Math.sin(ang + sgn * 0.7) * L * 0.5, bx, by); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * L, by + Math.sin(ang) * L); ctx.stroke();
      }
      // body
      bodyPath(sp, sz, 0, 0); ctx.fillStyle = k.base; ctx.fill();
      ctx.save(); ctx.clip();
      for (const pt of k.patches) {
        const j = Math.max(0, Math.min(N, Math.round(pt.f * N))), q = sp[j], w = width(q.f, sz), cxp = q.x + q.nx * pt.lat * w, cyp = q.y + q.ny * pt.lat * w;
        ctx.fillStyle = pt.col; ctx.beginPath(); ctx.ellipse(cxp, cyp, pt.rx * 90 * sz, pt.ry * w, Math.atan2(q.ty, q.tx), 0, 6.3); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2.6 * sz; ctx.beginPath(); for (let j = 3; j < N - 3; j++) { const q = sp[j], w = width(q.f, sz); ctx[j > 3 ? 'lineTo' : 'moveTo'](q.x - q.nx * w * 0.38, q.y - q.ny * w * 0.38); } ctx.stroke();      // sheen along the back
      ctx.strokeStyle = 'rgba(0,25,15,0.1)'; ctx.lineWidth = 1.8 * sz; ctx.beginPath(); for (let j = 3; j < N - 3; j++) { const q = sp[j], w = width(q.f, sz); ctx[j > 3 ? 'lineTo' : 'moveTo'](q.x + q.nx * w * 0.8, q.y + q.ny * w * 0.8); } ctx.stroke();
      ctx.fillStyle = 'rgba(0,30,20,0.025)'; for (let j = 4; j < N - 2; j += 2) for (let r0 = -1; r0 <= 1; r0++) { const q = sp[j], w = width(q.f, sz); ctx.beginPath(); ctx.arc(q.x + q.nx * w * r0 * 0.55, q.y + q.ny * w * r0 * 0.55, 1.6 * sz, 0, 6.3); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,25,15,0.3)'; ctx.lineWidth = 0.9; bodyPath(sp, sz, 0, 0); ctx.stroke();
      // dorsal fin line
      ctx.strokeStyle = k.ogon ? 'rgba(220,140,40,0.6)' : 'rgba(255,225,200,0.7)'; ctx.lineWidth = 1.5 * sz; ctx.lineCap = 'round'; ctx.beginPath(); for (let j = 11; j < 26; j++) { const q = sp[j]; ctx[j > 11 ? 'lineTo' : 'moveTo'](q.x, q.y); } ctx.stroke();
      // head: eyes, nostrils, barbels
      const h = sp[1], hw = width(h.f, sz), ha = Math.atan2(h.ty, h.tx);
      for (const sgn of [-1, 1]) {
        const ex = h.x + h.nx * sgn * hw * 0.95 + h.tx * 1.5, ey = h.y + h.ny * sgn * hw * 0.95 + h.ty * 1.5;
        ctx.fillStyle = '#17110c'; ctx.beginPath(); ctx.arc(ex, ey, 1.9 * sz, 0, 6.3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(ex - 0.5, ey - 0.6, 0.55 * sz, 0, 6.3); ctx.fill();
        ctx.strokeStyle = k.base; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(sp[0].x + sp[0].nx * sgn * 1.5, sp[0].y + sp[0].ny * sgn * 1.5); ctx.lineTo(sp[0].x + Math.cos(ha + sgn * 0.7) * 6 * sz, sp[0].y + Math.sin(ha + sgn * 0.7) * 6 * sz); ctx.stroke();
      }
    }
  },

  _drawRipples(ctx, t, env) {
    const r = this._rip;
    if (env.P.ripples >= 1) {
      if (t > this._nextRip && r.length < 10) {
        this._nextRip = t + 1.6 + Math.random() * 2.6;
        r.push({ x: Math.random() * env.W, y: Math.random() * env.H, t, R: 40 + Math.random() * 40, big: 0 });
      }
    } else if (!this._ripKeep) { for (let i = r.length - 1; i >= 0; i--) if (!r[i].big) r.splice(i, 1); }
    ctx.lineWidth = 1.5;
    for (let i = r.length - 1; i >= 0; i--) {
      const q = r[i], age = (t - q.t) / (q.big ? 3.2 : 4);
      if (age >= 1) { r.splice(i, 1); continue; }
      if (env.P.ripples < 1 && !q.big) continue;
      for (let j = 0; j < 3; j++) {
        const a = age - j * 0.11; if (a <= 0) continue;
        const rad = q.R * (1 - Math.pow(1 - a, 2));
        ctx.strokeStyle = `rgba(190,240,225,${(1 - a) * (q.big ? 0.34 : 0.22) * (1 - j * 0.28)})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, 6.3); ctx.stroke();
      }
    }
  },

  frame(ctx, t, dt, env) {
    this._now = t; if (this._born < 0) this._born = t;
    const { W, H, P } = env, u = this._u;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(this._bg, 0, 0, W, H);
    // lichtglans die langzaam over het water zweeft
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = W * (0.5 + 0.45 * Math.sin(t * 0.03 + i * 2.1)), y = H * (0.5 + 0.4 * Math.cos(t * 0.025 + i * 1.7)), r = Math.max(W, H) * 0.3;
      ctx.globalAlpha = 0.16; ctx.drawImage(this._sheen, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

    this._updateKoi(env, t, dt);
    this._drawKoi(ctx, t, env);
    ctx.fillStyle = 'rgba(9,40,36,0.26)'; ctx.fillRect(0, 0, W, H);   // waterdiepte over de koi
    this._drawRipples(ctx, t, env);

    // open bladeren (vervagen in de buurt van iconen)
    const SP = this._sprites, FL = this._flowers, list = env.icons;
    const drawPad = (spr, x, y, r, rot, a) => {
      if (a < 0.02) return;
      ctx.globalAlpha = a * 0.34; ctx.save(); ctx.translate(x + r * 0.08, y + r * 0.11); ctx.rotate(rot); ctx.drawImage(spr.shadow, -r * 1.08, -r * 1.08, r * 2.16, r * 2.16); ctx.restore();
      ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(spr.img, -r * 1.08, -r * 1.08, r * 2.16, r * 2.16); ctx.restore();
    };
    const open = [];
    for (const p of this._pads) {
      const bob = Math.sin(t * 0.5 + p.ph), x = p.x + Math.sin(t * 0.07 + p.ph) * 4, y = p.y + Math.cos(t * 0.06 + p.ph) * 4;
      let a = 1;
      if (list.length) a = env.clamp((env.dist(x, y) - p.r * 0.5) / (p.r * 1.0), 0, 1);
      drawPad(SP[p.v], x, y, p.r * (1 + bob * 0.015), p.rot + Math.sin(t * 0.1 + p.ph) * 0.1, a);
      if (p.flower >= 0 && p.rank < P.bloom && a > 0.02) open.push([p, x, y, a, bob]);
    }
    // bladeren onder de iconen
    for (let i = 0; i < list.length; i++) {
      const ic = list[i], cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2, r = (Math.max(ic.w, ic.h) * 0.8 + 6) * (0.9 + 0.1 * ic.a);
      const k = Math.floor(env.hash(Math.round(ic.tx / 4), Math.round(ic.ty / 4), 9) * 6) % 6;
      drawPad(SP[k], cx + Math.sin(t * 0.4 + i) * 1.2, cy + Math.cos(t * 0.35 + i * 1.3) * 1.2, r, 0.6 + k * 1.1 + Math.sin(t * 0.15 + i) * 0.05, ic.a);
    }
    // bloemen
    for (const [p, x, y, a, bob] of open) {
      const r = p.r * 0.62 * (1 + bob * 0.03);
      ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); ctx.rotate(p.frot + Math.sin(t * 0.12 + p.ph) * 0.06);
      ctx.drawImage(FL[p.flower], -r * 1.28, -r * 1.28, r * 2.56, r * 2.56); ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
});
