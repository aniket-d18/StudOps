/* StudOps - Main Application Script (Premium Dark UI)
   StudentIQ  Main Application Script (Premium Dark UI)
    */

const API = "/api";

//  State 
let currentPage  = 1;
let pageLimit    = 25;
let sortField    = "roll_no";
let sortOrder    = "asc";
let deleteTargetId = null;
let chartInstances = {};

//  Chart.js global dark defaults 
Chart.defaults.color = "#94a3b8";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15,23,42,0.95)";
Chart.defaults.plugins.tooltip.borderColor = "rgba(99,102,241,0.3)";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.titleColor = "#f1f5f9";
Chart.defaults.plugins.tooltip.bodyColor = "#94a3b8";
Chart.defaults.plugins.legend.labels.color = "#94a3b8";
Chart.defaults.plugins.legend.labels.padding = 16;

//  Auth guard 
if (!localStorage.getItem("user")) {
  window.location.href = "login.html";
}
const userName = localStorage.getItem("user") || "Admin";
document.getElementById("welcomeUser").textContent = userName;
const avatar = document.getElementById("userAvatar");
if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();

// 
// TOAST NOTIFICATIONS
// 
function toast(message, type = "success") {
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type] || ""}<span style="flex:1">${message}</span><button class="toast-close" onclick="this.parentElement.remove()"></button>`;
  container.appendChild(el);
  setTimeout(() => { el.style.animation = "slideIn .3s ease reverse forwards"; setTimeout(() => el.remove(), 300); }, 4700);
}

// 
// PAGE NAVIGATION
// 
document.querySelectorAll("[data-page]").forEach((link) => {
  link.addEventListener("click", (e) => { e.preventDefault(); switchPage(link.dataset.page); });
});

function switchPage(page) {
  document.querySelectorAll("[data-page]").forEach((l) => l.classList.remove("active"));
  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add("active");

  document.querySelectorAll("main > section").forEach((s) => s.classList.add("hidden"));
  const sec = document.getElementById(`page-${page}`);
  if (sec) sec.classList.remove("hidden");

  const titles = { dashboard: "Dashboard", students: "Students", analytics: "Analytics" };
  document.getElementById("pageTitle").textContent = titles[page] || page;

  if (page === "dashboard") loadDashboard();
  if (page === "students")  loadStudents();
  if (page === "analytics") loadAnalytics();

  // Close sidebar on mobile
  document.getElementById("sidebar").classList.remove("open");
  const overlay = document.getElementById("sidebarOverlay");
  if (overlay) overlay.classList.remove("active");
}

// Hamburger toggle
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
  const overlay = document.getElementById("sidebarOverlay");
  if (overlay) overlay.classList.toggle("active");
});
const overlay = document.getElementById("sidebarOverlay");
if (overlay) overlay.addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("open");
  overlay.classList.remove("active");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try { await fetch(`${API}/logout`, { method: "POST", credentials: "include" }); } catch (_) {}
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

// 
// HELPERS
// 
function gradeBadge(grade) {
  const cls = { A: "badge-a", B: "badge-b", C: "badge-c", Fail: "badge-fail" }[grade] || "badge-c";
  return `<span class="badge ${cls}">${grade}</span>`;
}

function statusBadge(status) {
  return `<span class="badge ${status === "Safe" ? "badge-safe" : "badge-risk"}">${status}</span>`;
}

function progressBar(value) {
  const cls = value >= 75 ? "green" : value >= 50 ? "orange" : "red";
  return `<div class="flex items-center gap-sm">
    <span style="width:28px;font-family:var(--font-mono);font-size:.8rem;color:var(--color-text)">${value}</span>
    <div class="progress"><div class="progress-fill ${cls}" style="width:${value}%"></div></div>
  </div>`;
}

function destroyChart(id) {
  // Destroy Chart.js instance
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
  // Destroy RadialProgressChart instance
  if (window._radialCharts && window._radialCharts[id]) {
    window._radialCharts[id].destroy();
    delete window._radialCharts[id];
  }
}

// Animated counter
function animateCounter(el, target, suffix = "", duration = 900) {
  const start = performance.now();
  const from = 0;
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
    const current = Math.round(from + (target - from) * eased);
    el.textContent = current + suffix;
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 
// DASHBOARD  defined below (patched version with stat pills)
// 
async function loadDashboard() {
  try {
    const [dashRes, analyticsRes] = await Promise.all([
      fetch(`${API}/dashboard`),
      fetch(`${API}/analytics`),
    ]);
    const data    = await dashRes.json();
    const analytics = await analyticsRes.json();

    //  Metric cards 
    const metricDefs = [
      {
        color: "blue", value: data.total, suffix: "", label: "Total Students", sub: "Enrolled",
        icon: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      },
      {
        color: "green", value: data.avg_marks, suffix: "%", label: "Average Marks", sub: "Class average",
        icon: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
      },
      {
        color: "red", value: data.at_risk_count, suffix: "", label: "At-Risk Students", sub: "Need attention",
        icon: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
      },
      {
        color: "orange", value: data.avg_attendance, suffix: "%", label: "Avg Attendance", sub: data.avg_attendance >= 75 ? "Good standing" : "Needs improvement",
        icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
      },
    ];

    document.getElementById("metricCards").innerHTML = metricDefs.map((m, i) => `
      <div class="metric-card" style="animation-delay:${i * 0.08}s">
        <div class="metric-icon ${m.color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${m.icon}</svg>
        </div>
        <div class="metric-info">
          <div class="metric-label">${m.label}</div>
          <div class="metric-value" data-target="${m.value}" data-suffix="${m.suffix}">0${m.suffix}</div>
          <div class="metric-sub">${m.sub}</div>
        </div>
      </div>
    `).join("");

    // Animate counters after DOM insertion
    document.querySelectorAll(".metric-value[data-target]").forEach((el) => {
      animateCounter(el, parseFloat(el.dataset.target), el.dataset.suffix);
    });

    //  Topper card 
    const tc = document.getElementById("topperCard");
    if (data.topper) {
      const initials = data.topper.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      tc.innerHTML = `
        <div class="topper-card anim-in">
          <div class="topper-avatar">${initials}</div>
          <div class="topper-info">
            <div class="topper-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Class Topper
            </div>
            <div class="topper-name">${data.topper.name}</div>
          </div>
          <div class="topper-score">${data.topper.marks}<span>/100</span></div>
        </div>`;
    }

    // Update at-risk badge
    const arb = document.getElementById("atRiskBadge");
    if (arb && data.at_risk_count > 0) arb.textContent = `${data.at_risk_count} at risk`;

    // Pass/Fail — RadialProgressChart (Apple Fitness style)
    const pfPassRate = data.total > 0 ? Math.round((data.pass_count / data.total) * 100) : 0;
    const pfFailRate = data.total > 0 ? Math.round((data.fail_count / data.total) * 100) : 0;
    if (!window._radialCharts) window._radialCharts = {};
    destroyChart("passfailChart");
    window._radialCharts["passfailChart"] = new RadialProgressChart(
      document.getElementById("passfailChart"), {
        values: [
          data.total > 0 ? (data.pass_count || 0) / data.total : 0,
          data.total > 0 ? (data.fail_count || 0) / data.total : 0,
        ],
        colors: [
          ['#14b8a6', '#0ea5e9'],
          ['#fb7185', '#f43f5e'],
        ],
        labels: [`Pass (${pfPassRate}%)`, `Fail (${pfFailRate}%)`],
        centerValue: `${pfPassRate}%`,
        centerLabel: 'Pass Rate',
      }
    );

    //  Grade Distribution  clay bar with canvas-aware gradients 
    const gd = analytics.grade_distribution;
    const gradeData = [gd["A"] || 0, gd["B"] || 0, gd["C"] || 0, gd["Fail"] || 0];
    const gradeColors = ["rgba(134,239,172", "rgba(20,184,166", "rgba(251,191,36", "rgba(251,113,133"];
    destroyChart("gradeChart");
    chartInstances["gradeChart"] = new Chart(document.getElementById("gradeChart"), {
      type: "bar",
      data: {
        labels: ["A", "B", "C", "Fail"],
        datasets: [{
          label: "Students", data: gradeData,
          backgroundColor: gradeColors.map(c => (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return `${c},.7)`;
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, `${c},.9)`); g.addColorStop(1, `${c},.04)`);
            return g;
          }),
          borderColor: gradeColors.map(c => `${c},.7)`),
          borderWidth: 1.5, borderRadius: 24, borderSkipped: false, barThickness: 44,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: "#64748b", precision: 0 }, grid: { color: "rgba(255,255,255,0.04)", drawBorder: false } },
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
        },
        animation: { duration: 1000, easing: "easeOutQuart" },
      },
    });

    //  At-risk table 
    const tbody = document.getElementById("atRiskBody");
    if (!data.at_risk_students.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:28px;color:var(--color-text-secondary)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="1.5" style="margin:0 auto 8px"><polyline points="20 6 9 17 4 12"/></svg>
        <div>No at-risk students!</div></td></tr>`;
    } else {
      tbody.innerHTML = data.at_risk_students.map((s) => `
        <tr>
          <td style="font-family:var(--font-mono);font-weight:600;color:var(--color-text-secondary)">${s.roll_no}</td>
          <td style="font-weight:500">${s.name}</td>
          <td>${progressBar(s.marks)}</td>
          <td><span class="badge ${s.attendance >= 75 ? 'badge-safe' : 'badge-risk'}">${s.attendance}%</span></td>
          <td>${statusBadge(s.status)}</td>
        </tr>`).join("");
    }

  } catch (err) {
    toast("Failed to load dashboard", "error");
    console.error(err);
  }

  //  Stat pills + nav count 
  try {
    const statsRes = await fetch(`${API}/dashboard`);
    const statsData = await statsRes.json();
    const passRate = statsData.total > 0 ? Math.round(((statsData.pass_count||0) / statsData.total) * 100) : 0;
    const riskPct  = statsData.total > 0 ? Math.round(((statsData.at_risk_count||0) / statsData.total) * 100) : 0;
    const statRow = document.getElementById("statRow");
    if (statRow) statRow.innerHTML = `
      <div class="stat-pill">
        <div class="stat-pill-icon" style="background:rgba(20,184,166,.12)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div><div class="stat-pill-val">${passRate}%</div><div class="stat-pill-lbl">Pass Rate</div></div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-icon" style="background:rgba(251,113,133,.12)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
        </div>
        <div><div class="stat-pill-val">${riskPct}%</div><div class="stat-pill-lbl">At-Risk Rate</div></div>
      </div>
      <div class="stat-pill">
        <div class="stat-pill-icon" style="background:rgba(129,140,248,.12)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div><div class="stat-pill-val">${statsData.avg_attendance}%</div><div class="stat-pill-lbl">Avg Attendance</div></div>
      </div>`;
    const nc = document.getElementById("navStudentCount");
    if (nc && statsData.total > 0) nc.textContent = statsData.total;
  } catch(_) {}
}

