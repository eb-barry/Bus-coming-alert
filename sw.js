// Service Worker - 公車快到了 v4
// Uses reg.showNotification() — reliable in foreground AND background on iOS PWA + Android
const CACHE = 'bus-alert-v20';  // route card location layout, disable text callout
const STATIC = [
  './', './index.html', './manifest.json', './sw.js',
  './header-banner.png',
  './apple-touch-icon.png',
  './icon-180.png', './icon-192.png', './icon-512.png',
  './icon-152.png', './icon-144.png', './icon-167.png',
];

self.addEventListener('install', e => {
  // One missing icon must not block the new shell from installing.
  e.waitUntil(caches.open(CACHE).then(cache =>
    Promise.all(STATIC.map(url => cache.add(url).catch(() => {})))
  ));
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

function isAppShell(url, request) {
  if (request.mode === 'navigate') return true;
  const path = url.pathname;
  return path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/manifest.json');
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never cache TDX API calls
  if (url.hostname.includes('tdx.transportdata.tw')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Leave sw.js to the browser update check. Caching it here freezes the app on the old release.
  if (url.origin === self.location.origin && url.pathname.endsWith('/sw.js')) return;

  if (url.origin === self.location.origin && isAppShell(url, e.request)) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(e.request))
          || (await caches.match('./index.html'))
          || new Response('離線', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
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
