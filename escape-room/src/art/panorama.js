// The walkable panorama outside the walls of Jerusalem.
// One SVG, five parallax layers. The camera pans across a world twice the screen's width.

import { rng } from './textures.js';
import { PLACES } from '../content.js';
import { sunPos } from './light.js';

const W = 1600, H = 900, WORLD = 3200;
export const CAM_MAX = WORLD - W;
const LAYERS = [
  ['far', 0.18], ['city', 0.45], ['mid', 0.7], ['near', 1], ['fore', 1.22],
];

// ---------------------------------------------------------------- path helpers
function smooth(pts, close = '') {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + close;
}
function ridge(x0, x1, step, yFn, seed, jitter) {
  const r = rng(seed); const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += step) pts.push([x, yFn(x) + (r() - 0.5) * jitter]);
  return pts;
}
const ground = (pts, bottom = H) => smooth(pts) + ` L${pts[pts.length - 1][0]} ${bottom} L${pts[0][0]} ${bottom} Z`;

// ---------------------------------------------------------------- vegetation & rocks
function olive(x, y, s, seed) {
  const r = rng(seed); let g = `<g class="olive" transform="translate(${x} ${y}) scale(${s})">`;
  g += `<path d="M-4 0 C-6 -18 -14 -26 -10 -44 C-8 -52 -2 -50 0 -42 C2 -54 10 -56 9 -44 C8 -30 6 -16 5 0 Z" fill="#4a3a2a"/>`;
  const blobs = [[-26, -58, 26], [0, -70, 30], [24, -56, 25], [-10, -48, 22], [14, -44, 20]];
  blobs.forEach(([bx, by, br]) => {
    g += `<ellipse cx="${bx}" cy="${by}" rx="${br}" ry="${br * 0.72}" fill="#5f6d4b"/>`;
  });
  blobs.forEach(([bx, by, br]) => {
    g += `<ellipse cx="${bx - 3}" cy="${by - 5}" rx="${br * 0.78}" ry="${br * 0.5}" fill="#8a987a" opacity="0.75"/>`;
  });
  for (let i = 0; i < 26; i++) g += `<circle cx="${(r() - 0.5) * 80}" cy="${-40 - r() * 46}" r="${1.4 + r() * 2}" fill="#b4bf9e" opacity="${0.4 + r() * 0.4}"/>`;
  return g + '</g>';
}
function cypress(x, y, h) {
  return `<g transform="translate(${x} ${y})"><path d="M0 ${-h} C10 ${-h * 0.7} 13 ${-h * 0.3} 8 0 L-8 0 C-13 ${-h * 0.3} -10 ${-h * 0.7} 0 ${-h} Z" fill="#2f3f2e"/>
  <path d="M0 ${-h} C5 ${-h * 0.7} 7 ${-h * 0.35} 4 0 L0 0 Z" fill="#45573f" opacity="0.8"/></g>`;
}
function sycamore(x, y, s) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += `<path d="M-14 0 C-12 -40 -30 -70 -50 -90 M14 0 C12 -40 30 -66 58 -84 M-4 0 C-4 -50 4 -80 2 -110" stroke="#5b4636" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  g += `<path d="M-18 0 C-16 -30 -10 -60 -6 -80 L6 -80 C10 -60 16 -30 18 0 Z" fill="#5b4636"/>`;
  const blobs = [[-70, -110, 48], [-20, -140, 58], [40, -128, 54], [80, -100, 40], [0, -100, 50], [-50, -84, 36], [56, -80, 34]];
  blobs.forEach(([bx, by, br]) => { g += `<ellipse cx="${bx}" cy="${by}" rx="${br}" ry="${br * 0.68}" fill="#3e5236"/>`; });
  blobs.forEach(([bx, by, br]) => { g += `<ellipse cx="${bx - 6}" cy="${by - 10}" rx="${br * 0.72}" ry="${br * 0.44}" fill="#5f7a4c" opacity="0.8"/>`; });
  blobs.forEach(([bx, by, br]) => { g += `<ellipse cx="${bx - 10}" cy="${by - 16}" rx="${br * 0.36}" ry="${br * 0.2}" fill="#8aa06a" opacity="0.6"/>`; });
  return g + '</g>';
}
function rock(x, y, w, h, seed, tone = '#c9b591') {
  const r = rng(seed); const pts = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([x + Math.cos(a) * w * (0.85 + r() * 0.25), y + Math.sin(a) * h * (0.8 + r() * 0.3)]); }
  const d = smooth(pts) + ' Z';
  return `<path d="${d}" fill="${tone}"/><path d="${d}" fill="url(#rockShade)"/><path d="${d}" fill="url(#stoneTex)" opacity="0.35" style="mix-blend-mode:multiply"/>`;
}
function grassTuft(x, y, s, r, color = '#7a7a4a') {
  let g = '';
  for (let i = 0; i < 7; i++) {
    const a = -1.9 + r() * 0.8, l = (16 + r() * 18) * s;
    g += `<path d="M${x} ${y} q${Math.cos(a) * l * 0.3} ${-l * 0.6} ${Math.cos(a) * l} ${-l}" stroke="${color}" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>`;
  }
  return g;
}

// ---------------------------------------------------------------- built things
function cityLayer() {
  let g = '';
  // the hill
  const hill = ridge(1450, 2500, 50, (x) => 470 - Math.max(0, Math.sin((x - 1450) / 1050 * Math.PI)) * 70, 61, 10);
  g += `<path d="${ground(hill)}" fill="#8f7d62"/><path d="${ground(hill)}" fill="url(#stoneTex)" opacity="0.25" style="mix-blend-mode:multiply"/>`;
  g += `<path d="${ground(hill)}" fill="url(#hillShade)"/>`;
  // houses behind the wall
  const r = rng(77);
  for (let i = 0; i < 46; i++) {
    const x = 1690 + r() * 620, w = 22 + r() * 30, h = 18 + r() * 26, y = 405 - r() * 46;
    g += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${['#d8c39c', '#cdb68d', '#e1cfa9', '#c3ab82'][i % 4]}"/>`;
    g += `<rect x="${x}" y="${y - h}" width="${w * 0.32}" height="${h}" fill="#000" opacity="0.12"/>`;
    if (r() > 0.6) g += `<rect x="${x + w * 0.5}" y="${y - h * 0.6}" width="4" height="6" fill="#4a3826" opacity="0.7"/>`;
  }
  // the Temple: Royal Stoa, the court, and the Heichal rising above all
  g += `<g transform="translate(2190 0)">
    <rect x="-150" y="318" width="300" height="34" fill="#e6d7b5"/>
    <rect x="-150" y="318" width="300" height="5" fill="#fff6dc" opacity="0.7"/>
    ${Array.from({ length: 22 }, (_, i) => `<rect x="${-146 + i * 13.6}" y="326" width="5" height="24" fill="#a8946f" opacity="0.6"/>`).join('')}
    <ellipse cx="0" cy="250" rx="140" ry="90" fill="url(#templeGlow)"/>
    <rect x="-34" y="200" width="68" height="118" fill="#f1e6cc"/>
    <rect x="-56" y="212" width="112" height="106" fill="#f6ecd5"/>
    <rect x="-56" y="212" width="112" height="6" fill="#d9b25a"/>
    <rect x="-14" y="246" width="28" height="72" fill="#3b2a1a"/>
    <rect x="-11" y="249" width="22" height="66" fill="#b8892f" opacity="0.85"/>
    ${Array.from({ length: 15 }, (_, i) => `<path d="M${-54 + i * 7.7} 212 l1.5 -7 l1.5 7z" fill="#e2bb5e"/>`).join('')}
    <rect x="-56" y="212" width="34" height="106" fill="#000" opacity="0.06"/>
    <path id="altarSmoke" d="M60 300 C70 270 50 240 66 210 C80 184 62 160 74 132" stroke="#e8e2d8" stroke-width="10" fill="none" opacity="0.35" stroke-linecap="round" class="smoke"/>
  </g>`;
  // the wall with towers and the gate
  const wallTop = (x) => 404 + Math.sin(x / 70) * 3;
  let wall = `M1640 470 L1640 ${wallTop(1640)}`;
  for (let x = 1640; x < 2420; x += 20) wall += ` L${x} ${wallTop(x) - 10} L${x + 10} ${wallTop(x) - 10} L${x + 10} ${wallTop(x)} L${x + 20} ${wallTop(x)}`;
  wall += ' L2420 470 Z';
  g += `<path d="${wall}" fill="#cbb48a"/><path d="${wall}" fill="url(#ashlar)" opacity="0.55"/><path d="${wall}" fill="url(#wallShade)"/>`;
  [1650, 1820, 2280, 2410].forEach((tx) => {
    g += `<g transform="translate(${tx} 0)"><rect x="-22" y="372" width="44" height="98" fill="#c8b085"/><rect x="-22" y="372" width="44" height="98" fill="url(#ashlar)" opacity="0.5"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${-22 + i * 12}" y="364" width="8" height="10" fill="#c8b085"/>`).join('')}
    <rect x="-22" y="372" width="14" height="98" fill="#000" opacity="0.1"/><rect x="-3" y="392" width="6" height="14" fill="#2c2117" opacity="0.8"/></g>`;
  });
  // the gate
  g += `<g transform="translate(2050 0)">
    <rect x="-70" y="352" width="140" height="118" fill="#d2bb90"/><rect x="-70" y="352" width="140" height="118" fill="url(#ashlar)" opacity="0.55"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-70 + i * 24}" y="342" width="15" height="12" fill="#d2bb90"/>`).join('')}
    <path d="M-30 470 L-30 410 A30 30 0 0 1 30 410 L30 470 Z" fill="#2a1f16"/>
    <path d="M-30 470 L-30 410 A30 30 0 0 1 0 380 L0 470 Z" fill="#5a3d24"/>
    <path d="M-26 470 L-26 412 M-14 470 L-14 392 M-2 470 L-2 382" stroke="#3a2818" stroke-width="2"/>
    <path d="M-36 410 A36 36 0 0 1 36 410" stroke="#e8d6b0" stroke-width="4" fill="none"/>
    <rect x="-70" y="352" width="22" height="118" fill="#000" opacity="0.1"/>
  </g>`;
  return g;
}

function booth(x, y) {
  let g = `<g transform="translate(${x} ${y})">`;
  g += `<ellipse cx="0" cy="6" rx="120" ry="14" fill="#000" opacity="0.22"/>`;
  g += `<path d="M-96 0 L-80 -112 M96 0 L82 -112 M-30 0 L-26 -128 M34 0 L30 -126" stroke="#5a4330" stroke-width="7" stroke-linecap="round"/>`;
  g += `<path d="M-104 -104 C-60 -140 60 -142 104 -104 L96 -94 C50 -120 -50 -120 -96 -94 Z" fill="#6d6a3e"/>`;
  const r = rng(91);
  for (let i = 0; i < 70; i++) {
    const bx = -104 + r() * 208, by = -134 + r() * 36;
    g += `<path d="M${bx} ${by} l${(r() - 0.5) * 40} ${r() * 14}" stroke="${['#4d5a2e', '#7a7244', '#9a8a52', '#5e6a34'][i % 4]}" stroke-width="${1.5 + r() * 2.5}" stroke-linecap="round"/>`;
  }
  g += `<path d="M-90 -96 C-92 -60 -88 -30 -92 0 L-30 0 C-34 -40 -28 -70 -30 -112 Z" fill="#8b7355"/>`;
  g += `<path d="M-90 -96 L-30 -112 L-36 -70 L-60 -84 L-72 -50 L-88 -64 Z" fill="#a08767" opacity="0.6"/>`;
  g += `<path d="M30 -112 C28 -70 34 -40 30 0 L92 0 C88 -30 92 -60 90 -96 Z" fill="#7d6649"/>`;
  g += `<path d="M42 -60 l14 10 l-6 18 l12 6" stroke="#5e4a34" stroke-width="2" fill="none"/>`;
  g += `<path d="M-30 0 C-28 -50 -24 -100 -26 -120 L30 -118 C28 -100 30 -50 30 0 Z" fill="#1d150e"/>`;
  g += `<ellipse cx="0" cy="-8" rx="16" ry="5" fill="#ff9a3a" opacity="0.5" class="ember"/>`;
  return g + '</g>';
}

function sundial(x, y) {
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="0" cy="4" rx="46" ry="9" fill="#000" opacity="0.22"/>
    <path d="M-20 0 L-16 -64 L16 -64 L20 0 Z" fill="#d7c39a"/><path d="M-20 0 L-16 -64 L-6 -64 L-8 0 Z" fill="#000" opacity="0.12"/>
    <rect x="-28" y="-72" width="56" height="10" rx="2" fill="#e4d2ab"/>
    <ellipse cx="0" cy="-74" rx="40" ry="12" fill="#efe1c0"/>
    <path d="M-36 -74 A36 10 0 0 0 36 -74" stroke="#9c8660" stroke-width="1.2" fill="none"/>
    ${Array.from({ length: 11 }, (_, i) => { const a = Math.PI + (i + 1) / 12 * Math.PI; return `<line x1="${Math.cos(a) * 26}" y1="${-74 + Math.sin(a) * 7}" x2="${Math.cos(a) * 34}" y2="${-74 + Math.sin(a) * 9.4}" stroke="#7d6a4a" stroke-width="1.4"/>`; }).join('')}
    <line id="gnomonShadow" x1="0" y1="-74" x2="0" y2="-64" stroke="#3a2c1c" stroke-width="3" opacity="0.65" stroke-linecap="round"/>
    <path d="M0 -74 L0 -98 L5 -74 Z" fill="#8a7450"/>
  </g>`;
}

