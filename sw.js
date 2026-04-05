// Service Worker - 公車快到了 v4
// Uses reg.showNotification() — reliable in foreground AND background on iOS PWA + Android
const CACHE = 'bus-alert-v5';  // bumped: new icons
const STATIC = [
  './', './index.html', './manifest.json', './sw.js',
  './apple-touch-icon.png',
  './icon-180.png', './icon-192.png', './icon-512.png',
  './icon-152.png', './icon-144.png', './icon-167.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never cache TDX API calls
  if (url.hostname.includes('tdx.transportdata.tw')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});

// Handle messages from main thread
// Note: main thread now calls reg.showNotification() directly,
// so this handler is only needed for legacy postMessage path
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'INIT') {
    e.ports?.[0]?.postMessage({ type: 'ACK' });
  }

  // Legacy path — kept for compatibility
  if (e.data.type === 'BUS_ALERT') {
    const { title, body, requireInteraction } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-72.png',
      vibrate: requireInteraction ? [200, 100, 200, 100, 400] : [300, 100, 300],
      tag: 'bus-alert',
      renotify: true,
      requireInteraction: !!requireInteraction,
      silent: false,
    }).catch(() => {});
  }
});

// Tap notification → bring app to front
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const focused = list.find(c => c.focused);
      if (focused) return focused.focus();
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
