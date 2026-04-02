// --- 1. الإعدادات والروابط الأساسية ---
const scriptURL = 'https://script.google.com/macros/s/AKfycbyWAedUQdrrDDwDP0QJHRF_YxJApNLsIwFsaO1avWp5znsWuJ8V491i0ABgWUF9x5JrUg/exec';
let selectedSlots = []; 

// دالة ذكية تجلب تاريخ "الاثنين" للأسبوع الحالي مهما كان اليوم
// يجب أن تكون هذه السطور في أعلى الملف لتراها كل الدوال
function getMonday(d) {
    d = new Date(d);
    var day = d.getDay();
    var diff = d.getDate() - day + (day == 0 ? -6 : 1);
    var monday = new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0); 
    return monday;
}

// تعريف المتغير هنا يجعله متاحاً لـ initTable وغيرها
let currentStartDate = getMonday(new Date());

// --- 2. تنسيق التاريخ DD/MM/YYYY ---
function getFormattedDate(date) {
    let d = new Date(date);
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    return `${day}/${month}/${year}`;
}


function handleData(bookings) {
    // التأكد من أن البيانات المستلمة مصفوفة صحيحة
    if (!Array.isArray(bookings)) return;

    bookings.forEach(booking => {
        // البحث عن الخانة في الجدول بناءً على التاريخ والساعة المستلمين من جوجل
        const slot = document.querySelector(`[data-date="${booking.date}"][data-hour="${booking.hour}"]`);
        
        if (slot) {
            // التعديل: إزالة كلاس الماضي (إن وجد) لضمان ظهور اللون الأحمر بوضوح
            slot.classList.remove("past");
            
            slot.innerText = "محجوز";
            slot.style.backgroundColor = "#ef4444"; // اللون الأحمر
            slot.style.color = "white";
            slot.style.opacity = "1"; // التأكد من أن الشفافية كاملة ليظهر الأحمر بوضوح
            
            // يمنع أي شخص من الضغط على المربع المحجوز نهائياً
            slot.style.pointerEvents = "none"; 
            
            // إضافة كلاس للتمييز البرمجي
            slot.classList.add("booked");
        }
    });
}

// 2. دالة جلب البيانات من جوجل

function loadExistingBookings() {

    const script = document.createElement('script');

    // تأكد أن scriptURL هو الرابط الجديد الذي ينتهي بـ /exec

    script.src = `${scriptURL}?callback=handleData&t=${new Date().getTime()}`;

    document.body.appendChild(script);

}



