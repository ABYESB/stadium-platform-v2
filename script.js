// --- 1. الإعدادات والروابط الأساسية ---

// الرابط الأول: المسؤول عن جلب (اسم الملعب، اللوغو، الأسعار، الموقع)
const settingsScriptURL = 'https://script.google.com/macros/s/AKfycbxnEQvGsfFeu-FY8o0fdF4UxVU7SYrqRJEzpcOnT48xsppkQ4FWsjeNZlUY7uRvyDWz/exec';

// الرابط الثاني: المسؤول عن (جلب الحجوزات القديمة، تلوين المربعات بالأحمر، تسجيل حجز جديد)
const bookingScriptURL = 'https://script.google.com/macros/s/AKfycbxnEQvGsfFeu-FY8o0fdF4UxVU7SYrqRJEzpcOnT48xsppkQ4FWsjeNZlUY7uRvyDWz/exec';

const urlParams = new URLSearchParams(window.location.search);
const stadiumId = urlParams.get('id'); 

let selectedSlots = [];
let currentStartDate = getMonday(new Date());

// 2. جلب تفاصيل الملعب وتحديث الواجهة
async function loadStadiumDynamicDetails() {

    if (!stadiumId) return;

    try {

        const response = await fetch(`${settingsScriptURL}?action=getStadiumDetails&id=${stadiumId}`);

        const data = await response.json();

        

        if (data !== "NotFound") {

           // 1. النصوص الأساسية (مع حماية ضد العناصر المفقودة)
if (data.stadium_name) {
    document.title = "حجز " + data.stadium_name;
    const nameEl = document.getElementById('displayStadiumName');
    if (nameEl) nameEl.innerText = data.stadium_name;
}

const orgEl = document.getElementById('displayOrg');
if (orgEl) orgEl.innerText = "بإشراف: " + (data.org || "");

// 2. حل مشكلة اللوغو
const logoImg = document.getElementById('displayLogo');
if (logoImg) {
    // استخدم الصورة المحلية كقيمة افتراضية صلبة
    const platformLogo = "logo_no_background.png"; 
    
    // فحص الرابط القادم من الداتا (تأكد أنه ليس نص "undefined")
    const hasRemoteLogo = data.logo_url && data.logo_url.trim() !== "" && data.logo_url !== "undefined";
    
    logoImg.src = hasRemoteLogo ? data.logo_url : platformLogo;

    // إضافة معالج خطأ: إذا فشل الرابط الخارجي، عد للصورة المحلية
    logoImg.onerror = function() {
        this.src = platformLogo;
        this.onerror = null; // لمنع الحلقة اللانهائية
    };
}
    
            // 3. تحديث الأسعار والمودال
            if (document.getElementById('modalStadiumName')) {
                document.getElementById('modalStadiumName').innerText = data.stadium_name;
            }
            document.getElementById('displayPriceDay').innerText = data.price_day;
            const nightRow = document.getElementById('nightPriceRow');
            if(data.price_night && nightRow) {
                nightRow.style.display = "block";
                document.getElementById('displayPriceNight').innerText = data.price_night;
            }

            // 4. الواتساب
            window.stadiumPhone = data.phone;
            const whatsappFloat = document.getElementById('whatsappFloat');
            if (whatsappFloat && data.phone) {
                let cleanPhone = data.phone.toString().replace(/\s+/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
                const msg = encodeURIComponent(`السلام عليكم، استفسار عن حجز ${data.stadium_name}`);
                whatsappFloat.href = `https://wa.me/${cleanPhone}?text=${msg}`;
            }
            
            // 5. زر الموقع
            const locBtn = document.getElementById('btnLocation');
            if(locBtn) {
                if (data.location && data.location.trim() !== "" && data.location.startsWith('http')) {
                    locBtn.style.opacity = "1";
                    locBtn.onclick = (e) => {
                        e.preventDefault();
                        window.open(data.location, '_blank');
                    };
                } else {
                    locBtn.style.opacity = "0.5";
                    locBtn.onclick = (e) => {
                        e.preventDefault();
                        alert("عذراً، موقع الملعب غير متوفر حالياً.");
                    };
                }
            }

            // 6. الروابط الاجتماعية
            const handleSocialLink = (id, link) => {
                const el = document.getElementById(id);
                if (el) {
                    if (link && link.trim() !== "" && link !== "#") {
                        el.href = link;
                        el.style.display = "inline-flex";
                    } else {
                        el.style.display = "none";
                    }
                }
            };
            handleSocialLink('fbLink', data.fb);
            handleSocialLink('igLink', data.insta);

            // 7. زر الإيميل
            const emailBtn = document.getElementById('emailLink');
            if (emailBtn) {
                emailBtn.href = "mailto:3dworkben@gmail.com";
                emailBtn.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = "mailto:3dworkben@gmail.com";
                };
            }

            // 9. إصلاح السلايدر
            const swiperWrapper = document.querySelector('.swiper-wrapper');
            if (swiperWrapper) {
                let images = [];
                if (data.img1 && data.img1.trim().startsWith('http')) images.push(data.img1.trim());
                if (data.img2 && data.img2.trim().startsWith('http')) images.push(data.img2.trim());
                if (data.img3 && data.img3.trim().startsWith('http')) images.push(data.img3.trim());

                const defaultImages = [
                    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
                    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
                    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800"
                ];

                const imagesToDisplay = images.length > 0 ? images : defaultImages;
                swiperWrapper.innerHTML = ''; 

                imagesToDisplay.forEach((imgUrl) => {
                    swiperWrapper.innerHTML += `
                        <div class="swiper-slide">
                            <img src="${imgUrl}" 
                                 onerror="this.src='${defaultImages[0]}'"
                                 style="width:100%; height:100%; object-fit:cover; display:block;">
                        </div>`;
                });

                if (window.mySwiper) window.mySwiper.destroy(true, true);
                window.mySwiper = new Swiper('.swiper-container', {
                    loop: true,
                    autoplay: { delay: 3000, disableOnInteraction: false },
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                });
            } // نهاية if (swiperWrapper)
        } // نهاية if (data !== "NotFound")
       // 🚀 أضف هذا الجزء هنا لرفع الستارة وإظهار الصفحة
        const mainContainer = document.querySelector('.app-container');
        if (mainContainer) {
            mainContainer.style.opacity = "1";
            mainContainer.style.visibility = "visible";
        } 
    } catch (error) { 
        console.error("Error loading details:", error); 
    }
} // نهاية الدالة بالكامل loadStadiumDynamicDetails

