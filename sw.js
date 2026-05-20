// Service Worker — ヴィタリア転生録
// 戦略：
//   - Static (HTML/JS/CSS/画像)：stale-while-revalidate（オフラインでもUIが動く）
//   - API (/api/*)：network-only（リアルタイム性重視）
//   - Firebase / Gemini：network-first with offline fallback
//   - 同期キュー：Background Sync で再送

const CACHE_VERSION = 'vitalia-v8';
const RUNTIME_CACHE = 'vitalia-runtime-v8';

// 必須プリキャッシュ（最低限の起動アセット）
const PRECACHE_URLS = [
  './',
  './game.html',
  './quest.html',
  './nutrition.html',
  './adventure.html',
  './adventure-map.html',
  './settings.html',
  './account.html',
  './journal.html',
  './party.html',
  './class-select.html',
  './baseline.html',
  './weekly-survey.html',
  './milestone-survey.html',
  './collection.html',
  './skills.html',
  './shop.html',
  './novel.html',
  './support.html',
  './privacy.html',
  './faq.html',
  './app-safety.js',
  './gamification.js',
  './quest-enhance.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

// インストール時：プリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // プリキャッシュ失敗時もインストールは継続
      await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(u).catch(()=>null)));
      await self.skipWaiting();
    })()
  );
});

// アクティベート：旧キャッシュ削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// メッセージ：手動でキャッシュクリアやSWスキップ
self.addEventListener('message', (e) => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if(e.data && e.data.type === 'CLEAR_CACHE'){
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});

// fetch ハンドラ
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // GET 以外はパススルー
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // /api/* は常にネットワーク（オフライン時は失敗 → クライアント側のキューに回る）
  if(url.pathname.startsWith('/api/')){
    event.respondWith(
      fetch(req).catch(() => new Response(
        JSON.stringify({ error: 'オフラインです。ネットワーク接続を確認してください。', offline: true }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // Firebase / Google APIs：network-first
  if(url.hostname.includes('googleapis.com') ||
     url.hostname.includes('gstatic.com') ||
     url.hostname.includes('firebase')){
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 動画・大きな画像：cache-first（一度落としたら再ダウンロードしない）
  if(/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)){
    event.respondWith(cacheFirst(req));
    return;
  }

  // HTML：stale-while-revalidate（古いキャッシュをまず返し、裏で更新）
  if(req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')){
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // その他（JS, CSS, 画像など）：stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirst(req){
  const cached = await caches.match(req);
  if(cached) return cached;
  try {
    const res = await fetch(req);
    if(res.ok){
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch(e){
    // 完全にネットワーク失敗：オフラインフォールバック
    return offlineFallback(req);
  }
}

async function staleWhileRevalidate(req){
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then(res => {
    if(res.ok) cache.put(req, res.clone()).catch(()=>{});
    return res;
  }).catch(() => null);
  // キャッシュがあればそれを返し、裏で更新。なければネットワーク待ち。
  return cached || networkPromise || offlineFallback(req);
}

async function offlineFallback(req){
  // HTMLナビゲーションのみ、game.htmlにフォールバック
  if(req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')){
    const fallback = await caches.match('./game.html');
    if(fallback) return fallback;
  }
  return new Response('オフラインです。ネットワークに接続後、もう一度お試しください。', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// ========== Background Sync API ==========
// クライアント側で navigator.serviceWorker.ready.then(reg => reg.sync.register('flush-queue'))
// を呼ぶと、オンライン復帰時にこの sync イベントが発火します
self.addEventListener('sync', (event) => {
  if(event.tag === 'flush-queue'){
    event.waitUntil(notifyClientsToFlush());
  }
});

async function notifyClientsToFlush(){
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for(const client of clients){
    client.postMessage({ type: 'FLUSH_QUEUE' });
  }
}

// ========== Push 通知 ==========
self.addEventListener('push', (event) => {
  let payload = { title: 'ヴィタリア転生録', body: 'お知らせがあります', icon: './icon.svg' };
  try { if(event.data) payload = { ...payload, ...event.data.json() }; } catch(e){}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.icon,
      tag: payload.tag || 'general',
      data: payload.data || {},
      vibrate: [80, 40, 80],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './game.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for(const client of clients){
        if('focus' in client) return client.focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
