// ============================================================
//  js/instructor.js  –  Instructor Dashboard Logic
// ============================================================

// ── INIT ────────────────────────────────────────────────────
function initInstructorDashboard() {
  showInstructorSection("i-dashboard");
}

// ── SECTION ROUTER ─────────────────────────────────────────
function showInstructorSection(section) {
  document.querySelectorAll("#instructor-sidebar .nav-item").forEach(n => n.classList.remove("active"));
  const map = { "i-dashboard":0, "i-marks":1, "i-complaints":2, "i-upload-exam":3, "i-upload-notes":4, "i-notify":5, "i-students":6 };
  const items = document.querySelectorAll("#instructor-sidebar .nav-item");
  if (items[map[section]]) items[map[section]].classList.add("active");

  const main = document.getElementById("instructor-main");
  main.innerHTML = "";

  switch (section) {
    case "i-dashboard":    renderInstructorOverview(main); break;
    case "i-marks":        renderManageMarks(main);        break;
    case "i-complaints":   renderComplaints(main);         break;
    case "i-upload-exam":  renderUploadExam(main);         break;
    case "i-upload-notes": renderUploadNotes(main);        break;
    case "i-notify":       renderSendNotice(main);         break;
    case "i-students":     renderStudentList(main);        break;
  }
}

