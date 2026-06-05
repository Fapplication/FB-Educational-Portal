// ============================================================
//  js/sheets.js  –  Google Sheets Data Layer
//  All reads/writes go through Apps Script Web App
// ============================================================

const Sheets = {

  // ── CORE REQUEST ────────────────────────────────────────────
  async request(action, params = {}) {
    const url = CONFIG.APPS_SCRIPT_URL;
    const payload = { action, ...params };

    try {
      const resp = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "text/plain" },  // avoids CORS preflight
        body:    JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error("Sheets request error:", err);
      throw err;
    }
  },

  // ── AUTH_IDS ────────────────────────────────────────────────
  async isAuthorizedID(studentId) {
    const r = await this.request("isAuthorizedID", { studentId });
    return r.authorized === true;
  },

  async getAuthorizedName(studentId) {
    const r = await this.request("getAuthorizedName", { studentId });
    return r.name || null;
  },

  // ── USERS ───────────────────────────────────────────────────
  async getUser(studentId) {
    const r = await this.request("getUser", { studentId });
    return r.user || null;
  },

  async registerUser(userData) {
    // userData: { id, password, name, telegramUsername }
    const r = await this.request("registerUser", { userData });
    return r;  // { success, message }
  },

  async getAllUsers() {
    const r = await this.request("getAllUsers");
    return r.users || [];
  },

  // ── MARKS ───────────────────────────────────────────────────
  async getStudentMarks(studentId, courseSheetTab) {
    const r = await this.request("getStudentMarks", { studentId, courseSheetTab });
    return r.marks || null;
    // returns: { studentId, name, quiz, mid, assignment, final }
  },

  async getAllMarks(courseSheetTab) {
    const r = await this.request("getAllMarks", { courseSheetTab });
    return r.marks || [];
  },

  async updateMark(studentId, courseSheetTab, markData) {
    // markData: { quiz, mid, assignment, final }
    const r = await this.request("updateMark", { studentId, courseSheetTab, markData });
    return r;
  },

  async addStudentToMarkSheet(courseSheetTab, studentData) {
    const r = await this.request("addStudentToMarkSheet", { courseSheetTab, studentData });
    return r;
  },

  // ── LECTURE NOTES ───────────────────────────────────────────
  async getLectureNotes(courseName) {
    const r = await this.request("getLectureNotes", { courseName });
    return r.notes || [];
    // each: { courseName, topicTitle, resourceURL }
  },

  async getAllNotes() {
    const r = await this.request("getAllNotes");
    return r.notes || [];
  },

  async addLectureNote(note) {
    // note: { courseName, topicTitle, resourceURL }
    const r = await this.request("addLectureNote", { note });
    return r;
  },

  // ── ONLINE TESTS ───────────────────────────────────────────
  async getTestQuestions(courseName) {
    const r = await this.request("getTestQuestions", { courseName });
    return r.questions || [];
    // each: { courseName, questionText, optionA, optionB, optionC, optionD, correctAnswer }
  },

  async addQuestion(question) {
    const r = await this.request("addQuestion", { question });
    return r;
  },

  async deleteQuestion(rowIndex) {
    const r = await this.request("deleteQuestion", { rowIndex });
    return r;
  },

  // ── NOTICES ─────────────────────────────────────────────────
  async getNotices() {
    const r = await this.request("getNotices");
    return r.notices || [];
    // each: { title, body, date, author }
  },

  async addNotice(notice) {
    const r = await this.request("addNotice", { notice });
    return r;
  },

  // ── COMPLAINTS ──────────────────────────────────────────────
  async getComplaints() {
    const r = await this.request("getComplaints");
    return r.complaints || [];
  },

  async addComplaint(complaint) {
    // complaint: { studentId, studentName, courseId, subject, body, currentMark, date, status }
    const r = await this.request("addComplaint", { complaint });
    return r;
  },

  async updateComplaintStatus(rowIndex, status, response) {
    const r = await this.request("updateComplaintStatus", { rowIndex, status, response });
    return r;
  },

  // ── MOCK / OFFLINE fallback ─────────────────────────────────
  // If Apps Script is not yet set up, use localStorage mock data
  MOCK: {
    users: [
      { id: "ETS0001", password: "pass123", name: "Abebe Bekele", telegramUsername: "@abebe" },
    ],
    authorizedIDs: [
      { id: "ETS0001", name: "Abebe Bekele" },
      { id: "ETS0002", name: "Tigist Haile" },
      { id: "ETS0003", name: "Samuel Tesfaye" },
    ],
    marks: {
      "CEng3201": [
        { studentId: "ETS0001", name: "Abebe Bekele",   quiz: 18, mid: 28, assignment: 9, final: 50 },
        { studentId: "ETS0002", name: "Tigist Haile",   quiz: 15, mid: 22, assignment: 8, final: 42 },
        { studentId: "ETS0003", name: "Samuel Tesfaye", quiz: 12, mid: 20, assignment: 7, final: 38 },
      ],
      "CEng2901": [
        { studentId: "ETS0001", name: "Abebe Bekele",   quiz: 17, mid: 25, assignment: 9, final: 45 },
        { studentId: "ETS0002", name: "Tigist Haile",   quiz: 16, mid: 24, assignment: 8, final: 44 },
      ],
    },
    notes: [
      { courseName: "Geometric Design of Road and Streets (CEng 3201)", topicTitle: "Introduction to Road Geometry", resourceURL: "https://drive.google.com/file/example1" },
      { courseName: "Geometric Design of Road and Streets (CEng 3201)", topicTitle: "Horizontal Alignment Design", resourceURL: "https://drive.google.com/file/example2" },
      { courseName: "Transport Planning and Modeling (CEng 2901)", topicTitle: "Transport Demand Modeling", resourceURL: "https://drive.google.com/file/example3" },
    ],
    questions: {
      "CEng3201": [
        { courseName: "CEng3201", questionText: "What is the minimum radius for a horizontal curve at a design speed of 100 km/h?", optionA: "350 m", optionB: "450 m", optionC: "500 m", optionD: "600 m", correctAnswer: "B" },
        { courseName: "CEng3201", questionText: "Which factor does NOT affect stopping sight distance?", optionA: "Design speed", optionB: "Road width", optionC: "Brake reaction time", optionD: "Coefficient of friction", correctAnswer: "B" },
        { courseName: "CEng3201", questionText: "A sag vertical curve is used when:", optionA: "Grade changes from negative to positive", optionB: "Grade changes from positive to negative", optionC: "Road width changes", optionD: "Horizontal curves begin", correctAnswer: "A" },
      ],
      "CEng2901": [
        { courseName: "CEng2901", questionText: "Which model is most commonly used for trip generation?", optionA: "Gravity model", optionB: "Logit model", optionC: "Regression model", optionD: "Wardrop model", correctAnswer: "C" },
        { courseName: "CEng2901", questionText: "The 4-step transportation planning model does NOT include:", optionA: "Trip generation", optionB: "Trip distribution", optionC: "Road construction", optionD: "Modal split", correctAnswer: "C" },
      ],
    },
    notices: [
      { title: "Mid Exam Schedule", body: "Mid-semester examinations will be held from December 10–14. Please check the detailed schedule on the department notice board.", date: "2024-11-28", author: "Dr. Instructor" },
      { title: "Assignment Submission Deadline", body: "All CEng 3201 assignments must be submitted by December 5, 2024. Late submissions will not be accepted.", date: "2024-11-25", author: "Dr. Instructor" },
    ],
    complaints: [],
  },
};

// ── MOCK API LAYER (when Apps Script not configured) ───────
// Auto-detects if the Apps Script URL is still the placeholder
Sheets._useMock = () => CONFIG.APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID");

Sheets.mockGetUser = (studentId) => {
  const u = Sheets.MOCK.users.find(u => u.id === studentId);
  return u || null;
};

Sheets.mockIsAuthorized = (studentId) => {
  return Sheets.MOCK.authorizedIDs.some(a => a.id === studentId);
};

Sheets.mockGetAuthorizedName = (studentId) => {
  const a = Sheets.MOCK.authorizedIDs.find(a => a.id === studentId);
  return a ? a.name : null;
};
