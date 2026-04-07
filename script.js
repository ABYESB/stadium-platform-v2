// --- 1. الإعدادات والروابط الأساسية ---

// الرابط الأول: المسؤول عن جلب (اسم الملعب، اللوغو، الأسعار، الموقع)
const settingsScriptURL = 'https://script.google.com/macros/s/AKfycbzUi313QQlF3auR8JLnpXISgM-7tLqAgzfQIawJEsNrts_aLLo15MR93MeSV8QZq1OY/exec';

// الرابط الثاني: المسؤول عن (جلب الحجوزات القديمة، تلوين المربعات بالأحمر، تسجيل حجز جديد)
const bookingScriptURL = 'https://script.google.com/macros/s/AKfycbzZhw5liHJux1LrdgCXYCxSTx4qc8FzEEvXhIMAX9J8S53FpVeLuFqBTeOXYFMwWEeM/exec';

const urlParams = new URLSearchParams(window.location.search);
const stadiumId = urlParams.get('id'); 

let selectedSlots = [];
let currentStartDate = getMonday(new Date());

// 2. جلب تفاصيل الملعب وتحديث الواجهة
async function loadStadiumDynamicDetails() {
    if (!stadiumId) return;
    try {
        // التعديل هنا: استخدام settingsScriptURL بدلاً من baseScriptURL
        const response = await fetch(`${settingsScriptURL}?action=getStadiumDetails&id=${stadiumId}`);
        const data = await response.json();
        
        if (data !== "NotFound") {
            // 1. تحديث العناوين والنصوص الأساسية
            document.title = "حجز " + data.stadium_name;
            document.getElementById('displayStadiumName').innerText = data.stadium_name;
            document.getElementById('displayOrg').innerText = "بإشراف: " + data.org;
            
            // 2. تحديث الشعار (Logo) ديناميكياً
            const logoImg = document.getElementById('displayLogo');
            if (logoImg && data.logo_url) {
                logoImg.src = data.logo_url; // نفترض أن الحقل في قاعدة البيانات اسمه logo_url
            }

            // 3. تحديث اسم الملعب داخل نافذة الحجز (Modal)
            const modalStadiumName = document.getElementById('modalStadiumName');
            if (modalStadiumName) {
                modalStadiumName.innerText = data.stadium_name;
            }

            // 4. تحديث الأسعار
            document.getElementById('displayPriceDay').innerText = data.price_day;
            if(data.price_night) {
                const nightRow = document.getElementById('nightPriceRow');
                if(nightRow) nightRow.style.display = "block";
                document.getElementById('displayPriceNight').innerText = data.price_night;
            }

            // 5. تخزين البيانات في متغيرات عامة لاستخدامها في الواتساب
            window.stadiumPhone = data.phone;
            window.stadiumName = data.stadium_name;
            
            // 6. إصلاح رابط الموقع الجغرافي
            const locBtn = document.getElementById('btnLocation');
            if(locBtn) locBtn.onclick = () => window.open(data.location, '_blank');
        }
    } catch (error) { 
        console.error("Error loading details:", error); 
    }
}
// 3. بناء الجدول (دالة محسنة)

function initTable() {
    const tableBody = document.getElementById('tableBody');
    const headerRow = document.getElementById('headerRow');
    const footerRow = document.getElementById('footerRow'); 
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (!tableBody || !headerRow) return;

    tableBody.innerHTML = '';
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
        tableBody.innerHTML += row;
    }
    
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
            const currentHour = parseInt(element.getAttribute('data-hour').split(':')[0]);
            const currentDate = element.getAttribute('data-date');

            if (Math.abs(currentHour - firstHour) !== 1 || currentDate !== firstSlot.date) {
                alert("⚠️ عذراً، يجب اختيار ساعات متتالية وفي نفس اليوم.");
                return;
            }
        }
    }

    // تفعيل/إلغاء اختيار المربع
    element.classList.toggle('selected');
    const date = element.getAttribute('data-date');
    const hour = element.getAttribute('data-hour');
    const dayName = element.getAttribute('data-day'); 

    if (element.classList.contains('selected')) {
        selectedSlots.push({ hour, date, element, dayName }); 
        document.getElementById('bookingModal').style.display = "block";
        
        // --- منطق ذكاء زر الساعة الإضافية ---
        const extraBtn = document.getElementById('extraSlotContainer');
        if (selectedSlots.length === 1) {
            // حساب الساعة التالية (مثلاً 18:00 تصبح 19)
            let nextH = (parseInt(hour.split(':')[0]) + 1) + ":00";
            // البحث عن المربع الموالي في الجدول
            let nextSlot = document.querySelector(`[data-date="${date}"][data-hour="${nextH}"]`);
            
            // شرط الإظهار: يجب أن توجد ساعة تالية، وأن لا تكون محجوزة، ولا في الماضي
            if (nextSlot && !nextSlot.classList.contains('booked') && !nextSlot.classList.contains('past')) {
                extraBtn.style.display = "block";
            } else {
                extraBtn.style.display = "none";
            }
        } else {
            // إذا اختار المستخدم ساعتين فعلياً، نخفي الزر
            extraBtn.style.display = "none";
        }
        // ----------------------------------
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
    btn.innerText = "جاري الحجز... ⏳";
    btn.disabled = true;

    try {
        // إرسال كل ساعة مختارة كسطر منفصل في قاعدة البيانات
        for (const slot of selectedSlots) {
            // التعديل هنا: استخدام bookingScriptURL بدلاً من baseScriptURL
            await fetch(bookingScriptURL, {
                method: 'POST',
                mode: 'no-cors', 
                body: JSON.stringify({
                    stadiumId: stadiumId, // تم تغيير st_id إلى stadiumId ليتوافق مع السكريبت الجديد
                    dayName: slot.dayName, // إضافة اسم اليوم لملء العمود B في الشيت
                    date: slot.date,
                    hour: slot.hour,
                    name: name,
                    phone: phone
                })
            });
        }

        alert("✅ تم الحجز بنجاح!");
        closeBookingModal();
        initTable(); // إعادة تحديث الجدول لإظهار المربعات باللون الأحمر
    } catch (error) {
        console.error("Error:", error);
        alert("❌ حدث خطأ أثناء الحجز، يرجى المحاولة لاحقاً.");
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

    // إزالة تحديد المربعات الخضراء
    selectedSlots.forEach(s => {
        if (s.element) s.element.classList.remove('selected');
    });
    selectedSlots = [];
    
    // تحديث حالة زر التأكيد (ليصبح معطلاً مرة أخرى)
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
    const script = document.createElement('script');
    // التعديل: استخدام bookingScriptURL بدلاً من baseScriptURL لضمان جلب البيانات من شيت الحجوزات
    script.src = `${bookingScriptURL}?action=getBookings&id=${stadiumId}&callback=handleData&t=${new Date().getTime()}`;
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
