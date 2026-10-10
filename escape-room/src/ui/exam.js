// The examination. The kohen looks; the metzora stands as he is told.
import { MARKS, REGIONS, POSTURES, SHADES, SHADE_ORDER, GRIS_PX, PLACES } from '../content.js';
import { lightMode, visibleRegions, examConditions } from '../logic.js';
import { drawSkin, drawShade, drawHairs, rng } from '../art/textures.js';
import { esc } from './dom.js';

const PW = 900, PH = 560, ZOOM = 2.6;

// ------------------------------------------------------------ figure (body map)
export function figureSVG(posture, active = '', visible = []) {
  const armsUp = posture === 'olive', legsApart = posture === 'hoe';
  const skin = '#c99a76', cloth = '#8a7559';
  const arm = (side) => {
    const s = side === 'r' ? -1 : 1;
    if (armsUp) return `<path d="M${100 + s * 38} 112 C${100 + s * 52} 88 ${100 + s * 58} 60 ${100 + s * 54} 26" stroke="${skin}" stroke-width="15" fill="none" stroke-linecap="round"/>`;
    return `<path d="M${100 + s * 38} 112 C${100 + s * 50} 150 ${100 + s * 52} 190 ${100 + s * 50} 228" stroke="${skin}" stroke-width="15" fill="none" stroke-linecap="round"/>`;
  };
  const leg = (side) => {
    const s = side === 'r' ? -1 : 1;
    const fx = legsApart ? 100 + s * 50 : 100 + s * 14;
    return `<path d="M${100 + s * 14} 250 L${fx} 386" stroke="${skin}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
  };
  // Region markers: positions on the figure. The figure faces the viewer: his right is on the viewer's left.
  const pts = {
    face: [100, 66], shoulder: [84, 120], forearm: armsUp ? [154, 52] : [150, 190],
    hand: armsUp ? [46, 22] : [50, 234], armpit: [66, 128], calf: legsApart ? [70, 340] : [92, 340],
  };
  const dots = Object.entries(pts).map(([r, [x, y]]) => {
    const vis = visible.includes(r);
    return `<g class="fig-dot ${r === active ? 'on' : ''} ${vis ? '' : 'hid'}" data-region="${r}"><circle cx="${x}" cy="${y}" r="9"/><circle cx="${x}" cy="${y}" r="3.2" class="core"/></g>`;
  }).join('');
  return `<svg viewBox="0 0 200 400" class="figure" aria-hidden="true">
    <ellipse cx="100" cy="392" rx="${legsApart ? 70 : 44}" ry="6" fill="#000" opacity="0.25"/>
    ${leg('r')}${leg('l')}
    <path d="M70 236 L130 236 L${legsApart ? 146 : 136} 300 L${legsApart ? 54 : 64} 300 Z" fill="${cloth}"/>
    <path d="M64 108 C64 96 136 96 136 108 L132 240 L68 240 Z" fill="${skin}"/>
    <path d="M64 108 C64 96 82 96 86 100 L82 240 L68 240 Z" fill="#000" opacity="0.08"/>
    ${arm('r')}${arm('l')}
    <rect x="92" y="80" width="16" height="22" fill="${skin}"/>
    <ellipse cx="100" cy="64" rx="22" ry="26" fill="${skin}"/>
    <path d="M78 58 C76 30 124 30 122 58 C118 46 82 46 78 58 Z" fill="#3d2c1e"/>
    <path d="M82 76 C90 92 110 92 118 76 C112 98 88 98 82 76 Z" fill="#3d2c1e"/>
    ${dots}
  </svg>`;
}

// ------------------------------------------------------------ region panel rendering
function renderRegion(canvas, region, mode, posture, scale = 1) {
  const ctx = canvas.getContext('2d');
  canvas.width = PW * scale; canvas.height = PH * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const R = REGIONS[region];
  if (R.needs && R.needs !== posture) {
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 0, PW, PH);
    const r = rng(region.length * 31);
    for (let i = 0; i < 60; i++) { ctx.strokeStyle = `rgba(140,115,85,${0.1 + r() * 0.15})`; ctx.lineWidth = 2 + r() * 6; ctx.beginPath(); const y = r() * PH; ctx.moveTo(0, y); ctx.bezierCurveTo(300, y + 30, 600, y - 30, PW, y + 10); ctx.stroke(); }
    return;
  }
  drawSkin(ctx, PW, PH, region.length * 97 + 3, mode);
  Object.values(MARKS).filter((m) => m.region === region).forEach((m) => {
    const cx = m.cx * PW, cy = m.cy * PH;
    drawShade(ctx, m.shade, cx, cy, m.r, m.seed, mode);
    drawHairs(ctx, cx, cy, m.r, m.white, m.black, m.seed);
  });
  // ordinary body hair outside the marks, so counting means looking closely
  const r = rng(region.length * 13 + 7);
  for (let i = 0; i < 26; i++) {
    const x = r() * PW, y = r() * PH;
    if (Object.values(MARKS).some((m) => m.region === region && Math.hypot(x - m.cx * PW, y - m.cy * PH) < m.r * 1.15)) continue;
    ctx.strokeStyle = 'rgba(40,25,15,0.7)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y - 6, x + 3 + r() * 6, y - 10 - r() * 4); ctx.stroke();
  }
}

// ------------------------------------------------------------ the kohen's examination
export function mountExamK(root, ctx) {
  let region = 'hand', recOpen = '', gris = false, grisPos = { x: 120, y: 120 };
  const big = document.createElement('canvas');
  let lastKey = '';

  const marksIn = (r) => Object.entries(MARKS).filter(([, m]) => m.region === r);

  function layout() {
    root.innerHTML = `
      <div class="exam">
        <aside class="exam-side">
          <div class="fig-wrap" id="kFig"></div>
          <div class="regions" id="kRegions"></div>
        </aside>
        <section class="exam-main">
          <div class="exam-bar"><div id="kLight" class="light-chip"></div><div class="exam-tools">
            <button class="chip-btn" id="grisBtn" aria-pressed="false">מידת הגריס</button></div></div>
          <div class="panel-wrap" id="panelWrap">
            <canvas id="panel" class="panel" width="${PW}" height="${PH}"></canvas>
            <div class="gris" id="gris" hidden><span>גריס</span></div>
            <canvas id="lens" class="lens" width="220" height="220" hidden></canvas>
            <div class="covered" id="covered" hidden><p>החלק הזה אינו נגלה בעמידה הזאת.</p><p class="sub">בקש מן המצורע לעמוד אחרת.</p></div>
            <div class="rec-pop" id="recPop" hidden></div>
          </div>
          <p class="exam-hint">העבר את הזכוכית על העור כדי לראות שערות. לחץ על נגע כדי לרשום אותו בפנקס.</p>
        </section>
        <aside class="exam-ledger">
          <h4>פנקס הבדיקה</h4>
          <ol id="ledger" class="ledger"></ol>
          <div class="verdict">
            <p class="verdict-lead">כשתסיים לראות, פסוק.</p>
            <div class="verdict-btns"><button class="btn gold" id="vTahor">"טָהוֹר"</button><button class="btn ghost" id="vTame">"טָמֵא"</button></div>
            <button class="btn link" id="endExam">הפסק את הבדיקה</button>
          </div>
        </aside>
      </div>`;
    root.querySelector('#grisBtn').addEventListener('click', () => { gris = !gris; draw(); });
    root.querySelector('#vTahor').addEventListener('click', () => ctx.act('declare', { verdict: 'tahor' }));
    root.querySelector('#vTame').addEventListener('click', () => ctx.act('declare', { verdict: 'tame' }));
    root.querySelector('#endExam').addEventListener('click', () => ctx.act('endExam'));

    const panel = root.querySelector('#panel'), lens = root.querySelector('#lens'), wrap = root.querySelector('#panelWrap');
    const toPanel = (e) => { const b = panel.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * PW, y: (e.clientY - b.top) / b.height * PH, bx: e.clientX - b.left, by: e.clientY - b.top, b }; };
    panel.addEventListener('pointermove', (e) => {
      const S = ctx.state(); const R = REGIONS[region];
      if (R.needs && R.needs !== S.posture) { lens.hidden = true; return; }
      const p = toPanel(e); lens.hidden = false;
      const size = 220;
      lens.style.transform = `translate(${p.bx - size / 2}px, ${p.by - size / 2}px)`;
      const lc = lens.getContext('2d');
      lc.clearRect(0, 0, size, size);
      lc.save(); lc.beginPath(); lc.arc(size / 2, size / 2, size / 2 - 3, 0, 7); lc.clip();
      const sx = p.x * ZOOM - size / 2, sy = p.y * ZOOM - size / 2;
      lc.drawImage(big, sx, sy, size, size, 0, 0, size, size);
      lc.restore();
    });
    panel.addEventListener('pointerleave', () => { lens.hidden = true; });
    panel.addEventListener('click', (e) => {
      const S = ctx.state(); const R = REGIONS[region];
      if (R.needs && R.needs !== S.posture) return;
      const p = toPanel(e);
      const hit = marksIn(region).find(([, m]) => Math.hypot(p.x - m.cx * PW, (p.y - m.cy * PH) / 0.86) < m.r * 1.12);
      if (hit) { recOpen = hit[0]; drawRec(p.bx, p.by); } else { recOpen = ''; drawRec(); }
    });
    // the gris square can be dragged over a mark to compare
    const g = root.querySelector('#gris');
    let gd = null;
    g.addEventListener('pointerdown', (e) => { gd = { x: e.clientX, y: e.clientY, ox: grisPos.x, oy: grisPos.y }; g.setPointerCapture(e.pointerId); e.stopPropagation(); });
    g.addEventListener('pointermove', (e) => {
      if (!gd) return; const b = panel.getBoundingClientRect(); const k = PW / b.width;
      grisPos = { x: gd.ox + (e.clientX - gd.x) * k, y: gd.oy + (e.clientY - gd.y) * k }; placeGris();
    });
    g.addEventListener('pointerup', () => { gd = null; });
    window.addEventListener('resize', placeGris);
  }

  function placeGris() {
    const panel = root.querySelector('#panel'), g = root.querySelector('#gris');
    if (!panel || !g) return;
    const b = panel.getBoundingClientRect(); const k = b.width / PW;
    g.style.width = g.style.height = (GRIS_PX * k) + 'px';
    g.style.transform = `translate(${grisPos.x * k}px, ${grisPos.y * k}px)`;
  }

  function drawRec(bx, by) {
    const pop = root.querySelector('#recPop');
    if (!recOpen) { pop.hidden = true; return; }
    const S = ctx.state(); const rec = (S.exam.rec || {})[recOpen] || {};
    pop.hidden = false;
    if (bx != null) pop.style.cssText = `left:${Math.min(bx, root.querySelector('#panel').clientWidth - 250)}px; top:${Math.max(8, by - 40)}px`;
    pop.innerHTML = `<h5>רישום נגע</h5>
      <label>מראה<select class="sel" id="rShade"><option value="">…</option>${SHADE_ORDER.map((k) => `<option value="${k}" ${rec.shade === k ? 'selected' : ''}>${esc(SHADES[k].name)} · ${esc(SHADES[k].like)}</option>`).join('')}</select></label>
      <label>שיעור<select class="sel" id="rSize"><option value="">…</option><option value="lt" ${rec.size === 'lt' ? 'selected' : ''}>פחות מגריס</option><option value="ge" ${rec.size === 'ge' ? 'selected' : ''}>כגריס או יותר</option></select></label>
      <label>שערות לבנות<select class="sel" id="rWhite"><option value="">…</option>${[0, 1, 2, 3, 4].map((n) => `<option value="${n}" ${String(rec.white) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <div class="rec-actions"><button class="btn gold sm" id="rSave">רשום</button><button class="btn link sm" id="rCancel">ביטול</button></div>`;
    pop.querySelector('#rCancel').addEventListener('click', () => { recOpen = ''; drawRec(); });
    pop.querySelector('#rSave').addEventListener('click', () => {
      const v = { shade: pop.querySelector('#rShade').value, size: pop.querySelector('#rSize').value, white: pop.querySelector('#rWhite').value };
      if (!v.shade || !v.size || v.white === '') { ctx.toast('מלא מראה, שיעור ומספר שערות.'); return; }
      ctx.act('record', { mark: recOpen, rec: { ...v, white: Number(v.white), region } });
      recOpen = ''; drawRec();
    });
  }

  function draw() {
    const S = ctx.state();
    const mode = lightMode(S, S.loc.m);
    const vis = visibleRegions(S.posture);
    root.querySelector('#kFig').innerHTML = figureSVG(S.posture, region, vis);
    root.querySelectorAll('#kFig .fig-dot').forEach((d) => d.addEventListener('click', () => { region = d.dataset.region; ctx.act('look', { region }); draw(); }));
    root.querySelector('#kRegions').innerHTML = Object.entries(REGIONS).map(([id, r]) => `<button class="region-btn ${id === region ? 'on' : ''} ${vis.includes(id) ? '' : 'hid'}" data-r="${id}">${esc(r.name)}${vis.includes(id) ? '' : '<small>מכוסה</small>'}</button>`).join('');
    root.querySelectorAll('.region-btn').forEach((b) => b.addEventListener('click', () => { region = b.dataset.r; recOpen = ''; ctx.act('look', { region }); draw(); }));
    const bad = examConditions(S);
    const lightTxt = { true: 'אור יום מלא', dim: 'אור עמום', glare: 'אור צהריים חזק' }[mode];
    root.querySelector('#kLight').innerHTML = `<span class="dot ${mode}"></span>${lightTxt} · ${esc(PLACES[S.loc.m].name)}`;
    root.querySelector('#kLight').title = bad.length ? 'שים לב לזמן ולמקום' : '';
    const key = [region, mode, S.posture].join('|');
    if (key !== lastKey) {
      lastKey = key;
      renderRegion(root.querySelector('#panel'), region, mode, S.posture, 1);
      renderRegion(big, region, mode, S.posture, ZOOM);
    }
    const R = REGIONS[region];
    root.querySelector('#covered').hidden = !(R.needs && R.needs !== S.posture);
    root.querySelector('#grisBtn').setAttribute('aria-pressed', String(gris));
    root.querySelector('#gris').hidden = !gris; placeGris();
    const recs = S.exam.rec || {};
    const ids = Object.keys(recs);
    root.querySelector('#ledger').innerHTML = ids.length ? ids.map((id, i) => {
      const r = recs[id];
      return `<li><b>${i + 1}. ${esc(REGIONS[r.region || MARKS[id].region].name)}</b><span>${esc(SHADES[r.shade]?.like || '')} · ${r.size === 'lt' ? 'פחות מגריס' : 'כגריס ויותר'} · ${r.white} שערות לבנות</span></li>`;
    }).join('') : '<li class="empty">עדיין לא נרשם דבר.</li>';
  }

  layout();
  return { update: draw };
}

// ------------------------------------------------------------ the metzora during the examination
export function mountExamM(root, ctx) {
  function draw() {
    const S = ctx.state();
    const vis = visibleRegions(S.posture);
    root.innerHTML = `<div class="exam exam-m">
      <section class="m-fig"><div class="fig-wrap big">${figureSVG(S.posture, S.exam.region, vis)}</div>
        <p class="m-looking">${S.exam.region ? `הכהן מסתכל עכשיו ב${esc(REGIONS[S.exam.region].name)}.` : 'הכהן מתבונן בך.'}</p></section>
      <section class="m-controls">
        <h4>איך אתה עומד</h4>
        <div class="postures">${Object.entries(POSTURES).map(([id, p]) => `<button class="posture ${S.posture === id ? 'on' : ''}" data-p="${id}"><b>${esc(p.name)}</b><span>${esc(p.note)}</span></button>`).join('')}</div>
        <p class="m-note">אדם אינו רואה את נגעי עצמו. אתה עומד, והכהן רואה ופוסק. אם הוא מבקש, שנה את עמידתך.</p>
      </section></div>`;
    root.querySelectorAll('.posture').forEach((b) => b.addEventListener('click', () => ctx.act('posture', { p: b.dataset.p })));
  }
  draw();
  return { update: draw };
}
