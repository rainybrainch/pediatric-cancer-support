const CACHE = 'vitalia-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/quest.html',
  '/nutrition.html',
  '/research.html',
  '/ai-coach/index.html',
  '/image/runa-2-Photoroom.png',
  '/image/kaito-2-Photoroom.png',
  '/image/sera-2-Photoroom.png',
  '/image/pikuse-Photoroom.png',
  '/image/runa-1-Photoroom.png',
  '/image/kaito-1-Photoroom.png',
  '/image/sera-1-Photoroom.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase / Google Fonts はネットワーク優先
  if (e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic') ||
      e.request.url.includes('udify.app')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // それ以外はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
