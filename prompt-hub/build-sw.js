// Tạo sw.js với danh sách file cần lưu offline. Chạy: node build-sw.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dir = __dirname, skip = new Set(['sw.js', 'build-sw.js', '_headers', 'HUONG-DAN.txt']);
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), r = path.relative(dir, p).split(path.sep).join('/'); if (fs.statSync(p).isDirectory()) walk(p); else if (!skip.has(r) && !r.startsWith('_') && !r.startsWith('functions/') && !r.endsWith('.zip')) files.push(r); } })(dir);
files.sort();
const h = crypto.createHash('sha1'); files.forEach(f => h.update(f).update(fs.readFileSync(path.join(dir, f))));
const ver = h.digest('hex').slice(0, 10);
const sw = `/* Service worker Drabuff Prompt Hub – tự sinh bởi build-sw.js */
const CACHE = 'dbprompt-${ver}';
const ASSETS = ['./', ${files.map(f => "'" + f + "'").join(', ')}];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./', c)); return r; }).catch(() => caches.match('./', { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
});
`;
fs.writeFileSync(path.join(dir, 'sw.js'), sw);
console.log('sw.js', ver, files.length, 'files');
