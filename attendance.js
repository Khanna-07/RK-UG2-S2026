let currentSubject = "";
let selected = null; 
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let attendance = JSON.parse(localStorage.getItem("attendance")) || {};
let locks = JSON.parse(localStorage.getItem("attendanceLocks")) || { lastReset: Date.now(), lockedDays: [] };

// The list of "Base" subjects to show in the summary
const SUMMARY_SUBJECTS = ["ACS4", "AC", "CCN4", "EMTL", "FCOMM", "LR4"];

const slots = {
    "ACS4": { 1: ["08:45-09:45"], 3: ["08:45-09:45"] },
    "AC": { 2: ["08:45-09:45", "15:15-16:15"], 5: ["11:00-12:00"] },
    "AC Lab": { 3: ["11:00-13:00"] },
    "CCN4": { 1: ["11:00-12:00"], 2: ["09:45-10:45"], 4: ["14:15-15:15"], 5: ["15:15-16:15"] },
    "EMTL": { 1: ["12:00-13:00"], 2: ["14:15-15:15"], 3: ["09:45-10:45"], 4: ["15:15-16:15"] },
    "FCOMM": { 2: ["16:30-17:30"], 4: ["11:00-12:00"], 5: ["12:00-13:00"] },
    "FCOMM Lab": { 1: ["14:15-16:15"] },
    "LR4": { 4: ["08:45-10:45"] }
};

window.onload = updateGlobalBox;

