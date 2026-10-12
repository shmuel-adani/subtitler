import { ROLES, PLACES, HOUR_NAMES, INTRO, M_NOTES, LAST_HOUR } from './content.js';
import { initialState, apply, isCloudy, together, examConditions } from './logic.js';
import { connect, newCode, playerId, deepMerge } from './net.js';
import { textureURL } from './art/textures.js';
import { applyLight } from './art/light.js';
import { createPanorama } from './art/panorama.js';
import { gatehouse, boothInside, stallClose, springClose } from './art/scenes.js';
import { openBook } from './ui/book.js';
import { mountExamK, mountExamM } from './ui/exam.js';
import { mountMarket, mountSpring, mountInspect } from './ui/market.js';
import { $, esc, toast, openSheet, closeSheet, currentSheet } from './ui/dom.js';

const app = {
  net: null, code: '', role: '', pid: playerId(), S: null,
  inside: true, closeup: '', pano: null, tex: null,
  lastEv: 0, examUI: null, inspectUI: null, cuUI: null, cuKey: '', seenIntro: false,
};

const ctx = {
  state: () => app.S,
  act: (type, payload) => act(type, payload),
  toast: (t, o) => toast(t, o),
};

// ------------------------------------------------------------------ actions
async function act(type, payload = {}) {
  if (!app.S) return;
  const r = apply(app.S, app.role, type, payload);
  if (r.error) toast(r.error, { tone: 'bad', src: r.src || '' });
  const patch = { ...(r.patch || {}) };
  if (r.event) patch.ev = r.event;
  if (Object.keys(patch).length) {
    const before = app.S;
    app.S = deepMerge(app.S, patch); // optimistic
    onState(app.S, true, before);
    try { await app.net.patch(app.code, patch); } catch (e) { toast('החיבור נקטע לרגע. נסה שוב.', { tone: 'bad' }); }
  }
  return r;
}

// ------------------------------------------------------------------ boot
async function boot() {
  app.tex = { stone: textureURL('stone'), stoneDark: textureURL('stoneDark'), wood: textureURL('wood'), parchment: textureURL('parchment') };
  document.documentElement.style.setProperty('--parchment-img', `url(${app.tex.parchment})`);
  applyLight(document.documentElement, 2, false);
  renderLobby('connecting');
  app.net = await connect();
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('machane-session') || 'null'); } catch (e) { saved = null; }
  if (saved?.code && saved?.role) {
    const s = await app.net.load(saved.code).catch(() => null);
    if (s && s.seats[saved.role] === app.pid) { enterGame(saved.code, saved.role); return; }
  }
  renderLobby('ready');
}

function renderLobby(phase, msg = '') {
  const root = $('#app');
  const online = app.net?.kind === 'online';
  root.innerHTML = `<section class="lobby">
    <div class="lobby-art" aria-hidden="true">${lobbySkyline()}</div>
    <div class="lobby-card">
      <p class="kicker">חדר בריחה לשני שחקנים</p>
      <h1 class="title">מחוץ למחנה</h1>
      <p class="verse">"זֹאת תִּהְיֶה תּוֹרַת הַמְּצֹרָע בְּיוֹם טָהֳרָתוֹ, וְהוּבָא אֶל הַכֹּהֵן"</p>
      <p class="lead">שחקן אחד הוא המצורע, שיושב מחוץ לחומות ירושלים. השני הוא הכהן, שבידו ספר ההלכות. כל אחד רואה את עולמו, וכל פעולה של אחד משנה מיד את מה שהשני רואה. דברו ביניכם בשיחה קולית לאורך כל המשחק.</p>
      ${phase === 'connecting' ? '<p class="status">מתחבר…</p>' : `
      <div class="lobby-actions" id="lobbyActions">
        <button class="btn gold lg" id="newRoom">פתח חדר חדש</button>
        <form class="join" id="joinForm"><label for="joinCode">יש לך קוד חדר?</label><div class="join-row"><input id="joinCode" maxlength="4" autocomplete="off" spellcheck="false" placeholder="ABCD" inputmode="latin" dir="ltr"><button class="btn ghost" type="submit">הצטרף</button></div></form>
      </div>
      <p class="net-note">${app.net?.kind === 'server' ? 'מחובר לשרת. שלחו לשחקן השני את כתובת האתר ואת קוד החדר.' : online ? 'מחובר. שני השחקנים צריכים גישת עריכה לעמוד הזה כדי לשחק יחד.' : 'מצב מקומי: אפשר לשחק בשתי לשוניות באותו דפדפן. לשחק משני מכשירים, פתחו את העמוד דרך הקישור המשותף.'}</p>`}
      ${msg ? `<p class="status bad">${esc(msg)}</p>` : ''}
    </div></section>`;
  if (phase === 'connecting') return;
  $('#newRoom').addEventListener('click', () => chooseRole(null));
  $('#joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#joinCode').value.trim().toUpperCase();
    if (code.length !== 4) { renderLobby('ready', 'קוד חדר הוא ארבעה תווים.'); return; }
    const s = await app.net.load(code).catch(() => null);
    if (!s) { renderLobby('ready', 'לא נמצא חדר בקוד הזה. בדקו את הקוד עם השחקן השני.'); return; }
    chooseRole(code, s);
  });
}

