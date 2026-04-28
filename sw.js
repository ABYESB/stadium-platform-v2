const cacheName = 'malaeb-net-v1.7'; // تم رفع النسخة وتغيير الاسم
const assets = [
  './',
  './index.html',
  './register.html',
  './style.css',
  './script.js',
  './logo_no_background.png'
];

// 1. التثبيت وتحميل الملفات الجديدة
self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. تفعيل النسخة الجديدة وحذف القديمة تماماً
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName)
            .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim(); 
});

// 3. استراتيجية "الشبكة أولاً" مع حل مشكلة تداخل صفحة التسجيل
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // إذا كان الرابط يخص صفحة التسجيل، نطلبها مباشرة من الشبكة
  if (url.pathname.includes('register.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./register.html'))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

// --- الجزء الخاص بالتعامل مع الإشعارات ---

// 1. الاستماع لحدث الضغط على التنبيه
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); 

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // تم تعديل الرابط ليتوافق مع ملاعب net
                if (client.url.includes('malaeb-net') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./'); 
            }
        })
    );
});

// 2. تحديث الكاش تلقائياً عند وجود نسخة جديدة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
