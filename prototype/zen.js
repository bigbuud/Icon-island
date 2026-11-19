// Theme "Zen garden": a calm, minimal Japanese sand garden seen from above. The sand is raked in long waves and rings around
// every group of icons; each group rests on its own mossy island with a rim of stones. Between them stand a few cherry,
// maple and ginkgo trees and stone lanterns. Petals drift slowly across, leaf shadows slide over the sand, and the light
// changes between morning, golden hour and a moonlit night (the lanterns glow, fireflies appear).
IconIsland.theme({
  params: { petals: 1, time: 0 },
  R: 44,
  PAL: [
    { sand: [233, 224, 203], moss: [[86, 128, 62], [128, 166, 84]], tint: null, dap: 0.06 },
    { sand: [240, 208, 160], moss: [[86, 118, 52], [140, 160, 70]], tint: 'rgba(255,140,50,0.12)', dap: 0.08 },
    { sand: [138, 148, 176], moss: [[40, 76, 70], [64, 108, 92]], tint: 'rgba(6,14,58,0.4)', dap: 0.035 },
  ],
  _Z: null, _comp: null, _tmp: null, _sandC: null, _moss: null, _virt: [], _sp: {}, _pet: [], _ff: [], _dap: [], _lan: [], _glow: null, _sig: '', _last: -9, _seed: 1, _key: '', _H: null,

  init(env, seed) { this._seed = seed; this._Z = new Zones(this.R, 20); this._sig = ''; this._key = ''; },
  _mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; },
  _spr(w, h, Q, fn) { const c = this._mk(w * Q, h * Q), g = c.getContext('2d'); g.scale(Q, Q); fn(g); return { img: c, w, h }; },
  _blur(g, px, fn) { g.save(); g.filter = 'blur(' + px + 'px)'; fn(g); g.restore(); },

  _rock(r, Q, sz) {
    const w = sz * 2.8, h = sz * 2.6, cx = w / 2, cy = h / 2 - 2;
    return this._spr(w, h, Q, g => {
      const pts = [], n = 9; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + (r() - 0.5) * 0.5, rr = sz * (0.78 + r() * 0.3); pts.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.92]); }
      const path = (gg, ox, oy, k) => { gg.beginPath(); for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const px = cx + (mx - cx) * k + ox, py = cy + (my - cy) * k + oy; if (i === 0) gg.moveTo(px, py); else gg.quadraticCurveTo(cx + (a[0] - cx) * k + ox, cy + (a[1] - cy) * k + oy, px, py); } const a0 = pts[0], b0 = pts[1]; gg.quadraticCurveTo(cx + (a0[0] - cx) * k + ox, cy + (a0[1] - cy) * k + oy, cx + ((a0[0] + b0[0]) / 2 - cx) * k + ox, cy + ((a0[1] + b0[1]) / 2 - cy) * k + oy); gg.closePath(); };
      this._blur(g, 3, g2 => { g2.fillStyle = 'rgba(30,24,14,0.42)'; path(g2, sz * 0.32, sz * 0.38, 1); g2.fill(); });
      const gr = g.createLinearGradient(cx - sz, cy - sz, cx + sz, cy + sz); gr.addColorStop(0, '#d4d2c8'); gr.addColorStop(0.5, '#9a9890'); gr.addColorStop(1, '#5e5c58'); g.fillStyle = gr; path(g, 0, 0, 1); g.fill();
      g.save(); path(g, 0, 0, 1); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.3)'; path(g, -sz * 0.12, -sz * 0.14, 0.7); g.fill();
      g.strokeStyle = 'rgba(30,30,28,0.35)'; g.lineWidth = 0.8; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx + (r() - 0.5) * sz, cy + (r() - 0.5) * sz); g.lineTo(cx + (r() - 0.5) * sz * 1.4, cy + (r() - 0.5) * sz * 1.2); g.stroke(); }
      for (let i = 0; i < 3; i++) { const mx = cx + (r() - 0.7) * sz * 1.1, my = cy + (r() - 0.8) * sz * 0.9; const mg = g.createRadialGradient(mx, my, 0.5, mx, my, sz * 0.38); mg.addColorStop(0, 'rgba(110,160,70,0.75)'); mg.addColorStop(1, 'rgba(90,140,60,0)'); g.fillStyle = mg; g.beginPath(); g.arc(mx, my, sz * 0.38, 0, 7); g.fill(); }
      g.restore(); g.strokeStyle = 'rgba(30,28,24,0.45)'; g.lineWidth = 0.9; path(g, 0, 0, 1); g.stroke();
    });
  },
  _tree(kind, r, Q) {
    const S0 = 230; const C = { cherry: ['#f6c4d6', '#ffe6ee', '#e88aac'], maple: ['#c8321e', '#f0762c', '#8e1c14'], ginkgo: ['#e8b82a', '#fff08a', '#c8861a'] }[kind], c = S0 / 2, R0 = 66 + r() * 8;
    return this._spr(S0, S0, Q, g => {
      for (let i = 0; i < 70; i++) { const a = r() * 6.283, d = R0 * (0.9 + r() * 0.8); g.fillStyle = C[0]; g.globalAlpha = 0.5 + r() * 0.4; g.beginPath(); g.ellipse(c + 8 + Math.cos(a) * d, c + 10 + Math.sin(a) * d, 2 + r() * 1.8, 1.2 + r(), r() * 3, 0, 7); g.fill(); } g.globalAlpha = 1;
      this._blur(g, 9, g2 => { g2.fillStyle = 'rgba(30,24,16,0.34)'; g2.beginPath(); g2.ellipse(c + 20, c + 24, R0 * 1.02, R0 * 0.94, 0, 0, 7); g2.fill(); });
      const blobs = []; for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 16 - layer * 4; i++) { const a = r() * 6.283, d = R0 * (0.1 + r() * 0.62) * (1 - layer * 0.2) + (layer === 0 ? R0 * 0.2 : 0), rr = R0 * (0.2 + r() * 0.16) * (1 - layer * 0.08); blobs.push([c + Math.cos(a) * d, c + Math.sin(a) * d - layer * 2.5, rr, layer]); }
      for (const [x, y, rr, layer] of blobs) { const gr = g.createRadialGradient(x - rr * 0.4, y - rr * 0.45, 1, x, y, rr); gr.addColorStop(0, layer === 2 ? C[1] : C[0]); gr.addColorStop(0.7, C[0]); gr.addColorStop(1, layer === 0 ? C[2] : C[0]); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      for (let i = 0; i < 160; i++) { const a = r() * 6.283, d = R0 * Math.sqrt(r()) * 1.02; g.fillStyle = r() < 0.5 ? C[1] : C[2]; g.globalAlpha = 0.45; g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d - 2, 0.9 + r() * 2.2, 0, 7); g.fill(); } g.globalAlpha = 1;
    });
  },
  _lantern(Q) {
    return this._spr(80, 80, Q, g => {
      this._blur(g, 4, g2 => { g2.fillStyle = 'rgba(30,24,16,0.4)'; g2.beginPath(); g2.arc(46, 48, 16, 0, 7); g2.fill(); });
      const oct = (rad, rot) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i / 8 * 6.283; i ? g.lineTo(40 + Math.cos(a) * rad, 40 + Math.sin(a) * rad) : g.moveTo(40 + Math.cos(a) * rad, 40 + Math.sin(a) * rad); } g.closePath(); };
      let gr = g.createLinearGradient(24, 24, 56, 56); gr.addColorStop(0, '#c6c4ba'); gr.addColorStop(1, '#6a6862'); g.fillStyle = gr; oct(16, 0.39); g.fill(); g.strokeStyle = 'rgba(30,28,24,0.55)'; g.lineWidth = 1; g.stroke();
      gr = g.createLinearGradient(28, 28, 52, 52); gr.addColorStop(0, '#d8d6cc'); gr.addColorStop(1, '#8a8880'); g.fillStyle = gr; oct(10.5, 0.39); g.fill();
      g.strokeStyle = 'rgba(40,38,34,0.45)'; g.lineWidth = 0.8; for (let i = 0; i < 8; i++) { const a = 0.39 + i / 8 * 6.283; g.beginPath(); g.moveTo(40, 40); g.lineTo(40 + Math.cos(a) * 16, 40 + Math.sin(a) * 16); g.stroke(); }
      g.fillStyle = '#b4b2a8'; g.beginPath(); g.arc(40, 40, 3.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(39, 39, 1.4, 0, 7); g.fill();
    });
  },

  rebuild(env) {
    const { W, H, S, P } = env, cw = env.cv.width, ch = env.cv.height, seed = this._seed || 1, r = env.rng(seed + 307), Z = this._Z, tm = P.time | 0, pal = this.PAL[tm] || this.PAL[0], Q = S * 1.5, cl = env.clamp;
    Z.resize(env); this._comp = this._mk(cw, ch); this._tmp = this._mk(cw, ch); this._key = String(tm); this._sig = '';
    const sc = 2, lw = this._lw = Math.ceil(W / sc) + 2, lh = this._lh = Math.ceil(H / sc) + 2; this._sandC = this._mk(lw, lh); this._H = new Float32Array(lw * lh);
    // ---- sprites
    const sp = this._sp = { rocks: [], trees: {}, lantern: this._lantern(Q) };
    for (let i = 0; i < 6; i++) sp.rocks.push(this._rock(r, Q, 10 + i * 2.6));
    for (const k of ['cherry', 'maple', 'ginkgo']) sp.trees[k] = this._tree(k, r, Q);
    // ---- islands that are always there: a tree, a lantern or a cluster of rocks
    this._virt = []; const n = cl(Math.round(W * H / 330000), 3, 8), kinds = ['cherry', 'maple', 'ginkgo', 'lantern', 'rocks', 'cherry', 'lantern', 'maple'];
    for (let a = 0; a < 300 && this._virt.length < n; a++) { const x = 130 + r() * (W - 260), y = 110 + r() * (H - 250); if (this._virt.some(v => Math.hypot(v.cx - x, v.cy - y) < 330)) continue; const kind = kinds[this._virt.length % kinds.length]; this._virt.push({ kind, cx: x, cy: y, x: x - 6, y: y - 6, w: kind === 'rocks' ? 26 : 12, h: kind === 'rocks' ? 14 : 12, a: 1, rot: r() * 6, rk: (r() * 6) | 0 }); }
    // ---- moss texture
    const lwm = Math.ceil(W / 2) + 2, lhm = Math.ceil(H / 2) + 2, mc = this._mk(lwm, lhm), mg = mc.getContext('2d'), im = mg.createImageData(lwm, lhm), u = new Uint32Array(im.data.buffer), m0 = pal.moss[0], m1 = pal.moss[1];
    for (let j = 0; j < lhm; j++) for (let i = 0; i < lwm; i++) { const x = i * 2, y = j * 2, t = cl(env.fbm(x / 26, y / 26, seed + 3, 3) * 1.5 - 0.25, 0, 1), f = 0.92 + env.hash(i, j, seed + 4) * 0.16; u[j * lwm + i] = 255 << 24 | Math.min(255, (m0[2] + (m1[2] - m0[2]) * t) * f) << 16 | Math.min(255, (m0[1] + (m1[1] - m0[1]) * t) * f) << 8 | Math.min(255, (m0[0] + (m1[0] - m0[0]) * t) * f); }
    mg.putImageData(im, 0, 0);
    const mt = this._moss = this._mk(cw, ch), b = mt.getContext('2d'); b.scale(S, S); b.imageSmoothingEnabled = true; b.drawImage(mc, 0, 0, lwm * 2, lhm * 2);
    for (let i = 0; i < W * H / 260; i++) { const x = r() * W, y = r() * H; b.fillStyle = r() < 0.5 ? 'rgba(210,235,160,0.35)' : 'rgba(10,40,20,0.28)'; b.beginPath(); b.arc(x, y, 0.8 + r() * 1.8, 0, 7); b.fill(); }
    for (let i = 0; i < W * H / 5000; i++) { const x = r() * W, y = r() * H; b.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 4; k++) { b.beginPath(); b.arc(x + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 0.8 + r() * 0.5, 0, 7); b.fill(); } }
    // ---- drifting things
    this._pet = Array.from({ length: Math.round(34 * (+P.petals || 0)) }, () => ({ x: r() * W, y: r() * H, v: 12 + r() * 12, vx: 8 + r() * 12, rot: r() * 6, vr: (r() - 0.5) * 1.6, s: 3 + r() * 2.6, ph: r() * 6, c: r() < 0.6 ? 0 : r() < 0.6 ? 1 : 2 }));
    this._ff = tm === 2 ? Array.from({ length: 16 }, () => ({ x: r() * W, y: r() * H, a: r() * 6.28, ph: r() * 6 })) : [];
    this._dap = [0, 1].map(k => { const T = 340, c = this._mk(T * S, T * S), g = c.getContext('2d'); g.scale(S, S); g.filter = 'blur(7px)'; g.fillStyle = '#000'; for (let i = 0; i < 20; i++) { const x = r() * T, y = r() * T, rx = 14 + r() * 26, ry = 10 + r() * 20, rot = r() * 3; for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) { g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, rot, 0, 7); g.fill(); } } return c; });
    const gs = this._glow = this._mk(128, 128), gg = gs.getContext('2d'), grd = gg.createRadialGradient(64, 64, 2, 64, 64, 64); grd.addColorStop(0, 'rgba(255,210,120,0.85)'); grd.addColorStop(0.4, 'rgba(255,170,70,0.3)'); grd.addColorStop(1, 'rgba(255,150,50,0)'); gg.fillStyle = grd; gg.fillRect(0, 0, 128, 128);
  },

  // ---------- the raked sand and the islands (cached until the icons move)
  _compose(env) {
    const { W, H, S, P } = env, Z = this._Z, R = this.R, tm = P.time | 0, pal = this.PAL[tm] || this.PAL[0], o = this._comp.getContext('2d'), cl = env.clamp;
    Z.update(env.icons.concat(this._virt));
    const lw = this._lw, lh = this._lh, sc = 2, Hh = this._H, Ds = Z.Ds, gw = Z.gw, gh = Z.gh, cell = Z.cell, TAU = 6.283185;
    const samp = (x, y) => { const fx = x / cell - 0.5, fy = y / cell - 0.5; let i = Math.floor(fx), j = Math.floor(fy); const tx = fx - i, ty = fy - j; i = i < 0 ? 0 : i >= gw - 1 ? gw - 2 : i; j = j < 0 ? 0 : j >= gh - 1 ? gh - 2 : j; const k = j * gw + i; return (Ds[k] * (1 - tx) + Ds[k + 1] * tx) * (1 - ty) + (Ds[k + gw] * (1 - tx) + Ds[k + gw + 1] * tx) * ty; };
    const Dm = new Float32Array(lw * lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const x = i * sc, y = j * sc, d = samp(x, y), w0 = cl(1 - (d - R) / 240, 0, 1), w = w0 * w0 * (3 - 2 * w0);
      const p1 = (y + 26 * Math.sin(x / 260 + 0.8) + 10 * Math.sin(x / 90 + y / 210)) / 15, v1 = 0.5 + 0.5 * Math.cos(TAU * p1), h1 = Math.pow(v1, 1.5);
      let h2 = 0; if (w > 0.002) { const v2 = 0.5 + 0.5 * Math.cos(TAU * d / 15); h2 = Math.pow(v2, 1.5); }
      Hh[j * lw + i] = h1 * (1 - w) + h2 * w; Dm[j * lw + i] = d;
    }
    const sandC = this._sandC, sg = sandC.getContext('2d'), im = sg.createImageData(lw, lh), u = new Uint32Array(im.data.buffer), s0 = pal.sand;
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const k = j * lw + i, a = Hh[Math.max(0, j - 1) * lw + Math.max(0, i - 1)], b = Hh[Math.min(lh - 1, j + 1) * lw + Math.min(lw - 1, i + 1)], sh = (b - a) * 0.8, d = Dm[k];
      const occl = d > R ? 0.78 + 0.22 * cl((d - R) / 18, 0, 1) : 1, grain = 1 + (env.hash(i, j, 77) - 0.5) * 0.045 + (env.fbm(i / 40, j / 40, 12, 2) - 0.5) * 0.06, f = (1 + sh * 0.42 - (Hh[k] - 0.5) * 0.05) * occl * grain;
      u[k] = 255 << 24 | Math.max(0, Math.min(255, s0[2] * f)) << 16 | Math.max(0, Math.min(255, s0[1] * f)) << 8 | Math.max(0, Math.min(255, s0[0] * f));
    }
    sg.putImageData(im, 0, 0);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.imageSmoothingEnabled = true; o.drawImage(sandC, 0, 0, lw * sc * S, lh * sc * S);
    // moss islands
    const lines = Z.lines();
    o.setTransform(S, 0, 0, S, 0, 0); o.lineJoin = 'round'; o.lineCap = 'round';
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(40,30,14,0.2)'; o.lineWidth = 12; o.stroke(); }
    Z.paint(o, this._moss, this._tmp, S); o.setTransform(S, 0, 0, S, 0, 0);
    for (const line of lines) { if (line.length < 3) continue; o.beginPath(); line.forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.strokeStyle = 'rgba(20,40,16,0.45)'; o.lineWidth = 3.4; o.stroke(); o.strokeStyle = 'rgba(190,225,130,0.28)'; o.lineWidth = 1.2; o.stroke(); }
    // stones along the rim (hash on a world grid so they stay put while an icon moves)
    const seen = new Set(), big = [];
    for (const line of lines) for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = 0; d < L; d += 3) {
        const x = a[0] + (b[0] - a[0]) * d / L, y = a[1] + (b[1] - a[1]) * d / L, kx = Math.round(x / 10), ky = Math.round(y / 10), key = kx * 7919 + ky;
        if (seen.has(key)) continue; seen.add(key); const h = env.hash(kx, ky, 31);
        if (h < 0.3) { const sz = 2.4 + env.hash(kx, ky, 32) * 3.2, l = 150 + env.hash(kx, ky, 33) * 70; o.fillStyle = 'rgba(30,24,14,0.35)'; o.beginPath(); o.ellipse(x + 1.6, y + 2, sz * 1.1, sz * 0.8, 0, 0, 7); o.fill(); const gr = o.createRadialGradient(x - sz * 0.3, y - sz * 0.3, 0.3, x, y, sz); gr.addColorStop(0, `rgb(${l + 30},${l + 28},${l + 20})`); gr.addColorStop(1, `rgb(${l - 50},${l - 52},${l - 56})`); o.fillStyle = gr; o.beginPath(); o.ellipse(x, y, sz * 1.15, sz * 0.9, env.hash(kx, ky, 34) * 3, 0, 7); o.fill(); }
        else if (h > 0.965) big.push([x, y, env.hash(kx, ky, 35)]);
      }
    }
    for (const q of big) { const rk = this._sp.rocks[Math.floor(q[2] * 6) % 6]; o.drawImage(rk.img, q[0] - rk.w / 2, q[1] - rk.h / 2, rk.w, rk.h); }
    // what stands on the permanent islands
    this._lan = [];
    for (const v of this._virt) {
      if (v.kind === 'lantern') { const s = this._sp.lantern; o.drawImage(s.img, v.cx - 52, v.cy - 52, 104, 104); this._lan.push({ x: v.cx, y: v.cy }); const rk = this._sp.rocks[v.rk]; o.drawImage(rk.img, v.cx - 36 - rk.w / 2, v.cy + 18 - rk.h / 2, rk.w, rk.h); }
      else if (v.kind === 'rocks') { for (let i = 0; i < 4; i++) { const rk = this._sp.rocks[(v.rk + i * 2) % 6], a = v.rot + i * 1.7; o.drawImage(rk.img, v.cx + Math.cos(a) * 16 - rk.w / 2, v.cy + Math.sin(a) * 9 - rk.h / 2, rk.w, rk.h); } }
    }
    for (const v of this._virt) if (this._sp.trees[v.kind]) { const s = this._sp.trees[v.kind]; o.drawImage(s.img, v.cx - 115, v.cy - 115, s.w, s.h); }
    o.setTransform(1, 0, 0, 1, 0, 0);
  },

  frame(ctx, t, dt, env) {
    const { W, H, S, P } = env, Z = this._Z, tm = P.time | 0, pal = this.PAL[tm] || this.PAL[0];
    if (this._key !== String(tm) || !this._comp) this.rebuild(env);
    const sig = Z.signature(env.icons);
    if (sig !== this._sig && (frameN - this._last >= 2 || !this._sig)) { this._sig = sig; this._last = frameN; this._compose(env); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(this._comp, 0, 0);
    // leaf shadows sliding over the sand
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let k = 0; k < 2; k++) { const p = ctx.createPattern(this._dap[k], 'repeat'), sp = k ? 3.5 : 7; p.setTransform(new DOMMatrix().translate((t * sp * (k ? -1 : 1) * S) % (340 * S), (t * sp * 0.45 * S) % (340 * S))); ctx.globalAlpha = pal.dap * (k ? 0.7 : 1); ctx.fillStyle = tm === 2 ? '#0a1030' : '#1e2a10'; ctx.fillStyle = p; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
    ctx.globalAlpha = 1;
    if (pal.tint) { ctx.fillStyle = pal.tint; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    // soft vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(20,16,8,0)'); vg.addColorStop(1, tm === 2 ? 'rgba(0,4,24,0.35)' : 'rgba(40,28,10,0.2)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // lantern glow
    if (tm > 0 && this._glow) { ctx.globalCompositeOperation = 'lighter'; for (const l of this._lan) { const fl = 0.85 + 0.15 * Math.sin(t * 5 + l.x) * Math.sin(t * 2.3 + l.y), sz = tm === 2 ? 190 : 120; ctx.globalAlpha = (tm === 2 ? 0.8 : 0.3) * fl; ctx.drawImage(this._glow, l.x - sz / 2, l.y - sz / 2, sz, sz); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    // petals
    const pc = [['#ffe2ec', '#f2a3bf'], ['#f08a3a', '#c8501c'], ['#f4d24a', '#d8a020']];
    for (const q of this._pet) {
      q.y += q.v * dt; q.x += (q.vx + Math.sin(t * 0.8 + q.ph) * 9) * dt; q.rot += q.vr * dt; if (q.y > H + 12) { q.y = -12; q.x = Math.random() * W; } if (q.x > W + 12) q.x = -12;
      const c = pc[q.c]; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); const sq = 0.6 + 0.4 * Math.abs(Math.sin(t * 1.3 + q.ph));
      ctx.fillStyle = 'rgba(40,30,14,0.16)'; ctx.beginPath(); ctx.ellipse(3, 4.5, q.s, q.s * 0.6 * sq, 0, 0, 7); ctx.fill();
      const gr = ctx.createLinearGradient(-q.s, 0, q.s, 0); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); ctx.fillStyle = tm === 2 ? c[1] : gr; ctx.beginPath(); ctx.ellipse(0, 0, q.s, q.s * 0.62 * sq, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    // fireflies
    if (this._ff.length) { ctx.globalCompositeOperation = 'lighter'; for (const f of this._ff) { f.a += (Math.sin(t * 0.7 + f.ph) * 1.2) * dt; f.x += Math.cos(f.a) * 12 * dt; f.y += Math.sin(f.a) * 12 * dt; if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10; ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + f.ph * 3)); ctx.drawImage(this._glow, f.x - 8, f.y - 8, 16, 16); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  },
});