function chooseRole(code, existing) {
  const box = $('#lobbyActions');
  const taken = (r) => existing && existing.seats[r] && existing.seats[r] !== app.pid;
  box.innerHTML = `<p class="pick-lead">${code ? `חדר ${esc(code)}. בחר תפקיד:` : 'בחר את התפקיד שלך:'}</p>
    <div class="roles">
      <button class="role-card" data-role="m" ${taken('m') ? 'disabled' : ''}><span class="role-name">המצורע</span><span class="role-desc">יושב מחוץ לחומה. עומד לפני הכהן, קונה אצל הרוכל, ממלא מים מן המעיין.</span>${taken('m') ? '<span class="taken">תפוס</span>' : ''}</button>
      <button class="role-card" data-role="k" ${taken('k') ? 'disabled' : ''}><span class="role-name">הכהן</span><span class="role-desc">יושב בלשכת השער עם ספר הנגעים. לומד, יוצא, רואה ופוסק.</span>${taken('k') ? '<span class="taken">תפוס</span>' : ''}</button>
    </div>`;
  box.querySelectorAll('.role-card').forEach((b) => b.addEventListener('click', async () => {
    const role = b.dataset.role;
    let c = code;
    if (!c) {
      c = newCode();
      try { await app.net.create(c, initialState(c)); } catch (e) { renderLobby('ready', 'לא ניתן לפתוח חדר כעת. ייתכן שאין לך הרשאת עריכה לעמוד.'); return; }
    }
    const s = await app.net.load(c);
    const r = apply(s, role, 'claim', { pid: app.pid });
    if (r.error) { renderLobby('ready', r.error); return; }
    try { await app.net.patch(c, r.patch); } catch (e) { renderLobby('ready', 'לא ניתן להצטרף. ייתכן שאין לך הרשאת עריכה לעמוד.'); return; }
    try { sessionStorage.setItem('machane-session', JSON.stringify({ code: c, role })); } catch (e) { /* ok */ }
    enterGame(c, role);
  }));
}