// 
// STUDENTS (CRUD + TABLE)
// 
async function loadStudents() {
  const params = new URLSearchParams({
    page: currentPage, limit: pageLimit,
    search: document.getElementById("searchInput").value,
    grade: document.getElementById("filterGrade").value,
    status: document.getElementById("filterStatus").value,
    attendance: document.getElementById("filterAttendance").value,
    sort: sortField, order: sortOrder,
  });

  try {
    const res  = await fetch(`${API}/students?${params}`);
    const data = await res.json();
    const tbody = document.getElementById("studentsBody");

    if (!data.students.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:48px;color:var(--color-text-secondary)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;opacity:.4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        <div style="font-weight:600;margin-bottom:4px">No students found</div>
        <div style="font-size:.82rem">Click "Add Student" to get started</div>
      </td></tr>`;
    } else {
      tbody.innerHTML = data.students.map((s, i) => `
        <tr style="animation:fadeInUp .3s ease both;animation-delay:${i * 0.04}s">
          <td style="font-family:var(--font-mono);font-weight:600;color:var(--color-text-secondary)">${s.roll_no}</td>
          <td style="font-weight:500;color:var(--color-text)">${s.name}</td>
          <td>${progressBar(s.marks)}</td>
          <td><span class="badge ${s.attendance >= 75 ? 'badge-safe' : 'badge-risk'}">${s.attendance}%</span></td>
          <td>${gradeBadge(s.grade)}</td>
          <td>${statusBadge(s.status)}</td>
          <td class="text-right">
            <div class="table-actions" style="justify-content:flex-end">
              <button class="btn btn-icon btn-ghost" onclick="editStudent('${s._id}')" title="Edit" style="color:var(--color-primary-light)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-icon btn-ghost" onclick="confirmDeleteStudent('${s._id}','${s.name.replace(/'/g,"\\'")}') " title="Delete" style="color:var(--color-error)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join("");
    }

    // Pagination
    const start = (data.page - 1) * data.limit + 1;
    const end   = Math.min(data.page * data.limit, data.total);
    document.getElementById("paginationInfo").textContent = data.total ? `Showing ${start}–${end} of ${data.total}` : "";

    let html = `<button ${data.page <= 1 ? "disabled" : ""} onclick="goPage(${data.page - 1})">&lsaquo;</button>`;
    for (let i = 1; i <= data.pages; i++) {
      html += `<button class="${i === data.page ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button ${data.page >= data.pages ? "disabled" : ""} onclick="goPage(${data.page + 1})">&rsaquo;</button>`;
    document.getElementById("paginationBtns").innerHTML = html;

  } catch (err) { toast("Failed to load students", "error"); }
}

