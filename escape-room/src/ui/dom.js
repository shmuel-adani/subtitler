export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer = 0;
export function toast(text, { tone = '', src = '' } = {}) {
  const el = $('#toast');
  el.className = 'toast show ' + tone;
  el.innerHTML = `<div class="toast-text">${esc(text)}</div>${src ? `<div class="toast-src">${esc(src)}</div>` : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, src ? 6500 : 4200);
}

// A sheet slides over the scene. Only one at a time.
export function openSheet({ id, title, kicker = '', body, wide = false, parchment = false, onClose }) {
  closeSheet(true);
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.dataset.sheet = id;
  wrap.innerHTML = `<div class="sheet ${wide ? 'wide' : ''} ${parchment ? 'parchment' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="sheet-head"><div>${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ''}<h2>${esc(title)}</h2></div>
    <button class="icon-btn close" aria-label="סגור">✕</button></header>
    <div class="sheet-body"></div></div>`;
  const bodyEl = wrap.querySelector('.sheet-body');
  if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => closeSheet();
  wrap.querySelector('.close').addEventListener('click', close);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  wrap._onClose = onClose;
  return { el: wrap, body: bodyEl, close };
}

export function closeSheet(instant) {
  const w = $('.sheet-wrap');
  if (!w) return;
  const cb = w._onClose;
  if (instant) w.remove();
  else { w.classList.remove('open'); setTimeout(() => w.remove(), 260); }
  cb && cb();
}

export const currentSheet = () => $('.sheet-wrap')?.dataset.sheet || '';

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
