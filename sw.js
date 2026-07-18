// Service worker: offline shell + WhatsApp/Share-Target handling.
const CACHE = 'subtitler-v3';
const SHELL = ['.', 'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== 'shared').map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Incoming share from WhatsApp (or any app): POST to ./share with a video file.
  if (e.request.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      try {
        const form = await e.request.formData();
        const file = form.get('video');
        if (file && file.size) {
          const cache = await caches.open('shared');
          await cache.put('shared-media', new Response(file, {
            headers: {
              'Content-Type': file.type || 'video/mp4',
              'X-Filename': encodeURIComponent(file.name || 'whatsapp-video.mp4')
            }
          }));
        }
      } catch (err) { /* ignore, still redirect */ }
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }

  // Cache-first for same-origin GET (offline shell). Network for the rest (CDN, Gemini).
  if (e.request.method === 'GET' && url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
