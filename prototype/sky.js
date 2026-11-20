// Thema "Sky": cartoon-lucht met bolle wolken. Elk icoon zit op een wolkenpluim (de wolk groeit rond het icoon),
// extra wolken drijven langzaam voorbij. time: 0 dag, 1 avond, 2 nacht.
// Techniek: statische hemel in een cache-canvas; per frame worden alle wolkenbolletjes (iconen + drijvers)
// verzameld en in drie lagen getekend (schaduw, lichte rand, lichaam), elk met één gevuld pad -> goedkoop en samensmeltend.
IconIsland.theme({
  params: { time: 0, cover: 0.35, flow: 1, birds: 2, liners: 1, jets: 3, balloons: 3 },
  _liners: [], _linerT: 5, _flocks: [], _birdT: 3, _jets: [], _jetT: 8, _balloons: [],

  _bg: null, _stars: [], _amb: [], _seed: 1,
  PAL: [
    { top: '#2f8fe6', mid: '#6cbcf2', bot: '#cdeeff', cloud: '#ffffff', rim: '#ffffff', shade: '#bcd6ee' },   // dag
    { top: '#2d2a7a', mid: '#cf5f8e', bot: '#ffb27a', cloud: '#ffd8cf', rim: '#ffc58f', shade: '#b8618c' },   // avond
    { top: '#040918', mid: '#0e1a40', bot: '#22366c', cloud: '#3a4b80', rim: '#9db0e8', shade: '#1b2653' },   // nacht
  ],

  init(env, seed) {
    this._seed = seed;
    const r = env.rng(seed + 31), k = Math.max(0.8, Math.min(1.5, env.W / 1920));
    this._stars = Array.from({ length: Math.round(env.W * env.H / 3500) }, () => ({ x: r() * env.W, y: Math.pow(r(), 1.4) * env.H * 0.85, s: 0.5 + r() * 1.5, p: r() * 6.28, f: 0.6 + r() * 2, tw: r() < 0.25 }));
    const max = Math.max(8, Math.round(env.W * env.H / 52000));       // vaste pool; 'cover' kiest hoeveel er meedoen
    this._amb = Array.from({ length: max }, () => {
      const n = 6 + Math.floor(r() * 4), sc = (0.7 + r() * 0.9) * k, parts = [];
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : i / (n - 1), arch = Math.sin(u * Math.PI);
        parts.push([(u - 0.5) * 190 * sc, -arch * (14 + r() * 22) * sc - (i % 2) * 6 * sc, (24 + arch * 20 + r() * 8) * sc, r() * 6.28]);
      }
      parts.push([0, 6 * sc, 30 * sc, 0], [-60 * sc, 8 * sc, 22 * sc, 1], [60 * sc, 8 * sc, 22 * sc, 2]);   // vlakke onderkant
      return { x: r(), y: r(), sp: 6 + r() * 12, parts, span: 260 * sc, prio: r() };
    }).sort((a, b) => a.prio - b.prio);
  },

  rebuild(env) {                                      // statische laag: kleurverloop, zon / maan
    const { W, H, S, P } = env, tm = P.time | 0, p = this.PAL[tm] || this.PAL[0];
    const c = document.createElement('canvas'); c.width = env.cv.width; c.height = env.cv.height;
    const g = c.getContext('2d'); g.scale(S, S);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, p.top); sky.addColorStop(0.55, p.mid); sky.addColorStop(1, p.bot);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const glow = (x, y, r, col0, col1) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col0); rg.addColorStop(1, col1); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
    if (tm === 0) {                                   // zachte zon linksboven, buiten beeld
      glow(W * 0.12, H * -0.02, H * 0.9, 'rgba(225,244,255,0.8)', 'rgba(225,244,255,0)');
    } else if (tm === 1) {                            // zon laag bij de horizon
      glow(W * 0.72, H * 1.02, H * 0.95, 'rgba(255,214,140,0.85)', 'rgba(255,170,110,0)');
      glow(W * 0.72, H * 1.02, H * 0.28, 'rgba(255,245,200,0.95)', 'rgba(255,230,160,0)');
    } else {                                          // maan met halo
      const mx = W * 0.8, my = H * 0.2, mr = Math.max(26, H * 0.055);
      glow(mx, my, mr * 5, 'rgba(170,190,255,0.28)', 'rgba(170,190,255,0)');
      g.fillStyle = '#f2f1e4'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
      g.fillStyle = 'rgba(190,190,170,0.35)';
      [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.3], [-0.15, 0.4, 0.14], [0.35, -0.35, 0.12]].forEach(([a, b, s]) => { g.beginPath(); g.arc(mx + a * mr, my + b * mr, s * mr, 0, 7); g.fill(); });
      g.fillStyle = '#fff';
      for (const s of this._stars) if (!s.tw) { g.globalAlpha = 0.35 + 0.5 * (s.s / 2); g.fillRect(s.x, s.y, s.s, s.s); }
      g.globalAlpha = 1;
    }
    this._bg = c;
  },

  frame(ctx, t, dt, env) {
    const { W, H, P } = env, tm = P.time | 0, pal = this.PAL[tm] || this.PAL[0], fl = P.flow;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._bg, 0, 0, W, H);
    if (tm === 2) {                                   // twinkelende sterren
      ctx.fillStyle = '#fff';
      for (const s of this._stars) if (s.tw) { ctx.globalAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.f + s.p)); ctx.fillRect(s.x, s.y, s.s, s.s); }
      ctx.globalAlpha = 1;
    }
    // ---- wolkenbolletjes verzamelen: [x, y, r] ----
    const puffs = [], tt = t * (0.5 + 0.5 * fl);
    const seed = this._seed;
    for (const ic of env.icons) {
      const a = ic.a; if (a < 0.02) continue;
      const kx = Math.round(ic.tx !== undefined ? ic.tx : ic.x), ky = Math.round(ic.ty !== undefined ? ic.ty : ic.y);
      const cx = ic.x + ic.w / 2, base = ic.y + ic.h * 0.92, R = Math.max(ic.w, ic.h) * 0.5;
      const add = (px, py, r, i) => {
        const ph = env.hash(kx, ky, seed + i) * 6.28;
        const bob = 1 + 0.05 * Math.sin(tt * 0.9 + ph);
        puffs.push(px + Math.sin(tt * 0.5 + ph) * 2.5, py + Math.cos(tt * 0.6 + ph) * 2, Math.max(1, r * bob * a));
      };
      const n = Math.max(4, Math.round(ic.w / 14));
      for (let i = 0; i < n; i++) {                   // vlakke onderrand
        const u = i / (n - 1) - 0.5, hh = env.hash(kx, ky, i + 3);
        add(cx + u * (ic.w + 44), base + 6 + (1 - Math.abs(u * 2)) * 3, 20 + hh * 8, i);
      }
      for (let i = 0; i < 5; i++) {                   // middenrij achter het icoon
        const u = i / 4 - 0.5, hh = env.hash(kx, ky, i + 20);
        add(cx + u * (ic.w + 56), ic.y + ic.h * 0.5 + (hh - 0.5) * 12, R * (0.72 + hh * 0.25) * (1 - Math.abs(u) * 0.3), i + 10);
      }
      for (let i = 0; i < 3; i++) {                   // kopjes boven
        const hh = env.hash(kx, ky, i + 40);
        add(cx + (i - 1) * ic.w * 0.34 + (hh - 0.5) * 8, ic.y + ic.h * 0.1 + hh * 8, R * (0.55 + hh * 0.2), i + 30);
      }
    }
    const nAmb = Math.round(P.cover * this._amb.length), wrap = W + 600;
    for (let i = 0; i < nAmb; i++) {
      const cl = this._amb[i];
      const cx = ((cl.x * wrap + t * cl.sp * fl) % wrap + wrap) % wrap - 300, cy = H * (0.06 + cl.y * 0.88);
      for (const q of cl.parts) puffs.push(cx + q[0], cy + q[1] + Math.sin(tt * 0.7 + q[3]) * 1.5, q[2] * (1 + 0.04 * Math.sin(tt * 0.8 + q[3])));
    }
    // ---- drie lagen: schaduw (omlaag), lichte rand (omhoog), lichaam ----
    const layer = (col, dx, dy, dr) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < puffs.length; i += 3) { const r = puffs[i + 2] + dr; ctx.moveTo(puffs[i] + dx + r, puffs[i + 1] + dy); ctx.arc(puffs[i] + dx, puffs[i + 1] + dy, r, 0, 6.2832); }
      ctx.fill();
    };
    if (puffs.length) {
      layer(pal.shade, 0, 5, 1.5);
      layer(pal.rim, 0, -3, 0);
      layer(pal.cloud, 0, 0, 0);
    }
    this._life(ctx, t, dt, env, tm);
  },

  // balloons drifting, airliners with contrails, jet squadrons and flocks of birds gliding through (no birds at night)
  _life(ctx, t, dt, env, tm) {
    const { W, H, P } = env, R = Math.random;
    const nBird = Math.round(P.birds || 0), nLin = Math.round(P.liners || 0), nJet = Math.round(P.jets || 0), nBal = Math.round(P.balloons || 0);
    this._linerT -= dt; this._birdT -= dt; this._jetT -= dt;
    // ---- hot-air balloons: a fixed pool that wraps around the screen
    while (this._balloons.length > nBal) this._balloons.pop();
    const PALS = [['#e8453c', '#ffd23f'], ['#2f7fd8', '#ffffff'], ['#2fae6a', '#ffe08a'], ['#f08a2c', '#7b3fa0'], ['#d6407a', '#fff1c8'], ['#2aa7a7', '#f2f2f2'], ['#7a4fc4', '#ffc23a']];
    while (this._balloons.length < nBal) {
      const sc = 0.75 + R() * 0.55;
      this._balloons.push({ x: R() * (W + 200) - 100, y: H * (0.1 + R() * 0.6), sc, v: 4 + R() * 7 + sc * 2, ph: R() * 6.28, pal: PALS[Math.floor(R() * PALS.length)], stripes: 6 + Math.floor(R() * 3) * 2, dir: R() < 0.8 ? 1 : -1 });
    }
    for (const bl of this._balloons.slice().sort((p, q) => p.sc - q.sc)) {
      bl.x += bl.v * bl.dir * dt * (P.flow === undefined ? 1 : Math.max(0.2, P.flow));
      if (bl.x > W + 80) bl.x = -80; else if (bl.x < -80) bl.x = W + 80;
      const y = bl.y + Math.sin(t * 0.35 + bl.ph) * 6, sway = Math.sin(t * 0.5 + bl.ph) * 0.05;
      this._balloon(ctx, bl.x, y, bl.sc, sway, bl, t, tm);
    }
    // ---- spawn
    this._liners = this._liners.filter(l => !l.done);
    if (this._liners.length < nLin && this._linerT <= 0) {
      const dir = R() < 0.5 ? 1 : -1, y0 = H * (0.1 + R() * 0.55);
      this._liners.push({ x: dir > 0 ? -380 : W + 380, y: y0, dir, vy: (R() - 0.5) * 14, v: 80 + R() * 30, trail: [] });
      this._linerT = (nLin > 1 ? 14 : 45) + R() * 40;
    }
    if (tm !== 2 && this._birdT <= 0 && this._flocks.length < nBird) {
      this._birdT = 8 + R() * 22;
      const dir = R() < 0.5 ? 1 : -1, n = R() < 0.3 ? 1 : 3 + Math.floor(R() * 5), y0 = H * (0.08 + R() * 0.7);
      this._flocks.push({ x: dir > 0 ? -80 : W + 80, y: y0, dir, v: 30 + R() * 30, vy: (R() - 0.5) * 8, ph: R() * 6, n, sc: 1.2 + R() * 0.8 });
    }
    if (nJet > 0 && !this._jets.length && this._jetT <= 0) {
      const dir = R() < 0.5 ? 1 : -1, y0 = H * (0.12 + R() * 0.55), v = 300 + R() * 80;
      this._jets.push({ x: dir > 0 ? -160 : W + 160, y: y0, dir, v, vy: (R() - 0.5) * 24, n: nJet, tr: Array.from({ length: nJet }, () => []), ph: R() * 6 });
      this._jetT = 35 + R() * 50;
    }
    if (!nJet) this._jets.length = 0;
    // ---- birds
    const ink = tm === 1 ? 'rgba(60,25,70,0.85)' : 'rgba(35,52,80,0.8)';
    ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let f = this._flocks.length - 1; f >= 0; f--) {
      const fl = this._flocks[f];
      fl.x += fl.v * fl.dir * dt; fl.y += fl.vy * dt;
      if ((fl.dir > 0 && fl.x > W + 120) || (fl.dir < 0 && fl.x < -120)) { this._flocks.splice(f, 1); continue; }
      for (let i = 0; i < fl.n; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, bx = fl.x - fl.dir * row * 22 * fl.sc, by = fl.y + (i ? side * row * 12 * fl.sc : 0) + Math.sin(t * 0.7 + i + fl.ph) * 3;
        const flap = Math.sin(t * 5.5 + i * 0.9 + fl.ph), w = 9 * fl.sc, up = flap * 5 * fl.sc;
        ctx.lineWidth = 1.8 * fl.sc;
        ctx.beginPath(); ctx.moveTo(bx - w, by - up * 0.5 - 1); ctx.quadraticCurveTo(bx - w * 0.45, by - up - 3 * fl.sc, bx, by); ctx.quadraticCurveTo(bx + w * 0.45, by - up - 3 * fl.sc, bx + w, by - up * 0.5 - 1); ctx.stroke();
      }
    }
    // ---- airliners
    for (const pl of this._liners) {
      pl.x += pl.v * pl.dir * dt; pl.y += pl.vy * dt;
      pl.trail.push([pl.x, pl.y]); if (pl.trail.length > 260) pl.trail.shift();
      if ((pl.dir > 0 && pl.x > W + 420) || (pl.dir < 0 && pl.x < -420)) { pl.done = true; continue; }
      const a = tm === 2 ? 0.28 : tm === 1 ? 0.55 : 0.7, tr = pl.trail;
      if (tr.length > 3) {
        const g = ctx.createLinearGradient(tr[0][0], tr[0][1], pl.x, pl.y);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, tm === 1 ? `rgba(255,225,205,${a})` : `rgba(255,255,255,${a})`);
        ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1] - 1.2); for (const q of tr) ctx.lineTo(q[0], q[1] - 1.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1] + 1.2); for (const q of tr) ctx.lineTo(q[0], q[1] + 1.2); ctx.stroke();
      }
      ctx.save(); ctx.translate(pl.x, pl.y); ctx.scale(pl.dir * 1.1, 1.1); ctx.rotate(Math.atan2(pl.vy, pl.v) * 0.6);
      const body = tm === 2 ? '#8e9cc4' : tm === 1 ? '#f0d4c8' : '#fbfcff', wing = tm === 2 ? '#6f7fae' : tm === 1 ? '#d9b0a6' : '#dfe8f4';
      ctx.fillStyle = 'rgba(10,30,70,0.18)'; ctx.beginPath(); ctx.ellipse(3, 7, 30, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = wing;                                                       // wings (seen from slightly below / side), swept back
      ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(-12, -17); ctx.lineTo(-19, -17); ctx.lineTo(-7, -1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(-12, 15); ctx.lineTo(-19, 15); ctx.lineTo(-7, 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-26, -1); ctx.lineTo(-33, -9); ctx.lineTo(-37, -9); ctx.lineTo(-32, -1); ctx.closePath(); ctx.fill();   // tailplane
      ctx.beginPath(); ctx.moveTo(-26, 1); ctx.lineTo(-33, 8); ctx.lineTo(-37, 8); ctx.lineTo(-32, 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, 32, 4.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = tm === 2 ? '#5b6a9a' : '#2f6fc0'; ctx.beginPath(); ctx.ellipse(27, -0.3, 6, 2.2, 0, 0, 7); ctx.fill(); ctx.fillRect(-30, -1, 12, 2);
      ctx.fillStyle = '#6d7a90'; ctx.beginPath(); ctx.ellipse(-4, -9, 4, 1.8, 0, 0, 7); ctx.ellipse(-4, 9, 4, 1.8, 0, 0, 7); ctx.fill();
      if (tm !== 0) {                                                             // navigation lights
        const on = Math.sin(t * 7) > 0.7;
        ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(-17, -17, 1.6, 0, 7); ctx.fill();
        ctx.fillStyle = '#3cff80'; ctx.beginPath(); ctx.arc(-17, 15, 1.6, 0, 7); ctx.fill();
        if (on) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-34, 0, 2.4, 0, 7); ctx.fill(); }
      }
      ctx.restore();
    }
    // ---- fighter jets in a V formation, fast, with thin contrails
    for (let j = this._jets.length - 1; j >= 0; j--) {
      const sq = this._jets[j];
      sq.x += sq.v * sq.dir * dt; sq.y += sq.vy * dt;
      if ((sq.dir > 0 && sq.x > W + 260 + sq.n * 20) || (sq.dir < 0 && sq.x < -260 - sq.n * 20)) { this._jets.splice(j, 1); continue; }
      const a = tm === 2 ? 0.25 : tm === 1 ? 0.5 : 0.65;
      for (let i = 0; i < sq.n; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, jx = sq.x - sq.dir * row * 40, jy = sq.y + (i ? side * row * 20 : 0) + Math.sin(t * 1.3 + i + sq.ph) * 0.8;
        const tr = sq.tr[i]; tr.push([jx, jy]); if (tr.length > 70) tr.shift();
        if (tr.length > 3) {
          const g = ctx.createLinearGradient(tr[0][0], tr[0][1], jx, jy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, tm === 1 ? `rgba(255,225,205,${a})` : `rgba(255,255,255,${a})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1]); for (const q of tr) ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
        this._jet(ctx, jx, jy, sq.dir, tm, t + i);
      }
    }
  },

  // small fighter jet, side view with a slightly raised wing, pointing right (flipped by dir)
  _jet(ctx, x, y, dir, tm, t) {
    const body = tm === 2 ? '#6f7c9c' : tm === 1 ? '#9c8a98' : '#8d99ab', dark = tm === 2 ? '#4a5678' : tm === 1 ? '#6e5c72' : '#5d6a7e', light = tm === 2 ? '#8e9bbb' : '#c4ceda';
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * 1.25, 1.25);
    ctx.fillStyle = 'rgba(10,30,70,0.14)'; ctx.beginPath(); ctx.ellipse(2, 7, 13, 1.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = dark;                                                                                        // far wing + far tail fin
    ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(-8, -8); ctx.lineTo(-11, -8); ctx.lineTo(-5, -1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(-14, -8); ctx.lineTo(-17, -8); ctx.lineTo(-14, -1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = body; ctx.beginPath();                                                                       // fuselage
    ctx.moveTo(16, 0.5); ctx.quadraticCurveTo(10, -2.4, 2, -2.2); ctx.lineTo(-14, -1.8); ctx.lineTo(-15, 0); ctx.lineTo(-14, 1.8); ctx.lineTo(2, 2.4); ctx.quadraticCurveTo(10, 1.8, 16, 0.5); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(2, -2.2); ctx.lineTo(-14, -1.8); ctx.lineTo(-14, -0.8); ctx.lineTo(2, -1); ctx.fill();
    ctx.fillStyle = tm === 2 ? '#a8c0ff' : '#2d5a9a'; ctx.beginPath(); ctx.ellipse(6, -2, 3.6, 1.3, 0.1, 0, 7); ctx.fill();                      // canopy
    ctx.fillStyle = body;                                                                                        // near wing + tailplane
    ctx.beginPath(); ctx.moveTo(4, 1); ctx.lineTo(-9, 9); ctx.lineTo(-12, 9); ctx.lineTo(-6, 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(-15, 6); ctx.lineTo(-17, 6); ctx.lineTo(-15, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-9, -1.8); ctx.lineTo(-15, -9); ctx.lineTo(-18, -9); ctx.lineTo(-16, -1.8); ctx.closePath(); ctx.fill();   // tail fin
    const fl = 0.7 + 0.3 * Math.sin(t * 30);                                                                      // afterburner
    ctx.fillStyle = `rgba(255,${tm === 0 ? 170 : 200},80,${tm === 0 ? 0.7 : 0.95})`; ctx.beginPath(); ctx.moveTo(-15, -1); ctx.lineTo(-15 - 6 * fl, 0); ctx.lineTo(-15, 1); ctx.fill();
    ctx.restore();
  },

  // hot-air balloon: gored envelope with a basket, swaying gently; lit by its burner at dusk and night
  _balloon(ctx, x, y, sc, sway, bl, t, tm) {
    const RW = 18 * sc, RH = 20 * sc;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    const env = new Path2D();
    env.moveTo(0, RH * 1.55); env.bezierCurveTo(-RW * 0.45, RH * 1.2, -RW, RH * 0.5, -RW, -RH * 0.2); env.bezierCurveTo(-RW, -RH * 1.05, -RW * 0.45, -RH * 1.55, 0, -RH * 1.55);
    env.bezierCurveTo(RW * 0.45, -RH * 1.55, RW, -RH * 1.05, RW, -RH * 0.2); env.bezierCurveTo(RW, RH * 0.5, RW * 0.45, RH * 1.2, 0, RH * 1.55);
    ctx.fillStyle = 'rgba(10,30,70,0.12)'; ctx.save(); ctx.translate(5 * sc, 16 * sc); ctx.fill(env); ctx.restore();
    ctx.strokeStyle = 'rgba(60,50,40,0.55)'; ctx.lineWidth = 0.7 * sc; ctx.beginPath();                                    // ropes
    ctx.moveTo(-RW * 0.45, RH * 1.2); ctx.lineTo(-3 * sc, RH * 1.55 + 7 * sc); ctx.moveTo(RW * 0.45, RH * 1.2); ctx.lineTo(3 * sc, RH * 1.55 + 7 * sc); ctx.moveTo(0, RH * 1.55); ctx.lineTo(0, RH * 1.55 + 7 * sc); ctx.stroke();
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(-3.4 * sc, RH * 1.55 + 7 * sc, 6.8 * sc, 4.6 * sc); ctx.fillStyle = '#b98650'; ctx.fillRect(-3.4 * sc, RH * 1.55 + 7 * sc, 6.8 * sc, 1.3 * sc);   // basket
    ctx.save(); ctx.clip(env);
    ctx.fillStyle = bl.pal[0]; ctx.fillRect(-RW, -RH * 1.6, RW * 2, RH * 3.3);
    const n = bl.stripes;
    ctx.fillStyle = bl.pal[1];
    for (let i = 0; i < n; i += 2) {                                                                                       // alternating gores (curved like meridians)
      const x0 = -RW + (i / n) * RW * 2, x1 = -RW + ((i + 1) / n) * RW * 2;
      ctx.beginPath(); ctx.moveTo(x0 * 0.05, -RH * 1.55); ctx.quadraticCurveTo(x0 * 1.1, 0, x0 * 0.08, RH * 1.55); ctx.lineTo(x1 * 0.08, RH * 1.55); ctx.quadraticCurveTo(x1 * 1.1, 0, x1 * 0.05, -RH * 1.55); ctx.closePath(); ctx.fill();
    }
    const g = ctx.createRadialGradient(-RW * 0.35, -RH * 0.5, 1, 0, 0, RH * 1.7);                                          // light from the top left
    g.addColorStop(0, 'rgba(255,255,255,0.42)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(20,10,40,0.34)'); ctx.fillStyle = g; ctx.fillRect(-RW, -RH * 1.6, RW * 2, RH * 3.3);
    if (tm === 2) { ctx.fillStyle = 'rgba(8,14,50,0.4)'; ctx.fillRect(-RW, -RH * 1.6, RW * 2, RH * 3.3); }
    else if (tm === 1) { ctx.fillStyle = 'rgba(255,120,60,0.16)'; ctx.fillRect(-RW, -RH * 1.6, RW * 2, RH * 3.3); }
    if (tm !== 0) { const gl = ctx.createRadialGradient(0, RH * 1.1, 0, 0, RH * 1.1, RH * 1.1); gl.addColorStop(0, `rgba(255,190,90,${tm === 2 ? 0.55 : 0.3})`); gl.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = gl; ctx.fillRect(-RW, 0, RW * 2, RH * 1.7); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,20,30,0.35)'; ctx.lineWidth = 0.8; ctx.stroke(env);
    const fl = 0.75 + 0.25 * Math.sin(t * 9 + bl.ph);                                                                      // burner flame
    ctx.fillStyle = `rgba(255,${tm === 0 ? 180 : 210},70,${0.9 * fl})`; ctx.beginPath(); ctx.ellipse(0, RH * 1.55 + 4.5 * sc, 1.1 * sc, 2.6 * sc * fl, 0, 0, 7); ctx.fill();
    ctx.restore();
  },
});
