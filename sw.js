const CACHE_NAME = 'amar-khata-v3.1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// Install: প্রয়োজনীয় ফাইল ক্যাশে রাখা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching shell assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: পুরাতন ক্যাশ পরিষ্কার করা
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: অফলাইন সাপোর্ট এবং ডাইনামিক ক্যাশিং
self.addEventListener('fetch', (event) => {
  // শুধুমাত্র GET রিকোয়েস্ট ক্যাশ করা হবে
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // যদি ক্যাশে থাকে, তবে সেটিই ফেরত দাও
      if (cachedResponse) {
        // ব্যাকগ্রাউন্ডে নেটওয়ার্ক থেকে আপডেট চেক করো (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        
        return cachedResponse;
      }

      // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনো এবং ক্যাশে রাখো
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !event.request.url.includes('esm.sh') && !event.request.url.includes('cdn.tailwindcss.com')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // অফলাইনে থাকলে এবং ক্যাশে না থাকলে index.html ফেরত দাও (SPA এর জন্য)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});