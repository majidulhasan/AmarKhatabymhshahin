const CACHE_NAME = 'amar-khata-v7.0';

const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              const url = new URL(event.request.url);
              // শুধুমাত্র http/https রিকোয়েস্ট ক্যাশ করা হবে
              if (url.protocol.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            } catch (e) {
              // ইনভ্যালিড ইউআরএল আসলে ইগনোর করবে
            }
          });
        }
        return networkResponse;
      }).catch(() => {
        // পুরোপুরি অফলাইন থাকলে index.html ফেরত দেবে
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});