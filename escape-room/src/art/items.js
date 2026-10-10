// Item drawings for the peddler's stall. Each is a small SVG built from its facts.

export function birdArt(a) {
  const s = a.size || 1;
  if (a.raptor) {
    return `<svg viewBox="0 0 160 120"><g transform="translate(80 64) scale(${s * 0.92}) translate(-80 -64)">
      <path d="M40 62 L10 50 L14 70 Z" fill="#4e3f31"/>
      <ellipse cx="72" cy="64" rx="38" ry="24" fill="${a.tone}"/>
      <path d="M50 58 Q80 34 110 58 Q84 72 50 66 Z" fill="#5b4a39"/>
      ${[0, 1, 2, 3, 4].map((i) => `<path d="M${58 + i * 8} 60 q4 8 0 14" stroke="#3e3226" stroke-width="1.4" fill="none"/>`).join('')}
      <circle cx="108" cy="42" r="15" fill="#7a6650"/><circle cx="112" cy="38" r="3" fill="#f2c94c"/><circle cx="112.5" cy="38" r="1.4" fill="#111"/>
      <path d="M120 38 C134 38 136 48 128 54 C128 48 124 46 120 47 Z" fill="#2b2622"/>
      <path d="M66 86 L62 104 M80 86 L82 104" stroke="#c9a640" stroke-width="4"/>
      <path d="M54 106 q6 -6 8 -2 q4 -6 6 0 q5 -4 6 2 M74 106 q6 -6 8 -2 q4 -6 6 0 q5 -4 6 2" stroke="#2b2622" stroke-width="2.4" fill="none"/>
      <ellipse cx="74" cy="110" rx="16" ry="5" fill="#8a7a6a"/></g></svg>`;
  }
  return `<svg viewBox="0 0 160 120"><g transform="translate(80 66) scale(${s}) translate(-80 -66)">
    <path d="M44 64 L16 56 L20 72 Z" fill="#5f4730"/>
    <ellipse cx="74" cy="66" rx="32" ry="21" fill="${a.tone}"/>
    <path d="M52 60 Q74 44 100 62 Q78 74 52 68 Z" fill="#6b5038"/>
    <path d="M60 62 q6 4 12 2 M66 58 q6 4 14 2" stroke="#4a3624" stroke-width="1.2" fill="none"/>
    ${a.crop ? '<circle cx="96" cy="70" r="9" fill="#a88a68"/><circle cx="96" cy="70" r="9" fill="none" stroke="#7d6248" stroke-width="1"/>' : ''}
    <circle cx="100" cy="48" r="14" fill="${a.tone}"/><circle cx="104" cy="45" r="2.6" fill="#111"/>
    <path d="M112 47 L124 50 L112 53 Z" fill="#d7b46a"/>
    <path d="M68 85 L66 100 M80 85 L82 100" stroke="#9c7a52" stroke-width="2.2"/>
    <path d="M58 101 l8 -1 l8 2 M74 101 l8 -1 l8 2" stroke="#9c7a52" stroke-width="2" fill="none"/>
    <path d="M66 100 l-6 4 M82 100 l-6 4" stroke="#9c7a52" stroke-width="2" fill="none"/>
    </g>
    <g transform="translate(10 10)"><rect width="38" height="22" rx="4" fill="#efe2c2" stroke="#8a6a44"/><text x="19" y="16" text-anchor="middle" font-size="13" fill="#3a2a18">${a.price} פ׳</text></g></svg>`;
}

export function cedarArt(a) {
  const L = a.len * 5, T = 10 * a.thick, x0 = 80 - L / 2;
  const fill = a.wood === 'cedar' ? '#9a4e32' : '#c4a678';
  const end = a.wood === 'cedar' ? '#c9784f' : '#e2cfa3';
  return `<svg viewBox="0 0 160 120">
    <rect x="${x0}" y="${60 - T / 2}" width="${L}" height="${T}" rx="${T / 2}" fill="${fill}"/>
    ${a.wood === 'oak' ? Array.from({ length: 8 }, (_, i) => `<line x1="${x0 + 6 + i * L / 8}" y1="${60 - T / 2 + 1}" x2="${x0 + 10 + i * L / 8}" y2="${60 + T / 2 - 1}" stroke="#8c7148" stroke-width="1.5"/>`).join('') : `<line x1="${x0 + 4}" y1="${60}" x2="${x0 + L - 4}" y2="${60 - 1}" stroke="#7a3a22" stroke-width="1" opacity="0.6"/>`}
    <ellipse cx="${x0 + L}" cy="60" rx="${T / 3}" ry="${T / 2}" fill="${end}"/>
    ${Array.from({ length: Math.floor(a.len / 4) + 1 }, (_, i) => `<line x1="${x0 + i * 20}" y1="${60 + T / 2 + 4}" x2="${x0 + i * 20}" y2="${60 + T / 2 + 12}" stroke="#5a4630" stroke-width="1.4"/>`).join('')}
    <line x1="${x0}" y1="${60 + T / 2 + 8}" x2="${x0 + L}" y2="${60 + T / 2 + 8}" stroke="#5a4630" stroke-width="1"/>
  </svg>`;
}