function goPage(p) { currentPage = p; loadStudents(); }

let searchTimer;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadStudents(); }, 320);
});
["filterGrade","filterStatus","filterAttendance"].forEach((id) =>
  document.getElementById(id).addEventListener("change", () => { currentPage = 1; loadStudents(); })
);
document.querySelectorAll("thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const field = th.dataset.sort;
    if (sortField === field) sortOrder = sortOrder === "asc" ? "desc" : "asc";
    else { sortField = field; sortOrder = "asc"; }
    document.querySelectorAll("thead th").forEach((t) => t.classList.remove("active"));
    th.classList.add("active");
    th.querySelector(".sort-arrow").innerHTML = sortOrder === "asc" ? "&#9650;" : "&#9660;";
    loadStudents();
  });
});

//  MODAL 
const studentModal = document.getElementById("studentModal");
const studentForm  = document.getElementById("studentForm");

function openModal(title = "Add New Student") {
  document.getElementById("modalTitle").textContent = title;
  studentModal.classList.add("active");
  setTimeout(() => document.getElementById("sName").focus(), 100);
}
function closeModal() {
  studentModal.classList.remove("active");
  studentForm.reset();
  document.getElementById("sId").value = "";
  document.getElementById("previewGrade").textContent = "";
  document.getElementById("previewStatus").textContent = "";
  ["errName","errRoll","errMarks","errAtt"].forEach((id) => document.getElementById(id).textContent = "");
}

