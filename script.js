// --- 1. الإعدادات والروابط الأساسية ---

// الرابط الأول: المسؤول عن جلب (اسم الملعب، اللوغو، الأسعار، الموقع)
const settingsScriptURL = 'https://script.google.com/macros/s/AKfycbzxFQ8xMkcqAUcUBx7U7rmR_OLKlAuqnsBCsML0NW2sF_hLsuXEvlNRg9giJmh4aFE/exec';

// الرابط الثاني: المسؤول عن (جلب الحجوزات القديمة، تلوين المربعات بالأحمر، تسجيل حجز جديد)
const bookingScriptURL = 'https://script.google.com/macros/s/AKfycbzxFQ8xMkcqAUcUBx7U7rmR_OLKlAuqnsBCsML0NW2sF_hLsuXEvlNRg9giJmh4aFE/exec';

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
            // 1. النصوص الأساسية
            document.title = "حجز " + data.stadium_name;
            document.getElementById('displayStadiumName').innerText = data.stadium_name;
            document.getElementById('displayOrg').innerText = "بإشراف: " + data.org;
            
            // 2. حل مشكلة اللوغو: يظهر لوغو المنصة إذا كان الحقل فارغاً في الشيت
            const logoImg = document.getElementById('displayLogo');
            if (logoImg) {
                // استبدل الرابط أدناه برابط لوغو منصتك الرسمي
                const platformLogo = "https://i.ibb.co/xqvjmphT/5.png"; 
                logoImg.src = (data.logo_url && data.logo_url.trim() !== "") ? data.logo_url : platformLogo;
            }

            // 3. تحديث الأسعار والمودال (زر القوانين يشتغل جيداً)
            if (document.getElementById('modalStadiumName')) {
                document.getElementById('modalStadiumName').innerText = data.stadium_name;
            }
            document.getElementById('displayPriceDay').innerText = data.price_day;
            const nightRow = document.getElementById('nightPriceRow');
            if(data.price_night && nightRow) {
                nightRow.style.display = "block";
                document.getElementById('displayPriceNight').innerText = data.price_night;
            }

            // 4. الواتساب (يشتغل جيداً)
            window.stadiumPhone = data.phone;
            const whatsappFloat = document.getElementById('whatsappFloat');
            if (whatsappFloat && data.phone) {
                let cleanPhone = data.phone.toString().replace(/\s+/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
                const msg = encodeURIComponent(`السلام عليكم، استفسار عن حجز ${data.stadium_name}`);
                whatsappFloat.href = `https://wa.me/${cleanPhone}?text=${msg}`;
            }
            
            // 5. حل مشكلة زر الموقع: منع الـ 404 وضمان الفتح الصحيح
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

            // 6. حل مشكلة الروابط الاجتماعية (إخفاء الزر إذا كان فارغاً لمنع التكرار)
            const handleSocialLink = (id, link) => {
                const el = document.getElementById(id);
                if (el) {
                    if (link && link.trim() !== "" && link !== "#") {
                        el.href = link;
                        el.style.display = "inline-flex";
                    } else {
                        el.style.display = "none"; // إخفاء الزر تماماً
                    }
                }
            };
            handleSocialLink('fbLink', data.fb);
            handleSocialLink('igLink', data.insta);

            // 7. حل مشكلة زر الإيميل: التأكد من تفعيل الرابط
            const emailBtn = document.getElementById('emailLink');
            if (emailBtn) {
                emailBtn.href = "mailto:3dworkben@gmail.com";
                emailBtn.onclick = () => {
                    window.location.href = "mailto:3dworkben@gmail.com";
                };
            }

       // 9. إصلاح السلايدر: عرض الصور الافتراضية إذا كان الشيت فارغاً أو الروابط معطلة
            const swiperWrapper = document.querySelector('.swiper-wrapper');
            if (swiperWrapper) {
                // تجميع الروابط والتأكد من أنها روابط حقيقية ونظيفة من المسافات
                let images = [];
                if (data.img1 && data.img1.trim().startsWith('http')) images.push(data.img1.trim());
                if (data.img2 && data.img2.trim().startsWith('http')) images.push(data.img2.trim());
                if (data.img3 && data.img3.trim().startsWith('http')) images.push(data.img3.trim());

                // القائمة الافتراضية للصور (في حال كان الشيت فارغاً)
                const defaultImages = [
                    "https://i.ibb.co/5R4S9fP/artificial-turf-football-field.jpg",
                    "https://i.ibb.co/L8xM4jM/soccer-goal-net.jpg",
                    "https://i.ibb.co/SdfV1X2/football-players.jpg"
                ];

                // اختيار الصور التي سيتم عرضها (الحقيقية أو الافتراضية)
                const imagesToDisplay = images.length > 0 ? images : defaultImages;

                swiperWrapper.innerHTML = ''; // مسح المحتوى القديم
                imagesToDisplay.forEach((imgUrl, index) => {
                    swiperWrapper.innerHTML += `
                        <div class="swiper-slide">
                            <img src="${imgUrl}" 
                                 alt="صورة الملعب ${index + 1}" 
                                 onerror="this.src='${defaultImages[0]}'"
                                 style="width:100%; height:100%; object-fit:cover; display:block;">
                            <p class="slide-caption">مرحباً بكم في ${data.stadium_name || 'ملعبنا'}</p>
                        </div>`;
                });

                // تحديث مكتبة Swiper لتعمل بالصور الجديدة
                if (typeof swiper !== 'undefined' && swiper !== null) {
                    swiper.update();
                    swiper.slideTo(0); 
                }
            }
        } // إغلاق شرط if (data !== "NotFound")
    } catch (error) { 
        console.error("Error loading details:", error); 
    }
} // إغلاق الدالة loadStadiumDynamicDetails