function stall(x, y) {
  let g = `<g transform="translate(${x} ${y})">`;
  g += `<ellipse cx="0" cy="8" rx="170" ry="16" fill="#000" opacity="0.22"/>`;
  g += `<path d="M-140 0 L-136 -150 M140 0 L136 -150 M-60 0 L-58 -160 M60 0 L58 -160" stroke="#4f3a27" stroke-width="7" stroke-linecap="round"/>`;
  const stripes = ['#9e2b2f', '#e7d7b3', '#2f4b7a', '#e7d7b3'];
  for (let i = 0; i < 14; i++) {
    const x0 = -156 + i * 22.3, x1 = x0 + 22.3;
    g += `<path d="M${x0} -170 L${x1} -170 L${x1 + 4} -128 L${x0 + 4} -128 Z" fill="${stripes[i % 4]}"/>`;
    g += `<path d="M${x0 + 4} -128 q${11} 12 ${22.3} 0" fill="${stripes[i % 4]}"/>`;
  }
  g += `<path d="M-156 -170 L156 -170 L160 -128 L-152 -128 Z" fill="url(#awningShade)"/>`;
  // counter
  g += `<rect x="-130" y="-62" width="260" height="62" fill="#6b4c30"/><rect x="-130" y="-62" width="260" height="62" fill="url(#woodTex)" opacity="0.6"/><rect x="-136" y="-68" width="272" height="10" fill="#7d5a3a"/>`;
  // cages
  [[-108, -100], [-70, -104]].forEach(([cx, cy]) => {
    g += `<g transform="translate(${cx} ${cy})"><path d="M-18 32 L-18 0 A18 16 0 0 1 18 0 L18 32 Z" fill="none" stroke="#8a6a44" stroke-width="2"/>
      ${[-12, -6, 0, 6, 12].map((bx) => `<line x1="${bx}" y1="32" x2="${bx}" y2="${-Math.sqrt(Math.max(0, 1 - (bx / 18) ** 2)) * 14}" stroke="#8a6a44" stroke-width="1.2"/>`).join('')}
      <ellipse cx="0" cy="22" rx="8" ry="6" fill="#8b6a4b"/><circle cx="6" cy="16" r="4" fill="#8b6a4b"/></g>`;
  });
  // jars and vessels
  [[-20, '#a5603a'], [6, '#b9713f'], [30, '#8f4f30']].forEach(([jx, c]) => {
    g += `<path d="M${jx - 10} -68 C${jx - 16} -86 ${jx - 12} -100 ${jx - 6} -104 L${jx + 6} -104 C${jx + 12} -100 ${jx + 16} -86 ${jx + 10} -68 Z" fill="${c}"/><rect x="${jx - 7}" y="-108" width="14" height="5" fill="${c}"/>`;
  });
  // hanging wool
  [[60, '#9e1f2d'], [80, '#2e4f8a'], [100, '#5b2a5e'], [118, '#a3262f']].forEach(([wx, c]) => {
    g += `<path d="M${wx} -128 l0 10" stroke="#5a4330" stroke-width="1.5"/><path d="M${wx - 6} -118 C${wx - 8} -96 ${wx + 8} -96 ${wx + 6} -118 Z" fill="${c}"/>`;
  });
  // cedar logs
  g += `<rect x="44" y="-82" width="70" height="9" rx="4" fill="#8e4a2e"/><rect x="50" y="-73" width="58" height="8" rx="4" fill="#a0583a"/>`;
  // the peddler, keeping his distance
  g += `<g transform="translate(150 0)"><path d="M-14 0 L-10 -56 C-10 -66 10 -66 10 -56 L14 0 Z" fill="#6a5a8a"/><circle cx="0" cy="-72" r="10" fill="#b98a68"/><path d="M-11 -76 C-8 -88 8 -88 11 -76 C6 -80 -6 -80 -11 -76 Z" fill="#e8dcc0"/></g>`;
  return g + '</g>';
}

