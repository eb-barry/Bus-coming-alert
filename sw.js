// Service Worker - Bus Alert App
const CACHE_NAME = 'bus-alert-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let TDX API calls pass through (no cache)
  if (url.hostname.includes('tdx.transportdata.tw')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Receive messages from main thread to keep alive
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    event.ports[0]?.postMessage({ type: 'ACK' });
  }
  if (event.data && event.data.type === 'BUS_ALERT') {
    // Show push notification when app is backgrounded
    const { busNo, stopName, stopsAway } = event.data;
    const title = stopsAway === 0 ? `🚌 ${busNo}路已到站！` : `⚠️ ${busNo}路快到了！`;
    const body = stopsAway === 0
      ? `${busNo}路公車已抵達「${stopName}」，請立刻上車！`
      : `${busNo}路公車距離「${stopName}」還有 ${stopsAway} 站`;

    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-72.png',
      vibrate: stopsAway === 0 ? [200, 100, 200, 100, 400] : [300, 100, 300],
      tag: `bus-${busNo}`,
      renotify: true,
      requireInteraction: stopsAway === 0,
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('./');
    })
  );
});
