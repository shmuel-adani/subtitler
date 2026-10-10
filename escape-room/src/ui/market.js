// The peddler's stall, the spring, and the kohen's inspection of the basket.
import { CATEGORIES, ITEMS, WATER } from '../content.js';
import { ART } from '../art/items.js';
import { esc } from './dom.js';

const itemById = (cat, id) => (ITEMS[cat] || []).find((x) => x.id === id);
const letters = 'אבגדהו';

function card(cat, it, i, selected, clickable = true) {
  return `<button class="item ${selected ? 'sel' : ''}" data-cat="${cat}" data-id="${it.id}" ${clickable ? '' : 'disabled'} aria-pressed="${selected}">
    <span class="item-letter">${letters[i]}</span>
    <span class="item-art">${ART[cat](it.art)}</span>
    <span class="item-name">${esc(it.label)}</span>
    <ul class="item-facts">${it.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  </button>`;
}

export function mountMarket(root, ctx) {
  let tab = 'birds';
  function draw() {
    const S = ctx.state(); const b = S.basket;
    const has = (cat, id) => (cat === 'birds' ? b.birds.includes(id) : b[cat] === id);
    const count = (cat) => (cat === 'birds' ? b.birds.length : b[cat] ? 1 : 0);
    const locked = !S.f.commanded;
    root.innerHTML = `<div class="market">
      ${locked ? `<div class="notice">הרוכל פורש את סחורתו, אבל לא ימכור לך עד שהכהן יצווה. אתה רשאי להסתכל.</div>` : ''}
      <nav class="cat-tabs">${CATEGORIES.map((c) => `<button class="cat ${c.id === tab ? 'on' : ''}" data-tab="${c.id}">${esc(c.name)}<span class="cnt">${count(c.id)}/${c.pick}</span></button>`).join('')}</nav>
      <p class="cat-lead">${tab === 'birds' ? 'בחר שתיים.' : 'בחר אחד.'} הסחורה גלויה לפניך; הדין כתוב בספר שבידי הכהן.</p>
      <div class="items">${ITEMS[tab].map((it, i) => card(tab, it, i, has(tab, it.id), !b.brought)).join('')}</div>
      <footer class="basket-bar">${basketSummary(S)}</footer>
    </div>`;
    root.querySelectorAll('.cat').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; draw(); }));
    root.querySelectorAll('.item').forEach((el) => el.addEventListener('click', () => ctx.act('pick', { cat: el.dataset.cat, id: el.dataset.id })));
  }
  draw();
  return { update: draw };
}

export function basketSummary(S) {
  const b = S.basket;
  const parts = [
    ['צפרים', b.birds.length ? `${b.birds.length} מתוך 2` : ''],
    ['ארז', b.cedar ? '✓' : ''], ['שני', b.wool ? '✓' : ''], ['אזוב', b.hyssop ? '✓' : ''],
    ['כלי', b.vessel ? '✓' : ''], ['מים', b.water && b.measure ? '✓' : ''],
  ];
  return `<div class="basket"><span class="basket-title">בסל</span>${parts.map(([n, v]) => `<span class="bk ${v ? 'has' : ''}">${n}${v && v !== '✓' ? ` ${v}` : ''}</span>`).join('')}<span class="coins" title="פרוטות">${S.coins} פרוטות</span></div>`;
}

export function mountSpring(root, ctx, preset) {
  let source = preset || '';
  function draw() {
    const S = ctx.state(); const b = S.basket;
    if (!source) source = b.water || '';
    const vessel = b.vessel ? itemById('vessel', b.vessel) : null;
    root.innerHTML = `<div class="spring-ui">
      ${!vessel ? '<div class="notice">אין בידך כלי. קנה כלי אצל הרוכל, ואז רד אל המים.</div>' : `<div class="vessel-in-hand"><span class="item-art sm">${ART.vessel(vessel.art)}</span><span>בידך: ${esc(vessel.label)}, ${esc(vessel.facts[1])}</span></div>`}
      <h4>מאיזה מים</h4>
      <div class="choices">${WATER.sources.map((w) => `<button class="choice ${source === w.id ? 'on' : ''}" data-src="${w.id}"><b>${esc(w.name)}</b><span>${esc(w.facts[0])}</span></button>`).join('')}</div>
      <h4>כמה מים</h4>
      <div class="choices measures">${WATER.measures.map((m) => `<button class="choice ${b.measure === m.id && b.water === source ? 'on' : ''}" data-m="${m.id}" ${vessel && source ? '' : 'disabled'}><b>${esc(m.name)}</b></button>`).join('')}</div>
      ${b.water && b.measure ? `<p class="filled">בכלי יש ${esc(WATER.measures.find((m) => m.id === b.measure).name)} של ${esc(WATER.sources.find((w) => w.id === b.water).name)}.</p>` : ''}
      <footer class="basket-bar">${basketSummary(S)}</footer>
    </div>`;
    root.querySelectorAll('[data-src]').forEach((el) => el.addEventListener('click', () => { source = el.dataset.src; draw(); }));
    root.querySelectorAll('[data-m]').forEach((el) => el.addEventListener('click', () => ctx.act('fill', { source, measure: el.dataset.m })));
  }
  draw();
  return { update: draw, setSource(s) { source = s; draw(); } };
}

// The kohen sees everything in the basket only when it is set before him.
export function mountInspect(root, ctx) {
  function draw() {
    const S = ctx.state(); const b = S.basket;
    const rows = [
      ...b.birds.map((id) => ['birds', itemById('birds', id)]),
      ['cedar', itemById('cedar', b.cedar)], ['wool', itemById('wool', b.wool)],
      ['hyssop', itemById('hyssop', b.hyssop)], ['vessel', itemById('vessel', b.vessel)],
    ].filter(([, it]) => it);
    const water = WATER.sources.find((w) => w.id === b.water), m = WATER.measures.find((x) => x.id === b.measure);
    root.innerHTML = `<div class="inspect">
      <p class="cat-lead">המצורע הניח לפניך את הסל. עבור על כל דבר, ופסוק על כולו יחד. אם תאשר צירוף פסול, הכסף שהוציא אבד.</p>
      <div class="items">${rows.map(([cat, it], i) => card(cat, it, i, false, false)).join('')}
        <div class="item water-card" aria-disabled="true"><span class="item-name">מים בכלי</span><ul class="item-facts"><li>${esc(water?.name || '')}</li><li>${esc(water?.facts[0] || '')}</li><li>כמות: ${esc(m?.name || '')}</li></ul></div></div>
      <div class="verdict-btns center"><button class="btn gold" id="approve">כשר. אני מאשר</button><button class="btn ghost" id="giveBack">החזר לו את הסל</button></div>
    </div>`;
    root.querySelector('#approve').addEventListener('click', () => ctx.act('approve'));
    root.querySelector('#giveBack').addEventListener('click', () => ctx.act('giveBack'));
  }
  draw();
  return { update: draw };
}
