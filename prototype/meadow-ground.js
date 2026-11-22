/* Meadow ground: the grass, flowers and weeds.
   This shader is drawn ONCE into a texture (on start, on resize and on "New clouds"),
   so all the detail below costs nothing per frame. The main shader only samples it. */
const MEADOW_GROUND_FS = `#version 300 es
precision highp float;
uniform sampler2D uNoise;
uniform vec2 uRes;
uniform float uScale, uSeed;
out vec4 o;

const vec3 G_LIGHT = vec3(0.76, 0.83, 0.52), G_MID = vec3(0.62, 0.75, 0.42);
const vec3 G_DEEP = vec3(0.52, 0.68, 0.36);
const vec3 INK = vec3(0.24, 0.38, 0.18);
const float PI = 3.14159265;

float hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) { return vec2(hash2(p), hash2(p + 41.7)); }
float ss(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
vec4 N(vec2 p, float scale) { return texture(uNoise, p / scale + uSeed * 0.013); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0)); }

/* --- the original pen strokes (short hatching) ------------------------------------ */
float grassInk(vec2 p) {
  const vec2 G = vec2(12.0, 6.0);
  vec2 c0 = floor(p / G);
  float ink = 0.0;
  for (int j = -1; j <= 1; j++) {
    vec2 c = c0 + vec2(0.0, float(j));
    vec2 cp = (c + 0.5) * G;
    float h = hash2(c + 3.1);
    float dens = 0.62 * ss(0.42, 0.72, N(cp, 900.0).r) * ss(0.35, 0.6, N(cp + 50.0, 380.0).g) + 0.02;
    if (h > dens) continue;
    float ang = (N(cp, 1400.0).g - 0.5) * 0.7 + (hash2(c + 7.7) - 0.5) * 0.3;
    float len = 2.5 + 3.0 * hash2(c + 1.9);
    vec2 ctr = cp + (vec2(hash2(c + 4.3), hash2(c + 5.9)) - 0.5) * vec2(2.0, 3.0);
    vec2 dir = vec2(cos(ang), sin(ang)) * len;
    float d = segD(p, ctr - dir, ctr + dir);
    ink = max(ink, (1.0 - ss(0.2, 0.9, d)) * (0.35 + 0.45 * hash2(c + 9.1)));
  }
  return ink;
}

/* --- a fan of curved grass blades; q is relative to the base of the tuft (y is down) --- */
vec3 tuft(vec3 col, vec2 q, float n, float len, float spread, float lean, float sv, vec3 inkC, vec3 lightC, float w) {
  for (int b = 0; b < 9; b++) {
    if (float(b) >= n) break;
    float fb = (float(b) + 0.5) / n - 0.5;
    float hb = hash2(vec2(float(b) + sv * 3.7, sv));
    float ang = fb * spread + lean + (hb - 0.5) * 0.2;
    float L = len * (1.0 - 0.5 * abs(fb) * 2.0) * (0.72 + 0.5 * hb);
    vec2 dir = vec2(sin(ang), -cos(ang)), nrm = vec2(cos(ang), sin(ang));
    float bend = ((hb - 0.5) * 0.35 + fb * 0.3) * L * 0.5;
    vec2 mid = dir * L * 0.5 + nrm * bend * 0.35, tip = dir * L + nrm * bend;
    if (mod(float(b), 2.0) < 0.5) {
      float dl = min(segD(q + vec2(1.1, 0.0), vec2(0.0), mid), segD(q + vec2(1.1, 0.0), mid, tip));
      col = mix(col, lightC, (1.0 - ss(w * 0.6, w * 0.6 + 0.7, dl)) * 0.75);
    }
    float d = min(segD(q, vec2(0.0), mid), segD(q, mid, tip));
    col = mix(col, inkC, (1.0 - ss(w - 0.3, w + 0.55, d)) * (0.78 + 0.2 * hb));
  }
  return col;
}

vec3 tufts(vec3 col, vec2 p) {
  const vec2 G = vec2(34.0, 26.0);
  vec2 c0 = floor(p / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j));
    vec2 cp = (c + 0.5) * G;
    float dens = 0.1 + 0.5 * ss(0.45, 0.72, N(cp + 300.0, 700.0).g);
    if (hash2(c + 61.3) > dens) continue;
    vec2 ctr = cp + (hash22(c + 8.1) - 0.5) * G * 0.85;
    vec2 q = p - ctr;
    if (q.y < -22.0 || q.y > 5.0 || abs(q.x) > 14.0) continue;
    float sv = hash2(c + 2.2);
    col = tuft(col, q, 3.0 + floor(sv * 3.0), 8.0 + 6.0 * hash2(c + 5.5), 1.0 + 0.5 * sv, (hash2(c + 9.9) - 0.5) * 0.4,
               sv * 19.0, vec3(0.30, 0.46, 0.2), vec3(0.88, 0.93, 0.55), 0.62);
  }
  return col;
}

/* --- angular helpers for rosettes and flowers ------------------------------------- */
vec2 spoke(float th, float n, float rot) {
  float s = 6.2831853 / n;
  float a = th - rot + 0.5 * s;
  float i = floor(a / s);
  return vec2(a - i * s - 0.5 * s, i);
}

/* a ring of pointed or broad leaves around a centre */
vec4 rosette(vec2 q, float n, float len, float wid, float rot, vec3 cDark, vec3 cLight, float sv, float jag) {
  float r = length(q);
  if (r > len * 1.3 || r < 0.001) return vec4(0.0);
  vec2 sp = spoke(atan(q.y, q.x), n, rot);
  float idx = mod(sp.y, n);
  float L = len * (0.78 + 0.35 * hash2(vec2(idx, sv)));
  float t = clamp(r / L, 0.0, 1.0);
  float hw = wid * pow(max(sin(PI * pow(t, 0.75)), 0.0), 0.7) * (1.0 + jag * sin(r * 1.9 + idx * 2.0));
  float across = abs(sin(sp.x)) * r;
  float d = max(across - hw, r - L);
  float a = 1.0 - ss(-0.1, 0.55, d);
  vec3 c = mix(cDark, cLight, (1.0 - ss(0.0, 0.9, across)) * 0.65 + 0.2 * t);
  c = mix(c, INK * 0.9, ss(-1.0, 0.0, d) * 0.75);
  return vec4(c, a);
}

/* one small flower seen from above, species sp in [0,1) */
vec4 flower(vec2 q, float R, float sp, float rot) {
  float r = length(q);
  if (r > R * 1.5) return vec4(0.0);
  float th = atan(q.y, q.x) - rot;
  int s = int(sp * 6.0);
  float n = 5.0, a = 0.7, k = 0.7, cr = 0.22;
  vec3 pc = vec3(0.43, 0.60, 0.88), cc = vec3(0.99, 0.93, 0.6);
  if (s == 0) { n = 10.0; a = 0.5;  k = 3.0;  cr = 0.3;  pc = vec3(0.99, 0.98, 0.93); cc = vec3(0.98, 0.8, 0.14); }
  else if (s == 1) { n = 5.0; a = 0.78; k = 0.55; cr = 0.2;  pc = vec3(0.98, 0.84, 0.18); cc = vec3(0.93, 0.62, 0.06); }
  else if (s == 2) { n = 8.0; a = 0.86; k = 0.4;  cr = 0.0;  pc = vec3(0.9, 0.5, 0.7);  cc = pc; }
  else if (s == 3) { n = 4.0; a = 0.85; k = 0.35; cr = 0.24; pc = vec3(0.88, 0.2, 0.16); cc = vec3(0.2, 0.12, 0.1); }
  else if (s == 5) { n = 5.0; a = 0.72; k = 0.8;  cr = 0.2;  pc = vec3(0.67, 0.53, 0.85); cc = vec3(0.98, 0.88, 0.4); }
  float pr = R * (a + (1.0 - a) * pow(abs(cos(0.5 * n * th)), k));
  float d = r - pr;
  float al = 1.0 - ss(-0.05, 0.55, d);
  vec3 c = pc * mix(0.86, 1.04, ss(0.0, 1.0, r / R));
  if (s == 2) c = mix(c, vec3(1.0, 0.8, 0.9), step(0.72, hash2(floor(q * 1.7) + 3.0)) * 0.7);
  c = mix(c, pc * 0.5, ss(-1.1, -0.05, d) * 0.85);
  if (cr > 0.0) {
    float dc = r - R * cr;
    c = mix(c, cc, (1.0 - ss(-0.1, 0.45, dc)));
    c = mix(c, cc * 0.6, ss(-0.8, 0.0, dc) * (1.0 - ss(0.0, 0.5, dc)) * 0.7);
  }
  return vec4(c, al);
}

vec3 flowers(vec3 col, vec2 p) {
  const vec2 G = vec2(96.0, 80.0);
  vec2 c0 = floor(p / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j));
    vec2 cp = (c + 0.5) * G;
    float pf = 0.05 + 0.42 * ss(0.52, 0.72, N(cp + 400.0, 640.0).r);
    if (hash2(c + 71.9) > pf) continue;
    vec2 ctr = cp + (hash22(c + 4.4) - 0.5) * G * 0.4;
    if (length(p - ctr) > 46.0) continue;
    float species = hash2(c + 13.7);
    float count = 2.0 + floor(hash2(c + 1.3) * 5.0);
    for (int m = 0; m < 6; m++) {
      if (float(m) >= count) break;
      vec2 h2 = hash22(c * 1.7 + float(m) * 3.31);
      vec2 fc = ctr + (h2 - 0.5) * vec2(54.0, 40.0);
      vec2 q = p - fc;
      if (dot(q, q) > 110.0) continue;
      float sp = hash2(c + float(m) * 5.7) < 0.75 ? species : hash2(c + float(m) + 9.1);
      float R = 3.4 + 2.0 * hash2(fc);
      float rot = hash2(fc + 2.0) * 6.283;
      float sh = 1.0 - ss(0.0, R * 1.1, length(q - vec2(1.4, 1.9)));
      col *= 1.0 - 0.18 * sh;
      vec2 lq = q - vec2(-0.4, 1.6);
      float leaf = 1.0 - ss(0.0, 0.6, length(lq * vec2(0.6, 1.0)) - R * 0.62);
      col = mix(col, vec3(0.4, 0.58, 0.28), leaf * 0.6 * step(R * 0.6, length(q)));
      vec4 f = flower(q, R, sp, rot);
      col = mix(col, f.rgb, f.a);
    }
  }
  return col;
}

/* --- weeds: dandelions, plantain and wild tufts ------------------------------------ */
vec3 weeds(vec3 col, vec2 p) {
  const vec2 G = vec2(120.0, 96.0);
  vec2 c0 = floor(p / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j));
    vec2 cp = (c + 0.5) * G;
    float dens = 0.2 + 0.4 * ss(0.5, 0.72, N(cp + 120.0, 800.0).g);
    if (hash2(c + 11.3) > dens) continue;
    vec2 ctr = cp + (hash22(c + 5.5) - 0.5) * G * 0.7;
    vec2 q = p - ctr;
    if (dot(q, q) > 30.0 * 30.0) continue;
    float kind = hash2(c + 23.7), sv = hash2(c + 3.3);
    float rot = sv * 6.283;
    col *= 1.0 - 0.2 * (1.0 - ss(0.0, 13.0, length(q - vec2(2.0, 3.0))));
    if (kind < 0.4) {
      /* dandelion: toothed leaves with a yellow flower or a white seed ball */
      vec4 l = rosette(q, 9.0, 11.0 + 3.0 * sv, 2.3, rot, vec3(0.3, 0.49, 0.2), vec3(0.58, 0.72, 0.34), sv * 13.0, 0.35);
      col = mix(col, l.rgb, l.a);
      float r = length(q);
      float th = atan(q.y, q.x);
      if (hash2(c + 31.1) < 0.55) {
        float pr = 4.0 * (0.82 + 0.18 * abs(cos(5.0 * th)));
        float d = r - pr;
        vec3 y = mix(vec3(0.99, 0.84, 0.14), vec3(0.97, 0.68, 0.08), ss(0.0, 4.0, r));
        y = mix(y, vec3(0.62, 0.42, 0.06), ss(-1.0, 0.0, d) * 0.8);
        col = mix(col, y, 1.0 - ss(-0.05, 0.55, d));
      } else {
        float pr = 4.8;
        float d = r - pr;
        vec3 w = vec3(0.97, 0.97, 0.93) - 0.11 * abs(sin(12.0 * th)) * ss(1.0, 3.5, r);
        w = mix(w, vec3(0.5, 0.5, 0.4), (1.0 - ss(0.8, 1.6, r)) * 0.9);
        w = mix(w, vec3(0.62, 0.66, 0.6), ss(-1.0, 0.0, d) * 0.8);
        col = mix(col, w, 1.0 - ss(-0.05, 0.6, d));
      }
    } else if (kind < 0.72) {
      /* plantain: broad leaves with a couple of seed spikes */
      vec4 l = rosette(q, 6.0, 12.0 + 2.0 * sv, 4.6, rot, vec3(0.27, 0.45, 0.22), vec3(0.5, 0.68, 0.34), sv * 7.0, 0.0);
      col = mix(col, l.rgb, l.a);
      for (int s = 0; s < 3; s++) {
        float hs = hash2(c + float(s) * 7.7 + 40.0);
        if (hs < 0.35 && s > 0) continue;
        float a = (hs - 0.5) * 2.4 - 0.2;
        vec2 dir = vec2(sin(a), -cos(a));
        float L = 13.0 + 8.0 * hash2(c + float(s) * 3.1);
        float ds = segD(q, vec2(0.0), dir * L);
        col = mix(col, vec3(0.36, 0.52, 0.22), (1.0 - ss(0.45, 1.05, ds)) * 0.9);
        float dh = segD(q, dir * (L - 5.5), dir * L);
        col = mix(col, vec3(0.42, 0.3, 0.16), (1.0 - ss(1.0, 1.9, dh)) * 0.95);
        col = mix(col, vec3(0.62, 0.48, 0.26), (1.0 - ss(0.0, 0.9, segD(q + vec2(0.6, 0.0), dir * (L - 5.0), dir * (L - 0.6)))) * 0.55);
      }
    } else {
      /* a big wild tuft of long, dark grass */
      col = tuft(col, q + vec2(0.0, 6.0), 9.0, 17.0 + 5.0 * sv, 1.9, (sv - 0.5) * 0.3, sv * 31.0,
                 vec3(0.22, 0.38, 0.16), vec3(0.8, 0.9, 0.5), 0.8);
    }
  }
  return col;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uScale - gl_FragCoord.y) / uScale;

  float w1 = N(p, 1900.0).b, w2 = N(p + 311.0, 650.0).g;
  vec3 col = mix(G_MID, G_LIGHT, ss(0.3, 0.75, w1 * 0.7 + w2 * 0.3));
  col = mix(col, G_DEEP, ss(0.45, 0.85, N(p + 977.0, 1300.0).r) * 0.4);
  col = mix(col, vec3(0.85, 0.87, 0.47), ss(0.62, 0.86, N(p + 2100.0, 260.0).b) * 0.2);
  col = mix(col, vec3(0.44, 0.63, 0.34), ss(0.6, 0.86, N(p + 733.0, 420.0).g) * 0.14);
  col *= 1.0 + 0.05 * (0.5 - (p.x + p.y) / (uRes.x + uRes.y));
  col *= 1.0 + (hash2(floor(p * (0.8 * max(uScale, 1.0)))) - 0.5) * 0.035;

  col = mix(col, INK, grassInk(p) * 0.75);
  col = tufts(col, p);
  col = weeds(col, p);
  col = flowers(col, p);
  o = vec4(col, 1.0);
}`;