// ------------------------------------------------------------------ game shell
function enterGame(code, role) {
  app.code = code; app.role = role;
  $('#app').innerHTML = `<div class="game" data-role="${role}">
    <header class="hud">
      <div class="hud-brand">מחוץ למחנה</div>
      <div class="hud-time" id="hudTime"></div>
      <div class="hud-right">
        <span class="chip" id="hudPartner"></span>
        <button class="chip code" id="hudCode" title="העתק את קוד החדר">חדר <b dir="ltr">${esc(code)}</b></button>
        <span class="chip timer" id="hudTimer">00:00</span>
        <button class="icon-btn" id="hudMenu" aria-label="תפריט">☰</button>
      </div>
    </header>
    <main class="stage" id="stage">
      <div class="pano-host" id="panoHost"></div>
      <div class="cu-host" id="cuHost" hidden></div>
      <button class="pan-btn left" id="panL" aria-label="הסתכל שמאלה"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="pan-btn right" id="panR" aria-label="הסתכל ימינה"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="overlay" id="examHost" hidden></div>
      <div class="banner" id="banner" hidden></div>
    </main>
    <nav class="dock" id="dock"></nav>
  </div>`;
  app.pano = createPanorama($('#panoHost'), { onPlace, textures: app.tex });
  $('#panL').addEventListener('click', () => app.pano.pan(-520));
  $('#panR').addEventListener('click', () => app.pano.pan(520));
  $('#hudCode').addEventListener('click', () => {
    navigator.clipboard?.writeText(code).then(() => toast('קוד החדר הועתק.'), () => toast('קוד החדר: ' + code));
  });
  $('#hudMenu').addEventListener('click', openMenu);
  document.addEventListener('keydown', (e) => {
    if (currentSheet() || !app.S || app.inside) return;
    if (e.key === 'ArrowLeft') app.pano.pan(-300);
    if (e.key === 'ArrowRight') app.pano.pan(300);
  });
  app.net.subscribe(code, (s) => onState(s), () => toast('החיבור לחדר נותק. רענן את הדף.', { tone: 'bad' }));
  setInterval(tickTimer, 1000);
}

let firstState = true;
function onState(s, local, before) {
  const prev = before || app.S;
  app.S = s;
  if (!s) return;
  if (firstState) {
    firstState = false;
    const here = s.loc[app.role];
    app.inside = !!PLACES[here]?.closeup && (here === 'gatehouse' || here === 'booth');
    app.pano.centerOn(here, true);
    app.lastEv = s.ev?.n || 0;
    showIntro();
  }
  if (prev && prev.loc[app.role] !== s.loc[app.role]) { app.inside = s.loc[app.role] === 'gatehouse'; app.pano.centerOn(s.loc[app.role]); }
  if (s.ev && s.ev.n > app.lastEv) { app.lastEv = s.ev.n; if (!local || s.ev.tone === 'pure') showEvent(s.ev); }
  render();
}

function tickTimer() {
  const S = app.S; if (!S) return;
  const el = $('#hudTimer'); if (!el) return;
  if (!S.startedAt) { el.textContent = 'ממתין'; return; }
  const end = S.finishedAt || Date.now();
  const t = Math.max(0, Math.floor((end - S.startedAt) / 1000) + S.penalty * 60);
  el.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  el.title = S.penalty ? `כולל ${S.penalty} דקות תוספת על טעויות` : '';
}

// ------------------------------------------------------------------ render
function render() {
  const S = app.S, me = app.role, other = me === 'm' ? 'k' : 'm';
  const cloudy = isCloudy(S);
  applyLight(document.documentElement, S.hour, cloudy);
  app.pano.setTime(S.hour, cloudy);
  app.pano.setAvatars(S.loc, me);
  app.pano.setHotspots((place) => ({ here: S.loc[me] === place, partner: S.loc[other] === place, locked: !reachable(place) }));

  $('#hudTime').innerHTML = `<span class="sun-ico ${cloudy ? 'cloudy' : ''}" aria-hidden="true"></span><span>השעה ${HOUR_NAMES[S.hour]}</span><small>יום ${S.day === 1 ? 'ראשון' : S.day === 2 ? 'שני' : S.day}${cloudy ? ' · מעונן' : ''}</small>`;
  const partnerSeat = S.seats[other];
  $('#hudPartner').innerHTML = partnerSeat ? `<span class="pdot"></span>${ROLES[other].name} · ${esc(PLACES[S.loc[other]].name)}` : `<span class="pdot off"></span>${ROLES[other].name} עוד לא הצטרף`;

  // close-up or panorama
  const here = S.loc[me];
  const showCU = app.inside && PLACES[here]?.closeup;
  $('#cuHost').hidden = !showCU;
  $('#panoHost').classList.toggle('dim', !!showCU);
  $('#panL').hidden = $('#panR').hidden = !!showCU;
  if (showCU) mountCloseup(PLACES[here].closeup); else { app.cuKey = ''; app.cuUI = null; }
  if (app.cuUI) app.cuUI.update?.();

  renderDock();
  renderExam();
  renderInspect();
  renderFinish();
  const sh = $('.sheet-wrap');
  if (sh?._rerender) sh._rerender();
}

