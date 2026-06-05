// ============================================================
//  js/student.js  –  Student Dashboard Logic
// ============================================================

let _studentData = null;
let _quizState   = null;

// ── INIT ────────────────────────────────────────────────────
function initStudentDashboard(user) {
  _studentData = user;
  const nameEl = document.getElementById("sidebar-student-name");
  const avatarEl = document.getElementById("student-avatar");
  if (nameEl)   nameEl.textContent = user.name.split(" ")[0];
  if (avatarEl) avatarEl.textContent = user.name[0].toUpperCase();
  showStudentSection("s-overview");
}

// ── SECTION ROUTER ─────────────────────────────────────────
function showStudentSection(section) {
  document.querySelectorAll("#student-sidebar .nav-item").forEach(n => n.classList.remove("active"));
  const map = { "s-overview":0, "s-marks":1, "s-tests":2, "s-notes":3, "s-chatbot":4, "s-notices":5 };
  const items = document.querySelectorAll("#student-sidebar .nav-item");
  if (items[map[section]]) items[map[section]].classList.add("active");

  const main = document.getElementById("student-main");
  main.innerHTML = "";

  switch (section) {
    case "s-overview": renderStudentOverview(main); break;
    case "s-marks":    renderStudentMarks(main);    break;
    case "s-tests":    renderStudentTests(main);    break;
    case "s-notes":    renderStudentNotes(main);    break;
    case "s-chatbot":  renderStudentChatbot(main);  break;
    case "s-notices":  renderStudentNotices(main);  break;
  }
}

