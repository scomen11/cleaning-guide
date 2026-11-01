// Pages and code: network first (so a fix arrives on the next open), cache if offline or slow.
// Fonts and images: cache first. Bump VERSION when shipping changes so old caches are cleared.
const VERSION = 'v8';
const CACHE = `cleaning-guide-${VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'search.js',
  'data.js',
  'stt.js',
  'stt-worker.js',
  'manifest.webmanifest',
  'fonts/gilda-display.woff2',
  'fonts/lora.woff2',
  'fonts/lora-italic.woff2',
  'icons/clean-goose-art.webp',
  'icons/icon-maskable-512.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // Only our own old versions: the speech model's caches must survive updates.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cleaning-guide-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const CODE = /\.(html|js|css|webmanifest)$|\/$/;
// The speech library and its WebAssembly come from a CDN at pinned versions, so they never
// change: keep them for offline use. (The model files are cached by the library itself.)
const CDN_CACHE = 'speech-cdn-v1';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(CDN_CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true })
        || (req.mode === 'navigate' ? await cache.match('index.html') : undefined);
      const fresh = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (!cached) return fresh.then((res) => res || Response.error());
      if (!CODE.test(url.pathname) && req.mode !== 'navigate') { e.waitUntil(fresh); return cached; }
      // Give the network a few seconds; a slow or missing connection falls back to the cache.
      const timeout = new Promise((done) => setTimeout(() => done(null), 3000));
      return (await Promise.race([fresh, timeout])) || cached;
    }),
  );
});
