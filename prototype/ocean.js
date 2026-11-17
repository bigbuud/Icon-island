// Thema "Ocean": bovenaanzicht van een turkoois-blauwe zee. Elk icoon is een eiland/zandbank met schuimrand
// en ondiep water; zeilbootjes drijven voorbij. Rekenwerk gebeurt op een grof raster (afstandsveld + kleur)
// dat opgeschaald wordt; het afstandsveld wordt alleen herberekend als iconen bewegen.
IconIsland.theme({
  params: { shore: 90, wave: 1, boats: 1 },

  _gw: 0, _gh: 0, _cell: 4, _D: null, _N: null, _small: null, _img: null, _u32: null, _sig: -1,
  _sparks: [], _boats: [], _bt: 0,

  init(env, seed) {
    const r = env.rng(seed + 31), W = env.W, H = env.H;
    this._sparks = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: r() * W, y: r() * H, f: 0.6 + r() * 1.6, p: r() * 6.28, l: 2 + r() * 4 }));
    this._boats = Array.from({ length: 3 }, (_, i) => {
      const dir = r() < 0.5 ? 1 : -1;
      return { x: r() * (W + 300) - 150, y: H * (0.12 + 0.76 * ((i + r() * 0.6) / 3)), v: (14 + r() * 10) * dir, ph: r() * 6.28, hull: r() < 0.5 ? '#c98a4f' : '#b55f44' };
    });
    this._seed = seed; this._sig = -1;
  },

  rebuild(env) {
    const { W, H } = env;
    const cell = Math.max(4, Math.sqrt(W * H / 70000));
    const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    this._cell = cell; this._gw = gw; this._gh = gh;
    this._D = new Float32Array(gw * gh);
    this._N = new Float32Array(gw * gh);           // statisch: diepteruis + kustvorm
    this._E = new Float32Array(gw * gh);
    const seed = this._seed || 1;
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell, k = j * gw + i;
      this._N[k] = env.fbm(x / 420, y / 420, seed + 3, 3);
      this._E[k] = (env.fbm(x / 55, y / 55, seed + 9, 3) - 0.5) * 26;    // golvende kustlijn
    }
    const s = document.createElement('canvas'); s.width = gw; s.height = gh;
    this._small = s; this._gc = s.getContext('2d');
    this._img = this._gc.createImageData(gw, gh); this._u32 = new Uint32Array(this._img.data.buffer);
    this._sig = -1;
  },

  _distances(env) {
    const list = env.icons, n = list.length, gw = this._gw, gh = this._gh, c = this._cell, D = this._D, E = this._E;
    for (let j = 0; j < gh; j++) {
      const y = (j + 0.5) * c;
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * c; let best = 1e9;
        for (let q = 0; q < n; q++) {
          const ic = list[q];
          const dx = Math.max(ic.x + 6 - x, 0, x - (ic.x + ic.w - 6)), dy = Math.max(ic.y + 4 - y, 0, y - (ic.y + ic.h - 4));
          const d = Math.sqrt(dx * dx + dy * dy) + (1 - ic.a) * 90;
          if (d < best) best = d;
        }
        D[j * gw + i] = best + E[j * gw + i] * (best < 90 ? 1 : 0);
      }
    }
  },

  frame(ctx, t, dt, env) {
    const { W, H, P } = env, list = env.icons;
    let sig = list.length;
    for (const ic of list) sig += ic.x * 1.3 + ic.y * 0.7 + ic.w + ic.h * 0.5 + ic.a * 97;
    if (sig !== this._sig) { this._sig = sig; this._distances(env); }

    const gw = this._gw, gh = this._gh, c = this._cell, D = this._D, N = this._N, u32 = this._u32;
    const tw = t * P.wave, shore = P.shore, inv = 1 / shore;
    const cl = (v, a, b) => v < a ? a : v > b ? b : v;
    const ss = (a, b, v) => { const x = cl((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
    const sh1 = t * 0.045, sh2 = t * 0.03;
    for (let j = 0; j < gh; j++) {
      const y = (j + 0.5) * c, row = j * gw;
      const ry = Math.sin(y * 0.03 + tw * 0.6) * 2, ry2 = y * 0.05, cyy = Math.sin(y * 0.005 - sh2 + 1.3);
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * c, k = row + i, d = D[k], nn = N[k];
        // diep water
        let r = 12 + nn * 26, g = 62 + nn * 54, b = 128 + nn * 50;
        // wolkenschaduw
        const cs = Math.sin(x * 0.0035 + sh1) * cyy;
        const shade = 1 - 0.22 * ss(0.35, 0.8, cs);
        // ondiep
        let s = d >= shore ? 0 : cl(1 - (d - 8) * inv, 0, 1); s = s * s * (3 - 2 * s);
        r += (92 - r) * s * 0.9; g += (212 - g) * s * 0.95; b += (205 - b) * s * 0.85;
        // golfkammen
        const rp = Math.sin(x * 0.045 + ry + tw * 0.9) + Math.sin(ry2 - x * 0.02 - tw * 0.5);
        const crest = ss(1.55, 1.95, rp) * (0.16 - 0.06 * s);
        r += (255 - r) * crest; g += (255 - g) * crest; b += (255 - b) * crest;
        // brekende schuimbanen richting kust
        if (d < shore * 0.95 && d > 8) {
          const p = d / 24 - tw * 0.12, f = p - Math.floor(p), band = Math.pow(Math.sin(f * 3.14159), 10) * (1 - d * inv / 0.95) * 0.5;
          r += (255 - r) * band; g += (255 - g) * band; b += (255 - b) * band;
        }
        r *= shade; g *= shade; b *= shade;
        // schuimrand
        const e = (d - 11 - 2.5 * Math.sin(tw * 1.3 + x * 0.05 + y * 0.03)) / 3.2, foam = Math.exp(-e * e) * 0.9;
        r += (255 - r) * foam; g += (255 - g) * foam; b += (255 - b) * foam;
        // zand
        const sand = ss(10.5, 7, d);
        if (sand > 0) {
          const wet = ss(7, 10, d);
          const gr = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 0.7) * 0.15;
          const sr = 241 - wet * 38 + gr * 4, sg = 220 - wet * 36 + gr * 4, sb = 168 - wet * 38;
          r += (sr - r) * sand; g += (sg - g) * sand; b += (sb - b) * sand;
        }
        u32[k] = (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);
      }
    }
    this._gc.putImageData(this._img, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this._small, 0, 0, gw * c, gh * c);

    // glinsteringen
    ctx.fillStyle = '#fff';
    for (const sp of this._sparks) {
      const k = Math.min(gh - 1, (sp.y / c) | 0) * gw + Math.min(gw - 1, (sp.x / c) | 0);
      if (D[k] < 14) continue;
      const a = Math.pow(Math.max(0, Math.sin(t * sp.f * (0.5 + 0.5 * P.wave) + sp.p)), 6) * 0.75;
      if (a < 0.03) continue;
      ctx.globalAlpha = a; ctx.fillRect(sp.x, sp.y, sp.l, 1.4);
    }
    ctx.globalAlpha = 1;

    // bootjes
    if (P.boats) for (const bt of this._boats) {
      bt.x += bt.v * dt;
      if (bt.v > 0 && bt.x > W + 150) bt.x = -150; else if (bt.v < 0 && bt.x < -150) bt.x = W + 150;
      const by = bt.y + Math.sin(t * 0.4 + bt.ph) * 8;
      const gi = Math.min(gh - 1, Math.max(0, (by / c) | 0)) * gw + Math.min(gw - 1, Math.max(0, (bt.x / c) | 0));
      const vis = ss(12, 55, D[gi] || 99);
      if (vis < 0.02) continue;
      const ang = Math.atan2(Math.cos(t * 0.4 + bt.ph) * 8 * 0.4, Math.abs(bt.v)) + (bt.v < 0 ? Math.PI : 0), dirx = Math.cos(ang), diry = Math.sin(ang);
      ctx.save(); ctx.translate(bt.x, by); ctx.globalAlpha = vis;
      ctx.lineCap = 'round';
      for (let q = 1; q <= 9; q++) {                       // kielwater
        const L = q * 7, sp = q * 1.6, a = (1 - q / 10) * 0.45;
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-dirx * L - diry * sp, -diry * L + dirx * sp); ctx.lineTo(-dirx * (L + 6) - diry * (sp + 1), -diry * (L + 6) + dirx * (sp + 1));
        ctx.moveTo(-dirx * L + diry * sp, -diry * L - dirx * sp); ctx.lineTo(-dirx * (L + 6) + diry * (sp + 1), -diry * (L + 6) - dirx * (sp + 1));
        ctx.stroke();
      }
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,30,60,0.25)'; ctx.beginPath(); ctx.ellipse(2, 3, 11, 4, 0, 0, 7); ctx.fill();   // schaduw
      ctx.fillStyle = bt.hull; ctx.beginPath(); ctx.ellipse(0, 0, 11, 3.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -9, 8, -1); ctx.lineTo(-6, 0); ctx.fill();   // zeil
      ctx.fillStyle = '#f2f6fa'; ctx.beginPath(); ctx.moveTo(-6, 0.5); ctx.quadraticCurveTo(0, 5, 6, 1.2); ctx.lineTo(-6, 0.5); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
});
