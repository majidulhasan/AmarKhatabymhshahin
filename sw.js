const CACHE_NAME = 'amar-khata-v9.0';

// লোকাল সব ফাইল যা অফলাইনে দরকার
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './storage.ts',
  './constants.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// Install: ফাইলগুলো ক্যাশে জমা করা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching essential assets...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: পুরাতন ক্যাশ ডিলিট করা
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

// Fetch: ক্যাশ-ফার্স্ট কৌশল (যাতে ইন্টারনেট না থাকলেও ফাইল পায়)
self.addEventListener('fetch', (event) => {
  // শুধুমাত্র GET রিকোয়েস্ট হ্যান্ডেল করবে
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // যদি ক্যাশে থাকে, তবে সেটিই ফেরত দাও
      if (cachedResponse) {
        return cachedResponse;
      }

      // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনো এবং সাথে সাথে ক্যাশে সেভ করো
      return fetch(event.request).then((networkResponse) => {
        // রিকোয়েস্ট সফল হলে ক্যাশে জমা রাখো (ভবিষ্যতে অফলাইনের জন্য)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              const url = new URL(event.request.url);
              if (url.protocol.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            } catch (e) {}
          });
        }
        return networkResponse;
      }).catch(() => {
        // নেটওয়ার্ক ফেইল করলে এবং ক্যাশে না থাকলে fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});