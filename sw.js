const cacheName = 'malaeb-net-v1.17'; // تم تحديث النسخة لضمان تفعيل التعديلات
const assets = [
  './',
  './index.html',
  './register.html',
  './booking.html', // تأكد من إضافة صفحة الحجز للكاش
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

// 3. استراتيجية جلب البيانات (Fetch) - النسخة المحدثة لحل تداخل الروابط
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // أ- استثناء بيانات جوجل (الشبكة دائماً) لضمان بيانات ملاعب وحجوزات حية
  if (url.href.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ب- معالجة طلبات التنقل (Navigate) لمنع تداخل الصفحات
  if (e.request.mode === 'navigate') {
    // إذا كان الرابط هو الجذر أو index.html وبدون معطيات ID، فهو حتماً صفحة التسجيل
    if ((url.pathname.endsWith('/') || url.pathname.includes('index.html')) && !url.searchParams.has('id')) {
        e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
        return;
    }
    
    // إذا كان الرابط يحتوي على ID، نتركه يذهب لصفحة الحجز الخاصة به من الشبكة أولاً
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) || caches.match('./booking.html'))
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
