// Service Worker - 公車快到了 v3
const CACHE = 'bus-alert-v3';
const STATIC = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('tdx.transportdata.tw')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});

// Handle messages from main thread
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'INIT') {
    e.ports?.[0]?.postMessage({ type: 'ACK' });
  }

  // Bus alert notification — used when app is in background
  if (e.data.type === 'BUS_ALERT') {
    const { title, body, requireInteraction } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-72.png',
      vibrate: requireInteraction
        ? [200, 100, 200, 100, 400]
        : [300, 100, 300],
      tag: 'bus-alert',
      renotify: true,
      requireInteraction: !!requireInteraction,
      data: { url: './' },
    }).catch(() => {});
  }
});

// Tap notification → bring app to focus
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
