// Procedural textures drawn once on canvas: stone, parchment, skin, and the nega shades.

export function rng(seed) {
  let x = (seed % 2147483647) || 1;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
}

// Smooth value noise, tiled.
function valueNoise(w, h, cell, seed) {
  const r = rng(seed);
  const gw = Math.ceil(w / cell) + 1, gh = Math.ceil(h / cell) + 1;
  const g = Array.from({ length: gw * gh }, r);
  const at = (x, y) => g[(y % gh) * gw + (x % gw)];
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = y / cell, y0 = Math.floor(gy), ty = gy - y0, sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const gx = x / cell, x0 = Math.floor(gx), tx = gx - x0, sx = tx * tx * (3 - 2 * tx);
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      out[y * w + x] = (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
    }
  }
  return out;
}

function fbm(w, h, seed, octaves = [[64, 0.5], [24, 0.3], [8, 0.2]]) {
  const out = new Float32Array(w * h);
  octaves.forEach(([cell, amp], i) => {
    const n = valueNoise(w, h, cell, seed + i * 101);
    for (let k = 0; k < out.length; k++) out[k] += n[k] * amp;
  });
  return out;
}

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

function paint(w, h, noise, lo, hi, grain = 10, seed = 1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(w, h);
  const a = hex(lo), b = hex(hi), r = rng(seed);
  for (let i = 0; i < w * h; i++) {
    const t = Math.min(1, Math.max(0, noise[i])), g = (r() - 0.5) * grain;
    img.data[i * 4] = a[0] + (b[0] - a[0]) * t + g;
    img.data[i * 4 + 1] = a[1] + (b[1] - a[1]) * t + g;
    img.data[i * 4 + 2] = a[2] + (b[2] - a[2]) * t + g;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

const cache = {};
export function textureURL(name) {
  if (cache[name]) return cache[name];
  let cv;
  if (name === 'parchment') {
    cv = paint(512, 512, fbm(512, 512, 7, [[128, 0.55], [32, 0.3], [6, 0.15]]), '#d9c49a', '#f3e6c6', 14, 3);
    const ctx = cv.getContext('2d'); const r = rng(9);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(120,85,40,${r() * 0.05})`; ctx.beginPath(); ctx.arc(r() * 512, r() * 512, r() * 26 + 4, 0, 7); ctx.fill(); }
  } else if (name === 'stone') {
    cv = paint(512, 512, fbm(512, 512, 21, [[96, 0.5], [20, 0.3], [5, 0.2]]), '#a99476', '#e5d6b6', 18, 5);
  } else if (name === 'stoneDark') {
    cv = paint(512, 512, fbm(512, 512, 31, [[96, 0.5], [20, 0.3], [5, 0.2]]), '#3c2e22', '#6b5640', 14, 6);
  } else if (name === 'grain') {
    cv = paint(256, 256, fbm(256, 256, 41, [[4, 1]]), '#808080', '#8a8a8a', 40, 8);
  } else if (name === 'wood') {
    cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#5c3b22'; ctx.fillRect(0, 0, 256, 256);
    const r = rng(12);
    for (let i = 0; i < 80; i++) { ctx.strokeStyle = `rgba(${30 + r() * 40},${15 + r() * 20},5,${0.2 + r() * 0.3})`; ctx.lineWidth = r() * 3; ctx.beginPath(); const y = r() * 256; ctx.moveTo(0, y); ctx.bezierCurveTo(80, y + r() * 10 - 5, 170, y + r() * 10 - 5, 256, y); ctx.stroke(); }
  }
  cache[name] = cv.toDataURL('image/jpeg', 0.86);
  return cache[name];
}

// ------------------------------------------------------------------ nega shades
// Each shade has a body colour and a texture, so the four whites can be told apart by eye.
const SHADE_LOOK = {
  snow:  { base: '#fbfdff', edge: '#e9f1fb', alpha: 1 },
  sid:   { base: '#ece6d6', edge: '#ddd4bf', alpha: 1 },
  wool:  { base: '#f0e7d2', edge: '#e0d3b6', alpha: 1 },
  egg:   { base: '#eee9dd', edge: '#ddd6c6', alpha: 0.9 },
  bahak: { base: '#c9b291', edge: '#b59c78', alpha: 0.92 },
  skin:  { base: '#c18c66', edge: '#b37d58', alpha: 1 },
};

// Light changes how shades read (משנה נגעים ב, ב).
function lookFor(shade, mode) {
  const L = { ...SHADE_LOOK[shade] };
  if (mode === 'dim') {
    // הכהה נראית עזה: dim shades read brighter, everything flattens.
    if (shade === 'bahak') { L.base = '#eee7da'; L.edge = '#e1d8c6'; }
    if (shade === 'egg') { L.base = '#f6f3ec'; }
    if (shade === 'sid') { L.base = '#f5f2ea'; }
  } else if (mode === 'glare') {
    // העזה נראית כהה: bright shades read dull.
    if (shade === 'snow') { L.base = '#d7c8ae'; L.edge = '#c8b797'; }
    if (shade === 'wool') { L.base = '#d9cdb4'; }
    if (shade === 'sid') { L.base = '#d6cab3'; }
  }
  return L;
}

export function blobPath(ctx, cx, cy, r, seed, rough = 0.18) {
  const rr = rng(seed); const n = 72; const k = [];
  for (let i = 0; i < 4; i++) k.push([rr() * 2 * Math.PI, rr() * rough * (1 - i * 0.18)]);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let m = 1; k.forEach(([ph, amp], j) => { m += amp * Math.sin(a * (j + 2) + ph); });
    pts.push([cx + Math.cos(a) * r * m, cy + Math.sin(a) * r * m * 0.86]);
  }
  ctx.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m0 = mid(pts[n - 1], pts[0]); ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m1 = mid(p, q); ctx.quadraticCurveTo(p[0], p[1], m1[0], m1[1]); }
  ctx.closePath();
}

export function drawShade(ctx, shade, cx, cy, r, seed, mode = 'true', opts = {}) {
  const L = lookFor(shade, mode); const R = rng(seed * 3 + 1);
  ctx.save();
  blobPath(ctx, cx, cy, r, seed, shade === 'bahak' ? 0.26 : 0.16);
  ctx.globalAlpha = L.alpha;
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, L.base); g.addColorStop(0.75, L.base); g.addColorStop(1, L.edge);
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = opts.flat ? 0 : r * 0.12; ctx.fill();
  ctx.shadowBlur = 0; ctx.clip();
  const area = r * r;
  if (shade === 'snow') {
    for (let i = 0; i < area / 30; i++) {
      const x = cx + (R() - 0.5) * 2 * r, y = cy + (R() - 0.5) * 2 * r, s = R() * 2.2 + 0.6;
      ctx.fillStyle = mode === 'glare' ? 'rgba(255,255,255,0.18)' : `rgba(${200 + R() * 55},${225 + R() * 30},255,${0.55 + R() * 0.45})`;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 0.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.3, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.3, y); ctx.closePath(); ctx.fill();
    }
    const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx - r * 0.3, cy - r * 0.35, r * 0.9);
    hl.addColorStop(0, mode === 'glare' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  } else if (shade === 'sid') {
    ctx.lineCap = 'round';
    for (let i = 0; i < area / 55; i++) {
      const x = cx + (R() - 0.5) * 2.2 * r, y = cy + (R() - 0.5) * 2.2 * r, len = r * (0.2 + R() * 0.5), a = -0.5 + R() * 0.25;
      ctx.strokeStyle = R() > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,135,105,0.14)';
      ctx.lineWidth = 1.5 + R() * 3.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5 - 2, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
    }
    for (let i = 0; i < area / 18; i++) { ctx.fillStyle = `rgba(120,105,80,${R() * 0.09})`; ctx.fillRect(cx + (R() - 0.5) * 2 * r, cy + (R() - 0.5) * 2 * r, 1.4, 1.4); }
  } else if (shade === 'wool') {
    for (let i = 0; i < area / 22; i++) {
      const x = cx + (R() - 0.5) * 2.1 * r, y = cy + (R() - 0.5) * 2.1 * r, s = 2.4 + R() * 3.6;
      ctx.strokeStyle = R() > 0.45 ? 'rgba(190,170,130,0.38)' : 'rgba(255,252,240,0.55)';
      ctx.lineWidth = 0.9 + R() * 0.8;
      ctx.beginPath(); ctx.arc(x, y, s, R() * 6, R() * 6 + 3.6 + R() * 2); ctx.stroke();
    }
  } else if (shade === 'egg') {
    const sh = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.42, 'rgba(255,255,255,0.0)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0.75)'); sh.addColorStop(0.58, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    ctx.strokeStyle = 'rgba(175,160,135,0.32)'; ctx.lineWidth = 0.7;
    for (let i = 0; i < Math.max(3, area / 500); i++) {
      let x = cx + (R() - 0.5) * r, y = cy + (R() - 0.5) * r; ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (R() - 0.5) * r * 0.5; y += (R() - 0.5) * r * 0.5; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    const iri = ctx.createRadialGradient(cx + r * 0.3, cy + r * 0.2, 0, cx + r * 0.3, cy + r * 0.2, r);
    iri.addColorStop(0, 'rgba(230,220,250,0.25)'); iri.addColorStop(1, 'rgba(230,220,250,0)');
    ctx.fillStyle = iri; ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  } else if (shade === 'bahak') {
    for (let i = 0; i < area / 40; i++) {
      ctx.fillStyle = mode === 'dim' ? `rgba(200,185,160,${R() * 0.25})` : `rgba(${140 + R() * 30},${110 + R() * 25},${75 + R() * 20},${0.12 + R() * 0.3})`;
      ctx.beginPath(); ctx.arc(cx + (R() - 0.5) * 2 * r, cy + (R() - 0.5) * 2 * r, 1.5 + R() * 5, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawHairs(ctx, cx, cy, r, white, black, seed) {
  const R = rng(seed * 7 + 5);
  const hair = (color, outline) => {
    const a = R() * Math.PI * 2, d = R() * r * 0.6;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.86;
    const ang = -1.1 + R() * 0.9, len = 9 + R() * 6;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    const mx = (x + ex) / 2 + (R() - 0.5) * 5, my = (y + ey) / 2 + (R() - 0.5) * 5;
    ctx.lineCap = 'round';
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = 2.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke(); }
    ctx.strokeStyle = color; ctx.lineWidth = 1.05; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
  };
  for (let i = 0; i < white; i++) hair('#fbfaf3', 'rgba(110,90,70,0.55)');
  for (let i = 0; i < black; i++) hair('#24170f', null);
}

// A patch of skin with its marks, used by the exam view.
export function drawSkin(ctx, w, h, seed, mode) {
  const R = rng(seed);
  const base = ctx.createLinearGradient(0, 0, w, h);
  const tone = mode === 'glare' ? ['#d9a983', '#c99772'] : mode === 'dim' ? ['#9d6e50', '#8a5f44'] : ['#c79270', '#b47f5c'];
  base.addColorStop(0, tone[0]); base.addColorStop(1, tone[1]);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 90; i++) {
    ctx.fillStyle = `rgba(${R() > 0.5 ? '90,50,30' : '255,220,190'},${R() * 0.06})`;
    ctx.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2);
  }
  for (let i = 0; i < (w * h) / 2600; i++) {
    const x = R() * w, y = R() * h;
    ctx.strokeStyle = `rgba(70,40,25,${0.15 + R() * 0.2})`; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3 + R() * 4, y - 4 - R() * 4); ctx.stroke();
  }
  const sh = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(40,20,10,0.35)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, w, h);
}

// A swatch for the book and the certification test.
export function swatchCanvas(shade, size = 150, seed = 1, mode = 'true') {
  const cv = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + 'px'; cv.style.height = size + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  drawSkin(ctx, size, size, seed + 100, mode);
  if (shade !== 'skin') drawShade(ctx, shade, size / 2, size / 2, size * 0.36, seed, mode);
  return cv;
}
