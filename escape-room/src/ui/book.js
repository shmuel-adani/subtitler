// The kohen's book, laid out like a page of a printed Mishnah:
// the source in square letters in the centre, the commentary around it in Rashi script.

import { BOOK, SHADES, SHADE_ORDER } from '../content.js';
import { certOrder } from '../logic.js';
import { swatchCanvas } from '../art/textures.js';
import { esc, openSheet } from './dom.js';

export function openBook(ctx, startPage) {
  const S = ctx.state();
  const pages = BOOK.filter((p) => !p.unlock || S.f[p.unlock]);
  let cur = Math.max(0, pages.findIndex((p) => p.id === startPage));
  const sheet = openSheet({ id: 'book', title: 'ספר הנגעים', kicker: 'בידי הכהן', wide: true, parchment: true, body: '' });

  const render = () => {
    const S2 = ctx.state();
    const page = pages[cur];
    sheet.body.innerHTML = `
      <nav class="book-tabs" role="tablist">${pages.map((p, i) => `<button role="tab" class="book-tab ${i === cur ? 'on' : ''}" data-i="${i}" aria-selected="${i === cur}">${esc(p.tab)}</button>`).join('')}</nav>
      <article class="folio">
        <div class="folio-title"><span class="folio-num">${'אבגדהוזח'[cur]}</span><h3>${esc(page.title)}</h3></div>
        <div class="folio-grid">
          <div class="folio-source">${page.source.map((s) => `<p class="src-text">${esc(s.text)}</p><p class="src-ref">${esc(s.ref)}</p>`).join('')}</div>
          <aside class="folio-rashi"><span class="dibbur">פירוש.</span> ${esc(page.commentary)}</aside>
        </div>
        ${page.swatches ? `<div class="swatches">${SHADE_ORDER.map((k) => `<figure class="sw" data-shade="${k}"><div class="sw-c"></div><figcaption><b>${esc(SHADES[k].name)}</b><span>${esc(SHADES[k].like)}</span><small>${esc(SHADES[k].note)}</small></figcaption></figure>`).join('')}</div>` : ''}
        ${page.exam ? examBlock(S2) : ''}
        ${page.command ? commandBlock(S2) : ''}
      </article>`;
    sheet.body.querySelectorAll('.book-tab').forEach((b) => b.addEventListener('click', () => { cur = Number(b.dataset.i); render(); }));
    sheet.body.querySelectorAll('.sw').forEach((f, i) => f.querySelector('.sw-c').appendChild(swatchCanvas(f.dataset.shade, 132, 300 + i)));
    if (page.exam) wireExam(sheet.body, ctx);
    const cmd = sheet.body.querySelector('#cmdBtn');
    if (cmd) cmd.addEventListener('click', () => ctx.act('command'));
  };
  render();
  sheet.el._rerender = render;
  return sheet;
}

function examBlock(S) {
  if (S.f.certified) return `<div class="cert done"><b>עמדת במבחן.</b> אתה בקי במראות ובשמותיהם, ורשאי לצאת אל המצורע.</div>`;
  const order = certOrder(S.cert.seed);
  const locked = Date.now() < S.cert.lockUntil;
  return `<section class="cert">
    <h4>מבחן המראות</h4>
    <p class="cert-lead">לפניך שש דוגמאות, ושתיים מהן ממראה אחד. כתוב את שמו של כל מראה. רק מי שמזהה את כולן יוצא אל המצורע.</p>
    <div class="cert-grid">${order.map((_, i) => `<label class="cert-item"><div class="cert-sw" data-i="${i}"></div>
      <select id="cert-${i}" class="sel"><option value="">בחר שם…</option>${SHADE_ORDER.map((k) => `<option value="${k}">${esc(SHADES[k].name)} · ${esc(SHADES[k].like)}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="cert-actions"><button class="btn gold" id="certGo" ${locked ? 'disabled' : ''}>${locked ? 'עיין שוב בספר…' : 'הגש את המבחן'}</button></div>
  </section>`;
}

function wireExam(root, ctx) {
  const S = ctx.state();
  if (S.f.certified) return;
  const order = certOrder(S.cert.seed);
  root.querySelectorAll('.cert-sw').forEach((d) => {
    const i = Number(d.dataset.i);
    d.appendChild(swatchCanvas(order[i], 116, S.cert.seed + i * 13 + 1));
  });
  const go = root.querySelector('#certGo');
  if (!go) return;
  go.addEventListener('click', () => {
    const answers = order.map((_, i) => root.querySelector('#cert-' + i).value);
    if (answers.some((a) => !a)) { ctx.toast('יש לבחור שם לכל אחת מן הדוגמאות.'); return; }
    ctx.act('certify', { answers, order });
  });
}

function commandBlock(S) {
  if (S.f.commanded) return `<div class="cert done"><b>ציווית.</b> המצורע הולך אל הרוכל. כשיביא אליך את הסל, בדוק את כל מה שבו.</div>`;
  return `<div class="cert"><p class="cert-lead">כשתלמד את הדינים, צוה את המצורע. מאותה שעה הרוכל ימכור לו.</p>
    <div class="cert-actions"><button class="btn gold" id="cmdBtn">"וְצִוָּה הַכֹּהֵן וְלָקַח"</button></div></div>`;
}
