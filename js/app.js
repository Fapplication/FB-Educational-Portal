// ============================================================
//  js/app.js  –  App Shell: Routing, UI Helpers, Init
// ============================================================

// ── PAGE NAVIGATION ─────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");
  // Close sidebar on mobile when navigating
  closeSidebar();
}

// ── SIDEBAR (MOBILE) ─────────────────────────────────────────
function toggleSidebar() {
  const activeSidebar = document.querySelector(".sidebar:not([style*='none'])");
  if (activeSidebar) activeSidebar.classList.toggle("open");
}

function closeSidebar() {
  document.querySelectorAll(".sidebar").forEach(s => s.classList.remove("open"));
}

// Close sidebar when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".sidebar") && !e.target.closest(".hamburger")) {
    closeSidebar();
  }
});

// ── TOAST NOTIFICATIONS ──────────────────────────────────────
let _toastTimer = null;
function showToast(msg, duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add("hidden"), duration);
}

// ── LOADER ──────────────────────────────────────────────────
function showLoader() { document.getElementById("loader").classList.remove("hidden"); }
function hideLoader() { document.getElementById("loader").classList.add("hidden"); }

// ── SESSION RESTORE ─────────────────────────────────────────
(function restoreSession() {
  const student    = Session.student.get();
  const instructor = Session.instructor.get();

  if (student) {
    initStudentDashboard(student);
    showPage("student-dashboard");
  } else if (instructor) {
    initInstructorDashboard();
    showPage("instructor-dashboard");
  } else {
    showPage("landing-page");
  }
})();

// ── KEYBOARD SHORTCUTS ───────────────────────────────────────
document.addEventListener("keydown", (e) => {
  // Escape: close sidebar on mobile
  if (e.key === "Escape") closeSidebar();
});

// ── PREVENT FORM SUBMIT ON ENTER (inputs) ───────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT") {
    // Find the nearest button to click
    const card = e.target.closest(".auth-card, .inline-form");
    if (card) {
      const btn = card.querySelector(".btn-full, .btn-accent");
      if (btn) btn.click();
    }
  }
});

// ── FAVICON (inline SVG) ─────────────────────────────────────
// Creates a simple favicon programmatically
(function setFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="%230b0f1a" stroke="%2300d4aa" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="%2300d4aa" font-family="sans-serif">E</text></svg>`;
  const link = document.createElement("link");
  link.rel   = "icon";
  link.type  = "image/svg+xml";
  link.href  = "data:image/svg+xml," + svg;
  document.head.appendChild(link);
})();

console.log(`
%cEduPortal v${CONFIG.VERSION}
%cCivil Engineering Department – Student Management System
%cDeveloped with ❤ for Ethiopian universities
`, "color:#00d4aa;font-size:1.2rem;font-weight:bold", "color:#8fa3c0;font-size:.9rem", "color:#4a6080;font-size:.8rem");
