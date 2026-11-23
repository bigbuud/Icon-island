/* Meadow life: people out for a walk with their dogs on a leash, more children playing
   somewhere else on the meadow, and a few rabbits that hop away when somebody comes close.

   Every creature is drawn into its own cell of a small sprite atlas (canvas -> texture); the meadow
   shader pastes each cell at its position, so clouds and cloud shadows pass over them too.
   Uses the drawing helpers of meadow-kids.js. Coordinates are in "units" (a child is 100 units tall). */

const MA_CELL_W = 300, MA_CELL_H = 300, MA_FEET_Y = 224, MA_COLS = 4, MA_ROWS = 2, MA_MAX = MA_COLS * MA_ROWS;

const MA_MAN = { skin: '#f1c19b', skinD: '#dfa17a', hair: '#4a3426', hairD: '#2f2018', top: '#5d8f5c', topD: '#44713f', stripe: null,
  bottom: '#46597a', bottomD: '#364763', pants: '#46597a', pantsD: '#364763', sock: '#46597a', shoe: '#3a2e29', cheek: 'rgba(236,98,90,.3)' };
const MA_WOMAN = { skin: '#f3c7a3', skinD: '#e0a47c', hair: '#d6a23f', hairD: '#b07f22', dress: '#e0574b', dressD: '#b9433a', trim: '#f4e3d2',
  bow: null, pants: '#3b4252', pantsD: '#2d333f', sock: '#3b4252', shoe: '#5b3b2a', cheek: 'rgba(236,98,90,.3)' };
const MA_KID_RED = { skin: '#e9b78f', skinD: '#d49a70', hair: '#2e2018', hairD: '#1c120c', top: '#e0553f', topD: '#b53f2d', stripe: '#ffd84a',
  bottom: '#4a8b58', bottomD: '#377046', sock: '#fff', shoe: '#2f6fb5', cheek: 'rgba(236,98,90,.4)' };
const MA_KID_YELLOW = { skin: '#f4c9a3', skinD: '#e2a77c', hair: '#201a1a', hairD: '#100c0c', dress: '#ffd23f', dressD: '#dfae1f', trim: '#ffffff',
  bow: '#e24b4b', sock: '#fff', shoe: '#38a3a3', cheek: 'rgba(236,98,90,.4)' };
const MA_TODDLER = { skin: '#f8cba4', skinD: '#e9a97f', hair: '#8a5a2b', hairD: '#6a4018', top: '#7dce7a', topD: '#5aa857', stripe: '#fff',
  bottom: '#3f6fbf', bottomD: '#2e5496', sock: '#fff', shoe: '#f0c040', cheek: 'rgba(236,98,90,.45)' };

const MA_DOGS = {
  big: { fur: '#d9a45a', furD: '#b9843a', ear: '#a8742e', snout: '#ecc58a', coll: '#d8402f', size: 1.0, leg: 1 },
  small: { fur: '#fbf5ea', furD: '#e4d9c6', ear: '#6a4a36', snout: '#fffaf0', coll: '#3a86d8', size: 0.55, leg: 1, patch: '#6a4a36' }
};

/* ======================================================================
   Art: dog (side view, faces +x, feet at y = 0) and rabbit
   ====================================================================== */
