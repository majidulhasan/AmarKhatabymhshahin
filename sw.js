const CACHE_NAME = 'amar-khata-v8.0';

// অত্যাবশ্যকীয় ফাইল যা অফলাইনে কাজ করার জন্য দরকার
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// Install: ফাইলগুলো ক্যাশে জমা করা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching logic started');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: পুরাতন ভার্সন ডিলিট করা
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

// Fetch: ক্যাশ-ফার্স্ট কৌশল (অফলাইনের জন্য সেরা)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  
  // ক্যাশে আছে কিনা চেক করা
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // ক্যাশে থাকলে সেটি ফেরত দাও, কিন্তু ব্যাকগ্রাউন্ডে আপডেট চেক করো
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {}); // অফলাইনে এরর ইগনোর করো
        return cachedResponse;
      }

      // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনো
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            const url = new URL(request.url);
            // শুধুমাত্র http/https এবং প্রয়োজনীয় CDN গুলো ক্যাশ করো
            if (url.protocol.startsWith('http')) {
              cache.put(request, responseToCache);
            }
          } catch (e) {
            console.error('Invalid URL during caching:', request.url);
          }
        });
        return networkResponse;
      }).catch(() => {
        // একদম অফলাইন এবং ক্যাশেও নেই - তখন index.html ফেরত দাও
        if (request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});