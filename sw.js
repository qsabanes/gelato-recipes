// Service worker: network-first with cache fallback (offline support).
const CACHE = 'gelato-v2';
const LANGS = ['es', 'ca', 'en'];
const CORE = [
  './', './index.html', './styles.css', './app.js', './calc.js', './analysis.js',
  './i18n.js', './recipes.json', './manifest.webmanifest', './vendor/marked.min.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(u => c.add(u)));
    try {
      const list = await (await fetch('./recipes.json')).json();
      const urls = [];
      list.forEach(x => LANGS.forEach(l => urls.push('./recipes/' + l + '/' + x.file)));
      await Promise.allSettled(urls.map(u => c.add(u)));  // missing translations just fail silently
    } catch (err) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return caches.match('./index.html');
      throw err;
    }
  })());
});