document.getElementById("addStudentBtn").addEventListener("click", () => openModal("Add New Student"));
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalCancel").addEventListener("click", closeModal);
studentModal.addEventListener("click", (e) => { if (e.target === studentModal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeConfirm(); } });

// Live grade/status preview
function updatePreview() {
  const marks = parseInt(document.getElementById("sMarks").value) || 0;
  const att   = parseInt(document.getElementById("sAttendance").value) || 0;
  let grade, cls;
  if (marks >= 90)      { grade = "A"; cls = "badge-a"; }
  else if (marks >= 75) { grade = "B"; cls = "badge-b"; }
  else if (marks >= 50) { grade = "C"; cls = "badge-c"; }
  else                  { grade = "Fail"; cls = "badge-fail"; }
  const pg = document.getElementById("previewGrade");
  pg.textContent = grade; pg.className = `badge ${cls}`;
  const status = (marks < 50 || att < 75) ? "At Risk" : "Safe";
  const ps = document.getElementById("previewStatus");
  ps.textContent = status; ps.className = `badge ${status === "Safe" ? "badge-safe" : "badge-risk"}`;
}
document.getElementById("sMarks").addEventListener("input", updatePreview);
document.getElementById("sAttendance").addEventListener("input", updatePreview);

// Save
document.getElementById("modalSave").addEventListener("click", async () => {
  const name       = document.getElementById("sName").value.trim();
  const roll_no    = document.getElementById("sRoll").value;
  const marks      = document.getElementById("sMarks").value;
  const attendance = document.getElementById("sAttendance").value;
  const editId     = document.getElementById("sId").value;

  let valid = true;
  const set = (id, msg) => { document.getElementById(id).textContent = msg; if (msg) valid = false; };
  set("errName",  !name || name.length < 2 ? "Name required (min 2 chars)" : "");
  set("errRoll",  !roll_no || roll_no < 1   ? "Valid roll number required" : "");
  set("errMarks", marks === "" || marks < 0 || marks > 100 ? "Marks must be 0100" : "");
  set("errAtt",   attendance === "" || attendance < 0 || attendance > 100 ? "Attendance must be 0100" : "");
  if (!valid) return;

  const btn = document.getElementById("modalSave");
  btn.disabled = true; btn.textContent = "Saving";

  try {
    const url    = editId ? `${API}/students/${editId}` : `${API}/students`;
    const method = editId ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ name, roll_no: parseInt(roll_no), marks: parseInt(marks), attendance: parseInt(attendance) }) });
    const data = await res.json();
    if (!res.ok) { toast(data.error || "Failed to save", "error"); return; }
    toast(editId ? "Student updated!" : "Student added successfully!", "success");
    closeModal(); loadStudents();
  } catch { toast("Network error", "error"); }
  finally { btn.disabled = false; btn.textContent = "Save Student"; }
});