function spring(x, y) {
  let g = `<g transform="translate(${x} ${y})">`;
  g += `<path d="M-220 40 C-230 -40 -200 -150 -120 -190 C-40 -220 60 -210 120 -160 C170 -120 190 -40 200 40 Z" fill="#b59f79"/>`;
  g += `<path d="M-220 40 C-230 -40 -200 -150 -120 -190 C-40 -220 60 -210 120 -160 C170 -120 190 -40 200 40 Z" fill="url(#stoneTex)" opacity="0.4" style="mix-blend-mode:multiply"/>`;
  g += `<path d="M-180 -60 C-100 -80 40 -76 160 -70 M-196 -120 C-120 -136 20 -140 120 -130 M-150 -170 C-90 -186 0 -186 80 -176" stroke="#8f7a58" stroke-width="2" fill="none" opacity="0.5"/>`;
  g += `<path d="M-220 40 C-230 -40 -200 -150 -120 -190 C-40 -220 60 -210 120 -160 C170 -120 190 -40 200 40 Z" fill="url(#rockShade)"/>`;
  g += `<path d="M-50 -20 C-52 -70 -30 -96 0 -98 C30 -96 50 -70 48 -20 Z" fill="#1e1712"/>`;
  g += `<path d="M-40 -20 C-40 -60 -24 -84 0 -86 C24 -84 40 -60 38 -20 Z" fill="#2b2119"/>`;
  g += `<path d="M-6 -24 C-8 0 -2 20 -4 40" stroke="#bfe0ea" stroke-width="9" fill="none" class="water" stroke-linecap="round"/>`;
  g += `<path d="M2 -24 C4 0 0 20 4 40" stroke="#eaf7fb" stroke-width="3" fill="none" class="water w2" stroke-linecap="round"/>`;
  g += `<ellipse cx="0" cy="50" rx="130" ry="24" fill="#5f8a97"/><ellipse cx="0" cy="50" rx="130" ry="24" fill="url(#poolShine)"/>`;
  g += `<ellipse cx="0" cy="46" rx="40" ry="7" fill="none" stroke="#d8f0f5" stroke-width="1.5" class="ripple"/>`;
  g += `<ellipse cx="0" cy="46" rx="40" ry="7" fill="none" stroke="#d8f0f5" stroke-width="1.5" class="ripple r2"/>`;
  g += `<path d="M-150 60 L-120 50 L120 50 L150 60 L130 74 L-130 74 Z" fill="#c6b08a" opacity="0.6"/>`;
  return g + '</g>';
}

