// Game server for "מחוץ למחנה".
// Serves the built game and keeps each room's shared state.
// No dependencies: plain Node.js 18+, Server-Sent Events for live updates.
//
//   PORT=8080 node server/server.mjs
//
// API
//   GET  /api/health                 -> { ok: true }
//   GET  /api/games/:code            -> state or 404
//   POST /api/games/:code            -> create a room   (body: state)
//   POST /api/games/:code/patch      -> merge a patch   (body: patch)
//   GET  /api/games/:code/events     -> SSE stream of the full state after every change

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'dist');
const DATA_DIR = process.env.DATA_DIR || join(ROOT, 'data');
const DATA_FILE = join(DATA_DIR, 'games.json');
const PORT = Number(process.env.PORT || 8080);
const ROOM_TTL_MS = Number(process.env.ROOM_TTL_HOURS || 48) * 3600 * 1000;
const MAX_BODY = 256 * 1024;
const CODE_RE = /^[A-Z0-9]{4}$/;

const games = new Map();     // code -> { state, touched }
const streams = new Map();   // code -> Set<res>

// ------------------------------------------------------------------ persistence
async function load() {
  try {
    const raw = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    for (const [code, g] of Object.entries(raw)) games.set(code, g);
    console.log(`loaded ${games.size} rooms`);
  } catch { /* first run */ }
}
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await mkdir(DATA_DIR, { recursive: true });
      const tmp = DATA_FILE + '.tmp';
      await writeFile(tmp, JSON.stringify(Object.fromEntries(games)));
      await rename(tmp, DATA_FILE);
    } catch (e) { console.error('save failed', e); }
  }, 1500);
}
setInterval(() => {
  const now = Date.now();
  for (const [code, g] of games) if (now - g.touched > ROOM_TTL_MS && !streams.get(code)?.size) games.delete(code);
  scheduleSave();
}, 3600 * 1000).unref();

// ------------------------------------------------------------------ state
function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

function broadcast(code) {
  const g = games.get(code); const set = streams.get(code);
  if (!g || !set) return;
  const msg = `data: ${JSON.stringify(g.state)}\n\n`;
  for (const res of set) res.write(msg);
}

// ------------------------------------------------------------------ http helpers
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, path) {
  const rel = normalize(decodeURIComponent(path)).replace(/^([/\\])+/, '');
  let file = join(PUBLIC, rel || 'index.html');
  if (!file.startsWith(PUBLIC)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(file) || file.endsWith('/') || !extname(file)) file = join(PUBLIC, 'index.html');
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    res.end(data);
  } catch { send(res, 404, { error: 'not found' }); }
}

// ------------------------------------------------------------------ routes
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (parts[0] !== 'api') return serveStatic(req, res, url.pathname);
    if (parts[1] === 'health') return send(res, 200, { ok: true });
    if (parts[1] !== 'games' || !CODE_RE.test(parts[2] || '')) return send(res, 404, { error: 'not found' });
    const code = parts[2];

    if (parts.length === 3 && req.method === 'GET') {
      const g = games.get(code);
      return g ? send(res, 200, g.state) : send(res, 404, { error: 'no such room' });
    }
    if (parts.length === 3 && req.method === 'POST') {
      if (games.has(code)) return send(res, 409, { error: 'room exists' });
      const state = await readBody(req);
      games.set(code, { state, touched: Date.now() });
      scheduleSave(); broadcast(code);
      return send(res, 201, state);
    }
    if (parts[3] === 'patch' && req.method === 'POST') {
      const g = games.get(code);
      if (!g) return send(res, 404, { error: 'no such room' });
      const patch = await readBody(req);
      g.state = deepMerge(g.state, patch); g.touched = Date.now();
      scheduleSave(); broadcast(code);
      return send(res, 200, { ok: true });
    }
    if (parts[3] === 'events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 2000\n\n');
      if (!streams.has(code)) streams.set(code, new Set());
      streams.get(code).add(res);
      const g = games.get(code); if (g) res.write(`data: ${JSON.stringify(g.state)}\n\n`);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => { clearInterval(ping); streams.get(code)?.delete(res); });
      return;
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    send(res, 400, { error: 'bad request' });
  }
});

await load();
server.listen(PORT, () => console.log(`מחוץ למחנה: http://localhost:${PORT}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => {
  clearTimeout(saveTimer);
  try { await mkdir(DATA_DIR, { recursive: true }); await writeFile(DATA_FILE, JSON.stringify(Object.fromEntries(games))); } catch { /* ignore */ }
  process.exit(0);
});
