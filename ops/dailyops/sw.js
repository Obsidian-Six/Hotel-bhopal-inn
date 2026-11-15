// Daily Ops service worker: keeps the app working without internet.
const CACHE = 'daily-ops-v7';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const offlineJson = () => new Response(JSON.stringify({ error: 'You are offline', offline: true }), {
  status: 503, headers: { 'Content-Type': 'application/json' },
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('/api.php')) {
    const a = url.searchParams.get('a');
    if (a === 'photo') {
      // photos never change: cache first
      e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => offlineJson())));
      return;
    }
    // login state is never cached; the app remembers it itself
    if (a === 'me') { e.respondWith(fetch(req).catch(() => offlineJson())); return; }
    // data: try network, fall back to the last copy
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || offlineJson())));
    return;
  }

  // app files: always try the network first so updates show immediately; use the saved copy only when offline
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true })).then(hit => hit || caches.match('index.html'))));
});
