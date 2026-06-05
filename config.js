// ============================================================
//  js/config.js  –  EduPortal Configuration
//  ➜ EDIT THIS FILE with your own credentials
// ============================================================

const CONFIG = {

  // ── GOOGLE SHEETS ──────────────────────────────────────────
  // 1. Publish your sheet: File → Share → Publish to web (entire doc, CSV)
  // 2. Deploy as Web App via Apps Script (see README)
  // 3. Paste your deployment URL below

  APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  // ^ Replace YOUR_DEPLOYMENT_ID with your actual Apps Script Web App URL

  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID",
  // ^ The ID in your Google Sheet URL:
  //   https://docs.google.com/spreadsheets/d/THIS_PART/edit

  // ── INSTRUCTOR CREDENTIALS ─────────────────────────────────
  // These should be stored in your Google Sheet → Users tab
  // with a special admin flag. Fallback hardcoded here for demo.
  ADMIN_USER: "admin",
  ADMIN_PASS: "admin123",
  ADMIN_NAME: "Dr. Instructor",

  // ── SHEET TAB NAMES ────────────────────────────────────────
  SHEETS: {
    AUTHORIZED_IDS:   "Authorized_IDs",
    OTP_VERIFICATION: "OTP_Verification",
    USERS:            "Users",
    LECTURE_NOTES:    "Lecture_Notes",
    ONLINE_TESTS:     "Online_Tests",
    BOT_SESSIONS:     "Bot_Sessions",
    NOTICES:          "Notices",              // add this tab to your sheet
    COMPLAINTS:       "Complaints",           // add this tab to your sheet
    COURSE_1:         "Geometric Design of Road and Streets (CEng 3201)",
    COURSE_2:         "Transport Planning and Modeling (CEng 2901)",
  },

  // ── COURSE DEFINITIONS ─────────────────────────────────────
  COURSES: [
    {
      id: "CEng3201",
      code: "CEng 3201",
      name: "Geometric Design of Road and Streets",
      sheetTab: "Geometric Design of Road and Streets (CEng 3201)",
    },
    {
      id: "CEng2901",
      code: "CEng 2901",
      name: "Transport Planning and Modeling",
      sheetTab: "Transport Planning and Modeling (CEng 2901)",
    },
  ],

  // ── APP SETTINGS ───────────────────────────────────────────
  APP_NAME: "EduPortal",
  DEPT_NAME: "Civil Engineering Department",
  VERSION: "1.0.0",
};

// ── SESSION HELPERS ────────────────────────────────────────
const Session = {
  set(key, val) { localStorage.setItem("edu_" + key, JSON.stringify(val)); },
  get(key)      { try { return JSON.parse(localStorage.getItem("edu_" + key)); } catch { return null; } },
  clear()       { Object.keys(localStorage).filter(k=>k.startsWith("edu_")).forEach(k=>localStorage.removeItem(k)); },
  student: {
    set(data) { Session.set("student", data); },
    get()     { return Session.get("student"); },
    clear()   { localStorage.removeItem("edu_student"); },
  },
  instructor: {
    set(data) { Session.set("instructor", data); },
    get()     { return Session.get("instructor"); },
    clear()   { localStorage.removeItem("edu_instructor"); },
  },
};