// The two players. The metzora wears torn clothes and covers his lip (ויקרא יג, מה).
function avatar(role) {
  if (role === 'm') {
    return `<g class="avatar" data-role="m"><ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity="0.3"/>
      <path d="M-14 0 L-12 -40 C-14 -54 -6 -60 0 -60 C6 -60 14 -54 12 -40 L14 0 L6 0 L4 -10 L0 0 L-4 -6 L-8 0 Z" fill="#7a6650"/>
      <path d="M-12 -40 L-6 -30 L-10 -20 M8 -44 L4 -32" stroke="#4f3f2e" stroke-width="1.2" fill="none"/>
      <circle cx="0" cy="-70" r="9" fill="#b98a68"/>
      <path d="M-10 -72 C-12 -86 -2 -88 0 -84 C4 -90 14 -84 10 -70 C12 -78 6 -80 4 -76 C0 -82 -6 -80 -10 -72 Z" fill="#3d2c1e"/>
      <path d="M-8 -66 C-4 -62 4 -62 8 -66 L8 -60 C4 -56 -4 -56 -8 -60 Z" fill="#a69478"/>
      <path d="M12 -40 C16 -50 12 -58 8 -62" stroke="#b98a68" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
  }
  return `<g class="avatar" data-role="k"><ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity="0.3"/>
    <path d="M-15 0 L-12 -44 C-12 -56 -6 -60 0 -60 C6 -60 12 -56 12 -44 L15 0 Z" fill="#f2ede0"/>
    <path d="M-12 -44 C-4 -40 4 -40 12 -44 L12 -36 C4 -32 -4 -32 -12 -36 Z" fill="#c9b07a"/>
    <path d="M-15 0 L-12 -44 L-6 -44 L-8 0 Z" fill="#000" opacity="0.08"/>
    <circle cx="0" cy="-70" r="9" fill="#c69673"/>
    <path d="M-9 -70 C-9 -84 9 -84 9 -70 C6 -76 -6 -76 -9 -70 Z" fill="#f6f1e4"/>
    <path d="M-6 -64 C-4 -56 4 -56 6 -64" stroke="#4a3626" stroke-width="3" fill="none"/></g>`;
}

function hotspot(id, x, y, label) {
  return `<g class="hs" data-place="${id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${label}">
    <circle r="34" class="hs-hit" fill="transparent"/>
    <circle r="15" class="hs-ring"/>
    <circle r="5" class="hs-dot"/>
    <g class="hs-label" transform="translate(0 -40)"><rect class="hs-pill" x="-70" y="-17" width="140" height="28" rx="14"/><text text-anchor="middle" y="2">${label}</text></g>
  </g>`;
}

// ---------------------------------------------------------------- the whole scene
function sceneSVG() {
  const r = rng(5);
  const defs = `<defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="0.55" style="stop-color:var(--sky2)"/><stop offset="1" style="stop-color:var(--sky3)"/></linearGradient>
    <radialGradient id="sunGlow"><stop offset="0" style="stop-color:var(--sun);stop-opacity:0.9"/><stop offset="0.25" style="stop-color:var(--sun);stop-opacity:0.35"/><stop offset="1" style="stop-color:var(--sun);stop-opacity:0"/></radialGradient>
    <radialGradient id="templeGlow"><stop offset="0" stop-color="#fff2c8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky3);stop-opacity:0"/><stop offset="1" style="stop-color:var(--sky3);stop-opacity:0.75"/></linearGradient>
    <linearGradient id="hillShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient>
    <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#3a2a14" stop-opacity="0.25"/></linearGradient>
    <linearGradient id="rockShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1d10" stop-opacity="0.35"/></linearGradient>
    <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b49a6f"/><stop offset="1" stop-color="#7b6446"/></linearGradient>
    <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c8a63"/><stop offset="1" stop-color="#7d6c4b"/></linearGradient>
    <linearGradient id="awningShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient>
    <linearGradient id="poolShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6f6fa" stop-opacity="0.6"/><stop offset="0.5" stop-color="#e6f6fa" stop-opacity="0"/><stop offset="1" stop-color="#0e2a33" stop-opacity="0.3"/></linearGradient>
    <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c49c"/><stop offset="1" stop-color="#c2a77a"/></linearGradient>
    <pattern id="stoneTex" patternUnits="userSpaceOnUse" width="256" height="256"><image href="__STONE__" width="256" height="256"/></pattern>
    <pattern id="woodTex" patternUnits="userSpaceOnUse" width="128" height="128"><image href="__WOOD__" width="128" height="128"/></pattern>
    <pattern id="ashlar" patternUnits="userSpaceOnUse" width="60" height="22">
      <rect width="60" height="22" fill="#d9c49c"/><rect x="1.5" y="1.5" width="57" height="19" fill="#c9b285" stroke="#e9dab8" stroke-width="1.2"/>
      <rect x="5" y="5" width="50" height="12" fill="#bfa77b"/><line x1="0" y1="21.5" x2="60" y2="21.5" stroke="#8c7550" stroke-width="1"/>
    </pattern>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="softer"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>`;

  // sky
  const sp = sunPos(4);
  let sky = `<g id="sky"><rect width="${W}" height="${H}" fill="url(#skyGrad)"/>
    <g id="stars" opacity="0">${Array.from({ length: 90 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.4 + 0.3).toFixed(1)}" fill="#fff"/>`).join('')}</g>
    <g id="sun" transform="translate(${sp.x} ${sp.y})"><circle r="220" fill="url(#sunGlow)"/><circle r="34" style="fill:var(--sun)"/></g>
    <g id="clouds">${[[200, 150, 1], [700, 110, 0.8], [1150, 180, 1.1], [1450, 90, 0.7]].map(([cx, cy, s], i) => `<g class="cloud c${i}" transform="translate(${cx} ${cy}) scale(${s})" opacity="0.75">
      <ellipse cx="0" cy="0" rx="90" ry="22" fill="#fff" filter="url(#soft)"/><ellipse cx="-30" cy="-14" rx="44" ry="22" fill="#fff" filter="url(#soft)"/><ellipse cx="26" cy="-18" rx="52" ry="26" fill="#fff" filter="url(#soft)"/></g>`).join('')}
      <g id="bigCloud" opacity="0"><ellipse cx="0" cy="0" rx="380" ry="90" fill="#dfe3e8" filter="url(#softer)"/><ellipse cx="-120" cy="-40" rx="200" ry="80" fill="#eef0f2" filter="url(#softer)"/><ellipse cx="140" cy="-30" rx="220" ry="90" fill="#e8ebee" filter="url(#softer)"/></g>
    </g>
    <g id="birdsFlying" class="flock">${[0, 1, 2, 3, 4].map((i) => `<path d="M${i * 22} ${(i % 2) * 10} q6 -6 12 0 q6 -6 12 0" stroke="#3a3040" stroke-width="2" fill="none" class="wing w${i}"/>`).join('')}</g>
  </g>`;

  // far mountains (Mount of Olives ridge, the desert beyond)
  const farW = W + CAM_MAX * 0.18;
  const far1 = ridge(-20, farW + 20, 80, (x) => 430 + Math.sin(x / 260) * 34 + Math.sin(x / 90) * 8, 12, 14);
  const far2 = ridge(-20, farW + 20, 60, (x) => 470 + Math.sin(x / 200 + 2) * 26, 13, 12);
  let far = `<path d="${ground(far1)}" style="fill:var(--far)" opacity="0.55"/><path d="${ground(far2)}" style="fill:var(--far)" opacity="0.8"/>
    <rect y="380" width="${farW}" height="220" fill="url(#hazeGrad)"/>`;

  // city on the hill
  let city = cityLayer() + `<rect x="1400" y="420" width="1100" height="120" fill="url(#hazeGrad)" opacity="0.5"/>`;

  // mid: terraced slopes, olive groves, the road up to the gate
  const midW = W + CAM_MAX * 0.7;
  const midRidge = ridge(-20, midW + 20, 70, (x) => 560 - Math.sin(x / 300) * 30 - (x > 2200 ? (x - 2200) * 0.12 : 0), 33, 18);
  let mid = `<path d="${ground(midRidge)}" fill="url(#midGrad)"/><path d="${ground(midRidge)}" fill="url(#stoneTex)" opacity="0.2" style="mix-blend-mode:multiply"/>`;
  for (let i = 0; i < 6; i++) {
    const ty = 600 + i * 38;
    mid += `<path d="${smooth(ridge(-20, midW + 20, 120, (x) => ty - Math.sin(x / 280 + i) * 12 - (x > 2200 ? (x - 2200) * 0.1 : 0), 40 + i, 6))}" stroke="#6e5f43" stroke-width="3" fill="none" opacity="0.45"/>`;
  }
  const rm = rng(44);
  for (let i = 0; i < 34; i++) { const ox = rm() * midW; mid += olive(ox, 590 + rm() * 90, 0.55 + rm() * 0.3, 100 + i); }
  [[300, 560, 120], [900, 575, 110], [1720, 570, 130], [2600, 520, 120], [2660, 512, 96]].forEach(([cx, cy, h]) => { mid += cypress(cx, cy, h); });
  mid += `<path d="M2280 760 C2330 680 2380 620 2440 520 C2460 488 2470 470 2475 455" stroke="url(#roadGrad)" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  mid += `<rect y="560" width="${midW}" height="200" fill="url(#hazeGrad)" opacity="0.35"/>`;

  // near: the valley floor
  const nearRidge = ridge(-20, WORLD + 20, 80, (x) => 640 + Math.sin(x / 340) * 18 - (x > 2400 ? (x - 2400) * 0.07 : 0), 55, 10);
  let near = `<path d="${ground(nearRidge)}" fill="url(#groundGrad)"/><path d="${ground(nearRidge)}" fill="url(#stoneTex)" opacity="0.3" style="mix-blend-mode:multiply"/>`;
  near += `<path d="M1750 900 C1850 790 2000 720 2160 700 C2400 670 2700 640 2930 612 C3050 598 3150 580 3220 566" stroke="url(#roadGrad)" stroke-width="58" fill="none" stroke-linecap="round"/>`;
  near += `<path d="M1750 900 C1850 790 2000 720 2160 700 C2400 670 2700 640 2930 612 C3050 598 3150 580 3220 566" stroke="#a88e64" stroke-width="2" stroke-dasharray="3 14" fill="none" opacity="0.6"/>`;
  near += `<path d="M420 760 C700 760 900 720 1150 700 C1350 690 1500 715 1560 712" stroke="#c9b38a" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  near += spring(PLACES.spring.x, PLACES.spring.y - 30);
  near += sycamore(760, 690, 1.15);
  near += booth(PLACES.booth.x, PLACES.booth.y + 6);
  near += sundial(PLACES.field.x, PLACES.field.y + 10);
  near += stall(PLACES.stall.x, PLACES.stall.y + 10);
  near += olive(2620, 650, 1.0, 300) + olive(2760, 640, 0.9, 301) + olive(1880, 690, 0.95, 302);
  const rr = rng(66);
  [[980, 735, 40, 22], [1370, 745, 30, 16], [1760, 760, 44, 24], [2480, 690, 36, 18], [3080, 640, 50, 28], [140, 770, 60, 30]].forEach(([x, y, w, h], i) => { near += rock(x, y, w, h, 70 + i); });
  for (let i = 0; i < 60; i++) near += grassTuft(rr() * WORLD, 700 + rr() * 180, 0.9 + rr() * 0.6, rr, ['#8a8450', '#6e6a3c', '#a39a62'][i % 3]);
  near += `<g id="avatars"><g id="av-m" class="av">${avatar('m')}</g><g id="av-k" class="av">${avatar('k')}</g></g>`;
  near += `<g id="hotspots">${Object.entries(PLACES).filter(([id]) => id !== 'gatehouse').map(([id, p]) => hotspot(id, p.x, p.y - (id === 'stall' ? 190 : id === 'booth' ? 160 : id === 'spring' ? 130 : 120), p.name)).join('')}</g>`;

  // foreground framing
  const foreW = W + CAM_MAX * 1.22;
  let fore = '';
  const rf = rng(88);
  for (let i = 0; i < 26; i++) {
    const x = rf() * foreW, y = 880 + rf() * 30;
    fore += `<path d="${smooth([[x - 80, 920], [x - 40, y - 30 - rf() * 40], [x + 30, y - 40 - rf() * 30], [x + 90, 920]])} Z" fill="#3c3222" opacity="0.92"/>`;
    fore += grassTuft(x, y - 20, 1.8, rf, '#4a4428');
  }

  return `<svg id="pano" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${defs}${sky}
    <g class="layer" data-f="0.18">${far}</g>
    <g class="layer" data-f="0.45">${city}</g>
    <g class="layer" data-f="0.7">${mid}</g>
    <g class="layer" data-f="1">${near}</g>
    <rect id="tint" width="${W}" height="${H}" style="fill:var(--tint);opacity:var(--tint-o);mix-blend-mode:multiply;pointer-events:none"/>
    <rect id="glare" width="${W}" height="${H}" fill="#fffdf2" style="mix-blend-mode:screen;pointer-events:none"/>
    <g class="layer" data-f="1.22" style="pointer-events:none">${fore}</g>
  </svg>`;
}

// ---------------------------------------------------------------- controller
export function createPanorama(host, { onPlace, textures }) {
  host.innerHTML = sceneSVG().replace('__STONE__', textures.stone).replace('__WOOD__', textures.wood);
  const svg = host.querySelector('#pano');
  const layers = [...svg.querySelectorAll('.layer')].map((g) => [g, Number(g.dataset.f)]);
  let cam = 0, target = 0, raf = 0;

  const draw = () => { layers.forEach(([g, f]) => g.setAttribute('transform', `translate(${(-cam * f).toFixed(1)} 0)`)); };
  const tick = () => {
    const d = target - cam;
    if (Math.abs(d) < 0.5) { cam = target; draw(); raf = 0; return; }
    cam += d * 0.12; draw(); raf = requestAnimationFrame(tick);
  };
  const go = (x, instant) => {
    target = Math.max(0, Math.min(CAM_MAX, x));
    if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) { cam = target; draw(); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const scale = () => { const b = svg.getBoundingClientRect(); return Math.max(b.width / W, b.height / H) || 1; };

  // drag to pan
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.hs')) return;
    drag = { x: e.clientX, cam: target, moved: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.x) / scale();
    if (Math.abs(dx) > 3) drag.moved = true;
    go(drag.cam - dx, true); target = cam;
  });
  const end = () => { drag = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    go(target + d * 1.2); e.preventDefault();
  }, { passive: false });

  svg.querySelectorAll('.hs').forEach((h) => {
    const fire = () => onPlace(h.dataset.place);
    h.addEventListener('click', fire);
    h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });

  const centerOn = (place, instant) => {
    const p = PLACES[place]; if (!p) return;
    go(p.x - W / 2, instant);
  };

  return {
    svg,
    pan: (dx) => go(target + dx),
    centerOn,
    setTime(hour, cloudy) {
      const s = sunPos(hour);
      svg.querySelector('#sun').setAttribute('transform', `translate(${s.x.toFixed(0)} ${s.y.toFixed(0)})`);
      const big = svg.querySelector('#bigCloud');
      big.setAttribute('transform', `translate(${s.x.toFixed(0)} ${(s.y + 10).toFixed(0)})`);
      big.setAttribute('opacity', cloudy ? '0.96' : '0');
      svg.querySelector('#stars').setAttribute('opacity', hour >= 12 ? '1' : '0');
      svg.querySelector('#glare').setAttribute('opacity', hour === 6 || hour === 7 ? '0.22' : '0');
      // shadow of the gnomon swings from west (morning) to east (evening)
      const a = Math.PI * (0.08 + (hour - 1) / 11 * 0.84);
      const g = svg.querySelector('#gnomonShadow');
      g.setAttribute('x2', (Math.cos(a) * 30).toFixed(1));
      g.setAttribute('y2', (-74 + Math.sin(a) * 8).toFixed(1));
      g.setAttribute('opacity', cloudy ? '0.12' : '0.65');
    },
    setAvatars(loc, me) {
      ['m', 'k'].forEach((role) => {
        const el = svg.querySelector('#av-' + role);
        const place = loc[role];
        const p = PLACES[place];
        const hidden = !p || p.inside || place === 'booth' && role === 'm' && false;
        el.style.display = hidden ? 'none' : '';
        if (!p) return;
        const both = loc.m === loc.k;
        const off = both ? (role === 'm' ? -34 : 34) : 0;
        const y = place === 'booth' ? p.y + 30 : place === 'stall' ? p.y + 24 : p.y + 16;
        const x = place === 'booth' ? p.x + 150 + off : place === 'spring' ? p.x + 170 + off : p.x + off + (place === 'stall' ? -20 : 0);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.classList.toggle('me', role === me);
      });
    },
    setHotspots(fn) {
      svg.querySelectorAll('.hs').forEach((h) => {
        const st = fn(h.dataset.place);
        h.classList.toggle('here', !!st.here);
        h.classList.toggle('partner', !!st.partner);
        h.classList.toggle('locked', !!st.locked);
      });
    },
  };
}
