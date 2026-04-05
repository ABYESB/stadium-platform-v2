// --- 1. الإعدادات والروابط الأساسية ---

// استخراج معرف الملعب (ID) من رابط الصفحة (مثلاً: id=st-v6at7ogy)
const urlParams = new URLSearchParams(window.location.search);
const stadiumId = urlParams.get('id'); 

// رابط السكريبت الأساسي (تأكد من وضع رابط الـ exec الخاص بك هنا)
const baseScriptURL = 'https://script.google.com/macros/s/AKfycbwukrwucGuzTvWCQWNcXZebNQW-bIL1LyGZrPgaU6cBat6h5hF6aTN2jNOaJs7n16Uf/exec';

// بناء الرابط النهائي الذي يطلب بيانات هذا الملعب تحديداً
const scriptURL = stadiumId ? `${baseScriptURL}?st_id=${stadiumId}` : baseScriptURL;

let selectedSlots = [];
// متغيرات عالمية لتخزين بيانات الملعب الديناميكية
window.stadiumPhone = "212632412959"; // افتراضي
window.stadiumLocation = "";

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay();
    var diff = d.getDate() - day + (day == 0 ? -6 : 1);
    var monday = new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0); 
    return monday;
}

let currentStartDate = getMonday(new Date());

function getFormattedDate(date) {
    let d = new Date(date);
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// --- 2. جلب بيانات الملعب الديناميكية (الاسم، الهاتف، الخ) ---
async function loadStadiumDynamicDetails() {
    if (!stadiumId) return;
    try {
        const response = await fetch(`${baseScriptURL}?action=getStadiumDetails&id=${stadiumId}`);
        const data = await response.json();
        if (data !== "NotFound") {
            // تحديث اسم الملعب في كل مكان
            document.title = data.stadium_name;
            const brandElements = document.querySelectorAll('.brand-name, .stadium-title');
            brandElements.forEach(el => el.innerText = data.stadium_name);
            
            // تحديث البيانات التقنية
            window.stadiumPhone = data.phone;
            window.stadiumLocation = data.location;
            window.stadiumName = data.stadium_name;
        }
    } catch (error) {
        console.error("خطأ في جلب بيانات الملعب:", error);
    }
}

// --- 3. معالجة وجلب الحجوزات ---
function handleData(bookings) {
    if (!Array.isArray(bookings)) return;
    bookings.forEach(booking => {
        const slot = document.querySelector(`[data-date="${booking.date}"][data-hour="${booking.hour}"]`);
        if (slot) {
            slot.classList.remove("past");
            slot.innerText = "محجوز";
            slot.style.backgroundColor = "#ef4444"; 
            slot.style.color = "white";
            slot.style.pointerEvents = "none"; 
            slot.classList.add("booked");
        }
    });
}

function loadExistingBookings() {
    const script = document.createElement('script');
    // نستخدم الـ st_id لجلب حجوزات هذا الملعب فقط
    script.src = `${baseScriptURL}?action=getBookings&st_id=${stadiumId}&callback=handleData&t=${new Date().getTime()}`;
    document.body.appendChild(script);
}

// --- 4. بناء الجدول ---
function initTable() {
    const tableBody = document.getElementById('tableBody');
    const headerRow = document.getElementById('headerRow');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (!tableBody || !headerRow) return;

    tableBody.innerHTML = '';
    headerRow.innerHTML = '<th>الساعة</th>';
    
    const daysArr = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    let currentWeekDates = [];

    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDate.getTime());
        d.setDate(d.getDate() + i); 
        let fullDate = getFormattedDate(d);
        currentWeekDates.push({name: daysArr[i], date: fullDate, rawDate: d}); 
        headerRow.innerHTML += `<th>${daysArr[i]}<br><small>${d.getDate()}</small></th>`;
    }

    dateDisplay.innerText = currentStartDate.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });
    const now = new Date();

    for (let hour = 8; hour <= 23; hour++) {
        let hLabel24 = `${hour}:00`; 
        let currentH = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        let nextH = (hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1);
        let suffix = (hour >= 12) ? "م" : "ص";
        
        let row = `<tr><td class="time-cell">${currentH} إلى ${nextH} ${suffix}</td>`;
        
        for (let day = 0; day < 7; day++) {
            let slotTime = new Date(currentWeekDates[day].rawDate.getTime());
            slotTime.setHours(hour, 0, 0, 0);

            if (slotTime < now) {
                row += `<td class="slot past" data-date="${currentWeekDates[day].date}" data-hour="${hLabel24}">منتهي</td>`;
            } else {
                row += `<td class="slot" data-date="${currentWeekDates[day].date}" data-day="${currentWeekDates[day].name}" data-hour="${hLabel24}" onclick="handleSlotSelection(this)">متاح</td>`;
            }
        }
        row += `</tr>`;
        tableBody.innerHTML += row;
    }
    loadExistingBookings();
}

// --- 5. إرسال الحجز النهائي ---
async function submitFinalBooking() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    if (!name || !phone) return alert("يرجى إكمال البيانات");

    // إظهار واجهة الانتظار
    const loadingOverlay = document.createElement("div");
    loadingOverlay.innerHTML = `<div class="loading-overlay">جاري معالجة حجزك...</div>`;
    document.body.appendChild(loadingOverlay);

    const tempSlots = [...selectedSlots].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    const bookingDate = tempSlots[0].date;
    const bookingHours = tempSlots.map(s => s.hour).join(" و ");

    // الرسالة الموجهة لصاحب الملعب
    const messageContent = `⚽ *حجز جديد عبر المنصة* ⚽\n\n*الملعب:* ${window.stadiumName || "غير محدد"}\n*الاسم:* ${name}\n*الهاتف:* ${phone}\n*التاريخ:* ${bookingDate}\n*الوقت:* ${bookingHours}`;
    const whatsappURL = `https://wa.me/${window.stadiumPhone}?text=${encodeURIComponent(messageContent)}`;

    try {
        for (const slot of tempSlots) {
            await fetch(baseScriptURL, {
                method: 'POST',
                body: JSON.stringify({ 
                    st_id: stadiumId, // ربط الحجز بالملعب
                    hour: slot.hour, 
                    date: slot.date, 
                    name: name, 
                    phone: phone 
                })
            });
        }
        loadingOverlay.remove();
        alert("تم تسجيل الحجز! سننتقل الآن للواتساب للتأكيد.");
        window.open(whatsappURL, '_blank');
        closeBookingModal();
        initTable(); // إعادة تحديث الجدول
    } catch (error) {
        loadingOverlay.remove();
        alert("حدث خطأ في الاتصال.");
    }
}

// --- تشغيل النظام ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadStadiumDynamicDetails(); // 1. جلب هوية الملعب أولاً
    initTable();                      // 2. بناء الجدول بناءً على البيانات
    if (typeof Swiper !== 'undefined') initSwiper(); 
});

// (باقي الدوال الإضافية مثل handleSlotSelection و closeBookingModal تبقى كما هي لديك مع التأكد من استدعاء الدوال الجديدة)
// دالة فتح وإغلاق القوانين
function toggleRules() {
    const modal = document.getElementById('rulesModal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

// دالة تغيير الأسابيع
function changeWeek(direction) {
    currentStartDate.setDate(currentStartDate.getDate() + (direction * 7));
    initTable(); // إعادة بناء الجدول بالتاريخ الجديد
}
