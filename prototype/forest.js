// Thema "Forest": gouache-bos. Iconen = open plekken in het bladerdak; bomen krimpen en schuiven weg,
// licht valt in de open plek, paddenstoelen groeien aan de rand, vlinders cirkelen om de iconen.
IconIsland.theme({
  params: { density: 0.7, sway: 1, season: 0 },

  _trees: [], _shrooms: [], _leaves: [], _flies: [], _sprites: [], _ground: null, _spot: null,
  _key: '', _wt: 0, _bird: { t0: 5, y: 0.3 },

  SEASONS: [
    { // zomer
      ground: ['#5f8236', '#7a9c42', '#4a6b2c', '#8a7a4a'], base: ['#5d7d34', '#6f9140'],
      pals: [['#1d4727', '#2f6c36', '#4f9443', '#9bd062'], ['#1a4230', '#2b6a44', '#4b9658', '#92cf7a'], ['#24501f', '#3d7a2c', '#68a843', '#b4dc6c']],
      cap: '#c9352b', fly: ['#f6c84a', '#fff6d0'], leaf: ['#a5d764', '#7fbc4a'], leafN: 8,
    },
    { // herfst
      ground: ['#8a7a45', '#a28a4c', '#6e5f33', '#9a6a3a'], base: ['#86723f', '#9a8548'],
      pals: [['#8f2f14', '#c4531c', '#e8872a', '#f7c551'], ['#7a2118', '#b13a24', '#d9623a', '#f2a259'], ['#4a5e22', '#6f8a2c', '#a0b13a', '#d8d060'], ['#9a4a12', '#cf7a1f', '#ecaa36', '#fbdb74']],
      cap: '#c8742a', fly: ['#e8742a', '#ffd98a'], leaf: ['#d9822b', '#b8501c', '#efb23e', '#9b2f1b'], leafN: 28,
    },
    { // lente (roze bloesem)
      ground: ['#8db358', '#a6c86a', '#6f9942', '#b7b07a'], base: ['#86ad52', '#9cc462'],
      pals: [['#b9567d', '#e285aa', '#f5b8d0', '#fff0f6'], ['#c06a8e', '#eb9bb9', '#f8c8da', '#fff6fa'], ['#3a843c', '#62ad4c', '#93d06a', '#c6ee95'], ['#a94a72', '#d878a1', '#f2a9c6', '#ffe6ef']],
      cap: '#e27aa0', fly: ['#ffffff', '#f6b8d0'], leaf: ['#fbd0df', '#ffffff', '#f4a9c4'], leafN: 30,
    },
  ],

  init(env, seed) {
    const r = env.rng(seed + 31), { W, H } = env, cell = 72;
    const trees = [];
    for (let gy = -1; gy <= Math.ceil(H / cell) + 1; gy++) for (let gx = -1; gx <= Math.ceil(W / cell) + 1; gx++) {
      trees.push({ x: (gx + r()) * cell, y: (gy + r()) * cell, r: 44 + r() * 30, v: Math.floor(r() * 12), th: r(), ph: r() * 6.28, s: -1 });
    }
    trees.sort((a, b) => a.y - b.y);
    this._trees = trees;
    this._shrooms = Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, z: 0.8 + r() * 0.6, n: 1 + Math.floor(r() * 3), o: r() * 6 }));
    this._leaves = Array.from({ length: 30 }, () => ({ x: r() * W, y: r() * H, ph: r() * 6.28, z: 3 + r() * 3, c: Math.floor(r() * 4), vy: 20 + r() * 22 }));
    this._flies = [{ x: W * 0.4, y: H * 0.5, o: 0 }, { x: W * 0.6, y: H * 0.4, o: 2.4 }];
    this._seed = seed; this._key = '';
  },

  rebuild(env) {
    const { W, H, S, P } = env, season = P.season | 0, key = [season, env.cv.width, env.cv.height, this._seed].join();
    if (key === this._key) return;
    this._key = key;
    const SE = this.SEASONS[season] || this.SEASONS[0], mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

    // ---- grond (statisch): mos / gras / aarde in gouache-vlekken
    const gc = mk(env.cv.width, env.cv.height), g = gc.getContext('2d'), r = env.rng((this._seed || 1) + 7);
    g.scale(S, S);
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, SE.base[0]); bg.addColorStop(1, SE.base[1]);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {                                    // zachte kleurvlakken
      const x = r() * W, y = r() * H, rad = 50 + r() * 130, col = SE.ground[Math.floor(r() * 4)];
      const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, col); rg.addColorStop(1, col + '00');
      g.globalAlpha = 0.35; g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0, n = W * H / 650; i < n; i++) {                    // penseelvlekjes
      g.globalAlpha = 0.14 + r() * 0.2; g.fillStyle = SE.ground[Math.floor(r() * 4)];
      g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 7, 1 + r() * 3, r() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 0.35; g.lineCap = 'round';                        // grasstreepjes
    for (let i = 0, n = W * H / 1100; i < n; i++) {
      const x = r() * W, y = r() * H, l = 4 + r() * 6;
      g.strokeStyle = SE.ground[Math.floor(r() * 3)]; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - l); g.stroke();
    }
    g.globalAlpha = 1; this._ground = gc;

    // ---- boomkronen als sprites (150x150 css-px, middelpunt 75,70, kroonstraal 60)
    this._sprites = [];
    for (let v = 0; v < 12; v++) {
      const pal = SE.pals[v % SE.pals.length], rr = env.rng((this._seed || 1) * 13 + v + 1);
      const sc = mk(150 * S, 150 * S), c = sc.getContext('2d'); c.scale(S, S); c.lineCap = 'round';
      const cx = 75, cy = 70, N = 9, lobes = [];
      for (let i = 0; i < N; i++) { const a = i / N * 6.283 + rr() * 0.5; lobes.push({ a, d: 0.5 + rr() * 0.18, k: 0.4 + rr() * 0.13 }); }
      const blob = (ox, oy, sc2, col, al) => {
        c.globalAlpha = al; c.fillStyle = col; c.beginPath();
        c.arc(cx + ox, cy + oy, 60 * 0.62 * sc2, 0, 7);
        for (const l of lobes) { const x = cx + ox + Math.cos(l.a) * 60 * l.d * sc2, y = cy + oy + Math.sin(l.a) * 60 * l.d * sc2; c.moveTo(x + 60 * l.k * sc2, y); c.arc(x, y, 60 * l.k * sc2, 0, 7); }
        c.fill();
      };
      c.globalAlpha = 0.3; c.fillStyle = '#0c1c0c'; c.beginPath(); c.ellipse(cx + 12, cy + 15, 58, 52, 0, 0, 7); c.fill();   // schaduw op de grond
      blob(0, 0, 1, pal[0], 1);
      blob(-3, -4, 0.9, pal[1], 1);
      blob(-8, -10, 0.68, pal[2], 1);
      for (let i = 0; i < 46; i++) {                                    // lichte penseelstreken linksboven
        const a = rr() * 6.283, d = Math.sqrt(rr()) * 46, x = cx - 8 + Math.cos(a) * d, y = cy - 10 + Math.sin(a) * d, ang = -0.9 + (rr() - 0.5) * 1.2, l = 4 + rr() * 8;
        c.globalAlpha = 0.35 + rr() * 0.35; c.strokeStyle = rr() < 0.6 ? pal[3] : pal[2]; c.lineWidth = 2 + rr() * 3.5;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang) * l * 0.5, y + Math.sin(ang) * l * 0.5 - 2, x + Math.cos(ang) * l, y + Math.sin(ang) * l); c.stroke();
      }
      for (let i = 0; i < 30; i++) {                                    // donkere streken rechtsonder
        const a = rr() * 3 + 0.2, d = 24 + rr() * 30, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, l = 4 + rr() * 7;
        c.globalAlpha = 0.3 + rr() * 0.25; c.strokeStyle = pal[0]; c.lineWidth = 2 + rr() * 3;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y - l * 0.4); c.stroke();
      }
      for (let i = 0; i < 9; i++) {                                     // heldere dabs
        c.globalAlpha = 0.55; c.fillStyle = pal[3]; c.beginPath(); c.ellipse(cx - 18 + rr() * 22, cy - 22 + rr() * 18, 2 + rr() * 3, 1.5 + rr() * 2, rr() * 3, 0, 7); c.fill();
      }
      c.globalAlpha = 1; this._sprites.push(sc);
    }

    // ---- zachte lichtvlek (herbruikbaar)
    const sp = mk(64, 64), s = sp.getContext('2d'), sg = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, 'rgba(255,243,176,1)'); sg.addColorStop(1, 'rgba(255,243,176,0)');
    s.fillStyle = sg; s.fillRect(0, 0, 64, 64); this._spot = sp;
  },

  frame(ctx, t, dt, env) {
    const { W, H, P, S } = env, icons = env.icons, season = P.season | 0, SE = this.SEASONS[season] || this.SEASONS[0];
    const clamp = env.clamp, sm = env.smooth;
    this._wt += dt * P.sway; const wt = this._wt, amp = 0.03 * P.sway;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(this._ground, 0, 0, W, H);

    // warme gloed in de open plekken
    for (const ic of icons) {
      const cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2, r = Math.max(ic.w, ic.h) * 1.9;
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(255,236,160,${0.3 * ic.a})`); gr.addColorStop(0.6, `rgba(230,240,150,${0.1 * ic.a})`); gr.addColorStop(1, 'rgba(230,240,150,0)');
      ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // bomen: de kronen gaan op halve framerate naar een tussenlaag (goedkoop op core-GPU), die elke frame wordt getoond
    const k = 1 - Math.exp(-dt * 4 * 2), dens = P.density, n = icons.length;
    const L = this._layer && this._layer.width === env.cv.width && this._layer.height === env.cv.height ? this._layer : (this._layer = (() => { const c = document.createElement('canvas'); c.width = env.cv.width; c.height = env.cv.height; return c; })());
    if ((this._tick = (this._tick || 0) + 1) % 2 === 1 || this._layerDirty !== season) {
      this._layerDirty = season;
      const main = ctx; ctx = L.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, L.width, L.height); ctx.setTransform(S, 0, 0, S, 0, 0);
      this._drawTrees(ctx, env, wt, amp, k, dens, n);
      ctx = main;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(L, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0);
    this._after(ctx, t, dt, env, SE);
  },

  _drawTrees(ctx, env, wt, amp, k, dens, n) {
    const { W, H, P, S } = env, icons = env.icons, clamp = env.clamp, sm = env.smooth;
    for (const tr of this._trees) {
      let d = 1e9, ax = 0, ay = 0;
      for (let i = 0; i < n; i++) {
        const ic = icons[i], dx = Math.max(ic.x - tr.x, 0, tr.x - (ic.x + ic.w)), dy = Math.max(ic.y - tr.y, 0, tr.y - (ic.y + ic.h)), dd = Math.hypot(dx, dy) + (1 - ic.a) * 80;
        if (dd < d) { d = dd; ax = tr.x - (ic.x + ic.w / 2); ay = tr.y - (ic.y + ic.h / 2); }
      }
      const clear = sm(clamp((d - 6 - tr.r * 0.2) / tr.r, 0, 1)), target = clear * clamp((dens - tr.th) * 10, 0, 1);
      if (tr.s < 0) tr.s = target; else tr.s += (target - tr.s) * k;
      const s = tr.s;
      if (s < 0.015 || tr.x < -80 || tr.y < -80 || tr.x > W + 80 || tr.y > H + 80) continue;
      let px = tr.x, py = tr.y;
      if (clear < 1 && d < 1e8) { const l = Math.hypot(ax, ay) || 1, push = (1 - clear) * tr.r * 0.5; px += ax / l * push; py += ay / l * push; }
      const ph = wt * 0.9 + tr.x * 0.004 + tr.y * 0.003 + tr.ph * 0.15, a = Math.sin(ph) * amp, sc = tr.r / 60 * (0.35 + 0.65 * s);
      px += Math.sin(ph * 0.7) * 2 * P.sway; py += Math.cos(ph * 0.6) * 1.2 * P.sway;
      const c = Math.cos(a) * sc * S, sn = Math.sin(a) * sc * S;
      ctx.globalAlpha = s > 0.62 ? 1 : s / 0.62;
      ctx.setTransform(c, sn, -sn, c, px * S, py * S);
      ctx.drawImage(this._sprites[tr.v], -75, -70, 150, 150);
    }
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1;
  },

  _after(ctx, t, dt, env, SE) {
    const { W, H, P, S } = env, icons = env.icons, clamp = env.clamp, sm = env.smooth, n = icons.length;

    // paddenstoelen aan de rand van een open plek
    if (n) for (const m of this._shrooms) {
      const d = env.dist(m.x, m.y), al = sm(clamp((d - 26) / 20, 0, 1)) * (1 - sm(clamp((d - 70) / 50, 0, 1)));
      if (al < 0.03) continue;
      ctx.globalAlpha = al;
      for (let i = 0; i < m.n; i++) {
        const x = m.x + i * 8 - 4, y = m.y + (i % 2) * 4, z = m.z * (1 - i * 0.18);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1.5, 5 * z, 2 * z, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#efe6cf'; ctx.fillRect(x - 1.3 * z, y - 5 * z, 2.6 * z, 5 * z);
        ctx.fillStyle = SE.cap; ctx.beginPath(); ctx.ellipse(x, y - 5 * z, 5.2 * z, 3.8 * z, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x - 2.2 * z, y - 7.2 * z, 1.4 * z, 1.4 * z); ctx.fillRect(x + 1 * z, y - 6.2 * z, 1.2 * z, 1.2 * z);
      }
    }
    ctx.globalAlpha = 1;

    // vlinders
    for (let i = 0; i < this._flies.length; i++) {
      const f = this._flies[i];
      let tx, ty;
      if (n) { const ic = icons[(i * 3 + Math.floor(t / 9)) % n]; tx = ic.x + ic.w / 2 + Math.cos(t * 0.9 + f.o) * 75; ty = ic.y + ic.h / 2 + Math.sin(t * 1.3 + f.o) * 50; }
      else { tx = W * (0.3 + 0.4 * env.noise(t * 0.1, f.o, 5)); ty = H * (0.3 + 0.4 * env.noise(t * 0.1, f.o, 9)); }
      const kk = 1 - Math.exp(-dt * 0.9); f.x += (tx - f.x) * kk; f.y += (ty - f.y) * kk;
      const fl = Math.abs(Math.sin(t * 13 + f.o)) * 0.85 + 0.15, bob = Math.sin(t * 4 + f.o) * 3;
      ctx.save(); ctx.translate(f.x, f.y + bob);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(4, 12, 5, 2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = SE.fly[0];
      ctx.beginPath(); ctx.ellipse(-3.5 * fl, -1, 4 * fl, 5, -0.3, 0, 7); ctx.ellipse(3.5 * fl, -1, 4 * fl, 5, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = SE.fly[1];
      ctx.beginPath(); ctx.ellipse(-2.8 * fl, 3, 2.8 * fl, 3, 0.3, 0, 7); ctx.ellipse(2.8 * fl, 3, 2.8 * fl, 3, -0.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.fillRect(-0.7, -4, 1.4, 9);
      ctx.restore();
    }

    // vallende blaadjes / bloesem
    const cnt = SE.leafN;
    for (let i = 0; i < cnt; i++) {
      const l = this._leaves[i];
      l.y += l.vy * dt * (0.6 + 0.4 * P.sway); l.x += (Math.sin(t * 0.8 + l.ph) * 14 + 9 * P.sway) * dt;
      if (l.y > H + 10) { l.y = -10; l.x = Math.random() * W; } if (l.x > W + 10) l.x = -10;
      ctx.fillStyle = SE.leaf[l.c % SE.leaf.length]; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(l.x, l.y, l.z * (0.5 + 0.5 * Math.abs(Math.cos(t * 1.6 + l.ph))), l.z * 0.55, l.ph + t * 0.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // vogelschaduwen die over het bladerdak vliegen
    const b = this._bird;
    if (t > b.t0) {
      const p = (t - b.t0) / 16;
      if (p > 1) { b.t0 = t + 25 + Math.random() * 30; b.y = 0.15 + Math.random() * 0.5; }
      else {
        ctx.strokeStyle = 'rgba(10,25,10,0.26)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const x = -60 + p * (W + 160) - i * 34, y = H * b.y + p * H * 0.2 + Math.sin(p * 9 + i) * 10 + (i % 2 ? 18 : -6) * (i ? 1 : 0), fl = Math.sin(t * 9 + i * 1.3) * 5;
          ctx.beginPath(); ctx.moveTo(x - 9, y + fl); ctx.quadraticCurveTo(x - 4, y - 3, x, y); ctx.quadraticCurveTo(x + 4, y - 3, x + 9, y + fl); ctx.stroke();
        }
      }
    }

    // wegtrekkende lichtvlekken door het bladerdak
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const x = W * ((i * 0.37 + t * 0.004 * (1 + i % 3)) % 1.2 - 0.1), y = H * (0.5 + 0.45 * Math.sin(t * 0.03 + i * 2.1)), r = 70 + (i % 4) * 28;
      ctx.globalAlpha = 0.07 + 0.05 * Math.sin(t * 0.4 + i);
      ctx.drawImage(this._spot, x - r, y - r * 0.7, r * 2, r * 1.4);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
});