// 3. بناء الجدول وتحديثه (النسخة المصححة لضبط ترحيل الأيام)
// 3. بناء الجدول وتحديثه (النسخة النهائية لحل مشكلة إزاحة الأيام)
function initTable() {
    const tableBody = document.getElementById('tableBody');
    const headerRow = document.getElementById('headerRow');
    const footerRow = document.getElementById('footerRow');
    const dateDisplay = document.getElementById('dateDisplay');
    
    if (!tableBody || !headerRow) return;

    tableBody.innerHTML = '';
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
        headerRow.innerHTML += `<th>${cellContent}</th>`;
        if (footerRow) footerRow.innerHTML += `<th>${cellContent}</th>`;
    }

    const now = new Date(); // الوقت الحالي للمقارنة

    for (let hour = 8; hour <= 23; hour++) {
        let hLabel24 = `${hour}:00`; 

        let currentH = hour > 12 ? hour - 12 : hour;
        let nextH = (hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1);
        
        if (hour === 12) currentH = 12;
        if ((hour + 1) === 12) nextH = 12;
        if (hour === 0) currentH = 12;

        let suffix = (hour >= 12) ? "م" : "ص";
        let hLabelRange = `${currentH} إلى ${nextH} ${suffix}`; 

        // عمود الوقت (العمود الأول)
        let row = `<tr><td style="background:#f8fafc; font-weight:bold; white-space: nowrap; font-size: 0.85rem; padding: 5px; border: 1px solid #ddd;">${hLabelRange}</td>`;
        
        for (let day = 0; day < 7; day++) {
            // إنشاء وقت الخانة بدقة للمقارنة
            let slotTime = new Date(currentWeekDates[day].rawDate.getTime());
            slotTime.setHours(hour, 0, 0, 0);

            if (slotTime < now) {
                // --- الحالة 1: ساعة مرت وانتهت (رمادي ميت) ---
                // تم إضافة data-date و data-hour هنا لتمكين التلوين الأحمر لاحقاً
                row += `<td class="slot past" 
                            data-date="${currentWeekDates[day].date.trim()}" 
                            data-hour="${hLabel24}" 
                            style="background-color: #f1f5f9; color: #cbd5e1; cursor: not-allowed; pointer-events: none; font-size: 0.8rem; border: 1px solid #ddd;">منتهي</td>`;
            } else if (daysArr[day] === "الأحد" && hour >= 8 && hour < 12) {
                // --- الحالة 2: محجوز يدوياً (مثل يوم الأحد صباحاً) ---
                row += `<td class="slot booked" style="background-color: #ef4444; color: white; pointer-events: none; border: 1px solid #ddd;">محجوز</td>`;
            } else {
                // --- الحالة 3: خانة متاحة للحجز ---
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
    
    loadExistingBookings(); // جلب الحجوزات من جوجل شيت وتلوينها بالأحمر
}
// تشغيل السلايدر تلقائياً



function initSwiper() {



    if (typeof Swiper !== 'undefined') {



        new Swiper('.swiper-container', {



            loop: true,



            autoplay: { 



                delay: 3000, 



                disableOnInteraction: false 



            },



            pagination: { 



                el: '.swiper-pagination', 



                clickable: true 



            },



        });



    }



}







// استدعاء التشغيل عند فتح الصفحة



document.addEventListener('DOMContentLoaded', () => {



    initTable();



    loadExistingBookings();



    initSwiper(); // <--- تأكد من وجود هذا السطر هنا



})

// 7. دوال إضافية لتجنب الأخطاء

function requestVideo() {

    window.open("https://wa.me/212621403563?text=أريد تسجيل فيديو للمباراة", "_blank");

}

// دالة لتحديث نصوص المودال وفحص توفر ساعة إضافية تلقائياً
function updateModalDetails() {
    if (selectedSlots.length === 0) return;

    // ترتيب الساعات المختارة
    selectedSlots.sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    const firstSlot = selectedSlots[0];
    const allHours = selectedSlots.map(s => s.hour).join(" و ");
    
    // تحديث النص الرئيسي في النافذة
    document.getElementById('selectedDetails').innerText = `حجز يوم ${firstSlot.dayName}: ${firstSlot.date} الساعة ${allHours}`;

    // --- منطق اقتراح الساعة التالية ---
    const extraSlotContainer = document.getElementById('extraSlotContainer');
    
    // نقترح ساعة ثانية فقط إذا كان المستخدم اختار ساعة واحدة حتى الآن
    if (selectedSlots.length === 1) {
        const currentHourInt = parseInt(firstSlot.hour.split(':')[0]);
        const nextHourInt = currentHourInt + 1;
        const nextHourStr = nextHourInt + ":00";

        // البحث عن الخانة التالية في الجدول (بناءً على التاريخ والساعة)
        const nextSlotElement = document.querySelector(`[data-date="${firstSlot.date}"][data-hour="${nextHourStr}"]`);

        // الشروط: الخانة موجودة، ليست محجوزة، وليست مختارة أصلاً، وقبل منتصف الليل
        if (nextSlotElement && 
            !nextSlotElement.classList.contains('booked') && 
            !nextSlotElement.classList.contains('selected') && 
            nextHourInt <= 23) {
            
            extraSlotContainer.style.display = "block";
            // تخزين بيانات الساعة التالية في "dataset" الزر لاستخدامها عند الضغط
            extraSlotContainer.dataset.nextHour = nextHourStr;
        } else {
            extraSlotContainer.style.display = "none";
        }
    } else {
        // إخفاء الخيار إذا كان قد اختار ساعتين بالفعل
        extraSlotContainer.style.display = "none";
    }
}

// الدالة التي تنفذ عند الضغط على زر "نعم، أضف الساعة التالية"
function addNextSlot() {
    const nextHourStr = document.getElementById('extraSlotContainer').dataset.nextHour;
    const firstSlot = selectedSlots[0];
    
    // العثور على العنصر في الجدول
    const nextSlotElement = document.querySelector(`[data-date="${firstSlot.date}"][data-hour="${nextHourStr}"]`);

    if (nextSlotElement) {
        nextSlotElement.classList.add('selected');
        selectedSlots.push({ 
            hour: nextHourStr, 
            date: firstSlot.date, 
            element: nextSlotElement, 
            dayName: firstSlot.dayName 
        });
        
        // تحديث النافذة (سيؤدي هذا لإخفاء زر الإضافة وتحديث نص الساعات)
        updateModalDetails();
    }
}


// استبدل الدالة القديمة بهذه
function handleSlotSelection(element) {
    if (element.innerText === "محجوز" || element.classList.contains("booked")) return; 

    const isAlreadySelected = element.classList.contains('selected');

    if (!isAlreadySelected) {
        if (selectedSlots.length >= 2) {
            alert("⚠️ عذراً، لا يمكن حجز أكثر من ساعتين متتاليتين.");
            return;
        }
        if (selectedSlots.length === 1) {
            const firstSlot = selectedSlots[0];
            const firstHour = parseInt(firstSlot.hour.split(':')[0]);
            const currentHour = parseInt(element.getAttribute('data-hour').split(':')[0]);
            const currentDate = element.getAttribute('data-date');
            if (Math.abs(currentHour - firstHour) !== 1 || currentDate !== firstSlot.date) {
                alert("عذراً، يجب اختيار ساعات متتالية وفي نفس اليوم.");
                return;
            }
        }
    }

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
    updateModalDetails(); // تحديث النافذة وفحص الساعة التالية
}

// استبدل جميع نسخ closeBookingModal بهذه النسخة الواحدة فقط في نهاية الكود
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = "none";

    // تنظيف البيانات
    const userNameInput = document.getElementById('userName');
    const userPhoneInput = document.getElementById('userPhone');
    const checkbox = document.getElementById('confirmCheckbox');

    if (userNameInput) userNameInput.value = "";
    if (userPhoneInput) userPhoneInput.value = "";
    if (checkbox) checkbox.checked = false;

    // إزالة اللون الأخضر من جميع المربعات المختارة وتفريغ القائمة
    selectedSlots.forEach(s => {
        if (s.element) s.element.classList.remove('selected');
    });
    selectedSlots = [];
    
    // إعادة تعطيل زر الإرسال
    if (typeof toggleSubmitButton === "function") toggleSubmitButton();
}



function changeWeek(direction) {

    currentStartDate.setDate(currentStartDate.getDate() + (direction * 7));

    initTable();

}




// 1. دالة موقع الملعب (تطابق زر showMap)

function showMap() {

    // رابط إحداثيات ملعب بوعسل - مكناس

    const mapUrl = "https://www.google.com/maps?q=2CQM+W4J، وليلي"; 

    window.open(mapUrl, "_blank");

}

// 2. دالة قوانين الملعب المصلحة

function toggleRules() {

    // قمنا بتغيير 'newRulesModal' إلى 'rulesModal' ليطابق اسم العنصر في الـ HTML لديك

    var modal = document.getElementById('rulesModal');

    if (modal) {

        if (modal.style.display === 'block') {

            modal.style.display = 'none';

        } else {

            modal.style.display = 'block';

        }

    }

}



// دالة إغلاق النافذة (تأكد من مطابقة الاسم أيضاً)

function closeRulesModal() {

    document.getElementById('rulesModal').style.display = 'none';

}



// إغلاق النافذة عند الضغط خارجها

window.onclick = function(event) {

    const modal = document.getElementById('rulesModal');

    if (event.target == modal) {

        modal.style.display = 'none';

    }

}

async function submitFinalBooking() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    const btn = document.getElementById('finalConfirmBtn'); 

    if (!name || !phone) return alert("يرجى إكمال البيانات");

    // --- 1. إظهار نافذة الانتظار ---
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "customLoadingOverlay";
    loadingOverlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.7); z-index: 9999; display: flex; 
                    align-items: center; justify-content: center; direction: rtl;">
            <div style="background: white; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <div style="font-weight: bold; color: #333; font-size: 1.1rem;">جاري معالجة حجزك...</div>
                <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">يرجى الانتظار قليلاً قبل الانتقال للواتساب</div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    if(btn) {
        btn.disabled = true;
        btn.style.opacity = "0.7";
    }

    const tempSlots = [...selectedSlots]; 
    tempSlots.sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    const dayName = tempSlots[0].dayName; 
    const bookingDate = tempSlots[0].date;
    const bookingHours = tempSlots.map(s => s.hour).join(" و ");
    
    const myNumber = "212632412959"; 

    const messageContent = `⚽ *حجز جديد لملعب بوعسل* ⚽\n\n` +
                           `*الاسم:* ${name}\n` +
                           `*الهاتف:* ${phone}\n` +
                           `*اليوم:* ${dayName}\n` +
                           `*التاريخ:* ${bookingDate}\n` +
                           `*الوقت:* ${bookingHours}\n\n` +
                           `يرجى تأكيد الحجز من طرفكم.`;

    const whatsappURL = "https://wa.me/" + myNumber + "?text=" + encodeURIComponent(messageContent);

    try {
        for (const slot of tempSlots) {
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify({ 
                    hour: slot.hour, 
                    date: slot.date, 
                    dayName: slot.dayName,
                    name: name, 
                    phone: phone 
                })
            });

            const result = await response.json();

            if (result.result === "error") {
                if (document.getElementById("customLoadingOverlay")) document.getElementById("customLoadingOverlay").remove();
                alert("⚠️ " + result.message);
                if (typeof loadExistingBookings === 'function') loadExistingBookings(); 
                if(btn) {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                }
                return; 
            }
        }

        if (document.getElementById("customLoadingOverlay")) document.getElementById("customLoadingOverlay").remove();

        tempSlots.forEach(slot => {
            if (slot.element) {
                slot.element.innerText = "محجوز";
                slot.element.style.backgroundColor = "#ef4444";
                slot.element.style.color = "white";
                slot.element.style.pointerEvents = "none";
                slot.element.classList.add("booked");
                slot.element.classList.remove("selected");
            }
        });

        // --- الجزء الخاص بالتنبيهات ---
        tempSlots.forEach(slot => {
            scheduleNotification(slot.date, slot.hour);
        });

        closeBookingModal();
        selectedSlots = []; 

        window.open(whatsappURL, '_blank');

    } catch (error) {
        if (document.getElementById("customLoadingOverlay")) document.getElementById("customLoadingOverlay").remove();
        console.error("خطأ في الخلفية:", error);
        if (typeof loadExistingBookings === 'function') loadExistingBookings();
        alert("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.");
        if(btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }
}
// دالة زر دعم الجمعية
function showDonationInfo() {
    alert("شكراً لرغبتك في دعم جمعية شباب بوعسل!\n\nيمكنكم التواصل معنا عبر الهاتف أو البريد الإلكتروني لتنسيق الدعم المادي أو العيني.");
}

