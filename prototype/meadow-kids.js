/* Meadow children: a boy and his little sister who play together on the grass.
   They fly kites, kick a ball to each other and play tag. They are drawn with the
   2D canvas (small pen-and-wash figures), uploaded as a texture and composited by
   the meadow shader, so clouds and cloud shadows pass over them like over the grass.

   All simulation is done in "units" where a child is 100 units tall; u (px per unit)
   follows the screen size. */

/* ======================================================================
   Art
   ====================================================================== */
const MK_INK = '#45302a';
let mkShadow = false;               /* true while drawing the white shadow silhouettes */
const mkCol = c => mkShadow ? '#fff' : c;
const MK_BOY = { skin: '#f8cba4', skinD: '#e9a97f', hair: '#c88a2c', hairD: '#a56a1b', top: '#3f87d8', topD: '#2d66b0', stripe: '#fdfdfd',
  bottom: '#f2a63c', bottomD: '#d98b24', sock: '#fff', shoe: '#d9473d', cheek: 'rgba(236,98,90,.45)' };
const MK_GIRL = { skin: '#f8cba4', skinD: '#e9a97f', hair: '#6c3c27', hairD: '#4b2616', dress: '#f47eab', dressD: '#d85b8e', trim: '#fff2f7',
  bow: '#ffd43f', sock: '#fff', shoe: '#8e63d8', cheek: 'rgba(236,98,90,.45)' };

function mkFill(ctx, col, lw = 1.7) {
  ctx.fillStyle = mkCol(col); ctx.strokeStyle = mkShadow ? '#fff' : MK_INK; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.fill(); ctx.stroke();
}
function mkCircle(ctx, x, y, r, col, lw = 1.7) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); mkFill(ctx, col, lw); }
function mkEllipse(ctx, x, y, rx, ry, rot, col, lw = 1.7) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 6.2832); mkFill(ctx, col, lw); }
function mkPoly(ctx, pts, col, lw = 1.7) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); mkFill(ctx, col, lw);
}
/* a thick outlined limb through the given points */
function mkLimb(ctx, pts, w, col) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = mkShadow ? '#fff' : MK_INK; ctx.lineWidth = w + 3.4; ctx.stroke();
  ctx.strokeStyle = mkCol(col); ctx.lineWidth = w; ctx.stroke();
}
/* two-bone leg: returns the knee, always bent towards +x (or towards `bendY` in front views) */
function mkKnee(hx, hy, fx, fy, l1, l2, bx, by) {
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
  const m = l1 + l2 - 0.05;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; fx = hx + dx; fy = hy + dy; }
  if (d < 0.5) return { x: hx, y: hy + l1, fx, fy };
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const nx = -dy / d, ny = dx / d, s = (nx * bx + ny * by) >= 0 ? 1 : -1;
  return { x: hx + dx * a / d + nx * h * s, y: hy + dy * a / d + ny * h * s, fx, fy };
}
function mkSpool(ctx, x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.rect(-1.8, -9, 3.6, 18); mkFill(ctx, '#c99a3a', 1.2);
  ctx.beginPath(); ctx.rect(-6.5, -10.5, 13, 3.6); mkFill(ctx, '#d9a845', 1.2);
  ctx.beginPath(); ctx.rect(-6.5, 6.9, 13, 3.6); mkFill(ctx, '#d9a845', 1.2);
  ctx.beginPath(); ctx.rect(-4.6, -6.6, 9.2, 13.2); mkFill(ctx, '#fbf6e6', 1.1);
  ctx.restore();
}
function mkShoe(ctx, P, x, y, dirX, lift) {
  mkEllipse(ctx, x + 3.2 * dirX, y - 3.2, 7.4, 4.6, -0.12 * dirX * (1 + lift * 0.1), P.shoe, 1.6);
}

