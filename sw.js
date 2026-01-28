const CACHE_NAME = 'amar-khata-v6.0';

// শুধুমাত্র অত্যাবশ্যকীয় ফাইলগুলো শুরুতে ক্যাশ করা হবে
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching core assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  // শুধুমাত্র GET রিকোয়েস্ট ক্যাশ করা হবে
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // যদি ক্যাশে থাকে তবে সেটি আগে দেখাও (Stale-While-Revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // যদি নেটওয়ার্ক থেকে সফলভাবে ডাটা আসে তবে সেটি ক্যাশে আপডেট করো
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // একই অরিজিন অথবা পরিচিত CDN হলে ক্যাশ করো
            if (url.origin === self.location.origin || 
                url.origin.includes('esm.sh') || 
                url.origin.includes('tailwindcss.com') || 
                url.origin.includes('gstatic.com')) {
              cache.put(event.request, responseToCache);
            }
          });
        }
        return networkResponse;
      }).catch(() => {
        // নেটওয়ার্ক ফেইল করলে এবং ক্যাশে না থাকলে fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});