// ── OVERVIEW ───────────────────────────────────────────────
function renderStudentOverview(main) {
  const u = _studentData;
  main.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Dashboard</div>
        <div class="section-sub">Welcome to your student portal</div>
      </div>
    </div>

    <div class="overview-grid">
      <div class="overview-welcome">
        <div class="welcome-name">Hello, ${escHtml(u.name)} 👋</div>
        <div class="welcome-sub">Student ID: <span style="font-family:var(--mono);color:var(--accent)">${escHtml(u.id)}</span></div>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-accent" onclick="showStudentSection('s-marks')">View Marks</button>
          <button class="btn btn-outline" onclick="showStudentSection('s-tests')">Take Test</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Quick Links</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${quickLink("◈", "My Marks",       "showStudentSection('s-marks')")}
          ${quickLink("◎", "Online Tests",    "showStudentSection('s-tests')")}
          ${quickLink("◱", "Lecture Notes",   "showStudentSection('s-notes')")}
          ${quickLink("◉", "Notices",         "showStudentSection('s-notices')")}
          ${quickLink("◈", "AI Chatbot",      "showStudentSection('s-chatbot')")}
        </div>
      </div>
    </div>

    <div class="stats-grid" style="margin-top:20px">
      ${CONFIG.COURSES.map(c => `
        <div class="stat-card">
          <div class="s-label">${escHtml(c.code)}</div>
          <div class="s-value" style="font-size:1rem;font-family:var(--font);font-weight:600;">${escHtml(c.name)}</div>
          <div class="s-sub" style="margin-top:8px">
            <button class="btn btn-outline btn-sm" onclick="showStudentSection('s-marks')">View Marks →</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function quickLink(icon, label, action) {
  return `<button onclick="${action}" class="btn btn-outline" style="justify-content:flex-start;gap:10px;text-align:left">
    <span>${icon}</span> ${label}
  </button>`;
}

// ── MARKS ───────────────────────────────────────────────────
function renderStudentMarks(main) {
  main.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">My Marks</div>
        <div class="section-sub">View and respond to your academic results</div>
      </div>
    </div>
    <div class="course-select-grid" id="marks-course-select">
      ${CONFIG.COURSES.map(c => `
        <div class="course-card" onclick="loadStudentMarks('${c.id}', this)">
          <div class="c-code">${escHtml(c.code)}</div>
          <div class="c-name">${escHtml(c.name)}</div>
        </div>
      `).join("")}
    </div>
    <div id="marks-content"></div>
  `;
}

async function loadStudentMarks(courseId, el) {
  document.querySelectorAll(".course-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");

  const course = CONFIG.COURSES.find(c => c.id === courseId);
  const container = document.getElementById("marks-content");
  container.innerHTML = `<div class="card"><p style="color:var(--text-2)">Loading marks…</p></div>`;

  try {
    let marks = null;
    if (Sheets._useMock()) {
      const all = Sheets.MOCK.marks[courseId] || [];
      marks = all.find(m => m.studentId === _studentData.id) || null;
    } else {
      marks = await Sheets.getStudentMarks(_studentData.id, course.sheetTab);
    }

    if (!marks) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No marks recorded for this course yet.</div></div>`;
      return;
    }

    const total = (parseFloat(marks.quiz||0) + parseFloat(marks.mid||0) + parseFloat(marks.assignment||0) + parseFloat(marks.final||0));
    const grade = calcGrade(total);
    const maxTotal = 20 + 30 + 10 + 50; // quiz20, mid30, assign10, final50 — adjust as needed

    container.innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-title">${escHtml(course.code)} – ${escHtml(course.name)}</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px">
          ${markItem("Quiz",       marks.quiz,       20)}
          ${markItem("Mid Exam",   marks.mid,        30)}
          ${markItem("Assignment", marks.assignment, 10)}
          ${markItem("Final Exam", marks.final,      50)}
        </div>
        <div style="border-top:1px solid var(--border);padding-top:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:600">Total Score</span>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-family:var(--mono);font-size:1.3rem;font-weight:700;color:var(--accent)">${total.toFixed(1)}</span>
              <span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span>
            </div>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${Math.min((total/maxTotal)*100,100).toFixed(1)}%"></div>
          </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-accent" onclick="showComplaintForm('${courseId}','${escHtml(course.name)}',${total})">
            Accept / Complain
          </button>
        </div>
        <div id="complaint-area"></div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card"><p style="color:var(--danger)">Error loading marks. Please try again.</p></div>`;
  }
}

function markItem(label, value, max) {
  return `
    <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:14px">
      <div style="font-size:0.75rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${label}</div>
      <div style="font-size:1.4rem;font-weight:700;font-family:var(--mono);color:var(--text)">${value ?? "—"}</div>
      <div style="font-size:0.75rem;color:var(--text-3)">out of ${max}</div>
    </div>
  `;
}

function calcGrade(total) {
  if (total >= 90) return "A+";
  if (total >= 85) return "A";
  if (total >= 80) return "A-";
  if (total >= 75) return "B+";
  if (total >= 70) return "B";
  if (total >= 65) return "B-";
  if (total >= 60) return "C+";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  return "F";
}

function showComplaintForm(courseId, courseName, currentMark) {
  const area = document.getElementById("complaint-area");
  area.innerHTML = `
    <hr class="divider"/>
    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Mark Review</h3>
    <p style="font-size:0.875rem;color:var(--text-2);margin-bottom:16px">
      Do you accept your current mark of <strong>${currentMark.toFixed(1)}</strong>, or do you want to submit a complaint?
    </p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
      <button class="btn btn-accent" onclick="submitMarkAcceptance('${courseId}','${escHtml(courseName)}',true)">
        ✓ Accept Mark
      </button>
      <button class="btn btn-outline" onclick="toggleComplaintTextarea()">
        ✎ File Complaint
      </button>
    </div>
    <div id="complaint-textarea-area" class="hidden">
      <div class="field-group">
        <label>Complaint Subject</label>
        <input type="text" id="complaint-subject" class="field-input" placeholder="e.g. Marking error in Final Exam"/>
      </div>
      <div class="field-group">
        <label>Describe your complaint</label>
        <textarea id="complaint-body" style="width:100%;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:12px 14px;font-family:var(--font);font-size:0.9rem;resize:vertical;min-height:100px;outline:none;" placeholder="Explain why you believe your mark should be reviewed..."></textarea>
      </div>
      <button class="btn btn-accent" onclick="submitComplaint('${courseId}','${escHtml(courseName)}',${currentMark})">
        Submit Complaint
      </button>
    </div>
    <div id="complaint-result"></div>
  `;
}

function toggleComplaintTextarea() {
  const el = document.getElementById("complaint-textarea-area");
  el.classList.toggle("hidden");
}

async function submitMarkAcceptance(courseId, courseName, accepted) {
  showToast(accepted ? "You have accepted your mark for " + courseName : "Complaint mode enabled.");
  if (accepted) document.getElementById("complaint-area").innerHTML = `
    <div class="form-success" style="margin-top:16px">✓ You have accepted your mark for ${escHtml(courseName)}.</div>`;
}

async function submitComplaint(courseId, courseName, currentMark) {
  const subject = document.getElementById("complaint-subject").value.trim();
  const body    = document.getElementById("complaint-body").value.trim();
  if (!subject || !body) { showToast("Please fill in all fields."); return; }

  const complaint = {
    studentId:    _studentData.id,
    studentName:  _studentData.name,
    courseId,
    courseName,
    subject,
    body,
    currentMark,
    date:   new Date().toISOString().split("T")[0],
    status: "Pending",
    response: "",
  };

  try {
    if (Sheets._useMock()) {
      Sheets.MOCK.complaints.push({ ...complaint, row: Sheets.MOCK.complaints.length + 2 });
    } else {
      await Sheets.addComplaint(complaint);
    }
    document.getElementById("complaint-result").innerHTML =
      `<div class="form-success" style="margin-top:12px">✓ Complaint submitted. Your instructor will review it shortly.</div>`;
    document.getElementById("complaint-textarea-area").classList.add("hidden");
  } catch (e) {
    showToast("Error submitting complaint. Please try again.");
  }
}

// ── ONLINE TESTS ───────────────────────────────────────────
function renderStudentTests(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Online Tests</div>
      <div class="section-sub">Select a course to begin</div></div>
    </div>
    <div class="course-select-grid">
      ${CONFIG.COURSES.map(c => `
        <div class="course-card" onclick="startQuiz('${c.id}')">
          <div class="c-code">${escHtml(c.code)}</div>
          <div class="c-name">${escHtml(c.name)}</div>
          <div style="margin-top:12px">
            <span class="badge badge-blue">Start Quiz →</span>
          </div>
        </div>
      `).join("")}
    </div>
    <div id="quiz-area"></div>
  `;
}

async function startQuiz(courseId) {
  const area = document.getElementById("quiz-area");
  area.innerHTML = `<div class="card"><p style="color:var(--text-2)">Loading questions…</p></div>`;

  let questions = [];
  if (Sheets._useMock()) {
    questions = Sheets.MOCK.questions[courseId] || [];
  } else {
    const course = CONFIG.COURSES.find(c => c.id === courseId);
    questions = await Sheets.getTestQuestions(course.name);
  }

  if (!questions.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">No questions available for this course yet.</div></div>`;
    return;
  }

  // Shuffle
  const qs = [...questions].sort(() => Math.random() - 0.5);
  _quizState = { courseId, questions: qs, current: 0, score: 0, answers: [] };
  renderQuestion(area);
}

function renderQuestion(area) {
  const { questions, current } = _quizState;
  if (current >= questions.length) { renderQuizResult(area); return; }

  const q = questions[current];
  const opts = [
    { letter: "A", text: q.optionA },
    { letter: "B", text: q.optionB },
    { letter: "C", text: q.optionC },
    { letter: "D", text: q.optionD },
  ];

  area.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        <div class="progress-bar-wrap" style="flex:1">
          <div class="progress-bar-fill" style="width:${((current)/questions.length*100).toFixed(0)}%"></div>
        </div>
        <span class="quiz-counter">${current+1} / ${questions.length}</span>
      </div>
      <div class="quiz-question">${escHtml(q.questionText)}</div>
      <div class="quiz-options">
        ${opts.map(o => `
          <div class="quiz-option" id="opt-${o.letter}" onclick="selectAnswer('${o.letter}', '${q.correctAnswer}')">
            <div class="option-letter">${o.letter}</div>
            <span>${escHtml(o.text)}</span>
          </div>
        `).join("")}
      </div>
      <div id="quiz-feedback" style="margin-top:16px"></div>
    </div>
  `;
}

function selectAnswer(chosen, correct) {
  // Disable all options
  document.querySelectorAll(".quiz-option").forEach(el => {
    el.onclick = null;
    el.style.cursor = "default";
  });

  const chosenEl  = document.getElementById("opt-" + chosen);
  const correctEl = document.getElementById("opt-" + correct);
  const feedback  = document.getElementById("quiz-feedback");

  if (chosen === correct) {
    chosenEl.classList.add("correct");
    _quizState.score++;
    feedback.innerHTML = `<span style="color:var(--success);font-weight:600">✓ Correct!</span>`;
  } else {
    chosenEl.classList.add("wrong");
    correctEl.classList.add("correct");
    feedback.innerHTML = `<span style="color:var(--danger);font-weight:600">✗ Incorrect.</span> <span style="color:var(--text-2)">The correct answer is <strong>${correct}</strong>.</span>`;
  }

  _quizState.answers.push({ chosen, correct, isCorrect: chosen === correct });

  setTimeout(() => {
    _quizState.current++;
    const area = document.getElementById("quiz-area");
    renderQuestion(area);
  }, 1200);
}

function renderQuizResult(area) {
  const { score, questions } = _quizState;
  const pct = Math.round((score / questions.length) * 100);
  area.innerHTML = `
    <div class="quiz-result-card">
      <div style="font-size:2rem">🎓</div>
      <div style="font-size:0.875rem;color:var(--text-2);margin-top:8px">Quiz Complete!</div>
      <div class="quiz-score">${score}/${questions.length}</div>
      <div style="font-size:0.95rem;color:var(--text-2)">${pct}% correct</div>
      <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-accent" onclick="startQuiz('${_quizState.courseId}')">Retry</button>
        <button class="btn btn-outline" onclick="showStudentSection('s-tests')">Back to Courses</button>
      </div>
    </div>
  `;
}

// ── LECTURE NOTES ──────────────────────────────────────────
async function renderStudentNotes(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Lecture Notes</div>
      <div class="section-sub">Download course materials</div></div>
    </div>
    <div class="course-select-grid">
      ${CONFIG.COURSES.map(c => `
        <div class="course-card" onclick="loadNotes('${c.id}', '${escHtml(c.sheetTab)}', this)">
          <div class="c-code">${escHtml(c.code)}</div>
          <div class="c-name">${escHtml(c.name)}</div>
        </div>
      `).join("")}
      <div class="course-card" onclick="loadNotes('all', 'all', this)">
        <div class="c-code">ALL</div>
        <div class="c-name">All Courses</div>
      </div>
    </div>
    <div id="notes-content"></div>
  `;
}

async function loadNotes(courseId, sheetTab, el) {
  document.querySelectorAll(".course-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");

  const container = document.getElementById("notes-content");
  container.innerHTML = `<p style="color:var(--text-2)">Loading notes…</p>`;

  let notes = [];
  if (Sheets._useMock()) {
    notes = courseId === "all"
      ? Sheets.MOCK.notes
      : Sheets.MOCK.notes.filter(n => n.courseName === sheetTab || n.courseName.includes(courseId));
  } else {
    notes = courseId === "all"
      ? await Sheets.getAllNotes()
      : await Sheets.getLectureNotes(sheetTab);
  }

  if (!notes.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">No notes available yet.</div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="notes-grid">
      ${notes.map(n => `
        <div class="note-card">
          <div class="note-course">${escHtml(n.courseName || "")}</div>
          <div class="note-title">${escHtml(n.topicTitle)}</div>
          <a class="note-download" href="${escHtml(n.resourceURL)}" target="_blank" rel="noopener">
            ↓ Download / View
          </a>
        </div>
      `).join("")}
    </div>
  `;
}

// ── CHATBOT ────────────────────────────────────────────────
function renderStudentChatbot(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">AI Study Assistant</div>
      <div class="section-sub">Ask questions about your courses</div></div>
    </div>
    <div style="max-width:680px">
      <div class="chat-window" id="chat-window">
        <div class="chat-msg">
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble">Hello ${escHtml(_studentData.name.split(" ")[0])}! I'm your study assistant. Ask me anything about Civil Engineering, your courses, or use the suggestions below.</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        ${["What is a sag curve?","Explain trip generation","What is stopping sight distance?","Gravity model in transport"].map(s=>`
          <button class="btn btn-outline btn-sm" onclick="sendChat('${escHtml(s)}')">${escHtml(s)}</button>
        `).join("")}
      </div>
      <div class="chat-input-row">
        <input class="chat-input" id="chat-input" placeholder="Ask a question…"
          onkeydown="if(event.key==='Enter')sendChat()"/>
        <button class="btn btn-accent" onclick="sendChat()">Send</button>
      </div>
    </div>
  `;
}

async function sendChat(prefill) {
  const input = document.getElementById("chat-input");
  const msg   = prefill || input.value.trim();
  if (!msg) return;
  input.value = "";

  appendChat(msg, "user");

  // Typing indicator
  const typingId = appendChat("…", "bot", true);

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        system: `You are a helpful study assistant for Civil Engineering students at an Ethiopian university.
The student is studying these courses: 
1. Geometric Design of Road and Streets (CEng 3201)
2. Transport Planning and Modeling (CEng 2901)
Give concise, accurate academic answers. If asked non-academic questions, politely redirect to studies.`,
        messages: [{ role: "user", content: msg }],
      }),
    });
    const data = await resp.json();
    const reply = data.content?.[0]?.text || "Sorry, I could not get a response.";
    removeTyping(typingId);
    appendChat(reply, "bot");
  } catch (e) {
    removeTyping(typingId);
    appendChat("Sorry, I couldn't connect. Please try again.", "bot");
  }
}