/* mood of the face: running = open mouth */
function mkFaceFront(ctx, P, up, open) {
  const ey = -71 - 2.4 * up;
  for (const sx of [-1, 1]) {
    mkCircle(ctx, 7.4 * sx, ey, 2.7, MK_INK, 0);
    if (!mkShadow) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7.4 * sx + 0.9, ey - 1, 0.95, 0, 6.2832); ctx.fill(); }
    if (!mkShadow) { ctx.fillStyle = P.cheek; ctx.beginPath(); ctx.ellipse(12.6 * sx, -64.5 - 1.5 * up, 3.8, 2.4, 0, 0, 6.2832); ctx.fill(); }
  }
  if (mkShadow) return;
  ctx.strokeStyle = MK_INK; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  if (open > 0.3 || up > 0.4) {
    ctx.beginPath(); ctx.ellipse(0, -63.2 - 1.8 * up, 3.6, 2.2 + 1.4 * open, 0, 0, 6.2832);
    ctx.fillStyle = '#b73b3b'; ctx.fill(); ctx.stroke();
  } else { ctx.beginPath(); ctx.arc(0, -65, 3.8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
}
function mkFaceSide(ctx, P, up, open) {
  const ey = -72 - 2.0 * up;
  mkCircle(ctx, 10.5, ey, 2.7, MK_INK, 0);
  if (mkShadow) return;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11.4, ey - 1, 0.95, 0, 6.2832); ctx.fill();
  ctx.fillStyle = P.cheek; ctx.beginPath(); ctx.ellipse(8.2, -65.5, 3.6, 2.4, 0, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = MK_INK; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  if (open > 0.3 || up > 0.4) { ctx.beginPath(); ctx.ellipse(14.6, -63.6, 2.2, 2 + 1.2 * open, 0, 0, 6.2832); ctx.fillStyle = '#b73b3b'; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(13.2, -66.2, 3.2, 0.15 * Math.PI, 0.7 * Math.PI); ctx.stroke(); }
}

function mkHeadFront(ctx, P, k, back, up) {
  const girl = !!P.dress;
  if (girl) {
    for (const sx of [-1, 1]) {
      mkEllipse(ctx, 22.5 * sx, -59, 6.6, 12, 0.28 * sx, P.hair, 1.7);
      if (!mkShadow) { ctx.strokeStyle = P.hairD; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(22 * sx, -69); ctx.lineTo(23.5 * sx, -50); ctx.stroke(); }
    }
  }
  mkRect(ctx, -5, -57, 10, 8, P.skinD);
  for (const sx of [-1, 1]) mkCircle(ctx, 19 * sx, -72, 4.3, P.skin, 1.6);
  mkCircle(ctx, 0, -73, 19.6, back ? P.hair : P.skin);
  if (back) {
    if (!mkShadow) {
      ctx.strokeStyle = P.hairD; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, -88); ctx.quadraticCurveTo(-3, -79, -10, -68); ctx.moveTo(7, -91); ctx.quadraticCurveTo(13, -82, 8, -70); ctx.stroke();
      if (girl) { ctx.beginPath(); ctx.moveTo(0, -92); ctx.lineTo(0, -80); ctx.stroke(); }
    }
    if (girl && P.bow) for (const sx of [-1, 1]) mkBow(ctx, P, 18.5 * sx, -70, sx);
    return;
  }
  /* hair cap + fringe */
  ctx.beginPath(); ctx.arc(0, -73, 20.6, Math.PI * 0.98, Math.PI * 2.02);
  if (girl) { ctx.lineTo(19.5, -71); ctx.lineTo(13, -64.5); ctx.lineTo(7, -72); ctx.lineTo(0.5, -66); ctx.lineTo(-7, -72.5); ctx.lineTo(-13, -65); ctx.lineTo(-19.5, -71); }
  else { ctx.lineTo(19.5, -73); ctx.lineTo(13, -66); ctx.lineTo(7.5, -73.5); ctx.lineTo(1.5, -66.5); ctx.lineTo(-5, -74); ctx.lineTo(-11.5, -66); ctx.lineTo(-19.5, -72); }
  ctx.closePath(); mkFill(ctx, P.hair, 1.7);
  if (!girl) { ctx.beginPath(); ctx.moveTo(-3, -92); ctx.quadraticCurveTo(0, -102, 6, -98); ctx.quadraticCurveTo(3, -95, 4, -91); ctx.closePath(); mkFill(ctx, P.hair, 1.5); }
  if (girl && P.bow) for (const sx of [-1, 1]) mkBow(ctx, P, 18 * sx, -71, sx);
  mkFaceFront(ctx, P, up, k.open);
}
function mkBow(ctx, P, x, y, sx) {
  ctx.save(); ctx.translate(x, y);
  mkPoly(ctx, [[0, 0], [-6.5 * sx, -4.8], [-6.5 * sx, 4.8]], P.bow, 1.4);
  mkPoly(ctx, [[0, 0], [6.5 * sx, -4.8], [6.5 * sx, 4.8]], P.bow, 1.4);
  mkCircle(ctx, 0, 0, 2, P.bow, 1.3);
  ctx.restore();
}
function mkRect(ctx, x, y, w, h, col, lw = 1.5) { ctx.beginPath(); ctx.rect(x, y, w, h); mkFill(ctx, col, lw); }
function mkRound(ctx, x, y, w, h, r, col, lw = 1.7) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); mkFill(ctx, col, lw);
}
function mkHeadSide(ctx, P, k, up) {
  const girl = !!P.dress;
  if (girl) mkEllipse(ctx, -14.5, -61, 6.8, 12.4, 0.32, P.hair, 1.7);
  mkRect(ctx, -3, -57, 9, 8, P.skinD);
  mkCircle(ctx, 1, -73, 19.4, P.skin);
  mkCircle(ctx, 20.2, -70, 2.5, P.skin, 1.5);           /* nose */
  mkCircle(ctx, -4.2, -71, 4.2, P.skin, 1.6);           /* ear */
  /* hair: back and top, with a fringe over the forehead */
  ctx.beginPath();
  ctx.moveTo(-18, -60); ctx.bezierCurveTo(-23, -84, -6, -97, 8, -94); ctx.bezierCurveTo(16, -92.5, 21, -85, 21, -78);
  ctx.lineTo(15.5, -81); ctx.lineTo(12.5, -74.5); ctx.lineTo(6.5, -80); ctx.lineTo(1, -72); ctx.lineTo(-2.5, -76.5);
  ctx.lineTo(-8, -66); ctx.lineTo(-11, -58); ctx.closePath(); mkFill(ctx, P.hair, 1.7);
  if (girl) { if (P.bow) mkBow(ctx, P, -14, -69, -1); }
  else { ctx.beginPath(); ctx.moveTo(-1, -94); ctx.quadraticCurveTo(3, -103, 9, -99); ctx.quadraticCurveTo(5, -96, 6, -92); ctx.closePath(); mkFill(ctx, P.hair, 1.5); }
  mkCircle(ctx, -4.2, -71, 4.2, P.skin, 1.6);
  mkFaceSide(ctx, P, up, k.open);
}

