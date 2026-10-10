// Close-up scenes. Each returns SVG markup and its interactive spots.
import { rng } from './textures.js';

const W = 1600, H = 900;
const commonDefs = (tex) => `
  <linearGradient id="cuSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="0.6" style="stop-color:var(--sky2)"/><stop offset="1" style="stop-color:var(--sky3)"/></linearGradient>
  <pattern id="cuStone" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${tex.stone}" width="256" height="256"/></pattern>
  <pattern id="cuStoneDark" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${tex.stoneDark}" width="256" height="256"/></pattern>
  <pattern id="cuWood" patternUnits="userSpaceOnUse" width="128" height="128"><image href="${tex.wood}" width="128" height="128"/></pattern>
  <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffc56b" stop-opacity="0.75"/><stop offset="0.35" stop-color="#ff9d3c" stop-opacity="0.22"/><stop offset="1" stop-color="#ff9d3c" stop-opacity="0"/></radialGradient>
  <linearGradient id="ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--sun);stop-opacity:0.35"/><stop offset="1" style="stop-color:var(--sun);stop-opacity:0"/></linearGradient>
  <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient>
  <filter id="cuBlur"><feGaussianBlur stdDeviation="8"/></filter>`;

function spot(id, x, y, label) {
  return `<g class="hs" data-spot="${id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${label}">
    <circle r="40" class="hs-hit" fill="transparent"/><circle r="17" class="hs-ring"/><circle r="6" class="hs-dot"/>
    <g class="hs-label" transform="translate(0 -46)"><rect class="hs-pill" x="-80" y="-17" width="160" height="28" rx="14"/><text text-anchor="middle" y="2">${label}</text></g></g>`;
}

// Herodian ashlar: each block has a drafted margin and a raised boss.
function ashlarWall(x0, y0, w, h, rowH, seed, light = '#6f5a42', dark = '#3b2d20') {
  const r = rng(seed); let g = '';
  for (let y = y0, row = 0; y < y0 + h; y += rowH, row++) {
    let x = x0 - (row % 2 ? r() * 120 : 0);
    while (x < x0 + w) {
      const bw = 160 + r() * 180;
      g += `<rect x="${x + 2}" y="${y + 2}" width="${bw - 4}" height="${rowH - 4}" fill="${light}"/>`;
      g += `<rect x="${x + 14}" y="${y + 12}" width="${bw - 28}" height="${rowH - 24}" fill="${dark}" opacity="0.25"/>`;
      g += `<rect x="${x + 16}" y="${y + 14}" width="${bw - 32}" height="${rowH - 28}" fill="url(#cuStone)" opacity="0.35" style="mix-blend-mode:overlay"/>`;
      g += `<line x1="${x + 2}" y1="${y + 2.5}" x2="${x + bw - 2}" y2="${y + 2.5}" stroke="#fff" stroke-opacity="0.08"/>`;
      x += bw;
    }
  }
  return g;
}