function reachable(place) {
  const S = app.S, me = app.role;
  if (me === 'k' && S.loc.k === 'gatehouse' && !S.f.certified) return false;
  if (me === 'm' && (place === 'gate' || place === 'gatehouse')) return false;
  if (me === 'k' && (place === 'booth' || place === 'stall')) return false;
  return true;
}

function onPlace(place) {
  const S = app.S, me = app.role;
  if (!S) return;
  if (S.loc[me] === place) {
    if (PLACES[place].closeup && !(me === 'k' && place === 'booth')) { app.inside = true; render(); }
    else if (place === 'field') openSundial();
    else if (place === 'gate' && me === 'k') { act('move', { to: 'gatehouse' }); }
    return;
  }
  if (me === 'k' && place === 'stall') { toast('הכהן אינו עוסק במקח ובממכר. המצורע יביא אליו את מה שקנה.'); return; }
  act('move', { to: place });
}

// ------------------------------------------------------------------ dock
function renderDock() {
  const S = app.S, me = app.role, here = S.loc[me];
  const b = [];
  if (me === 'k') b.push(['book', 'ספר הנגעים', 'primary']);
  if (me === 'm') b.push(['notes', 'מה שאתה יודע', '']);
  if (here === 'field') b.push(['sundial', 'שעון השמש', '']);
  if (!app.inside && PLACES[here]?.closeup && reachable(here) && !(me === 'k' && here === 'booth')) {
    b.push(['enter', { booth: 'היכנס לסוכה', stall: 'גש אל הדוכן', spring: 'רד אל המים', gatehouse: 'היכנס ללשכה' }[here] || 'היכנס', '']);
  }
  if (app.inside && here !== 'gatehouse') b.push(['leave', 'חזור אל העמק', '']);
  if (me === 'k' && S.f.certified && !S.f.declared && together(S) && PLACES[here].outdoor && !S.exam.active) b.push(['exam', 'בדוק את המצורע', 'gold']);
  if (me === 'm' && S.f.commanded && !S.f.basketOk && !S.basket.brought && together(S)) b.push(['bring', 'הנח את הסל לפני הכהן', 'gold']);
  const where = PLACES[here].name;
  $('#dock').innerHTML = `<div class="dock-where"><span class="you-dot"></span>${esc(ROLES[me].name)} · ${esc(where)}</div>
    <div class="dock-actions">${b.map(([id, label, kind]) => `<button class="btn ${kind === 'gold' ? 'gold' : kind === 'primary' ? 'solid' : 'ghost'}" data-a="${id}">${esc(label)}</button>`).join('')}</div>`;
  $('#dock').querySelectorAll('[data-a]').forEach((el) => el.addEventListener('click', () => dockAction(el.dataset.a)));
}

function dockAction(a) {
  if (a === 'book') openBook(ctx, app.S.f.declared && !app.S.f.commanded ? 'order' : 'shades');
  if (a === 'notes') openNotes();
  if (a === 'sundial') openSundial();
  if (a === 'enter') { app.inside = true; render(); }
  if (a === 'leave') { app.inside = false; app.pano.centerOn(app.S.loc[app.role]); render(); }
  if (a === 'exam') act('startExam');
  if (a === 'bring') act('bring');
}