// دالة مسؤول الموقع (إذا كنت تريد إعادة تفعيل لوحة التحكم)
function openAdminPanel() {
    const pass = prompt("🔐 أدخل كلمة مرور الإدارة:");
    if (pass === "1111") {
        const hourlyRate = 60; // السعر المحدد: 60 درهم للساعة
        
        // جلب البيانات من جوجل
        fetch(`${scriptURL}?callback=analyzeData&t=${new Date().getTime()}`)
            .then(response => response.text())
            .then(text => {
                // تحويل بيانات JSONP إلى مصفوفة
                const startIdx = text.indexOf('(') + 1;
                const endIdx = text.lastIndexOf(')');
                const jsonData = JSON.parse(text.substring(startIdx, endIdx));

                // إنشاء مصفوفة لتخزين بيانات كل شهر (من 1 إلى 12)
                let monthlyStats = Array(12).fill(0).map(() => ({ hours: 0, revenue: 0 }));

                jsonData.forEach(booking => {
                    // استخراج الشهر من التاريخ (تنسيق DD/MM/YYYY)
                    const dateParts = booking.date.split('/');
                    if (dateParts.length === 3) {
                        const monthIndex = parseInt(dateParts[1]) - 1; // تحويل الشهر لرقم من 0 إلى 11
                        if (monthIndex >= 0 && monthIndex < 12) {
                            monthlyStats[monthIndex].hours += 1;
                            monthlyStats[monthIndex].revenue += hourlyRate;
                        }
                    }
                });

                // تجهيز النص النهائي للعرض في النافذة
                const monthNames = [
                    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
                ];

                let report = "📊 التقرير المالي السنوي (60 درهم/ساعة):\n";
                report += "----------------------------------------\n";
                
                let grandTotalRevenue = 0;
                let hasData = false;

                monthlyStats.forEach((stat, index) => {
                    if (stat.hours > 0) {
                        report += `📅 ${monthNames[index]}: ${stat.hours} ساعة ⬅️ ${stat.revenue} درهم\n`;
                        grandTotalRevenue += stat.revenue;
                        hasData = true;
                    }
                });

                if (!hasData) {
                    report += "\n⚠️ لا توجد بيانات حجز مسجلة بعد.";
                } else {
                    report += "----------------------------------------\n";
                    report += `💰 إجمالي مداخل السنة: ${grandTotalRevenue} درهم`;
                }

                alert(report);
            })
            .catch(err => alert("حدث خطأ أثناء جلب التقارير: " + err));
            
    } else {
        alert("❌ كلمة مرور خاطئة");
    }
}
function openEmail() {
    // نستخدم window.open مع _blank لضمان الخروج من إطار الموقع
    window.open("mailto:3dworkben@gmail.com?subject=استفسار ", "_blank");
}
// دالة فتح وإغلاق نافذة الانخراط
function toggleMembership() {
    const modal = document.getElementById('membershipModal');
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
}

