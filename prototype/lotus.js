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
      pads.push({ x, y, r: rad, rot: r() * 6.28, v: Math.floor(r() * 4), ph: r() * 6.28,
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
      koi.push({ seg, ang, sp: 34 + r() * 22, size, cols, seed: r() * 100, ph: r() * 6.28, spc: sp });
    }
    this._koi = koi;
  },

  _padSprite(k) {                                   // één blad, 256px; notch naar rechts (hoek 0)
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), R = 118, cx = 128, cy = 128;
    const cols = [['#4aa75a', '#2c7a46', '#7fcf7b'], ['#5aa84c', '#33773a', '#9ad27a'], ['#3f9d6a', '#25704f', '#74c995'], ['#4f9f52', '#2a7040', '#8cc87a']][k];
    const notch = 0.16 + k * 0.03;
    g.beginPath(); g.moveTo(cx, cy);
    g.arc(cx, cy, R, notch, Math.PI * 2 - notch); g.closePath();
    const gr = g.createRadialGradient(cx - 18, cy - 22, 6, cx, cy, R);
    gr.addColorStop(0, cols[0]); gr.addColorStop(0.75, cols[1]); gr.addColorStop(1, '#1f5e3a');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(15,60,35,0.38)'; g.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const a = notch + (Math.PI * 2 - notch * 2) * (i + 0.5) / 16;
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a + 0.12) * R * 0.5, cy + Math.sin(a + 0.12) * R * 0.5, cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    }
    g.strokeStyle = 'rgba(190,240,170,0.16)'; g.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const a = notch + (Math.PI * 2 - notch * 2) * (i + 0.2) / 16;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    }
    g.restore();
    g.lineWidth = 3; g.strokeStyle = cols[2]; g.globalAlpha = 0.5;
    g.beginPath(); g.arc(cx, cy, R - 1.5, notch + 0.02, Math.PI * 2 - notch - 0.02); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = 'rgba(210,255,240,0.5)';                // druppeltjes
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + Math.cos(i * 2.3 + k) * 44, cy + Math.sin(i * 2.3 + k) * 38, 2.6 + i * 0.7, 0, 7); g.fill(); }
    return c;
  },

  _flowerSprite(v) {
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const g = c.getContext('2d'), cx = 90, cy = 90;
    const pal = v ? ['#fffdf6', '#f2ecdc', '#e8dcc0'] : ['#f9b6cf', '#f08bb2', '#d8588f'];
    const ring = (n, len, wid, rot, col, edge) => {
      for (let i = 0; i < n; i++) {
        const a = rot + i * Math.PI * 2 / n;
        g.save(); g.translate(cx, cy); g.rotate(a);
        const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, col[2]); gr.addColorStop(0.5, col[1]); gr.addColorStop(1, col[0]);
        g.fillStyle = gr; g.beginPath(); g.moveTo(len * 0.1, 0);
        g.quadraticCurveTo(len * 0.5, -wid * 1.15, len, 0); g.quadraticCurveTo(len * 0.5, wid * 1.15, len * 0.1, 0); g.fill();
        g.strokeStyle = edge; g.lineWidth = 1; g.stroke(); g.restore();
      }
    };
    g.fillStyle = 'rgba(0,20,10,0.2)'; g.beginPath(); g.arc(cx + 3, cy + 5, 70, 0, 7); g.fill();
    ring(9, 78, 17, 0.1, pal, 'rgba(120,40,70,0.25)'); ring(7, 60, 15, 0.5, pal, 'rgba(120,40,70,0.25)'); ring(5, 42, 13, 0.2, pal, 'rgba(120,40,70,0.3)');
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 15); gr.addColorStop(0, '#ffe36a'); gr.addColorStop(1, '#e8a620');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill();
    g.fillStyle = '#c47a14'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(cx + Math.cos(i * 0.7) * 6, cy + Math.sin(i * 0.7) * 6, 1.4, 0, 7); g.fill(); }
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
    this._sprites = [0, 1, 2, 3].map(k => this._padSprite(k));
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

  _drawKoi(ctx, t, env) {
    const n = Math.min(12, Math.max(0, Math.round(env.P.koi))), u = this._u;
    const PROF = [6, 7.6, 8.2, 7.8, 6.9, 5.8, 4.7, 3.7, 2.8, 2.0];
    const pos = [];
    for (let i = 0; i < n; i++) {                  // zwaaiende posities
      const k = this._koi[i], p = [];
      for (let s = 0; s < 10; s++) {
        const a = k.seg[Math.max(0, s - 1)], b = k.seg[Math.min(9, s + 1)];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1;
        const off = Math.sin(t * 4.2 + k.ph - s * 0.75) * s * 0.55 * k.size * 0.9;
        p.push({ x: k.seg[s].x - dy / d * off, y: k.seg[s].y + dx / d * off });
      }
      pos.push(p);
    }
    ctx.fillStyle = 'rgba(0,8,8,0.22)'; ctx.beginPath();           // schaduw op de bodem
    for (let i = 0; i < n; i++) for (let s = 0; s < 10; s++) { const q = pos[i][s], r = PROF[s] * this._koi[i].size * 0.95; ctx.moveTo(q.x + 7 * u + r, q.y + 10 * u); ctx.arc(q.x + 7 * u, q.y + 10 * u, r, 0, 6.3); }
    ctx.fill();
    for (let i = 0; i < n; i++) {
      const k = this._koi[i], p = pos[i], sz = k.size;
      const ta = Math.atan2(p[9].y - p[7].y, p[9].x - p[7].x), wag = Math.sin(t * 4.2 + k.ph - 8 * 0.75) * 0.35;
      const tl = 15 * sz;                                          // staartvin
      ctx.fillStyle = k.cols[9]; ctx.globalAlpha = 0.72; ctx.beginPath(); ctx.moveTo(p[9].x, p[9].y);
      for (const sgn of [-1, 1]) { const a = ta + wag + sgn * 0.5; ctx.lineTo(p[9].x + Math.cos(a) * tl * 1.4, p[9].y + Math.sin(a) * tl * 1.4); ctx.lineTo(p[9].x + Math.cos(ta + wag + sgn * 0.14) * tl * 0.8, p[9].y + Math.sin(ta + wag + sgn * 0.14) * tl * 0.8); }
      ctx.closePath(); ctx.fill();
      const fa = Math.atan2(p[1].y - p[3].y, p[1].x - p[3].x);      // borstvinnen
      ctx.fillStyle = k.cols[2]; ctx.globalAlpha = 0.6;
      for (const sgn of [-1, 1]) {
        const fx = p[2].x + Math.cos(fa + sgn * 1.6) * 7 * sz, fy = p[2].y + Math.sin(fa + sgn * 1.6) * 7 * sz, sw = Math.sin(t * 2 + k.ph) * 0.2;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(fa + sgn * (0.9 + sw) + Math.PI); ctx.beginPath(); ctx.ellipse(6 * sz, 0, 8 * sz, 3 * sz, 0, 0, 6.3); ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (let s = 9; s >= 0; s--) { ctx.fillStyle = k.cols[s]; ctx.beginPath(); ctx.arc(p[s].x, p[s].y, PROF[s] * sz, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.14)';                    // glans langs de rug
      for (let s = 1; s < 7; s++) { ctx.beginPath(); ctx.arc(p[s].x - 1.5 * sz, p[s].y - 2 * sz, PROF[s] * sz * 0.5, 0, 6.3); ctx.fill(); }
      const ha = Math.atan2(p[0].y - p[2].y, p[0].x - p[2].x);       // ogen
      ctx.fillStyle = '#1a1410';
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(p[0].x + Math.cos(ha + sgn * 1.0) * 5 * sz + Math.cos(ha) * 1.5, p[0].y + Math.sin(ha + sgn * 1.0) * 5 * sz + Math.sin(ha) * 1.5, 1.4 * sz, 0, 6.3); ctx.fill(); }
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
      ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#021410'; ctx.beginPath(); ctx.arc(x + r * 0.07, y + r * 0.1, r * 0.98, 0, 6.3); ctx.fill();
      ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(spr, -r * 1.08, -r * 1.08, r * 2.16, r * 2.16); ctx.restore();
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
      const k = Math.floor(env.hash(Math.round(ic.tx / 4), Math.round(ic.ty / 4), 9) * 4) % 4;
      drawPad(SP[k], cx + Math.sin(t * 0.4 + i) * 1.2, cy + Math.cos(t * 0.35 + i * 1.3) * 1.2, r, 0.6 + k * 1.5 + Math.sin(t * 0.15 + i) * 0.05, ic.a);
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
