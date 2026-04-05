// 1. الإعدادات والروابط
const urlParams = new URLSearchParams(window.location.search);
const stadiumId = urlParams.get('id'); 
const baseScriptURL = 'https://script.google.com/macros/s/AKfycbwukrwucGuzTvWCQWNcXZebNQW-bIL1LyGZrPgaU6cBat6h5hF6aTN2jNOaJs7n16Uf/exec';

let selectedSlots = [];
let currentStartDate = getMonday(new Date());

// 2. جلب تفاصيل الملعب وتحديث الواجهة
async function loadStadiumDynamicDetails() {
    if (!stadiumId) return;
    try {
        const response = await fetch(`${baseScriptURL}?action=getStadiumDetails&id=${stadiumId}`);
        const data = await response.json();
        if (data !== "NotFound") {
            document.title = "حجز " + data.stadium_name;
            document.getElementById('displayStadiumName').innerText = data.stadium_name;
            document.getElementById('displayOrg').innerText = "بإشراف: " + data.org;
            document.getElementById('displayPriceDay').innerText = data.price_day;
            if(data.price_night) {
                document.getElementById('nightPriceRow').style.display = "block";
                document.getElementById('displayPriceNight').innerText = data.price_night;
            }
            window.stadiumPhone = data.phone;
            window.stadiumName = data.stadium_name;
            // إصلاح خطأ الزر
            const locBtn = document.getElementById('btnLocation');
            if(locBtn) locBtn.onclick = () => window.open(data.location, '_blank');
        }
    } catch (error) { console.error("Error loading details:", error); }
}

// 3. بناء الجدول (دالة محسنة)

function initTable() {
    const tableBody = document.getElementById('tableBody');
    const headerRow = document.getElementById('headerRow');
    const footerRow = document.getElementById('footerRow'); // ميزة السطر السفلي
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (!tableBody || !headerRow) return;

    tableBody.innerHTML = '';
    headerRow.innerHTML = '<th>الساعة</th>';
    if (footerRow) footerRow.innerHTML = '<th>الساعة</th>';
    
    const daysArr = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    // عرض الشهر والسنة في الأعلى
    let displayDate = new Date(currentStartDate.getTime());
    dateDisplay.innerText = displayDate.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });

    let currentWeekDates = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDate.getTime());
        d.setDate(d.getDate() + i); 
        
        // دالة تنسيق التاريخ يجب أن تكون موجودة في ملفك (getFormattedDate)
        let fullDate = getFormattedDate(d);
        currentWeekDates.push({name: daysArr[i], date: fullDate, rawDate: d}); 
        
        let cellContent = `${daysArr[i]}<br><small>${d.getDate()}</small>`;
        headerRow.innerHTML += `<th>${cellContent}</th>`;
        if (footerRow) footerRow.innerHTML += `<th>${cellContent}</th>`;
    }

    const now = new Date(); // الوقت الحالي للمقارنة الدقيقة

    for (let hour = 8; hour <= 23; hour++) {
        let hLabel24 = `${hour}:00`; 

        // تحويل الوقت لنظام 12 ساعة (ص/م) بشكل احترافي
        let currentH = hour > 12 ? hour - 12 : hour;
        let nextH = (hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1);
        
        if (hour === 12) currentH = 12;
        if ((hour + 1) === 12) nextH = 12;
        if (hour === 0) currentH = 12;

        let suffix = (hour >= 12) ? "م" : "ص";
        let hLabelRange = `${currentH} إلى ${nextH} ${suffix}`; 

        // بناء عمود الوقت الجانبي بتنسيق مميز
        let row = `<tr><td style="background:#f8fafc; font-weight:bold; white-space: nowrap; font-size: 0.85rem; padding: 5px; border: 1px solid #ddd;">${hLabelRange}</td>`;
        
        for (let day = 0; day < 7; day++) {
            // إنشاء وقت الخانة بدقة للمقارنة
            let slotTime = new Date(currentWeekDates[day].rawDate.getTime());
            slotTime.setHours(hour, 0, 0, 0);

            if (slotTime < now) {
                // الحالة 1: ساعة مرت (رمادي)
                row += `<td class="slot past" 
                            data-date="${currentWeekDates[day].date.trim()}" 
                            data-hour="${hLabel24}" 
                            style="background-color: #f1f5f9; color: #cbd5e1; cursor: not-allowed; pointer-events: none; font-size: 0.8rem; border: 1px solid #ddd;">منتهي</td>`;
            } else if (daysArr[day] === "الأحد" && hour >= 8 && hour < 12) {
                // الحالة 2: حجز إداري ثابت (الأحد صباحاً مثلاً)
                row += `<td class="slot booked" style="background-color: #ef4444; color: white; pointer-events: none; border: 1px solid #ddd;">محجوز</td>`;
            } else {
                // الحالة 3: متاح للحجز
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
    
    loadExistingBookings(); // استدعاء الحجوزات لتلوين الجدول بالأحمر
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
    } else {
        selectedSlots = selectedSlots.filter(s => s.element !== element);
        if (selectedSlots.length === 0) {
            document.getElementById('bookingModal').style.display = "none";
        }
    }
    updateModalDetails(); // تحديث النصوص داخل النافذة
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
            await fetch(baseScriptURL, {
                method: 'POST',
                mode: 'no-cors', // لتجنب مشاكل التصريح بين السيرفرات
                body: JSON.stringify({
                    st_id: stadiumId,
                    hour: slot.hour,
                    date: slot.date,
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
    script.src = `${baseScriptURL}?action=getBookings&st_id=${stadiumId}&callback=handleData&t=${new Date().getTime()}`;
    document.body.appendChild(script);
}

function handleData(bookings) {
    if (!Array.isArray(bookings)) return;
    bookings.forEach(b => {
        const slot = document.querySelector(`[data-date="${b.date}"][data-hour="${b.hour}"]`);
        if (slot) {
            slot.innerText = "محجوز";
            slot.classList.add("booked");
            slot.style.backgroundColor = "#ef4444";
            slot.style.pointerEvents = "none";
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