// دالة إرسال بيانات المنخرط للواتساب
function submitMembership() {
    const name = document.getElementById('memberName').value;
    const age = document.getElementById('memberAge').value;


    if (!name || !age ) {
        alert("المرجو ملء جميع الخانات (الاسم، العمر، )");
        return;
    }

    const message = `طلب انخراط جديد في جمعية شباب بوعسل:
📝 الاسم: ${name}
🎂 العمر: ${age} سنة
---
أرغب في الانخراط والاستفادة من أنشطة الجمعية والتدريبات الأسبوعية.`;

    // استبدل الرقم برقمك الخاص
    const whatsappUrl = `https://wa.me/212617094811?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
// دالة لتفعيل أو تعطيل زر الإرسال بناءً على خانة الإقرار
function toggleSubmitButton() {
    const checkbox = document.getElementById('confirmCheckbox');
    const submitBtn = document.getElementById('finalConfirmBtn');
    
    if (checkbox.checked) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
    }
}

let deferredPrompt;
const installContainer = document.getElementById('installContainer');
const btnInstall = document.getElementById('btnInstall');

// الاستماع لحدث التثبيت التلقائي ومنعه مؤقتاً
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // منع المتصفح من إظهار رسالته الخاصة
    deferredPrompt = e;  // حفظ الحدث لاستخدامه عند ضغط الزر
    
    // إظهار الزر الخاص بنا للمستخدم
    installContainer.style.display = 'block';
});

// تنفيذ التثبيت عند الضغط على الزر
btnInstall.addEventListener('click', (e) => {
    // إخفاء الزر بعد الضغط
    installContainer.style.display = 'none';
    
    // إظهار نافذة التثبيت الأصلية
    deferredPrompt.prompt();
    
    // معرفة اختيار المستخدم (وافق أم رفض)
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
    });
});

// إخفاء الزر إذا تم تثبيت التطبيق بنجاح
window.addEventListener('appinstalled', (evt) => {
    installContainer.style.display = 'none';
    console.log('App was successfully installed');
});
/* 1. الحل البرمجي: التحديث التلقائي لمنع تضارب الحجوزات */
// يقوم هذا الكود بسؤال "جوجل شيت" عن أي حجز جديد كل 30 ثانية
setInterval(() => {
    console.log("جاري تحديث الحجوزات لتجنب التضارب بين المستخدمين...");
    if (typeof loadExistingBookings === 'function') {
        loadExistingBookings(); 
    }
}, 30000); // 30000 ميلي ثانية تعني 30 ثانية

// دالة شاملة لجدولة 3 تنبيهات: فوري، قبل 5 ساعات، وقبل ساعة واحدة
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
            body: `موعدك في ملعب بوعسل يوم ${bookingDate} الساعة ${bookingHour}. ننتظرك!`,
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
                    reg.showNotification("⚽ ملعب بوعسل", {
                        body: message,
                        icon: "logo-512.png",
                        badge: "logo-512.png",
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