/* One child. ctx is translated to the feet (units); k holds the pose. */
function mkDrawKid(ctx, k) {
  const P = k.pal || (k.kind === 'girl' ? MK_GIRL : MK_BOY), girl = !!P.dress;
  const g = k.gait, ph = k.phase, run = Math.min(1, g * 1.2);
  const crouch = k.crouch * 11, LS = k.legS || 1, lift0 = 25 * (LS - 1);
  const bob = -Math.abs(Math.sin(ph)) * 3.4 * g + Math.sin(k.idle) * 0.6 + crouch;
  const spoolSide = k.spool ? (k.spool.x >= 0 ? 1 : -1) : 0;
  ctx.save(); ctx.scale(k.size, k.size);
  const kick = k.kick >= 0 ? k.kick : -1;
  const kickAng = kick < 0 ? 0 : kick < 0.45 ? -0.95 * Math.sin(kick / 0.45 * Math.PI / 2)
    : kick < 0.62 ? -0.95 + 2.3 * (kick - 0.45) / 0.17 : 1.35 * (1 - (kick - 0.62) / 0.38) ;
  if (k.view === 'side') {
    ctx.scale(k.dir, 1);
    const hipX = 0, hipY = -25 * LS + (crouch ? crouch * 0.55 : 0) + bob * 0.5;
    const A = (6 + 11 * run) * LS, H = (3 + 10 * run) * LS;
    const leg = (off, isKick) => {
      let fx, fy;
      if (isKick && kick >= 0) { fx = hipX + Math.sin(kickAng) * 24; fy = hipY + Math.cos(kickAng) * 24 * LS - Math.max(0, Math.sin(kickAng)) * 4; }
      else { const s = ph + off; fx = hipX + Math.sin(s) * A * (g > 0.05 ? 1 : 0.2) - 1; fy = -H * Math.max(0, Math.cos(s)) * (g > 0.05 ? 1 : 0); }
      return mkKnee(hipX, hipY, fx, fy, 12.6 * LS, 12.6 * LS, 1, 0.1);
    };
    const near = leg(0, true), far = leg(Math.PI, false);
    const drawLeg = (L, shade) => {
      const skin = shade ? P.skinD : P.skin;
      mkLimb(ctx, [[hipX, hipY], [L.x, L.y], [L.fx, L.fy - 4]], 7.4, P.pants ? (shade ? P.pantsD : P.pants) : skin);
      if (!P.pants) mkLimb(ctx, [[L.fx, L.fy - 8.5], [L.fx, L.fy - 4]], 7.4, P.sock);
      mkShoe(ctx, P, L.fx, L.fy, 1, 0);
    };
    drawLeg(far, true);
    /* far arm behind the body */
    const lean = 0.05 + 0.16 * run;
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY); ctx.translate(0, -lift0);
    const sh = [0.5, -47 + bob * 0.5];
    const armTo = (ang, len = 21) => [sh[0] + Math.sin(ang) * len, sh[1] + Math.cos(ang) * len];
    const swing = Math.sin(ph) * 0.95 * run;
    if (!(spoolSide && false)) mkArm(ctx, P, sh, armTo(-swing * 0.9 - 0.12 + 0.1), true, 0.8);
    /* body */
    if (girl) {
      ctx.beginPath(); ctx.moveTo(-9.5, -52 + bob * 0.5); ctx.lineTo(9.5, -52 + bob * 0.5); ctx.lineTo(15, -19); ctx.lineTo(-15, -19); ctx.closePath(); mkFill(ctx, P.dress);
      ctx.beginPath(); ctx.moveTo(-15, -19); for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-15 + 7.5 * i + 3.75, -13.5, -15 + 7.5 * (i + 1), -19);
      ctx.closePath(); mkFill(ctx, P.trim, 1.5);
    } else {
      mkRound(ctx, -10, -52 + bob * 0.5, 20, 28, 6, P.top);
      if (!mkShadow && P.stripe) { ctx.fillStyle = P.stripe; ctx.fillRect(-9.2, -41 + bob * 0.5, 18.4, 4); }
      mkRound(ctx, -10.6, -27, 21, 11, 3.5, P.bottom, 1.7);
    }
    const nearArm = k.spool && spoolSide ? null : armTo(swing * 0.9 + 0.1);
    if (k.spool) {
      const sx = k.dir * 0 + k.spool.x * k.dir, sy = k.spool.y, d = Math.hypot(sx, sy) || 1;
      const hand = [sh[0] + sx / d * 21, sh[1] + sy / d * 21];
      mkArm(ctx, P, sh, hand, false, 1);
      mkSpool(ctx, hand[0], hand[1] - 3, Math.atan2(sx, -sy) * 0.4);
      mkCircle(ctx, hand[0], hand[1], 3.6, P.skin, 1.5);
    } else if (k.hold) {
      mkArm(ctx, P, sh, [sh[0] + k.hold.x * 21, sh[1] + k.hold.y * 21], false, 1);
    } else mkArm(ctx, P, sh, nearArm, false, 1);
    /* head */
    ctx.save(); ctx.translate(1, -52); ctx.rotate(-0.16 * k.lookUp - lean * 0.6); ctx.scale(k.headS || 1, k.headS || 1); ctx.translate(-1, 52);
    mkHeadSide(ctx, P, k, k.lookUp);
    ctx.restore();
    ctx.restore();
    drawLeg(near, false);
  } else {
    const back = k.view === 'back', fy = back ? -1 : 1;
    const hipY = -25 * LS + crouch * 0.55 + bob * 0.5, hx = 7;
    const legs = [];
    for (const sx of [-1, 1]) {
      const s = ph + (sx > 0 ? 0 : Math.PI);
      let fxp = sx * (8.5 + 1.5 * run), fyp = fy * Math.sin(s) * 7 * run - 0;
      let lift = Math.max(0, Math.cos(s)) * 9 * run;
      if (kick >= 0 && sx > 0) { fyp = fy * (kickAng * 9); lift = Math.max(0, kickAng) * 8; fxp = 10; }
      const fp = [fxp, fyp - lift];
      legs.push({ sx, hip: [sx * hx, hipY], foot: fp, kn: mkKnee(sx * hx, hipY, fp[0], fp[1], 12.4 * LS, 12.4 * LS, sx * 0.3, fy) });
    }
    legs.sort((a, b) => a.foot[1] - b.foot[1]);
    for (const L of legs) {
      mkLimb(ctx, [L.hip, [L.kn.x, L.kn.y], [L.foot[0], L.foot[1] - 4]], 7.6, P.pants || P.skin);
      if (!P.pants) mkLimb(ctx, [[L.foot[0], L.foot[1] - 9.5], [L.foot[0], L.foot[1] - 4]], 7.6, P.sock);
      mkEllipse(ctx, L.foot[0] + L.sx * 0.8, L.foot[1] - 3, 6.2, 4.7, 0, P.shoe, 1.6);
    }
    ctx.save(); ctx.translate(0, -lift0);
    const swing = Math.sin(ph) * 0.5 * run;
    const shy = -47 + bob * 0.5;
    const armsDown = (sx) => [sx * (17.6 + 1.2 * run), shy + 20 - Math.abs(Math.cos(ph + (sx > 0 ? 0 : Math.PI))) * 0 + (sx > 0 ? swing : -swing) * 9 * fy];
    const doArm = (sx) => {
      const s0 = [sx * 14.5, shy];
      let hand = armsDown(sx);
      if (k.spool && spoolSide === sx) {
        const d = Math.hypot(k.spool.x, k.spool.y) || 1;
        hand = [s0[0] + k.spool.x / d * 22, s0[1] + k.spool.y / d * 22];
      } else if (k.wave && sx > 0) hand = [s0[0] + 9, s0[1] - 17 + Math.sin(k.idle * 7) * 3];
      mkArm(ctx, P, s0, hand, false, 1);
      if (k.spool && spoolSide === sx) { mkSpool(ctx, hand[0], hand[1] - 3, 0); mkCircle(ctx, hand[0], hand[1], 3.6, P.skin, 1.5); }
    };
    const behind = back ? [] : [];
    if (back) { doArm(-1); doArm(1); }
    if (girl) {
      ctx.beginPath(); ctx.moveTo(-12.5, -52 + bob * 0.5); ctx.lineTo(12.5, -52 + bob * 0.5); ctx.lineTo(19.5, -18 + bob * 0.3); ctx.lineTo(-19.5, -18 + bob * 0.3); ctx.closePath(); mkFill(ctx, P.dress);
      if (!back && !mkShadow) { ctx.strokeStyle = P.dressD; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-12, -46); ctx.quadraticCurveTo(0, -42, 12, -46); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-19.5, -18); for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(-19.5 + 7.8 * i + 3.9, -12.2, -19.5 + 7.8 * (i + 1), -18);
      ctx.closePath(); mkFill(ctx, P.trim, 1.5);
    } else {
      mkRound(ctx, -14.5, -52 + bob * 0.5, 29, 28, 7, P.top);
      if (!mkShadow && P.stripe) { ctx.fillStyle = P.stripe; ctx.fillRect(-13.6, -41.5 + bob * 0.5, 27.2, 4.2); }
      mkRound(ctx, -14.2, -27, 28.4, 12, 4, P.bottom, 1.7);
      if (!mkShadow) { ctx.strokeStyle = P.bottomD; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -18); ctx.stroke(); }
    }
    if (!back) { doArm(-1); doArm(1); }
    ctx.save(); ctx.translate(0, -52); ctx.rotate(0.03 * Math.sin(ph) * run); ctx.scale(k.headS || 1, k.headS || 1); ctx.translate(0, 52);
    ctx.translate(0, crouch * 0.4 + bob * 0.3);
    mkHeadFront(ctx, P, k, back, k.lookUp);
    ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}
function mkArm(ctx, P, s, h, far, a) {
  const k = far ? P.skinD : P.skin;
  mkLimb(ctx, [s, h], 6.6, k);
  /* sleeve */
  const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy) || 1;
  if (!P.dress) mkLimb(ctx, [s, [s[0] + dx / d * 8.5, s[1] + dy / d * 8.5]], 8.4, far ? P.topD : P.top);
  else mkLimb(ctx, [s, [s[0] + dx / d * 6.5, s[1] + dy / d * 6.5]], 8.4, far ? P.dressD : P.dress);
  mkCircle(ctx, h[0], h[1], 3.4, k, 1.5);
}

