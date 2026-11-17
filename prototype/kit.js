// Gedeelde thema-kit voor 2D-canvas thema's (vervangt de ontbrekende thema's uit de "locked" lijst).
//
// Een thema-pagina is: <canvas id="art"></canvas> + kit.js + eigen script + share.js (in die volgorde).
// Het eigen script roept IconIsland.theme({...}) aan. De kit regelt:
//   - berichten van de host (icons / settings / reset / pause) en van het instellingenvenster (?preview=1)
//   - een standalone-modus in de browser met voorbeeldiconen (node prototype/serve.mjs)
//   - 30 fps-lus, schaal, soepel bewegende iconen (kit.icons, met fade-in/out)
//   - de globals die share.js verwacht: cv, draw, icons, W, H, WALL, TASKBAR, GRID_*, CELL_*, frameN, paused, cacheOK, commit
//
// Thema-contract:
//   IconIsland.theme({
//     params: { naam: standaardwaarde, ... },        // moet overeenkomen met themes.json (zelfde sleutels/defaults)
//     init(env, seed)    // bij start en bij 'Vernieuwen' (nieuwe seed): willekeurige elementen opnieuw bepalen
//     rebuild(env)       // canvasgrootte/schaal veranderd (of share.js wil opnieuw): statische cache-lagen opnieuw tekenen
//     iconsChanged(env)  // doel-icoonlijst veranderd (env.icons blijft de soepele lijst)
//     frame(ctx, t, dt, env)  // elke frame; ctx werkt in CSS-pixels (W x H)
//   })
//   env = { cv, ctx, W, H, S (canvasschaal), P (params), icons: [{x,y,w,h,a}], rng(seed), noise(x,y), dist(x,y), ... }
'use strict';
const QS = new URLSearchParams(location.search);
const WALL = QS.has('wallpaper');
const PREVIEW = QS.has('preview');
const CELL_W = 76, CELL_H = 100, GRID_X0 = 4, GRID_Y0 = 6, TASKBAR = 48;
const cv = document.getElementById('art');
let W = innerWidth, H = innerHeight;
let icons = [];                       // soepele lijst (share.js tekent hier voorbeeldiconen op)
let paused = false, frameN = 0, cacheOK = true;
function commit() {}                  // share.js roept dit alleen aan in de demo-modus

