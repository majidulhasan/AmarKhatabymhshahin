const CACHE_NAME = 'amar-khata-offline-v2';

const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

// ইনস্টলেশন পর্যায়ে সব ফাইল সেভ করা
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// পুরনো ক্যাশ ডিলিট করা
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

// নেটওয়ার্ক রিকোয়েস্ট হ্যান্ডেল করা (অফলাইন ফার্স্ট)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // যদি ক্যাশে থাকে, তবে ইন্টারনেট ছাড়াই রিটার্ন করবে
      if (cachedResponse) {
        return cachedResponse;
      }

      // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনা এবং ভবিষ্যতে ব্যবহারের জন্য সেভ করা
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // শুধুমাত্র নিজস্ব অরিজিন এবং এক্সটার্নাল লাইব্রেরি ক্যাশ করা
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // একদম অফলাইন এবং ক্যাশেও নেই এমন অবস্থায় index.html দেওয়া
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});