function initTable() {
    const tableBody = document.getElementById('tableBody');
    const headerRow = document.getElementById('headerRow');
    const footerRow = document.getElementById('footerRow'); 
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (!tableBody || !headerRow) return;

    // تفريغ السطر العلوي والسفلي تمهيداً لملئهما
    headerRow.innerHTML = '<th>الساعة</th>';
    if (footerRow) footerRow.innerHTML = '<th>الساعة</th>';
    
    const daysArr = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    let displayDate = new Date(currentStartDate.getTime());
    dateDisplay.innerText = displayDate.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });

    let currentWeekDates = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDate.getTime());
        d.setDate(d.getDate() + i); 
        
        let fullDate = getFormattedDate(d);
        currentWeekDates.push({name: daysArr[i], date: fullDate, rawDate: d}); 
        
        let cellContent = `${daysArr[i]}<br><small>${d.getDate()}</small>`;
        
        // إضافة اليوم والتاريخ للسطر العلوي والسفلي معاً
        headerRow.innerHTML += `<th>${cellContent}</th>`;
        if (footerRow) footerRow.innerHTML += `<th>${cellContent}</th>`;
    }

    const now = new Date();
    let allRowsHtml = ''; // متغير جديد لتجميع كل الصفوف بدلاً من مسح الجدول فوراً

    for (let hour = 8; hour <= 23; hour++) {
        let hLabel24 = `${hour}:00`; 
        let currentH = hour > 12 ? hour - 12 : hour;
        let nextH = (hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1);
        
        if (hour === 12) currentH = 12;
        if ((hour + 1) === 12) nextH = 12;
        if (hour === 0) currentH = 12;

        let suffix = (hour >= 12) ? "م" : "ص";
        let hLabelRange = `${currentH} إلى ${nextH} ${suffix}`; 

        let row = `<tr><td style="background:#f8fafc; font-weight:bold; white-space: nowrap; font-size: 0.85rem; padding: 5px; border: 1px solid #ddd;">${hLabelRange}</td>`;
        
        for (let day = 0; day < 7; day++) {
            let slotTime = new Date(currentWeekDates[day].rawDate.getTime());
            slotTime.setHours(hour, 0, 0, 0);

            if (slotTime < now) {
                row += `<td class="slot past" 
                            data-date="${currentWeekDates[day].date.trim()}" 
                            data-hour="${hLabel24}" 
                            style="background-color: #f1f5f9; color: #cbd5e1; cursor: not-allowed; pointer-events: none; font-size: 0.8rem; border: 1px solid #ddd;">منتهي</td>`;
            } else {
                row += `<td class="slot" 
                            style="background-color: #ffffff; cursor: pointer; border: 1px solid #ddd;"
                            data-date="${currentWeekDates[day].date.trim()}" 
                            data-day="${currentWeekDates[day].name}" 
                            data-hour="${hLabel24}" 
                            onclick="handleSlotSelection(this)">متاح</td>`;
            }
        }
        row += `</tr>`;
        allRowsHtml += row; // تجميع الصفوف هنا
    }
    
    // التحديث الفعلي للجدول يتم مرة واحدة فقط في النهاية لمنع الوميض الأبيض
    tableBody.innerHTML = allRowsHtml;
    
    loadExistingBookings(); 
}
function getFormattedDate(date) {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// 4. الدوال المساعدة (يجب وجودها ليعمل الجدول)
function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function handleSlotSelection(element) {
    // 1. منع اختيار المربعات المحجوزة أو المنتهية
    if (element.innerText === "محجوز" || element.classList.contains("booked") || element.classList.contains("past")) return; 

    const isAlreadySelected = element.classList.contains('selected');
    const date = element.getAttribute('data-date');
    const hour = element.getAttribute('data-hour');
    const dayName = element.getAttribute('data-day');

    if (!isAlreadySelected) {
        // حماية: منع حجز أكثر من ساعتين
        if (selectedSlots.length >= 2) {
            alert("⚠️ عذراً، لا يمكن حجز أكثر من ساعتين متتاليتين.");
            return;
        }
        // حماية: التأكد أن الساعات متتالية وفي نفس اليوم
        if (selectedSlots.length === 1) {
            const firstSlot = selectedSlots[0];
            const firstHour = parseInt(firstSlot.hour.split(':')[0]);
            const currentHour = parseInt(hour.split(':')[0]);

            if (Math.abs(currentHour - firstHour) !== 1 || date !== firstSlot.date) {
                alert("⚠️ عذراً، يجب اختيار ساعات متتالية وفي نفس اليوم.");
                return;
            }
        }
    }

    // تفعيل/إلغاء اختيار المربع (تغيير بصري فوري وسلس)
    element.classList.toggle('selected');

    if (element.classList.contains('selected')) {
        selectedSlots.push({ hour, date, element, dayName }); 
        document.getElementById('bookingModal').style.display = "block";
        
        // --- منطق ذكاء زر الساعة الإضافية بناءً على حالة الجدول الحالية ---
        const extraBtn = document.getElementById('extraSlotContainer');
        if (selectedSlots.length === 1) {
            let nextH = (parseInt(hour.split(':')[0]) + 1) + ":00";
            let nextSlot = document.querySelector(`[data-date="${date}"][data-hour="${nextH}"]`);
            
            // يظهر الزر فقط إذا كانت الساعة التالية متاحة حالياً في الجدول
            if (nextSlot && !nextSlot.classList.contains('booked') && !nextSlot.classList.contains('past')) {
                extraBtn.style.display = "block";
            } else {
                extraBtn.style.display = "none";
            }
        } else {
            extraBtn.style.display = "none";
        }
    } else {
        selectedSlots = selectedSlots.filter(s => s.element !== element);
        if (selectedSlots.length === 0) {
            document.getElementById('bookingModal').style.display = "none";
        }
    }
    updateModalDetails(); 
}
function updateModalDetails() {
    const detailsText = document.getElementById('selectedDetails');
    if (!detailsText || selectedSlots.length === 0) return;

    // ترتيب الساعات المختارة تصاعدياً
    const sortedSlots = [...selectedSlots].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    const date = sortedSlots[0].date;
    const hours = sortedSlots.map(s => s.hour).join(" و ");

    detailsText.innerText = `الموعد: يوم ${date} | الساعة: ${hours}`;
}

async function submitFinalBooking() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    
    if (!name || !phone) return alert("يرجى إدخال الاسم ورقم الهاتف.");

    // إظهار رسالة انتظار
    const btn = document.getElementById('finalConfirmBtn');
    const originalText = btn.innerText;
    btn.innerText = "جاري التأكد والحجز... ⏳";
    btn.disabled = true;

    try {
        // نستخدم حلقة تكرار لمعالجة الساعات واحدة تلو الأخرى للتأكد من خلوها في الشيت
        for (const slot of selectedSlots) {
            // ملاحظة: أزلنا mode: 'no-cors' لنتمكن من قراءة رد الشيت (هل الساعة محجوزة أم لا)
            const response = await fetch(bookingScriptURL, {
                method: 'POST',
                body: JSON.stringify({
                    stadiumId: stadiumId,
                    dayName: slot.dayName,
                    date: slot.date,
                    hour: slot.hour,
                    name: name,
                    phone: phone
                })
            });

            const result = await response.json();

            // إذا كان الرد من الشيت يخبرنا بأن الساعة محجوزة بالفعل
            if (result.result === "error") {
                alert("⚠️ " + result.message); // سيعرض رسالة: عذراً، تم حجز هذا الوقت!
                initTable(); // تحديث الجدول فوراً لإظهار الحجوزات الحقيقية
                closeBookingModal();
                return; // التوقف فوراً ومنع إكمال العملية
            }
        }

        // --- إذا وصلنا هنا، يعني أن جميع الساعات تم حجزها بنجاح في الشيت ---
        selectedSlots.forEach(slot => {
            if (slot.element) {
                slot.element.classList.remove('selected');
                slot.element.classList.add('booked');
                slot.element.innerText = "محجوز";
                slot.element.style.backgroundColor = "#ef4444"; // اللون الأحمر
                slot.element.style.color = "white";
                slot.element.style.pointerEvents = "none";
                slot.element.onclick = null;

                // تفعيل جدولة التنبيهات للساعة المحجوزة
                scheduleNotification(slot.date, slot.hour);
            }
        });

        alert("✅ تم الحجز بنجاح!");
        
        // إغلاق النافذة وتنظيف المختار
        closeBookingModal();
        
        // تحديث البيانات في الخلفية بدون مسح الجدول
        loadExistingBookings();

    } catch (error) {
        // في حالة وجود قيود CORS من جوجل، سيتم الحجز في الشيت لكن المتصفح قد يظهر خطأ
        // لذا نقوم بتحديث الجدول للتأكد من الحالة النهائية
        console.error("Error:", error);
        alert("تنبيه: يرجى التحقق من الجدول للتأكد من حالة الحجز النهائية.");
        initTable();
        closeBookingModal();
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = "none";

    // تنظيف الحقول
    document.getElementById('userName').value = "";
    document.getElementById('userPhone').value = "";
    const checkbox = document.getElementById('confirmCheckbox');
    if (checkbox) checkbox.checked = false;

    // إزالة تحديد المربعات الخضراء (فقط التي لم يتم حجزها)
    selectedSlots.forEach(s => {
        if (s.element && !s.element.classList.contains('booked')) {
            s.element.classList.remove('selected');
        }
    });
    
    selectedSlots = [];
    
    // تحديث حالة زر التأكيد
    if (typeof toggleSubmitButton === "function") toggleSubmitButton();
}

function toggleSubmitButton() {
    const checkbox = document.getElementById('confirmCheckbox');
    const btn = document.getElementById('finalConfirmBtn');
    if (checkbox && btn) {
        btn.disabled = !checkbox.checked;
        btn.style.opacity = checkbox.checked ? "1" : "0.5";
    }
}

function toggleRules() {
    const modal = document.getElementById('rulesModal');
    if(modal) modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

function changeWeek(direction) {
    currentStartDate.setDate(currentStartDate.getDate() + (direction * 7));
    initTable();
}

function loadExistingBookings() {
    // 1. البحث عن أي سكريبت جلب بيانات قديم تم إنشاؤه سابقاً
    const oldScript = document.getElementById('dataFetchScript');
    
    // 2. إذا وجد سكريبت قديم، قم بحذفه فوراً لتنظيف الذاكرة
    if (oldScript) {
        oldScript.remove();
    }

    // 3. إنشاء عنصر سكريبت جديد
    const script = document.createElement('script');
    
    // 4. إعطاؤه معرف (ID) ثابت لكي نستطيع حذفه في المرة القادمة
    script.id = 'dataFetchScript'; 
    
    // 5. ربط المصدر بالرابط الخاص بك مع إضافة بصمة زمنية لمنع التخزين المؤقت (Cache)
    script.src = `${bookingScriptURL}?action=getBookings&id=${stadiumId}&callback=handleData&t=${new Date().getTime()}`;
    
    // 6. إضافة السكريبت إلى الصفحة لبدء جلب البيانات
    document.body.appendChild(script);
}

function handleData(bookings) {
    if (!Array.isArray(bookings)) return;
    
    bookings.forEach(b => {
        // نبحث عن المربع الذي يطابق التاريخ والساعة القادمين من الشيت
        const slot = document.querySelector(`[data-date="${b.date}"][data-hour="${b.hour}"]`);
        
        if (slot) {
            slot.innerText = "محجوز";
            slot.classList.add("booked"); // أضف كلاس للتصميم
            slot.style.backgroundColor = "#ef4444"; // لون أحمر
            slot.style.color = "white";
            slot.style.pointerEvents = "none"; // منع الضغط عليه
            slot.onclick = null; // إزالة وظيفة الضغط تماماً
        }
    });
}

// التشغيل
document.addEventListener('DOMContentLoaded', async () => {
    // 1. إخفاء حاوية المحتوى الرئيسية فوراً لضمان عدم ظهور نصوص افتراضية
    // (تأكد أن المحتوى محاط بـ div لديه كلاس container أو غيره للاسم الصحيح عندك)
    const mainContainer = document.querySelector('.container');
    if (mainContainer) mainContainer.style.opacity = '0';

    try {
        // 2. جلب تفاصيل الملعب (الاسم، اللوغو، السعر)
        await loadStadiumDynamicDetails();
        
        // 3. بناء الجدول وتحميل الحجوزات
        if (typeof initTable === "function") {
            await initTable();
        }

        // 4. إظهار المحتوى بسلاسة بعد اكتمال كل شيء
        if (mainContainer) {
            mainContainer.style.transition = 'opacity 0.4s ease-in-out';
            mainContainer.style.opacity = '1';
        }

        // 5. إخفاء شاشة التحميل (إذا كنت قد أضفت الـ Loader الذي اقترحته لك)
        const loader = document.getElementById('loadingScreen');
        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error("حدث خطأ أثناء تحميل البيانات:", error);
        // في حال حدوث خطأ، نظهر المحتوى على أي حال لكي لا تبقى الشاشة بيضاء
        if (mainContainer) mainContainer.style.opacity = '1';
    }
});

// إغلاق المودالات عند الضغط خارجها (ابقِ عليه كما هو، فهو صحيح)
window.onclick = function(event) {
    const bookingModal = document.getElementById('bookingModal');
    const rulesModal = document.getElementById('rulesModal');
    if (event.target == bookingModal) closeBookingModal();
    if (event.target == rulesModal) toggleRules();
}

function addNextSlot() {
    if (selectedSlots.length >= 1) {
        const lastSlot = selectedSlots[0];
        let nextH = (parseInt(lastSlot.hour.split(':')[0]) + 1) + ":00";
        let nextSlotElement = document.querySelector(`[data-date="${lastSlot.date}"][data-hour="${nextH}"]`);
        
        if (nextSlotElement) {
            handleSlotSelection(nextSlotElement); // اختر الساعة التالية برمجياً
            updateModalDetails();
        }
    }
}
// --- تحديث الجدول تلقائياً كل 15 ثانية ---
setInterval(() => {
    // نقوم بالتحديث فقط إذا كان المستخدم لا يملأ حالياً بيانات الحجز
    const modal = document.getElementById('bookingModal');
    if (modal && modal.style.display !== "block") {
        console.log("جاري تحديث الحجوزات تلقائياً...");
        if (typeof loadExistingBookings === "function") loadExistingBookings();
    }
}, 15000);

async function scheduleNotification(bookingDate, bookingHour) {
    if (!("Notification" in window)) {
        console.log("هذا المتصفح لا يدعم التنبيهات.");
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const [day, month, year] = bookingDate.split('/');
    const [hour] = bookingHour.split(':');
    const playTime = new Date(year, month - 1, day, parseInt(hour), 0, 0);
    const now = new Date();

    navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("✅ تم الحجز بنجاح", {
            body: `موعدك في يوم ${bookingDate} الساعة ${bookingHour}. ننتظرك!`,
            icon: "logo_no_background.png",
            badge: "logo_no_background.png",
            vibrate: [100, 50, 100],
            tag: 'booking-confirmed'
        });
    });

    const setReminder = (hoursBefore, message, tag) => {
        const notifyTime = new Date(playTime.getTime() - (hoursBefore * 60 * 60 * 1000));
        if (notifyTime > now) {
            const delay = notifyTime.getTime() - now.getTime();
            setTimeout(() => {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification("⚽ ملاعب NET", {
                        body: message,
                        icon: "logo_no_background.png",
                        badge: "logo_no_background.png",
                        vibrate: [200, 100, 200],
                        tag: tag,
                        requireInteraction: true
                    });
                });
            }, delay);
        }
    };

    setReminder(5, `تذكير: تبقى 5 ساعات على موعد مباراتك (${bookingHour}).`, 'reminder-5h');
    setReminder(1, `عجل يا بطل! تبقى ساعة واحدة فقط على انطلاق المباراة. ننتظرك!`, 'reminder-1h');
}

