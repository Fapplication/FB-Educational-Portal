# EduPortal – Civil Engineering Student Management System

A fully responsive, dynamic web portal for students and instructors at the Civil Engineering Department.

---

## Features

### Student Portal
- ✅ Register with pre-authorized student ID
- ✅ Secure login / session persistence
- ✅ View marks per course (Quiz, Mid, Assignment, Final)
- ✅ Accept marks or file complaints with written justification
- ✅ Take online multiple-choice tests per course
- ✅ Download / view lecture notes per course
- ✅ AI Study Chatbot (powered by Claude)
- ✅ View instructor notices

### Instructor Portal
- ✅ Secure admin login
- ✅ Dashboard with summary statistics
- ✅ View & edit marks per course (inline editing + save)
- ✅ Add students to course mark sheets
- ✅ Review and respond to student complaints
- ✅ Upload exam questions (MCQ)
- ✅ Upload lecture notes with resource URLs
- ✅ Send/delete notices to students
- ✅ View all registered students

---

## Project Structure

```
student-portal/
├── index.html          ← Main HTML entry point
├── css/
│   └── main.css        ← Full responsive stylesheet
├── js/
│   ├── config.js       ← ⚙️  CONFIGURE THIS FIRST
│   ├── sheets.js       ← Google Sheets API layer
│   ├── auth.js         ← Login & registration logic
│   ├── student.js      ← Student dashboard sections
│   ├── instructor.js   ← Instructor dashboard sections
│   └── app.js          ← App shell, routing, helpers
└── Code.gs             ← Google Apps Script backend
```

---

## Setup Guide

### Step 1 – Set up Google Sheets

Your sheet should have these tabs (they already exist in your description):
- `Authorized_IDs` — columns: `ID`, `Name`
- `Users` — columns: `ID`, `Password`, `Name`, `Telegram_Username`
- `Lecture_Notes` — columns: `Course_Name`, `Topic_Title`, `Resource_URL`
- `Online_Tests` — columns: `Course_Name`, `Question_Text`, `Option_A`, `Option_B`, `Option_C`, `Option_D`, `Correct_Answer`
- `OTP_Verification`, `Bot_Sessions` (existing)
- `Geometric Design of Road and Streets (CEng 3201)` — columns: `StudentID`, `Name`, `Quiz`, `Mid`, `Assignment`, `Final`
- `Transport Planning and Modeling (CEng 2901)` — same columns

**Add two new tabs:**
- `Notices` — columns: `Title`, `Body`, `Date`, `Author`
- `Complaints` — columns: `StudentID`, `StudentName`, `CourseID`, `CourseName`, `Subject`, `Body`, `CurrentMark`, `Date`, `Status`, `Response`

### Step 2 – Deploy Google Apps Script

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Delete any existing code, then paste the entire contents of `Code.gs`
4. Click **Deploy → New Deployment**
5. Type: **Web App**
6. Execute as: **Me**
7. Who has access: **Anyone** (needed for the website to call it)
8. Click **Deploy** → copy the **Web App URL**

### Step 3 – Configure js/config.js

Open `js/config.js` and replace:

```javascript
APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
SPREADSHEET_ID:  "YOUR_SPREADSHEET_ID",
ADMIN_USER:      "admin",        // change to your username
ADMIN_PASS:      "admin123",     // change to a strong password
ADMIN_NAME:      "Dr. Instructor", // your name
```

Your Spreadsheet ID is the long string in your sheet's URL:
`https://docs.google.com/spreadsheets/d/**THIS_PART**/edit`

### Step 4 – Upload to GitHub Pages

1. Create a new GitHub repository (e.g. `edu-portal`)
2. Upload all files maintaining the folder structure:
   ```
   index.html
   css/main.css
   js/config.js
   js/sheets.js
   js/auth.js
   js/student.js
   js/instructor.js
   js/app.js
   ```
   (Do NOT upload `Code.gs` — it goes in Apps Script, not GitHub)
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch** → `main` → `/ (root)`
5. Your site will be at: `https://yourusername.github.io/edu-portal/`

---

## Demo Mode (No Setup Required)

If you haven't set up the Apps Script yet, the site automatically runs in **mock/demo mode** with sample data:
- Student ID: `ETS0001` | Password: `pass123`
- Instructor: username `admin` | password `admin123`

---

## AI Chatbot

The chatbot uses **Claude claude-sonnet-4-20250514** via the Anthropic API. To enable it:
1. The API call is made from the browser — you need to handle CORS appropriately
2. For production, proxy the API call through your Apps Script to keep API keys server-side
3. See the `sendChat()` function in `js/student.js` to configure

---

## Customization

- **Add more courses:** Edit the `COURSES` array in `js/config.js`
- **Change color theme:** Edit CSS variables in `css/main.css` (`:root` block)
- **Change marks columns/weights:** Update `markItem()` in `js/student.js`
- **Change instructor password:** Update `ADMIN_PASS` in `js/config.js`

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no frameworks) |
| Styling | Custom CSS with CSS Variables |
| Database | Google Sheets via Apps Script |
| AI Chatbot | Anthropic Claude API |
| Hosting | GitHub Pages (free) |

---

*Built for the Civil Engineering Department. Responsive on mobile and desktop.*
