const cacheName = 'malaeb-net-v1.22'; // تم تحديث النسخة لضمان تفعيل التعديلات البرمجية
const assets = [
  './',
  './index.html',
  './register.html',
  './booking.html',
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

// 3. استراتيجية جلب البيانات (Fetch) - النسخة المحدثة لضمان استقلالية الملاعب
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // أ- استثناء بيانات جوجل (الشبكة دائماً)
  if (url.href.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ب- معالجة طلبات التنقل (Navigate)
  if (e.request.mode === 'navigate') {
    // إذا كان الرابط يحتوي على id (ملعب معين)، نعطيه الأولوية للشبكة لضمان التحديث
    // وإذا فشل (أوفلاين) نعطيه نسخة الكاش من صفحة الحجز
    if (url.searchParams.has('id')) {
      e.respondWith(
        fetch(e.request).catch(() => caches.match('./index.html') || caches.match('./booking.html'))
      );
      return;
    }

    // إذا كان الرابط الرئيسي (التسجيل)
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ج- للملفات الثابتة الأخرى (CSS, JS, الصور)
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

// --- الجزء الخاص بالإشعارات ---
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); 

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.includes('id=') && 'focus' in client) {
                    return client.focus();
                }
            }
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
