/* Service worker Drabuff Z-LAB – tự sinh bởi build-sw.js */
const CACHE = 'zlab-d99fc12186';
const ASSETS = ['./', 'app.js', 'data/codex.js', 'data/strains.js', 'fonts.css', 'fonts/BeVietnamPro-latin-547cf24c.woff2', 'fonts/BeVietnamPro-latin-7a47fb1a.woff2', 'fonts/BeVietnamPro-latin-871510e5.woff2', 'fonts/BeVietnamPro-latin-d75069f5.woff2', 'fonts/BeVietnamPro-latin-ext-07ce562c.woff2', 'fonts/BeVietnamPro-latin-ext-c955ba1b.woff2', 'fonts/BeVietnamPro-latin-ext-d1bf288f.woff2', 'fonts/BeVietnamPro-latin-ext-dc8e6f8b.woff2', 'fonts/BeVietnamPro-vietnamese-1721a3cf.woff2', 'fonts/BeVietnamPro-vietnamese-380779d1.woff2', 'fonts/BeVietnamPro-vietnamese-af367be1.woff2', 'fonts/BeVietnamPro-vietnamese-cdc31dd4.woff2', 'fonts/ChakraPetch-latin-4e4bf6c9.woff2', 'fonts/ChakraPetch-latin-e05b4890.woff2', 'fonts/ChakraPetch-latin-e309d545.woff2', 'fonts/ChakraPetch-latin-ext-2479b991.woff2', 'fonts/ChakraPetch-latin-ext-33d09326.woff2', 'fonts/ChakraPetch-latin-ext-865e19f1.woff2', 'fonts/ChakraPetch-vietnamese-0387a3e8.woff2', 'fonts/ChakraPetch-vietnamese-935f95e7.woff2', 'fonts/ChakraPetch-vietnamese-9603c1af.woff2', 'fonts/GrenzeGotisch-latin-c017479e.woff2', 'fonts/GrenzeGotisch-latin-ext-993873b4.woff2', 'fonts/GrenzeGotisch-vietnamese-cbb65a3f.woff2', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'index.html', 'lab3d.js', 'manifest.webmanifest', 'styles.css', 'vendor/three.min.js', 'zaudio.js', 'zlab.css'];
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
