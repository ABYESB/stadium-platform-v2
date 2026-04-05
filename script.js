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
    const dateDisplay = document.getElementById('dateDisplay');
    if (!tableBody || !headerRow) return;

    tableBody.innerHTML = '';
    headerRow.innerHTML = '<th>الساعة</th>';
    const daysArr = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDate);
        d.setDate(d.getDate() + i);
        headerRow.innerHTML += `<th>${daysArr[i]}<br><small>${d.getDate()}/${d.getMonth()+1}</small></th>`;
    }

    dateDisplay.innerText = currentStartDate.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });

    for (let hour = 8; hour <= 23; hour++) {
        let row = `<tr><td class="time-cell">${hour}:00</td>`;
        for (let day = 0; day < 7; day++) {
            let d = new Date(currentStartDate);
            d.setDate(d.getDate() + day);
            let dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
            row += `<td class="slot" data-date="${dateStr}" data-hour="${hour}:00" onclick="handleSlotSelection(this)">متاح</td>`;
        }
        row += `</tr>`;
        tableBody.innerHTML += row;
    }
    loadExistingBookings();
}

// 4. الدوال المساعدة (يجب وجودها ليعمل الجدول)
function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function handleSlotSelection(cell) {
    // هذه الدالة تفتح الـ Modal الخاص بالحجز
    const date = cell.getAttribute('data-date');
    const hour = cell.getAttribute('data-hour');
    alert(`لقد اخترت موعد: ${date} الساعة: ${hour}\nسيتم فتح نافذة التأكيد قريباً.`);
    // هنا يمكنك إضافة كود فتح الـ Modal (bookingModal)
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
