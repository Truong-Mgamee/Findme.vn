/* Findme service worker: app-shell cache for installability + offline fallback. Network-first for navigations,
 * stale-while-revalidate for same-origin static assets. API calls (/api/) are never cached. */
const VERSION = 'findme-v1';
const OFFLINE_URLS = ['/vi/offline', '/en/offline', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(OFFLINE_URLS).catch(() => undefined)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const locale = url.pathname.split('/')[1] === 'en' ? 'en' : 'vi';
          return (await caches.match(`/${locale}/offline`)) || Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            caches.open(VERSION).then((c) => c.put(req, res.clone())).catch(() => undefined);
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