const IconIsland = (() => {
  const ctx = cv.getContext('2d');
  let theme = null, seed = 1, target = [], lastNow = 0, lastDraw = 0, lw = 0, lh = 0, ls = 0, started = false;
  const P = {}, DEFAULTS = {};
  const env = { cv, ctx, P, icons, get W() { return W; }, get H() { return H; }, get S() { return cv._scale || 1; } };

  // ---------- hulpfuncties voor thema's ----------
  function rng(s) { let a = (s >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 11, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const smooth = t => t * t * (3 - 2 * t);
  function noise(x, y, s) {           // waardenruis 0..1, vloeiend
    const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, s, o) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < (o || 3); i++) { v += a * noise(x * f, y * f, s + i); a *= 0.5; f *= 2; } return v; }
  // afstand van punt tot dichtstbijzijnde icoon-rechthoek (0 = erin); optioneel met marge
  function dist(x, y, pad) {
    let best = 1e9;
    for (const ic of icons) {
      const p = pad || 0, dx = Math.max(ic.x - p - x, 0, x - (ic.x + ic.w + p)), dy = Math.max(ic.y - p - y, 0, y - (ic.y + ic.h + p));
      const d = Math.hypot(dx, dy) + (1 - ic.a) * 80;
      if (d < best) best = d;
    }
    return best;
  }
  // zachte invloed 0..1 van alle iconen (som van gaussische pluimen rond het midden van elk icoon), r = bereik in px
  function influence(x, y, r) {
    let v = 0;
    for (const ic of icons) {
      const cx = ic.x + ic.w / 2, cy = ic.y + ic.h / 2;
      const dx = Math.max(Math.abs(x - cx) - ic.w * 0.4, 0), dy = Math.max(Math.abs(y - cy) - ic.h * 0.4, 0);
      v += Math.exp(-(dx * dx + dy * dy) / (r * r)) * ic.a;
    }
    return Math.min(v, 1);
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  Object.assign(env, { rng, hash, noise, fbm, dist, influence, lerp, clamp, smooth });

  // ---------- soepele iconen ----------
  // nieuwe doellijst koppelen aan de huidige soepele lijst (dichtstbijzijnde middelpunt), rest verschijnt / vervaagt
  function setTarget(list) {
    target = list;
    const used = new Set(), out = [];
    for (const tg of list) {
      let best = null, bd = 140 * 140;
      for (const ic of icons) {
        if (used.has(ic) || ic.dying) continue;
        const d = (ic.tx + ic.tw / 2 - tg.x - tg.w / 2) ** 2 + (ic.ty + ic.th / 2 - tg.y - tg.h / 2) ** 2;
        if (d < bd) { bd = d; best = ic; }
      }
      if (best) { used.add(best); Object.assign(best, { tx: tg.x, ty: tg.y, tw: tg.w, th: tg.h }); out.push(best); }
      else out.push({ x: tg.x, y: tg.y, w: tg.w, h: tg.h, tx: tg.x, ty: tg.y, tw: tg.w, th: tg.h, a: started ? 0 : 1, ta: 1 });
    }
    for (const ic of icons) if (!used.has(ic)) { ic.ta = 0; ic.dying = true; out.push(ic); }
    icons.length = 0; icons.push(...out);
    if (theme && theme.iconsChanged) theme.iconsChanged(env);
  }
  function stepIcons(dt) {
    const k = 1 - Math.exp(-dt * 9);
    for (let i = icons.length - 1; i >= 0; i--) {
      const ic = icons[i];
      ic.x += (ic.tx - ic.x) * k; ic.y += (ic.ty - ic.y) * k; ic.w += (ic.tw - ic.w) * k; ic.h += (ic.th - ic.h) * k;
      ic.a += ((ic.ta === undefined ? 1 : ic.ta) - ic.a) * (1 - Math.exp(-dt * 4));
      if (ic.dying && ic.a < 0.02) icons.splice(i, 1);
    }
  }

  // ---------- canvas ----------
  function resize() {
    W = innerWidth; H = innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const s = PREVIEW ? 0.45 : Math.min(dpr, 1);
    const box = cv.getBoundingClientRect();
    cv._scale = s;
    cv.width = Math.max(2, Math.round((box.width || W) * s)); cv.height = Math.max(2, Math.round((box.height || H) * s));
    cacheOK = false;
  }

  function draw(now) {
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 0.016;
    lastNow = now;
    stepIcons(dt);
    const S = cv._scale || 1;
    if (cv.width !== lw || cv.height !== lh || S !== ls || !cacheOK) {
      lw = cv.width; lh = cv.height; ls = S; cacheOK = true;
      if (theme && theme.rebuild) { ctx.setTransform(1, 0, 0, 1, 0, 0); theme.rebuild(env); }
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    if (theme) theme.frame(ctx, now / 1000, dt, env);
  }
  window.draw = draw;   // share.js ruft draw(performance.now()) aan

  function loop(now) {
    requestAnimationFrame(loop);
    if (paused) return;
    if (now - lastDraw < 31) return;                // ~30 fps
    lastDraw = now; frameN++;
    draw(now);
  }

  // ---------- instellingen ----------
  function applySettings(v) {
    if (typeof v.seed === 'number' && v.seed !== seed) { seed = v.seed; if (theme && theme.init) theme.init(env, seed); cacheOK = false; }
    let changed = false;
    for (const k in v) {
      if (k === 'seed' || !(k in DEFAULTS) || typeof v[k] !== typeof DEFAULTS[k] || P[k] === v[k]) continue;
      P[k] = v[k]; changed = true;
      if (theme && theme.setting) theme.setting(k, v[k], env);
    }
    if (changed) cacheOK = false;
  }

  // ---------- berichten ----------
  function handle(m) {
    if (!m) return;
    if (m.t === 'pause') { paused = PREVIEW ? false : !!m.v; return; }
    if (m.t === 'settings') { applySettings(m.v || {}); return; }
    if (m.t === 'reset') { applySettings(Object.assign({}, DEFAULTS, m.v || {})); return; }
    if (m.t !== 'icons') return;
    const k = window.devicePixelRatio || 1;   // fysieke pixels -> CSS-pixels
    const list = m.vis ? m.r.map(([l, t, r, b]) => ({ x: l / k, y: t / k, w: (r - l) / k, h: (b - t) / k })) : [];
    setTarget(list);
    if (PREVIEW) drawGhosts(list);
    started = true;
  }
  function drawGhosts(list) {
    let box = document.getElementById('ghosts');
    if (!box) { box = document.createElement('div'); box.id = 'ghosts'; document.body.appendChild(box); }
    box.innerHTML = list.map(ic => `<div class="ghost" style="left:${ic.x}px;top:${ic.y}px;width:${ic.w}px;height:${ic.h}px"><i></i><b></b></div>`).join('');
  }
  function sampleIcons() {                     // standalone in de browser: twee kolommen + een paar losse
    const l = [];
    for (let c = 0; c < 2; c++) for (let r = 0; r < 5; r++) l.push({ x: GRID_X0 + c * CELL_W, y: GRID_Y0 + r * CELL_H, w: 72, h: 90 });
    l.push({ x: W * 0.55, y: H * 0.4, w: 72, h: 90 }, { x: W * 0.7, y: H * 0.25, w: 72, h: 90 });
    return l;
  }

  function theme_(def) {
    theme = def;
    for (const k in def.params || {}) { DEFAULTS[k] = def.params[k]; P[k] = def.params[k]; }
    document.body.classList.add(WALL ? 'wall' : 'free');
    resize();
    addEventListener('resize', () => { resize(); if (theme.init) theme.init(env, seed); });
    if (theme.init) theme.init(env, seed);
    if (WALL || PREVIEW) {
      if (PREVIEW) {
        addEventListener('message', ev => { if (ev.source === parent) handle(typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data); });
        parent.postMessage(JSON.stringify({ t: 'ready' }), '*');
      } else {
        const host = window.chrome && window.chrome.webview;
        if (host) { host.addEventListener('message', ev => handle(JSON.parse(ev.data))); host.postMessage('ready'); }
      }
    } else {
      handle({ t: 'icons', vis: true, r: sampleIcons().map(i => [i.x, i.y, i.x + i.w, i.y + i.h]) });
      drawGhosts(sampleIcons());
    }
    requestAnimationFrame(loop);
  }

  return Object.assign(env, { theme: theme_, apply: applySettings, handle, setTarget });
})();
