const cacheName = 'bouassel-v1.16'; // ارفع النسخة لـ 1.3 لضمان التغيير
const assets = [
  '/bouassel/',
  '/bouassel/index.html',
  '/bouassel/style.css',
  '/bouassel/script.js',
  '/bouassel/logo-512.png'
];

// 1. التثبيت وتحميل الملفات الجديدة
self.addEventListener('install', e => {
  self.skipWaiting(); // إجبار السيرفس وركر الجديد على التفعيل فوراً
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
  return self.clients.claim(); // السيطرة على الصفحة فوراً بدون انتظار إعادة التشغيل
});

// 3. استراتيجية "الشبكة أولاً" للملفات الأساسية لضمان التحديث
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
// --- الجزء الخاص بالتعامل مع الإشعارات ---

// 1. الاستماع لحدث الضغط على التنبيه
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // إغلاق التنبيه عند الضغط عليه

    // فتح الموقع أو التركيز عليه إذا كان مفتوحاً بالفعل
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/bouassel/'); // تأكد من المسار الصحيح لموقعك
            }
        })
    );
});

// 2. تحديث الكاش تلقائياً عند وجود نسخة جديدة (اختياري لكن مفيد)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
