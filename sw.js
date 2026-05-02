const cacheName = 'malaeb-net-v1.13'; // تم تحديث النسخة
const assets = [
  './',
  './index.html',
  './register.html',
  './style.css',
  './script.js',
  './logo_no_background.png'
];

// 1. التثبيت وتحميل الملفات الأساسية
self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. تفعيل النسخة الجديدة وحذف القديمة
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

// 3. استراتيجية جلب البيانات (Fetch)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // تحديث هام: إذا كان الطلب موجهاً لـ Google Apps Script (جلب بيانات الملاعب والحجوزات)
  // نستخدم الشبكة دائماً لضمان عدم تداخل بيانات ملعب مع آخر بسبب الكاش
  if (url.href.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // إذا كان الرابط يخص صفحة التسجيل، نطلبها مباشرة من الشبكة
  if (url.pathname.includes('register.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./register.html'))
    );
    return;
  }

  // للملفات الثابتة (CSS, JS, Images) نستخدم الكاش إذا لم تتوفر الشبكة
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

// --- الجزء الخاص بالإشعارات ---

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); 

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // محاولة إيجاد نافذة مفتوحة للموقع
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // إذا كانت هناك نافذة مفتوحة، نركز عليها
                if (client.url.includes('id=') && 'focus' in client) {
                    return client.focus();
                }
            }
            // إذا لم تكن هناك نافذة، نفتح الموقع (الرابط الرئيسي سيتولى التوجيه بناءً على الذاكرة)
            if (clients.openWindow) {
                return clients.openWindow('./'); 
            }
        })
    );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
