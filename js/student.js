// ============================================================
// AMBO UNIVERSITY PORTAL — Student Dashboard Logic
// ============================================================

const COURSES = [
  "Geometric Design of Road and Streets (CEng 3201)",
  "Transport Planning and Modeling (CEng 2901)"
];

const COURSE_SHORT = {
  "Geometric Design of Road and Streets (CEng 3201)": "CEng 3201",
  "Transport Planning and Modeling (CEng 2901)": "CEng 2901"
};

let currentUser = null;
let allMarks = [];
let currentExamCourse = "";
let examQuestions = [];
let currentQ = 0;
let answers = {};
let timerInterval = null;
let timerSecondsLeft = 900;

// ── Application Bootstrapper ────────────────────────────────
(function() {
  currentUser = getUser();
  if (!currentUser || currentUser.role === "admin") {
    window.location.href = "../index.html";
    return;
  }
  document.getElementById("sidebar-name").textContent = currentUser.name || currentUser.id;
  document.getElementById("topbar-name").textContent = currentUser.name || currentUser.id;
  const initials = (currentUser.name || "ST").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  document.getElementById("user-avatar").textContent = initials;
  loadOverview();
  loadNotes();
})();

// ── Component View Router ────────────────────────────────────
function showSection(name) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("section-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n => {
    if (n.getAttribute("onclick") && n.getAttribute("onclick").includes("'" + name + "'")) n.classList.add("active");
  });
  document.getElementById("page-title").textContent = {
    overview: "Dashboard", marks: "My Marks", exam: "Online Exam",
    notes: "Lecture Notes", complaint: "Grade Complaint", chatbot: "AI Assistant"
  }[name] || "Dashboard";

  if (name === "marks") loadMarksSection();
  if (name === "complaint") loadComplaintSection();
  if (name === "notes") loadNotes();
}

// ── Hydrate Analytical Overview ──────────────────────────────
async function loadOverview() {
  try {
    const result = await apiCall({ action: "getMarks", id: currentUser.id.toLowerCase() });
    allMarks = result.data || [];

    const enrolled = allMarks.length;
    const totalScore = allMarks.reduce((s, m) => s + parseFloat(m.total || 0), 0);
    const avg = enrolled > 0 ? (totalScore / enrolled).toFixed(1) : "0";
    const overallGrade = enrolled > 0 ? gradeOf(totalScore / enrolled) : "N/A";

    document.getElementById("stat-courses").textContent = enrolled;
    document.getElementById("stat-avg").textContent = avg + "%";
    document.getElementById("stat-grade").textContent = overallGrade;
    document.getElementById("stat-status").textContent = parseFloat(avg) >= 60 ? "Passing" : "At Risk";

    const perfList = document.getElementById("course-performance-list");
    if (allMarks.length === 0) {
      perfList.innerHTML = '<p class="muted-text">No academic marks published yet.</p>';
    } else {
      perfList.innerHTML = allMarks.map(m => `
        <div class="perf-row">
          <span class="perf-course">${COURSE_SHORT[m.subject] || m.subject}</span>
          <span class="perf-score">${m.total}/100</span>
          <span class="perf-grade" style="color:${gradeColor(m.grade)}">${m.grade}</span>
        </div>
      `).join("");
    }
  } catch(e) {
    document.getElementById("stat-courses").textContent = "—";
  }
}

// ── Tabular Evaluation Renderers ─────────────────────────────
function loadMarksSection() {
  const tabsEl = document.getElementById("marks-course-tabs");
  const displayEl = document.getElementById("marks-display");

  if (allMarks.length === 0) {
    tabsEl.innerHTML = "";
    displayEl.innerHTML = '<div class="loading-placeholder">No academic evaluations have been linked to this account yet.</div>';
    return;
  }

  tabsEl.innerHTML = allMarks.map((m, i) =>
    `<button class="course-tab-btn ${i === 0 ? 'active' : ''}" onclick="showMarkCard(${i}, this)">${COURSE_SHORT[m.subject] || m.subject}</button>`
  ).join("");

  showMarkCard(0, null);
}