// --- كود PWA (يجب أن يكون مستقلاً تماماً في الخارج) ---
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installApp');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (installBanner) installBanner.style.display = 'none';
        }
    });
}

window.addEventListener('appinstalled', () => {
    if (installBanner) installBanner.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA was installed');
});
// --- 1. إعدادات المسؤول وحفظ التغييرات ---
async function saveAdminSettings(event) { // تم إضافة event هنا كمعامل
    // التأكد من الحصول على الزر بشكل صحيح سواء من event.target أو event.currentTarget
    const btn = event ? (event.target || event.currentTarget) : null;
    
    if (btn) {
        btn.disabled = true;
        btn.innerText = "جاري الحفظ... ⏳";
    }

    // تجميع البيانات من الحقول التي أنشأتها دالة showSettings
    const params = new URLSearchParams({
        action: "adminUpdateSettings",
        id: stadiumId,
        newPass: document.getElementById('upd_pass').value,
        stadiumName: document.getElementById('upd_name').value,
        pDay: document.getElementById('upd_price_day').value,
        pNight: document.getElementById('upd_price_night').value,
        logo: document.getElementById('upd_logo').value,
        phone: document.getElementById('upd_phone').value,
        fb: document.getElementById('upd_fb').value, // إضافة الفيسبوك
    insta: document.getElementById('upd_insta').value, // إضافة الإنستغرام
        // --- الإضافات الجديدة لصور السلايدر ---
        img1: document.getElementById('upd_img1') ? document.getElementById('upd_img1').value : "",
        img2: document.getElementById('upd_img2') ? document.getElementById('upd_img2').value : "",
        img3: document.getElementById('upd_img3') ? document.getElementById('upd_img3').value : "",
        // ---------------------------------------
        org: document.getElementById('upd_org') ? document.getElementById('upd_org').value : "",
        loc: document.getElementById('upd_loc') ? document.getElementById('upd_loc').value : "",
        fb: document.getElementById('upd_fb') ? document.getElementById('upd_fb').value : "",
        insta: document.getElementById('upd_insta') ? document.getElementById('upd_insta').value : ""
    });

    try {
        // إرسال الطلب إلى Google Apps Script
        const response = await fetch(`${settingsScriptURL}?${params.toString()}`);
        const result = await response.text();

        if (result.trim() === "Success") {
            alert("✅ تم تحديث بيانات الملعب بنجاح! سيتم تحديث الصفحة الآن.");
            location.reload(); // إعادة تحميل لرؤية النتائج فوراً
        } else {
            alert("⚠️ حدث خطأ في السكريبت: " + result);
        }
    } catch (e) {
        console.error("Save Error:", e);
        alert("❌ فشل الاتصال بالسيرفر. تأكد من إعدادات النشر (Deployment) في Google Apps Script.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "حفظ التغييرات";
        }
    }
}
// --- دالة عرض واجهة الإعدادات ---
async function showSettings() {
    const content = document.getElementById('adminSectionContent');
    content.innerHTML = "<p style='text-align:center;'>جاري تحميل الإعدادات الحالية...</p>";

    try {
        // جلب البيانات الحالية للملعب لملء الحقول تلقائياً
        const response = await fetch(`${settingsScriptURL}?action=getStadiumDetails&id=${stadiumId}`);
        const data = await response.json();

        if (data === "NotFound") {
            content.innerHTML = "<p style='color:red;'>تعذر العثور على بيانات الملعب</p>";
            return;
        }

        // بناء نموذج الإعدادات
        let html = `
            <h3>⚙️ إعدادات الملعب</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <label>اسم الملعب:</label>
                <input type="text" id="upd_name" class="admin-input" value="${data.stadium_name}">
                
                <label>اسم المؤسسة/المسؤول:</label>
                <input type="text" id="upd_org" class="admin-input" value="${data.org || ''}">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>سعر النهار:</label>
                        <input type="number" id="upd_price_day" class="admin-input" value="${data.price_day}">
                    </div>
                    <div>
                        <label>سعر الليل:</label>
                        <input type="number" id="upd_price_night" class="admin-input" value="${data.price_night}">
                    </div>
                </div>

                <label>رقم الهاتف (واتساب):</label>
                <input type="text" id="upd_phone" class="admin-input" value="${data.phone}">

                <label>رابط الموقع (Google Maps):</label>
                <input type="text" id="upd_loc" class="admin-input" value="${data.location || ''}">

                <label>رابط اللوجو (URL):</label>
                <input type="text" id="upd_logo" class="admin-input" value="${data.logo_url || ''}">


<label>رابط صورة السلايدر 1:</label>
<input type="text" id="upd_img1" class="admin-input" value="${data.img1 || ''}">

<label>رابط صورة السلايدر 2:</label>
<input type="text" id="upd_img2" class="admin-input" value="${data.img2 || ''}">

<label>رابط صورة السلايدر 3:</label>
<input type="text" id="upd_img3" class="admin-input" value="${data.img3 || ''}">

<label>رابط الفيسبوك (Facebook):</label>
<input type="text" id="upd_fb" class="admin-input" value="${data.fb || ''}" placeholder="https://facebook.com/yourpage">

<label>رابط الإنستغرام (Instagram):</label>
<input type="text" id="upd_insta" class="admin-input" value="${data.insta || ''}" placeholder="https://instagram.com/yourpage">

                <label>كلمة مرور جديدة (اختياري):</label>
                <input type="password" id="upd_pass" class="admin-input" placeholder="اتركه فارغاً للحفاظ على الحالية">

                <button onclick="saveAdminSettings(event)" id="saveBtn" style="background:#22c55e; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; margin-top:10px;">
    حفظ التغييرات
</button>
            </div>
        `;
        content.innerHTML = html;
    } catch (e) {
        content.innerHTML = "<p style='color:red;'>خطأ في الاتصال بالسيرفر</p>";
    }
}
async function showCancellations() {
    const content = document.getElementById('adminSectionContent');
    content.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p>جاري جلب الحجوزات...</p>
            <div class="loader"></div> </div>`;

    try {
        const response = await fetch(`${settingsScriptURL}?action=getAdminBookings&id=${stadiumId}`);
        const bookings = await response.json();

        if (bookings.length === 0) {
            content.innerHTML = `
                <div style="text-align:center; padding:30px; color:#64748b;">
                    <p>📅 لا توجد حجوزات مسجلة حالياً.</p>
                </div>`;
            return;
        }

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#1e293b; font-size:1.1rem;">❌ إلغاء الحجوزات</h3>
                <span style="background:#f1f5f9; padding:2px 10px; border-radius:12px; font-size:0.8rem;">${bookings.length} حجز</span>
            </div>
            
            <div style="overflow-y:auto; max-height:450px; border:1px solid #e2e8f0; border-radius:8px;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.85rem; background:white;">
                    <thead style="position: sticky; top: 0; background:#f8fafc; z-index:10;">
                        <tr>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:right;">اليوم</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">التاريخ</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">الساعة</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:right;">الاسم</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">الهاتف</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>`;

        bookings.forEach(bk => {
            // تحويل التاريخ (dd/MM/yyyy) لاسم اليوم
            const dateParts = bk.date.split("/");
            const dateObj = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
            const dayName = dateObj.toLocaleDateString('ar-MA', { weekday: 'long' });

            html += `
                <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding:10px 8px; font-weight:bold; color:#1e3a8a;">${dayName}</td>
                    <td style="padding:10px 8px; text-align:center; color:#64748b;">${bk.date}</td>
                    <td style="padding:10px 8px; text-align:center; direction:ltr;">${bk.hour}</td>
                    <td style="padding:10px 8px; font-weight:500;">${bk.name}</td>
                    <td style="padding:10px 8px; text-align:center;">
                        <a href="tel:${bk.phone}" style="text-decoration:none; color:#16a34a; font-weight:bold;">
                            ${bk.phone} 📞
                        </a>
                    </td>
                    <td style="padding:10px 8px; text-align:center;">
                        <button onclick="cancelBooking(${bk.row}, this)" 
                                style="background:#fee2e2; color:#ef4444; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:bold; transition:0.3s;">
                            إلغاء
                        </button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
        content.innerHTML = html;

    } catch (e) {
        content.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <p>⚠️ خطأ في جلب البيانات، تأكد من اتصال الإنترنت.</p>
            </div>`;
        console.error("Fetch Error:", e);
    }
}

async function cancelBooking(rowNumber, btn) { // أضفنا btn هنا
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز نهائياً؟")) return;

    // تحسين تجربة المستخدم: تعطيل الزر مؤقتاً
    const originalText = btn ? btn.innerText : "إلغاء";
    if (btn) {
        btn.disabled = true;
        btn.innerText = "...";
    }

    try {
        const response = await fetch(`${settingsScriptURL}?action=cancelBooking&row=${rowNumber}`);
        const result = await response.text();
        
        if (result.trim() === "CancelSuccess") {
            alert("✅ تم إلغاء الحجز بنجاح");
            showCancellations(); // تحديث القائمة فوراً
        } else {
            alert("⚠️ فشل الإلغاء: " + result);
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    } catch (e) {
        alert("❌ خطأ في الاتصال بالسيرفر");
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

// --- 3. عرض البيانات والإحصائيات ---
async function showStats() {
    const content = document.getElementById('adminSectionContent');
    content.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p>جاري تحليل البيانات المالية والزمنية...</p>
            <div class="loader"></div> 
        </div>`;

    try {
        const response = await fetch(`${settingsScriptURL}?action=getStats&id=${stadiumId}`);
        const data = await response.json();
        
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        
        let totalHours = 0;
        let totalIncome = 0;

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#1e293b; font-size:1.1rem;">📊 تقرير السنة المالية ${data.year}</h3>
                <span style="background:#e0f2fe; color:#0369a1; padding:2px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">تحديث تلقائي</span>
            </div>
            
            <div style="overflow-y:auto; max-height:450px; border:1px solid #e2e8f0; border-radius:8px;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.85rem; background:white;">
                    <thead style="position: sticky; top: 0; background:#f8fafc; z-index:10;">
                        <tr>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:right;">الشهر</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">عدد الساعات</th>
                            <th style="padding:12px 8px; border-bottom:2px solid #e2e8f0; text-align:center;">المداخيل (د.م)</th>
                        </tr>
                    </thead>
                    <tbody>`;

        data.monthlyStats.forEach((m, index) => {
            totalHours += m.hours;
            totalIncome += m.income;
            
            // إظهار الشهور التي بها نشاط فقط أو إظهار الكل حسب رغبتك
            // هنا سنظهر الشهور الـ 12 كاملة كما طلبت
            html += `
                <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding:10px 8px; font-weight:bold; color:#475569;">${monthNames[index]}</td>
                    <td style="padding:10px 8px; text-align:center;">${m.hours} ساعة</td>
                    <td style="padding:10px 8px; text-align:center; color:#16a34a; font-weight:bold;">${m.income.toLocaleString()}</td>
                </tr>`;
        });

        html += `
                    </tbody>
                    <tfoot style="position: sticky; bottom: 0; background:#1e3a8a; color:white; font-weight:bold;">
                        <tr>
                            <td style="padding:12px 8px;">المجموع السنوي</td>
                            <td style="padding:12px 8px; text-align:center;">${totalHours} ساعة</td>
                            <td style="padding:12px 8px; text-align:center; font-size:1rem;">${totalIncome.toLocaleString()} د.م</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <p style="font-size:0.7rem; color:#94a3b8; margin-top:10px; text-align:center;">* يتم احتساب المداخيل بناءً على أسعار النهار والليل المحددة في الإعدادات.</p>`;

        content.innerHTML = html;

    } catch (e) {
        content.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <p>⚠️ فشل في تحليل البيانات المالية.</p>
            </div>`;
        console.error("Stats Error:", e);
    }
}

// دالة فتح النافذة - تأكد أن اسمها مطابق لما هو مكتوب في onclick بالـ HTML

// --- 1. دالة فتح نافذة المسؤول ---
function openAdminAuth() {
    const modal = document.getElementById('adminAuthModal');
    if (modal) {
        modal.style.display = 'flex';
        // تجهيز الحقل للكتابة
        const input = document.getElementById('adminPassInput');
        if(input) {
            input.value = '';
            input.focus();
        }
    }
}

// --- 2. دالة إغلاق النافذة ---
function closeAdminAuth() {
    const modal = document.getElementById('adminAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// --- 3. دالة تسجيل الدخول ومعالجة كلمة السر ---
async function handleAdminAuth(btn) {
    const passwordInput = document.getElementById('adminPassInput');
    const password = passwordInput ? passwordInput.value.trim() : "";
    
    if (!password) {
        alert("⚠️ من فضلك أدخل الكود أولاً");
        if(passwordInput) passwordInput.focus();
        return;
    }

    // إشارة الانتظار على الزر
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "جاري التحقق... ⏳";

    try {
        // الاتصال بجوجل سكريبت
        const response = await fetch(`${settingsScriptURL}?action=adminAuth&id=${stadiumId}&pass=${encodeURIComponent(password)}`);
        const result = await response.text();

        console.log("استجابة السيرفر:", result);

   if (result.trim() === "Success") {
            // 1. إغلاق نافذة طلب الكود الصغيرة
            closeAdminAuth(); 
            
            // 2. إظهار لوحة تحكم المسؤول الكبيرة (adminPanel)
            const panel = document.getElementById('adminPanel');
            if (panel) {
                // نستخدم 'flex' لتتوافق مع تصميمك في CSS (مركزية الشاشة)
                panel.style.setProperty('display', 'flex', 'important'); 
                console.log("اللوحة يجب أن تظهر الآن");
            }

            // 3. إظهار أي أيقونات إدارية متفرقة في الصفحة (إن وجدت)
            document.querySelectorAll('.admin-only, .admin-icon').forEach(el => {
                el.style.setProperty('display', 'block', 'important');
            });
            
            // 4. تشغيل دالة عرض الإعدادات (لتحميل البيانات داخل اللوحة فوراً)
            showSettings(); 

        } else {
            // في حال فشل كلمة المرور
            alert("❌ كلمة السر غير صحيحة، حاول مرة أخرى.");
            if(passwordInput) {
                passwordInput.value = "";
                passwordInput.focus();
            }
        }
    } catch (e) {
        console.error("Auth Error:", e);
        alert("⚠️ خطأ في الاتصال بالسيرفر. تأكد من نشر السكريبت كـ Web App.");
    } finally {
        // إعادة الزر لحالته الطبيعية في كل الأحوال
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}


// --- 4. دالة نسيت كلمة المرور ---
async function handleForgotPassword() {
    const email = prompt("أدخل بريدك الإلكتروني المسجل لإرسال الكود إليه:");
    
    if (!email) return;

    if (!email.includes("@")) {
        alert("يرجى إدخال بريد إلكتروني صحيح");
        return;
    }

    alert("جاري إرسال الكود إلى بريدك... يرجى الانتظار");

    try {
        const response = await fetch(`${settingsScriptURL}?action=forgotPassword&id=${stadiumId}&email=${email}`);
        const result = await response.text();

        if (result.trim() === "Sent") {
            alert("✅ تم إرسال كود الدخول إلى بريدك الإلكتروني بنجاح.");
        } else if (result.trim() === "EmailMismatch") {
            alert("❌ هذا البريد غير مطابق للبريد المسجل لهذا الملعب.");
        } else {
            alert("⚠️ حدث خطأ، تأكد من إعدادات البريد في سكريبت جوجل.");
        }
    } catch (e) {
        console.error("Forgot Pass Error:", e);
        alert("❌ فشل الاتصال بالسيرفر لإرسال الإيميل.");
    }
} // هذا القوس ضروري جداً لإغلاق الدالة
function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}
