// Shared creatures for the Pasture, Forest and Winter themes (animals, people): top-down vector drawings plus a simple wander AI.
//
//   const herd = new Fauna.Herd();
//   herd.add('cow', x, y);                       // kinds: cow, horse, deer, boar, fox, rabbit
//   herd.step(dt, t, open, pick);                // open(x, y) -> 0..1 how allowed a spot is; pick() -> {x, y} | null
//   herd.draw(ctx, t);
//
// Animals graze or walk, avoid leaving the allowed area (open() < ~0.5), and are re-spawned through pick()
// if they ever end up lost (for example because an icon moved away underneath them).
const Fauna = (() => {
  const TAU = Math.PI * 2;
  const SPEC = {
    cow:    { size: 27, speed: 8,  turn: 1.3 },
    horse:  { size: 36, speed: 14, turn: 1.7 },
    deer:   { size: 30, speed: 17, turn: 2.2 },
    boar:   { size: 25, speed: 12, turn: 2.0 },
    fox:    { size: 22, speed: 20, turn: 3.0 },
    rabbit: { size: 10, speed: 24, turn: 5.0 },
    kid:    { size: 20, speed: 26, turn: 4.0 },
    adult:  { size: 29, speed: 15, turn: 2.5 },
    dog:    { size: 15, speed: 55, turn: 5.0 },
    camel:  { size: 50, speed: 12, turn: 1.2 },
    skater: { size: 17, speed: 40, turn: 1.6 },
    penguin:{ size: 17, speed: 14, turn: 2.2 },
    reindeer:{ size: 33, speed: 17, turn: 2.2 },
    arcticfox:{ size: 22, speed: 20, turn: 3.0 },
  };
  const rnd = Math.random;
  const pickOf = a => a[Math.floor(rnd() * a.length)];
  const el = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), rot || 0, 0, TAU); c.fill(); };
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function palette(kind) {
    switch (kind) {
      case 'cow': {
        const base = pickOf([['#f4f1ea', '#2c2a28'], ['#f4f1ea', '#2c2a28'], ['#f4f1ea', '#7a4a2a'], ['#8a5535', '#f1e6d0'], ['#e8e0d0', '#a8683a']]);
        const patches = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.26, 0.07 + rnd() * 0.1, 0.05 + rnd() * 0.07]);
        return { body: base[0], patch: base[1], patches, head: rnd() < 0.5 ? base[1] : base[0] };
      }
      case 'horse': {
        const p = pickOf([['#9a5a2e', '#2a1a12'], ['#6b3e22', '#1c120c'], ['#d8d6d0', '#b4b2ac'], ['#d9b06a', '#f1e6c8'], ['#3a2a22', '#14100e'], ['#a66a3a', '#5a3318']]);
        return { body: p[0], mane: p[1] };
      }
      case 'deer': return { body: pickOf(['#b87a45', '#a96f3c', '#c58a52']), male: rnd() < 0.4 };
      case 'boar': return { body: pickOf(['#4a3b32', '#3a2f29', '#5a4638']), snout: '#7a6252' };
      case 'fox': return { body: pickOf(['#d6702a', '#c9622a']) };
      case 'kid': case 'adult': return {
        shirt: pickOf(['#e5484d', '#2f80ed', '#f2c94c', '#27ae60', '#9b51e0', '#f2994a', '#eb6fa5', '#56ccf2']), pants: pickOf(['#34495e', '#2d3f6b', '#5a4a3a', '#6b7280', '#3b6b4a']),
        skin: pickOf(['#f2c9a5', '#e0a97c', '#c68a5b', '#8d5a3b', '#f6d7bd']), hair: pickOf(['#2b1d14', '#5a3a1e', '#a8742c', '#d9b25a', '#141414', '#8a3b1a']), long: rnd() < 0.5 };
      case 'skater': { const p = palette('adult'); p.hat = pickOf(['#e5484d', '#2f80ed', '#f2c94c', '#27ae60', '#9b51e0']); return p; }
      case 'penguin': return { body: '#1d2733' };
      case 'reindeer': return { body: pickOf(['#8a7260', '#7a6552', '#9a8470']), male: true };
      case 'arcticfox': return { body: '#f2f5f8' };
      case 'dog': return { body: pickOf(['#b9824a', '#2b2622', '#e9e2d2', '#8a5a34', '#d6b06a']), patch: pickOf(['#f1ece0', '#3a302a', '#6b4a2c']) };
      case 'camel': return { body: pickOf(['#c99a5b', '#bf8f52', '#d4a96a']), cloth: pickOf(['#b5382a', '#2f6fb0', '#d9a21e', '#3a8a5a']) };
      default: return { body: pickOf(['#9b8672', '#a89884', '#8a7a68']) };
    }
  }

  // ---- drawings: local frame, facing +x, L = body length in px ----
  function legs(c, L, ph, v, n, xs, yy, col, len) {
    c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const front = i < n / 2, side = i % 2 ? 1 : -1;
      el(c, (front ? xs : -xs) * L + Math.sin(ph + i * 1.9) * 0.07 * L * v, side * yy * L, len * L, len * 0.7 * L);
    }
  }
  const DRAW = {
    cow(c, a, L, t) {
      const P = a.pal, v = a.v / SPEC.cow.speed, graze = a.state === 'graze';
      c.fillStyle = 'rgba(20,30,10,0.22)'; el(c, 0.04 * L, 0.07 * L, 0.45 * L, 0.22 * L);
      legs(c, L, a.ph, v, 4, 0.26, 0.17, '#2b2420', 0.055);
      c.strokeStyle = '#3a3330'; c.lineWidth = 0.03 * L; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-0.42 * L, 0); c.quadraticCurveTo(-0.52 * L, Math.sin(t * 2.4 + a.seed) * 0.06 * L, -0.58 * L, Math.sin(t * 3.1 + a.seed) * 0.08 * L); c.stroke();
      c.fillStyle = P.body; el(c, 0, 0, 0.44 * L, 0.21 * L);
      c.fillStyle = P.patch; for (const p of P.patches) el(c, p[0] * L, p[1] * L, p[2] * L, p[3] * L, p[0] * 2);
      c.fillStyle = 'rgba(255,255,255,0.16)'; el(c, -0.04 * L, -0.07 * L, 0.3 * L, 0.06 * L);
      const hx = 0.52 * L + (graze ? 0.07 * L : 0);
      c.fillStyle = P.body; el(c, 0.36 * L, 0, 0.13 * L, 0.12 * L);
      c.fillStyle = P.head; el(c, hx, 0, graze ? 0.12 * L : 0.145 * L, 0.115 * L);
      c.fillStyle = '#e8b4a8'; el(c, hx + 0.1 * L, 0, 0.055 * L, 0.07 * L);
      c.fillStyle = P.head; el(c, hx - 0.05 * L, -0.13 * L, 0.05 * L, 0.025 * L, -0.4); el(c, hx - 0.05 * L, 0.13 * L, 0.05 * L, 0.025 * L, 0.4);
      c.fillStyle = '#f1e6c8'; el(c, hx - 0.03 * L, -0.07 * L, 0.018 * L, 0.018 * L); el(c, hx - 0.03 * L, 0.07 * L, 0.018 * L, 0.018 * L);
    },
    horse(c, a, L, t) {
      const P = a.pal, v = a.v / SPEC.horse.speed, graze = a.state === 'graze';
      c.fillStyle = 'rgba(20,30,10,0.22)'; el(c, 0.04 * L, 0.06 * L, 0.42 * L, 0.16 * L);
      legs(c, L, a.ph, v, 4, 0.27, 0.095, '#201814', 0.045);
      c.strokeStyle = P.mane; c.lineCap = 'round'; c.lineWidth = 0.06 * L;
      c.beginPath(); c.moveTo(-0.37 * L, 0); c.quadraticCurveTo(-0.5 * L, Math.sin(t * 2.2 + a.seed) * 0.07 * L, -0.62 * L, Math.sin(t * 2.8 + a.seed) * 0.1 * L); c.stroke();
      c.fillStyle = P.body; el(c, 0, 0, 0.4 * L, 0.15 * L);
      c.fillStyle = 'rgba(255,255,255,0.14)'; el(c, -0.02 * L, -0.05 * L, 0.3 * L, 0.04 * L);
      const ext = graze ? 0.06 * L : 0;
      c.beginPath(); c.moveTo(0.24 * L, -0.09 * L); c.lineTo(0.5 * L + ext, -0.05 * L); c.lineTo(0.5 * L + ext, 0.05 * L); c.lineTo(0.24 * L, 0.09 * L); c.closePath(); c.fillStyle = P.body; c.fill();
      c.strokeStyle = P.mane; c.lineWidth = 0.035 * L; c.beginPath(); c.moveTo(0.26 * L, 0.01 * L); c.lineTo(0.5 * L + ext, 0.005 * L); c.stroke();
      c.fillStyle = P.body; el(c, 0.58 * L + ext, 0, 0.11 * L, 0.055 * L);
      c.fillStyle = P.mane; el(c, 0.52 * L + ext, -0.045 * L, 0.025 * L, 0.014 * L, -0.5); el(c, 0.52 * L + ext, 0.045 * L, 0.025 * L, 0.014 * L, 0.5);
    },
    deer(c, a, L, t) {
      const P = a.pal, v = a.v / SPEC.deer.speed, graze = a.state === 'graze';
      c.fillStyle = 'rgba(20,30,10,0.2)'; el(c, 0.04 * L, 0.06 * L, 0.36 * L, 0.13 * L);
      legs(c, L, a.ph, v, 4, 0.24, 0.07, '#3a2a1c', 0.04);
      c.fillStyle = P.body; el(c, 0, 0, 0.36 * L, 0.12 * L);
      c.fillStyle = '#f4efe2'; el(c, -0.34 * L, 0, 0.05 * L, 0.06 * L);
      const ext = graze ? 0.07 * L : 0;
      c.beginPath(); c.moveTo(0.22 * L, -0.07 * L); c.lineTo(0.44 * L + ext, -0.04 * L); c.lineTo(0.44 * L + ext, 0.04 * L); c.lineTo(0.22 * L, 0.07 * L); c.closePath(); c.fillStyle = P.body; c.fill();
      c.fillStyle = P.body; el(c, 0.5 * L + ext, 0, 0.09 * L, 0.05 * L);
      c.fillStyle = '#2a1c14'; el(c, 0.58 * L + ext, 0, 0.018 * L, 0.018 * L);
      c.fillStyle = P.body; el(c, 0.44 * L + ext, -0.065 * L, 0.04 * L, 0.02 * L, -0.6); el(c, 0.44 * L + ext, 0.065 * L, 0.04 * L, 0.02 * L, 0.6);
      if (P.male) {
        c.strokeStyle = '#d9c9a0'; c.lineWidth = 0.02 * L; c.lineCap = 'round';
        for (const s of [-1, 1]) { const x0 = 0.46 * L + ext; c.beginPath(); c.moveTo(x0, s * 0.03 * L); c.lineTo(x0 + 0.1 * L, s * 0.1 * L); c.moveTo(x0 + 0.05 * L, s * 0.065 * L); c.lineTo(x0 + 0.12 * L, s * 0.05 * L); c.moveTo(x0 + 0.1 * L, s * 0.1 * L); c.lineTo(x0 + 0.17 * L, s * 0.12 * L); c.stroke(); }
      }
    },
    boar(c, a, L, t) {
      const P = a.pal, v = a.v / SPEC.boar.speed, graze = a.state === 'graze';
      c.fillStyle = 'rgba(20,30,10,0.24)'; el(c, 0.04 * L, 0.07 * L, 0.4 * L, 0.17 * L);
      legs(c, L, a.ph, v, 4, 0.22, 0.12, '#241c18', 0.045);
      c.fillStyle = P.body; el(c, 0, 0, 0.4 * L, 0.17 * L);
      c.strokeStyle = 'rgba(20,14,10,0.7)'; c.lineWidth = 0.05 * L; c.lineCap = 'round'; c.setLineDash([0.03 * L, 0.025 * L]);
      c.beginPath(); c.moveTo(-0.32 * L, 0); c.lineTo(0.32 * L, 0); c.stroke(); c.setLineDash([]);
      const ext = graze ? 0.05 * L : 0;
      c.fillStyle = P.body; el(c, 0.42 * L + ext, 0, 0.14 * L, 0.11 * L);
      c.fillStyle = P.snout; el(c, 0.56 * L + ext, 0, 0.085 * L, 0.055 * L);
      c.fillStyle = '#1c1410'; el(c, 0.63 * L + ext, 0, 0.02 * L, 0.03 * L);
      c.fillStyle = '#f1ead8'; el(c, 0.58 * L + ext, -0.05 * L, 0.03 * L, 0.01 * L, -0.4); el(c, 0.58 * L + ext, 0.05 * L, 0.03 * L, 0.01 * L, 0.4);
      c.fillStyle = '#1c1410'; el(c, 0.36 * L + ext, -0.1 * L, 0.04 * L, 0.025 * L, -0.5); el(c, 0.36 * L + ext, 0.1 * L, 0.04 * L, 0.025 * L, 0.5);
      c.strokeStyle = P.body; c.lineWidth = 0.025 * L; c.beginPath(); c.moveTo(-0.4 * L, 0); c.quadraticCurveTo(-0.5 * L, 0.05 * L, -0.46 * L, 0.1 * L); c.stroke();
    },
    fox(c, a, L, t) {
      const P = a.pal, v = a.v / SPEC.fox.speed;
      c.fillStyle = 'rgba(20,30,10,0.2)'; el(c, 0.04 * L, 0.05 * L, 0.34 * L, 0.11 * L);
      legs(c, L, a.ph, v, 4, 0.2, 0.06, '#2a1a12', 0.04);
      c.fillStyle = P.body; el(c, -0.5 * L, Math.sin(t * 2 + a.seed) * 0.02 * L, 0.24 * L, 0.075 * L, 0.1);
      c.fillStyle = '#f6f0e4'; el(c, -0.68 * L, Math.sin(t * 2 + a.seed) * 0.03 * L, 0.07 * L, 0.05 * L);
      c.fillStyle = P.body; el(c, 0, 0, 0.3 * L, 0.1 * L); el(c, 0.4 * L, 0, 0.11 * L, 0.08 * L);
      c.fillStyle = '#f6f0e4'; el(c, 0.46 * L, 0, 0.06 * L, 0.045 * L);
      c.fillStyle = '#2a1a12'; el(c, 0.52 * L, 0, 0.018 * L, 0.018 * L); el(c, 0.36 * L, -0.07 * L, 0.04 * L, 0.025 * L, -0.5); el(c, 0.36 * L, 0.07 * L, 0.04 * L, 0.025 * L, 0.5);
    },
    kid(c, a, L, t) { DRAW.person(c, a, L * 1.5, t); },
    adult(c, a, L, t) { DRAW.person(c, a, L * 1.5, t); },
    person(c, a, L, t) {
      const P = a.pal, v = Math.min(1, a.v / SPEC[a.kind].speed), play = a.state === 'graze', sw = Math.sin(a.ph * 2) * v, bob = play ? Math.sin(t * 6 + a.seed) : 0;
      c.fillStyle = 'rgba(20,30,10,0.22)'; el(c, 0.06 * L, 0.06 * L, 0.26 * L, 0.4 * L);
      c.fillStyle = P.pants; el(c, sw * 0.2 * L, -0.13 * L, 0.2 * L, 0.075 * L); el(c, -sw * 0.2 * L, 0.13 * L, 0.2 * L, 0.075 * L);
      const ax = play ? 0.2 * L + bob * 0.07 * L : -sw * 0.16 * L;
      c.fillStyle = P.skin; el(c, ax, -0.33 * L, 0.1 * L, 0.05 * L); el(c, play ? 0.2 * L - bob * 0.07 * L : sw * 0.16 * L, 0.33 * L, 0.1 * L, 0.05 * L);
      c.fillStyle = P.shirt; el(c, play ? 0.06 * L : 0, 0, 0.17 * L, 0.33 * L);
      c.fillStyle = 'rgba(255,255,255,0.2)'; el(c, 0.02 * L, -0.1 * L, 0.1 * L, 0.07 * L);
      const hx = play ? 0.14 * L : 0.03 * L;
      c.fillStyle = P.skin; el(c, hx + 0.02 * L, 0, 0.15 * L, 0.16 * L);
      c.fillStyle = P.hat || P.hair; el(c, hx - 0.04 * L, 0, 0.14 * L, 0.17 * L); if (P.hat) { c.fillStyle = '#fff'; el(c, hx - 0.17 * L, 0, 0.05 * L, 0.05 * L); } if (P.long && a.kind === 'adult') el(c, hx - 0.14 * L, 0, 0.14 * L, 0.12 * L);
    },
    dog(c, a, L, t) {
      const P = a.pal, v = Math.min(1, a.v / SPEC.dog.speed), sit = a.state === 'graze';
      c.fillStyle = 'rgba(20,30,10,0.2)'; el(c, 0.04 * L, 0.05 * L, 0.36 * L, 0.12 * L);
      if (!sit) legs(c, L, a.ph * 1.4, v, 4, 0.2, 0.07, '#2a1c14', 0.045);
      c.strokeStyle = P.body; c.lineWidth = 0.05 * L; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.3 * L, 0); c.quadraticCurveTo(-0.45 * L, Math.sin(t * 14 + a.seed) * 0.12 * L, -0.5 * L, Math.sin(t * 14 + a.seed) * 0.16 * L); c.stroke();
      c.fillStyle = P.body; el(c, 0, 0, 0.32 * L, 0.11 * L); c.fillStyle = P.patch; el(c, -0.05 * L, 0.04 * L, 0.1 * L, 0.05 * L);
      c.fillStyle = P.body; el(c, 0.38 * L, 0, 0.12 * L, 0.095 * L); c.fillStyle = P.patch; el(c, 0.47 * L, 0, 0.06 * L, 0.05 * L);
      c.fillStyle = '#1c1410'; el(c, 0.53 * L, 0, 0.022 * L, 0.022 * L); el(c, 0.34 * L, -0.09 * L, 0.05 * L, 0.03 * L, -0.4); el(c, 0.34 * L, 0.09 * L, 0.05 * L, 0.03 * L, 0.4);
    },
    camel(c, a, L, t) {
      const P = a.pal, v = Math.min(1, a.v / SPEC.camel.speed), rest = a.state === 'graze';
      c.fillStyle = 'rgba(80,50,10,0.28)'; el(c, 0.06 * L, 0.07 * L, 0.46 * L, 0.2 * L);
      if (!rest) legs(c, L, a.ph, v, 4, 0.27, 0.15, '#7a5a30', 0.05); else { c.fillStyle = '#7a5a30'; el(c, 0.2 * L, -0.17 * L, 0.1 * L, 0.05 * L); el(c, 0.2 * L, 0.17 * L, 0.1 * L, 0.05 * L); }
      c.strokeStyle = P.body; c.lineWidth = 0.03 * L; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.44 * L, 0); c.quadraticCurveTo(-0.52 * L, Math.sin(t * 2 + a.seed) * 0.05 * L, -0.54 * L, 0.04 * L); c.stroke();
      c.fillStyle = P.body; el(c, 0, 0, 0.44 * L, 0.18 * L);
      c.fillStyle = 'rgba(255,255,255,0.14)'; el(c, -0.04 * L, -0.07 * L, 0.34 * L, 0.05 * L);
      c.fillStyle = P.cloth; el(c, 0, 0, 0.2 * L, 0.17 * L); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-0.02 * L, -0.16 * L, 0.04 * L, 0.32 * L);
      c.fillStyle = P.body; el(c, -0.1 * L, 0, 0.1 * L, 0.11 * L); el(c, 0.12 * L, 0, 0.1 * L, 0.11 * L);
      c.fillStyle = 'rgba(255,255,255,0.2)'; el(c, -0.12 * L, -0.03 * L, 0.05 * L, 0.04 * L); el(c, 0.1 * L, -0.03 * L, 0.05 * L, 0.04 * L);
      const ext = rest ? -0.06 * L : 0;
      c.strokeStyle = P.body; c.lineWidth = 0.1 * L; c.beginPath(); c.moveTo(0.34 * L, 0); c.quadraticCurveTo(0.5 * L + ext, -0.03 * L, 0.6 * L + ext, 0); c.stroke();
      c.fillStyle = P.body; el(c, 0.67 * L + ext, 0, 0.1 * L, 0.06 * L); c.fillStyle = '#2a1c14'; el(c, 0.74 * L + ext, 0, 0.02 * L, 0.02 * L);
      c.fillStyle = P.body; el(c, 0.6 * L + ext, -0.07 * L, 0.03 * L, 0.018 * L, -0.5); el(c, 0.6 * L + ext, 0.07 * L, 0.03 * L, 0.018 * L, 0.5);
    },
    skater(c, a, L, t) { DRAW.person(c, a, L * 1.5, t); },
    reindeer(c, a, L, t) { DRAW.deer(c, Object.assign({}, a, { v: a.v / SPEC.reindeer.speed * SPEC.deer.speed }), L, t); },
    arcticfox(c, a, L, t) { DRAW.fox(c, Object.assign({}, a, { v: a.v / SPEC.arcticfox.speed * SPEC.fox.speed }), L, t); },
    penguin(c, a, L, t) {
      const slide = a.state === 'graze', v = Math.min(1, a.v / SPEC.penguin.speed), sw = Math.sin(a.ph * 2) * v;
      c.fillStyle = 'rgba(30,50,80,0.25)'; el(c, 0.05 * L, 0.06 * L, 0.38 * L, 0.26 * L);
      if (!slide) { c.fillStyle = '#f08a24'; el(c, -0.05 * L + sw * 0.1 * L, -0.12 * L, 0.1 * L, 0.06 * L); el(c, -0.05 * L - sw * 0.1 * L, 0.12 * L, 0.1 * L, 0.06 * L); }
      c.fillStyle = a.pal.body; c.save(); c.rotate(sw * 0.12); el(c, 0, 0, 0.42 * L, 0.25 * L); c.restore();
      c.fillStyle = '#f4f6f8'; el(c, 0.04 * L, 0, 0.3 * L, 0.17 * L);
      const fl = slide ? 0.36 : 0.26 + Math.abs(sw) * 0.06; c.fillStyle = a.pal.body; el(c, 0.04 * L, -fl * L, 0.14 * L, 0.05 * L, -0.5); el(c, 0.04 * L, fl * L, 0.14 * L, 0.05 * L, 0.5);
      c.fillStyle = a.pal.body; el(c, 0.38 * L, 0, 0.12 * L, 0.11 * L); c.fillStyle = '#f2b02a'; el(c, 0.5 * L, 0, 0.06 * L, 0.03 * L);
      c.fillStyle = '#fff'; el(c, 0.4 * L, -0.05 * L, 0.02 * L, 0.02 * L); el(c, 0.4 * L, 0.05 * L, 0.02 * L, 0.02 * L);
    },
    rabbit(c, a, L, t) {
      const P = a.pal;
      c.fillStyle = 'rgba(20,30,10,0.2)'; el(c, 0.04 * L, 0.06 * L, 0.38 * L, 0.2 * L);
      c.fillStyle = P.body; el(c, 0, 0, 0.36 * L, 0.21 * L); el(c, 0.36 * L, 0, 0.18 * L, 0.14 * L);
      el(c, 0.3 * L, -0.12 * L, 0.2 * L, 0.05 * L, -0.5); el(c, 0.3 * L, 0.12 * L, 0.2 * L, 0.05 * L, 0.5);
      c.fillStyle = '#f6f0e4'; el(c, -0.36 * L, 0, 0.07 * L, 0.07 * L);
    },
  };

  class Herd {
    constructor() { this.list = []; }
    add(kind, x, y, fade) {
      const sp = SPEC[kind], a = { kind, x, y, ang: rnd() * TAU, want: rnd() * TAU, v: 0, ph: rnd() * 6, state: rnd() < 0.5 ? 'graze' : 'walk', timer: 1 + rnd() * 5, a: fade ? 0 : 1, leaving: false, lost: 0, seed: rnd() * 6.28, pal: palette(kind), size: sp.size * 1.55 * (0.92 + rnd() * 0.18) };
      this.list.push(a); return a;
    }
    step(dt, t, open, pick) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const c = L[i], sp = SPEC[c.kind];
        c.a += ((c.leaving ? 0 : 1) - c.a) * (1 - Math.exp(-dt * 2.5));
        if (c.leaving && c.a < 0.03) { L.splice(i, 1); continue; }
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = c.state === 'walk' ? 'graze' : 'walk';
          c.timer = c.state === 'walk' ? 2 + rnd() * 5 : 3 + rnd() * 7;
          if (c.state === 'walk') c.want = c.ang + (rnd() - 0.5) * 2.4;
        }
        const here = open(c.x, c.y), ahead = open(c.x + Math.cos(c.ang) * c.size * 0.9, c.y + Math.sin(c.ang) * c.size * 0.9);
        if (here < 0.5 || ahead < 0.5) {
          let best = -1, bd = c.ang;
          for (let k = 0; k < 16; k++) {
            const ang = k / 16 * TAU + rnd() * 0.2, o = open(c.x + Math.cos(ang) * c.size * 1.6, c.y + Math.sin(ang) * c.size * 1.6) - Math.abs(angDiff(ang, c.ang)) * 0.01;
            if (o > best) { best = o; bd = ang; }
          }
          c.want = bd; if (c.state === 'graze') { c.state = 'walk'; c.timer = Math.max(c.timer, 1.5); }
        }
        const d = angDiff(c.want, c.ang); c.ang += clamp(d, -sp.turn * dt, sp.turn * dt);
        const target = c.state === 'walk' ? sp.speed * (0.8 + 0.4 * Math.sin(c.seed * 7)) : 0;
        c.v += (target - c.v) * (1 - Math.exp(-dt * 3));
        const nx = c.x + Math.cos(c.ang) * c.v * dt, ny = c.y + Math.sin(c.ang) * c.v * dt;
        if (open(nx, ny) > 0.15 || open(nx, ny) >= here) { c.x = nx; c.y = ny; } else c.v = 0;
        c.ph += c.v * dt * 0.34;
        if (here < 0.05) { c.lost += dt; if (c.lost > 3) { const p = pick && pick(); if (p) { c.x = p.x; c.y = p.y; c.a = 0; } c.lost = 0; } } else c.lost = 0;
      }
    }
    draw(ctx, t) {
      const L = this.list.slice().sort((a, b) => a.y - b.y);
      for (const a of L) {
        if (a.a < 0.02) continue;
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); ctx.globalAlpha = a.a;
        DRAW[a.kind](ctx, a, a.size, t);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  // a free-standing creature (not in a Herd), e.g. a scripted caravan camel
  const make = (kind, x, y) => { const sp = SPEC[kind]; return { kind, x, y, ang: 0, want: 0, v: 0, ph: rnd() * 6, state: 'walk', timer: 1, a: 1, leaving: false, lost: 0, seed: rnd() * 6.28, pal: palette(kind), size: sp.size * 1.55 }; };
  const drawOne = (ctx, a, t) => { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); ctx.globalAlpha = a.a; DRAW[a.kind](ctx, a, a.size, t); ctx.restore(); ctx.globalAlpha = 1; };
  return { Herd, SPEC, make, drawOne };
})();
