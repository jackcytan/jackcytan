/* Service worker Tân AI Academy – tự sinh bởi build-sw.js */
const CACHE = 'tanai-b41a0d57a4';
const ASSETS = ['./', 'app.js', 'audio.js', 'cert.js', 'data.js', 'fonts.css', 'fonts/BeVietnamPro-latin-547cf24c.woff2', 'fonts/BeVietnamPro-latin-69d9dcc5.woff2', 'fonts/BeVietnamPro-latin-7a47fb1a.woff2', 'fonts/BeVietnamPro-latin-d75069f5.woff2', 'fonts/BeVietnamPro-latin-ext-07ce562c.woff2', 'fonts/BeVietnamPro-latin-ext-c955ba1b.woff2', 'fonts/BeVietnamPro-latin-ext-d1bf288f.woff2', 'fonts/BeVietnamPro-latin-ext-d6869224.woff2', 'fonts/BeVietnamPro-vietnamese-1721a3cf.woff2', 'fonts/BeVietnamPro-vietnamese-380779d1.woff2', 'fonts/BeVietnamPro-vietnamese-cdc31dd4.woff2', 'fonts/BeVietnamPro-vietnamese-e7f3e552.woff2', 'fonts/Cinzel-latin-63551c15.woff2', 'fonts/Cinzel-latin-ext-53a6c326.woff2', 'fonts/GreatVibes-latin-1402a25d.woff2', 'fonts/GreatVibes-latin-ext-e5a62ade.woff2', 'fonts/GreatVibes-vietnamese-2e1cb454.woff2', 'fonts/PlayfairDisplay-latin-48d1e9cd.woff2', 'fonts/PlayfairDisplay-latin-88e14a8d.woff2', 'fonts/PlayfairDisplay-latin-ext-4136269b.woff2', 'fonts/PlayfairDisplay-latin-ext-616b8920.woff2', 'fonts/PlayfairDisplay-vietnamese-2ac5e2f2.woff2', 'fonts/PlayfairDisplay-vietnamese-a2cb8729.woff2', 'icons/apple-touch-icon.png', 'icons/drabuff-logo-gold.png', 'icons/drabuff-logo-white.png', 'icons/drabuff-mark-gold.png', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'index.html', 'manifest.webmanifest', 'styles.css', 'vendor/qrcode.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./', c)); return r; }).catch(() => caches.match('./', { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
});