// ------------------------------------------------------------------ close-ups
function mountCloseup(kind) {
  const key = kind + ':' + app.role;
  if (app.cuKey === key) return;
  app.cuKey = key;
  const host = $('#cuHost');
  const svg = { gatehouse, booth: boothInside, stall: stallClose, spring: springClose }[kind](app.tex);
  host.innerHTML = `<div class="cu-scene">${svg}</div><div class="cu-panel" id="cuPanel" hidden></div>`;
  host.classList.remove('enter'); void host.offsetWidth; host.classList.add('enter');
  app.cuUI = null;
  const panel = $('#cuPanel');
  host.querySelectorAll('.hs').forEach((h) => {
    const fire = () => spotAction(kind, h.dataset.spot);
    h.addEventListener('click', fire);
    h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
  if (kind === 'stall' && app.role === 'm') { panel.hidden = false; panel.classList.add('wide'); app.cuUI = mountMarket(panel, ctx); }
  if (kind === 'spring' && app.role === 'm') { panel.hidden = false; app.cuUI = mountSpring(panel, ctx); }
  if (kind === 'gatehouse') {
    const bar = host.querySelector('#doorBar');
    app.cuUI = { update: () => { if (bar) bar.style.transform = app.S.f.certified ? 'translateY(-180px)' : ''; } };
  }
}

function spotAction(kind, id) {
  const S = app.S;
  if (kind === 'gatehouse') {
    if (id === 'book') openBook(ctx, 'shades');
    if (id === 'window') openSundial(true);
    if (id === 'door') {
      if (!S.f.certified) { toast('הדלת מוברחת. לא תצא עד שתעמוד במבחן המראות שבסוף הספר.', { src: 'משנה נגעים ג, א' }); return; }
      app.inside = false; act('move', { to: 'gate' });
    }
  }
  if (kind === 'booth') {
    if (id === 'notes') openNotes();
    if (id === 'out') { app.inside = false; app.pano.centerOn('booth'); render(); }
  }
  if (kind === 'spring') {
    if (app.role !== 'm') { toast('את המים ימלא המצורע בכלי שקנה.'); return; }
    const src = { fill: 'spring', cistern: 'cistern', puddle: 'puddle' }[id];
    app.cuUI?.setSource?.(src);
  }
}

// ------------------------------------------------------------------ sheets
function openNotes() {
  openSheet({ id: 'notes', title: 'מה שאתה יודע', kicker: 'המצורע', parchment: true,
    body: `<div class="notes">${M_NOTES.map((n) => `<section><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></section>`).join('')}</div>` });
}

function openSundial(fromWindow) {
  const S = app.S;
  const draw = () => {
    const S2 = app.S; const cloudy = isCloudy(S2);
    return `<div class="sundial">
      <div class="dial" aria-hidden="true">${dialSVG(S2.hour, cloudy)}</div>
      <div class="dial-text"><p class="big-hour">השעה ${HOUR_NAMES[S2.hour]}</p>
      <p>${cloudy ? 'ענן כבד מכסה את החמה. הצל כמעט אינו נראה.' : S2.hour === 6 || S2.hour === 7 ? 'השמש עומדת גבוה, והאור לבן וחזק.' : S2.hour <= 3 ? 'השמש עוד נמוכה במזרח.' : S2.hour >= 10 ? 'החמה נוטה למערב.' : 'אור יום בהיר.'}</p>
      <p class="dim">היום נחלק לשתים עשרה שעות, מזריחת החמה ועד שקיעתה. ${S2.hour >= LAST_HOUR ? 'עוד מעט יחשיך.' : ''}</p>
      ${fromWindow ? '<p class="dim">מן החלון אפשר לראות את השעה. להמתין צריך ליד שעון השמש שבשדה.</p>' : '<button class="btn gold" id="waitBtn">המתן שעה</button>'}</div></div>`;
  };
  const sh = openSheet({ id: 'sundial', title: fromWindow ? 'מן החלון' : 'שעון השמש', kicker: PLACES.field.name, body: draw() });
  const wire = () => { sh.body.querySelector('#waitBtn')?.addEventListener('click', () => act('wait')); };
  wire();
  sh.el._rerender = () => { sh.body.innerHTML = draw(); wire(); };
}

function dialSVG(hour, cloudy) {
  const a = Math.PI * (0.08 + (hour - 1) / 11 * 0.84);
  return `<svg viewBox="0 0 240 140"><path d="M10 120 A110 110 0 0 1 230 120 Z" fill="#e9dcbc" stroke="#9c8660" stroke-width="2"/>
    ${Array.from({ length: 13 }, (_, i) => { const t = Math.PI + (i / 12) * Math.PI; return `<line x1="${120 + Math.cos(t) * 92}" y1="${120 + Math.sin(t) * 92}" x2="${120 + Math.cos(t) * 104}" y2="${120 + Math.sin(t) * 104}" stroke="#6d5a3c" stroke-width="${i % 3 ? 1.2 : 2.2}"/>`; }).join('')}
    ${[4, 5, 8, 9].map((h) => { const t = Math.PI + ((h - 0.5) / 12) * Math.PI; return `<circle cx="${120 + Math.cos(t) * 80}" cy="${120 + Math.sin(t) * 80}" r="2.4" fill="#9c8660"/>`; }).join('')}
    <line x1="120" y1="120" x2="${120 + Math.cos(Math.PI + a) * -88}" y2="${120 - Math.sin(a) * 88}" stroke="#2c2117" stroke-width="5" stroke-linecap="round" opacity="${cloudy ? 0.12 : 0.7}"/>
    <circle cx="120" cy="120" r="6" fill="#8a7450"/></svg>`;
}

function openMenu() {
  const S = app.S;
  const sh = openSheet({ id: 'menu', title: 'תפריט', body: `<div class="menu">
    <p>אתה משחק בתור <b>${esc(ROLES[app.role].name)}</b> בחדר <b dir="ltr">${esc(app.code)}</b>.</p>
    <p class="dim">כדי שהשחקן השני יצטרף, שלח לו את הקישור לעמוד ואת קוד החדר.</p>
    <div class="menu-btns"><button class="btn ghost" id="mLeave">צא לתפריט הראשי</button></div>
    <p class="dim small">${app.net.kind !== 'local' ? 'המשחק מסונכרן דרך השרת.' : 'מצב מקומי: הסנכרון פועל בין לשוניות של אותו דפדפן.'}</p></div>` });
  sh.body.querySelector('#mLeave').addEventListener('click', () => {
    try { sessionStorage.removeItem('machane-session'); } catch (e) { /* ok */ }
    location.reload();
  });
}

function showIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem('machane-intro-' + app.code + app.role) === '1'; } catch (e) { seen = false; }
  if (seen) return;
  const it = INTRO[app.role];
  const sh = openSheet({ id: 'intro', title: it.title, kicker: it.kicker, parchment: true,
    body: `<p class="intro-text">${esc(it.text)}</p><div class="center"><button class="btn gold" id="introGo">התחל</button></div>` });
  sh.body.querySelector('#introGo').addEventListener('click', () => closeSheet());
  try { sessionStorage.setItem('machane-intro-' + app.code + app.role, '1'); } catch (e) { /* ok */ }
}

