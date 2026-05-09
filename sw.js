const cacheName = 'malaeb-net-v1.52'; // تحديث النسخة
const assets = [
  './',
  './index.html',
  './register.html',
  './booking.html',
  './style.css',
  './script.js',
  './logo_no_background.png'
];

// ... (أكواد install و activate تبقى كما هي) ...

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. استثناء بيانات جوجل (الشبكة دائماً)
  if (url.href.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 2. معالجة طلبات التنقل (الروابط)
  if (e.request.mode === 'navigate') {
    
    // أ - إذا كان الرابط هو رابط المنصة الأساسي (التسجيل)
    // نتحقق من المسار بدقة لضمان عدم حدوث تداخل
    if (url.pathname.endsWith('/stadium-platform-v2/') || url.pathname.endsWith('/index.html')) {
      e.respondWith(
        fetch(e.request).catch(() => caches.match('./index.html'))
      );
      return;
    }

    // ب - إذا كان الرابط يحتوي على معرف ملعب (ID)
    if (url.searchParams.has('id')) {
      e.respondWith(
        fetch(e.request).catch(() => caches.match('./booking.html') || caches.match('./index.html'))
      );
      return;
    }

    // ج - لأي صفحة أخرى مثل register.html
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }

  // 3. الملفات الثابتة
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

// ... (بقية الكود الخاص بالإشعارات) ...
