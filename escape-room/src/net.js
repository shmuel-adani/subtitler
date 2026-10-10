// Shared game state between the two players.
// Two transports with one interface: the claude.ai artifact database (online, live),
// and a local fallback (BroadcastChannel + localStorage) for two tabs in one browser.
// The production server will be a third transport with the same interface.

export function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);

export async function connect() {
  let db = null;
  try {
    if (window.claude && typeof window.claude.use === 'function') db = await withTimeout(window.claude.use('db'), 7000);
  } catch (e) { db = null; }
  return db ? dbTransport(db) : localTransport();
}

// ------------------------------------------------------------------ online
function dbTransport(db) {
  const ref = (code) => db.doc('games/' + code);
  let inflight = Promise.resolve();
  return {
    kind: 'online',
    async load(code) {
      const snap = await ref(code).get();
      return snap.exists ? snap.data() : null;
    },
    async create(code, state) { await ref(code).set(state); },
    subscribe(code, cb, onErr) {
      return ref(code).onSnapshot((snap) => { if (snap.exists) cb(snap.data()); }, (e) => onErr && onErr(e));
    },
    patch(code, patch) {
      // One write at a time per document, as the store asks.
      inflight = inflight.then(() => ref(code).update(patch)).catch((e) => {
        if (e && e.code === 'unavailable') return new Promise((r) => setTimeout(r, 600)).then(() => ref(code).update(patch));
        throw e;
      });
      return inflight;
    },
  };
}

// ------------------------------------------------------------------ local
function localTransport() {
  const key = (code) => 'machane-game-' + code;
  let chan = null;
  try { chan = new BroadcastChannel('machane'); } catch (e) { chan = null; }
  const read = (code) => { try { return JSON.parse(localStorage.getItem(key(code)) || 'null'); } catch (e) { return null; } };
  const write = (code, s) => { try { localStorage.setItem(key(code), JSON.stringify(s)); } catch (e) { /* storage blocked */ } };
  const memory = {};
  const subs = new Set();
  const notify = (code, s) => subs.forEach((f) => f.code === code && f.cb(s));
  if (chan) chan.onmessage = (e) => { if (e.data?.code) { memory[e.data.code] = e.data.state; notify(e.data.code, e.data.state); } };
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('machane-game-') && e.newValue) {
      const code = e.key.slice(13); try { const s = JSON.parse(e.newValue); memory[code] = s; notify(code, s); } catch (x) { /* ignore */ }
    }
  });
  return {
    kind: 'local',
    async load(code) { return memory[code] || read(code); },
    async create(code, state) { memory[code] = state; write(code, state); chan && chan.postMessage({ code, state }); notify(code, state); },
    subscribe(code, cb) {
      const entry = { code, cb }; subs.add(entry);
      const s = memory[code] || read(code); if (s) setTimeout(() => cb(s), 0);
      return () => subs.delete(entry);
    },
    async patch(code, patch) {
      const next = deepMerge(memory[code] || read(code) || {}, patch);
      memory[code] = next; write(code, next); chan && chan.postMessage({ code, state: next }); notify(code, next);
    },
  };
}

export function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export function playerId() {
  try {
    let id = sessionStorage.getItem('machane-pid');
    if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('machane-pid', id); }
    return id;
  } catch (e) { return Math.random().toString(36).slice(2, 10); }
}