// ── OVERVIEW ───────────────────────────────────────────────
function renderInstructorOverview(main) {
  const totalStudents = countAllStudents();
  const totalNotices  = Sheets.MOCK.notices.length;
  const totalNotes    = Sheets.MOCK.notes.length;
  const totalComplain = Sheets.MOCK.complaints.filter(c=>c.status==="Pending").length;

  main.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Instructor Dashboard</div>
        <div class="section-sub">Welcome, ${escHtml(CONFIG.ADMIN_NAME)}</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="s-label">Total Students</div>
        <div class="s-value">${totalStudents}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Courses</div>
        <div class="s-value">${CONFIG.COURSES.length}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Notices Sent</div>
        <div class="s-value">${totalNotices}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Lecture Notes</div>
        <div class="s-value">${totalNotes}</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Pending Complaints</div>
        <div class="s-value" style="color:${totalComplain>0?'var(--warning)':'var(--accent)'}">${totalComplain}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:8px">
      ${[
        ["◈","Manage Marks","Update student scores","i-marks"],
        ["◎","Upload Exam","Add test questions","i-upload-exam"],
        ["◱","Upload Notes","Share lecture materials","i-upload-notes"],
        ["◉","Send Notice","Broadcast announcements","i-notify"],
        ["◈","View Complaints","Review student feedback","i-complaints"],
        ["◉","Student List","View registered students","i-students"],
      ].map(([icon,title,sub,sec])=>`
        <div class="card" style="cursor:pointer;transition:border-color .2s" onmouseenter="this.style.borderColor='var(--border-2)'" onmouseleave="this.style.borderColor=''" onclick="showInstructorSection('${sec}')">
          <div style="font-size:1.4rem;margin-bottom:8px">${icon}</div>
          <div style="font-weight:600;margin-bottom:4px">${title}</div>
          <div style="font-size:0.8rem;color:var(--text-2)">${sub}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function countAllStudents() {
  const ids = new Set();
  Object.values(Sheets.MOCK.marks).forEach(arr => arr.forEach(m => ids.add(m.studentId)));
  Sheets.MOCK.users.forEach(u => ids.add(u.id));
  return ids.size;
}

// ── MANAGE MARKS ────────────────────────────────────────────
function renderManageMarks(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Manage Marks</div>
      <div class="section-sub">View and edit student marks per course</div></div>
    </div>
    <div class="course-select-grid">
      ${CONFIG.COURSES.map(c => `
        <div class="course-card" onclick="loadCourseMarks('${c.id}', this)">
          <div class="c-code">${escHtml(c.code)}</div>
          <div class="c-name">${escHtml(c.name)}</div>
        </div>
      `).join("")}
    </div>
    <div id="marks-table-area"></div>
  `;
}

async function loadCourseMarks(courseId, el) {
  document.querySelectorAll(".course-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  const course = CONFIG.COURSES.find(c => c.id === courseId);
  const area = document.getElementById("marks-table-area");
  area.innerHTML = `<p style="color:var(--text-2)">Loading…</p>`;

  let marks = [];
  if (Sheets._useMock()) {
    marks = JSON.parse(JSON.stringify(Sheets.MOCK.marks[courseId] || []));
  } else {
    marks = await Sheets.getAllMarks(course.sheetTab);
  }

  area.innerHTML = `
    <div class="inline-form">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <h3>${escHtml(course.code)} – ${escHtml(course.name)}</h3>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" onclick="showAddStudentForm('${courseId}')">+ Add Student</button>
          <button class="btn btn-accent btn-sm" onclick="saveAllMarks('${courseId}')">Save All</button>
        </div>
      </div>
      <div id="add-student-form-${courseId}"></div>
      ${marks.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No students in this course yet.</div></div>`
        : `<div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Student ID</th><th>Name</th><th>Quiz (20)</th><th>Mid (30)</th><th>Assignment (10)</th><th>Final (50)</th><th>Total</th>
              </tr></thead>
              <tbody id="marks-tbody-${courseId}">
                ${marks.map((m,i) => marksRow(m, i, courseId)).join("")}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

function marksRow(m, i, courseId) {
  const total = (parseFloat(m.quiz||0)+parseFloat(m.mid||0)+parseFloat(m.assignment||0)+parseFloat(m.final||0)).toFixed(1);
  return `
    <tr>
      <td><span style="font-family:var(--mono);font-size:0.8rem">${escHtml(m.studentId)}</span></td>
      <td>${escHtml(m.name)}</td>
      <td><input class="marks-input" data-field="quiz" data-idx="${i}" data-course="${courseId}" value="${m.quiz??""}" type="number" min="0" max="20" oninput="updateMarkCell(this)"/></td>
      <td><input class="marks-input" data-field="mid" data-idx="${i}" data-course="${courseId}" value="${m.mid??""}" type="number" min="0" max="30" oninput="updateMarkCell(this)"/></td>
      <td><input class="marks-input" data-field="assignment" data-idx="${i}" data-course="${courseId}" value="${m.assignment??""}" type="number" min="0" max="10" oninput="updateMarkCell(this)"/></td>
      <td><input class="marks-input" data-field="final" data-idx="${i}" data-course="${courseId}" value="${m.final??""}" type="number" min="0" max="50" oninput="updateMarkCell(this)"/></td>
      <td id="total-${courseId}-${i}"><span class="grade-badge ${gradeClass(total)}">${total}</span></td>
    </tr>
  `;
}

function gradeClass(total) {
  if (total >= 80) return "grade-a";
  if (total >= 65) return "grade-b";
  if (total >= 50) return "grade-c";
  if (total >= 45) return "grade-d";
  return "grade-f";
}

function updateMarkCell(input) {
  const idx    = parseInt(input.dataset.idx);
  const field  = input.dataset.field;
  const course = input.dataset.course;
  if (!Sheets.MOCK.marks[course]) return;
  Sheets.MOCK.marks[course][idx][field] = parseFloat(input.value) || 0;
  const m = Sheets.MOCK.marks[course][idx];
  const total = (parseFloat(m.quiz||0)+parseFloat(m.mid||0)+parseFloat(m.assignment||0)+parseFloat(m.final||0)).toFixed(1);
  const el = document.getElementById(`total-${course}-${idx}`);
  if (el) el.innerHTML = `<span class="grade-badge ${gradeClass(total)}">${total}</span>`;
}

async function saveAllMarks(courseId) {
  showLoader();
  try {
    if (!Sheets._useMock()) {
      const course = CONFIG.COURSES.find(c => c.id === courseId);
      const marks  = Sheets.MOCK.marks[courseId] || [];
      for (const m of marks) {
        await Sheets.updateMark(m.studentId, course.sheetTab, { quiz: m.quiz, mid: m.mid, assignment: m.assignment, final: m.final });
      }
    }
    showToast("Marks saved successfully!");
  } catch (e) {
    showToast("Error saving marks. Please try again.");
  } finally {
    hideLoader();
  }
}

function showAddStudentForm(courseId) {
  const area = document.getElementById(`add-student-form-${courseId}`);
  if (area.innerHTML) { area.innerHTML = ""; return; }
  area.innerHTML = `
    <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
      <h4 style="margin-bottom:12px;font-size:0.9rem;font-weight:600">Add Student to Course</h4>
      <div class="two-col" style="margin-bottom:12px">
        <div class="field-group" style="margin:0">
          <label>Student ID</label>
          <input type="text" id="new-stud-id" class="field-input" placeholder="ETS0001"/>
        </div>
        <div class="field-group" style="margin:0">
          <label>Name</label>
          <input type="text" id="new-stud-name" class="field-input" placeholder="Full Name"/>
        </div>
      </div>
      <button class="btn btn-accent btn-sm" onclick="addStudentToMarks('${courseId}')">Add Student</button>
    </div>
  `;
}

function addStudentToMarks(courseId) {
  const id   = document.getElementById("new-stud-id").value.trim();
  const name = document.getElementById("new-stud-name").value.trim();
  if (!id || !name) { showToast("Please enter ID and name."); return; }
  if (!Sheets.MOCK.marks[courseId]) Sheets.MOCK.marks[courseId] = [];
  if (Sheets.MOCK.marks[courseId].find(m=>m.studentId===id)) { showToast("Student already exists."); return; }
  Sheets.MOCK.marks[courseId].push({ studentId: id, name, quiz: 0, mid: 0, assignment: 0, final: 0 });
  showToast("Student added! Save to apply.");
  document.getElementById(`add-student-form-${courseId}`).innerHTML = "";
  // Re-render table
  const tbody = document.getElementById(`marks-tbody-${courseId}`);
  if (tbody) tbody.innerHTML = Sheets.MOCK.marks[courseId].map((m,i)=>marksRow(m,i,courseId)).join("");
}

// ── COMPLAINTS ──────────────────────────────────────────────
async function renderComplaints(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Student Complaints</div>
      <div class="section-sub">Review and respond to mark disputes</div></div>
    </div>
    <div id="complaints-list"><p style="color:var(--text-2)">Loading…</p></div>
  `;

  const complaints = Sheets._useMock() ? Sheets.MOCK.complaints : await Sheets.getComplaints();
  const list = document.getElementById("complaints-list");

  if (!complaints.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">No complaints submitted yet.</div></div>`;
    return;
  }

  list.innerHTML = complaints.map((c, i) => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:600">${escHtml(c.subject || c.courseName)}</div>
          <div style="font-size:0.8rem;color:var(--text-2);margin-top:2px">
            ${escHtml(c.studentName)} · ${escHtml(c.courseId || "")} · Mark: ${c.currentMark}
          </div>
        </div>
        <span class="badge ${c.status==='Resolved'?'badge-green':c.status==='Rejected'?'badge-red':'badge-yellow'}">${escHtml(c.status)}</span>
      </div>
      <p style="font-size:0.875rem;color:var(--text-2);margin:10px 0">${escHtml(c.body)}</p>
      ${c.response ? `<div style="background:var(--bg-2);border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 8px 8px 0;font-size:0.85rem;color:var(--text-2);margin-bottom:10px">Response: ${escHtml(c.response)}</div>` : ""}
      ${c.status === "Pending" ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <input type="text" id="resp-${i}" class="field-input" placeholder="Your response…" style="flex:1;min-width:200px"/>
          <button class="btn btn-accent btn-sm" onclick="resolveComplaint(${i},'Resolved')">Resolve</button>
          <button class="btn btn-danger btn-sm" onclick="resolveComplaint(${i},'Rejected')">Reject</button>
        </div>` : ""}
    </div>
  `).join("");
}

async function resolveComplaint(idx, status) {
  const resp = document.getElementById(`resp-${idx}`).value.trim();
  if (!resp) { showToast("Please write a response."); return; }
  Sheets.MOCK.complaints[idx].status   = status;
  Sheets.MOCK.complaints[idx].response = resp;
  if (!Sheets._useMock()) {
    await Sheets.updateComplaintStatus(idx + 2, status, resp);
  }
  showToast("Complaint " + status.toLowerCase() + ".");
  renderComplaints(document.getElementById("instructor-main"));
}

// ── UPLOAD EXAM ─────────────────────────────────────────────
function renderUploadExam(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Upload Exam Questions</div>
      <div class="section-sub">Add multiple-choice questions per course</div></div>
    </div>
    <div class="inline-form" style="max-width:640px">
      <div class="field-group">
        <label>Course</label>
        <select id="exam-course" class="form-select" style="width:100%">
          ${CONFIG.COURSES.map(c=>`<option value="${c.id}">${c.code} – ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="field-group">
        <label>Question</label>
        <textarea id="exam-q" style="width:100%;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:12px;font-family:var(--font);font-size:0.9rem;resize:vertical;min-height:80px;outline:none;" placeholder="Enter the question text…"></textarea>
      </div>
      <div class="two-col">
        <div class="field-group">
          <label>Option A</label>
          <input type="text" id="exam-a" class="field-input" placeholder="Option A"/>
        </div>
        <div class="field-group">
          <label>Option B</label>
          <input type="text" id="exam-b" class="field-input" placeholder="Option B"/>
        </div>
        <div class="field-group">
          <label>Option C</label>
          <input type="text" id="exam-c" class="field-input" placeholder="Option C"/>
        </div>
        <div class="field-group">
          <label>Option D</label>
          <input type="text" id="exam-d" class="field-input" placeholder="Option D"/>
        </div>
      </div>
      <div class="field-group">
        <label>Correct Answer</label>
        <select id="exam-correct" class="form-select">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
      <button class="btn btn-accent" onclick="addQuestion()">Add Question</button>
    </div>
    <div id="exam-list" style="margin-top:24px"></div>
  `;
  renderExamList();
}

function renderExamList() {
  const area = document.getElementById("exam-list");
  if (!area) return;
  let html = "";
  CONFIG.COURSES.forEach(c => {
    const qs = Sheets.MOCK.questions[c.id] || [];
    if (!qs.length) return;
    html += `<div style="margin-bottom:20px">
      <div style="font-size:0.8rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">${escHtml(c.code)} (${qs.length} questions)</div>
      ${qs.map((q,i)=>`
        <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:8px;padding:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:start;gap:10px">
          <div>
            <div style="font-size:0.875rem;font-weight:500;margin-bottom:4px">${escHtml(q.questionText)}</div>
            <div style="font-size:0.75rem;color:var(--text-3)">A:${escHtml(q.optionA)} / B:${escHtml(q.optionB)} / C:${escHtml(q.optionC)} / D:${escHtml(q.optionD)}</div>
            <span class="badge badge-green" style="margin-top:6px">Answer: ${escHtml(q.correctAnswer)}</span>
          </div>
          <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${c.id}',${i})">Delete</button>
        </div>
      `).join("")}
    </div>`;
  });
  area.innerHTML = html || `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">No questions yet.</div></div>`;
}

async function addQuestion() {
  const courseId = document.getElementById("exam-course").value;
  const q  = document.getElementById("exam-q").value.trim();
  const a  = document.getElementById("exam-a").value.trim();
  const b  = document.getElementById("exam-b").value.trim();
  const c  = document.getElementById("exam-c").value.trim();
  const d  = document.getElementById("exam-d").value.trim();
  const ans= document.getElementById("exam-correct").value;

  if (!q || !a || !b || !c || !d) { showToast("Please fill in all fields."); return; }

  const question = { courseName: courseId, questionText: q, optionA: a, optionB: b, optionC: c, optionD: d, correctAnswer: ans };
  if (!Sheets.MOCK.questions[courseId]) Sheets.MOCK.questions[courseId] = [];
  Sheets.MOCK.questions[courseId].push(question);

  if (!Sheets._useMock()) {
    await Sheets.addQuestion(question);
  }

  ["exam-q","exam-a","exam-b","exam-c","exam-d"].forEach(id => { document.getElementById(id).value = ""; });
  showToast("Question added!");
  renderExamList();
}

function deleteQuestion(courseId, idx) {
  Sheets.MOCK.questions[courseId].splice(idx, 1);
  renderExamList();
  showToast("Question deleted.");
}

// ── UPLOAD NOTES ─────────────────────────────────────────────
function renderUploadNotes(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Upload Lecture Notes</div>
      <div class="section-sub">Share course materials with students</div></div>
    </div>
    <div class="inline-form" style="max-width:520px">
      <div class="field-group">
        <label>Course</label>
        <select id="note-course" class="form-select" style="width:100%">
          ${CONFIG.COURSES.map(c=>`<option value="${c.sheetTab}">${c.code} – ${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="field-group">
        <label>Topic Title</label>
        <input type="text" id="note-title" class="field-input" placeholder="e.g. Horizontal Alignment Design"/>
      </div>
      <div class="field-group">
        <label>Resource URL (Google Drive, PDF link, etc.)</label>
        <input type="url" id="note-url" class="field-input" placeholder="https://drive.google.com/…"/>
      </div>
      <button class="btn btn-accent" onclick="addNote()">Upload Note</button>
    </div>
    <div id="notes-list-inst" style="margin-top:24px"></div>
  `;
  renderInstNotesList();
}

function renderInstNotesList() {
  const area = document.getElementById("notes-list-inst");
  if (!area) return;
  const notes = Sheets.MOCK.notes;
  if (!notes.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">No notes uploaded yet.</div></div>`;
    return;
  }
  area.innerHTML = `<div class="notes-grid">${notes.map((n,i)=>`
    <div class="note-card">
      <div class="note-course">${escHtml(n.courseName)}</div>
      <div class="note-title">${escHtml(n.topicTitle)}</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <a class="note-download" href="${escHtml(n.resourceURL)}" target="_blank">↗ View</a>
        <button class="btn btn-danger btn-sm" onclick="deleteNote(${i})">Delete</button>
      </div>
    </div>
  `).join("")}</div>`;
}

async function addNote() {
  const course = document.getElementById("note-course").value;
  const title  = document.getElementById("note-title").value.trim();
  const url    = document.getElementById("note-url").value.trim();
  if (!title || !url) { showToast("Please fill in all fields."); return; }

  const note = { courseName: course, topicTitle: title, resourceURL: url };
  Sheets.MOCK.notes.push(note);
  if (!Sheets._useMock()) { await Sheets.addLectureNote(note); }
  document.getElementById("note-title").value = "";
  document.getElementById("note-url").value   = "";
  showToast("Note uploaded!");
  renderInstNotesList();
}

function deleteNote(idx) {
  Sheets.MOCK.notes.splice(idx, 1);
  renderInstNotesList();
  showToast("Note deleted.");
}

// ── SEND NOTICE ──────────────────────────────────────────────
function renderSendNotice(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Send Notice</div>
      <div class="section-sub">Broadcast announcements to all students</div></div>
    </div>
    <div class="inline-form" style="max-width:520px">
      <div class="field-group">
        <label>Title</label>
        <input type="text" id="notice-title" class="field-input" placeholder="Notice title"/>
      </div>
      <div class="field-group">
        <label>Message</label>
        <textarea id="notice-body" style="width:100%;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:12px;font-family:var(--font);font-size:0.9rem;resize:vertical;min-height:100px;outline:none;" placeholder="Write your announcement…"></textarea>
      </div>
      <button class="btn btn-accent" onclick="sendNotice()">Send Notice</button>
    </div>
    <div style="margin-top:24px">
      <div style="font-size:0.8rem;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Previous Notices</div>
      <div id="inst-notices-list"></div>
    </div>
  `;
  renderInstNoticesList();
}

function renderInstNoticesList() {
  const area = document.getElementById("inst-notices-list");
  if (!area) return;
  const notices = Sheets.MOCK.notices;
  if (!notices.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-icon">📣</div><div class="empty-text">No notices yet.</div></div>`;
    return;
  }
  area.innerHTML = notices.slice().reverse().map((n,i)=>`
    <div class="notice-item">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <div class="notice-title">${escHtml(n.title)}</div>
          <div class="notice-body">${escHtml(n.body)}</div>
          <div class="notice-meta">${escHtml(n.date)} · ${escHtml(n.author||CONFIG.ADMIN_NAME)}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteNotice(${notices.length-1-i})">Delete</button>
      </div>
    </div>
  `).join("");
}

async function sendNotice() {
  const title = document.getElementById("notice-title").value.trim();
  const body  = document.getElementById("notice-body").value.trim();
  if (!title || !body) { showToast("Please fill in both fields."); return; }

  const notice = { title, body, date: new Date().toISOString().split("T")[0], author: CONFIG.ADMIN_NAME };
  Sheets.MOCK.notices.push(notice);
  if (!Sheets._useMock()) { await Sheets.addNotice(notice); }
  document.getElementById("notice-title").value = "";
  document.getElementById("notice-body").value  = "";
  showToast("Notice sent!");
  renderInstNoticesList();
}

function deleteNotice(idx) {
  Sheets.MOCK.notices.splice(idx, 1);
  renderInstNoticesList();
  showToast("Notice deleted.");
}

// ── STUDENT LIST ─────────────────────────────────────────────
async function renderStudentList(main) {
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Registered Students</div>
      <div class="section-sub">All students who have registered on the portal</div></div>
    </div>
    <div id="student-list-content"><p style="color:var(--text-2)">Loading…</p></div>
  `;

  let users = Sheets._useMock() ? Sheets.MOCK.users : await Sheets.getAllUsers();
  const area = document.getElementById("student-list-content");

  if (!users.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">No registered students yet.</div></div>`;
    return;
  }

  area.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Telegram</th></tr></thead>
        <tbody>
          ${users.map((u,i)=>`
            <tr>
              <td style="color:var(--text-3)">${i+1}</td>
              <td><span style="font-family:var(--mono);font-size:0.8rem">${escHtml(u.id)}</span></td>
              <td>${escHtml(u.name)}</td>
              <td style="color:var(--accent-2)">${escHtml(u.telegramUsername||"—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ── UTILITY ────────────────────────────────────────────────
function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