/* kite, drawn around its own centre */
function mkDrawKite(ctx, kt, time, lying) {
  const pal = kt.pal;
  ctx.save(); ctx.rotate(kt.ang);
  const T = [0, -56], R = [43, -14], B = [0, 58], L = [-43, -14], C = [0, -14];
  /* tail first so the body overlaps its root */
  const ribbons = lying ? 2 : 3;
  for (let i = 0; i < ribbons; i++) {
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const sway = lying ? Math.sin(t * 5 + i * 1.3 + kt.ph) * 20 * t
        : Math.sin(t * 6.2 - time * 3.1 + i * 1.7 + kt.ph) * (3 + 13 * t) + Math.sin(t * 2.4 - time * 1.4) * 5 * t;
      pts.push([sway + (i - 1) * 4.5 * (1 - t * 0.4), B[1] - 4 + t * (lying ? 74 : 112)]);
    }
    mkLimb(ctx, pts, 2.6, pal[(i + 1) % 4]);
    if (!mkShadow) for (let j = 3; j <= 12; j += 3) mkCircle(ctx, pts[j][0], pts[j][1], 3.1, pal[(i + j) % 4], 1.1);
  }
  const panel = (a, b, c, col) => mkPoly(ctx, [a, b, c], col, 1.3);
  panel(T, L, C, pal[0]); panel(T, R, C, pal[1]); panel(L, B, C, pal[2]); panel(R, B, C, pal[3]);
  ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(L[0], L[1]); ctx.closePath();
  ctx.strokeStyle = mkShadow ? '#fff' : MK_INK; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  if (!mkShadow) {
    ctx.strokeStyle = 'rgba(255,248,222,.95)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(B[0], B[1]); ctx.moveTo(L[0], L[1]); ctx.lineTo(R[0], R[1]); ctx.stroke();
  }
  ctx.restore();
}
function mkDrawBall(ctx, b) {
  ctx.save(); ctx.translate(b.x, b.y - b.z); const s = 1 + b.z * 0.004; ctx.scale(s * b.pop, s * b.pop);
  mkCircle(ctx, 0, 0, 9.6, '#fbfaf5', 1.7);
  if (!mkShadow) {
    for (let i = 0; i < 3; i++) {
      const a = b.roll + i * 2.0944, r = 5.4;
      mkPoly(ctx, [[Math.cos(a) * r - 2.4, Math.sin(a) * r - 2], [Math.cos(a) * r + 2.4, Math.sin(a) * r - 2.4], [Math.cos(a) * r + 2.8, Math.sin(a) * r + 2.2], [Math.cos(a) * r - 2.2, Math.sin(a) * r + 2.6]].map(p => {
        const dist = Math.hypot(p[0], p[1]), sc = dist > 9 ? 9 / dist : 1; return [p[0] * sc, p[1] * sc];
      }), '#3d4a63', 1.1);
    }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-3.2, -3.6, 2.1, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}
function mkDrawPop(ctx, x, y, t) {
  const s = 0.7 + Math.min(1, t * 5) * 0.5, a = 1 - Math.max(0, (t - 0.55) / 0.35);
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.max(0, a); ctx.scale(s, s); ctx.rotate(t * 1.2);
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 13, an = i * Math.PI / 5; pts.push([Math.cos(an) * r, Math.sin(an) * r]); }
  mkPoly(ctx, pts, '#ffd93b', 1.5);
  ctx.restore();
}
function mkDrawString(ctx, a, b, slack) {
  const cx = (a.x + b.x) / 2 - 6 * slack, cy = (a.y + b.y) / 2 + 24 * slack;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y);
  ctx.strokeStyle = mkShadow ? '#fff' : 'rgba(255,250,226,.95)'; ctx.lineWidth = mkShadow ? 1.4 : 1.7; ctx.lineCap = 'round'; ctx.stroke();
}

/* ======================================================================
   Play
   ====================================================================== */
const MK_HW = 480, MK_HH = 280;                          /* half size of the play field, units */
const MK_MARGIN = { l: 300, r: 400, t: 450, b: 140 };    /* how far kites, tails and shadows reach around it */
const mkRand = (a, b) => a + Math.random() * (b - a);
const mkClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mkEase = t => { t = mkClamp(t, 0, 1); return t * t * (3 - 2 * t); };
const MK_KITES = [
  { pal: ['#f0553f', '#f7c548', '#f7c548', '#e2452f'], bx: 175, by: -300 },
  { pal: ['#ec7bb0', '#6cc9b5', '#fbf3e0', '#a678e0'], bx: -200, by: -340 }
];

function mkMakeKid(kind, x, y) {
  return { kind, x, y, vx: 0, vy: 0, speed: 0, face: { x: 0, y: 1 }, view: 'front', dir: 1, phase: Math.random() * 6, gait: 0, kick: -1,
    lookUp: 0, crouch: 0, idle: Math.random() * 6, size: kind === 'girl' ? 0.93 : 1, go: null, maxSp: 90, look: null, open: 0, spool: null, wave: 0, pop: -1 };
}
function mkStepKid(k, dt, area) {
  let dx = 0, dy = 0, want = 0;
  if (k.go) {
    dx = k.go.x - k.x; dy = k.go.y - k.y;
    const d = Math.hypot(dx, dy);
    if (d > 2) { dx /= d; dy /= d; want = k.maxSp * mkClamp(d / (k.arrive || 55), 0.15, 1); }
    else { dx = dy = 0; }
  }
  const a = 1 - Math.exp(-dt * (k.accel || 8));
  k.vx += (dx * want - k.vx) * a; k.vy += (dy * want - k.vy) * a;
  k.x += k.vx * dt; k.y += k.vy * dt;
  if (area) { k.x = mkClamp(k.x, area.x - MK_HW - 40, area.x + MK_HW + 40); k.y = mkClamp(k.y, area.y - MK_HH - 30, area.y + MK_HH + 30); }
  const sp = Math.hypot(k.vx, k.vy); k.speed = sp;
  const spn = sp / k.size;
  k.gait += ((spn > 16 ? mkClamp(spn / 290, 0.28, 1.1) : 0) - k.gait) * (1 - Math.exp(-dt * 9));
  k.phase += spn * dt / 105 * 6.2832;
  k.idle += dt * 1.7;
  if (k.pop >= 0) { k.pop += dt; if (k.pop > 0.9) k.pop = -1; }
  if (k.kick >= 0) { k.kick += dt / (k.kickLen || 0.5); if (k.kick >= 1) k.kick = -1; }
  /* where to look */
  let fx = k.face.x, fy = k.face.y;
  if (sp > 30) { fx = k.vx / sp; fy = k.vy / sp; }
  else if (k.look) { const lx = k.look.x - k.x, ly = k.look.y - k.y, ld = Math.hypot(lx, ly); if (ld > 1) { fx = lx / ld; fy = ly / ld; } }
  const t = 1 - Math.exp(-dt * 12);
  k.face.x += (fx - k.face.x) * t; k.face.y += (fy - k.face.y) * t;
  const fl = Math.hypot(k.face.x, k.face.y) || 1; k.face.x /= fl; k.face.y /= fl;
  const vertical = Math.abs(k.face.y) > Math.abs(k.face.x) * (k.view === 'side' ? 1.45 : 0.75);
  if (vertical) k.view = k.face.y > 0 ? 'front' : 'back';
  else { k.view = 'side'; k.dir = k.face.x >= 0 ? 1 : -1; }
}