function showMarkCard(idx, btn) {
  if (btn) {
    document.querySelectorAll(".course-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  const m = allMarks[idx];
  const tot = parseFloat(m.total || 0);
  const pct = Math.min(100, tot);

  document.getElementById("marks-display").innerHTML = `
    <div class="marks-card">
      <div class="marks-course-header">
        <h3>${m.subject}</h3>
        <div class="grade-badge">${m.grade}</div>
      </div>
      <div class="marks-breakdown">
        <div class="mark-item"><div class="mark-item-label">Quiz</div><div class="mark-item-value">${m.quiz}</div><div class="mark-item-max">/ 10</div></div>
        <div class="mark-item"><div class="mark-item-label">Mid Exam</div><div class="mark-item-value">${m.mid}</div><div class="mark-item-max">/ 20</div></div>
        <div class="mark-item"><div class="mark-item-label">Assignment</div><div class="mark-item-value">${m.assignment}</div><div class="mark-item-max">/ 20</div></div>
        <div class="mark-item"><div class="mark-item-label">Final Exam</div><div class="mark-item-value">${m.final}</div><div class="mark-item-max">/ 50</div></div>
      </div>
      <div class="marks-total-bar">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="marks-total-label"><strong>${m.total}</strong> / 100 — Passed</span>
      </div>
    </div>
  `;
}

// ── Examination Engine (`Online_Tests`) ───────────────────────
async function loadExam(course) {
  currentExamCourse = course;
  document.getElementById("exam-course-select").style.display = "none";
  document.getElementById("exam-area").style.display = "block";
  document.getElementById("exam-intro").style.display = "block";
  document.getElementById("exam-runner").style.display = "none";
  document.getElementById("exam-result").style.display = "none";

  try {
    const result = await apiCall({ action: "getExam", course: course });
    examQuestions = result.questions || [];
    document.getElementById("exam-course-title").textContent = course;
    document.getElementById("exam-q-count").textContent = examQuestions.length > 0
      ? `${examQuestions.length} Questions configured for this examination block.`
      : "No automated evaluation items are currently active for this structural unit.";
  } catch(e) {
    document.getElementById("exam-q-count").textContent = "Error executing test retrieval handler pipelines.";
  }
}

function startExam() {
  if (examQuestions.length === 0) return;
  currentQ = 0;
  answers = {};
  document.getElementById("exam-intro").style.display = "none";
  document.getElementById("exam-runner").style.display = "block";
  renderQuestion();
  startTimer(15 * 60); // Default 15 minutes
}

function renderQuestion() {
  const q = examQuestions[currentQ];
  const total = examQuestions.length;
  const pct = ((currentQ + 1) / total * 100).toFixed(0);

  document.getElementById("exam-progress-label").textContent = `Evaluation Unit ${currentQ + 1} of ${total}`;
  document.getElementById("exam-progress-bar").style.width = pct + "%";
  document.getElementById("q-text").textContent = q.question || q.Question_Text;

  const opts = [
    { key: "A", val: q.a || q.Option_A }, { key: "B", val: q.b || q.Option_B },
    { key: "C", val: q.c || q.Option_C }, { key: "D", val: q.d || q.Option_D }
  ];

  document.getElementById("q-options").innerHTML = opts.map(o => `
    <button class="option-btn ${answers[currentQ] === o.key ? 'selected' : ''}" onclick="selectAnswer('${o.key}', this)">
      <span class="option-letter">${o.key}</span>
      <span>${o.val}</span>
    </button>
  `).join("");

  document.getElementById("btn-prev").style.visibility = currentQ === 0 ? "hidden" : "visible";
  document.getElementById("btn-next").textContent = currentQ === total - 1 ? "Terminate & Evaluate" : "Next Frame →";
}

function selectAnswer(key, btn) {
  answers[currentQ] = key;
  document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function nextQ() {
  if (currentQ === examQuestions.length - 1) {
    finishExam();
  } else {
    currentQ++;
    renderQuestion();
  }
}

function prevQ() {
  if (currentQ > 0) { currentQ--; renderQuestion(); }
}

function finishExam() {
  clearInterval(timerInterval);
  let correct = 0;
  examQuestions.forEach((q, i) => {
    const correctKey = q.correct || q.Correct_Answer;
    if (answers[i] === correctKey) correct++;
  });
  const score = ((correct / examQuestions.length) * 100).toFixed(0);

  document.getElementById("exam-runner").style.display = "none";
  document.getElementById("exam-result").style.display = "block";
  document.getElementById("result-score").textContent = score + "%";
  document.getElementById("result-heading").textContent = parseInt(score) >= 50 ? "Evaluation Satisfactory" : "Review Core Material";
  document.getElementById("result-detail").textContent = `Performance matrix: Verified ${correct} correct operations from ${examQuestions.length} units. Raw Index: ${score}%`;
}

function startTimer(seconds) {
  timerSecondsLeft = seconds;
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSecondsLeft--;
    updateTimerDisplay();
    if (timerSecondsLeft <= 60) document.getElementById("exam-timer").classList.add("warning");
    if (timerSecondsLeft <= 0) finishExam();
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timerSecondsLeft / 60).toString().padStart(2, "0");
  const s = (timerSecondsLeft % 60).toString().padStart(2, "0");
  document.getElementById("exam-timer").textContent = `${m}:${s}`;
}

function exitExam() {
  clearInterval(timerInterval);
  document.getElementById("exam-area").style.display = "none";
  document.getElementById("exam-course-select").style.display = "grid";
}

// ── Lecture Notes Sync Engine (`Lecture_Notes`) ─────────────────
async function loadNotes() {
  const grid = document.getElementById("notes-grid");
  try {
    const result = await apiCall({ action: "getNotes" });
    if (result.success && result.data) {
      window.allNotes = result.data;
      renderNotes("all");
    } else {
      grid.innerHTML = `<div class="loading-placeholder">No learning structural matrices loaded from remote.</div>`;
    }
  } catch(e) {
    grid.innerHTML = `<div class="loading-placeholder">Awaiting backend system initialization deployment parameters.</div>`;
  }
}

function renderNotes(filter) {
  const grid = document.getElementById("notes-grid");
  const notes = window.allNotes || [];
  const filtered = filter === "all" ? notes : notes.filter(n => (n.course || n.Course_Name).includes(filter));

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="loading-placeholder">No active lecture materials matched the designated matrix filter.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(n => `
    <div class="note-card">
      <span class="note-course-badge">${COURSE_SHORT[n.course || n.Course_Name] || n.course || n.Course_Name}</span>
      <div class="note-title">${n.title || n.Topic_Title}</div>
      <a class="note-download-btn" href="${n.url || n.Resource_URL}" target="_blank" rel="noopener">Access Engineering Matrix →</a>
    </div>
  `).join("");
}

function filterNotes(filter, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderNotes(filter);
}

// ── Grade Acceptance & Dispute Systems ──────────────────────
function loadComplaintSection() {
  const container = document.getElementById("complaint-list");
  if (allMarks.length === 0) {
    container.innerHTML = '<div class="loading-placeholder">Academic ledger transparent. No parameters to evaluate.</div>';
    return;
  }

  const localRecords = getComplaints().filter(c => c.studentId === currentUser.id.toLowerCase());

  container.innerHTML = allMarks.map(m => {
    const existing = localRecords.find(c => c.course === m.subject);
    const statusHtml = existing
      ? `<span class="status-badge status-${existing.status}">${existing.status.toUpperCase()}</span>`
      : "";
    const actionsHtml = !existing ? `
      <button class="btn-accept" onclick="acceptGrade('${m.subject}')">✔ Verify & Lock Grade</button>
      <button class="btn-reject" onclick="openComplaint('${m.subject}', '${m.grade}', '${m.total}')">✗ Dispute Marks Matrix</button>
    ` : `<span style="font-size:0.85rem; color:var(--text-muted);">Dispute Status: Logged in browser buffer store.</span>`;

    return `
      <div class="complaint-card">
        <div class="complaint-course">${m.subject} ${statusHtml}</div>
        <div class="complaint-meta">
          Aggregated Performance Matrix: <strong>${m.total}/100</strong> (Grade: <strong>${m.grade}</strong>)
        </div>
        <div class="complaint-actions">${actionsHtml}</div>
      </div>
    `;
  }).join("");
}

function acceptGrade(course) {
  const existing = getComplaints();
  existing.push({ id: Date.now(), studentId: currentUser.id.toLowerCase(), course, status: "accepted", submittedAt: new Date().toISOString() });
  localStorage.setItem("au_complaints", JSON.stringify(existing));
  loadComplaintSection();
}

let complaintContext = {};
function openComplaint(course, grade, total) {
  complaintContext = { course, grade, total };
  document.getElementById("complaint-modal-course").textContent = `${course} [Metric Framework State: ${total}%]`;
  document.getElementById("complaint-modal").style.display = "flex";
}

function submitComplaint() {
  const text = document.getElementById("complaint-text").value.trim();
  if (!text) return;
  saveComplaint(complaintContext.course, text, complaintContext.grade, complaintContext.total);
  document.getElementById("complaint-modal").style.display = "none";
  document.getElementById("complaint-text").value = "";
  loadComplaintSection();
}

// ── NLP Academic Assistant Interface (Proxy Tunnel) ─────────
async function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  input.value = "";
  appendChatMsg(msg, "user");
  appendChatMsg("Processing framework layers…", "bot", true);

  try {
    const res = await apiCall({ message: { text: msg, chat: { id: 0 }, from: { username: currentUser.id } } });
    removeTyping();
    appendChatMsg(res.reply || "Context received. Please coordinate technical engineering specifics with the Faculty Registry directly.", "bot");
  } catch(e) {
    removeTyping();
    appendChatMsg("Core application bridge operational. Use local panels to navigate assessment frameworks.", "bot");
  }
}

function appendChatMsg(text, role, isTyping = false) {
  const messages = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  if (isTyping) div.id = "typing-indicator";
  div.innerHTML = `<div class="msg-bubble">${text}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}