export function gatehouse(tex) {
  const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${commonDefs(tex)}</defs>
    <rect width="${W}" height="${H}" fill="#2a1f16"/>
    ${ashlarWall(0, 0, W, 700, 100, 3)}
    <rect width="${W}" height="700" fill="url(#cuStoneDark)" opacity="0.25" style="mix-blend-mode:multiply"/>
    <!-- window onto the valley -->
    <g transform="translate(330 120)">
      <path d="M-120 380 L-120 120 A120 120 0 0 1 120 120 L120 380 Z" fill="#1a130d"/>
      <path d="M-104 380 L-104 124 A104 104 0 0 1 104 124 L104 380 Z" fill="url(#cuSky)"/>
      <path d="M-104 300 C-60 280 -20 290 20 276 C60 264 90 280 104 270 L104 380 L-104 380 Z" style="fill:var(--far)" opacity="0.9"/>
      <path d="M-104 330 C-50 320 0 334 40 322 C70 314 90 326 104 320 L104 380 L-104 380 Z" fill="#8a7756"/>
      <path d="M-60 330 l6 -22 l6 22 Z M40 322 l5 -18 l5 18 Z" fill="#3c4a33"/>
      <rect x="-14" y="300" width="28" height="22" fill="#6d5a40"/><path d="M-20 300 L0 288 L20 300 Z" fill="#7a6a40"/>
      <path d="M-120 380 L120 380 L136 400 L-136 400 Z" fill="#5a4630"/>
      <line x1="0" y1="20" x2="0" y2="380" stroke="#1a130d" stroke-width="8"/>
      <line x1="-104" y1="200" x2="104" y2="200" stroke="#1a130d" stroke-width="6"/>
    </g>
    <path d="M226 200 L560 900 L900 900 L434 200 Z" fill="url(#ray)" opacity="0.32"/>
    <!-- niche with scrolls -->
    <g transform="translate(1000 170)">
      <path d="M-90 180 L-90 40 A90 60 0 0 1 90 40 L90 180 Z" fill="#1d1510"/>
      ${[[-50, 150], [-15, 150], [20, 150], [55, 150], [-30, 112], [8, 112], [44, 112]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-15" y="-14" width="30" height="28" rx="14" fill="#e3cf9f"/><circle cx="-14" cy="0" r="13" fill="#c7ad74"/><circle cx="-14" cy="0" r="5" fill="#7a5a30"/></g>`).join('')}
    </g>
    <!-- lamp -->
    <g transform="translate(700 300)">
      <path d="M-60 60 L-60 -40 A60 50 0 0 1 60 -40 L60 60 Z" fill="#1d1510"/>
      <path d="M-70 60 L70 60 L62 74 L-62 74 Z" fill="#5a4630"/>
      <circle r="230" fill="url(#lampGlow)" class="lampglow"/>
      <path d="M-26 10 C-26 -6 26 -6 30 6 L44 2 L40 12 C20 22 -20 22 -26 10 Z" fill="#9b5a33"/>
      <path d="M40 0 C44 -16 36 -26 42 -36 C50 -24 52 -12 44 2 Z" fill="#ffd27a" class="flame"/>
      <path d="M41 -2 C43 -10 40 -16 43 -22 C47 -14 47 -8 43 0 Z" fill="#fff4cf" class="flame"/>
    </g>
    <!-- floor -->
    <path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="#3a2b1e"/>
    <path d="M0 700 L1600 700 L1600 900 L0 900 Z" fill="url(#cuStoneDark)" opacity="0.6" style="mix-blend-mode:multiply"/>
    ${[742, 800, 870].map((y) => `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#241a12" stroke-width="2"/>`).join('')}
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${i * 130 + (i % 2) * 40}" y1="700" x2="${i * 150 - 60}" y2="900" stroke="#241a12" stroke-width="2" opacity="0.8"/>`).join('')}
    <ellipse cx="760" cy="720" rx="420" ry="60" fill="#ffb45a" opacity="0.08"/>
    <!-- lectern and book -->
    <g transform="translate(760 700)">
      <path d="M-30 0 L-20 -190 L20 -190 L30 0 Z" fill="#4a3220"/><path d="M-30 0 L-20 -190 L20 -190 L30 0 Z" fill="url(#cuWood)" opacity="0.5"/>
      <path d="M-160 -200 L160 -200 L130 -260 L-130 -260 Z" fill="#5a3c25"/>
      <path d="M-150 -214 C-80 -232 -10 -228 0 -214 C10 -228 80 -232 150 -214 L124 -266 C80 -276 20 -276 0 -262 C-20 -276 -80 -276 -124 -266 Z" fill="#d9c597"/>
      <path d="M-150 -214 C-80 -232 -10 -228 0 -214 L0 -262 C-20 -276 -80 -276 -124 -266 Z" fill="#000" opacity="0.06"/>
      <path d="M0 -262 L0 -214" stroke="#8a7048" stroke-width="2"/>
      ${Array.from({ length: 6 }, (_, i) => `<line x1="${-110 + i * 3}" y1="${-254 + i * 6}" x2="${-24}" y2="${-252 + i * 6}" stroke="#5a4428" stroke-width="1.6" opacity="0.75"/><line x1="${24}" y1="${-252 + i * 6}" x2="${110 - i * 3}" y2="${-254 + i * 6}" stroke="#5a4428" stroke-width="1.6" opacity="0.75"/>`).join('')}
      <ellipse cx="0" cy="-238" rx="150" ry="34" fill="#ffd27a" opacity="0.07" class="lampglow"/>
    </g>
    <!-- door -->
    <g transform="translate(1340 700)">
      <path d="M-150 0 L-150 -420 A150 120 0 0 1 150 -420 L150 0 Z" fill="#1a120c"/>
      <path d="M-130 0 L-130 -410 A130 104 0 0 1 130 -410 L130 0 Z" fill="#5b3a22"/>
      <path d="M-130 0 L-130 -410 A130 104 0 0 1 130 -410 L130 0 Z" fill="url(#cuWood)" opacity="0.7"/>
      ${[-90, -45, 0, 45, 90].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${-410 - Math.sqrt(Math.max(0, 1 - (x / 130) ** 2)) * 100}" stroke="#2c1c10" stroke-width="3"/>`).join('')}
      ${[-340, -200, -60].map((y) => `<rect x="-130" y="${y}" width="260" height="14" fill="#3a3a3a"/>${[-110, -70, -30, 10, 50, 90].map((x) => `<circle cx="${x}" cy="${y + 7}" r="4" fill="#777"/>`).join('')}`).join('')}
      <g id="doorBar"><rect x="-150" y="-250" width="300" height="20" fill="#3e2a18"/><rect x="-150" y="-250" width="300" height="5" fill="#6d4a2c"/></g>
      <circle cx="80" cy="-180" r="10" fill="#555"/><circle cx="80" cy="-180" r="16" fill="none" stroke="#666" stroke-width="3"/>
    </g>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${spot('book', 760, 480, 'ספר הנגעים')}
    ${spot('window', 330, 260, 'החלון אל העמק')}
    ${spot('door', 1340, 440, 'הדלת אל מחוץ למחנה')}
  </svg>`;
  return svg;
}

export function boothInside(tex) {
  const r = rng(17);
  let roof = '';
  for (let i = 0; i < 140; i++) {
    const x = r() * W, y = r() * 330, l = 60 + r() * 160, a = (r() - 0.5) * 0.9;
    roof += `<path d="M${x} ${y} l${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="${['#3a3a20', '#55502c', '#6b6236', '#2a2a18'][i % 4]}" stroke-width="${3 + r() * 7}" stroke-linecap="round"/>`;
  }
  let rays = '';
  for (let i = 0; i < 7; i++) { const x = 200 + i * 200 + r() * 80; rays += `<path d="M${x} 120 L${x + 18} 120 L${x + 200} 900 L${x + 150} 900 Z" fill="url(#ray)" opacity="${0.12 + r() * 0.18}"/>`; }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${commonDefs(tex)}</defs>
    <rect width="${W}" height="${H}" fill="#2b2216"/>
    <!-- the opening onto the valley -->
    <path d="M620 700 C610 520 630 380 660 300 L940 300 C970 380 990 520 980 700 Z" fill="url(#cuSky)"/>
    <path d="M620 560 C700 540 780 556 860 540 C920 530 960 544 980 540 L980 700 L620 700 Z" style="fill:var(--far)"/>
    <path d="M620 610 C720 600 820 620 980 600 L980 700 L620 700 Z" fill="#9c8662"/>
    <path d="M690 548 L690 520 ${Array.from({ length: 13 }, (_, i) => `L${690 + i * 18} ${i % 2 ? 520 : 514} L${699 + i * 18} ${i % 2 ? 514 : 520}`).join(' ')} L930 520 L930 548 Z" fill="#cbb48a" opacity="0.85"/>
    <rect x="850" y="486" width="24" height="34" fill="#efe2c4"/><rect x="842" y="492" width="40" height="28" fill="#f3e8cf"/><rect x="842" y="492" width="40" height="3" fill="#d9b25a"/>
    <!-- walls of branches and cloth -->
    <path d="M0 0 L620 120 C600 400 600 600 620 720 L0 820 Z" fill="#4e4130"/>
    <path d="M0 0 L620 120 C600 400 600 600 620 720 L0 820 Z" fill="url(#cuWood)" opacity="0.3"/>
    <path d="M1600 0 L980 120 C1000 400 1000 600 980 720 L1600 820 Z" fill="#46392a"/>
    <path d="M90 200 C200 260 260 420 230 640 L80 680 C60 500 70 340 90 200 Z" fill="#7d6649" opacity="0.8"/>
    <path d="M150 300 l40 30 l-20 50 l30 20" stroke="#4a3a28" stroke-width="3" fill="none"/>
    ${roof}
    ${rays}
    <!-- floor, mat, jug, embers -->
    <path d="M0 720 L1600 720 L1600 900 L0 900 Z" fill="#5a4630"/>
    <path d="M300 760 L1000 740 L1150 880 L200 900 Z" fill="#8f7a4e"/>
    ${Array.from({ length: 18 }, (_, i) => `<line x1="${300 + i * 40}" y1="${760 - i * 1.2}" x2="${200 + i * 53}" y2="900" stroke="#6f5d38" stroke-width="2"/>`).join('')}
    <g transform="translate(1260 780)"><path d="M-40 60 C-60 20 -50 -40 -20 -60 L20 -60 C50 -40 60 20 40 60 Z" fill="#a0623a"/><rect x="-18" y="-74" width="36" height="16" fill="#8c5532"/><path d="M-40 60 C-60 20 -50 -40 -20 -60 L-6 -60 C-30 -30 -34 20 -20 60 Z" fill="#000" opacity="0.15"/></g>
    <g transform="translate(560 830)"><ellipse rx="70" ry="18" fill="#2a1d14"/><ellipse rx="40" ry="9" fill="#ff8a30" opacity="0.6" class="ember"/><circle cx="-10" cy="-4" r="4" fill="#ffbf6a" class="ember"/></g>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${spot('notes', 400, 560, 'מה שאתה יודע')}
    ${spot('out', 800, 420, 'צא אל העמק')}
  </svg>`;
}

export function stallClose(tex) {
  const stripes = ['#9e2b2f', '#e7d7b3', '#2f4b7a', '#e7d7b3'];
  let awn = '';
  for (let i = 0; i < 12; i++) awn += `<path d="M${i * 140} 0 L${i * 140 + 140} 0 L${i * 140 + 150} 170 Q${i * 140 + 80} 210 ${i * 140 + 10} 170 Z" fill="${stripes[i % 4]}"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${commonDefs(tex)}</defs>
    <rect width="${W}" height="${H}" fill="url(#cuSky)"/>
    <path d="M0 520 C300 480 600 510 900 470 C1200 440 1400 480 1600 460 L1600 900 L0 900 Z" style="fill:var(--far)"/>
    <path d="M0 600 L1600 560 L1600 900 L0 900 Z" fill="#b39a70"/>
    ${awn}<rect width="${W}" height="200" fill="#000" opacity="0.12"/>
    <rect x="80" y="160" width="20" height="560" fill="#4f3a27"/><rect x="1500" y="160" width="20" height="560" fill="#4f3a27"/>
    <rect x="60" y="640" width="1480" height="260" fill="#6b4c30"/><rect x="60" y="640" width="1480" height="260" fill="url(#cuWood)" opacity="0.6"/>
    <rect x="40" y="620" width="1520" height="30" fill="#7d5a3a"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </svg>`;
}

export function springClose(tex) {
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${commonDefs(tex)}
      <linearGradient id="poolG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb0bd"/><stop offset="1" stop-color="#2e5a66"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#cuSky)"/>
    <path d="M0 0 L1600 0 L1600 900 L0 900 Z" fill="#a8916b"/>
    <path d="M0 0 L1600 0 L1600 900 L0 900 Z" fill="url(#cuStone)" opacity="0.6" style="mix-blend-mode:multiply"/>
    ${[120, 260, 380].map((y, i) => `<path d="M0 ${y} C400 ${y - 20} 900 ${y + 18} 1600 ${y - 10}" stroke="#7c6646" stroke-width="${3 - i * 0.6}" fill="none" opacity="0.6"/>`).join('')}
<g transform="translate(200 0)">
    <path d="M560 560 C540 360 640 220 800 210 C960 220 1060 360 1040 560 Z" fill="#17110c"/>
    <path d="M600 560 C590 390 670 270 800 262 C930 270 1010 390 1000 560 Z" fill="#241a12"/>
    <path d="M780 520 C770 600 790 660 776 740" stroke="#c4e4ec" stroke-width="30" fill="none" class="water" stroke-linecap="round"/>
    <path d="M800 520 C810 600 796 660 812 740" stroke="#effafd" stroke-width="10" fill="none" class="water w2" stroke-linecap="round"/>
    <ellipse cx="800" cy="790" rx="560" ry="110" fill="url(#poolG)"/>
    <ellipse cx="800" cy="770" rx="140" ry="22" fill="none" stroke="#e2f5f9" stroke-width="2.5" class="ripple"/>
    <ellipse cx="800" cy="770" rx="140" ry="22" fill="none" stroke="#e2f5f9" stroke-width="2.5" class="ripple r2"/>
    <!-- the cistern and the puddle -->
    </g><g transform="translate(600 650)"><ellipse rx="120" ry="40" fill="#6f5d40"/><ellipse rx="96" ry="30" fill="#141a1c"/><ellipse cx="-10" cy="4" rx="60" ry="14" fill="#2b3a40"/></g>
    <g transform="translate(1440 670)"><ellipse rx="110" ry="26" fill="#8c7a58"/><ellipse rx="86" ry="18" fill="#7d8f8e" opacity="0.9"/></g>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${spot('cistern', 600, 570, 'הבור')}
    ${spot('fill', 1000, 640, 'המים הנובעים')}
    ${spot('puddle', 1440, 600, 'השלולית')}
  </svg>`;
}