function createMeadowKidsScene() {
  const actorCv = document.createElement('canvas'), shadowCv = document.createElement('canvas');
  const actx = actorCv.getContext('2d'), sctx = shadowCv.getContext('2d');
  const tex = [gl.createTexture(), gl.createTexture()];
  let tw = 0, th = 0, sw = 0, sh = 0;
  let previous = null, layout = '', u = 0.36;
  const S = {
    time: 0, ac: { x: 700, y: 500 }, phase: 'kite', t: 0, dur: 25, queue: [], sub: '', nextTug: 6,
    kids: [mkMakeKid('boy', 0, 0), mkMakeKid('girl', 0, 0)],
    kites: MK_KITES.map((d, i) => ({ ...d, i, x: 0, y: 0, gx: 0, gy: 0, lift: 1, ang: 0, ph: i * 2.1, rx: 0, ry: 0, rvx: 0, rvy: 0 })),
    ball: { x: 0, y: 0, z: 0, roll: 0, vis: 0, pop: 0, state: 'setup', t: 0, holder: 0, sx: 0, sy: 0, tx: 0, ty: 0, T: 1, lob: false },
    tag: { it: 0, state: 'count', t: 0, side: 1, sideT: 0 }, wander: [4, 7], first: true
  };
  const kidsAt = i => S.kids[i];

  function cloudy(px, py) { return typeof curS === 'function' && (curS(px, py) < 45 || curS(px - 115, py - 156) < 45); }
  function chooseArea(prefer) {
    const sc = Math.max(0.24, Math.min(1.25, W / 1379, (H - TASKBAR) / 1141)) * 0.43;
    const loX = (MK_HW + MK_MARGIN.l) * sc + 8, hiX = W - (MK_HW + MK_MARGIN.r) * sc - 8;
    const loY = (MK_HH + MK_MARGIN.t) * sc + 8, hiY = H - TASKBAR - (MK_HH + MK_MARGIN.b) * sc - 8;
    const cx0 = hiX > loX ? [loX, hiX] : [W * 0.5, W * 0.5], cy0 = hiY > loY ? [loY, hiY] : [(H - TASKBAR) * 0.5, (H - TASKBAR) * 0.5];
    let best = null, bestScore = Infinity;
    for (let iy = 0; iy < 6; iy++) for (let ix = 0; ix < 8; ix++) {
      const cx = cx0[0] + (cx0[1] - cx0[0]) * (ix + 0.5) / 8, cy = cy0[0] + (cy0[1] - cy0[0]) * (iy + 0.5) / 6;
      let score = 0;
      for (let sy = -1; sy <= 1; sy += 0.5) for (let sx = -1; sx <= 1; sx += 0.5) if (cloudy(cx + sx * MK_HW * sc, cy + sy * MK_HH * sc)) score += 1;
      score += Math.hypot(cx - (prefer ? prefer.x * sc : W * 0.5), cy - (prefer ? prefer.y * sc : (H - TASKBAR) * 0.5)) * 0.004;
      if (score < bestScore) { bestScore = score; best = { x: cx / sc, y: cy / sc }; }
    }
    return { pos: best, score: bestScore, sc };
  }
  function areaScore(pos) {
    const sc = u; let score = 0;
    for (let sy = -1; sy <= 1; sy += 0.5) for (let sx = -1; sx <= 1; sx += 0.5) if (cloudy((pos.x + sx * MK_HW) * sc, (pos.y + sy * MK_HH) * sc)) score += 1;
    return score;
  }

  function home(i) { return { x: S.ac.x + (i ? 135 : -135), y: S.ac.y + (i ? -30 : 40) }; }
  function setKitesAir() { S.kites.forEach((kt, i) => { const k = S.kids[i]; kt.lift = 1; kt.x = k.x + kt.bx; kt.y = k.y + kt.by; }); }
  function enter(name) {
    S.phase = name; S.t = 0; S.sub = '';
    const [A, Bk] = S.kids;
    if (name === 'kite') {
      S.dur = mkRand(32, 48); S.wander = [mkRand(3, 6), mkRand(4, 8)]; S.nextTug = mkRand(4, 7);
      S.kites.forEach(kt => kt.lift = Math.max(kt.lift, 0));
    } else if (name === 'land') {
      S.dur = 99; S.sub = 'move';
      const cand = chooseArea(S.ac);
      if (cand.score + 0.5 < areaScore(S.ac) && Math.hypot(cand.pos.x - S.ac.x, cand.pos.y - S.ac.y) > 120) S.ac = cand.pos;
      S.kids.forEach((k, i) => { k.go = home(i); k.maxSp = 250; k.arrive = 70; k.look = null; });
    } else if (name === 'ball') {
      S.dur = mkRand(24, 34); S.sub = 'setup';
      const th = mkRand(-0.5, 0.5), Dd = 175, flip = Math.random() < 0.5 ? 1 : -1;
      S.ballHome = [{ x: S.ac.x - flip * Dd * Math.cos(th), y: S.ac.y - flip * Dd * Math.sin(th) * 0.55 },
        { x: S.ac.x + flip * Dd * Math.cos(th), y: S.ac.y + flip * Dd * Math.sin(th) * 0.55 }];
      const b = S.ball; b.state = 'setup'; b.t = 0; b.vis = 0; b.holder = Math.random() < 0.5 ? 0 : 1; b.pop = 0;
      S.kids.forEach((k, i) => { k.go = S.ballHome[i]; k.maxSp = 150; k.arrive = 60; k.spool = null; });
    } else if (name === 'tag') {
      S.dur = mkRand(22, 32);
      const t = S.tag; t.it = Math.random() < 0.5 ? 0 : 1; t.state = 'count'; t.t = 0; t.side = 1; t.sideT = 0;
      S.ball.vis = 0;
    } else if (name === 'pickup') {
      S.dur = 99; S.pk = [{ s: 'walk', t: 0 }, { s: 'walk', t: 0 }];
      S.ball.vis = 0;
    }
  }
  function nextPhase() {
    if (S.phase === 'kite') { S.queue = Math.random() < 0.5 ? ['ball', 'tag', 'pickup'] : ['tag', 'ball', 'pickup']; enter('land'); }
    else if (S.phase === 'land') enter(S.queue.shift());
    else if (S.phase === 'ball' || S.phase === 'tag') enter(S.queue.shift());
    else enter('kite');
  }
  function placeKids() {
    S.kids.forEach((k, i) => { const h = home(i); k.x = h.x; k.y = h.y; k.vx = k.vy = 0; k.go = null; });
    S.kites.forEach((kt, i) => { kt.lift = 1; kt.x = S.kids[i].x + kt.bx; kt.y = S.kids[i].y + kt.by; });
  }

  /* --- per-phase behaviour ------------------------------------------------- */
  function updateKiteFlyers(dt, flying) {
    S.kids.forEach((k, i) => {
      const kt = S.kites[i];
      if (flying && kt.lift > 0.5) k.look = { x: kt.x, y: kt.y };
    });
  }
  function stepKite(dt) {
    const [A, Bk] = S.kids;
    S.wander[0] -= dt; S.wander[1] -= dt;
    S.kids.forEach((k, i) => {
      if (S.wander[i] <= 0) {
        S.wander[i] = mkRand(6, 11);
        const other = S.kids[1 - i];
        let g = null;
        for (let n = 0; n < 12 && !g; n++) {
          const c = { x: mkClamp(k.x + mkRand(-300, 300), S.ac.x - MK_HW * 0.85, S.ac.x + MK_HW * 0.85), y: mkClamp(k.y + mkRand(-170, 170), S.ac.y - MK_HH * 0.8, S.ac.y + MK_HH * 0.8) };
          if (Math.hypot(c.x - other.x, c.y - other.y) > 170 && Math.hypot(c.x - k.x, c.y - k.y) > 90) g = c;
        }
        if (g) { k.go = g; k.maxSp = Math.random() < 0.35 ? 270 : 85; k.arrive = 50; }
      }
      if (k.go && Math.hypot(k.go.x - k.x, k.go.y - k.y) < 6) k.go = null;
    });
    S.nextTug -= dt;
    if (S.nextTug <= 0) { S.nextTug = mkRand(6, 10); const kt = S.kites[Math.random() < 0.5 ? 0 : 1]; kt.rvx += 90 * (Math.random() < 0.5 ? -1 : 1); kt.rvy -= 120; S.kids[kt.i].tug = 1; }
    if (S.t > S.dur) nextPhase();
  }
  function stepLand(dt) {
    if (S.sub === 'move') {
      let near = 0;
      S.kids.forEach((k, i) => { const h = home(i); if (Math.hypot(h.x - k.x, h.y - k.y) < 30) near++; });
      if (near === 2 || S.t > 14) {
        S.sub = 'lower'; S.lowerT = 0;
        S.kids.forEach((k, i) => { k.go = null; k.look = null; });
        S.kites.forEach((kt, i) => {
          const k = S.kids[i];
          kt.gx = mkClamp(k.x + (i ? -80 : 80), S.ac.x - MK_HW, S.ac.x + MK_HW); kt.gy = mkClamp(k.y + 6, S.ac.y - MK_HH, S.ac.y + MK_HH);
          kt.gang = mkRand(-0.9, 0.9);
        });
      }
    } else {
      S.lowerT += dt;
      S.kites.forEach(kt => { kt.lift = 1 - mkEase(S.lowerT / 3.4); });
      if (S.lowerT > 3.9) nextPhase();
    }
  }
  function stepBall(dt) {
    const b = S.ball, [A, Bk] = S.kids;
    b.t += dt; b.roll += 0; b.vis += (1 - b.vis) * (1 - Math.exp(-dt * 4));
    const holder = S.kids[b.holder], other = S.kids[1 - b.holder];
    const dirTo = (a, c) => { const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d, d }; };
    if (b.state === 'setup') {
      const ready = S.kids.every((k, i) => Math.hypot(S.ballHome[i].x - k.x, S.ballHome[i].y - k.y) < 18);
      S.kids.forEach((k, i) => { k.look = S.kids[1 - i]; });
      const d = dirTo(holder, other);
      b.x = holder.x + d.x * 22; b.y = holder.y + 3 + d.y * 12; b.z = 0;
      if (ready && b.t > 1.2) { b.state = 'prep'; b.t = 0; }
      return;
    }
    if (b.state === 'prep') {
      const d = dirTo(holder, other);
      b.x = holder.x + d.x * 22; b.y = holder.y + 3 + d.y * 12; b.z = 0;
      holder.look = other; other.look = holder;
      if (b.t > 0.7) { b.state = 'kick'; b.t = 0; holder.kick = 0; holder.kickLen = 0.55; b.launched = false; }
      return;
    }
    if (b.state === 'kick') {
      if (!b.launched && holder.kick >= 0.55) {
        b.launched = true;
        const home2 = S.ballHome[1 - b.holder];
        const d = dirTo(holder, other);
        const over = Math.random() < 0.22 ? mkRand(70, 130) : 0;
        b.sx = b.x; b.sy = b.y;
        b.tx = mkClamp(home2.x + mkRand(-45, 45) + d.x * over, S.ac.x - MK_HW - 20, S.ac.x + MK_HW + 20);
        b.ty = mkClamp(home2.y + mkRand(-35, 35) + d.y * over, S.ac.y - MK_HH - 10, S.ac.y + MK_HH + 10);
        b.lob = Math.random() < 0.45;
        const dist = Math.hypot(b.tx - b.sx, b.ty - b.sy);
        b.T = Math.max(0.7, dist / (b.lob ? 230 : 250) + 0.25);
        b.state = 'flight'; b.t = 0;
      }
      return;
    }
    if (b.state === 'flight') {
      const tau = mkClamp(b.t / b.T, 0, 1);
      const f = b.lob ? 1 - Math.pow(1 - tau, 1.5) : 1 - Math.pow(1 - tau, 2.2);
      const px = b.x, py = b.y;
      b.x = b.sx + (b.tx - b.sx) * f; b.y = b.sy + (b.ty - b.sy) * f;
      b.z = b.lob ? 62 * Math.sin(Math.PI * mkClamp(tau / 0.8, 0, 1)) : 0;
      b.roll += Math.hypot(b.x - px, b.y - py) / 9.6;
      /* the receiver walks to where the ball will stop */
      const d = dirTo({ x: b.tx, y: b.ty }, holder);
      other.go = { x: b.tx + d.x * 22, y: b.ty + d.y * 12 - 3 };
      other.maxSp = mkClamp(Math.hypot(other.go.x - other.x, other.go.y - other.y) / (b.T * 0.85), 70, 300); other.arrive = 25;
      other.look = { x: b.x, y: b.y };
      holder.look = other; holder.go = null;
      if (tau >= 1) { b.state = 'trap'; b.t = 0; b.z = 0; }
      return;
    }
    if (b.state === 'trap') {
      other.look = holder;
      if (b.t > 0.45) {
        b.holder = 1 - b.holder; b.state = 'prep'; b.t = 0;
        const prev = holder; prev.go = { x: S.ballHome[b.holder === 0 ? 1 : 0].x + mkRand(-25, 25), y: S.ballHome[b.holder === 0 ? 1 : 0].y + mkRand(-20, 20) };
        prev.maxSp = 120; prev.arrive = 40;
        other.go = null;
      }
    }
    if (S.t > S.dur && b.state === 'prep') nextPhase();
  }
  function stepTag(dt) {
    const T = S.tag, ch = S.kids[T.it], ru = S.kids[1 - T.it];
    T.t += dt; T.sideT -= dt;
    const dx = ru.x - ch.x, dy = ru.y - ch.y, dist = Math.hypot(dx, dy) || 1;
    const ax0 = S.ac.x - MK_HW, ax1 = S.ac.x + MK_HW, ay0 = S.ac.y - MK_HH, ay1 = S.ac.y + MK_HH;
    S.kids.forEach(k => { k.spool = null; });
    const flee = () => {
      if (T.sideT <= 0 || dist < 80 && T.sideT < 0.6) { T.side = Math.random() < 0.5 ? -1 : 1; T.sideT = mkRand(0.9, 1.6); }
      let fx = dx / dist - dy / dist * T.side * 0.6, fy = dy / dist + dx / dist * T.side * 0.6;
      const m = 130;
      if (ru.x < ax0 + m) fx += (ax0 + m - ru.x) / m * 2; if (ru.x > ax1 - m) fx -= (ru.x - (ax1 - m)) / m * 2;
      if (ru.y < ay0 + m) fy += (ay0 + m - ru.y) / m * 2; if (ru.y > ay1 - m) fy -= (ru.y - (ay1 - m)) / m * 2;
      const l = Math.hypot(fx, fy) || 1;
      ru.go = { x: ru.x + fx / l * 170, y: ru.y + fy / l * 170 };
    };
    if (T.state === 'count') {
      ch.go = null; ch.look = ru; ch.wave = 0;
      if (T.t < 0.6) { ru.go = null; ru.look = ch; } else flee();
      ru.maxSp = 280; ru.arrive = 20; ru.accel = 9;
      if (T.t > 1.7) { T.state = 'chase'; T.t = 0; }
    } else if (T.state === 'chase') {
      flee();
      ru.maxSp = mkClamp(285 - Math.max(0, T.t - 3.5) * 14, 190, 285); ru.arrive = 20; ru.look = null;
      ch.go = { x: ru.x + ru.vx * 0.28, y: ru.y + ru.vy * 0.28 }; ch.maxSp = 262 + Math.min(T.t, 8) * 15; ch.arrive = 20; ch.look = null; ch.accel = 9;
      if (dist < 34) { T.state = 'pause'; T.t = 0; ru.pop = 0; ch.go = null; ru.go = null; ch.look = ru; ru.look = ch; }
    } else {
      ch.go = null; ru.go = null; ch.look = ru; ru.look = ch;
      if (T.t > 1.0) { T.it = 1 - T.it; T.state = 'count'; T.t = 0; if (S.t > S.dur) nextPhase(); }
    }
  }
  function stepPickup(dt) {
    let done = 0;
    S.kids.forEach((k, i) => {
      const kt = S.kites[i], p = S.pk[i];
      p.t += dt; k.spool = null;
      if (p.s === 'walk') {
        k.go = { x: kt.gx - (i ? -22 : 22), y: kt.gy + 14 }; k.maxSp = 150; k.arrive = 40; k.look = { x: kt.gx, y: kt.gy };
        if (Math.hypot(k.go.x - k.x, k.go.y - k.y) < 14) { p.s = 'bend'; p.t = 0; k.go = null; }
      } else if (p.s === 'bend') {
        k.crouch = mkEase(p.t / 0.5) * (1 - mkEase((p.t - 0.55) / 0.35));
        if (p.t > 0.9) { p.s = 'launch'; p.t = 0; k.crouch = 0; k.run0 = { x: k.x, y: k.y }; }
      } else if (p.s === 'launch') {
        k.crouch = 0;
        kt.lift = mkEase(p.t / 3.3);
        k.go = p.t < 1.2 ? { x: k.run0.x + (i ? 70 : -70), y: k.run0.y + 150 } : null; k.maxSp = 215; k.arrive = 30;
        k.look = { x: kt.x, y: kt.y };
        if (p.t > 3.5) { p.s = 'done'; }
      } else done++;
    });
    if (done === 2) nextPhase();
  }

  function stepSim(dt) {
    S.time += dt; S.t += dt;
    const ph = S.phase;
    if (ph === 'kite') stepKite(dt);
    else if (ph === 'land') stepLand(dt);
    else if (ph === 'ball') stepBall(dt);
    else if (ph === 'tag') stepTag(dt);
    else stepPickup(dt);
    const flying = ph === 'kite' || ph === 'land' || ph === 'pickup';
    S.kids.forEach((k, i) => {
      const kt = S.kites[i];
      /* kites follow their child */
      const wind = S.time;
      let tx = k.x + kt.bx + Math.sin(wind * 0.72 + kt.ph) * 24 + Math.sin(wind * 1.23 + kt.ph * 2) * 7 - k.vx * 0.3;
      let ty = k.y + kt.by + Math.sin(wind * 0.49 + kt.ph + 0.6) * 12 - k.vy * 0.2 + Math.min(k.speed, 280) * 0.12;
      const lift = mkEase(kt.lift > 0.999 ? 1 : kt.lift);
      const rest = { x: kt.gx, y: kt.gy };
      if (kt.lift < 0.999 && ph !== 'kite') {
        kt.x = rest.x + (tx - rest.x) * lift; kt.y = rest.y + (ty - rest.y) * lift - Math.sin(Math.PI * lift) * 30;
        if (ph === 'land' && S.sub === 'move') { kt.x = tx; kt.y = ty; }
      } else {
        const f = 1 - Math.exp(-dt / 0.24);
        kt.x += (tx - kt.x) * f; kt.y += (ty - kt.y) * f;
      }
      /* spring reaction to tugs */
      kt.rvx += (-18 * kt.rx - 3.4 * kt.rvx) * dt; kt.rvy += (-22 * kt.ry - 4 * kt.rvy) * dt;
      kt.rx += kt.rvx * dt; kt.ry += kt.rvy * dt;
      kt.ang = kt.lift > 0.98 || ph === 'kite' ? -0.22 + Math.sin(S.time * 0.7 + kt.ph) * 0.1 + Math.sin(S.time * 4.8 + kt.ph) * Math.min(1, k.speed / 280) * 0.2 + kt.rx * 0.01
        : (kt.gang || 0) * (1 - lift) + (-0.22) * lift;
      if (k.tug > 0) k.tug = Math.max(0, k.tug - dt / 1.1);
      /* what the child holds */
      const holding = kt.lift > 0.04 && (ph === 'kite' || ph === 'land' || ph === 'pickup');
      if (holding) {
        const dx = kt.x + kt.rx - k.x, dy = kt.y + kt.ry - (k.y - 50);
        const d = Math.hypot(dx, dy) || 1;
        k.spool = { x: dx / d, y: dy / d };
        k.lookUp += (1 - k.lookUp) * (1 - Math.exp(-dt * 6));
      } else { k.spool = null; k.lookUp += (0 - k.lookUp) * (1 - Math.exp(-dt * 6)); }
      k.open = k.speed > 150 ? 1 : 0;
      if (k.pop >= 0 || k.tug > 0.2) k.open = 1;
      k.wave = 0;
      if (!holding && ph !== 'kite' && S.phase !== 'pickup') k.look = k.look;
      if (ph === 'kite' || (ph === 'land' && S.sub === 'lower') || ph === 'pickup') { /* keep looking at the kite */ if (holding) k.look = { x: kt.x, y: kt.y }; }
      mkStepKid(k, dt, S.ac);
    });
    if (S.phase !== 'ball') S.ball.vis += (0 - S.ball.vis) * (1 - Math.exp(-dt * 6));
  }

  /* --- drawing ------------------------------------------------------------ */
  function drawAll(ctx, shadow, kt_) {
    mkShadow = shadow;
    const kids = S.kids.slice().sort((a, b) => a.y - b.y);
    const SH = { x: -0.58, y: -0.3 };
    if (shadow) {
      for (const k of kids) {
        ctx.save(); ctx.translate(k.x, k.y);
        mkEllipse(ctx, 0, 1, 15 * k.size, 5, 0, '#fff', 0);
        ctx.transform(1, 0, SH.x, SH.y, 0, 0); mkDrawKid(ctx, k);
        ctx.restore();
      }
      S.kites.forEach(kt => {
        const h = mkEase(kt.lift);
        ctx.save(); ctx.translate(kt.gx + (kt.x - kt.gx) * h + 100 * h + 3, kt.gy + (kt.y - kt.gy) * h + 255 * h + 4);
        ctx.scale(0.9, 0.9);
        mkDrawKite(ctx, { ...kt, ang: kt.ang * 0.8 }, S.time, h < 0.02);
        ctx.restore();
      });
      const b = S.ball;
      if (b.vis > 0.05) { ctx.save(); ctx.translate(b.x + 0.4 * b.z + 3, b.y + 0.2 * b.z + 5); ctx.scale(1, 0.55); mkCircle(ctx, 0, 0, 9 * b.vis, '#fff', 0); ctx.restore(); }
      return;
    }
    /* lying kites */
    S.kites.forEach(kt => {
      if (kt.lift < 0.3) { ctx.save(); ctx.translate(kt.gx, kt.gy); ctx.scale(0.62, 0.62 * 0.78); mkDrawKite(ctx, { ...kt, ang: kt.gang || 0 }, S.time, true); ctx.restore(); }
    });
    /* shadows of the kids' feet are in the shadow layer; now ball + kids sorted by depth */
    const items = kids.map(k => ({ y: k.y, kid: k }));
    const b = S.ball;
    if (b.vis > 0.05) items.push({ y: b.y, ball: b });
    items.sort((p, q) => p.y - q.y);
    for (const it of items) {
      if (it.kid) {
        const k = it.kid;
        ctx.save(); ctx.translate(k.x, k.y); mkDrawKid(ctx, k); ctx.restore();
        if (k.pop >= 0) mkDrawPop(ctx, k.x + 22, k.y - 100, k.pop);
      } else { it.ball.pop = it.ball.vis; mkDrawBall(ctx, it.ball); }
    }
    /* strings and kites in the air */
    S.kites.forEach((kt, i) => {
      if (kt.lift < 0.04) return;
      const k = S.kids[i];
      const lx = Math.cos(kt.ang), ly = Math.sin(kt.ang);
      const bridle = { x: kt.x + kt.rx - ly * -(-14) * 1 + (-14) * -ly * 0, y: kt.y + kt.ry };
      const kp = { x: kt.x + kt.rx + (0 * lx - (-14) * ly) * 0.9 , y: kt.y + kt.ry + (0 * ly + (-14) * lx) * 0.9 + 14 };
      const sp = k.spool ? { x: k.x + (k.spool.x >= 0 ? 1 : -1) * 0 + k.spool.x * 22 + (k.view === 'side' ? 0 : (k.spool.x >= 0 ? 14.5 : -14.5)), y: k.y - 47 * k.size + k.spool.y * 22 - 3 } : { x: k.x, y: k.y - 50 };
      mkDrawString(ctx, sp, kp, 1 - mkClamp(k.tug || 0, 0, 1) * 0.85);
    });
    S.kites.forEach(kt => {
      if (kt.lift < 0.3) return;
      ctx.save(); ctx.translate(kt.x + kt.rx, kt.y + kt.ry); ctx.globalAlpha = 1;
      const sc = 0.62 + 0.38 * mkEase((kt.lift - 0.3) / 0.7);
      ctx.scale(sc, sc); mkDrawKite(ctx, kt, S.time, false); ctx.restore();
    });
  }

  function render(visible) {
    const k = cv._scale, kt = Math.min(k, 2);
    const reg = { x0: (S.ac.x - MK_HW - MK_MARGIN.l) * u, y0: (S.ac.y - MK_HH - MK_MARGIN.t) * u, x1: (S.ac.x + MK_HW + MK_MARGIN.r) * u, y1: (S.ac.y + MK_HH + MK_MARGIN.b) * u };
    const left = Math.floor(reg.x0 * k) / k, top = Math.floor(reg.y0 * k) / k;
    const aw = Math.ceil((reg.x1 - left) * kt), ah = Math.ceil((reg.y1 - top) * kt);
    const resized = aw !== tw || ah !== th;
    if (resized) {
      tw = aw; th = ah; actorCv.width = aw; actorCv.height = ah;
      sw = Math.ceil(aw / 2); sh = Math.ceil(ah / 2); shadowCv.width = sw; shadowCv.height = sh;
    }
    actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, aw, ah);
    actx.setTransform(kt * u, 0, 0, kt * u, -left * kt, -top * kt);
    drawAll(actx, false);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.fillStyle = '#000'; sctx.fillRect(0, 0, sw, sh);
    sctx.setTransform(kt * u * 0.5, 0, 0, kt * u * 0.5, -left * kt * 0.5, -top * kt * 0.5);
    drawAll(sctx, true);
    mkShadow = false;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const up = (unit, texture, canvas, w, h, fresh) => {
      gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, texture);
      if (fresh) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    };
    up(gl.TEXTURE5, tex[0], actorCv, aw, ah, resized || !S.uploaded);
    up(gl.TEXTURE6, tex[1], shadowCv, sw, sh, resized || !S.uploaded);
    S.uploaded = true;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return [left, top, aw / kt, ah / kt];
  }

  return {
    S,
    step(now, visible = true) {
      const dtAll = previous === null ? 0 : Math.min(0.1, Math.max(0, (now - previous) / 1000)); previous = now;
      const nextLayout = [W, H, TASKBAR].join(',');
      if (nextLayout !== layout) {
        layout = nextLayout;
        u = Math.max(0.24, Math.min(1.25, W / 1379, (H - TASKBAR) / 1141)) * 0.43;
        S.ac = chooseArea(null).pos;
        placeKids();
        if (S.first) { S.first = false; enter('kite'); S.dur = mkRand(20, 28); }
        else if (S.phase !== 'kite' && S.phase !== 'land') { S.kites.forEach((kt, i) => { kt.gx = S.kids[i].x + (i ? -80 : 80); kt.gy = S.kids[i].y + 6; kt.lift = 0; }); }
      }
      let left = dtAll;
      while (left > 0) { const d = Math.min(left, 1 / 30); stepSim(d); left -= d; }
      const sc = u;
      const state = {
        layout, time: S.time, phase: S.phase,
        avoid: { x0: (S.ac.x - MK_HW - 130) * sc, y0: (S.ac.y - MK_HH - 130) * sc, x1: (S.ac.x + MK_HW + 130) * sc, y1: (S.ac.y + MK_HH + 170) * sc }
      };
      if (!visible) return { state };
      const rect = render(true);
      return { rect, shadow: tex[1], actor: tex[0], state };
    },
    debug: { jump(name) { S.queue = name === 'pickup' ? [] : ['tag', 'pickup']; if (name === 'land') { enter('land'); } else if (name === 'ball') { S.queue = ['tag', 'pickup']; enter('ball'); } else enter(name); } }
  };
}

let meadowKidsScene = null;
function prepareMeadowKids(now, visible = true) {
  if (!meadowKidsScene) meadowKidsScene = createMeadowKidsScene();
  return meadowKidsScene.step(now, visible);
}
