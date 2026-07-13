const CACHE_NAME = 'roshni-v1';

// App shell files — these load the app even with no internet
const APP_SHELL = [
  '/',
  '/index.html',
  '/home',
  '/resources',
  '/books',
  '/qna',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
];

//  Install  cache app shell 
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Roshni SW: caching app shell');
      // Use individual adds so one failure doesn't block the rest
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => {
          console.warn(`Roshni SW: could not cache ${url}`);
        }))
      );
    })
  );
  self.skipWaiting();
});

//  Activate  clean up old caches 
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log(`Roshni SW: deleting old cache ${key}`);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

//  Fetch  network first, fall back to cache 
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls never cache those
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('cloudinary.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache fresh responses
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed  serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If navigating to a page and no cache  serve index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ── Push Notifications 
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

// When notification is clicked — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || '/';
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});