function showEvent(ev) {
  if (ev.tone === 'pure') {
    const b = $('#banner');
    b.hidden = false;
    b.innerHTML = `<div class="banner-inner"><p class="banner-kicker">${ev.who === 'k' ? 'קול הכהן' : ''}</p><p class="banner-text">${esc(ev.text)}</p></div>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    setTimeout(() => { b.hidden = true; }, 4800);
  } else {
    toast(ev.text, { tone: ev.tone });
  }
}

// ------------------------------------------------------------------ exam & inspection overlays
function renderExam() {
  const S = app.S;
  const host = $('#examHost');
  const show = S.exam.active && together(S);
  if (!show) { if (!host.hidden) { host.hidden = true; host.innerHTML = ''; app.examUI = null; } return; }
  if (!app.examUI) {
    closeSheet(true);
    host.hidden = false;
    host.innerHTML = `<div class="overlay-head"><div><p class="kicker">${app.role === 'k' ? 'וְרָאָה הַכֹּהֵן' : 'הכהן בודק אותך'}</p><h2>${app.role === 'k' ? 'בדיקת הנגעים' : 'עמוד לפני הכהן'}</h2></div><div id="condChip" class="cond-chip"></div></div><div id="examBody"></div>`;
    app.examUI = app.role === 'k' ? mountExamK($('#examBody'), ctx) : mountExamM($('#examBody'), ctx);
  }
  const bad = examConditions(S);
  $('#condChip').innerHTML = `השעה ${HOUR_NAMES[S.hour]}${isCloudy(S) ? ' · מעונן' : ''} · ${esc(PLACES[S.loc.m].name)}`;
  $('#condChip').classList.toggle('warn', bad.length > 0);
  app.examUI.update();
}

function renderInspect() {
  const S = app.S;
  const open = S.basket.brought && !S.f.basketOk;
  const isOpen = currentSheet() === 'inspect' || currentSheet() === 'waiting';
  if (!open) { if (isOpen) closeSheet(); app.inspectUI = null; return; }
  if (isOpen) { app.inspectUI?.update(); return; }
  if (app.role === 'k') {
    const sh = openSheet({ id: 'inspect', title: 'הסל שלפניך', kicker: 'בדיקת הכהן', wide: true, body: '' });
    app.inspectUI = mountInspect(sh.body, ctx);
  } else {
    openSheet({ id: 'waiting', title: 'הסל לפני הכהן', kicker: 'המתן', body: '<p class="intro-text">הנחת את הסל לפני הכהן. הוא עובר על כל דבר שבו. אם ימצא פסול, יחזיר לך את הסל.</p>' });
  }
}

function renderFinish() {
  const S = app.S;
  if (!S.f.basketOk || currentSheet() === 'finish') return;
  if ($('.finish-done')) return;
  const t = Math.floor(((S.finishedAt || Date.now()) - S.startedAt) / 1000) + S.penalty * 60;
  const sh = openSheet({ id: 'finish', title: 'סוף החדר הראשון', kicker: 'מחוץ לחומה', parchment: true,
    body: `<div class="finish-done"><p class="intro-text">הכהן ראה ופסק "טהור". הצפרים, הארז, השני והאזוב מוכנים, והמים החיים בכלי החרס החדש. בחדר הבא: סדר הטהרה עצמו, השחיטה, ההזאה ושילוח הצפור אל פני השדה.</p>
    <dl class="stats"><div><dt>זמן</dt><dd>${Math.floor(t / 60)} דקות</dd></div><div><dt>תוספת על טעויות</dt><dd>${S.penalty} דקות</dd></div><div><dt>פרוטות שנותרו</dt><dd>${S.coins}</dd></div></dl></div>` });
  sh.el.classList.add('finish');
}

// ------------------------------------------------------------------ lobby art
function lobbySkyline() {
  return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
    <defs><linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16203f"/><stop offset="0.6" stop-color="#6d4a63"/><stop offset="1" stop-color="#e59a62"/></linearGradient>
    <radialGradient id="lsun"><stop offset="0" stop-color="#ffd59a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="600" fill="url(#lsky)"/>
    <circle cx="300" cy="470" r="260" fill="url(#lsun)"/><circle cx="300" cy="470" r="40" fill="#ffd59a"/>
    <path d="M0 470 C200 440 400 460 600 430 C800 410 1000 440 1200 420 C1400 400 1500 430 1600 420 L1600 600 L0 600 Z" fill="#3c2f4a"/>
    <path d="M700 420 L700 360 ${Array.from({ length: 40 }, (_, i) => `L${700 + i * 20} ${i % 2 ? 360 : 350} L${700 + i * 20 + 10} ${i % 2 ? 350 : 360}`).join(' ')} L1500 360 L1500 440 L700 440 Z" fill="#2b2238"/>
    <rect x="1180" y="250" width="60" height="110" fill="#2b2238"/><rect x="1164" y="262" width="92" height="98" fill="#2b2238"/>
    <rect x="1196" y="288" width="28" height="72" fill="#c99a4a" opacity="0.9"/>
    <path d="M0 520 C300 500 600 520 900 500 C1200 486 1400 510 1600 500 L1600 600 L0 600 Z" fill="#1d1726"/>
  </svg>`;
}

if (location.hash === '#debug') window.__machane = { act, state: () => app.S, app };
boot();