export function woolArt(a) {
  const tag = a.tag === 'worm' ? '<path d="M6 12 c4 -6 8 6 12 0 c4 -6 8 6 12 0" stroke="#7a1f25" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : a.tag === 'root' ? '<path d="M18 2 L18 10 M18 10 L10 20 M18 10 L26 20 M18 14 L18 22" stroke="#6a4a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      : '<path d="M8 18 C8 8 28 8 28 16 C28 22 18 22 18 16" stroke="#3a3a5a" stroke-width="2.4" fill="none"/>';
  return `<svg viewBox="0 0 160 120">
    ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${66 + i * 2}" cy="${60}" rx="${34 - i}" ry="${22 - i * 1.4}" fill="none" stroke="${a.color}" stroke-width="6" opacity="${0.75 + i * 0.03}" transform="rotate(${-20 + i * 6} 66 60)"/>`).join('')}
    <ellipse cx="66" cy="60" rx="30" ry="18" fill="${a.color}" opacity="0.5"/>
    <g transform="translate(112 70)"><line x1="0" y1="-10" x2="-14" y2="-24" stroke="#8a6a44"/><rect x="0" y="-10" width="36" height="26" rx="3" fill="#efe2c2" stroke="#8a6a44"/><g transform="translate(0 -6)">${tag}</g></g>
  </svg>`;
}

export function hyssopArt(a) {
  const stems = Array.from({ length: 7 }, (_, i) => {
    const x = 60 + i * 7, top = 22 + (i % 3) * 8;
    const leaves = Array.from({ length: 5 }, (_, j) => `<ellipse cx="${x + (j % 2 ? 6 : -6)}" cy="${top + 10 + j * 11}" rx="5" ry="2.6" fill="${a.leaf}" transform="rotate(${j % 2 ? -30 : 30} ${x + (j % 2 ? 6 : -6)} ${top + 10 + j * 11})"/>`).join('');
    return `<line x1="${x}" y1="${top}" x2="${x + 2}" y2="88" stroke="#5c6a40" stroke-width="1.6"/>${leaves}`;
  }).join('');
  return `<svg viewBox="0 0 160 120">${stems}
    <path d="M58 86 L104 86" stroke="#9e1f2d" stroke-width="5"/>
    ${a.tag ? `<g transform="translate(112 34)"><rect width="42" height="24" rx="3" fill="#efe2c2" stroke="#8a6a44"/><text x="21" y="17" text-anchor="middle" font-size="12" fill="#3a2a18">${a.tag}</text></g>` : ''}
  </svg>`;
}

export function vesselArt(a) {
  if (a.kind === 'copper') {
    return `<svg viewBox="0 0 160 120"><defs><linearGradient id="cu" x1="0" x2="1"><stop offset="0" stop-color="#8a4a22"/><stop offset="0.45" stop-color="#e09a5c"/><stop offset="1" stop-color="#7a3e1a"/></linearGradient></defs>
      <path d="M36 50 L124 50 C120 86 100 96 80 96 C60 96 40 86 36 50 Z" fill="url(#cu)"/><ellipse cx="80" cy="50" rx="44" ry="9" fill="#b8703a"/><ellipse cx="80" cy="50" rx="38" ry="6" fill="#5a2c12"/></svg>`;
  }
  const old = a.kind === 'old';
  return `<svg viewBox="0 0 160 120">
    <path d="M52 40 C40 56 42 84 60 96 L100 96 C118 84 120 56 108 40 Z" fill="${old ? '#8c5e40' : '#c47a48'}"/>
    <ellipse cx="80" cy="40" rx="28" ry="7" fill="${old ? '#6f4a32' : '#a8653a'}"/><ellipse cx="80" cy="40" rx="22" ry="4.6" fill="#3a2418"/>
    <path d="M52 40 C40 56 42 84 60 96 L70 96 C56 82 54 58 62 40 Z" fill="#000" opacity="0.12"/>
    ${old ? '<path d="M92 46 L88 60 L94 68 L88 84" stroke="#2a1a10" stroke-width="1.8" fill="none"/><path d="M58 52 l6 2 M96 76 l5 -1" stroke="#5a3a24" stroke-width="3"/>' : '<path d="M66 54 C72 50 90 50 96 54" stroke="#e6a070" stroke-width="2" fill="none" opacity="0.7"/>'}
  </svg>`;
}

export const ART = { birds: birdArt, cedar: cedarArt, wool: woolArt, hyssop: hyssopArt, vessel: vesselArt };