function maDrawDog(ctx, d) {
  const D = d.pal, sz = D.size;
  ctx.save(); ctx.scale(d.dir * sz, sz);
  const g = d.gait, ph = d.phase, A = 7 + 8 * g, H = 3 + 6 * g, bob = -Math.abs(Math.sin(ph * 2)) * 1.6 * g;
  const leg = (x, off, col) => {
    const s = ph + off, fx = x + Math.sin(s) * A * (g > 0.05 ? 1 : 0), fy = -H * Math.max(0, Math.cos(s)) * (g > 0.05 ? 1 : 0);
    mkLimb(ctx, [[x, -25 + bob], [x + (fx - x) * 0.4, -12 + fy * 0.5], [fx, fy - 3]], 6.4, col);
    mkEllipse(ctx, fx + 1.8, fy - 1.8, 5.2, 3.2, 0, col, 1.4);
  };
  leg(-21, Math.PI, D.furD); leg(23, 0, D.furD);                       /* far legs */
  /* tail */
  const wag = Math.sin(d.wag) * (0.35 + 0.5 * g);
  ctx.save(); ctx.translate(-32, -38 + bob); ctx.rotate(-0.9 + wag * 0.6);
  mkEllipse(ctx, -9, 0, 11, 3.6, 0, D.fur, 1.5);
  ctx.restore();
  mkEllipse(ctx, 0, -34 + bob, 35, 15.5, 0, D.fur, 1.7);              /* body */
  if (D.patch && !mkShadow) { ctx.fillStyle = D.patch; ctx.beginPath(); ctx.ellipse(-8, -41 + bob, 10, 6, 0.2, 0, 6.2832); ctx.fill(); }
  leg(-23, 0, D.fur); leg(21, Math.PI, D.fur);                         /* near legs */
  /* neck + head */
  const hy = -50 + d.sniff * 31 + bob, hx = 42 + d.sniff * 3;
  mkLimb(ctx, [[24, -40 + bob], [hx - 5, hy + 2]], 17, D.fur);
  if (!mkShadow) { ctx.strokeStyle = D.coll; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, -48 + d.sniff * 9 + bob); ctx.lineTo(31 + d.sniff * 3, -36 + d.sniff * 13 + bob); ctx.stroke(); }
  mkEllipse(ctx, hx + 9, hy + 3.5, 9.5, 6.4, 0.2 + d.sniff * 0.35, D.snout, 1.6);
  mkCircle(ctx, hx, hy, 11.5, D.fur, 1.7);
  mkCircle(ctx, hx + 17.4, hy + 3.4 + d.sniff * 3, 2.7, MK_INK, 0);
  mkEllipse(ctx, hx - 5, hy - 2.5, 4.8, 9.2, 0.35, D.ear, 1.5);       /* floppy ear */
  if (!mkShadow) { ctx.fillStyle = MK_INK; ctx.beginPath(); ctx.arc(hx + 5.4, hy - 3, 1.9, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 6, hy - 3.7, .6, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}
/* world position of the collar (for the leash end) */
function maDogCollar(d) { return { x: d.x + d.dir * (30 + d.sniff * 3) * d.pal.size, y: d.y - (44 - d.sniff * 11) * d.pal.size }; }

function maDrawRabbit(ctx, r) {
  const s = r.size, st = r.stretch, up = r.alert;
  ctx.save(); ctx.scale(r.dir * s, s); ctx.translate(0, -r.z);
  const fur = '#b79e7d', furD = '#9b8264', pink = '#f0b9bd';
  ctx.rotate(-0.28 * st);
  /* hind foot + far ear */
  mkEllipse(ctx, -8 - 4 * st, -3, 8 + 3 * st, 3.4, 0, furD, 1.4);
  const ear = (x, rot, col) => {
    ctx.save(); ctx.translate(x, -20 - up * 2); ctx.rotate(rot - st * 1.0 + r.twitch);
    mkEllipse(ctx, 0, -9, 3.6, 9.5 + up * 1.5, 0, col, 1.4);
    if (!mkShadow) { ctx.fillStyle = pink; ctx.beginPath(); ctx.ellipse(0, -9, 1.7, 6.4 + up, 0, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  };
  ear(12.5, -0.18, furD);
  mkEllipse(ctx, 0, -11, 15.5 + 2 * st, 9.8, 0, fur, 1.6);             /* body */
  mkCircle(ctx, -7, -11.5, 8.4, fur, 1.5);                              /* haunch */
  mkCircle(ctx, -17, -11, 4.2, '#fffaf0', 1.4);                         /* tail */
  mkEllipse(ctx, 11 + 3 * st, -3.4, 6.8, 2.9, 0, fur, 1.3);            /* front paw */
  const hy = -17.5 - up * 3 + r.nibble * 6;
  mkCircle(ctx, 16 + 2 * st, hy, 7.2, fur, 1.6);                        /* head */
  mkEllipse(ctx, 22 + 2 * st, hy + 2.4, 3.8, 3, 0, '#f1e4cf', 1.2);
  ear(14, 0.12, fur);
  if (!mkShadow) { ctx.fillStyle = MK_INK; ctx.beginPath(); ctx.arc(18.6 + 2 * st, hy - 1.5, 1.35, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(25 + 2 * st, hy + 1.2, 1, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}

/* ======================================================================
   Sprites
   ====================================================================== */
function maMakeKid(pal, size, headS, legS) {
  const k = mkMakeKid('boy', 0, 0);
  k.pal = pal; k.size = size; k.headS = headS || 1; k.legS = legS || 1; k.maxSp = 90;
  return k;
}
function maShadowed(ctx, x, y, fn) {
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.58, -0.3, 0, 0); fn(); ctx.restore();
}

function maDrawSprite(ctx, s, shadow) {
  mkShadow = shadow;
  if (s.type === 'walker') {
    const a = s.adult, d = s.dog, rx = d.x - a.x, ry = d.y - a.y;
    const drawAdult = () => { ctx.save(); mkDrawKid(ctx, a); ctx.restore(); };
    const drawDog = () => { ctx.save(); ctx.translate(rx, ry); maDrawDog(ctx, d); ctx.restore(); };
    if (shadow) {
      mkEllipse(ctx, 0, 1, 15 * a.size, 5 * a.size, 0, '#fff', 0);
      mkEllipse(ctx, rx, ry + 1, 30 * d.pal.size, 6.5 * d.pal.size, 0, '#fff', 0);
      maShadowed(ctx, 0, 0, drawAdult); maShadowed(ctx, rx, ry, () => { maDrawDog(ctx, d); });
      return;
    }
    if (ry < 0) { drawDog(); drawAdult(); } else { drawAdult(); drawDog(); }
    /* the leash: from the hand to the collar */
    const hand = { x: a.dir * 13.5 * a.size + (a.view === 'side' ? 0 : 0), y: -(31 + 25 * ((a.legS || 1) - 1)) * a.size };
    const c = maDogCollar({ ...d, x: rx, y: ry });
    const slack = d.sniff * 0.8 + (s.paused ? 0.5 : 0.18);
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y);
    ctx.quadraticCurveTo((hand.x + c.x) / 2, (hand.y + c.y) / 2 + 12 + 26 * slack, c.x, c.y);
    ctx.strokeStyle = '#2c2a33'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.stroke();
  } else if (s.type === 'kid') {
    const k = s.kid;
    if (shadow) { mkEllipse(ctx, 0, 1, 15 * k.size, 5 * k.size, 0, '#fff', 0); maShadowed(ctx, 0, 0, () => mkDrawKid(ctx, k)); }
    else { mkDrawKid(ctx, k); if (k.pop >= 0) mkDrawPop(ctx, 22, -100 * k.size, k.pop); if (s.flower) maDrawPicked(ctx, k); }
  } else {
    const r = s.rabbit;
    if (shadow) { mkEllipse(ctx, 2, 1, 17 * r.size * (1 - r.z / 60), 4.5 * r.size, 0, '#fff', 0); maShadowed(ctx, 0, 0, () => maDrawRabbit(ctx, r)); }
    else maDrawRabbit(ctx, r);
  }
}
function maDrawPicked(ctx, k) {
  const y = -30 * k.size - 4;
  if (!mkShadow) { ctx.strokeStyle = '#4f8f3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(12, y + 8); ctx.lineTo(12, y); ctx.stroke(); mkCircle(ctx, 12, y - 1, 3.6, '#ffe45a', 1.1); }
}

/* ======================================================================
   Simulation
   ====================================================================== */
function createMeadowAmbientScene() {
  const atlas = document.createElement('canvas'), shadowAtlas = document.createElement('canvas');
  const actx = atlas.getContext('2d'), sctx = shadowAtlas.getContext('2d');
  const tex = [gl.createTexture(), gl.createTexture()];
  let aw = 0, ah = 0, previous = null, layout = '', u = 0.36, uploaded = false;
  const rects = new Float32Array(MA_MAX * 4), uvs = new Float32Array(MA_MAX * 4);
  const rnd = mkRand;
  const S = { time: 0, Wu: 4000, Hu: 2500, walkers: [], kids: [], rabbits: [], zone: null, spawn: [5, 22], avoidU: null, tagT: 0, ready: false };

  const mainKids = () => (typeof meadowKidsScene !== 'undefined' && meadowKidsScene) ? meadowKidsScene.S : null;

  /* the area the main children use (units) */
  function mainBox() {
    const m = mainKids();
    if (!m) return null;
    return { x0: m.ac.x - MK_HW - 140, x1: m.ac.x + MK_HW + 140, y0: m.ac.y - MK_HH - 170, y1: m.ac.y + MK_HH + 120 };
  }
  const overlap = (a, b) => a && b && a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  function chooseZone() {
    const mb = mainBox(), hw = 300, hh = 170;
    let best = null, bestD = 1e9;
    const cloudy = (x, y) => typeof curS === 'function' && (curS(x * u, y * u) < 45 || curS(x * u - 115, y * u - 156) < 45);
    for (let n = 0; n < 60; n++) {
      const c = { x: rnd(hw + 80, Math.max(hw + 81, S.Wu - hw - 80)), y: rnd(hh + 80, Math.max(hh + 81, S.Hu - hh - 80)) };
      const box = { x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh };
      if (overlap(box, mb)) continue;
      let clouds = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (cloudy(c.x + i * hw * 1.1, c.y + j * hh * 1.1)) clouds++;
      const score = clouds * 10 + rnd(0, 6);
      if (score < bestD) { bestD = score; best = { c, hw, hh }; }
    }
    return best || { c: { x: S.Wu * 0.2, y: S.Hu * 0.5 }, hw, hh };
  }

  function spawnWalker(i) {
    const mb = mainBox();
    const dir = Math.random() < 0.5 ? 1 : -1;
    let y = null;
    for (let n = 0; n < 30 && y === null; n++) {
      const c = rnd(180, S.Hu - 160);
      if (!mb || c < mb.y0 - 60 || c > mb.y1 + 60) y = c;
    }
    if (y === null) y = S.Hu - 200;
    const woman = (S.walkerKind = (S.walkerKind || 0) + 1) % 2 === 0;
    const adult = maMakeKid(woman ? MA_WOMAN : MA_MAN, woman ? 1.34 : 1.44, 0.8, 1.5);
    adult.view = 'side'; adult.dir = dir; adult.face = { x: dir, y: 0 }; adult.hold = { x: 0.62, y: 0.78 };
    const pal = woman ? MA_DOGS.small : MA_DOGS.big;
    const w = { type: 'walker', i, adult, dog: { pal, dir, x: 0, y: 0, phase: 0, gait: 0, sniff: 0, wag: 0, ahead: 0, lat: 0 }, dirW: dir, slope: rnd(-0.07, 0.07),
      speed: woman ? rnd(50, 62) : rnd(56, 70), pause: 0, nextPause: rnd(7, 18), paused: false, off: 0 };
    adult.x = dir > 0 ? -220 : S.Wu + 220; adult.y = y;
    w.dog.x = adult.x + dir * 60; w.dog.y = y + 8;
    S.walkers[i] = w;
  }
  function stepWalker(w, dt) {
    const a = w.adult, d = w.dog, dir = w.dirW;
    w.nextPause -= dt;
    if (w.pause > 0) { w.pause -= dt; if (w.pause <= 0) { w.paused = false; w.nextPause = rnd(9, 22); } }
    else if (w.nextPause <= 0) { w.pause = rnd(2.2, 4.2); w.paused = true; }
    /* keep away from the main playground */
    const mb = mainBox();
    if (mb && a.x > mb.x0 - 120 && a.x < mb.x1 + 120 && a.y > mb.y0 - 70 && a.y < mb.y1 + 70) a.y += ((a.y < (mb.y0 + mb.y1) / 2) ? -1 : 1) * 36 * dt;
    if (w.paused) { a.go = null; a.look = { x: d.x, y: d.y }; }
    else { a.go = { x: a.x + dir * 1000, y: a.y + w.slope * 1000 }; a.maxSp = w.speed; a.arrive = 1; a.look = null; a.accel = 4; }
    mkStepKid(a, dt, null);
    a.view = 'side'; a.dir = dir; a.hold = { x: 0.62, y: 0.78 };
    /* the dog trots ahead, now and then it stops to sniff */
    const sp = a.speed;
    d.dir = dir;
    d.sniff += ((w.paused ? 1 : 0) - d.sniff) * (1 - Math.exp(-dt * 5));
    d.wag += dt * (w.paused ? 9 : 5);
    const tAhead = w.paused ? 70 + 6 * Math.sin(S.time) : 62 + 16 * Math.sin(S.time * 0.6 + w.i * 2);
    const tLat = 12 + 9 * Math.sin(S.time * 0.45 + w.i);
    d.ahead += (tAhead - d.ahead) * (1 - Math.exp(-dt * 2.5)); d.lat += (tLat - d.lat) * (1 - Math.exp(-dt * 2));
    const ratio = d.pal.size > 0.8 ? 1 : 1.5;
    d.x = a.x + dir * d.ahead * (d.pal.size > 0.8 ? 1 : 0.8); d.y = a.y + d.lat;
    d.gait += ((sp > 14 ? Math.min(1, sp / 60) : 0) - d.gait) * (1 - Math.exp(-dt * 8));
    d.phase += sp * dt / (46 * d.pal.size) * 6.2832 * 0.5 * ratio;
    if ((dir > 0 && a.x > S.Wu + 260) || (dir < 0 && a.x < -260)) { S.walkers[w.i] = null; S.spawn[w.i] = rnd(14, 46); }
  }

  function setupKids() {
    S.zone = chooseZone();
    const z = S.zone;
    const mk = (pal, size, head, dx, dy) => { const k = maMakeKid(pal, size, head); k.x = z.c.x + dx; k.y = z.c.y + dy; return k; };
    S.kids = [mk(MA_KID_RED, 0.97, 1, -120, 20), mk(MA_KID_YELLOW, 0.9, 1, 130, -30), mk(MA_TODDLER, 0.72, 1.02, 10, 90)];
    S.tag = { it: 0, state: 'count', t: 0, side: 1, sideT: 0 };
    S.tod = { t: rnd(2, 5), state: 'walk', pick: 0 };
  }
  function clampZone(k) {
    const z = S.zone;
    k.x = mkClamp(k.x, z.c.x - z.hw, z.c.x + z.hw); k.y = mkClamp(k.y, z.c.y - z.hh, z.c.y + z.hh);
  }
  function stepKids(dt) {
    const z = S.zone, [A, B, T] = S.kids, tg = S.tag;
    if (S.transit) {
      const off = [[-70, 10], [70, -10], [0, 60]];
      let near = 0;
      S.kids.forEach((k, i) => { k.go = { x: z.c.x + off[i][0], y: z.c.y + off[i][1] }; k.maxSp = 230; k.arrive = 40; k.look = null; if (Math.hypot(k.go.x - k.x, k.go.y - k.y) < 40) near++; k.open = k.speed > 150 ? 1 : 0; mkStepKid(k, dt, null); });
      if (near === 3) { S.transit = false; tg.state = 'count'; tg.t = 0; S.kids.forEach(k => { k.go = null; }); }
      return;
    }
    /* tag between the first two */
    tg.t += dt; tg.sideT -= dt;
    const ch = tg.it ? B : A, ru = tg.it ? A : B;
    const dx = ru.x - ch.x, dy = ru.y - ch.y, dist = Math.hypot(dx, dy) || 1;
    const flee = () => {
      if (tg.sideT <= 0) { tg.side = Math.random() < 0.5 ? -1 : 1; tg.sideT = rnd(0.9, 1.6); }
      let fx = dx / dist - dy / dist * tg.side * 0.6, fy = dy / dist + dx / dist * tg.side * 0.6;
      const mx = 90;
      if (ru.x < z.c.x - z.hw + mx) fx += 2; if (ru.x > z.c.x + z.hw - mx) fx -= 2;
      if (ru.y < z.c.y - z.hh + mx) fy += 2; if (ru.y > z.c.y + z.hh - mx) fy -= 2;
      const l = Math.hypot(fx, fy) || 1;
      ru.go = { x: ru.x + fx / l * 150, y: ru.y + fy / l * 150 };
    };
    if (tg.state === 'count') {
      ch.go = null; ch.look = ru;
      if (tg.t < 0.6) { ru.go = null; ru.look = ch; } else { flee(); ru.look = null; }
      ru.maxSp = 250; ru.arrive = 20; ru.accel = 9;
      if (tg.t > 1.7) { tg.state = 'chase'; tg.t = 0; }
    } else if (tg.state === 'chase') {
      flee(); ru.look = null; ch.look = null;
      ru.maxSp = mkClamp(250 - Math.max(0, tg.t - 3) * 12, 170, 250); ru.arrive = 20; ru.accel = 9;
      ch.go = { x: ru.x + ru.vx * 0.28, y: ru.y + ru.vy * 0.28 }; ch.maxSp = 232 + Math.min(tg.t, 8) * 12; ch.arrive = 20; ch.accel = 9;
      if (dist < 32) { tg.state = 'pause'; tg.t = 0; ru.pop = 0; ch.go = null; ru.go = null; }
    } else {
      ch.go = null; ru.go = null; ch.look = ru; ru.look = ch;
      if (tg.t > 1.1) { tg.it = 1 - tg.it; tg.state = 'count'; tg.t = 0; }
    }
    /* the toddler potters about and picks flowers */
    const td = S.tod; td.t -= dt;
    if (td.state === 'walk') {
      if (!T.go || Math.hypot(T.go.x - T.x, T.go.y - T.y) < 8) { T.go = { x: z.c.x + rnd(-z.hw, z.hw) * 0.9, y: z.c.y + rnd(-z.hh, z.hh) * 0.9 }; T.maxSp = rnd(40, 70); T.arrive = 25; }
      S.todFlower = false;
      if (td.t <= 0) { td.state = 'pick'; td.t = 1.8; T.go = null; T.look = { x: T.x, y: T.y + 40 }; }
    } else {
      const e = 1.8 - td.t;
      T.crouch = mkEase(e / 0.4) * (1 - mkEase((e - 1.4) / 0.4));
      S.todFlower = e > 0.5 && e < 1.5;
      if (td.t <= 0) { td.state = 'walk'; td.t = rnd(5, 10); T.crouch = 0; T.look = null; S.todFlower = false; }
    }
    [A, B, T].forEach(k => { k.open = k.speed > 150 ? 1 : 0; if (k.pop >= 0) k.open = 1; mkStepKid(k, dt, null); clampZone(k); });
  }

  function spawnRabbits() {
    S.rabbits = [];
    const mb = mainBox();
    for (let i = 0; i < 3; i++) {
      let x = 0, y = 0;
      for (let n = 0; n < 30; n++) { x = rnd(120, S.Wu - 120); y = rnd(120, S.Hu - 120); if (!overlap({ x0: x - 60, x1: x + 60, y0: y - 60, y1: y + 60 }, mb)) break; }
      S.rabbits.push({ type: 'rabbit', x, y, z: 0, dir: Math.random() < 0.5 ? 1 : -1, size: rnd(0.95, 1.15), state: 'sit', t: rnd(0.5, 4), stretch: 0, alert: 0, nibble: 0, twitch: 0,
        hopT: 0, hopDur: 0.4, fx: 0, fy: 0, tx: 0, ty: 0, hops: 0, tw: 0 });
    }
  }
  function threats() {
    const out = [];
    const m = mainKids();
    if (m) m.kids.forEach(k => out.push(k));
    S.kids.forEach(k => out.push(k));
    S.walkers.forEach(w => { if (w) { out.push(w.adult); out.push(w.dog); } });
    return out;
  }
  function stepRabbit(r, dt, th) {
    let near = null, nd = 1e9;
    for (const t of th) { const d = Math.hypot(t.x - r.x, t.y - r.y); if (d < nd) { nd = d; near = t; } }
    const startHop = (tx, ty, dur) => {
      r.state = 'hop'; r.hopT = 0; r.hopDur = dur; r.fx = r.x; r.fy = r.y;
      r.tx = mkClamp(tx, 40, S.Wu - 40); r.ty = mkClamp(ty, 40, S.Hu - 40);
      if (Math.abs(r.tx - r.x) > 3) r.dir = r.tx > r.x ? 1 : -1;
    };
    r.tw -= dt; if (r.tw <= 0) { r.tw = rnd(1.5, 5); r.twitchT = 0.25; }
    if (r.twitchT > 0) { r.twitchT -= dt; r.twitch = Math.sin(r.twitchT * 40) * 0.25; } else r.twitch = 0;
    if (r.state === 'sit') {
      r.t -= dt; r.stretch = 0; r.z = 0;
      r.alert += ((nd < 330 ? 1 : 0) - r.alert) * (1 - Math.exp(-dt * 8));
      r.nibble = r.alert > 0.4 ? 0 : (Math.sin(S.time * 7 + r.x) > 0 ? 0.6 : 1) * (Math.sin(S.time * 0.9 + r.y) > -0.2 ? 1 : 0);
      if (nd < 190) {
        const ax = r.x - near.x, ay = r.y - near.y, l = Math.hypot(ax, ay) || 1;
        r.flee = true; r.hops = 0; startHop(r.x + ax / l * 60 + rnd(-20, 20), r.y + ay / l * 35, 0.24);
      } else if (r.t <= 0) {
        r.flee = false; r.hops = Math.floor(rnd(2, 5)); const a = rnd(0, 6.2832);
        startHop(r.x + Math.cos(a) * 34, r.y + Math.sin(a) * 20, 0.4);
      }
    } else {
      r.hopT += dt; const f = mkClamp(r.hopT / r.hopDur, 0, 1);
      r.x = r.fx + (r.tx - r.fx) * f; r.y = r.fy + (r.ty - r.fy) * f;
      r.z = Math.sin(Math.PI * f) * (r.flee ? 16 : 11); r.stretch = Math.sin(Math.PI * f); r.alert = 0; r.nibble = 0;
      if (f >= 1) {
        r.z = 0; r.stretch = 0;
        if (r.flee && nd < 300) {
          const ax = r.x - near.x, ay = r.y - near.y, l = Math.hypot(ax, ay) || 1;
          startHop(r.x + ax / l * 60 + rnd(-22, 22), r.y + ay / l * 34, 0.24);
        } else if (!r.flee && --r.hops > 0) {
          const a = rnd(0, 6.2832); startHop(r.x + Math.cos(a) * 34, r.y + Math.sin(a) * 20, 0.4);
        } else { r.state = 'sit'; r.t = rnd(2, 7); r.flee = false; }
      }
    }
  }

  function stepSim(dt) {
    S.time += dt;
    for (let i = 0; i < 2; i++) {
      if (S.walkers[i]) stepWalker(S.walkers[i], dt);
      else { S.spawn[i] -= dt; if (S.spawn[i] <= 0) spawnWalker(i); }
    }
    stepKids(dt);
    /* if the main children moved over the extra ones, they go play somewhere else */
    const mb = mainBox();
    const zb = { x0: S.zone.c.x - S.zone.hw, x1: S.zone.c.x + S.zone.hw, y0: S.zone.c.y - S.zone.hh, y1: S.zone.c.y + S.zone.hh };
    S.zoneAge = (S.zoneAge || 0) + dt;
    const covered = () => { let n = 0; const z = S.zone; for (const k of S.kids) if (typeof curS === 'function' && curS(k.x * u, k.y * u) < 45) n++; return n >= 2; };
    if (!S.transit && (overlap(zb, mb) || (S.zoneAge > 45 && covered()) || S.zoneAge > 240)) { S.zone = chooseZone(); S.transit = true; S.zoneAge = 0; }
    const th = threats();
    S.rabbits.forEach(r => stepRabbit(r, dt, th));
  }

  /* ---- draw into the atlas --------------------------------------------- */
  function sprites() {
    const list = [];
    S.walkers.forEach(w => { if (w) list.push({ type: 'walker', y: w.adult.y, x: w.adult.x, adult: w.adult, dog: w.dog, paused: w.paused }); });
    S.kids.forEach((k, i) => list.push({ type: 'kid', y: k.y, x: k.x, kid: k, flower: i === 2 && S.todFlower }));
    S.rabbits.forEach(r => list.push({ type: 'rabbit', y: r.y, x: r.x, rabbit: r }));
    return list.filter(s => s.x > -320 && s.x < S.Wu + 320).sort((a, b) => a.y - b.y).slice(0, MA_MAX);
  }
  function render() {
    const kt = Math.min(cv._scale, 2);
    const cwp = Math.ceil(MA_CELL_W * u * kt), chp = Math.ceil(MA_CELL_H * u * kt);
    const nw = cwp * MA_COLS, nh = chp * MA_ROWS;
    const resized = nw !== aw || nh !== ah;
    if (resized) { aw = nw; ah = nh; atlas.width = aw; atlas.height = ah; shadowAtlas.width = Math.ceil(aw / 2); shadowAtlas.height = Math.ceil(ah / 2); }
    actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, aw, ah);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.fillStyle = '#000'; sctx.fillRect(0, 0, shadowAtlas.width, shadowAtlas.height);
    rects.fill(0); uvs.fill(0);
    const list = sprites(), sw = shadowAtlas.width, sh = shadowAtlas.height;
    list.forEach((s, i) => {
      const col = i % MA_COLS, row = Math.floor(i / MA_COLS), cx0 = col * cwp, cy0 = row * chp;
      for (const pass of [0, 1]) {
        const c = pass ? sctx : actx, f = pass ? 0.5 : 1;
        c.save(); c.beginPath(); c.rect(cx0 * f, cy0 * f, cwp * f, chp * f); c.clip();
        c.setTransform(kt * u * f, 0, 0, kt * u * f, (cx0 + cwp / 2) * f, (cy0 + MA_FEET_Y * u * kt) * f);
        c.beginPath(); c.rect(-MA_CELL_W / 2, -MA_FEET_Y, MA_CELL_W, MA_CELL_H);
        c.save(); c.translate(0, 0);
        maDrawSprite(c, s.type === 'walker' ? s : s, !!pass);
        c.restore(); c.restore();
      }
      mkShadow = false;
      rects[i * 4] = s.x * u - cwp / 2 / kt; rects[i * 4 + 1] = s.y * u - MA_FEET_Y * u; rects[i * 4 + 2] = cwp / kt; rects[i * 4 + 3] = chp / kt;
      uvs[i * 4] = cx0 / aw; uvs[i * 4 + 1] = cy0 / ah; uvs[i * 4 + 2] = cwp / aw; uvs[i * 4 + 3] = chp / ah;
    });
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const up = (unit, texture, canvas) => {
      gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, texture);
      if (resized || !uploaded) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    };
    up(gl.TEXTURE10, tex[0], atlas); up(gl.TEXTURE11, tex[1], shadowAtlas);
    uploaded = true;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  return {
    S,
    step(now, visible = true) {
      const dtAll = previous === null ? 0 : Math.min(0.1, Math.max(0, (now - previous) / 1000)); previous = now;
      const nextLayout = [W, H, TASKBAR].join(',');
      if (nextLayout !== layout) {
        layout = nextLayout;
        u = Math.max(0.24, Math.min(1.25, W / 1379, (H - TASKBAR) / 1141)) * 0.43;
        S.Wu = W / u; S.Hu = (H - TASKBAR) / u;
        setupKids(); spawnRabbits();
        S.walkers = [null, null]; S.spawn = [rnd(3, 7), rnd(20, 35)];
      }
      let left = dtAll;
      while (left > 0) { const d = Math.min(left, 1 / 30); stepSim(d); left -= d; }
      if (!visible) return null;
      render();
      return { atlas: tex[0], shadow: tex[1], rects, uvs };
    }
  };
}

let meadowAmbientScene = null;
function prepareMeadowAmbient(now, visible = true) {
  if (!meadowAmbientScene) meadowAmbientScene = createMeadowAmbientScene();
  return meadowAmbientScene.step(now, visible);
}