// 3. بناء الجدول (دالة محسنة)

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
    await loadStadiumDynamicDetails();
    initTable();
});
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
    // وذلك لتجنب أي تداخل أثناء قيامه بالاختيار
    const modal = document.getElementById('bookingModal');
    if (modal && modal.style.display !== "block") {
        console.log("جاري تحديث الحجوزات تلقائياً...");
        loadExistingBookings();
    }
}, 15000); // 15000 ميلي ثانية تعني 15 ثانية

async function scheduleNotification(bookingDate, bookingHour) {
    if (!("Notification" in window)) {
        console.log("هذا المتصفح لا يدعم التنبيهات.");
        return;
    }

    // طلب الإذن من المستخدم (يظهر مرة واحدة فقط)
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // --- تحويل بيانات الحجز إلى كائن وقت حقيقي ---
    // التاريخ يأتي بتنسيق DD/MM/YYYY والساعة HH:00
    const [day, month, year] = bookingDate.split('/');
    const [hour] = bookingHour.split(':');
    // ملاحظة: الشهور في JS تبدأ من 0 (يناير = 0)
    const playTime = new Date(year, month - 1, day, parseInt(hour), 0, 0);
    const now = new Date();

    // --- 1. التنبيه الفوري (مباشرة بعد الضغط على زر الحجز) ---
    navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("✅ تم الحجز بنجاح", {
            body: `موعدك في  يوم ${bookingDate} الساعة ${bookingHour}. ننتظرك!`,
            icon: "logo-512.png",
            badge: "logo-512.png",
            vibrate: [100, 50, 100],
            tag: 'booking-confirmed' // يمنع تكرار الإشعار إذا ضغط مرتين
        });
    });

    // --- دالة برمجية لجدولة التنبيهات المستقبلية ---
    const setReminder = (hoursBefore, message, tag) => {
        const notifyTime = new Date(playTime.getTime() - (hoursBefore * 60 * 60 * 1000));
        
        // نبرمج التنبيه فقط إذا كان وقته لم يفت بعد
        if (notifyTime > now) {
            const delay = notifyTime.getTime() - now.getTime();
            
            setTimeout(() => {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification("⚽ ملعب ", {
                        body: message,
                        icon: "logo_no_background.png",
                        badge: "logo_no_background.png",
                        vibrate: [200, 100, 200],
                        tag: tag,
                        requireInteraction: true // يبقى الإشعار ظاهراً حتى يغلقه المستخدم
                    });
                });
            }, delay);
        }
    };

    // --- 2. جدولة تنبيه قبل 5 ساعات ---
    setReminder(5, `تذكير: تبقى 5 ساعات على موعد مباراتك اليوم (${bookingHour}). هل الفريق جاهز؟`, 'reminder-5h');

    // --- 3. جدولة تنبيه قبل ساعة واحدة ---
    setReminder(1, `عجل يا بطل! تبقى ساعة واحدة فقط على انطلاق المباراة. ننتظرك في الملعب!`, 'reminder-1h');
}
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installApp');

window.addEventListener('beforeinstallprompt', (e) => {
    // منع المتصفح من إظهار النافذة الافتراضية الباهتة
    e.preventDefault();
    // حفظ الحدث لاستخدامه عند الضغط على الزر
    deferredPrompt = e;
    // إظهار الشريط للمستخدم
    installBanner.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        // إظهار نافذة التثبيت الرسمية
        deferredPrompt.prompt();
        // انتظار قرار المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBanner.style.display = 'none';
    }
});

// إخفاء الشريط إذا تم تثبيت التطبيق بالفعل
window.addEventListener('appinstalled', () => {
    installBanner.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA was installed');
});
// تأكد من وجود هذا السطر في نهاية ملف booking.html أو script.js
const swiper = new Swiper('.swiper-container', {
    loop: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    autoplay: { delay: 3000 }
});
