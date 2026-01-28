const CACHE_NAME = 'amar-khata-v5.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// Install Event: মূল ফাইলগুলো ক্যাশ করা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: পুরাতন ক্যাশ ডিলিট করা
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

// Fetch Event: নেটওয়ার্ক ফেইল করলে ক্যাশ থেকে দেওয়া
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // ব্যাকগ্রাউন্ডে আপডেট চেক করা (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        // esm.sh বা অন্য এক্সটার্নাল লাইব্রেরি হলে ক্যাশে রাখা
        if (url.origin.includes('esm.sh') || url.origin.includes('tailwindcss.com') || url.origin.includes('fonts.gstatic.com')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // অফলাইনে থাকলে index.html ফেরত দেওয়া
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('./index.html');
        }
      });
    })
  );
});