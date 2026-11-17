// Thema "Sky": cartoon-lucht met bolle wolken. Elk icoon zit op een wolkenpluim (de wolk groeit rond het icoon),
// extra wolken drijven langzaam voorbij. time: 0 dag, 1 avond, 2 nacht.
// Techniek: statische hemel in een cache-canvas; per frame worden alle wolkenbolletjes (iconen + drijvers)
// verzameld en in drie lagen getekend (schaduw, lichte rand, lichaam), elk met één gevuld pad -> goedkoop en samensmeltend.
IconIsland.theme({
  params: { time: 0, cover: 0.35, flow: 1, life: 1 },
  _plane: null, _planeT: 14, _flocks: [], _birdT: 3,

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
    if (P.life >= 1) this._life(ctx, t, dt, env, tm);
    else { this._plane = null; this._flocks.length = 0; }
  },

  // an airliner with a contrail now and then, and flocks of birds gliding through (no birds at night)
  _life(ctx, t, dt, env, tm) {
    const { W, H } = env, R = Math.random;
    this._planeT -= dt; this._birdT -= dt;
    if (!this._plane && this._planeT <= 0) {
      const dir = R() < 0.5 ? 1 : -1, y0 = H * (0.1 + R() * 0.55);
      this._plane = { x: dir > 0 ? -380 : W + 380, y: y0, dir, vy: (R() - 0.5) * 14, v: 80 + R() * 30, trail: [] };
    }
    if (tm !== 2 && this._birdT <= 0 && this._flocks.length < 3) {
      this._birdT = 10 + R() * 25;
      const dir = R() < 0.5 ? 1 : -1, n = R() < 0.3 ? 1 : 3 + Math.floor(R() * 5), y0 = H * (0.08 + R() * 0.7);
      this._flocks.push({ x: dir > 0 ? -80 : W + 80, y: y0, dir, v: 30 + R() * 30, vy: (R() - 0.5) * 8, ph: R() * 6, n, sc: 1.2 + R() * 0.8 });
    }
    // birds
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
    // airliner
    const pl = this._plane;
    if (pl) {
      pl.x += pl.v * pl.dir * dt; pl.y += pl.vy * dt;
      pl.trail.push([pl.x, pl.y]); if (pl.trail.length > 260) pl.trail.shift();
      if ((pl.dir > 0 && pl.x > W + 420) || (pl.dir < 0 && pl.x < -420)) { this._plane = null; this._planeT = 45 + R() * 60; return; }
      const a = tm === 2 ? 0.28 : tm === 1 ? 0.55 : 0.7, tr = pl.trail;
      if (tr.length > 3) {
        const g = ctx.createLinearGradient(tr[0][0], tr[0][1], pl.x, pl.y);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, tm === 1 ? `rgba(255,225,205,${a})` : `rgba(255,255,255,${a})`);
        ctx.strokeStyle = g; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1] - 1.5); for (const p of tr) ctx.lineTo(p[0], p[1] - 1.5); ctx.stroke();
        ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1] + 1.5); for (const p of tr) ctx.lineTo(p[0], p[1] + 1.5); ctx.stroke();
      }
      ctx.save(); ctx.translate(pl.x, pl.y); ctx.scale(pl.dir * 1.5, 1.5); ctx.rotate(Math.atan2(pl.vy, pl.v) * 0.6);
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
  },
});
