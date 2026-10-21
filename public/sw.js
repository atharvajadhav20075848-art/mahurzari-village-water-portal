// Self-destroying Service Worker: Unregisters immediately and NEVER intercepts requests
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      self.registration.unregister()
    ])
  );
});

// IMPORTANT: No 'fetch' listener!
// When there is no fetch listener, the browser handles all network requests directly,
// eliminating white screens on normal reloads completely.