function appendChat(text, role, isTyping) {
  const win = document.getElementById("chat-window");
  const id  = "msg-" + Date.now();
  const div = document.createElement("div");
  div.className = "chat-msg" + (role === "user" ? " user" : "");
  div.id = id;
  div.innerHTML = role === "user"
    ? `<div class="chat-avatar" style="background:rgba(0,212,170,0.15)">👤</div><div class="chat-bubble">${escHtml(text)}</div>`
    : `<div class="chat-avatar">🤖</div><div class="chat-bubble">${escHtml(text)}</div>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── NOTICES ────────────────────────────────────────────────
async function renderStudentNotices(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Notices</div>
      <div class="section-sub">Announcements from your instructor</div></div>
    </div>
    <div id="notices-list"><p style="color:var(--text-2)">Loading…</p></div>
  `;

  let notices = [];
  if (Sheets._useMock()) {
    notices = Sheets.MOCK.notices;
  } else {
    notices = await Sheets.getNotices();
  }

  const list = document.getElementById("notices-list");
  if (!notices.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📣</div><div class="empty-text">No notices yet.</div></div>`;
    return;
  }

  list.innerHTML = notices.slice().reverse().map(n => `
    <div class="notice-item">
      <div class="notice-title">${escHtml(n.title)}</div>
      <div class="notice-body">${escHtml(n.body)}</div>
      <div class="notice-meta">${escHtml(n.date || "")} · ${escHtml(n.author || "Instructor")}</div>
    </div>
  `).join("");
}

// ── UTILITY ────────────────────────────────────────────────
function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