function formatTo12Hr(timeRange) {
    const startTime = timeRange.split('-')[0];
    let [hours, minutes] = startTime.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// THE UPDATED COMBINED SUMMARY LOGIC
function updateGlobalBox() {
    const box = document.getElementById("global-breakdown");
    if (!box) return;
    box.innerHTML = "";

    SUMMARY_SUBJECTS.forEach(sub => {
        let p = 0, a = 0;

        // Function to tally from a specific subject key
        const tally = (name) => {
            if (attendance[name]) {
                Object.values(attendance[name]).forEach(day => {
                    Object.values(day).forEach(record => {
                        if (record.present) p++;
                        if (record.absent) a++;
                    });
                });
            }
        };

        // Tally main subject
        tally(sub);
        // Automatically check if a "Lab" version exists and tally it too
        tally(sub + " Lab");

        let total = p + a;
        let perc = total ? ((p / total) * 100).toFixed(0) : "0";

        const row = document.createElement("div");
        row.className = "sub-row";
        row.innerHTML = `<span>${sub} - </span><span class="sub-stat" style="color:#ffffff;">${perc}%</span>`;
        box.appendChild(row);
    });
}

// ... (Keep openDayView, renderDayTimeline, dayMark, openAttendance, renderCalendar, updateSummary exactly as provided in previous version)

function openDayView(dayIdx) {
    document.getElementById("dayModal").classList.remove("hidden");
    renderDayTimeline(dayIdx);
}

function renderDayTimeline(dayIdx) {
    const box = document.getElementById("dayTimeline");
    const area = document.getElementById("lockActionArea");
    box.innerHTML = "";
    const iso = new Date().toISOString().split('T')[0];
    const isLocked = locks.lockedDays.includes(dayIdx);

    let classesToday = [];
    Object.entries(slots).forEach(([sub, dayMap]) => {
        if (dayMap[dayIdx]) dayMap[dayIdx].forEach(t => classesToday.push({ sub, t }));
    });

    classesToday.sort((a, b) => a.t.localeCompare(b.t));

    classesToday.forEach(c => {
        const r = attendance[c.sub]?.[iso]?.[c.t] || {};
        const div = document.createElement("div");
        div.className = `day-slot ${isLocked ? 'is-locked' : ''} ${r.present?'present-day':r.absent?'absent-day':r.cancelled?'cancelled-day':''}`;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="font-size:16px;">${c.sub}</b>
                <span class="room-tag">${formatTo12Hr(c.t)}</span>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <button class="present" style="flex:1;" onclick="dayMark('${c.sub}','${iso}','${c.t}','present',${dayIdx})">P</button>
                <button class="absent" style="flex:1;" onclick="dayMark('${c.sub}','${iso}','${c.t}','absent',${dayIdx})">A</button>
                <button class="cancel-btn" style="flex:1; margin-top:0;" onclick="dayMark('${c.sub}','${iso}','${c.t}','cancelled',${dayIdx})">C</button>
            </div>`;
        box.appendChild(div);
    });
    area.innerHTML = isLocked ? `<div class="locked-msg">🔒 Submissions Locked</div>` : `<button class="lock-btn" onclick="lockDay(${dayIdx})">LOCK FOR TODAY</button>`;
}

function dayMark(sub, date, time, type, dIdx) {
    attendance[sub] = attendance[sub] || {};
    attendance[sub][date] = attendance[sub][date] || {};
    attendance[sub][date][time] = { present: type==='present', absent: type==='absent', cancelled: type==='cancelled' };
    localStorage.setItem("attendance", JSON.stringify(attendance));
    renderDayTimeline(dIdx); 
    updateGlobalBox();
}

function openAttendance(sub) {
    currentSubject = sub; selected = null;
    document.getElementById("modalTitle").innerText = sub;
    document.getElementById("attendanceModal").classList.remove("hidden");
    renderCalendar(); updateSummary();
}

function renderCalendar() {
    const cal = document.getElementById("calendar");
    cal.innerHTML = "";
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("monthLabel").innerText = `${MONTHS[currentMonth]} ${currentYear}`;
    const startDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
        const b = document.createElement("div"); b.className = "calendar-cell"; b.style.opacity = "0";
        cal.appendChild(b);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(currentYear, currentMonth, d).getDay();
        const cell = document.createElement("div");
        cell.className = "calendar-cell";
        cell.innerHTML = `<div>${d}</div>`;

        const scheduled = slots[currentSubject][dow] || [];
        const times = new Set(scheduled);
        if (attendance[currentSubject]?.[iso]) Object.keys(attendance[currentSubject][iso]).forEach(t => times.add(t));

        times.forEach(t => {
            const s = document.createElement("div");
            s.className = "cal-slot";
            const r = attendance[currentSubject]?.[iso]?.[t];
            if (r?.present) s.classList.add("present-day");
            else if (r?.absent) s.classList.add("absent-day");
            else if (r?.cancelled) s.classList.add("cancelled-day");
            s.innerText = t;
            if (selected?.date === iso && selected?.time === t) s.style.border = "2px solid white";
            s.onclick = (e) => { e.stopPropagation(); selected = { date: iso, time: t }; renderCalendar(); };
            cell.appendChild(s);
        });
        cal.appendChild(cell);
    }
}

function updateSummary() {
    let p = 0, a = 0;
    if (attendance[currentSubject]) {
        Object.values(attendance[currentSubject]).forEach(d => Object.values(d).forEach(r => { if(r.present) p++; if(r.absent) a++; }));
    }
    const total = p + a;
    const perc = total ? ((p/total)*100).toFixed(1) : "0.0";
    let targetMsg = perc < 75 ? `Need ${Math.ceil((0.75*total-p)/0.25)} more for 75%` : `Safe to skip ${Math.floor((p-0.75*total)/0.75)} classes`;

    document.getElementById("summary").innerHTML = `
        <div class="stat-box"><div>P</div><div style="font-size:18px;">${p}</div></div>
        <div class="stat-box"><div>A</div><div style="font-size:18px;">${a}</div></div>
        <div class="stat-box" style="grid-column: span 2;">
            <div style="font-size:22px; font-weight:900;">${perc}%</div>
            <div style="font-size:10px; opacity:0.7;">${targetMsg}</div>
        </div>`;
}

function markStatus(type) {
    if (!selected) return;
    attendance[currentSubject] = attendance[currentSubject] || {};
    attendance[currentSubject][selected.date] = attendance[currentSubject][selected.date] || {};
    attendance[currentSubject][selected.date][selected.time] = { present: type==='present', absent: type==='absent', cancelled: type==='cancelled' };
    localStorage.setItem("attendance", JSON.stringify(attendance));
    renderCalendar(); updateSummary(); updateGlobalBox();
}

function lockDay(dIdx) { if(confirm("Lock marks?")) { locks.lockedDays.push(dIdx); localStorage.setItem("attendanceLocks", JSON.stringify(locks)); renderDayTimeline(dIdx); } }
function closeModal() { document.getElementById("attendanceModal").classList.add("hidden"); }
function closeDayModal() { document.getElementById("dayModal").classList.add("hidden"); }
function prevMonth() { currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--} renderCalendar(); }
function nextMonth() { currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++} renderCalendar(); }
function clearAllMarks() { if(confirm("Reset subject?")){ delete attendance[currentSubject]; localStorage.setItem("attendance", JSON.stringify(attendance)); renderCalendar(); updateSummary(); updateGlobalBox(); }}