// Edit
async function editStudent(id) {
  try {
    const res = await fetch(`${API}/students/${id}`);
    const s   = await res.json();
    document.getElementById("sId").value         = s._id;
    document.getElementById("sName").value       = s.name;
    document.getElementById("sRoll").value       = s.roll_no;
    document.getElementById("sMarks").value      = s.marks;
    document.getElementById("sAttendance").value = s.attendance;
    updatePreview(); openModal("Edit Student");
  } catch { toast("Failed to load student", "error"); }
}

// Delete confirm
const confirmModal = document.getElementById("confirmModal");
function confirmDeleteStudent(id, name) {
  deleteTargetId = id;
  document.getElementById("delName").textContent = name;
  confirmModal.classList.add("active");
}
function closeConfirm() { confirmModal.classList.remove("active"); deleteTargetId = null; }
document.getElementById("confirmClose").addEventListener("click", closeConfirm);
document.getElementById("confirmCancel").addEventListener("click", closeConfirm);
confirmModal.addEventListener("click", (e) => { if (e.target === confirmModal) closeConfirm(); });

document.getElementById("confirmDelete").addEventListener("click", async () => {
  if (!deleteTargetId) return;
  const btn = document.getElementById("confirmDelete");
  btn.disabled = true; btn.textContent = "Deleting";
  try {
    const res = await fetch(`${API}/students/${deleteTargetId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { toast("Student deleted", "warning"); closeConfirm(); loadStudents(); }
    else toast("Delete failed", "error");
  } catch { toast("Network error", "error"); }
  finally { btn.disabled = false; btn.textContent = "Delete"; }
});

// Export
document.getElementById("exportBtn").addEventListener("click", async () => {
  try {
    const res  = await fetch(`${API}/export`, { method: "POST", credentials: "include" });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "students_export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported!", "success");
  } catch { toast("Export failed", "error"); }
});

// 
// ANALYTICS
// 
async function loadAnalytics() {
  try {
    const res  = await fetch(`${API}/analytics`);
    const data = await res.json();

    // Marks Distribution  canvas-aware gradient callback
    destroyChart("marksDistChart");
    const mdCanvas = document.getElementById("marksDistChart");
    chartInstances["marksDistChart"] = new Chart(mdCanvas, {
      type: "bar",
      data: {
        labels: data.marks_distribution.map((b) => b.range),
        datasets: [{
          label: "Students",
          data: data.marks_distribution.map((b) => b.count),
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "rgba(129,140,248,.7)";
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(129,140,248,.95)");
            g.addColorStop(1, "rgba(129,140,248,.05)");
            return g;
          },
          borderColor: "rgba(129,140,248,.8)",
          borderWidth: 1.5, borderRadius: 20, borderSkipped: false, barThickness: 36,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.raw} student${c.raw !== 1 ? "s" : ""}` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: "#64748b", precision: 0 }, grid: { color: "rgba(255,255,255,0.04)", drawBorder: false } },
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
        },
        animation: { duration: 1000, easing: "easeOutQuart" },
      },
    });
    // Risk Breakdown — RadialProgressChart (4 concentric rings)
    const rb = data.risk_breakdown;
    const riskTotal = (rb.safe||0) + (rb.low_marks||0) + (rb.low_attendance||0) + (rb.both||0);
    destroyChart("riskChart");
    window._radialCharts["riskChart"] = new RadialProgressChart(
      document.getElementById("riskChart"), {
        values: [
          riskTotal > 0 ? (rb.safe||0) / riskTotal : 0,
          riskTotal > 0 ? (rb.low_marks||0) / riskTotal : 0,
          riskTotal > 0 ? (rb.low_attendance||0) / riskTotal : 0,
          riskTotal > 0 ? (rb.both||0) / riskTotal : 0,
        ],
        colors: [
          ['#14b8a6', '#06b6d4'],
          ['#fb7185', '#f43f5e'],
          ['#fbbf24', '#f59e0b'],
          ['#c084fc', '#a855f7'],
        ],
        labels: [
          `Safe (${rb.safe||0})`,
          `Low Marks (${rb.low_marks||0})`,
          `Low Att. (${rb.low_attendance||0})`,
          `Both (${rb.both||0})`,
        ],
        centerValue: rb.safe || 0,
        centerLabel: 'Safe',
      }
    );


    // Scatter: Marks vs Attendance  clay points
    destroyChart("scatterChart");
    chartInstances["scatterChart"] = new Chart(document.getElementById("scatterChart"), {
      type: "scatter",
      data: {
        datasets: [
          { label: "Safe", data: data.scatter.filter(s => s.status === "Safe").map(s => ({ x: s.attendance, y: s.marks })),
            backgroundColor: "rgba(20,184,166,.75)", pointRadius: 7, pointHoverRadius: 10, pointBorderWidth: 0 },
          { label: "At Risk", data: data.scatter.filter(s => s.status === "At Risk").map(s => ({ x: s.attendance, y: s.marks })),
            backgroundColor: "rgba(251,113,133,.75)", pointRadius: 7, pointHoverRadius: 10, pointBorderWidth: 0 },
        ],
      },
      options: { responsive: true,
        scales: {
          x: { title: { display: true, text: "Attendance %", color: "#64748b" }, min: 0, max: 100, grid: { color: "rgba(255,255,255,0.04)", drawBorder: false }, ticks: { color: "#64748b" } },
          y: { title: { display: true, text: "Marks", color: "#64748b" }, min: 0, max: 100, grid: { color: "rgba(255,255,255,0.04)", drawBorder: false }, ticks: { color: "#64748b" } },
        },
        plugins: { legend: { position: "bottom", labels: { usePointStyle: true, color: "#94a3b8" } } },
        animation: { duration: 900, easing: "easeOutQuart" } },
    });

    // Top & Bottom performers
    const rankColors = ["#fbbf24","#94a3b8","#cd7c2f"];
    function performerList(students, colorFn) {
      return students.map((s, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
          <span style="width:22px;height:22px;border-radius:50%;background:${colorFn(i)};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#0f172a;flex-shrink:0">${i+1}</span>
          <span style="flex:1;font-weight:500;font-size:.85rem;color:var(--color-text)">${s.name}</span>
          <span style="font-family:var(--font-mono);font-size:.85rem;font-weight:700;color:var(--color-primary-light)">${s.marks}</span>
        </div>`).join("");
    }
    const topColor    = (i) => i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2f" : "rgba(34,197,94,.3)";
    const bottomColor = () => "rgba(239,68,68,.25)";
    document.getElementById("topPerformers").innerHTML    = performerList(data.top_performers, topColor);
    document.getElementById("bottomPerformers").innerHTML = performerList(data.bottom_performers, bottomColor);

  } catch (err) { toast("Failed to load analytics", "error"); console.error(err); }
}

// Initial load is triggered at bottom of file by patched loadDashboard

// 
// THEME TOGGLE (Dark / Light)
// 
(function initTheme() {
  const saved = localStorage.getItem("siq-theme") || "dark";
  if (saved === "light") applyLight();
})();

function applyLight() {
  document.body.classList.add("light-mode");
  const d = document.getElementById("themeIconDark");
  const l = document.getElementById("themeIconLight");
  if (d) d.style.display = "none";
  if (l) l.style.display = "block";
}
function applyDark() {
  document.body.classList.remove("light-mode");
  const d = document.getElementById("themeIconDark");
  const l = document.getElementById("themeIconLight");
  if (d) d.style.display = "block";
  if (l) l.style.display = "none";
}

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-mode");
    localStorage.setItem("siq-theme", isLight ? "light" : "dark");
    if (isLight) applyLight(); else applyDark();
    toast(isLight ? "Switched to Light mode" : "Switched to Dark mode", "info");
  });
}

// 
// KEYBOARD SHORTCUTS
// 
document.addEventListener("keydown", (e) => {
  // Ctrl+N  Add student (when on students page)
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    const studentsPage = document.getElementById("page-students");
    if (studentsPage && !studentsPage.classList.contains("hidden")) {
      e.preventDefault();
      openModal("Add New Student");
    }
  }
  // Ctrl+F  Focus search (when on students page)
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    const studentsPage = document.getElementById("page-students");
    if (studentsPage && !studentsPage.classList.contains("hidden")) {
      e.preventDefault();
      const si = document.getElementById("searchInput");
      if (si) { si.focus(); si.select(); }
    }
  }
  // Ctrl+E  Export CSV
  if ((e.ctrlKey || e.metaKey) && e.key === "e") {
    const studentsPage = document.getElementById("page-students");
    if (studentsPage && !studentsPage.classList.contains("hidden")) {
      e.preventDefault();
      document.getElementById("exportBtn").click();
    }
  }
  // 1/2/3  Switch pages (no modifier, only when not typing)
  const tag = document.activeElement.tagName;
  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
    if (e.key === "1") switchPage("dashboard");
    if (e.key === "2") switchPage("students");
    if (e.key === "3") switchPage("analytics");
  }
});

// 
// SEARCH CLEAR BUTTON
// 
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
if (searchInput && searchClear) {
  searchInput.addEventListener("input", () => {
    searchClear.classList.toggle("visible", searchInput.value.length > 0);
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.classList.remove("visible");
    currentPage = 1;
    loadStudents();
    searchInput.focus();
  });
}

// 
// DASHBOARD REFRESH BUTTON
// 
const dashRefreshBtn = document.getElementById("dashRefreshBtn");
if (dashRefreshBtn) {
  dashRefreshBtn.addEventListener("click", async () => {
    dashRefreshBtn.classList.add("spinning");
    await loadDashboard();
    setTimeout(() => dashRefreshBtn.classList.remove("spinning"), 600);
    toast("Dashboard refreshed", "success");
  });
}

// 
// STAT PILLS & NAV COUNT  injected after dashboard load
// 
async function updateStatPills(data) {
  const passRate = data.total > 0 ? Math.round((data.pass_count / data.total) * 100) : 0;
  const riskPct  = data.total > 0 ? Math.round((data.at_risk_count / data.total) * 100) : 0;

  const statRow = document.getElementById("statRow");
  if (!statRow) return;
  statRow.innerHTML = `
    <div class="stat-pill">
      <div class="stat-pill-icon" style="background:rgba(34,197,94,.12)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <div class="stat-pill-val">${passRate}%</div>
        <div class="stat-pill-lbl">Pass Rate</div>
      </div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-icon" style="background:rgba(239,68,68,.12)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
      </div>
      <div>
        <div class="stat-pill-val">${riskPct}%</div>
        <div class="stat-pill-lbl">At-Risk Rate</div>
      </div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-icon" style="background:rgba(99,102,241,.12)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div>
        <div class="stat-pill-val">${data.avg_attendance}%</div>
        <div class="stat-pill-lbl">Avg Attendance</div>
      </div>
    </div>`;

  // Nav student count badge
  const navCount = document.getElementById("navStudentCount");
  if (navCount && data.total > 0) navCount.textContent = data.total;
}

// 
// INITIAL LOAD
// 
loadDashboard();
