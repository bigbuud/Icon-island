// Thema "Aurora": poollicht boven een besneeuwde nachtelijke heuvelrug.
// Iconen = lichtjes: elk icoon krijgt een zachte gloed, het noorderlicht hangt dichter boven iconen
// en nabije iconen worden verbonden door fijne sterrenbeeld-lijnen.
IconIsland.theme({
  params: { intensity: 0.9, speed: 1, stars: 0.6, links: 1, palette: 0 },

  _stars: [], _bg: null, _grad: [],
  PALETTES: [            // [onder, midden, boven] per laag, plus kleur van de iconengloed
    { bands: ['#38ffb0', '#25d6a0', '#7a5cff'], glow: '120,255,200' },
    { bands: ['#b57bff', '#7a5cff', '#ff6fb5'], glow: '190,140,255' },
    { bands: ['#4bd2ff', '#3a86ff', '#9bf0ff'], glow: '120,200,255' },
  ],

  init(env, seed) {
    const r = env.rng(seed + 5), n = Math.round(env.W * env.H / 2600);
    this._stars = Array.from({ length: n }, () => ({ x: r() * env.W, y: Math.pow(r(), 1.6) * env.H * 0.8, s: 0.4 + r() * 1.3, p: r() * 6.28, f: 0.5 + r() * 2 }));
    this._seed = seed;
  },

  rebuild(env) {                                    // statische laag: hemel, sterrenstof en heuvels
    const { W, H, S } = env, c = document.createElement('canvas');
    c.width = env.cv.width; c.height = env.cv.height;
    const g = c.getContext('2d'); g.scale(S, S);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050a1c'); sky.addColorStop(0.55, '#0b1a35'); sky.addColorStop(1, '#16314a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const hz = H * 0.78, seed = this._seed || 1;
    // melkweg-achtige nevel
    for (let i = 0; i < 40; i++) {
      const x = env.hash(i, 1, seed) * W, y = env.hash(i, 2, seed) * H * 0.6, r = 80 + env.hash(i, 3, seed) * 220;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(120,150,255,0.035)'); rg.addColorStop(1, 'rgba(120,150,255,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // heuvels in twee lagen
    for (let layer = 0; layer < 2; layer++) {
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 8; x += 8) {
        const y = hz + layer * H * 0.06 - env.fbm(x / (260 - layer * 90), layer * 9, seed, 3) * H * (0.16 - layer * 0.03);
        g.lineTo(x, y);
      }
      g.lineTo(W, H); g.closePath();
      g.fillStyle = layer ? '#0a1626' : '#0e2133'; g.fill();
    }
    this._bg = c;
    // 1-pixel brede kleurverloop-strips voor de noorderlichtgordijnen
    this._grad = this.PALETTES.map(p => p.bands.map(col => {
      const s = document.createElement('canvas'); s.width = 1; s.height = 128;
      const sg = s.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, col); gr.addColorStop(0.9, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = gr; sg.fillRect(0, 0, 1, 128); return s;
    }));
  },

  frame(ctx, t, dt, env) {
    const { W, H, P } = env, tt = t * P.speed;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._bg, 0, 0, W, H);

    // sterren
    ctx.fillStyle = '#fff';
    for (const s of this._stars) {
      ctx.globalAlpha = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(tt * s.f + s.p))) * P.stars;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // noorderlicht: drie gordijnen, elk een rij verticale strips; hoogte volgt ruis, helderheid volgt iconen
    const pal = this.PALETTES[P.palette] || this.PALETTES[0], strips = this._grad[P.palette] || this._grad[0];
    ctx.globalCompositeOperation = 'lighter';
    const step = 7;
    for (let b = 0; b < 3; b++) {
      const base = H * (0.2 + b * 0.09), amp = H * (0.16 + b * 0.03);
      for (let x = 0; x < W + step; x += step) {
        const n1 = env.fbm(x / 340 + b * 7, tt * 0.07 + b, 3, 3), n2 = env.noise(x / 28 + tt * 0.35, b * 3 + tt * 0.1, 9);
        const near = env.influence(x, base + amp * 0.6, 160);
        const top = base + (n1 - 0.5) * amp * 2.1 - near * 40, h = amp * (0.7 + n1 * 0.9) * (1 + near * 0.35);
        const a = clampA((0.12 + n2 * 0.4) * P.intensity * (0.55 + n1 * 0.9) * (1 + near * 0.5) * (b === 1 ? 0.8 : 1));
        ctx.globalAlpha = a;
        ctx.drawImage(strips[b], 0, 0, 1, 128, x, top, step + 0.6, h);
      }
    }
    ctx.globalAlpha = 1;

    // gloed rond de iconen + sterrenbeeld-lijnen tussen buren
    const list = env.icons;
    for (const ic of list) {
      const cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2, r = Math.max(ic.w, ic.h) * (1.1 + 0.08 * Math.sin(tt * 1.3 + ic.x));
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(${pal.glow},${0.30 * ic.a})`); gr.addColorStop(0.5, `rgba(${pal.glow},${0.10 * ic.a})`); gr.addColorStop(1, `rgba(${pal.glow},0)`);
      ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    if (P.links) {
      ctx.lineWidth = 1; ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j], ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const d = Math.hypot(ax - bx, ay - by);
        if (d > 230) continue;
        ctx.strokeStyle = `rgba(${pal.glow},${(1 - d / 230) * 0.28 * Math.min(a.a, b.a)})`;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  },
});

function clampA(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
