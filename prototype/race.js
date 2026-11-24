// Theme "Racetrack": a race circuit seen from above. The track is a closed loop that is bent around your icons, which sit in
// grassy infield "paddock" patches ringed with tyre walls (or hay bales / barriers). Racing cars, motorcycles and go-karts
// drive laps, overtake each other, and dive into the pit lane for a stop. Almost everything can be switched on or off:
// kerbs, gravel traps, grandstands, trees, billboards, a pond, marshal posts, tyre smoke, sparks, headlights at night ...
//
// Structure: geometry (_geom) -> static background layer (_paint, cached) -> moving vehicles and effects (frame).
IconIsland.theme({
  params: {
    vehicle: 0, count: 8, speed: 1, size: 1.1, overtake: 1, pits: 1, smoke: 1, sparks: 1,
    width: 58, layout: 1, surface: 0, kerbs: 1, racingLine: 1, tyreMarks: 1, gravel: 1, startLine: 1, pitLane: 1,
    grandstands: 1, tyreBarriers: 1, barriers: 1, trees: 1, billboards: 1, pond: 1, marshals: 1, stripes: 1,
    pad: 40, backdrop: 0, wall: 1,
    time: 0, clouds: 1, floodlights: 1
  },
  LIV: ['#d8322b', '#2f6fd6', '#f2c230', '#2aa876', '#f26b2a', '#8e4bd0', '#e9e9ee', '#e34b8a', '#22262e', '#29b6c9'],
  SURF: ['#3b3e44', '#6b6e73', '#26282c'],
  SHAD: [[3, 4], [8, 4], [2, 3]],
  KIND: [
    { len: 30, mult: 1.12 }, { len: 27, mult: 1.0 }, { len: 16, mult: 0.78 }, { len: 18, mult: 1.08 }
  ],
  _seed: 1, _Z: null, _zR: 0, _zW: 0, _zH: 0, _zsig: '', _isig: '', _chg: 0, _g: null, _gkey: '', _bg: null, _tmp: null, _tex: null,
  _veh: [], _part: [], _fleetKey: '', _boxes: [], _cl: null, _grain: null, _blade: null, _L0: 0, _sh: [3, 4],

  init(env, seed) {
    this._seed = seed; this._gkey = ''; this._fleetKey = ''; this._Z = null; this._zsig = ''; this._isig = ''; this._chg = 0; this._g = null; this._veh = [];
    const r = env.rng(seed + 5);
    this._cl = [0, 1, 2, 3].map(i => ({ x: r() * 1200, y: r() * 800, r: 160 + r() * 160, vx: 6 + r() * 8 }));
  },
  _mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; },
  _targets(env) { return env.icons.filter(ic => !ic.dying).map(ic => ({ x: ic.tx === undefined ? ic.x : ic.tx, y: ic.ty === undefined ? ic.y : ic.ty, w: ic.tw === undefined ? ic.w : ic.tw, h: ic.th === undefined ? ic.h : ic.th, a: 1 })); },
  _sigOf(list) { let s = list.length; for (const ic of list) s += Math.round(ic.x) * 3 + Math.round(ic.y) * 7 + Math.round(ic.w) * 5 + Math.round(ic.h); return s + ':' + list.length; },
  rebuild(env) {
    const R = env.P.pad; if (!this._Z || this._zR !== R) { this._Z = new Zones(R, 20); this._zR = R; }
    this._Z.resize(env); this._bg = null; this._chg = performance.now() / 1000 - 1; this._build(env);
  },
  _build(env) {
    const Z = this._Z; if (!Z) return;
    if (this._zR !== env.P.pad) { this._Z = new Zones(env.P.pad, 20); this._zR = env.P.pad; this._Z.resize(env); }
    const list = this._targets(env); this._bsig = this._sigOf(list); this._Z.update(list);
    this._geom(env); this._paint(env, env.cv.width, env.cv.height); this._fleet(env); this._bkey = this._pkey(env);
  },
  _pkey(env) { const P = env.P; return [P.width, P.layout, P.surface, P.kerbs, P.racingLine, P.tyreMarks, P.gravel, P.startLine, P.pitLane, P.grandstands, P.tyreBarriers, P.barriers, P.trees, P.billboards, P.pond, P.marshals, P.stripes, P.pad, P.backdrop, P.wall, P.time, P.floodlights].join(','); },
  iconsChanged(env) { this._chg = this._chg || performance.now() / 1000; },

  // ------------------------------------------------------------------ geometry
  _geom(env) {
    const { W, H, P } = env, r = env.rng(this._seed * 7 + 13), Z = this._Z, R = this._zR, hw = P.width / 2, kb = 8, lay = P.layout | 0;
    const m = hw + kb + 24, X0 = m, X1 = W - m, Y0 = m, Y1 = H - TASKBAR - m, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, rx = (X1 - X0) / 2, ry = (Y1 - Y0) / 2;
    let N = lay === 1 ? 72 : 40, pts = []; const NA = lay === 1 ? 7 : 4, hm = [];
    if (lay === 1) [3, 4, 6, 8, 10, 13].forEach(k => hm.push({ a: 0.1 + 0.05 * r(), k, p: r() * 6.283 }));
    else for (let i = 0; i < 5; i++) hm.push({ a: lay === 2 ? 0.02 + 0.02 * r() : 0.075 + 0.05 * r(), k: [2, 3, 5, 7, 9][i], p: r() * 6.283 });
    const amp = hm.reduce((a, h) => a + h.a, 0), n = lay === 2 ? 3.6 : 2.4;
    for (let i = 0; i < N; i++) {
      const th = i / N * 6.283, c = Math.cos(th), s = Math.sin(th);
      let rad = 1; for (const h of hm) rad += h.a * Math.sin(h.k * th + h.p);
      const sc = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n), f = Math.min(1, rad / (1 + amp * (lay === 1 ? 0.3 : 0.45))) * 0.99;
      pts.push([cx + rx * c * sc * f, cy + ry * s * sc * f]);
    }
    const need = hw + kb + 16, sep = 2 * (hw + kb) + 16;
    const gp = lay === 1 ? this._gridTrack(env, r, X0, X1, Y0, Y1, 2 * (hw + kb) + 44, need) : null;
    if (gp) { pts = gp; N = pts.length; }
    for (let it = 0; it < (gp ? 0 : 80); it++) {
      for (let i = 0; i < N; i++) {
        const p = pts[i], d = Z.ds(p[0], p[1]) - R;
        if (d < need) {
          const e = 6, gx = Z.ds(p[0] + e, p[1]) - Z.ds(p[0] - e, p[1]), gy = Z.ds(p[0], p[1] + e) - Z.ds(p[0], p[1] - e), l = Math.hypot(gx, gy) || 1, k = Math.min(14, (need - d) * 0.6);
          p[0] += gx / l * k; p[1] += gy / l * k;
        }
        p[0] = Math.max(X0, Math.min(X1, p[0])); p[1] = Math.max(Y0, Math.min(Y1, p[1]));
      }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const cd = Math.min(j - i, N - (j - i)); if (cd < NA) continue;
        const a = pts[i], b = pts[j], dx = b[0] - a[0], dy = b[1] - a[1], dd = Math.hypot(dx, dy);
        if (dd < sep && dd > 0.01) { const k = (sep - dd) * 0.22 / dd; a[0] -= dx * k; a[1] -= dy * k; b[0] += dx * k; b[1] += dy * k; }
      }
      const q = pts.map(p => p.slice());
      for (let i = 0; i < N; i++) { const a = q[(i + N - 1) % N], b = q[(i + 1) % N]; const w0 = lay === 1 ? 0.94 : 0.88, w1 = (1 - w0) / 2; pts[i][0] = q[i][0] * w0 + (a[0] + b[0]) * w1; pts[i][1] = q[i][1] * w0 + (a[1] + b[1]) * w1; }
    }
    // Catmull-Rom spline -> dense polyline -> uniform resampling
    let dense = [];
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i + N - 1) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      for (let s = 0; s < 14; s++) {
        const t = s / 14, t2 = t * t, t3 = t2 * t;
        dense.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    const resample = (poly, step) => {
      const n0 = poly.length, cum = [0]; for (let i = 1; i <= n0; i++) { const a = poly[i - 1], b = poly[i % n0]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
      const L = cum[n0], M = Math.max(40, Math.round(L / step)), ds = L / M, out = []; let j = 0;
      for (let i = 0; i < M; i++) { const t = i * ds; while (cum[j + 1] < t) j++; const a = poly[j], b = poly[(j + 1) % n0], f = (t - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
      return { out, L, M, ds };
    };
    let rs = resample(dense, 5);
    const curv = (o, ds) => {
      const M = o.length, th = []; for (let i = 0; i < M; i++) { const a = o[(i + M - 1) % M], b = o[(i + 1) % M]; th.push(Math.atan2(b[1] - a[1], b[0] - a[0])); }
      const k = []; for (let i = 0; i < M; i++) { let d = th[(i + 1) % M] - th[(i + M - 1) % M]; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; k.push(d / (2 * ds)); }
      return { th, k };
    };
    for (let pass = 0; pass < 10; pass++) {                     // keep corners wider than the track itself
      const cu = curv(rs.out, rs.ds); let mx = 0; for (const v of cu.k) mx = Math.max(mx, Math.abs(v));
      if (mx < 1 / (hw * 1.25)) break;
      const q = rs.out, M = q.length; dense = q.map((p, i) => { const a = q[(i + M - 1) % M], b = q[(i + 1) % M], c = q[(i + M - 2) % M], d = q[(i + 2) % M]; return [p[0] * 0.4 + (a[0] + b[0]) * 0.2 + (c[0] + d[0]) * 0.1, p[1] * 0.4 + (a[1] + b[1]) * 0.2 + (c[1] + d[1]) * 0.1]; });
      rs = resample(dense, 5);
    }
    let { out, L, M, ds } = rs;
    // rotate so the longest straight starts early in the lap (room for the pit entry before it)
    const cu0 = curv(out, ds), sm = (arr, w) => arr.map((_, i) => { let s = 0; for (let j = -w; j <= w; j++) s += arr[(i + j + arr.length * 4) % arr.length]; return s / (2 * w + 1); });
    const kw = sm(cu0.k, 18);
    let best = 0, bestStart = 0, run = 0, runStart = 0;
    for (let i = 0; i < M * 2; i++) { if (Math.abs(kw[i % M]) < 0.0035) { if (!run) runStart = i; run++; if (run > best && run <= M) { best = run; bestStart = runStart; } } else run = 0; }
    const shift = ((bestStart - 44) % M + M) % M;
    out = out.map((_, i) => out[(i + shift) % M]);
    const cu = curv(out, ds), ks = sm(sm(cu.k, 5), 4);
    const g = this._g = { M, ds, L, x: new Float32Array(M), y: new Float32Array(M), tx: new Float32Array(M), ty: new Float32Array(M), nx: new Float32Array(M), ny: new Float32Array(M), k: ks, hw, kb, lenS: best, fac: new Float32Array(M), ahead: new Float32Array(M), race: new Float32Array(M) };
    for (let i = 0; i < M; i++) {
      g.x[i] = out[i][0]; g.y[i] = out[i][1]; const t = cu.th[i]; g.tx[i] = Math.cos(t); g.ty[i] = Math.sin(t); g.nx[i] = -Math.sin(t); g.ny[i] = Math.cos(t);
      g.fac[i] = Math.max(0.42, Math.min(1, 1 - 16 * Math.abs(ks[i])));
    }
    for (let i = 0; i < M; i++) { let mn = 1; for (let j = 0; j < 16; j++) mn = Math.min(mn, g.fac[(i + j) % M]); g.ahead[i] = mn; }
    const kr = sm(ks, 30); for (let i = 0; i < M; i++) g.race[i] = Math.sign(kr[i]) * Math.min(1, Math.abs(kr[i]) / 0.016) * 0.55 * hw;
    // corners
    g.corners = []; let st = -1;
    for (let i = 0; i <= M; i++) {
      const hot = Math.abs(ks[i % M]) > 0.0085 && i < M;
      if (hot && st < 0) st = i;
      if (!hot && st >= 0) { if (i - st >= 6) { let pk = st, pv = 0; for (let j = st; j < i; j++) if (Math.abs(ks[j]) > pv) { pv = Math.abs(ks[j]); pk = j; } g.corners.push({ a: st, b: i - 1, sign: Math.sign(ks[pk]), peak: pk, kmax: pv }); } st = -1; }
    }
    // distance-to-track grid
    const cell = 6, gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2, Dt = new Float32Array(gw * gh).fill(1e4), rr = hw + kb + 110, rc = Math.ceil(rr / cell);
    for (let i = 0; i < M; i += 2) {
      const ci = Math.floor(g.x[i] / cell), cj = Math.floor(g.y[i] / cell);
      for (let j = Math.max(0, cj - rc); j <= Math.min(gh - 1, cj + rc); j++) for (let q = Math.max(0, ci - rc); q <= Math.min(gw - 1, ci + rc); q++) {
        const d = Math.hypot((q + 0.5) * cell - g.x[i], (j + 0.5) * cell - g.y[i]); if (d < Dt[j * gw + q]) Dt[j * gw + q] = d;
      }
    }
    g.Dt = Dt; g.gw = gw; g.gh = gh; g.cell = cell;
    // start/finish, pit lane, grandstand place (all on the longest straight)
    g.iS = 44 + Math.floor(best / 2); g.pit = null; g.stand = null;
    const okp = (x, y, mg) => x > mg && x < W - mg && y > mg && y < H - TASKBAR - mg && Z.ds(x, y) - R > mg * 0.5;
    if (best * ds >= 230) {
      const half = Math.min(best * ds * 0.42, 175), ih = Math.floor(half / ds), ia = g.iS - ih, ib = g.iS + ih;
      const d1 = hw + kb + 20, d2 = d1 + 15, dBld = d2 + 22, dSt = hw + kb + 32;
      const bad = side => { let v = 0; for (let i = ia - 6; i <= ib + 6; i += 3) for (const d of [d2 + 8, dBld + 12]) { const x = g.x[i] + g.nx[i] * d * side, y = g.y[i] + g.ny[i] * d * side; if (!okp(x, y, 6)) v++; } return v; };
      const bs = [bad(1), bad(-1)], side = bs[0] <= bs[1] ? 1 : -1;
      if (bs[Math.min(bs[0] <= bs[1] ? 0 : 1, 1)] === 0 || true) {
        const vb = side === 1 ? bs[0] : bs[1];
        if (vb === 0) g.pit = { ia, ib, side, d1, d2, dBld, ramp: 20, nb: Math.min(8, Math.floor((ib - ia - 8) / 5.6)) };
      }
      const sSide = g.pit ? -g.pit.side : 1;
      const badS = sd => { let v = 0; for (let i = ia - 4; i <= ib + 4; i += 3) for (const d of [dSt, dSt + 42]) { const x = g.x[i] + g.nx[i] * d * sd, y = g.y[i] + g.ny[i] * d * sd; if (!okp(x, y, 8) || Dt[Math.floor(y / cell) * gw + Math.floor(x / cell)] < d - 4) v++; } return v; };
      if (badS(sSide) === 0) g.stand = { a: ia - 4, b: ib + 4, side: sSide, d: dSt, depth: 40 };
      else if (!g.pit && badS(-sSide) === 0) g.stand = { a: ia - 4, b: ib + 4, side: -sSide, d: dSt, depth: 40 };
    }
    g.pitLat = i => { const p = g.pit; if (!p) return 0; const a = p.ia - p.ramp, b = p.ib + p.ramp; if (i < a || i > b) return 0; const sm = t => t * t * (3 - 2 * t); let t = 1; if (i < p.ia) t = sm((i - a) / p.ramp); else if (i > p.ib) t = sm((b - i) / p.ramp); return p.side * p.d1 * t; };
    this._L0 = this._L0 || L;
  },
  // Karting-style circuit: a random spanning tree over coarse blocks of free ground; the lap runs around the outline of that tree
  // (a Hamiltonian cycle over the fine cells), which gives hairpins, chicanes and switchbacks that fill the free screen area.
  _gridTrack(env, r, X0, X1, Y0, Y1, c, need) {
    const Z = this._Z, R = this._zR;
    let nx = Math.floor((X1 - X0) / c) + 1, ny = Math.floor((Y1 - Y0) / c) + 1; nx -= nx % 2; ny -= ny % 2;
    if (nx < 4 || ny < 2) return null;
    const sx = (X1 - X0) / (nx - 1), sy = (Y1 - Y0) / (ny - 1), px = i => X0 + i * sx, py = j => Y0 + j * sy;
    const free = (x, y) => Z.ds(x, y) - R >= need;
    const bx = nx / 2, by = ny / 2, ok = new Array(bx * by).fill(false);
    for (let j = 0; j < by; j++) for (let i = 0; i < bx; i++) {
      const x0 = px(2 * i), x1 = px(2 * i + 1), y0 = py(2 * j), y1 = py(2 * j + 1); let good = true;
      for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]]) if (!free(x, y)) { good = false; break; }
      ok[j * bx + i] = good;
    }
    // largest connected component
    const comp = new Array(bx * by).fill(-1); let best = [], cid = 0;
    for (let k = 0; k < bx * by; k++) {
      if (!ok[k] || comp[k] >= 0) continue; const q = [k], list = []; comp[k] = cid;
      while (q.length) { const a = q.pop(); list.push(a); const ai = a % bx, aj = (a / bx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i = ai + di, j = aj + dj; if (i < 0 || j < 0 || i >= bx || j >= by) continue; const b = j * bx + i; if (ok[b] && comp[b] < 0) { comp[b] = cid; q.push(b); } } }
      if (list.length > best.length) best = list; cid++;
    }
    if (best.length < 4) return null;
    // randomised Prim spanning tree
    const inT = new Set([best[Math.floor(r() * best.length)]]), edges = [], front = [], addF = a => { const ai = a % bx, aj = (a / bx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i = ai + di, j = aj + dj; if (i < 0 || j < 0 || i >= bx || j >= by) continue; const b = j * bx + i; if (ok[b] && comp[b] === comp[a]) front.push([a, b]); } };
    addF([...inT][0]);
    while (front.length) {
      const k = Math.floor(r() * front.length), [a, b] = front[k]; front[k] = front[front.length - 1]; front.pop();
      if (inT.has(b)) continue; inT.add(b); edges.push([a, b]); addF(b);
    }
    // fine-cell cycle
    const id = (fx, fy) => fy * nx + fx, adj = new Map(), link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
    const open = new Set(); for (const [a, b] of edges) { const ai = a % bx, aj = (a / bx) | 0, bi = b % bx, bj = (b / bx) | 0; if (bi === ai + 1) { open.add(a + 'R'); open.add(b + 'L'); link(id(2 * ai + 1, 2 * aj), id(2 * bi, 2 * bj)); link(id(2 * ai + 1, 2 * aj + 1), id(2 * bi, 2 * bj + 1)); } else if (bi === ai - 1) { open.add(a + 'L'); open.add(b + 'R'); link(id(2 * bi + 1, 2 * bj), id(2 * ai, 2 * aj)); link(id(2 * bi + 1, 2 * bj + 1), id(2 * ai, 2 * aj + 1)); } else if (bj === aj + 1) { open.add(a + 'D'); open.add(b + 'U'); link(id(2 * ai, 2 * aj + 1), id(2 * bi, 2 * bj)); link(id(2 * ai + 1, 2 * aj + 1), id(2 * bi + 1, 2 * bj)); } else { open.add(a + 'U'); open.add(b + 'D'); link(id(2 * bi, 2 * bj + 1), id(2 * ai, 2 * aj)); link(id(2 * bi + 1, 2 * bj + 1), id(2 * ai + 1, 2 * aj)); } }
    for (const k of best) { const i = k % bx, j = (k / bx) | 0, f = (a, b) => id(2 * i + a, 2 * j + b);
      if (!open.has(k + 'U')) link(f(0, 0), f(1, 0)); if (!open.has(k + 'R')) link(f(1, 0), f(1, 1)); if (!open.has(k + 'D')) link(f(0, 1), f(1, 1)); if (!open.has(k + 'L')) link(f(0, 0), f(0, 1)); }
    const start = id(2 * (best[0] % bx), 2 * ((best[0] / bx) | 0)), cyc = [start]; let prev = -1, cur = start;
    for (let n = 0; n < best.length * 4 + 2; n++) { const a = adj.get(cur); if (!a || a.length !== 2) return null; const nx2 = a[0] === prev ? a[1] : a[0]; if (nx2 === start) break; cyc.push(nx2); prev = cur; cur = nx2; }
    if (cyc.length !== best.length * 4) return null;
    const jit = Math.min(sx, sy) * 0.07;
    return cyc.map(k => [px(k % nx) + (r() - 0.5) * jit, py((k / nx) | 0) + (r() - 0.5) * jit]);
  },
  _td(x, y) { const g = this._g, i = Math.floor(x / g.cell), j = Math.floor(y / g.cell); return i < 0 || j < 0 || i >= g.gw || j >= g.gh ? 1e4 : g.Dt[j * g.gw + i]; },
  _ok(env, x, y, m, d) { return x > m && x < env.W - m && y > m && y < env.H - TASKBAR - m && this._Z.ds(x, y) - this._zR > m * 0.6 && this._td(x, y) > d - 4; },
  _off(a, b, d) { const g = this._g, M = g.M, out = []; for (let i = a; i <= b; i++) { const k = ((i % M) + M) % M, dd = typeof d === 'function' ? d(i) : d; out.push([g.x[k] + g.nx[k] * dd, g.y[k] + g.ny[k] * dd]); } return out; },
  _path(c, pts, close) { c.beginPath(); for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); if (close) c.closePath(); },
  _along(poly, step, fn) {
    let carry = 0;
    for (let j = 0; j < poly.length - 1; j++) {
      const a = poly[j], b = poly[j + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 0.01) continue; const ang = Math.atan2(dy, dx);
      let t = step - carry; while (t <= len) { fn(a[0] + dx * t / len, a[1] + dy * t / len, ang); t += step; } carry = len - (t - step);
    }
  },

  // ------------------------------------------------------------------ small sprites
  _tyre(c, x, y, r, i) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(x + this._sh[0] * 0.5, y + this._sh[1] * 0.5, r, 0, 7); c.fill();
    c.fillStyle = '#1d1d21'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = i % 2 ? '#d8d8dc' : '#c8352d'; c.lineWidth = r * 0.34; c.beginPath(); c.arc(x, y, r * 0.62, 0, 7); c.stroke();
    c.fillStyle = '#35353b'; c.beginPath(); c.arc(x, y, r * 0.3, 0, 7); c.fill();
  },
  _bale(c, x, y, ang, i) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(-7 + this._sh[0] * 0.5, -4 + this._sh[1] * 0.5, 14, 8);
    c.fillStyle = i % 2 ? '#d6b13e' : '#e2bf4a'; c.fillRect(-7, -4, 14, 8);
    c.strokeStyle = 'rgba(120,84,20,0.7)'; c.lineWidth = 0.8; c.strokeRect(-7, -4, 14, 8); c.beginPath(); c.moveTo(-2.5, -4); c.lineTo(-2.5, 4); c.moveTo(2.5, -4); c.lineTo(2.5, 4); c.stroke();
    c.restore();
  },
  _tree(c, x, y, r, kind, rr) {
    const sh = this._sh; c.fillStyle = 'rgba(8,28,10,0.3)'; c.beginPath(); c.ellipse(x + sh[0] * r / 5 + r * 0.15, y + sh[1] * r / 5 + r * 0.2, r * 1.05, r * 0.92, 0, 0, 7); c.fill();
    if (kind === 0) {
      const cols = ['#2c6a2b', '#3b8436', '#4f9d42', '#68b552'];
      for (let l = 0; l < 4; l++) for (let i = 0; i < 4 + (3 - l); i++) { const a = rr() * 6.283, d = r * (0.62 - l * 0.12) * Math.sqrt(rr()); c.fillStyle = cols[l]; c.beginPath(); c.arc(x + Math.cos(a) * d - l * 0.8, y + Math.sin(a) * d - l * 1.0, r * (0.5 - l * 0.07), 0, 7); c.fill(); }
    } else {
      for (let l = 0; l < 2; l++) { const R = r * (1 - l * 0.38); c.fillStyle = l ? '#2f7a3a' : '#1f5a2c'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rad = i % 2 ? R * 0.58 : R; c.lineTo(x + Math.cos(a) * rad - l, y + Math.sin(a) * rad - l); } c.closePath(); c.fill(); }
    }
  },

  // ------------------------------------------------------------------ static layer
  _paint(env, cw, ch) {
    const { W, H, S, P } = env, g = this._g, Z = this._Z, R = this._zR, tm = P.time | 0, hw = g.hw, kb = g.kb, M = g.M, rr = env.rng(this._seed * 31 + 7);
    this._sh = this.SHAD[tm] || this.SHAD[0];
    if (!this._bg || this._bg.width !== cw || this._bg.height !== ch) { this._bg = this._mk(cw, ch); this._tmp = this._mk(cw, ch); this._tex = this._mk(cw, ch); }
    if (!this._grain) {
      const gr = this._grain = this._mk(96, 96), gc = gr.getContext('2d'), q = env.rng(77);
      for (let i = 0; i < 900; i++) { gc.fillStyle = q() < 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)'; gc.fillRect(q() * 96, q() * 96, 1 + q() * 1.4, 1 + q() * 1.4); }
      const bl = this._blade = this._mk(128, 128), bc = bl.getContext('2d');
      for (let i = 0; i < 320; i++) { const x = q() * 128, y = q() * 128, l = 2 + q() * 4; bc.strokeStyle = q() < 0.5 ? 'rgba(30,70,20,0.2)' : 'rgba(200,235,140,0.2)'; bc.lineWidth = 0.9; bc.beginPath(); bc.moveTo(x, y); bc.lineTo(x + (q() - 0.5) * 2, y - l); bc.stroke(); }
    }
    const c = this._bg.getContext('2d'); c.setTransform(S, 0, 0, S, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt'; c.lineJoin = 'round'; c.setLineDash([]);
    const grass = ['#5d9a42', '#689a3f', '#3f7c3b'][tm];
    c.fillStyle = grass; c.fillRect(0, 0, W, H);
    c.fillStyle = c.createPattern(this._blade, 'repeat'); c.fillRect(0, 0, W, H);
    const nz = env.noise; for (let i = 0; i < 40; i++) { const x = rr() * W, y = rr() * H, r0 = 60 + rr() * 140; const gd = c.createRadialGradient(x, y, 0, x, y, r0); const dark = rr() < 0.5; gd.addColorStop(0, dark ? 'rgba(30,80,30,0.14)' : 'rgba(210,240,140,0.12)'); gd.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gd; c.fillRect(x - r0, y - r0, r0 * 2, r0 * 2); }
    if (P.stripes) {
      c.save(); c.translate(W / 2, H / 2); c.rotate(-0.3 + rr() * 0.6); const diag = Math.hypot(W, H);
      for (let i = -diag / 2, k = 0; i < diag / 2; i += 44, k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,30,0,0.055)'; c.fillRect(i, -diag / 2, 44, diag); }
      c.restore();
    }
    // pond (needs a free open spot)
    let pondBox = null;
    if (P.pond) {
      let bp = null, bd = 70;
      for (let n = 0; n < 160; n++) { const x = 60 + rr() * (W - 120), y = 60 + rr() * (H - TASKBAR - 120), d = Math.min(this._td(x, y) - hw - kb, Z.ds(x, y) - R, x - 20, W - 20 - x, H - TASKBAR - 20 - y); if (d > bd) { bd = d; bp = [x, y]; } }
      if (bp) {
        const rx0 = Math.min(bd * 0.8, 120), ry0 = rx0 * (0.55 + rr() * 0.2), pts = []; pondBox = [bp[0], bp[1], rx0 * 1.25], ph = rr() * 6.28;
        for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, k = 1 + 0.12 * Math.sin(3 * a + ph) + 0.07 * Math.sin(5 * a + ph * 2); pts.push([bp[0] + Math.cos(a) * rx0 * k, bp[1] + Math.sin(a) * ry0 * k]); }
        this._path(c, pts, true); c.fillStyle = '#c7d6a0'; c.shadowColor = 'rgba(0,0,0,0)'; c.lineWidth = 9; c.strokeStyle = '#bccf8c'; c.stroke(); c.fill();
        c.save(); this._path(c, pts, true); c.clip(); const wg = c.createLinearGradient(bp[0] - rx0, bp[1] - ry0, bp[0] + rx0, bp[1] + ry0); wg.addColorStop(0, '#62b4d2'); wg.addColorStop(1, '#2d7ba6'); c.fillStyle = wg; c.fillRect(bp[0] - rx0 - 12, bp[1] - ry0 - 12, rx0 * 2 + 24, ry0 * 2 + 24);
        c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(bp[0] + (rr() - 0.5) * rx0, bp[1] + (rr() - 0.5) * ry0, 6 + rr() * 10, 2 + rr() * 3, 0, 0, 7); c.stroke(); } c.restore();
        this._path(c, pts, true); c.strokeStyle = 'rgba(40,90,60,0.55)'; c.lineWidth = 1.2; c.stroke();
        for (let i = 0; i < 12; i++) { const a = rr() * 6.283, x = bp[0] + Math.cos(a) * rx0 * 1.02, y = bp[1] + Math.sin(a) * ry0 * 1.02; c.strokeStyle = '#3b6b2a'; c.lineWidth = 1; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x + j * 1.5, y); c.lineTo(x + j * 1.5 + (rr() - 0.5) * 2, y - 6 - rr() * 4); c.stroke(); } }
      }
    }
    // infield patches around the icons
    if ((P.backdrop | 0) !== 2) {
      const t = this._tex.getContext('2d'); t.setTransform(S, 0, 0, S, 0, 0); t.clearRect(0, 0, W, H);
      if ((P.backdrop | 0) === 0) { t.fillStyle = '#79b055'; t.fillRect(0, 0, W, H); t.fillStyle = t.createPattern(this._blade, 'repeat'); t.fillRect(0, 0, W, H); for (let x = 0, k = 0; x < W; x += 10, k++) { t.fillStyle = k % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,40,0,0.05)'; t.fillRect(x, 0, 10, H); } }
      else { t.fillStyle = '#b6b4ab'; t.fillRect(0, 0, W, H); t.strokeStyle = 'rgba(60,56,48,0.22)'; t.lineWidth = 1; for (let x = 0; x < W; x += 26) { t.beginPath(); t.moveTo(x, 0); t.lineTo(x, H); t.stroke(); } for (let y = 0; y < H; y += 26) { t.beginPath(); t.moveTo(0, y); t.lineTo(W, y); t.stroke(); } t.fillStyle = t.createPattern(this._grain, 'repeat'); t.fillRect(0, 0, W, H); }
      Z.paint(c, this._tex, this._tmp, S); c.setTransform(S, 0, 0, S, 0, 0);
    }
    // gravel traps on the outside of fast corners
    const ex = (x, y, mg) => this._ok(env, x, y, mg, 0);
    if (P.gravel) for (const cr of g.corners) {
      if (cr.kmax < 0.011) continue; const od = -cr.sign, A = cr.a - 5, B = cr.b + 5, d0 = hw + kb, d1 = d0 + 26;
      const inn = this._off(A, B, d0 * od), out = this._off(A, B, d1 * od); let fine = true; for (let i = 0; i < out.length; i += 3) { const p = out[i]; if (!this._ok(env, p[0], p[1], 8, d1 - 2)) { fine = false; break; } }
      if (!fine) continue; this._path(c, inn.concat(out.slice().reverse()), true); c.fillStyle = '#d9c48c'; c.fill(); c.fillStyle = c.createPattern(this._grain, 'repeat'); c.fill();
      c.strokeStyle = 'rgba(110,90,50,0.5)'; c.lineWidth = 1; this._path(c, out, false); c.stroke(); cr.gravel = true;
    }
    // asphalt
    const loop = this._off(0, M - 1, 0);
    c.lineJoin = 'round'; c.lineCap = 'round'; this._path(c, loop, true); c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = hw * 2 + 6; c.stroke();
    c.strokeStyle = this.SURF[P.surface | 0] || this.SURF[0]; c.lineWidth = hw * 2; this._path(c, loop, true); c.stroke();
    c.save(); c.globalAlpha = 0.65; c.strokeStyle = c.createPattern(this._grain, 'repeat'); this._path(c, loop, true); c.stroke(); c.restore();
    if (P.racingLine) { c.strokeStyle = 'rgba(0,0,0,0.17)'; c.lineWidth = hw * 0.55; this._path(c, this._off(0, M - 1, i => g.race[i]), true); c.stroke(); }
    // pit lane surface (same asphalt, wider) + tyre marks
    if (g.pit && P.pitLane) {
      const p = g.pit, lane = this._off(p.ia - p.ramp, p.ib + p.ramp, i => g.pitLat(i) * (1 + 0.82 * (p.d2 - p.d1) / p.d1 * 0 ) + p.side * 7 * Math.min(1, g.pitLat(i) * p.side / p.d1));
      c.lineCap = 'butt'; this._path(c, lane, false); c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 36; c.stroke(); c.strokeStyle = this.SURF[P.surface | 0] || this.SURF[0]; c.lineWidth = 33; c.stroke();
      c.save(); c.globalAlpha = 0.65; c.strokeStyle = c.createPattern(this._grain, 'repeat'); c.stroke(); c.restore();
      const wall = this._off(p.ia + 3, p.ib - 3, p.side * (hw + kb + 5)); this._path(c, wall, false); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 4; c.stroke(); c.strokeStyle = '#aeb3ba'; c.lineWidth = 2.6; c.stroke();
      c.setLineDash([8, 8]); c.strokeStyle = '#e9c93a'; c.lineWidth = 1.2; this._path(c, this._off(p.ia, p.ib, p.side * (p.d1 + 7.5)), false); c.stroke(); c.setLineDash([]);
      // garages
      const bd = p.dBld + 6; for (let k = 0; k <= p.nb; k++) { const i0 = p.ia + 6 + Math.round(k * 5.6), i1 = i0 + 4; if (i1 > p.ib - 2) break; const q = this._off(i0, i1, p.side * bd), w = this._off(i0, i1, p.side * (bd + 18)); this._path(c, q.concat(w.slice().reverse()), true); c.fillStyle = '#cbc5b8'; c.fill(); c.strokeStyle = 'rgba(40,36,30,0.6)'; c.lineWidth = 0.9; c.stroke();
        const dq = this._off(i0 + 1, i1 - 1, p.side * (bd + 1)); this._path(c, dq, false); c.strokeStyle = this.LIV[(k * 3 + this._seed) % 10]; c.lineWidth = 2.6; c.stroke(); }
      const roof = this._off(p.ia + 5, p.ib - 1, p.side * (bd + 9)); this._path(c, roof, false); c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 20; c.stroke();
    }
    // edge lines
    c.lineCap = 'butt'; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
    this._path(c, this._off(0, M - 1, hw - 3.5), true); c.stroke(); this._path(c, this._off(0, M - 1, -(hw - 3.5)), true); c.stroke();
    // kerbs on the inside of corners
    if (P.kerbs) for (const cr of g.corners) {
      const pts = this._off(cr.a - 3, cr.b + 3, cr.sign * (hw + 3.2)); this._path(c, pts, false); c.strokeStyle = '#cf3a32'; c.lineWidth = 6.5; c.setLineDash([]); c.stroke();
      c.setLineDash([9, 9]); c.strokeStyle = '#f4f4f2'; c.stroke(); c.setLineDash([]);
      const o2 = this._off(cr.a - 3, cr.b + 3, -cr.sign * (hw + 3)); this._path(c, o2, false); c.strokeStyle = '#cf3a32'; c.lineWidth = 6.5; c.stroke(); c.setLineDash([9, 9]); c.strokeStyle = '#f4f4f2'; c.stroke(); c.setLineDash([]);
    }
    if (P.tyreMarks) { c.lineCap = 'round'; for (const cr of g.corners) for (let n = 0; n < 5; n++) { const lat = (rr() - 0.5) * hw * 1.1 + g.race[cr.peak] * 0.4, a = cr.a - 6 - Math.floor(rr() * 3); c.strokeStyle = 'rgba(0,0,0,' + (0.18 + rr() * 0.16) + ')'; c.lineWidth = 1.3; this._path(c, this._off(a, a + 10 + Math.floor(rr() * 8), lat), false); c.stroke(); } c.lineCap = 'butt'; }
    // start/finish line and grid
    if (P.startLine && g.iS) {
      const i = g.iS, x = g.x[i], y = g.y[i], ang = Math.atan2(g.ty[i], g.tx[i]);
      c.save(); c.translate(x, y); c.rotate(ang); const nsq = Math.round(hw * 2 / 5); for (let q = 0; q < nsq; q++) for (let r2 = 0; r2 < 2; r2++) { c.fillStyle = (q + r2) % 2 ? '#f4f4f2' : '#1a1a1e'; c.fillRect(-5 + r2 * 5, -hw + q * (hw * 2 / nsq), 5, hw * 2 / nsq + 0.3); } c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; const slots = g.pit ? Math.min(10, Math.floor((i - g.pit.ia) / 5)) : Math.min(10, Math.floor(g.lenS / 4));
      for (let j = 0; j < slots; j++) { const k = i - 7 - j * 5, lat = (j % 2 ? 1 : -1) * hw * 0.45, f = (j % 2 ? 0 : 8) / g.ds; c.save(); c.translate(g.x[k] + g.nx[k] * lat, g.y[k] + g.ny[k] * lat); c.rotate(Math.atan2(g.ty[k], g.tx[k])); c.strokeRect(-6, -3.5, 12, 7); c.restore(); }
    }
    // tyre barriers (corners) and armco (straights)
    const standA = g.stand ? g.stand : null;
    if (P.tyreBarriers) for (const cr of g.corners) {
      const od = -cr.sign, d = hw + kb + (cr.gravel ? 31 : 8), pts = this._off(cr.a - 4, cr.b + 4, d * od); let fine = true; for (let i = 0; i < pts.length; i += 3) if (!this._ok(env, pts[i][0], pts[i][1], 7, d - 2)) { fine = false; break; } if (!fine) continue;
      let n = 0; this._along(pts, 10.5, (x, y) => this._tyre(c, x, y, 4.6, n++));
    }
    if (P.barriers) {
      let run = [], runs = [];
      for (let i = 0; i < M; i++) { if (Math.abs(g.k[i]) < 0.004) run.push(i); else { if (run.length > 18) runs.push(run); run = []; } } if (run.length > 18) runs.push(run);
      for (const rn of runs) {
        const side = rn[0] % 2 ? 1 : -1, d = hw + kb + 9, a = rn[3], b = rn[rn.length - 4]; if (g.pit && ((a < g.pit.ib + g.pit.ramp + 2 && b > g.pit.ia - g.pit.ramp - 2))) continue;
        if (standA && a < standA.b && b > standA.a) continue; const pts = this._off(a, b, d * side); let fine = true; for (let i = 0; i < pts.length; i += 4) if (!this._ok(env, pts[i][0], pts[i][1], 7, d - 2)) { fine = false; break; } if (!fine) continue;
        this._path(c, pts, false); c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 5; c.stroke(); c.strokeStyle = '#c4c9cf'; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#8d939b'; c.lineWidth = 0.9; c.stroke();
        this._along(pts, 22, (x, y) => { c.fillStyle = '#6d727a'; c.fillRect(x - 1, y - 1, 2, 2); });
      }
    }
    // grandstand
    if (g.stand && P.grandstands) {
      const s = g.stand, a = s.a, b = s.b, sd = s.side, bands = 4;
      const base = this._off(a, b, sd * s.d), top = this._off(a, b, sd * (s.d + s.depth)); this._path(c, base.concat(top.slice().reverse()), true); c.fillStyle = 'rgba(0,0,0,0.25)'; c.save(); c.translate(this._sh[0], this._sh[1]); c.fill(); c.restore();
      for (let r2 = 0; r2 < bands; r2++) {
        const d0 = s.d + s.depth * r2 / bands, d1 = s.d + s.depth * (r2 + 1) / bands - 1.2;
        for (let i = a; i < b; i += 3) { const q = this._off(i, i + 3, sd * d0), w = this._off(i, i + 3, sd * d1); this._path(c, q.concat(w.slice().reverse()), true); const pick = Math.floor(rr() * 2.4); c.fillStyle = ['#c9423a', '#3d6fc4', '#e7e3d6'][((i / 3 | 0) + r2 * 2 + pick) % 3 === 0 ? 0 : ((i / 3 | 0) + r2) % 2 ? 1 : 2]; c.fill(); }
        for (let n = 0; n < (b - a) * 1.4; n++) { const i = a + rr() * (b - a), d = d0 + rr() * (d1 - d0), k = Math.floor(i) % M, x = g.x[k] + g.nx[k] * sd * d, y = g.y[k] + g.ny[k] * sd * d; c.fillStyle = ['#f3d2b0', '#2b2b34', '#e5483c', '#fff', '#2c76d2', '#f6d23a', '#7a4a2a'][Math.floor(rr() * 7)]; c.beginPath(); c.arc(x, y, 1.15, 0, 7); c.fill(); }
      }
      this._path(c, top, false); c.strokeStyle = '#8c8a82'; c.lineWidth = 2; c.stroke(); this._path(c, base, false); c.strokeStyle = '#d6d3c8'; c.lineWidth = 1.4; c.stroke();
      const rf = this._off(a + 2, b - 2, sd * (s.d + s.depth * 0.55)); this._path(c, rf, false); c.strokeStyle = 'rgba(0,0,0,0.13)'; c.lineWidth = s.depth * 0.7; c.save(); c.translate(this._sh[0] * 1.4, this._sh[1] * 1.4); c.stroke(); c.restore();
    }
    // billboards, marshal posts, light towers
    const used = []; if (P.billboards) {
      let n = 0; for (let i = 8; i < M - 8; i += 26) {
        let straight = true; for (let j = -8; j <= 8; j += 4) if (Math.abs(g.k[(i + j) % M]) > 0.004) straight = false; if (!straight) continue;
        if (g.pit && i > g.pit.ia - g.pit.ramp - 8 && i < g.pit.ib + g.pit.ramp + 8) continue; if (g.stand && i > g.stand.a - 8 && i < g.stand.b + 8) continue;
        const side = (n++ % 2) ? 1 : -1, d = hw + kb + 17, x = g.x[i] + g.nx[i] * side * d, y = g.y[i] + g.ny[i] * side * d; if (!this._ok(env, x, y, 12, d - 3)) continue;
        c.save(); c.translate(x, y); c.rotate(Math.atan2(g.ty[i], g.tx[i])); c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(-21 + this._sh[0], -3 + this._sh[1], 42, 6);
        const c1 = this.LIV[(i * 7 + this._seed) % 10], c2 = this.LIV[(i * 3 + this._seed + 4) % 10]; c.fillStyle = c1; c.fillRect(-21, -3, 42, 6); c.fillStyle = c2; c.fillRect(-21, -3, 12, 6); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-4, -1, 22, 2); c.restore();
      }
    }
    if (P.marshals) for (const cr of g.corners) {
      const od = -cr.sign, d = hw + kb + (cr.gravel ? 36 : 17), i = cr.peak, x = g.x[i] + g.nx[i] * od * d, y = g.y[i] + g.ny[i] * od * d; if (!this._ok(env, x, y, 12, d - 3)) continue;
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x - 4 + this._sh[0], y - 4 + this._sh[1], 8, 8); c.fillStyle = '#e6e2d4'; c.fillRect(x - 4, y - 4, 8, 8); c.fillStyle = '#c9423a'; c.fillRect(x - 5, y - 5, 10, 3); c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 6, y - 6); c.lineTo(x + 6, y + 3); c.stroke(); c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(x + 6, y - 6); c.lineTo(x + 13, y - 4); c.lineTo(x + 6, y - 1.5); c.fill();
    }
    // walls around the icon patches
    const wm = P.wall | 0;
    if (wm) {
      for (const poly of Z.lines()) {
        if (poly.length < 3) continue; let n = 0;
        if (wm === 1) this._along(poly, 10.8, (x, y) => this._tyre(c, x, y, 4.8, n++));
        else if (wm === 2) this._along(poly, 11, (x, y, a) => this._bale(c, x, y, a, n++));
        else { this._path(c, poly, false); c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 5; c.stroke(); c.strokeStyle = '#c4c9cf'; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#8d939b'; c.lineWidth = 0.9; c.stroke(); this._along(poly, 20, (x, y) => { c.fillStyle = '#6d727a'; c.fillRect(x - 1, y - 1, 2, 2); }); }
      }
    }
    // trees last (above everything), only on free grass
    if (P.trees > 0) {
      const want = Math.round(70 * P.trees * (W * (H - TASKBAR)) / (1920 * 1080)), placed = [];
      for (let n = 0; n < want * 14 && placed.length < want; n++) {
        const x = 12 + rr() * (W - 24), y = 12 + rr() * (H - TASKBAR - 24), r0 = 9 + rr() * 9, kind = rr() < 0.65 ? 0 : 1;
        if ((pondBox && Math.hypot(x - pondBox[0], y - pondBox[1]) < pondBox[2] + r0) || this._td(x, y) < hw + kb + r0 + 34 || Z.ds(x, y) - R < r0 + 10) continue; let hit = false; for (const q of placed) if (Math.hypot(q[0] - x, q[1] - y) < (q[2] + r0) * 0.9 + 3) { hit = true; break; } if (hit) continue;
        if (g.stand && g.stand.a) { /* keep clear of the stand */ } placed.push([x, y, r0, kind]);
      }
      placed.sort((a, b) => a[1] - b[1]); for (const q of placed) this._tree(c, q[0], q[1], q[2], q[3], rr);
    }
    // light of the day: tint, floodlights at night
    const tint = ['', 'rgba(255,150,50,0.14)', 'rgba(8,16,56,0.56)'][tm]; if (tint) { c.fillStyle = tint; c.fillRect(0, 0, W, H); }
    if (tm === 2 && P.floodlights) {
      c.globalCompositeOperation = 'lighter'; const towers = [];
      for (let i = 10; i < M; i += 36) { const side = (i / 36 | 0) % 2 ? 1 : -1, d = hw + kb + 22, x = g.x[i] + g.nx[i] * side * d, y = g.y[i] + g.ny[i] * side * d; if (!this._ok(env, x, y, 10, d - 3)) continue; towers.push([x, y]); const gd = c.createRadialGradient(g.x[i], g.y[i], 0, g.x[i], g.y[i], 110); gd.addColorStop(0, 'rgba(255,236,180,0.42)'); gd.addColorStop(0.5, 'rgba(255,230,170,0.16)'); gd.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = gd; c.fillRect(g.x[i] - 110, g.y[i] - 110, 220, 220); }
      c.globalCompositeOperation = 'source-over'; for (const t of towers) { c.fillStyle = '#2a2d33'; c.beginPath(); c.arc(t[0], t[1], 2.6, 0, 7); c.fill(); c.fillStyle = '#fff4cc'; c.beginPath(); c.arc(t[0], t[1], 1.4, 0, 7); c.fill(); }
    }
  },

  // ------------------------------------------------------------------ vehicles
  _fleet(env) {
    const { P } = env, g = this._g, key = [P.vehicle, P.count, this._seed, g.M].join(','); if (key === this._fleetKey && this._veh.length) return;
    const r = env.rng(this._seed * 13 + 5), n = P.count | 0, scale = this._L0 && this._lastL ? g.L / this._lastL : 1; this._lastL = g.L;
    const old = this._veh; if (this._fleetKey && old.length) for (const v of old) v.s = (v.s * scale) % g.L;
    const mk = (i) => {
      const m = P.vehicle | 0, kind = m === 0 ? (r() < 0.45 ? (r() < 0.55 ? 0 : 1) : (r() < 0.5 ? 2 : 3)) : m === 1 ? (r() < 0.55 ? 0 : 1) : m === 2 ? 3 : 2;
      return { kind, col: this.LIV[(i * 3 + Math.floor(r() * 10)) % 10], col2: this.LIV[Math.floor(r() * 10)], helm: this.LIV[Math.floor(r() * 10)], s: (i / Math.max(1, n)) * g.L + r() * 30, v: 120, lat: (r() - 0.5) * g.hw * 0.7, off: (r() - 0.5) * g.hw * 0.5, base: 0.93 + r() * 0.14, state: 'race', pitCD: 8 + r() * 40, box: -1, stopT: 0, lean: 0, prevV: 120, hx: 0, hy: 0, ang: 0 };
    };
    if (!this._fleetKey || !old.length) this._veh = Array.from({ length: n }, (_, i) => mk(i));
    else { while (this._veh.length > n) this._veh.pop(); while (this._veh.length < n) this._veh.push(mk(this._veh.length)); this._veh.forEach(v => { if (v.state !== 'race') { v.state = 'race'; v.box = -1; } }); const m = P.vehicle | 0; if (m && this._fleetKey.split(',')[0] !== String(m)) this._veh = Array.from({ length: n }, (_, i) => mk(i)); }
    this._fleetKey = key; this._boxes = []; this._part = [];
  },
  _at(i) { const g = this._g, M = g.M, k = Math.floor(i), f = i - k, a = ((k % M) + M) % M, b = (a + 1) % M; return [g.x[a] + (g.x[b] - g.x[a]) * f, g.y[a] + (g.y[b] - g.y[a]) * f, g.nx[a] + (g.nx[b] - g.nx[a]) * f, g.ny[a] + (g.ny[b] - g.ny[a]) * f, g.k[a], a]; },
  _step(env, dt) {
    const { P } = env, g = this._g, V = this._veh, L = g.L, ds = g.ds, M = g.M, pit = g.pit && P.pitLane ? g.pit : null, hw = g.hw;
    const vmax = 255 * P.speed;
    for (const v of V) {
      const idx = (v.s / ds) % M, i0 = Math.floor(idx), kk = g.k[i0];
      let vt = vmax * this.KIND[v.kind].mult * v.base * g.ahead[i0], latT = g.race[i0] * 0.85 + v.off * (1 - Math.abs(g.race[i0]) / hw);
      let leader = null, lg = 1e9; for (const o of V) { if (o === v) continue; let d = o.s - v.s; if (d < 0) d += L; d -= (this.KIND[o.kind].len + this.KIND[v.kind].len) * P.size * 0.5; if (d < lg) { lg = d; leader = o; } }
      const inPit = v.state !== 'race';
      if (leader && lg < 58 && lg > -6) {
        const dl = leader.lat - v.lat, lim = inPit ? 9 : hw * 0.55;
        if (Math.abs(dl) < lim) {
          if (P.overtake && !inPit) { latT = leader.lat + (leader.lat > 0 ? -1 : 1) * hw * 0.78; latT = Math.max(-hw + 9, Math.min(hw - 9, latT)); vt = Math.max(vt, leader.v) * 1.05; if (lg < 14) vt = Math.min(vt, leader.v * 1.08); }
          else { vt = Math.min(vt, leader.v * (lg < 26 ? 0.88 : 0.97)); }
        }
      }
      // pit stops
      if (pit) {
        const entry = (pit.ia - pit.ramp - 6) * ds, exit = (pit.ib + pit.ramp) * ds;
        if (v.state === 'race') {
          v.pitCD -= dt;
          if (P.pits && v.pitCD <= 0 && v.s > entry && v.s < entry + 40 && lg > 30) { const free = []; for (let b = 0; b < pit.nb; b++) if (!this._boxes[b]) free.push(b); if (free.length) { v.box = free[Math.floor(Math.random() * free.length)]; this._boxes[v.box] = v; v.state = 'pit'; v.passed = false; } else v.pitCD = 10; }
        } else {
          const bs = (pit.ia + 8 + v.box * 5.6) * ds, ii = idx;
          latT = pit.side * pit.d1 * (ii < pit.ia ? 0 : 1); latT = g.pitLat(i0);
          if (v.state === 'pit') {
            if (ii < pit.ia - 4) vt = Math.min(vt, 110); else vt = Math.min(vt, 64);
            if (v.s > bs - 26) { latT = pit.side * (pit.d1 + 15); vt = Math.min(vt, 40); }
            if (v.s >= bs - 1.5 && v.s < bs + 20) { v.state = 'stop'; v.stopT = 2.2 + Math.random() * 1.6; }
          } else if (v.state === 'stop') { vt = 0; latT = pit.side * (pit.d1 + 15); v.stopT -= dt; if (v.stopT <= 0) v.state = 'out'; }
          else if (v.state === 'out') { latT = i0 < pit.ib ? pit.side * pit.d1 : g.pitLat(i0); vt = Math.min(vt, i0 < pit.ib ? 70 : 220); if (v.box >= 0 && this._boxes[v.box] === v) this._boxes[v.box] = null; v.box = -1; if (v.s > exit) { v.state = 'race'; v.pitCD = 25 + Math.random() * 45; } }
          if (v.s > exit + 60 || (v.state === 'pit' && v.s > exit)) { if (v.box >= 0 && this._boxes[v.box] === v) this._boxes[v.box] = null; v.box = -1; v.state = 'race'; v.pitCD = 25 + Math.random() * 45; }
        }
      }
      const acc = vt > v.v ? 170 : 340; v.prevV = v.v; v.v += Math.max(-acc * dt, Math.min(acc * dt, vt - v.v)); v.v = Math.max(0, v.v);
      v.s = (v.s + v.v * dt) % L; v.lat += (latT - v.lat) * Math.min(1, dt * 3.2);
      v.lean += ((Math.max(-1, Math.min(1, kk * v.v * 0.075))) - v.lean) * Math.min(1, dt * 7);
      const p = this._at(v.s / ds), x = p[0] + p[2] * v.lat, y = p[1] + p[3] * v.lat, nxt = this._at(v.s / ds + 1.5), cur = this._at(v.s / ds - 1.5);
      const hx = (nxt[0] + nxt[2] * v.lat) - (cur[0] + cur[2] * v.lat), hy = (nxt[1] + nxt[3] * v.lat) - (cur[1] + cur[3] * v.lat);
      v.hx = x; v.hy = y; const ang = Math.atan2(hy, hx); v.ang = v.ang === undefined || !v.init ? ang : v.ang; let da = ang - v.ang; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; v.ang += da * Math.min(1, dt * 14); v.init = true; v.k = kk;
      // effects
      const slip = v.v * Math.abs(kk);
      if (P.smoke && v.kind !== 3 && slip > 4.3 && this._part.length < 220 && Math.random() < 0.5) this._part.push({ t: 0, life: 0.7 + Math.random() * 0.5, x: x - Math.cos(v.ang) * 9, y: y - Math.sin(v.ang) * 9, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, r: 2.5, smoke: 1 });
      if (P.sparks && (v.kind === 0 || v.kind === 1) && v.v > 215 && this._part.length < 220 && Math.random() < (P.time === 2 ? 0.1 : 0.03)) this._part.push({ t: 0, life: 0.25, x: x - Math.cos(v.ang) * 12, y: y - Math.sin(v.ang) * 12, vx: -Math.cos(v.ang) * 60 + (Math.random() - 0.5) * 60, vy: -Math.sin(v.ang) * 60 + (Math.random() - 0.5) * 60, r: 1, smoke: 0 });
      if (P.smoke && v.state === 'stop' && Math.random() < 0.05 && this._part.length < 220) this._part.push({ t: 0, life: 1, x: x - Math.cos(v.ang) * 10, y: y - Math.sin(v.ang) * 10, vx: 0, vy: -8, r: 2, smoke: 1 });
    }
    for (let i = this._part.length - 1; i >= 0; i--) { const q = this._part[i]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.t > q.life) this._part.splice(i, 1); }
  },
  _drawVeh(c, v, P) {
    const col = v.col, w = P.size; c.save(); c.translate(v.hx, v.hy); c.rotate(v.ang); c.scale(w, w);
    const body = (path, fill) => { c.fillStyle = fill; path(); c.fill(); };
    if (v.kind === 0) {
      c.fillStyle = '#17171b'; for (const [x, y, ww, h] of [[-14, -7, 7, 3.7], [-14, 3.3, 7, 3.7], [7, -6.6, 6, 3.2], [7, 3.4, 6, 3.2]]) c.fillRect(x, y, ww, h);
      c.fillStyle = '#26262c'; c.fillRect(-16, -6.4, 3.2, 12.8); c.fillStyle = col; c.fillRect(-16, -6.6, 3.2, 1.4); c.fillRect(-16, 5.2, 3.2, 1.4); c.fillStyle = '#26262c'; c.fillRect(12.8, -7, 2.6, 14); c.fillStyle = col; c.fillRect(12.8, -7, 2.6, 1.3); c.fillRect(12.8, 5.7, 2.6, 1.3);
      c.fillStyle = col; c.beginPath(); c.moveTo(-13, -3.2); c.lineTo(-2, -3.6); c.lineTo(7, -1.6); c.lineTo(15, -1.1); c.lineTo(15, 1.1); c.lineTo(7, 1.6); c.lineTo(-2, 3.6); c.lineTo(-13, 3.2); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(-3, -4.3, 5, 1.7, 0, 0, 7); c.ellipse(-3, 4.3, 5, 1.7, 0, 0, 7); c.fill(); c.fillStyle = v.col2; c.fillRect(-12, -0.7, 22, 1.4);
      c.fillStyle = v.helm; c.beginPath(); c.arc(-1, 0, 2.2, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.arc(-1, 0, 2.2, 0, 7); c.stroke();
    } else if (v.kind === 1) {
      c.fillStyle = '#17171b'; for (const x of [-9, 6]) for (const s of [-1, 1]) c.fillRect(x, s * 6.4 - 1, 6, 2);
      c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(-13.5, -6.2, 27, 12.4, 4.5) : c.rect(-13.5, -6.2, 27, 12.4); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.stroke();
      c.fillStyle = v.col2; c.fillRect(-13, -1.1, 26, 2.2); c.fillStyle = '#1b2530'; c.beginPath(); c.moveTo(2, -4.6); c.lineTo(6.2, -3.6); c.lineTo(6.2, 3.6); c.lineTo(2, 4.6); c.closePath(); c.fill(); c.fillRect(-10, -4, 3, 8);
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-6.5, -3.6, 8.5, 7.2); c.fillStyle = '#fff3b0'; c.fillRect(12.2, -5.6, 1.4, 2); c.fillRect(12.2, 3.6, 1.4, 2); c.fillStyle = '#d33'; c.fillRect(-13.4, -5.6, 1.2, 2); c.fillRect(-13.4, 3.6, 1.2, 2);
    } else if (v.kind === 2) {
      c.fillStyle = '#17171b'; c.fillRect(-9.2, -8.2, 5.2, 3.6); c.fillRect(-9.2, 4.6, 5.2, 3.6); c.fillRect(3, -6.8, 4, 2.6); c.fillRect(3, 4.2, 4, 2.6);
      c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(-8, -4.2, 15, 8.4, 2.6) : c.rect(-8, -4.2, 15, 8.4); c.fill(); c.fillStyle = '#2a2a30'; c.fillRect(7.4, -5.2, 2.2, 10.4); c.fillStyle = v.col2; c.beginPath(); c.arc(8, 0, 1.9, 0, 7); c.fill(); c.strokeStyle = '#2a2a30'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(3.2, -2.2); c.lineTo(3.2, 2.2); c.stroke();
      c.fillStyle = v.helm; c.beginPath(); c.arc(-2, 0, 2.6, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.arc(-2, 0, 2.6, 0, 7); c.stroke();
    } else {
      const ln = v.lean * 3.2;
      c.fillStyle = '#17171b'; c.fillRect(-9.5, -1, 4.6, 2); c.fillRect(5, -1, 4.6, 2); c.strokeStyle = '#34343a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-6, 0); c.lineTo(7, 0); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(1.6, ln * 0.35, 4.6, 2.3, 0, 0, 7); c.fill(); c.fillStyle = v.col2; c.fillRect(-3.4, -0.5 + ln * 0.35, 9, 1);
      c.fillStyle = '#23252b'; c.beginPath(); c.ellipse(-2.4, ln, 3.7, 2.7, 0, 0, 7); c.fill(); c.strokeStyle = '#2d2f36'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0.4, ln - 1.7); c.lineTo(4.6, -2.3 + ln * 0.2); c.moveTo(0.4, ln + 1.7); c.lineTo(4.6, 2.3 + ln * 0.2); c.stroke();
      c.strokeStyle = '#2a2a30'; c.lineWidth = 1; c.beginPath(); c.moveTo(5, -2.7 + ln * 0.2); c.lineTo(5, 2.7 + ln * 0.2); c.stroke(); c.fillStyle = v.helm; c.beginPath(); c.arc(1.2, ln, 2.3, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.arc(1.2, ln, 2.3, 0, 7); c.stroke();
    }
    c.restore();
  },

  frame(ctx, t, dt, env) {
    const { W, H, P } = env, tm = P.time | 0;
    if (this._g && this._bkey !== this._pkey(env)) this._chg = t - 1;
    if (this._chg && t - this._chg > 0.4) { this._chg = 0; this._build(env); }
    else if (!this._chg) { const sig = this._sigOf(this._targets(env)); if (this._bg && sig !== this._bsig) this._chg = t; }
    if (!this._g || !this._bg) { ctx.fillStyle = '#5d9a42'; ctx.fillRect(0, 0, W, H); return; }
    ctx.drawImage(this._bg, 0, 0, W, H);
    const g = this._g, step = Math.min(dt, 0.05); if (step > 0) this._step(env, step);
    const V = this._veh, sh = this._sh, size = P.size;
    // shadows
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (const v of V) { const len = this.KIND[v.kind].len * size; ctx.save(); ctx.translate(v.hx + sh[0] * 0.8 * size, v.hy + sh[1] * 0.8 * size); ctx.rotate(v.ang); ctx.beginPath(); ctx.ellipse(0, 0, len * 0.52, (v.kind === 3 ? 3.2 : 6.8) * size, 0, 0, 7); ctx.fill(); ctx.restore(); }
    // smoke
    for (const q of this._part) if (q.smoke) { const a = 1 - q.t / q.life; ctx.fillStyle = 'rgba(238,238,240,' + (0.32 * a * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r + q.t * 7, 0, 7); ctx.fill(); }
    for (const v of V) this._drawVeh(ctx, v, P);
    // pit crew
    for (const v of V) if (v.state === 'stop') { const nx = -Math.sin(v.ang), ny = Math.cos(v.ang), s = g.pit ? g.pit.side : 1; ctx.fillStyle = '#2b66c4'; for (let i = 0; i < 4; i++) { const a = i * 1.6 + v.stopT * 4, px = v.hx + Math.cos(v.ang) * (i % 2 ? 8 : -8) * size + nx * s * 9 * size, py = v.hy + Math.sin(v.ang) * (i % 2 ? 8 : -8) * size + ny * s * 9 * size; ctx.beginPath(); ctx.arc(px + Math.sin(a) * 0.8, py + Math.cos(a) * 0.8, 1.9, 0, 7); ctx.fill(); ctx.fillStyle = '#f2f2f4'; ctx.beginPath(); ctx.arc(px + Math.sin(a) * 0.8, py + Math.cos(a) * 0.8, 0.9, 0, 7); ctx.fill(); ctx.fillStyle = '#2b66c4'; } }
    // sparks, headlights
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this._part) if (!q.smoke) { const a = 1 - q.t / q.life; ctx.strokeStyle = 'rgba(255,170,60,' + a.toFixed(2) + ')'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.05, q.y - q.vy * 0.05); ctx.stroke(); }
    if (tm === 2) for (const v of V) {
      ctx.save(); ctx.translate(v.hx, v.hy); ctx.rotate(v.ang); const len = this.KIND[v.kind].len * size * 0.5, wd = v.kind === 3 ? 18 : 30;
      const gd = ctx.createLinearGradient(len, 0, len + 100, 0); gd.addColorStop(0, 'rgba(255,240,190,0.5)'); gd.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = gd; ctx.beginPath(); ctx.moveTo(len, -2); ctx.lineTo(len + 100, -wd); ctx.lineTo(len + 100, wd); ctx.lineTo(len, 2); ctx.closePath(); ctx.fill();
      const braking = v.v < v.prevV - 0.3; ctx.fillStyle = braking ? 'rgba(255,60,40,0.9)' : 'rgba(255,40,30,0.45)'; ctx.beginPath(); ctx.arc(-len, -2.6 * size, braking ? 2.4 : 1.4, 0, 7); ctx.arc(-len, 2.6 * size, braking ? 2.4 : 1.4, 0, 7); ctx.fill(); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    // drifting cloud shadows
    if (P.clouds) for (const q of this._cl) {
      q.x += q.vx * step; if (q.x > W + 300) q.x = -300; const y = (q.y % (H || 1));
      ctx.save(); ctx.translate(q.x, y); ctx.scale(1.6, 1); const gd = ctx.createRadialGradient(0, 0, 0, 0, 0, q.r); gd.addColorStop(0, 'rgba(10,30,20,' + (tm === 2 ? 0.1 : 0.17) + ')'); gd.addColorStop(1, 'rgba(10,30,20,0)'); ctx.fillStyle = gd; ctx.fillRect(-q.r, -q.r, q.r * 2, q.r * 2); ctx.restore();
    }
  }
});
